import { query, getClient } from '../config/database.js';
import { comparePassword } from '../middleware/auth.js';

class SubscriptionController {
  /**
   * Start a new subscription
   * POST /api/v1/subscriptions/subscribe
   */
  async subscribe(req, res, next) {
    const client = await getClient();
    try {
      const userId = req.user.userId;
      const { merchantId, planName, amount, epin } = req.body;

      await client.query('BEGIN');

      // 1. Verify User ePin
      const userRes = await client.query('SELECT epin_hash FROM users WHERE user_id = $1', [userId]);
      if (!(await comparePassword(epin, userRes.rows[0].epin_hash))) {
        throw new Error('Invalid ePin');
      }

      // 2. Get User and Merchant Wallets
      const userWallet = await client.query("SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND wallet_type = 'user'", [userId]);
      const merchantWallet = await client.query("SELECT wallet_id FROM wallets WHERE user_id = $1 AND wallet_type = 'merchant'", [merchantId]);

      if (parseFloat(userWallet.rows[0].balance) < parseFloat(amount)) {
        throw new Error('Insufficient balance for the first month');
      }

      // 3. Create First Payment Transaction
      const reference = `SUB-INIT-${Date.now()}`;
      const txnRes = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'subscription_pay', 'completed', $4) RETURNING transaction_id`,
        [userWallet.rows[0].wallet_id, merchantWallet.rows[0].wallet_id, amount, reference]
      );

      // 4. Update Balances
      await client.query('UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2', [amount, userWallet.rows[0].wallet_id]);
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [amount, merchantWallet.rows[0].wallet_id]);

      // 5. Create Subscription Record
      // start_at = NOW, next_billing_at = NOW + 30 days
      const subRes = await client.query(
        `INSERT INTO subscriptions 
          (subscriber_user_id, subscriber_wallet_id, merchant_user_id, merchant_wallet_id, 
           plan_name, amount, start_at, next_billing_at, auto_renew, status)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days', true, 'active')
         RETURNING *`,
        [userId, userWallet.rows[0].wallet_id, merchantId, merchantWallet.rows[0].wallet_id, planName, amount]
      );

      await client.query('COMMIT');
      return res.json({ success: true, message: 'Subscribed successfully', data: subRes.rows[0] });

    } catch (error) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: error.message });
    } finally {
      client.release();
    }
  }

  /**
   * Get my active subscriptions
   */
  async getMySubscriptions(req, res, next) {
    try {
      const result = await query(
        `SELECT s.*, mp.merchant_name, mp.category 
         FROM subscriptions s
         JOIN merchant_profiles mp ON s.merchant_user_id = mp.merchant_user_id
         WHERE s.subscriber_user_id = $1
         ORDER BY s.created_at DESC`,
        [req.user.userId]
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      next(error);
    }
  }

    async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'cancelled' or 'paused' or 'active'
      const userId = req.user.userId;

      const allowedStatuses = ['active', 'paused', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      // Ensure the subscription belongs to the user
      const result = await query(
        `UPDATE subscriptions 
         SET status = $1, auto_renew = $2
         WHERE subscription_id = $3 AND subscriber_user_id = $4
         RETURNING *`,
        [status, status === 'active', id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }

      res.json({ 
        success: true, 
        message: `Subscription ${status} successfully`, 
        data: result.rows[0] 
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SubscriptionController();