// ==============================================
// TRANSACTION HISTORY ROUTES
// ==============================================
// This file handles transaction history and details
// 1. GET /api/v1/transactions/history - Get transaction history
// 2. GET /api/v1/transactions/:transaction_id - Get transaction details
// 3. POST /api/v1/transactions/request - Request money from another user
// 4. POST /api/v1/transactions/cash-in - Cash in (agents only)
// 5. POST /api/v1/transactions/cash-out - Cash out

import express from 'express';
import { query, db } from '../config/db.js';
import { protect, authorizeRole } from '../utils/auth.js';

const router = express.Router();

// ==============================================
// GET TRANSACTION HISTORY
// ==============================================
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;
    
    // ==========================================
    // STEP 1: BUILD QUERY WITH FILTERS
    // ==========================================
    let queryText = `
      SELECT 
        t.transaction_id,
        t.transaction_type,
        t.amount,
        t.status,
        t.description,
        t.created_at,
        te.event_type,
        w.wallet_id
      FROM transactions t
      JOIN transaction_events te ON t.transaction_id = te.transaction_id
      JOIN wallets w ON te.wallet_id = w.wallet_id
      WHERE w.user_id = $1
    `;
    
    const params = [userId];
    let paramCount = 1;
    
    // Optional filter by transaction type
    if (type) {
      paramCount++;
      queryText += ` AND t.transaction_type = $${paramCount}`;
      params.push(type);
    }
    
    queryText += ` ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    // ==========================================
    // STEP 2: GET TRANSACTIONS
    // ==========================================
    const result = await query(queryText, params);
    
    // ==========================================
    // STEP 3: GET TOTAL COUNT FOR PAGINATION
    // ==========================================
    let countQuery = `
      SELECT COUNT(DISTINCT t.transaction_id) as total
      FROM transactions t
      JOIN transaction_events te ON t.transaction_id = te.transaction_id
      JOIN wallets w ON te.wallet_id = w.wallet_id
      WHERE w.user_id = $1
    `;
    
    const countParams = [userId];
    if (type) {
      countQuery += ` AND t.transaction_type = $2`;
      countParams.push(type);
    }
    
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    // ==========================================
    // STEP 4: SEND RESPONSE
    // ==========================================
    res.json({
      success: true,
      message: 'Transaction history retrieved',
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: totalPages
      }
    });
    
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get transaction history' 
    });
  }
});

// ==============================================
// GET TRANSACTION DETAILS
// ==============================================
router.get('/:transaction_id', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transaction_id } = req.params;
    
    // Get transaction details with events
    const result = await query(
      `SELECT 
        t.*,
        json_agg(
          json_build_object(
            'event_id', te.event_id,
            'wallet_id', te.wallet_id,
            'event_type', te.event_type,
            'amount', te.amount,
            'created_at', te.created_at
          )
        ) as events
       FROM transactions t
       JOIN transaction_events te ON t.transaction_id = te.transaction_id
       JOIN wallets w ON te.wallet_id = w.wallet_id
       WHERE t.transaction_id = $1 AND w.user_id = $2
       GROUP BY t.transaction_id`,
      [transaction_id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Transaction details retrieved',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Transaction details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get transaction details' 
    });
  }
});

// ==============================================
// REQUEST MONEY
// ==============================================
router.post('/request', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fromPhone, amount, message } = req.body;
    
    // TODO: Implement money request feature
    // Steps needed:
    // 1. Validate input (fromPhone, amount)
    // 2. Find requestee by phone
    // 3. Create money_request record
    // 4. Set expiry date (e.g., 24 hours)
    // 5. Send notification (optional)
    // 6. Return request details
    
    res.json({ 
      success: true, 
      message: 'Money request - To be implemented' 
    });
    
  } catch (error) {
    console.error('Request money error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to request money' 
    });
  }
});

// ==============================================
// CASH IN (AGENTS ONLY)
// ==============================================
router.post('/cash-in', protect, authorizeRole('agent'), async (req, res) => {
  const client = await db.connect();
  
  try {
    const agentId = req.user.userId;
    const { userPhone, amount, agentEpin } = req.body;
    
    // TODO: Implement cash-in feature
    // Steps needed:
    // 1. Validate input
    // 2. Verify agent's ePin
    // 3. Find user by phone
    // 4. Begin transaction
    // 5. Add money to user's wallet
    // 6. Create transaction record
    // 7. Calculate and record agent fee
    // 8. Commit transaction
    
    await client.query('BEGIN');
    
    res.json({ 
      success: true, 
      message: 'Cash in - To be implemented' 
    });
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cash in error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cash in' 
    });
  } finally {
    client.release();
  }
});

// ==============================================
// CASH OUT
// ==============================================
router.post('/cash-out', protect, async (req, res) => {
  const client = await db.connect();
  
  try {
    const userId = req.user.userId;
    const { agentPhone, amount, userEpin } = req.body;
    
    // TODO: Implement cash-out feature
    // Steps needed:
    // 1. Validate input
    // 2. Verify user's ePin
    // 3. Check user balance
    // 4. Find agent by phone
    // 5. Begin transaction
    // 6. Deduct from user wallet
    // 7. Add to agent (or mark as cash pickup)
    // 8. Calculate and record agent fee
    // 9. Create transaction record
    // 10. Commit transaction
    
    await client.query('BEGIN');
    
    res.json({ 
      success: true, 
      message: 'Cash out - To be implemented' 
    });
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cash out error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cash out' 
    });
  } finally {
    client.release();
  }
});

export default router;