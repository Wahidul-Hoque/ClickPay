// ==============================================
// TRANSACTION SERVICE (The Kitchen - Business Logic)
// ==============================================
// This file contains all transaction-related database operations
// All SQL queries for transactions are written here

import { query, getClient } from '../config/database.js';
import { comparePassword } from '../middleware/auth.js';

class TransactionService {
  // ==============================================
  // SEND MONEY
  // ==============================================
  // Transfers money from one wallet to another
  async sendMoney(fromUserId, toPhone, amount, epin) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // STEP 1: Verify sender's ePin
      const epinResult = await client.query(
        'SELECT epin_hash FROM users WHERE user_id = $1',
        [fromUserId]
      );
      if (epinResult.rows.length === 0) throw new Error('User not found');

      const isValidEpin = await comparePassword(epin, epinResult.rows[0].epin_hash);
      if (!isValidEpin) throw new Error('Invalid ePin');

      // STEP 2: Get sender's wallet
      const senderWalletResult = await client.query(
        `SELECT wallet_id, balance, status, user_id
         FROM wallets
         WHERE user_id = $1 AND wallet_type IN ('user', 'agent')`,
        [fromUserId]
      );
      if (senderWalletResult.rows.length === 0) throw new Error('Sender wallet not found');

      const senderWallet = senderWalletResult.rows[0];
      if (senderWallet.status !== 'active') throw new Error('Your wallet is not active');

      const currentBalance = parseFloat(senderWallet.balance);
      if (currentBalance < parseFloat(amount)) {
        throw new Error(`Insufficient balance. You have ৳${currentBalance.toFixed(2)}`);
      }

      // STEP 3: Get receiver's wallet
      const receiverWalletResult = await client.query(
        `SELECT w.wallet_id, w.status, u.name, u.user_id
         FROM wallets w
         JOIN users u ON w.user_id = u.user_id
         WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent')`,
        [toPhone]
      );
      if (receiverWalletResult.rows.length === 0) {
        throw new Error('Receiver not found with this phone number');
      }

      const receiverWallet = receiverWalletResult.rows[0];
      if (receiverWallet.user_id === fromUserId) throw new Error('Cannot send money to yourself');
      if (receiverWallet.status !== 'active') throw new Error('Receiver wallet is not active');

      // STEP 4: Create transaction record
      const reference = `TXN-${Date.now()}`;
      const transactionResult = await client.query(
        `INSERT INTO transactions
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING transaction_id, created_at`,
        [senderWallet.wallet_id, receiverWallet.wallet_id, amount, 'transfer', 'completed', reference]
      );
      const transaction = transactionResult.rows[0];

      // STEP 5: Deduct from sender
      const deductResult = await client.query(
        `UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2 RETURNING balance`,
        [amount, senderWallet.wallet_id]
      );
      const newSenderBalance = parseFloat(deductResult.rows[0].balance);

      // STEP 6: Add to receiver
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`,
        [amount, receiverWallet.wallet_id]
      );

      // STEP 7: Log event
      await client.query(
        `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
         VALUES ($1, $2, $3, $4)`,
        [transaction.transaction_id, 'transfer_completed', 'success', `Money sent to ${receiverWallet.name}`]
      );

      await client.query('COMMIT');

      return {
        transaction_id: transaction.transaction_id,
        reference,
        amount: parseFloat(amount),
        to: receiverWallet.name,
        to_phone: toPhone,
        new_balance: newSenderBalance,
        date: transaction.created_at
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==============================================
  // GET TRANSACTION HISTORY
  // ==============================================
  async getHistory(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const historyQuery = `
        SELECT
          t.transaction_id,
          t.amount,
          t.transaction_type,
          t.status,
          t.reference,
          t.created_at,
          sender_user.name  AS sender_name,
          sender_user.phone AS sender_phone,
          receiver_user.name  AS receiver_name,
          receiver_user.phone AS receiver_phone,
          CASE
            WHEN sender_wallet.user_id = $1 THEN 'debit'
            ELSE 'credit'
          END AS transaction_direction
        FROM transactions t
        JOIN wallets sender_wallet   ON t.from_wallet_id = sender_wallet.wallet_id
        JOIN wallets receiver_wallet ON t.to_wallet_id   = receiver_wallet.wallet_id
        JOIN users sender_user   ON sender_wallet.user_id   = sender_user.user_id
        JOIN users receiver_user ON receiver_wallet.user_id = receiver_user.user_id
        WHERE sender_wallet.user_id = $1 OR receiver_wallet.user_id = $1
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await query(historyQuery, [userId, limit, offset]);

