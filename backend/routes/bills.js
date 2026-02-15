// ==============================================
// BILL PAYMENT ROUTES
// ==============================================
// This file handles utility bill payments:
// 1. GET /api/v1/bills/billers - Get list of available billers
// 2. GET /api/v1/bills/billers/category/:category - Get billers by category
// 3. POST /api/v1/bills/pay - Pay utility bill
// 4. GET /api/v1/bills/history - Get bill payment history

import express from 'express';
import { protect } from '../utils/auth.js';
import { query, db } from '../config/db.js';

const router = express.Router();

// ==============================================
// GET ALL BILLERS
// ==============================================
router.get('/billers', protect, async (req, res) => {
  try {
    // TODO: Implement get billers
    // Steps needed:
    // 1. Query billers table
    // 2. Filter by status = 'active'
    // 3. Group by category (electricity, gas, water, internet, etc.)
    // 4. Return biller list with details
    
    const result = await query(
      `SELECT 
        biller_id, 
        name, 
        category, 
        logo_url,
        description,
        status
       FROM billers 
       WHERE status = 'active'
       ORDER BY category, name`
    );
    
    res.json({ 
      success: true, 
      message: 'Billers retrieved',
      data: result.rows
    });
    
  } catch (error) {
    console.error('Get billers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get billers' 
    });
  }
});

// ==============================================
// GET BILLERS BY CATEGORY
// ==============================================
router.get('/billers/category/:category', protect, async (req, res) => {
  try {
    const { category } = req.params;
    
    // TODO: Validate category
    const validCategories = ['electricity', 'gas', 'water', 'internet', 'mobile', 'tv'];
    
    const result = await query(
      `SELECT 
        biller_id, 
        name, 
        category, 
        logo_url,
        description
       FROM billers 
       WHERE category = $1 AND status = 'active'
       ORDER BY name`,
      [category]
    );
    
    res.json({ 
      success: true, 
      message: `${category} billers retrieved`,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Get billers by category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get billers by category' 
    });
  }
});

// ==============================================
// PAY BILL
// ==============================================
router.post('/pay', protect, async (req, res) => {
  const client = await db.connect();
  
  try {
    const userId = req.user.userId;
    const { biller_id, account_number, amount, epin } = req.body;
    
    // TODO: Implement bill payment
    // Steps needed:
    // 1. Validate input (biller_id, account_number, amount, epin)
    // 2. Verify user's ePin
    // 3. Get user's wallet and check balance
    // 4. Get biller details
    // 5. Begin transaction
    // 6. Create bill_payments record
    // 7. Deduct from user wallet
    // 8. Create transaction record
    // 9. Integrate with biller API (optional)
    // 10. Commit transaction
    // 11. Return payment receipt
    
    await client.query('BEGIN');
    
    // Placeholder response
    res.json({ 
      success: true, 
      message: 'Bill payment - To be implemented',
      data: {
        // payment_id: 'generated-id',
        // biller_name: 'DESCO',
        // account_number: '123456789',
        // amount: 1500,
        // transaction_id: 'TXN123',
        // paid_at: new Date()
      }
    });
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bill payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to pay bill' 
    });
  } finally {
    client.release();
  }
});

// ==============================================
// GET BILL PAYMENT HISTORY
// ==============================================
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // TODO: Get bill payment history
    const result = await query(
      `SELECT 
        bp.payment_id,
        bp.account_number,
        bp.amount,
        bp.payment_date,
        bp.status,
        b.name as biller_name,
        b.category,
        t.transaction_id
       FROM bill_payments bp
       JOIN billers b ON bp.biller_id = b.biller_id
       JOIN transactions t ON bp.transaction_id = t.transaction_id
       WHERE t.user_id = $1
       ORDER BY bp.payment_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json({ 
      success: true, 
      message: 'Bill payment history retrieved',
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Bill history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get bill payment history' 
    });
  }
});

export default router;