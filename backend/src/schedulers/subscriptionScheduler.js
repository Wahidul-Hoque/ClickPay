
import { query, getClient } from '../config/database.js';

// Internal helper to match your Service pattern
async function logEvent(client, transactionId, eventType, eventStatus, details) {
  await client.query(
    `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
     VALUES ($1, $2, $3, $4)`,
    [transactionId, eventType, eventStatus, details]
  );
}

const processSubscriptions = async () => {
  console.log('--- Starting Subscription Billing Cycle ---');
  const client = await getClient();
  const MONTHLY_FEE = 300.00;

  try {
    const dueSubscriptions = await client.query(
      `SELECT s.*, w.balance as user_balance, w.wallet_id as user_wallet_id
       FROM subscriptions s
       JOIN wallets w ON s.subscriber_wallet_id = w.wallet_id
       WHERE s.status = 'active' 
       AND s.next_billing_at <= NOW()`
    );

    for (const sub of dueSubscriptions.rows) {
      try {
        await client.query('BEGIN');

        // CASE 1: AUTO-RENEW IS OFF (The "Finish" Logic)
        if (sub.auto_renew === false) {
          await client.query(
            `UPDATE subscriptions SET status = 'expired', end_at = NOW() WHERE subscription_id = $1`,
            [sub.subscription_id]
          );

          // We log this against the LAST known transaction_id for this subscription
          // Or create a 'system' event if preferred.
          const lastTxnId = sub.paid_transaction_id; // Assuming you store the last txn id or look it up
          
          await logEvent(client, lastTxnId, 'subscription_finished', 'info', 
            `Subscription ended naturally as auto-renew was disabled.`);
          
          console.log(`Finished sub ${sub.subscription_id} (Terminated)`);
        } 
        
        // CASE 2: INSUFFICIENT BALANCE
        else if (parseFloat(sub.user_balance) < MONTHLY_FEE) {
          await client.query(
            `UPDATE subscriptions SET status = 'paused' WHERE subscription_id = $1`,
            [sub.subscription_id]
          );
          
          await logEvent(client, sub.paid_transaction_id, 'subscription_paused', 'failure', 
            `Insufficient balance (${sub.user_balance}) for renewal.`);
        } 

        // CASE 3: SUCCESSFUL RENEWAL
        else {
          // 1. Create Renewal Transaction
          const txnRes = await client.query(
            `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
             VALUES ($1, $2, $3, 'subscription_renewal', 'completed', $4) RETURNING transaction_id`,
            [sub.user_wallet_id, sub.merchant_wallet_id, MONTHLY_FEE, `Renewal: ${sub.plan_name}`]
          );
          const newTxnId = txnRes.rows[0].transaction_id;

          // 2. Adjust Balances
          await client.query(`UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2`, [MONTHLY_FEE, sub.user_wallet_id]);
          await client.query(`UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`, [MONTHLY_FEE, sub.merchant_wallet_id]);

          // 3. Update Sub Record
          await client.query(
            `UPDATE subscriptions 
             SET next_billing_at = next_billing_at + INTERVAL '1 month'
             WHERE subscription_id = $1`,
            [sub.subscription_id]
          );

          // 4. Log Success Event
          await logEvent(client, newTxnId, 'renewal_success', 'success', `Automated monthly renewal of 300.00 processed.`);
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error in sub ${sub.subscription_id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Scheduler error:', error.message);
  } finally {
    client.release();
    console.log('--- Subscription Billing Cycle Finished ---');
  }
};

export { processSubscriptions };