      const countResult = await query(
        `SELECT COUNT(*) AS total
         FROM transactions t
         JOIN wallets sender_wallet   ON t.from_wallet_id = sender_wallet.wallet_id
         JOIN wallets receiver_wallet ON t.to_wallet_id   = receiver_wallet.wallet_id
         WHERE sender_wallet.user_id = $1 OR receiver_wallet.user_id = $1`,
        [userId]
      );
      const total = parseInt(countResult.rows[0].total);

      return {
        transactions: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // GET TRANSACTION DETAILS
  // ==============================================
  // Get full details of a single transaction (must be a party to it)
  async getTransactionDetails(transactionId, userId) {
    try {
      const result = await query(
        `SELECT
           t.transaction_id,
           t.amount,
           t.transaction_type,
           t.status,
           t.reference,
           t.created_at,
           sender_user.name  AS sender_name,
           sender_user.phone AS sender_phone,
           receiver_user.name  AS receiver_name,
           receiver_user.phone AS receiver_phone,
           CASE
             WHEN sender_wallet.user_id = $2 THEN 'debit'
             ELSE 'credit'
           END AS transaction_direction
         FROM transactions t
         JOIN wallets sender_wallet   ON t.from_wallet_id = sender_wallet.wallet_id
         JOIN wallets receiver_wallet ON t.to_wallet_id   = receiver_wallet.wallet_id
         JOIN users sender_user   ON sender_wallet.user_id   = sender_user.user_id
         JOIN users receiver_user ON receiver_wallet.user_id = receiver_user.user_id
         WHERE t.transaction_id = $1
           AND (sender_wallet.user_id = $2 OR receiver_wallet.user_id = $2)`,
        [transactionId, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Transaction not found or access denied');
      }

      // Also fetch events
      const eventsResult = await query(
        `SELECT event_id, event_type, event_status, details, created_at
         FROM transaction_events
         WHERE transaction_id = $1
         ORDER BY created_at ASC`,
        [transactionId]
      );

      return {
        ...result.rows[0],
        events: eventsResult.rows
      };
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // REQUEST MONEY
  // ==============================================
  // Requester asks a recipient (by phone) to pay them
  async requestMoney(requesterUserId, recipientPhone, amount, message) {
    try {
      // Get requester wallet
      const requesterWalletResult = await query(
        `SELECT wallet_id FROM wallets
         WHERE user_id = $1 AND wallet_type IN ('user', 'agent')`,
        [requesterUserId]
      );
      if (requesterWalletResult.rows.length === 0) throw new Error('Your wallet not found');

      const requesterWalletId = requesterWalletResult.rows[0].wallet_id;

      // Get requestee (recipient) by phone
      const requesteeResult = await query(
        `SELECT u.user_id, u.name, w.wallet_id
         FROM users u
         JOIN wallets w ON u.user_id = w.user_id
         WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent')`,
        [recipientPhone]
      );
      if (requesteeResult.rows.length === 0) {
        throw new Error('Recipient not found with this phone number');
      }

      const requestee = requesteeResult.rows[0];
      if (requestee.user_id === requesterUserId) {
        throw new Error('Cannot request money from yourself');
      }

      // Set expiry 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const insertResult = await query(
        `INSERT INTO money_requests
           (requester_user_id, requester_wallet_id,
            requestee_user_id, requestee_wallet_id,
            amount, message, expires_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'requested')
         RETURNING *`,
        [
          requesterUserId,
          requesterWalletId,
          requestee.user_id,
          requestee.wallet_id,
          amount,
          message || null,
          expiresAt
        ]
      );

      return {
        ...insertResult.rows[0],
        requestee_name: requestee.name,
        requestee_phone: recipientPhone
      };
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // GET INCOMING REQUESTS
  // ==============================================
  // Requests where the current user is the PAYER (requestee_user_id = userId)
  async getIncomingRequests(userId) {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // GET SENT REQUESTS
  // ==============================================
  // Requests the current user created (requester_user_id = userId)
  async getSentRequests(userId) {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // APPROVE / PAY A REQUEST
  // ==============================================
  // The requestee (payer) pays the pending request
  async approveRequest(requestId, payerUserId, epin) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // STEP 1: Fetch the request
      const reqResult = await client.query(
        `SELECT * FROM money_requests WHERE request_id = $1 FOR UPDATE`,
        [requestId]
      );
      if (reqResult.rows.length === 0) throw new Error('Money request not found');

      const moneyRequest = reqResult.rows[0];

      // STEP 2: Validate the payer is the correct requestee
      if (moneyRequest.requestee_user_id !== payerUserId) {
        throw new Error('You are not authorised to pay this request');
      }
      if (moneyRequest.status !== 'requested') {
        throw new Error(`Request is already ${moneyRequest.status}`);
      }
      if (moneyRequest.expires_at && new Date(moneyRequest.expires_at) < new Date()) {
        throw new Error('This money request has expired');
      }

      // STEP 3: Verify ePin
      const epinResult = await client.query(
        'SELECT epin_hash FROM users WHERE user_id = $1',
        [payerUserId]
      );
      const isValidEpin = await comparePassword(epin, epinResult.rows[0].epin_hash);
      if (!isValidEpin) throw new Error('Invalid ePin');

      // STEP 4: Get payer wallet and check balance
      const payerWalletResult = await client.query(
        `SELECT wallet_id, balance, status FROM wallets
         WHERE wallet_id = $1 FOR UPDATE`,
        [moneyRequest.requestee_wallet_id]
      );
      if (payerWalletResult.rows.length === 0) throw new Error('Payer wallet not found');

      const payerWallet = payerWalletResult.rows[0];
      if (payerWallet.status !== 'active') throw new Error('Your wallet is not active');

      const payerBalance = parseFloat(payerWallet.balance);
      const requestAmount = parseFloat(moneyRequest.amount);
      if (payerBalance < requestAmount) {
        throw new Error(`Insufficient balance. You have ৳${payerBalance.toFixed(2)}`);
      }

      // STEP 5: Create the actual transaction
      const reference = `REQ-${Date.now()}`;
      const txnResult = await client.query(
        `INSERT INTO transactions
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'request_payment', 'completed', $4)
         RETURNING transaction_id, created_at`,
        [moneyRequest.requestee_wallet_id, moneyRequest.requester_wallet_id, requestAmount, reference]
      );
      const transaction = txnResult.rows[0];

      // STEP 6: Deduct from payer
      await client.query(
        `UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2`,
        [requestAmount, moneyRequest.requestee_wallet_id]
      );

      // STEP 7: Credit requester
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`,
        [requestAmount, moneyRequest.requester_wallet_id]
      );

      // STEP 8: Update request status → 'paid'
      await client.query(
        `UPDATE money_requests
         SET status = 'paid', paid_transaction_id = $1
         WHERE request_id = $2`,
        [transaction.transaction_id, requestId]
      );

      // STEP 9: Log event
      await client.query(
        `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
         VALUES ($1, 'request_paid', 'success', $2)`,
        [transaction.transaction_id, `Request #${requestId} paid`]
      );

      await client.query('COMMIT');

      return {
        transaction_id: transaction.transaction_id,
        reference,
        amount: requestAmount,
        request_id: requestId,
        date: transaction.created_at
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==============================================
  // UPDATE REQUEST STATUS (decline / cancel)
  // ==============================================
  async updateRequestStatus(requestId, userId, status) {
    try {
      // Fetch the request
      const reqResult = await query(
        'SELECT * FROM money_requests WHERE request_id = $1',
        [requestId]
      );
      if (reqResult.rows.length === 0) throw new Error('Money request not found');

      const moneyRequest = reqResult.rows[0];

      // 'declined' can only be done by the requestee (payer)
      // 'cancelled' can only be done by the requester
      if (status === 'declined' && moneyRequest.requestee_user_id !== userId) {
        throw new Error('Only the payer can decline a request');
      }
      if (status === 'cancelled' && moneyRequest.requester_user_id !== userId) {
        throw new Error('Only the requester can cancel a request');
      }
      if (moneyRequest.status !== 'requested') {
        throw new Error(`Request is already ${moneyRequest.status}`);
      }

      const result = await query(
        `UPDATE money_requests SET status = $1
         WHERE request_id = $2
         RETURNING *`,
        [status, requestId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // CASH IN (Agent → User)
  // ==============================================
  // Agent deposits physical cash into a user's wallet
  async cashIn(agentUserId, userPhone, amount, agentEpin) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // STEP 1: Verify agent ePin
      const epinResult = await client.query(
        'SELECT epin_hash FROM users WHERE user_id = $1',
        [agentUserId]
      );
      if (epinResult.rows.length === 0) throw new Error('Agent not found');

      const isValidEpin = await comparePassword(agentEpin, epinResult.rows[0].epin_hash);
      if (!isValidEpin) throw new Error('Invalid ePin');

      // STEP 2: Get agent's wallet
      const agentWalletResult = await client.query(
        `SELECT wallet_id, balance, status FROM wallets
         WHERE user_id = $1 AND wallet_type = 'agent' FOR UPDATE`,
        [agentUserId]
      );
      if (agentWalletResult.rows.length === 0) throw new Error('Agent wallet not found');

      const agentWallet = agentWalletResult.rows[0];
      if (agentWallet.status !== 'active') throw new Error('Agent wallet is not active');

      const agentBalance = parseFloat(agentWallet.balance);
      if (agentBalance < parseFloat(amount)) {
        throw new Error(`Insufficient agent balance. Agent has ৳${agentBalance.toFixed(2)}`);
      }

      // STEP 3: Get user's wallet by phone
      const userWalletResult = await client.query(
        `SELECT w.wallet_id, w.status, u.name, u.user_id
         FROM wallets w
         JOIN users u ON w.user_id = u.user_id
         WHERE u.phone = $1 AND w.wallet_type = 'user' FOR UPDATE`,
        [userPhone]
      );
      if (userWalletResult.rows.length === 0) {
        throw new Error('User not found with this phone number');
      }

      const userWallet = userWalletResult.rows[0];
      if (userWallet.user_id === agentUserId) throw new Error('Cannot cash in to your own account');
      if (userWallet.status !== 'active') throw new Error('User wallet is not active');

      // STEP 4: Create transaction
      const reference = `CIN-${Date.now()}`;
      const txnResult = await client.query(
        `INSERT INTO transactions
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'cash_in', 'completed', $4)
         RETURNING transaction_id, created_at`,
        [agentWallet.wallet_id, userWallet.wallet_id, amount, reference]
      );
      const transaction = txnResult.rows[0];

      // STEP 5: Deduct from agent
      const deductResult = await client.query(
        `UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2 RETURNING balance`,
        [amount, agentWallet.wallet_id]
      );
      const newAgentBalance = parseFloat(deductResult.rows[0].balance);

      // STEP 6: Credit user
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`,
        [amount, userWallet.wallet_id]
      );

      // STEP 7: Log event
      await client.query(
        `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
         VALUES ($1, 'cash_in_completed', 'success', $2)`,
        [transaction.transaction_id, `Cash in ৳${amount} to ${userWallet.name}`]
      );

      await client.query('COMMIT');

      return {
        transaction_id: transaction.transaction_id,
        reference,
        amount: parseFloat(amount),
        to: userWallet.name,
        to_phone: userPhone,
        agent_new_balance: newAgentBalance,
        date: transaction.created_at
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==============================================
  // CASH OUT (User → Agent, with 1.5% fee)
  // ==============================================
  // User withdraws cash through an agent; agent earns 1.5% fee
  async cashOut(userId, agentPhone, amount, userEpin) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const cashOutAmount = parseFloat(amount);
      const FEE_RATE    = 0.015; // 1.5%
      const feeAmount   = parseFloat((cashOutAmount * FEE_RATE).toFixed(2));
      const totalDeduct = parseFloat((cashOutAmount + feeAmount).toFixed(2));

      // STEP 1: Verify user ePin
      const epinResult = await client.query(
        'SELECT epin_hash FROM users WHERE user_id = $1',
        [userId]
      );
      if (epinResult.rows.length === 0) throw new Error('User not found');

      const isValidEpin = await comparePassword(userEpin, epinResult.rows[0].epin_hash);
      if (!isValidEpin) throw new Error('Invalid ePin');

      // STEP 2: Get user's wallet
      const userWalletResult = await client.query(
        `SELECT wallet_id, balance, status FROM wallets
         WHERE user_id = $1 AND wallet_type IN ('user', 'agent') FOR UPDATE`,
        [userId]
      );
      if (userWalletResult.rows.length === 0) throw new Error('Your wallet not found');

      const userWallet = userWalletResult.rows[0];
      if (userWallet.status !== 'active') throw new Error('Your wallet is not active');

      const userBalance = parseFloat(userWallet.balance);
      if (userBalance < totalDeduct) {
        throw new Error(
          `Insufficient balance. You need ৳${totalDeduct.toFixed(2)} (amount + 1.5% fee). You have ৳${userBalance.toFixed(2)}`
        );
      }

      // STEP 3: Get agent's wallet by phone
      const agentWalletResult = await client.query(
        `SELECT w.wallet_id, w.status, u.name, u.user_id
         FROM wallets w
         JOIN users u ON w.user_id = u.user_id
         WHERE u.phone = $1 AND w.wallet_type = 'agent' FOR UPDATE`,
        [agentPhone]
      );
      if (agentWalletResult.rows.length === 0) {
        throw new Error('Agent not found with this phone number');
      }

      const agentWallet = agentWalletResult.rows[0];
      if (agentWallet.user_id === userId) throw new Error('Cannot cash out to yourself');
      if (agentWallet.status !== 'active') throw new Error('Agent wallet is not active');

      // STEP 4: Create main cash_out transaction (user → agent, full amount)
      const reference = `COUT-${Date.now()}`;
      const txnResult = await client.query(
        `INSERT INTO transactions
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'cash_out', 'completed', $4)
         RETURNING transaction_id, created_at`,
        [userWallet.wallet_id, agentWallet.wallet_id, cashOutAmount, reference]
      );
      const transaction = txnResult.rows[0];

      // STEP 5: Deduct total (amount + fee) from user
      const deductResult = await client.query(
        `UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2 RETURNING balance`,
        [totalDeduct, userWallet.wallet_id]
      );
      const newUserBalance = parseFloat(deductResult.rows[0].balance);

      // STEP 6: Credit cash-out amount to agent
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`,
        [cashOutAmount, agentWallet.wallet_id]
      );

      // STEP 7: Record fee in agent_fees table (fee stays with agent implicitly via the extra deduction)
      await client.query(
        `INSERT INTO agent_fees (cashout_transaction_id, agent_wallet_id, fee_amount)
         VALUES ($1, $2, $3)`,
        [transaction.transaction_id, agentWallet.wallet_id, feeAmount]
      );

      // Also credit the fee amount to agent wallet separately
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`,
        [feeAmount, agentWallet.wallet_id]
      );

      // STEP 8: Log event
      await client.query(
        `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
         VALUES ($1, 'cash_out_completed', 'success', $2)`,
        [
          transaction.transaction_id,
          `Cash out ৳${cashOutAmount} via agent ${agentWallet.name}. Fee: ৳${feeAmount}`
        ]
      );

      await client.query('COMMIT');

      return {
        transaction_id: transaction.transaction_id,
        reference,
        amount: cashOutAmount,
        fee: feeAmount,
        total_deducted: totalDeduct,
        agent: agentWallet.name,
        agent_phone: agentPhone,
        new_balance: newUserBalance,
        date: transaction.created_at
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Export a single instance
export default new TransactionService();
