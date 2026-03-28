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
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING notification_id, user_id, message, created_at',
        [userId, trimmedMessage]
      );
      return { sentCount: 1, audience: 'phone', phone: targetPhone, notification: insertRes.rows[0] };
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
          'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
          [uid, trimmedMessage]
        );
      }

      console.log(`[NOTIFY] Successfully inserted ${recipientIds.length} notifications`);

      try {
        await client.query(
          `INSERT INTO admin_activity_logs (admin_user_id, action_type, target_id, description)
           VALUES ($1, $2, $3, $4)`,
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
      LIMIT 10
      `,
      [userId]
    );
    return res.rows;
  }

  async deleteNotification(userId, notificationId) {
    const res = await query(
      'DELETE FROM notifications WHERE user_id = $1 AND notification_id = $2 RETURNING notification_id',
      [userId, notificationId]
    );
    if (res.rows.length === 0) {
      const err = new Error('Notification not found');
      err.statusCode = 404;
      throw err;
    }
    return { success: true };
  }

  async clearAll(userId) {
    await query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    return { success: true };
  }
}

export default new NotificationService();
