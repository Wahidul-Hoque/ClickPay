// ==============================================
// SAVINGS ACCOUNT ROUTES
// ==============================================
// This file handles fixed savings accounts:
// 1. POST /api/v1/savings/create - Create fixed savings account
// 2. GET /api/v1/savings/my-savings - Get user's savings accounts
// 3. GET /api/v1/savings/:savings_id - Get specific savings details
// 4. POST /api/v1/savings/break/:savings_id - Break/withdraw savings early
// 5. GET /api/v1/savings/interest-rates - Get available interest rates

import express from 'express';
import { protect } from '../utils/auth.js';
import { query, db } from '../config/db.js';

const router = express.Router();

// ==============================================
// GET INTEREST RATES
// ==============================================
router.get('/interest-rates', protect, async (req, res) => {
  try {
    // TODO: Get available savings plans
    // Different rates for different durations
    const plans = [
      { duration_months: 3, interest_rate: 4, min_amount: 1000 },
      { duration_months: 6, interest_rate: 5.5, min_amount: 1000 },
      { duration_months: 12, interest_rate: 7, min_amount: 1000 },
      { duration_months: 24, interest_rate: 8.5, min_amount: 5000 },
      { duration_months: 36, interest_rate: 10, min_amount: 10000 },
    ];
    
    res.json({ 
      success: true, 
      message: 'Interest rates retrieved',
      data: plans
    });
    
  } catch (error) {
    console.error('Get rates error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get interest rates' 
    });
  }
});

// ==============================================
// CREATE SAVINGS ACCOUNT
// ==============================================
router.post('/create', protect, async (req, res) => {
  const client = await db.connect();
  
  try {
    const userId = req.user.userId;
    const { amount, duration_months, epin } = req.body;
    
    // TODO: Implement savings account creation
    // Steps needed:
    // 1. Validate input (amount, duration, epin)
    // 2. Verify ePin
    // 3. Check wallet balance
    // 4. Validate minimum amount for selected duration
    // 5. Calculate maturity amount and date
    // 6. Begin transaction
    // 7. Deduct from wallet
    // 8. Create savings_accounts record
    // 9. Create transaction record
    // 10. Commit transaction
    
    await client.query('BEGIN');
    
    res.json({ 
      success: true, 
      message: 'Savings account created - To be implemented',
      data: {
        // savings_id: 'generated-id',
        // principal_amount: 10000,
        // interest_rate: 7,
        // duration_months: 12,
        // maturity_amount: 10700,
        // maturity_date: 'calculated-date',
        // status: 'active'
      }
    });
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create savings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create savings account' 
    });
  } finally {
    client.release();
  }
});

// ==============================================
// GET MY SAVINGS
// ==============================================
router.get('/my-savings', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query; // active, matured, broken
    
    let queryText = `
      SELECT 
        savings_id,
        principal_amount,
        interest_rate,
        duration_months,
        maturity_amount,
        start_date,
        maturity_date,
        actual_withdrawal_date,
        status
      FROM savings_accounts 
      WHERE user_id = $1
    `;
    
    const params = [userId];
    
    if (status) {
      queryText += ` AND status = $2`;
      params.push(status);
    }
    
    queryText += ` ORDER BY created_at DESC`;
    
    const result = await query(queryText, params);
    
    res.json({ 
      success: true, 
      message: 'Savings accounts retrieved',
      data: result.rows
    });
    
  } catch (error) {
    console.error('Get savings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get savings accounts' 
    });
  }
});

// ==============================================
// GET SAVINGS DETAILS
// ==============================================
router.get('/:savings_id', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { savings_id } = req.params;
    
    const result = await query(
      `SELECT 
        s.*,
        CASE 
          WHEN s.status = 'active' AND CURRENT_DATE >= s.maturity_date 
          THEN 'ready_to_withdraw'
          ELSE s.status 
        END as current_status,
        CASE 
          WHEN s.status = 'active' 
          THEN s.maturity_date - CURRENT_DATE 
          ELSE 0 
        END as days_remaining
       FROM savings_accounts s
       WHERE s.savings_id = $1 AND s.user_id = $2`,
      [savings_id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Savings account not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Savings details retrieved',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get savings details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get savings details' 
    });
  }
});

// ==============================================
// BREAK/WITHDRAW SAVINGS
// ==============================================
router.post('/break/:savings_id', protect, async (req, res) => {
  const client = await db.connect();
  
  try {
    const userId = req.user.userId;
    const { savings_id } = req.params;
    const { epin } = req.body;
    
    // TODO: Implement savings withdrawal
    // Steps needed:
    // 1. Verify ePin
    // 2. Get savings account details
    // 3. Check if user owns the account
    // 4. Calculate withdrawal amount:
    //    - If matured: full maturity_amount
    //    - If early: principal + reduced interest (penalty)
    // 5. Begin transaction
    // 6. Update savings_accounts status to 'broken' or 'matured'
    // 7. Add money to user's wallet
    // 8. Create transaction record
    // 9. Commit transaction
    
    await client.query('BEGIN');
    
    res.json({ 
      success: true, 
      message: 'Savings withdrawal - To be implemented',
      data: {
        // withdrawal_amount: 10700,
        // interest_earned: 700,
        // penalty: 0, // If broken early
        // withdrawal_date: new Date()
      }
    });
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Break savings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to withdraw savings' 
    });
  } finally {
    client.release();
  }
});

export default router;