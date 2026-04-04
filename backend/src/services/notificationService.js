import { query, getClient } from '../config/database.js';

const AUDIENCES = ['all', 'users', 'agents', 'merchants'];

function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).trim().replace(/[\s-]+/g, '');
}

class NotificationService {
  async sendAdminNotification({ adminId, message, audience, phone }) {
    const trimmedMessage = String(message || '').trim();
    if (!trimmedMessage) {
      const err = new Error('Message is required');
      err.statusCode = 400;
      throw err;
    }
    if (trimmedMessage.length > 500) {
      const err = new Error('Message is too long (max 500 characters)');
      err.statusCode = 400;
      throw err;
    }

    const targetPhone = normalizePhone(phone);
    const targetAudience = String(audience || 'all').toLowerCase();

    if (targetPhone) {
      const userRes = await query(
        "SELECT user_id FROM users WHERE phone = $1 AND role IN ('user','agent','merchant')",
        [targetPhone]
      );
      if (userRes.rows.length === 0) {
        const err = new Error('No user found with this phone number');
        err.statusCode = 404;
        throw err;
      }
      const userId = userRes.rows[0].user_id;
      const insertRes = await query(
        'CALL p_send_notification($1, $2)',
        [userId, trimmedMessage]
      );
      // Let's get the created notification manually since CALL doesn't return the row. Wait, p_send_notification doesn't return anything. Let's just return a generic success object.
      return { sentCount: 1, audience: 'phone', phone: targetPhone, message: 'Notification sent successfully.' };
    }

    if (!AUDIENCES.includes(targetAudience)) {
      const err = new Error(`Invalid audience. Use one of: ${AUDIENCES.join(', ')}, or provide phone`);
      err.statusCode = 400;
      throw err;
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      let recipientIds = [];
      if (targetAudience === 'merchants') {
        const recipientsRes = await client.query(
          `
          SELECT u.user_id
          FROM users u
          JOIN merchant_profiles mp ON mp.merchant_user_id = u.user_id
          WHERE u.role = 'merchant'
            AND u.status = 'active'
            AND mp.status = 'active'
          `
        );
        recipientIds = recipientsRes.rows.map(r => r.user_id);
      } else if (targetAudience === 'users') {
        const recipientsRes = await client.query(
          `SELECT user_id FROM users WHERE role = 'user' AND status = 'active'`
        );
        recipientIds = recipientsRes.rows.map(r => r.user_id);
      } else if (targetAudience === 'agents') {
        const recipientsRes = await client.query(
          `SELECT user_id FROM users WHERE role = 'agent' AND status = 'active'`
        );
        recipientIds = recipientsRes.rows.map(r => r.user_id);
      } else {
        const recipientsRes = await client.query(
          `SELECT user_id FROM users WHERE role IN ('user','agent','merchant') AND status = 'active'`
        );
        recipientIds = recipientsRes.rows.map(r => r.user_id);
      }

      if (recipientIds.length === 0) {
        await client.query('COMMIT');
        return { sentCount: 0, audience: targetAudience };
      }

      console.log(`[NOTIFY] Sending to ${recipientIds.length} recipients (audience: ${targetAudience})`);

      // Insert notifications one-by-one for maximum compatibility
      for (const uid of recipientIds) {
        await client.query(
          'CALL p_send_notification($1, $2)',
          [uid, trimmedMessage]
        );
      }

      console.log(`[NOTIFY] Successfully inserted ${recipientIds.length} notifications`);

      try {
        await client.query(
          `CALL p_log_admin_activity($1, $2, $3, $4)`,
          [
            adminId,
            'SEND_NOTIFICATION',
            targetAudience,
            `Sent notification to ${recipientIds.length} recipient(s)`
          ]
        );
      } catch (_) {}

      await client.query('COMMIT');
      return { sentCount: recipientIds.length, audience: targetAudience };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getSentNotifications(limit = 10) {
    const sanitizedLimit = Math.min(50, Math.max(1, Number(limit ?? 10) || 10));
    const res = await query(
      `
      SELECT 
        n.notification_id,
        n.message,
        n.created_at,
        u.user_id,
        u.name AS recipient_name,
        u.phone AS recipient_phone,
        u.role AS recipient_role
      FROM notifications n
      JOIN users u ON u.user_id = n.user_id
      ORDER BY n.created_at DESC
      LIMIT $1
      `,
      [sanitizedLimit]
    );
    return res.rows;
  }

  async listUserNotifications(userId, page = 1, limit = 20) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (p - 1) * l;

    const [itemsRes, countRes] = await Promise.all([
      query(
        `
        SELECT notification_id, message, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        `,
        [userId, l, offset]
      ),
      query('SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1', [userId]),
    ]);

    const total = countRes.rows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / l));
    return {
      data: itemsRes.rows,
      pagination: { page: p, limit: l, total, totalPages },
    };
  }

  async recentUserNotifications(userId) {
    const res = await query(
      `
      SELECT notification_id, message, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 3
      `,
      [userId]
    );
    return res.rows;
  }

  async deleteNotification(userId, notificationId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        'DELETE FROM notifications WHERE user_id = $1 AND notification_id = $2 RETURNING notification_id',
        [userId, notificationId]
      );
      if (res.rows.length === 0) {
        const err = new Error('Notification not found');
        err.statusCode = 404;
        throw err;
      }
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async clearAll(userId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new NotificationService();
