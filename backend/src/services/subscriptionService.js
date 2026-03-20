import { query, getClient } from '../config/database.js';

class SubscriptionService {
  /**
   * Main Worker: Scans for active subscriptions due today
   */
  async processDailyBilling() {
    console.log('[Worker] Starting daily subscription billing scan...');
    
    try {
      // Find all active subscriptions where next_billing_at is due
      const result = await query(
        `SELECT s.*, w_sub.balance as user_balance
         FROM subscriptions s
         JOIN wallets w_sub ON s.subscriber_wallet_id = w_sub.wallet_id
         WHERE s.status = 'active' 
           AND s.auto_renew = true 
           AND s.next_billing_at <= NOW()`
      );

      console.log(`[Worker] Found ${result.rows.length} subscriptions due for billing.`);

      for (const sub of result.rows) {
        await this.executeBilling(sub);
      }
      
      console.log('[Worker] Daily billing scan completed.');
    } catch (err) {
      console.error('[Worker Error] Scanning failed:', err.message);
    }
  }

  /**
   * Processes a single subscription payment
   */
  async executeBilling(sub) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Lock Wallets for Update (Prevention of Race Conditions)
      const userWallet = await client.query(
        "SELECT balance FROM wallets WHERE wallet_id = $1 FOR UPDATE", 
        [sub.subscriber_wallet_id]
      );
      
      const merchantWallet = await client.query(
        "SELECT wallet_id FROM wallets WHERE wallet_id = $1 FOR UPDATE", 
        [sub.merchant_wallet_id]
      );

      const amount = parseFloat(sub.amount);
      const currentBalance = parseFloat(userWallet.rows[0].balance);

      // 2. Check Balance
      if (currentBalance < amount) {
        // Insufficient Balance: Pause the subscription and notify
        await client.query(
          "UPDATE subscriptions SET status = 'paused', auto_renew = false WHERE subscription_id = $1",
          [sub.subscription_id]
        );
        console.log(`[Billing] Sub #${sub.subscription_id} paused: Insufficient balance.`);
        await client.query('COMMIT');
        return;
      }

      // 3. Create Transaction Record
      const reference = `SUB-AUTO-${sub.subscription_id}-${Date.now()}`;
      await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'subscription_pay', 'completed', $4)`,
        [sub.subscriber_wallet_id, sub.merchant_wallet_id, amount, reference]
      );

      // 4. Update Balances
      await client.query('UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2', [amount, sub.subscriber_wallet_id]);
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [amount, sub.merchant_wallet_id]);

      // 5. Extend Billing Date (+30 Days)
      await client.query(
        `UPDATE subscriptions 
         SET next_billing_at = next_billing_at + INTERVAL '30 days'
         WHERE subscription_id = $1`,
        [sub.subscription_id]
      );

      await client.query('COMMIT');
      console.log(`[Billing] Sub #${sub.subscription_id} renewed successfully. Ref: ${reference}`);

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[Billing Error] Failed for Sub #${sub.subscription_id}:`, error.message);
    } finally {
      client.release();
    }
  }
}

export default new SubscriptionService();