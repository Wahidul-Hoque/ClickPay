// ==============================================
// NOTIFICATION ROUTES
// ==============================================
// This file handles notification operations:
// 1. GET /api/v1/notifications - Get user's notifications
// 2. GET /api/v1/notifications/unread-count - Get count of unread notifications
// 3. POST /api/v1/notifications/mark-read/:notification_id - Mark as read
// 4. POST /api/v1/notifications/mark-all-read - Mark all as read
// 5. DELETE /api/v1/notifications/:notification_id - Delete notification

import express from 'express';
import { query, db } from '../config/db.js';
import { protect } from '../utils/auth.js';

const router = express.Router();

// ==============================================
// CREATE NOTIFICATION (Internal function)
// ==============================================
// This will be called from other routes (transactions, etc.)
export const createNotification = async (userId, message, client = null) => {
  const queryText = `
    INSERT INTO notifications (user_id, message)
    VALUES ($1, $2)
    RETURNING notification_id, message, created_at
  `;
  
  if (client) {
    // Use existing transaction client
    return await client.query(queryText, [userId, message]);
  } else {
    // Use regular query
    return await query(queryText, [userId, message]);
  }
};

// ==============================================
// GET USER NOTIFICATIONS
// ==============================================
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get notifications with pagination
    const result = await query(
      `SELECT 
        notification_id,
        message,
        created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = $1`,
      [userId]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      message: 'Notifications retrieved',
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
});

// ==============================================
// GET RECENT NOTIFICATIONS (Last 10)
// ==============================================
router.get('/recent', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT 
        notification_id,
        message,
        created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Recent notifications retrieved',
      data: result.rows
    });

  } catch (error) {
    console.error('Get recent notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent notifications'
    });
  }
});

// ==============================================
// DELETE NOTIFICATION
// ==============================================
router.delete('/:notification_id', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notification_id } = req.params;

    // Delete only if it belongs to the user
    const result = await query(
      `DELETE FROM notifications 
       WHERE notification_id = $1 AND user_id = $2
       RETURNING notification_id`,
      [notification_id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

// ==============================================
// CLEAR ALL NOTIFICATIONS
// ==============================================
router.delete('/', protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    await query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications cleared'
    });

  } catch (error) {
    console.error('Clear notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear notifications'
    });
  }
});

export default router;