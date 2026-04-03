// ==============================================
// FRAUD DETECTION SERVICE
// ==============================================
// Detects suspicious transaction patterns:
//   - If the SAME transaction (same sender, receiver, amount, type) occurs
//     5+ times within a 1-hour window, it is flagged as suspicious.
//   - A fraud_alerts record is created.
//   - An automatic notification is sent to the user.
//   - Admin is notified and can freeze the account.

import { query, getClient } from '../config/database.js';

class FraudDetectionService {

  // ──────────────────────────────────────────────────────────────
  // CHECK FOR REPEATED TRANSACTIONS (called after each successful txn)
  // ──────────────────────────────────────────────────────────────
  async checkForRepeatedTransactions(fromWalletId, toWalletId, amount, transactionType) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `SELECT COUNT(*) AS repeat_count
         FROM transactions
         WHERE from_wallet_id = $1
           AND to_wallet_id = $2
           AND amount = $3
           AND transaction_type = $4
           AND status = 'completed'
           AND created_at > NOW() - INTERVAL '1 hour'`,
        [fromWalletId, toWalletId, amount, transactionType]
      );

      const repeatCount = parseInt(result.rows[0].repeat_count);
      console.log(`[FRAUD] Repeat check: ${repeatCount} identical transactions in last hour (threshold: 5)`);

      if (repeatCount >= 5) {
        const walletRes = await client.query(
          'SELECT user_id FROM wallets WHERE wallet_id = $1',
          [fromWalletId]
        );
        if (walletRes.rows.length === 0) {
          await client.query('COMMIT');
          return { alert: false, repeatCount };
        }
        const flaggedUserId = walletRes.rows[0].user_id;

        const receiverRes = await client.query(
          `SELECT u.name, u.phone FROM wallets w JOIN users u ON w.user_id = u.user_id WHERE w.wallet_id = $1`,
          [toWalletId]
        );
        const receiverName = receiverRes.rows[0]?.name || 'Unknown';
        const receiverPhone = receiverRes.rows[0]?.phone || 'Unknown';

        const existingAlert = await client.query(
          `SELECT 1 FROM fraud_alerts
           WHERE flagged_user_id = $1
             AND from_wallet_id = $2
             AND to_wallet_id = $3
             AND amount = $4
             AND status IN ('pending', 'reviewed')
             AND created_at > NOW() - INTERVAL '1 hour'`,
          [flaggedUserId, fromWalletId, toWalletId, amount]
        );

        if (existingAlert.rows.length > 0) {
          console.log('[FRAUD] Alert already exists for this pattern, skipping duplicate.');
          await client.query('COMMIT');
          return { alert: false, repeatCount };
        }

        const alertDescription = `User made ${repeatCount} identical ${transactionType} transactions of ৳${amount} to ${receiverName} (${receiverPhone}) within the last hour.`;

        const alertRes = await client.query(
          `INSERT INTO fraud_alerts 
             (flagged_user_id, from_wallet_id, to_wallet_id, amount, transaction_type, repeat_count, description, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
           RETURNING alert_id`,
          [flaggedUserId, fromWalletId, toWalletId, amount, transactionType, repeatCount, alertDescription]
        );

        const alertId = alertRes.rows[0].alert_id;
        console.log(`[FRAUD] ⚠️ Alert #${alertId} created for user ${flaggedUserId}`);

        await client.query(`CALL p_send_notification($1, $2)`, [
          flaggedUserId,
          `⚠️ Security Alert: We detected ${repeatCount} identical transactions of ৳${amount} to ${receiverPhone} within the last hour. If you did not authorize these transactions, please contact support immediately. Your account may be temporarily restricted for safety.`
        ]);

        const adminsRes = await client.query(`SELECT user_id FROM users WHERE role = 'admin' AND status = 'active'`);
        for (const admin of adminsRes.rows) {
          await client.query(`CALL p_send_notification($1, $2)`, [
            admin.user_id,
            `🚨 Fraud Alert #${alertId}: User ID ${flaggedUserId} made ${repeatCount} identical ${transactionType} transactions of ৳${amount} to ${receiverPhone}. Review and take action.`
          ]);
        }

        console.log(`[FRAUD] Notifications sent to user ${flaggedUserId} and ${adminsRes.rows.length} admin(s)`);
        await client.query('COMMIT');
        return { alert: true, alertId, repeatCount };
      }

      await client.query('COMMIT');
      return { alert: false, repeatCount };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[FRAUD] Error during fraud check (non-blocking):', error.message);
      return { alert: false, error: error.message };
    } finally {
      client.release();
    }
  }

  // ──────────────────────────────────────────────────────────────
  // GET ALL FRAUD ALERTS (Admin)
  // ──────────────────────────────────────────────────────────────
  async getFraudAlerts(status = null, limit = 50) {
    let whereClause = '';
    const params = [];

    if (status) {
      params.push(status);
      whereClause = `WHERE fa.status = $${params.length}`;
    }

    params.push(limit);
    const limitIdx = params.length;

    const result = await query(
      `SELECT 
         fa.alert_id,
         fa.flagged_user_id,
         u.name AS user_name,
         u.phone AS user_phone,
         u.status AS user_status,
         fa.from_wallet_id,
         fa.to_wallet_id,
         fa.amount,
         fa.transaction_type,
         fa.repeat_count,
         fa.description,
         fa.status AS alert_status,
         fa.resolved_by,
         fa.resolved_at,
         fa.resolution_note,
         fa.created_at,
         ru.name AS resolved_by_name
       FROM fraud_alerts fa
       JOIN users u ON fa.flagged_user_id = u.user_id
       LEFT JOIN users ru ON fa.resolved_by = ru.user_id
       ${whereClause}
       ORDER BY fa.created_at DESC
       LIMIT $${limitIdx}`,
      params
    );

    return result.rows;
  }

  // ──────────────────────────────────────────────────────────────
  // RESOLVE FRAUD ALERT (Admin action: freeze or dismiss)
  // ──────────────────────────────────────────────────────────────
  async resolveAlert(alertId, adminUserId, action, note = '') {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 1. Fetch the alert
      const alertRes = await client.query(
        'SELECT * FROM fraud_alerts WHERE alert_id = $1 FOR UPDATE',
        [alertId]
      );
      if (alertRes.rows.length === 0) throw new Error('Fraud alert not found');
      const alert = alertRes.rows[0];

      if (alert.status !== 'pending') {
        throw new Error(`Alert is already ${alert.status}`);
      }

      const flaggedUserId = alert.flagged_user_id;

      if (action === 'freeze') {
        // Freeze the user account and all wallets
        await client.query(`CALL p_set_user_account_status($1, 'frozen')`, [flaggedUserId]);

        // Mark alert as resolved (trigger handles admin logging)
        await client.query(
          `UPDATE fraud_alerts 
           SET status = 'frozen', resolved_by = $1, resolved_at = NOW(), resolution_note = $2
           WHERE alert_id = $3`,
          [adminUserId, note || 'Account frozen due to suspicious activity', alertId]
        );

        // Notify user
        await client.query(`CALL p_send_notification($1, $2)`, [
          flaggedUserId,
          `🔒 Your account has been frozen due to suspicious transaction activity detected by our security system. Please contact support for assistance.`
        ]);

      } else if (action === 'dismiss') {
        // Mark alert as dismissed (trigger handles admin logging)
        await client.query(
          `UPDATE fraud_alerts 
           SET status = 'dismissed', resolved_by = $1, resolved_at = NOW(), resolution_note = $2
           WHERE alert_id = $3`,
          [adminUserId, note || 'Alert dismissed after review', alertId]
        );
      } else {
        throw new Error('Invalid action. Use "freeze" or "dismiss"');
      }

      await client.query('COMMIT');

      return { success: true, action, alertId, flaggedUserId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ──────────────────────────────────────────────────────────────
  // GET FRAUD ALERT STATS (counts by status)
  // ──────────────────────────────────────────────────────────────
  async getAlertStats() {
    const result = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'pending') AS pending,
         COUNT(*) FILTER (WHERE status = 'frozen') AS frozen,
         COUNT(*) FILTER (WHERE status = 'dismissed') AS dismissed,
         COUNT(*) AS total
       FROM fraud_alerts`
    );
    return result.rows[0];
  }
}

export default new FraudDetectionService();
