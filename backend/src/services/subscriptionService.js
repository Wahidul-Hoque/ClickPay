import { query, getClient } from '../config/database.js';
import { comparePassword } from '../middleware/auth.js';

// ── INTERNAL HELPERS (Matching Bill Service Pattern) ──
async function logEvent(client, transactionId, eventType, eventStatus, details) {
  await client.query(
    `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
     VALUES ($1, $2, $3, $4)`,
    [transactionId, eventType, eventStatus, details]
  );
}

class SubscriptionService {
  async getSubscriptionDashboard(userId) {
    const mySubs = await query(
      `SELECT s.*, m.merchant_name 
       FROM subscriptions s
       JOIN merchant_profiles m ON s.merchant_user_id = m.merchant_user_id
       WHERE s.subscriber_user_id = $1 AND s.status IN ('active', 'paused')`,
      [userId]
    );

    const available = await query(
      `SELECT merchant_user_id, merchant_name, business_type
       FROM merchant_profiles
       WHERE category = 'subscription' AND status = 'active'
       AND merchant_user_id NOT IN (
         SELECT merchant_user_id FROM subscriptions 
         WHERE subscriber_user_id = $1 AND status = 'active'
       )`,
      [userId]
    );

    return { mySubscriptions: mySubs.rows, availableMerchants: available.rows };
  }

  async createSubscription(userId, merchantUserId, epin) {
    const client = await getClient();
    const MONTHLY_FEE = 300.00;

    try {
      await client.query('BEGIN');

      // 1. Lock & Get User Wallet
      const userWallet = (await client.query(
        `SELECT wallet_id, balance FROM wallets WHERE user_id = $1 FOR UPDATE`, 
        [userId]
      )).rows[0];

      // 2. Verify ePin
      const user = (await client.query(`SELECT epin_hash FROM users WHERE user_id = $1`, [userId])).rows[0];
      const isValid = await comparePassword(epin, user.epin_hash);
      if (!isValid) throw new Error('Invalid ePin');

      // 3. Check Balance
      if (parseFloat(userWallet.balance) < MONTHLY_FEE) throw new Error('Insufficient balance');

      // 4. Get Merchant Wallet
      const merchantData = (await client.query(
        `SELECT w.wallet_id, mp.merchant_name FROM merchant_profiles mp
         JOIN wallets w ON mp.merchant_user_id = w.user_id
         WHERE mp.merchant_user_id = $1`, [merchantUserId]
      )).rows[0];

      if (!merchantData) throw new Error('Merchant wallet not found');

      // 5. Create Transaction Record (Status: completed)
      const txnRes = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'subscription_payment', 'completed', $4) RETURNING transaction_id`,
        [userWallet.wallet_id, merchantData.wallet_id, MONTHLY_FEE, `Initial Sub: ${merchantData.merchant_name}`]
      );
      const transactionId = txnRes.rows[0].transaction_id;

      // 6. Log Events (The part that was missing)
      await logEvent(client, transactionId, 'subscription_initiated', 'info', `User ${userId} starting subscription for ${merchantData.merchant_name}`);
      await logEvent(client, transactionId, 'payment_processed', 'success', `Amount 300.00 deducted from wallet ${userWallet.wallet_id}`);

      // 7. Adjust Balances
      await client.query(`UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2`, [MONTHLY_FEE, userWallet.wallet_id]);
      await client.query(`UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`, [MONTHLY_FEE, merchantData.wallet_id]);

      // 8. Create Subscription Entry
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);

      const subRes = await client.query(
        `INSERT INTO subscriptions 
         (subscriber_user_id, subscriber_wallet_id, merchant_user_id, merchant_wallet_id, 
          plan_name, amount, start_at, next_billing_at, auto_renew, status)
         VALUES ($1, $2, $3, $4, 'Monthly Plan', $5, NOW(), $6, true, 'active')
         RETURNING *`,
        [userId, userWallet.wallet_id, merchantUserId, merchantData.wallet_id, MONTHLY_FEE, nextBilling]
      );

      await logEvent(client, transactionId, 'subscription_created', 'success', `Subscription ID ${subRes.rows[0].subscription_id} is now active`);

      await client.query('COMMIT');
      return { ...subRes.rows[0], merchant_name: merchantData.merchant_name };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async toggleAutoRenew(subscriptionId, userId) {
    const sub = await query(
      `SELECT auto_renew, next_billing_at FROM subscriptions WHERE subscription_id = $1 AND subscriber_user_id = $2`,
      [subscriptionId, userId]
    );
    if (sub.rows.length === 0) throw new Error('Subscription not found');

    const nextMode = !sub.rows[0].auto_renew;
    const endAt = nextMode ? null : sub.rows[0].next_billing_at;

    const result = await query(
      `UPDATE subscriptions SET auto_renew = $1, end_at = $2 WHERE subscription_id = $3 RETURNING *`,
      [nextMode, endAt, subscriptionId]
    );
    return result.rows[0];
  }
}

export default new SubscriptionService();