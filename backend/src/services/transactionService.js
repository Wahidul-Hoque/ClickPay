// ==============================================
// TRANSACTION SERVICE
// ==============================================
// Design principles applied here:
//  1. Every transaction is first INSERTed as 'initiated', then updated
//     to 'completed' or 'failed' — so every attempt is recorded.
//  2. Every step of the payment lifecycle is logged in transaction_events.
//  3. Wallet rows are locked with FOR UPDATE to prevent race conditions.
//  4. A 30-second duplicate guard rejects identical reattempts.
//  5. getHistory returns ONLY 'completed' transactions.
//  6. cashIn is additionally recorded in external_topups.

import { query, getClient } from '../config/database.js';
import { comparePassword } from '../middleware/auth.js';
import fraudDetectionService from './fraudDetectionService.js';
import { logEvent, recordFailure, verifyUserLimits } from './dbHelpers.js';

// ──────────────────────────────────────────────────────────────────────────────

class TransactionService {

  // ============================================================
  // SEND MONEY  (User/Agent → User/Agent)
  // POST /api/v1/transactions/send
  // ============================================================
  async sendMoney(fromUserId, toPhone, amount, epin) {
    const client = await getClient();
    let transactionId = null;

    try {
      await client.query('BEGIN');

      // ── Step 1: Verify sender ePin ──────────────────────────
      const epinRow = await client.query('SELECT fn_get_epin_hash($1) as epin_hash', [fromUserId]);
      const isValid = await comparePassword(epin, epinRow.rows[0].epin_hash);
      if (!isValid) throw new Error('Invalid ePin');

      // ── Step 2: Lock sender wallet ──────────────────────────
      const senderRes = await client.query(
        `SELECT wallet_id, balance, status, wallet_type
         FROM wallets
         WHERE user_id = $1 AND wallet_type IN ('user','agent')
         FOR UPDATE`,
        [fromUserId]
      );
      if (senderRes.rows.length === 0) throw new Error('Sender wallet not found');
      const senderWallet = senderRes.rows[0];
      if (senderWallet.status !== 'active') throw new Error('Your wallet is not active');

      // ── Step 3: Lock receiver wallet ────────────────────────
      const receiverRes = await client.query(
        `SELECT w.wallet_id, w.status, w.user_id, u.name, w.wallet_type
         FROM wallets w
         JOIN users u ON w.user_id = u.user_id
         WHERE u.phone = $1 AND w.wallet_type IN ('user','agent')
         FOR UPDATE`,
        [toPhone]
      );
      if (receiverRes.rows.length === 0) throw new Error('Receiver not found with this phone number');
      const receiverWallet = receiverRes.rows[0];
      if (receiverWallet.user_id === fromUserId) throw new Error('Cannot send money to yourself');
      if (receiverWallet.status !== 'active') throw new Error('Receiver wallet is not active');

      // ── Step 4: Duplicate guard (same wallets + amount, last 30s) ──
      const dup = await client.query(
        `SELECT fn_is_duplicate_transaction($1, $2, $3) as is_dup`,
        [senderWallet.wallet_id, receiverWallet.wallet_id, amount]
      );
      if (dup.rows[0].is_dup) {
        throw new Error('Duplicate transaction detected — please wait before retrying');
      }

      // ── Step 4.5: Calculate fee ─────────────────────────────
      const favRes = await client.query(
        `SELECT 1 FROM favorites WHERE user_id = $1 AND phone = $2 LIMIT 1`,
        [fromUserId, toPhone]
      );
      
      const settingsRes = await client.query("SELECT setting_value FROM system_settings WHERE setting_key = 'send_money_fee'");
      const defaultFee = settingsRes.rows.length > 0 ? parseFloat(settingsRes.rows[0].setting_value) : 5.00;
      
      const fee = favRes.rows.length > 0 ? 0.00 : defaultFee;
      const totalDeduction = parseFloat(amount) + fee;

      let systemWallet = null;
      if (fee > 0) {
        const sysRes = await client.query(
          "SELECT wallet_id FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'profit' FOR UPDATE"
        );
        if (sysRes.rows.length === 0) throw new Error('System revenue wallet not found');
        systemWallet = sysRes.rows[0];
      }

      // ── Step 5: Balance check ───────────────────────────────
      const currentBalance = parseFloat(senderWallet.balance);
      if (currentBalance < totalDeduction) {
        throw new Error(`Insufficient balance. Available: ৳${currentBalance.toFixed(2)}${fee > 0 ? ` (Required: ৳${totalDeduction.toFixed(2)} incl ৳${fee} fee)` : ''}`);
      }

      // ── Step 5.5: Check Daily & Monthly Limits ────────────────
      if (senderWallet.wallet_type !== 'agent') {
        await verifyUserLimits(client, fromUserId, senderWallet.wallet_id, 'send_money', amount);
      }
      if (receiverWallet.wallet_type !== 'agent') {
        await verifyUserLimits(client, receiverWallet.user_id, receiverWallet.wallet_id, 'receive_money', amount);
      }

      // ── Step 6: Create transaction record (status = 'initiated') ──
      const reference = `TXN-${Date.now()}`;
      const txnRes = await client.query(
        `INSERT INTO transactions
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'transfer', 'initiated', $4)
         RETURNING transaction_id, created_at`,
        [senderWallet.wallet_id, receiverWallet.wallet_id, amount, reference]
      );
      transactionId = txnRes.rows[0].transaction_id;
      const createdAt = txnRes.rows[0].created_at;

      await logEvent(client, transactionId, 'initiated', 'info', `Transfer of ৳${amount} to ${receiverWallet.name} initiated`);
      await logEvent(client, transactionId, 'epin_verified', 'info', 'Sender ePin verified');

      // ── Step 7: Deduct from sender ──────────────────────────
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2',
        [totalDeduction, senderWallet.wallet_id]
      );

      if (fee > 0 && systemWallet) {
        await client.query(
          'UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2',
          [fee, systemWallet.wallet_id]
        );
        await client.query(
          `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
           VALUES ($1, $2, $3, 'system_profit', 'completed', $4)`,
          [senderWallet.wallet_id, systemWallet.wallet_id, fee, `FEE-${reference}`]
        );
      }

      const newBalanceRow = await client.query(
        'SELECT balance FROM wallets WHERE wallet_id = $1',
        [senderWallet.wallet_id]
      );
      const newSenderBalance = parseFloat(newBalanceRow.rows[0].balance);
      await logEvent(client, transactionId, 'amount_deducted', 'info',
        `৳${totalDeduction} deducted from sender${fee > 0 ? ` (incl ৳${fee} fee)` : ''}. Remaining: ৳${newSenderBalance}`);

      // ── Step 8: Credit receiver ─────────────────────────────
      await client.query(
        'UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2',
        [amount, receiverWallet.wallet_id]
      );
      await logEvent(client, transactionId, 'amount_credited', 'info',
        `৳${amount} credited to ${receiverWallet.name}`);

      // ── Step 9: Mark completed ──────────────────────────────
      await client.query(
        `UPDATE transactions SET status = 'completed' WHERE transaction_id = $1`,
        [transactionId]
      );
      await logEvent(client, transactionId, 'completed', 'success',
        `Transfer to ${receiverWallet.name} completed`);

      await client.query('COMMIT');

      // Fire-and-forget fraud detection check (non-blocking)
      fraudDetectionService.checkForRepeatedTransactions(
        senderWallet.wallet_id, receiverWallet.wallet_id, amount, 'transfer'
      ).catch(err => console.error('[FRAUD] Non-blocking check error:', err.message));

      return {
        transaction_id: transactionId,
        reference,
        amount: parseFloat(amount),
        charge: fee,
        to: receiverWallet.name,
        to_phone: toPhone,
        new_balance: newSenderBalance,
        date: createdAt,
      };

    } catch (error) {
      await client.query('ROLLBACK');
      await recordFailure(transactionId, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * MERCHANT SEND MONEY (Merchant → User/Agent)
   * Fee: 1.25% (Debited from Merchant in addition to principal)
   * Total required: amount * 1.0125
   */
  async merchantSendMoney(merchantUserId, toPhone, amount, epin) {
    const client = await getClient();
    let transactionId = null;

    try {
      await client.query('BEGIN');
      console.log(`[TX:${Date.now()}] Merchant transfer start by ${merchantUserId} to ${toPhone}`);

      // 1. Verify ePin
      const epinRows = await client.query('SELECT fn_get_epin_hash($1) as epin_hash', [merchantUserId]);
      if (!(await comparePassword(epin, epinRows.rows[0].epin_hash))) throw new Error('Invalid ePin');
      console.log('[TX] ePin verified');

      // 2. Lock Wallets
      const { rows: merchantWallet } = await client.query(
        "SELECT wallet_id, balance, status FROM wallets WHERE user_id = $1 AND wallet_type = 'merchant' FOR UPDATE",
        [merchantUserId]
      );
      if (merchantWallet.length === 0) throw new Error('Merchant wallet not found');
      if (merchantWallet[0].status !== 'active') throw new Error('Merchant wallet is not active');
      console.log('[TX] Merchant wallet locked');

      const { rows: receiverWallet } = await client.query(
        `SELECT w.wallet_id, w.status, u.user_id, u.name FROM wallets w 
         JOIN users u ON w.user_id = u.user_id 
         WHERE u.phone = $1 AND w.wallet_type IN ('user','agent','merchant') FOR UPDATE`,
        [toPhone]
      );
      if (receiverWallet.length === 0) throw new Error('Receiver not found or inactive');
      if (receiverWallet[0].status !== 'active') throw new Error('Receiver wallet is not active');
      console.log(`[TX] Receiver ${receiverWallet[0].name} locked`);

      // 3. Calculation
      const settingsRes = await client.query("SELECT setting_value FROM system_settings WHERE setting_key = 'merchant_fee'");
      const merchantRate = settingsRes.rows.length > 0 ? parseFloat(settingsRes.rows[0].setting_value) : 0.0125;
      
      const fee = parseFloat((amount * merchantRate).toFixed(2));
      const totalDeduction = amount + fee;
      console.log(`[TX] Amount: ${amount}, Fee: ${fee}, Total: ${totalDeduction}`);

      if (parseFloat(merchantWallet[0].balance) < totalDeduction) {
        throw new Error(`Insufficient funds. Required: ৳${totalDeduction.toFixed(2)} (incl. ${(merchantRate * 100).toFixed(2)}% fee)`);
      }

      // 4. System Wallet
      const { rows: systemWallet } = await client.query(
        "SELECT wallet_id FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'profit' FOR UPDATE"
      );
      if (systemWallet.length === 0) throw new Error('System revenue wallet not found');
      console.log('[TX] System profit wallet locked');

      // 5. Atomic Transfers
      const reference = `MSEN-${Date.now()}`;
      const { rows: txnRes } = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'merchant_transfer', 'initiated', $4) RETURNING transaction_id, created_at`,
        [merchantWallet[0].wallet_id, receiverWallet[0].wallet_id, amount, reference]
      );
      transactionId = txnRes[0].transaction_id;

      // Deduct from merchant (Principal + Fee)
      await client.query('UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2', [totalDeduction, merchantWallet[0].wallet_id]);
      
      // Credit receiver (Principal)
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [amount, receiverWallet[0].wallet_id]);
      
      // Credit system (Fee)
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [fee, systemWallet[0].wallet_id]);

      // Sub-transaction for commission logging
      await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'merchant_commission', 'completed', $4)`,
        [merchantWallet[0].wallet_id, systemWallet[0].wallet_id, fee, `COMM-${reference}`]
      );

      // Finalize
      await client.query("UPDATE transactions SET status = 'completed' WHERE transaction_id = $1", [transactionId]);
      await client.query('COMMIT');
      console.log('[TX] COMMIT successful');

      // Fire-and-forget fraud detection check
      fraudDetectionService.checkForRepeatedTransactions(
        merchantWallet[0].wallet_id, receiverWallet[0].wallet_id, amount, 'merchant_transfer'
      ).catch(err => console.error('[FRAUD] Non-blocking check error:', err.message));

      const { rows: finalBal } = await client.query('SELECT balance FROM wallets WHERE wallet_id = $1', [merchantWallet[0].wallet_id]);

      return {
        transaction_id: transactionId,
        amount,
        fee,
        total_deduction: totalDeduction,
        new_balance: parseFloat(finalBal[0].balance),
        reference,
        to_phone: toPhone
      };

    } catch (error) {
      console.error('[TX] ROLLBACK due to:', error.message);
      await client.query('ROLLBACK');
      if (transactionId) await recordFailure(transactionId, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================
  // CASH IN  (Agent → User wallet)
  // Also recorded in external_topups (payment_method_id = NULL for agent cash-ins)
  // If your DB was already created, run:
  //   ALTER TABLE external_topups ALTER COLUMN payment_method_id DROP NOT NULL;
  // POST /api/v1/transactions/cash-in
  // ============================================================
  async cashIn(agentUserId, userPhone, amount, agentEpin) {
    const client = await getClient();
    let transactionId = null;

    try {
      await client.query('BEGIN');

      // ── Step 1: Verify agent ePin ───────────────────────────
      const epinRow = await client.query('SELECT fn_get_epin_hash($1) as epin_hash', [agentUserId]);
      const isValid = await comparePassword(agentEpin, epinRow.rows[0].epin_hash);
      if (!isValid) throw new Error('Invalid ePin');

      // ── Step 2: Lock agent wallet (must be agent type) ──────
      const agentRes = await client.query(
        `SELECT wallet_id, balance, status
         FROM wallets
         WHERE user_id = $1 AND wallet_type = 'agent'
         FOR UPDATE`,
        [agentUserId]
      );
      if (agentRes.rows.length === 0) throw new Error('Agent wallet not found. Only agents can perform cash-in');
      const agentWallet = agentRes.rows[0];
      if (agentWallet.status !== 'active') throw new Error('Agent wallet is not active');

      // ── Step 3: Lock user wallet ────────────────────────────
      const userRes = await client.query(
        `SELECT w.wallet_id, w.status, w.user_id, u.name
         FROM wallets w
         JOIN users u ON w.user_id = u.user_id
         WHERE u.phone = $1 AND w.wallet_type = 'user'
         FOR UPDATE`,
        [userPhone]
      );
      if (userRes.rows.length === 0) throw new Error('User not found with this phone number');
      const userWallet = userRes.rows[0];
      if (userWallet.status !== 'active') throw new Error('User wallet is not active');
      if (userWallet.user_id === agentUserId) throw new Error('Cannot cash in to yourself');

      // ── Step 4: Duplicate guard ─────────────────────────────
      const dup = await client.query(
        `SELECT fn_is_duplicate_transaction($1, $2, $3) as is_dup`,
        [agentWallet.wallet_id, userWallet.wallet_id, amount]
      );
      if (dup.rows[0].is_dup) {
        throw new Error('Duplicate cash-in detected — please wait before retrying');
      }

      // ── Step 5: Agent balance check ─────────────────────────
      const agentBalance = parseFloat(agentWallet.balance);
      if (agentBalance < parseFloat(amount)) {
        throw new Error(`Insufficient agent balance. Available: ৳${agentBalance.toFixed(2)}`);
      }

      // ── Step 6: Create transaction record (initiated) ───────
      const reference = `CIN-${Date.now()}`;
      const txnRes = await client.query(
        `INSERT INTO transactions
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'cash_in', 'initiated', $4)
         RETURNING transaction_id, created_at`,
        [agentWallet.wallet_id, userWallet.wallet_id, amount, reference]
      );
      transactionId = txnRes.rows[0].transaction_id;
      const createdAt = txnRes.rows[0].created_at;

      await logEvent(client, transactionId, 'initiated', 'info', `Cash-in of ৳${amount} for ${userWallet.name} initiated by agent`);
      await logEvent(client, transactionId, 'epin_verified', 'info', 'Agent ePin verified');

      // ── Step 7 & 8: Perform debit and credit transfers ─────
      await client.query('CALL p_debit_credit_wallets($1, $2, $3)', [agentWallet.wallet_id, userWallet.wallet_id, amount]);
      
      await logEvent(client, transactionId, 'amount_deducted', 'info', `৳${amount} deducted from agent wallet`);
      await logEvent(client, transactionId, 'amount_credited', 'info', `৳${amount} credited to ${userWallet.name}`);

      // ── Step 9: Mark completed ──────────────────────────────
      await client.query(
        `UPDATE transactions SET status = 'completed' WHERE transaction_id = $1`,
        [transactionId]
      );

      // ── Step 10: Record in external_topups ──────────────────
      // payment_method_id is NULL for agent cash-ins (no bank/card involved).
      // Requires: ALTER TABLE external_topups ALTER COLUMN payment_method_id DROP NOT NULL;
      await client.query(
        `INSERT INTO external_topups
           (wallet_id, payment_method_id, transaction_id, amount, provider_reference, status)
         VALUES ($1, NULL, $2, $3, $4, 'completed')`,
        [userWallet.wallet_id, transactionId, amount, reference]
      );
      await logEvent(client, transactionId, 'external_topup_recorded', 'info',
        `Logged in external_topups. Reference: ${reference}`);

      await logEvent(client, transactionId, 'completed', 'success',
        `Cash-in of ৳${amount} completed for ${userWallet.name}`);

      await client.query('COMMIT');

      // Fire-and-forget fraud detection check
      fraudDetectionService.checkForRepeatedTransactions(
        agentWallet.wallet_id, userWallet.wallet_id, amount, 'cash_in'
      ).catch(err => console.error('[FRAUD] Non-blocking check error:', err.message));

      return {
        transaction_id: transactionId,
        reference,
        amount: parseFloat(amount),
        to: userWallet.name,
        to_phone: userPhone,
        date: createdAt,
      };

    } catch (error) {
      await client.query('ROLLBACK');
      await recordFailure(transactionId, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================
  // CASH OUT  (User → Agent, agent earns 1.5% fee)
  // Agent fee is stored in agent_fees table.
  // POST /api/v1/transactions/cash-out
  // ============================================================
  async cashOut(userId, agentPhone, amount, userEpin) {
    const client = await getClient();
    let transactionId = null;

    try {
      await client.query('BEGIN');

      // 1. Verify User ePin
      const epinRow = await client.query('SELECT fn_get_epin_hash($1) as epin_hash', [userId]);
      const isValid = await comparePassword(userEpin, epinRow.rows[0].epin_hash);
      if (!isValid) throw new Error('Invalid ePin');

      // 2. Lock Wallets (User, Agent, and System Profit)
      const userRes = await client.query(
        "SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND status = 'active' FOR UPDATE",
        [userId]
      );
      if (userRes.rows.length === 0) throw new Error('User wallet not found or inactive');
      const userWallet = userRes.rows[0];

      const agentRes = await client.query(
        `SELECT w.wallet_id, u.name FROM wallets w 
         JOIN users u ON w.user_id = u.user_id 
         WHERE u.phone = $1 AND w.wallet_type = 'agent' AND w.status = 'active' FOR UPDATE`,
        [agentPhone]
      );
      if (agentRes.rows.length === 0) throw new Error('Agent not found or inactive');
      const agentWallet = agentRes.rows[0];

      const systemRes = await client.query(
        "SELECT wallet_id FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'profit' FOR UPDATE"
      );
      if (systemRes.rows.length === 0) throw new Error('System profit wallet not found');
      const systemWallet = systemRes.rows[0];

      // 3. Fee Math
      const sysProfitRes = await client.query("SELECT fn_get_system_setting('cashout_system_fee', 0.01) as rate");
      const agentCommRes = await client.query("SELECT fn_get_system_setting('cashout_agent_fee', 0.005) as rate");
      
      const systemProfitRate = parseFloat(sysProfitRes.rows[0].rate);
      const agentCommRate = parseFloat(agentCommRes.rows[0].rate);

      const systemProfit = parseFloat((amount * systemProfitRate).toFixed(2));
      const agentCommission = parseFloat((amount * agentCommRate).toFixed(2));
      const totalFee = systemProfit + agentCommission;
      const totalDeduction = amount + totalFee;

      if (parseFloat(userWallet.balance) < totalDeduction) {
        throw new Error(`Insufficient balance. Required: ৳${totalDeduction.toFixed(2)} (incl. ${((systemProfitRate + agentCommRate) * 100).toFixed(2)}% fee)`);
      }

      // 4. Initiate Transaction Record
      const reference = `COUT-${Date.now()}`;
      const txnRes = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'cash_out', 'initiated', $4) RETURNING transaction_id, created_at`,
        [userWallet.wallet_id, agentWallet.wallet_id, amount, reference]
      );
      transactionId = txnRes.rows[0].transaction_id;

      // 5. Log Initial Events
      await logEvent(client, transactionId, 'initiated', 'info', `Cashout of ৳${amount} via agent ${agentPhone} started`);
      await logEvent(client, transactionId, 'epin_verified', 'info', 'User ePin verified successfully');

      // 6. Execute Balance Transfers
      // A. Deduct total from User
      await client.query('UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2', [totalDeduction, userWallet.wallet_id]);
      await logEvent(client, transactionId, 'amount_deducted', 'info', `৳${totalDeduction} (৳${amount} + ৳${totalFee} fee) deducted from user`);

      // B. Credit Agent (Principal + 0.5%)
      const agentTotal = amount + agentCommission;
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [agentTotal, agentWallet.wallet_id]);
      await logEvent(client, transactionId, 'amount_credited', 'info', `৳${agentTotal} credited to agent (includes ${(agentCommRate * 100).toFixed(2)}% commission)`);

      // C. Credit System Profit (1%)
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [systemProfit, systemWallet.wallet_id]);
      await logEvent(client, transactionId, 'profit_distributed', 'info', `৳${systemProfit} system profit recorded`);

      // 7. Finalize
      const agentFeeTxn = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING transaction_id`,
        [userWallet.wallet_id, agentWallet.wallet_id, agentCommission, 'agent_fee', 'completed', `${reference}-AFEE`]
      );
      const agentFeeTransactionId = agentFeeTxn.rows[0].transaction_id;

      // 8. Insert into Agent Fees table
      await client.query(
        `INSERT INTO agent_fees (cashout_transaction_id, agent_wallet_id, fee_amount, payout_transaction_id) 
         VALUES ($1, $2, $3, $4)`, 
        [transactionId, agentWallet.wallet_id, agentCommission, agentFeeTransactionId]
      );

      // 9. Record System Profit Transaction
      await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userWallet.wallet_id, systemWallet.wallet_id, systemProfit, 'system_profit', 'completed', `${reference}-PROF`]
      );

      // 10. Mark Main Transaction as Completed
      await client.query("UPDATE transactions SET status = 'completed' WHERE transaction_id = $1", [transactionId]);
      await logEvent(client, transactionId, 'completed', 'success', `Cashout successful`);

      await client.query('COMMIT');

      // Fire-and-forget fraud detection check
      fraudDetectionService.checkForRepeatedTransactions(
        userWallet.wallet_id, agentWallet.wallet_id, amount, 'cash_out'
      ).catch(err => console.error('[FRAUD] Non-blocking check error:', err.message));

      return {
        transaction_id: transactionId,
        reference,
        amount,
        fee: totalFee,
        agent: agentWallet.name,
        date: txnRes.rows[0].created_at
      };

    } catch (error) {
      await client.query('ROLLBACK');
      // Only attempt failure record if transactionId was actually created
      if (transactionId) {
        await recordFailure(transactionId, error.message);
      }
      throw error;
    } finally {
      client.release();
    }
  }


  // ============================================================
  // GET TRANSACTION HISTORY  (completed only, excludes internal fee rows)
  // GET /api/v1/transactions/history?page=1&limit=10
  // ============================================================
  async getHistory(userId, page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    const { startDate, endDate, type, direction } = filters;

    let whereClause = `WHERE (w_from.user_id = $1 OR w_to.user_id = $1) AND t.status = 'completed' AND t.transaction_type NOT IN ('agent_fee', 'system_profit')`;
    const dataParams = [userId];

    if (startDate) {
      dataParams.push(startDate);
      whereClause += ` AND t.created_at >= $${dataParams.length}`;
    }
    if (endDate) {
      dataParams.push(endDate);
      whereClause += ` AND t.created_at <= $${dataParams.length}`;
    }
    if (type && type !== 'all') {
      dataParams.push(type);
      whereClause += ` AND t.transaction_type = $${dataParams.length}`;
    }
    if (direction) {
      if (direction === 'debit') {
        whereClause += ` AND w_from.user_id = $1`;
      } else if (direction === 'credit') {
        whereClause += ` AND w_to.user_id = $1`;
      }
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM transactions t
      LEFT JOIN wallets w_from ON t.from_wallet_id = w_from.wallet_id
      LEFT JOIN wallets w_to   ON t.to_wallet_id   = w_to.wallet_id
      ${whereClause}
    `;

    const countRow = await query(countQuery, dataParams);
    const total = parseInt(countRow.rows[0].total);

    // Add limit/offset params
    dataParams.push(limit);
    const limitIdx = dataParams.length;
    dataParams.push(offset);
    const offsetIdx = dataParams.length;

    const dataQueryStr = `
      SELECT
         t.transaction_id,
         t.amount,
         t.transaction_type,
         t.status,
         t.reference,
         t.created_at,
         u_from.name  AS from_name,
         u_from.phone AS from_phone,
         u_to.name    AS to_name,
         u_to.phone   AS to_phone,
         CASE WHEN w_from.user_id = $1 THEN 'debit' ELSE 'credit' END AS direction
       FROM transactions t
       LEFT JOIN wallets w_from ON t.from_wallet_id = w_from.wallet_id
       LEFT JOIN wallets w_to   ON t.to_wallet_id   = w_to.wallet_id
       LEFT JOIN users   u_from ON w_from.user_id   = u_from.user_id
       LEFT JOIN users   u_to   ON w_to.user_id     = u_to.user_id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const rows = await query(dataQueryStr, dataParams);

    return {
      transactions: rows.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================
  // GET TRANSACTION DETAILS  (user must be a party to it)
  // Also returns full event lifecycle log
  // GET /api/v1/transactions/:id
  // ============================================================
  async getTransactionDetails(transactionId, userId) {
    const txnRes = await query(
      `SELECT
         t.transaction_id,
         t.amount,
         t.transaction_type,
         t.status,
         t.reference,
         t.created_at,
         u_from.name  AS from_name,
         u_from.phone AS from_phone,
         u_to.name    AS to_name,
         u_to.phone   AS to_phone
       FROM transactions t
       LEFT JOIN wallets w_from ON t.from_wallet_id = w_from.wallet_id
       LEFT JOIN wallets w_to   ON t.to_wallet_id   = w_to.wallet_id
       LEFT JOIN users   u_from ON w_from.user_id   = u_from.user_id
       LEFT JOIN users   u_to   ON w_to.user_id     = u_to.user_id
       WHERE t.transaction_id = $1
         AND (w_from.user_id = $2 OR w_to.user_id = $2)`,
      [transactionId, userId]
    );

    if (txnRes.rows.length === 0) {
      throw new Error('Transaction not found or access denied');
    }

    // Full lifecycle log
    const eventsRes = await query(
      `SELECT event_type, event_status, details, created_at
       FROM transaction_events
       WHERE transaction_id = $1
       ORDER BY created_at ASC`,
      [transactionId]
    );

    return {
      ...txnRes.rows[0],
      events: eventsRes.rows,
    };
  }

  // ============================================================
  // REQUEST MONEY  (Requester asks Requestee to pay)
  // POST /api/v1/transactions/request
  // ============================================================
  async requestMoney(requesterUserId, recipientPhone, amount, message) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const requesterWalletRes = await client.query(
        `SELECT wallet_id FROM wallets
         WHERE user_id = $1 AND wallet_type IN ('user','agent')
         FOR UPDATE`,
        [requesterUserId]
      );
      if (requesterWalletRes.rows.length === 0) throw new Error('Your wallet not found');
      const requesterWalletId = requesterWalletRes.rows[0].wallet_id;

      const requesteeRes = await client.query(
        `SELECT u.user_id, u.name, w.wallet_id
         FROM users u
         JOIN wallets w ON u.user_id = w.user_id
         WHERE u.phone = $1 AND w.wallet_type IN ('user','agent')`,
        [recipientPhone]
      );
      if (requesteeRes.rows.length === 0) throw new Error('Recipient not found with this phone number');
      const requestee = requesteeRes.rows[0];
      if (requestee.user_id === requesterUserId) throw new Error('Cannot request money from yourself');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const insertRes = await client.query(
        `INSERT INTO money_requests
           (requester_user_id, requester_wallet_id, requestee_user_id, requestee_wallet_id,
            amount, message, expires_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'requested')
         RETURNING *`,
        [requesterUserId, requesterWalletId, requestee.user_id, requestee.wallet_id,
          amount, message || null, expiresAt]
      );
      const reqPhone = await client.query('SELECT phone FROM users WHERE user_id = $1', [requesterUserId]);
      await client.query(`CALL p_send_notification($1, $2)`, [requestee.user_id, `You have a new money request from ${reqPhone.rows[0].phone} for ৳${amount}`]);

      await client.query('COMMIT');

      return {
        ...insertRes.rows[0],
        requestee_name: requestee.name,
        requestee_phone: recipientPhone,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================
  // GET INCOMING REQUESTS  (requests where I am the payer)
  // GET /api/v1/transactions/requests/incoming
  // ============================================================
  async getIncomingRequests(userId) {
    const result = await query(
      `SELECT
         mr.*,
         u.name  AS requester_name,
         u.phone AS requester_phone
       FROM money_requests mr
       JOIN users u ON mr.requester_user_id = u.user_id
       WHERE mr.requestee_user_id = $1
         AND mr.status = 'requested'
       ORDER BY mr.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // ============================================================
  // GET SENT REQUESTS  (requests I created)
  // GET /api/v1/transactions/requests/sent
  // ============================================================
  async getSentRequests(userId) {
    const result = await query(
      `SELECT
         mr.*,
         u.name  AS requestee_name,
         u.phone AS requestee_phone
       FROM money_requests mr
       JOIN users u ON mr.requestee_user_id = u.user_id
       WHERE mr.requester_user_id = $1
       ORDER BY mr.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // ============================================================
  // APPROVE / PAY A MONEY REQUEST
  // POST /api/v1/transactions/requests/:requestId/pay
  // ============================================================
  async approveRequest(requestId, payerUserId, epin) {
    const client = await getClient();
    let transactionId = null;

    try {
      await client.query('BEGIN');

      // ── Step 1: Fetch & lock the money request ──────────────
      const reqRes = await client.query(
        'SELECT * FROM money_requests WHERE request_id = $1 FOR UPDATE',
        [requestId]
      );
      if (reqRes.rows.length === 0) throw new Error('Money request not found');
      const moneyRequest = reqRes.rows[0];

      if (moneyRequest.requestee_user_id !== payerUserId) {
        throw new Error('You are not authorised to pay this request');
      }
      if (moneyRequest.status !== 'requested') {
        throw new Error(`Request is already ${moneyRequest.status}`);
      }
      if (moneyRequest.expires_at && new Date(moneyRequest.expires_at) < new Date()) {
        throw new Error('This money request has expired');
      }

      // ── Step 2: Verify ePin ─────────────────────────────────
      const epinRow = await client.query('SELECT fn_get_epin_hash($1) as epin_hash', [payerUserId]);
      const isValid = await comparePassword(epin, epinRow.rows[0].epin_hash);
      if (!isValid) throw new Error('Invalid ePin');

      // ── Step 3: Lock payer wallet & check balance ───────────
      const payerWalletRes = await client.query(
        `SELECT wallet_id, balance, status FROM wallets
         WHERE wallet_id = $1 FOR UPDATE`,
        [moneyRequest.requestee_wallet_id]
      );
      if (payerWalletRes.rows.length === 0) throw new Error('Payer wallet not found');
      const payerWallet = payerWalletRes.rows[0];
      const requestAmount = parseFloat(moneyRequest.amount);

      if (payerWallet.status !== 'active') throw new Error('Your wallet is not active');
      if (parseFloat(payerWallet.balance) < requestAmount) {
        throw new Error(`Insufficient balance. Available: ৳${parseFloat(payerWallet.balance).toFixed(2)}`);
      }

      // ── Step 4: Create transaction record (initiated) ───────
      const reference = `REQ-${Date.now()}`;
      const txnRes = await client.query(
        `INSERT INTO transactions
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'request_payment', 'initiated', $4)
         RETURNING transaction_id, created_at`,
        [moneyRequest.requestee_wallet_id, moneyRequest.requester_wallet_id, requestAmount, reference]
      );
      transactionId = txnRes.rows[0].transaction_id;
      const createdAt = txnRes.rows[0].created_at;

      await logEvent(client, transactionId, 'initiated', 'info', `Payment for request #${requestId} of ৳${requestAmount} initiated`);
      await logEvent(client, transactionId, 'epin_verified', 'info', 'Payer ePin verified');

      // ── Step 5 & 6: Perform debit and credit transfers ─────
      await client.query('CALL p_debit_credit_wallets($1, $2, $3)', 
        [moneyRequest.requestee_wallet_id, moneyRequest.requester_wallet_id, requestAmount]);
        
      await logEvent(client, transactionId, 'amount_deducted', 'info', `৳${requestAmount} deducted from payer`);
      await logEvent(client, transactionId, 'amount_credited', 'info', `৳${requestAmount} credited to requester`);

      // ── Step 7: Mark request as paid ───────────────────────
      await client.query(
        `UPDATE money_requests
         SET status = 'paid', paid_transaction_id = $1
         WHERE request_id = $2`,
        [transactionId, requestId]
      );

      // ── Step 8: Mark transaction completed ──────────────────
      await client.query(
        `UPDATE transactions SET status = 'completed' WHERE transaction_id = $1`,
        [transactionId]
      );
      await logEvent(client, transactionId, 'completed', 'success',
        `Request #${requestId} paid successfully`);

      await client.query('COMMIT');

      return {
        transaction_id: transactionId,
        reference,
        amount: requestAmount,
        request_id: requestId,
        date: createdAt,
      };

    } catch (error) {
      await client.query('ROLLBACK');
      await recordFailure(transactionId, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================
  // UPDATE REQUEST STATUS  (decline or cancel — with ownership check)
  // PATCH /api/v1/transactions/requests/:requestId/status
  // ============================================================
  async updateRequestStatus(requestId, userId, status) {
    // 'declined' → only the requestee (payer) can do it
    // 'cancelled' → only the requester (creator) can do it
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const updateRes = await client.query(
        `UPDATE money_requests
         SET status = $1
         WHERE request_id = $2
           AND status = 'requested'
           AND (
             ($1 = 'declined'  AND requestee_user_id = $3) OR
             ($1 = 'cancelled' AND requester_user_id = $3)
           )
         RETURNING *`,
        [status, requestId, userId]
      );

      if (updateRes.rows.length === 0) {
        throw new Error(
          'Request not found, already resolved, or you are not authorised to perform this action'
        );
      }

      await client.query('COMMIT');
      return updateRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // REVERSE TRANSACTION (Admin Only)
  async reverseTransaction(transactionId , adminUserId) {
    const client = await getClient();
    let reversalTxnId = null;

    try {
      await client.query('BEGIN');

      // 1. Fetch original transaction
      const txnRes = await client.query(
        `SELECT * FROM transactions WHERE transaction_id = $1 AND status = 'completed'`,
        [transactionId]
      );
      if (txnRes.rows.length === 0) throw new Error('Original completed transaction not found');
      const originalTxn = txnRes.rows[0];

            const refCheck = await client.query(
        `SELECT 1 FROM transactions WHERE reference = $1`,
        [`REV-${originalTxn.reference}`]
      );
      if (refCheck.rows.length > 0) {
        throw new Error('A reversal record already exists for this transaction');
      }

      const reversibleTypes = ['transfer', 'request_payment'];
      if (!reversibleTypes.includes(originalTxn.transaction_type)) {
        throw new Error('Only standard peer-to-peer transfers or paid money requests can be reversed');
      }

      // 2. Lock wallets (Original Receiver becomes Sender, Original Sender becomes Receiver)
      const receiverWalletRes = await client.query(
        `SELECT wallet_id, user_id, balance, status FROM wallets WHERE wallet_id = $1 FOR UPDATE`,
        [originalTxn.to_wallet_id]
      );
      const senderWalletRes = await client.query(
        `SELECT wallet_id, user_id, balance, status FROM wallets WHERE wallet_id = $1 FOR UPDATE`,
        [originalTxn.from_wallet_id]
      );

      const receiverWallet = receiverWalletRes.rows[0];
      const senderWallet = senderWalletRes.rows[0];

      if (parseFloat(receiverWallet.balance) < parseFloat(originalTxn.amount)) {
        throw new Error('Receiver has insufficient balance to reverse this transaction');
      }

      // 3. Create reversal transaction record
      const reference = `REV-${originalTxn.reference}`;
      const revRes = await client.query(
        `INSERT INTO transactions 
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'reversal', 'initiated', $4)
         RETURNING transaction_id`,
        [receiverWallet.wallet_id, senderWallet.wallet_id, originalTxn.amount, reference]
      );
      reversalTxnId = revRes.rows[0].transaction_id;

      // 4. Update Balances
      await client.query('CALL p_debit_credit_wallets($1, $2, $3)', 
        [receiverWallet.wallet_id, senderWallet.wallet_id, originalTxn.amount]);

      const senderNumberRes = await client.query(`select phone from users where user_id = $1`, [senderWallet.user_id]);
      const receiverNumberRes = await client.query(`select phone from users where user_id = $1`, [receiverWallet.user_id]);

      const senderPhone = senderNumberRes.rows[0].phone;
      const receiverPhone = receiverNumberRes.rows[0].phone;




      // 5. Finalize
      await client.query(
        `UPDATE transactions SET status = 'completed' WHERE transaction_id = $1`,
        [reversalTxnId]
      );
      
      await client.query('update transactions set status = $1, transaction_type = $2 where transaction_id = $3', ['reversed', 'reversal', transactionId]);

      await client.query(`CALL p_log_admin_activity($1, $2, $3, $4)`, [adminUserId, 'reverse_transaction', transactionId, `Transaction reversed by Admin id ${adminUserId}. Amount: ৳${originalTxn.amount} reversed From: ${senderPhone}, To: ${receiverPhone}`]);

      // Update original transaction to link reversal
      await logEvent(client, originalTxn.transaction_id, 'reversed', 'info', `Transaction reversed by Admin. Reversal ID: ${reversalTxnId}`);
      await logEvent(client, reversalTxnId, 'completed', 'success', `Reversal of txn #${originalTxn.transaction_id} completed`);
      
      // Notifications are now handled automatically by trg_notify_on_reversal


      await client.query('COMMIT');
      return { success: true, reversal_id: reversalTxnId, amount: originalTxn.amount };

    } catch (error) {
      await client.query('ROLLBACK');
      if (reversalTxnId) await recordFailure(reversalTxnId, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async getLimits(userId) {
    const client = await getClient();
    try {
      const walletRes = await client.query('SELECT wallet_id FROM wallets WHERE user_id = $1 AND wallet_type = $2', [userId, 'user']);
      if (walletRes.rows.length === 0) throw new Error('User wallet not found');
      const walletId = walletRes.rows[0].wallet_id;

      // Fetch dynamic limits from settings or defaults
      const limitsRes = await client.query(`
        SELECT 
          COALESCE((SELECT setting_value FROM system_settings WHERE setting_key = 'daily_send_money_limit'), '25000') as ds,
          COALESCE((SELECT setting_value FROM system_settings WHERE setting_key = 'monthly_send_money_limit'), '100000') as ms,
          COALESCE((SELECT setting_value FROM system_settings WHERE setting_key = 'daily_receive_money_limit'), '50000') as dr,
          COALESCE((SELECT setting_value FROM system_settings WHERE setting_key = 'monthly_receive_money_limit'), '200000') as mr,
          COALESCE((SELECT setting_value FROM system_settings WHERE setting_key = 'daily_mobile_recharge_limit'), '10000') as dm,
          COALESCE((SELECT setting_value FROM system_settings WHERE setting_key = 'monthly_mobile_recharge_limit'), '50000') as mm
      `);
      
      const lim = limitsRes.rows[0];

      // Fetch spent
      const spentRes = await client.query(`
        SELECT
          -- Send Money
          COALESCE(SUM(amount) FILTER (WHERE from_wallet_id = $1 AND transaction_type = 'transfer' AND created_at >= CURRENT_DATE), 0) as ds_spent,
          COALESCE(SUM(amount) FILTER (WHERE from_wallet_id = $1 AND transaction_type = 'transfer' AND created_at >= date_trunc('month', CURRENT_DATE)), 0) as ms_spent,
          -- Receive Money
          COALESCE(SUM(amount) FILTER (WHERE to_wallet_id = $1 AND transaction_type = 'transfer' AND created_at >= CURRENT_DATE), 0) as dr_spent,
          COALESCE(SUM(amount) FILTER (WHERE to_wallet_id = $1 AND transaction_type = 'transfer' AND created_at >= date_trunc('month', CURRENT_DATE)), 0) as mr_spent
        FROM transactions WHERE status = 'completed'
      `, [walletId]);

      const billRes = await client.query(`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE), 0) as dm_spent,
          COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0) as mm_spent
        FROM bill_payments WHERE wallet_id = $1 AND provider_reference LIKE 'MOBILE-%' AND status = 'completed'
      `, [walletId]);

      const t = spentRes.rows[0];
      const b = billRes.rows[0];

      return {
        daily: {
          sendMoney: { spent: parseFloat(t.ds_spent), limit: parseFloat(lim.ds) },
          receiveMoney: { spent: parseFloat(t.dr_spent), limit: parseFloat(lim.dr) },
          mobileRecharge: { spent: parseFloat(b.dm_spent), limit: parseFloat(lim.dm) }
        },
        monthly: {
          sendMoney: { spent: parseFloat(t.ms_spent), limit: parseFloat(lim.ms) },
          receiveMoney: { spent: parseFloat(t.mr_spent), limit: parseFloat(lim.mr) },
          mobileRecharge: { spent: parseFloat(b.mm_spent), limit: parseFloat(lim.mm) }
        }
      };
    } finally {
      client.release();
    }
  }

}

export default new TransactionService();
