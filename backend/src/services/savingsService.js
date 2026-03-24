import { query, getClient } from '../config/database.js';
import { comparePassword } from '../middleware/auth.js';

class SavingsService {
  // Internal helper to log transaction events
  async logEvent(client, transactionId, eventType, eventStatus, details) {
    await client.query(
      `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
       VALUES ($1, $2, $3, $4)`,
      [transactionId, eventType, eventStatus, details]
    );
  }

  async createSavingsAccount(userId, amount, durationMonths, epin) {
    const client = await getClient();
    const ANNUAL_RATE = 0.07;

    try {
      await client.query('BEGIN');

      // 1. Strict Check: Only one active account allowed
      const existing = await client.query(
        `SELECT 1 FROM fixed_savings_accounts WHERE user_id = $1 AND status = 'active'`, 
        [userId]
      );
      if (existing.rows.length > 0) {
        throw new Error("You already have an active savings account.");
      }

      // 2. ePin Verification
      const user = (await client.query(`SELECT epin_hash FROM users WHERE user_id = $1`, [userId])).rows[0];
      const isValid = await comparePassword(epin, user.epin_hash);
      if (!isValid) throw new Error('Invalid ePin');

      // 3. Wallet Balance Check
      const fundingWallet = (await client.query(
        `SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND wallet_type = 'user' FOR UPDATE`, 
        [userId]
      )).rows[0];
      if (parseFloat(fundingWallet.balance) < amount) throw new Error("Insufficient balance");

      // 4. Savings Wallet Setup
      let savingsWallet = (await client.query(
        `SELECT wallet_id FROM wallets WHERE user_id = $1 AND wallet_type = 'user_savings' FOR UPDATE`, 
        [userId]
      )).rows[0];

      if (!savingsWallet) {
        const swRes = await client.query(
          `INSERT INTO wallets (user_id, wallet_type, balance, status) 
           VALUES ($1, 'user_savings', 0, 'active') RETURNING wallet_id`, 
          [userId]
        );
        savingsWallet = swRes.rows[0];
      }

      // 5. Transfer Transaction
      const txnRes = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'savings_deposit', 'completed', $4) RETURNING transaction_id`,
        [fundingWallet.wallet_id, savingsWallet.wallet_id, amount, `Deposit for ${durationMonths} months`]
      );
      const transactionId = txnRes.rows[0].transaction_id;

      // 6. Update Balances
      await client.query(`UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2`, [amount, fundingWallet.wallet_id]);
      await client.query(`UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`, [amount, savingsWallet.wallet_id]);

      // 7. Create Savings Record
      const finishAt = new Date();
      finishAt.setMonth(finishAt.getMonth() + durationMonths);

      await client.query(
        `INSERT INTO fixed_savings_accounts 
         (user_id, funding_wallet_id, savings_wallet_id, principal_amount, annual_interest_rate, finish_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
        [userId, fundingWallet.wallet_id, savingsWallet.wallet_id, amount, ANNUAL_RATE, finishAt]
      );

      // Log the event
      await this.logEvent(client, transactionId, 'savings_created', 'success', `Account expires at ${finishAt.toISOString()}`);

      await client.query('COMMIT');
      return { success: true, finishAt };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getMySavings(userId) {
    const res = await query(
      `SELECT 
        fixed_savings_id as id, principal_amount, annual_interest_rate as interest_rate, 
        finish_at, status, created_at 
       FROM fixed_savings_accounts WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  }

  async breakAccount(userId, fixedSavingsId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const acc = (await client.query(
        `SELECT * FROM fixed_savings_accounts WHERE fixed_savings_id = $1 AND user_id = $2 AND status = 'active' FOR UPDATE`,
        [fixedSavingsId, userId]
      )).rows[0];
      if (!acc) throw new Error("Account not found or already closed");

      const isMatured = new Date() >= new Date(acc.finish_at);
      const principal = parseFloat(acc.principal_amount);
      
      // Calculate months from dates
      const diffTime = Math.abs(new Date(acc.finish_at) - new Date(acc.created_at));
      const totalMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
      
      let interest = isMatured ? (principal * parseFloat(acc.annual_interest_rate) * totalMonths) / 12 : 0;

      // Principal Return
      const pTxn = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'savings_withdrawal_base', 'completed', $4) RETURNING transaction_id`,
        [acc.savings_wallet_id, acc.funding_wallet_id, principal, `Return Principal #${fixedSavingsId}`]
      );

      // Interest Payout (if matured)
      if (interest > 0) {
        const iTxn = await client.query(
          `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
           VALUES ((SELECT wallet_id FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'profit'), $1, $2, 'savings_interest', 'completed', $3)
           RETURNING transaction_id`,
          [acc.funding_wallet_id, interest, `Interest Earned #${fixedSavingsId}`]
        );
        await this.logEvent(client, iTxn.rows[0].transaction_id, 'interest_paid', 'success', `Interest: ${interest}`);
        await client.query(`UPDATE wallets SET balance = balance - $1 WHERE wallet_type = 'system' AND system_purpose = 'profit'`, [interest]);
      }

      await client.query(`UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2`, [principal, acc.savings_wallet_id]);
      await client.query(`UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`, [principal + interest, acc.funding_wallet_id]);

      await client.query(
        `UPDATE fixed_savings_accounts SET status = $1 WHERE fixed_savings_id = $2`,
        [isMatured ? 'closed' : 'broken', fixedSavingsId]
      );

      await this.logEvent(client, pTxn.rows[0].transaction_id, 'savings_closed', 'success', isMatured ? 'Matured' : 'Broken Early');

      await client.query('COMMIT');
      return { principal, interest, status: isMatured ? 'closed' : 'broken' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new SavingsService();