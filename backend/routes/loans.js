// ==============================================
// LOAN MANAGEMENT ROUTES
// ==============================================
// This file handles loan operations:
// 1. POST /api/v1/loans/apply - Apply for a loan
// 2. GET /api/v1/loans/my-loans - Get user's loans
// 3. GET /api/v1/loans/:loan_id - Get specific loan details
// 4. POST /api/v1/loans/repay/:loan_id - Repay loan installment
// 5. GET /api/v1/loans/eligibility - Check loan eligibility

import express from 'express';
import { protect } from '../utils/auth.js';
import { query, db } from '../config/db.js';

const router = express.Router();

// ==============================================
// CHECK LOAN ELIGIBILITY
// ==============================================
router.get('/eligibility', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // TODO: Implement eligibility check
    // Criteria:
    // 1. Account age > 6 months
    // 2. Minimum transaction history
    // 3. No active defaulted loans
    // 4. Credit score calculation
    // 5. Maximum loan amount based on wallet history
    
    res.json({ 
      success: true, 
      message: 'Loan eligibility check - To be implemented',
      data: {
        // eligible: true,
        // max_amount: 50000,
        // interest_rate: 5,
        // reason: 'Good transaction history'
      }
    });
    
  } catch (error) {
    console.error('Eligibility check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check eligibility' 
    });
  }
});

// ==============================================
// APPLY FOR LOAN
// ==============================================
router.post('/apply', protect, async (req, res) => {
  const client = await db.connect();
  
  try {
    const userId = req.user.userId;
    const { amount, duration_months, purpose } = req.body;
    
    // TODO: Implement loan application
    // Steps needed:
    // 1. Validate input (amount, duration, purpose)
    // 2. Check eligibility
    // 3. Calculate interest and installment amount
    // 4. Create loan record with status 'pending'
    // 5. Run compliance check
    // 6. Return application details
    
    await client.query('BEGIN');
    
    // Placeholder
    res.json({ 
      success: true, 
      message: 'Loan application submitted - To be implemented',
      data: {
        // loan_id: 'generated-id',
        // amount: 10000,
        // interest_rate: 5,
        // duration_months: 12,
        // monthly_installment: 856.07,
        // status: 'pending'
      }
    });
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Loan application error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to apply for loan' 
    });
  } finally {
    client.release();
  }
});

// ==============================================
// GET MY LOANS
// ==============================================
router.get('/my-loans', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query; // Filter by status: active, completed, defaulted
    
    let queryText = `
      SELECT 
        loan_id,
        amount,
        interest_rate,
        duration_months,
        monthly_installment,
        remaining_amount,
        start_date,
        end_date,
        status,
        purpose
      FROM loans 
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
      message: 'Loans retrieved',
      data: result.rows
    });
    
  } catch (error) {
    console.error('Get loans error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get loans' 
    });
  }
});

// ==============================================
// GET LOAN DETAILS
// ==============================================
router.get('/:loan_id', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { loan_id } = req.params;
    
    // Get loan details
    const loanResult = await query(
      `SELECT * FROM loans 
       WHERE loan_id = $1 AND user_id = $2`,
      [loan_id, userId]
    );
    
    if (loanResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Loan not found' 
      });
    }
    
    // TODO: Get repayment history
    const repaymentsResult = await query(
      `SELECT * FROM loan_repayments 
       WHERE loan_id = $1 
       ORDER BY payment_date DESC`,
      [loan_id]
    );
    
    res.json({ 
      success: true, 
      message: 'Loan details retrieved',
      data: {
        loan: loanResult.rows[0],
        repayments: repaymentsResult.rows
      }
    });
    
  } catch (error) {
    console.error('Get loan details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get loan details' 
    });
  }
});

// ==============================================
// REPAY LOAN
// ==============================================
router.post('/repay/:loan_id', protect, async (req, res) => {
  const client = await db.connect();
  
  try {
    const userId = req.user.userId;
    const { loan_id } = req.params;
    const { amount, epin } = req.body;
    
    // TODO: Implement loan repayment
    // Steps needed:
    // 1. Verify ePin
    // 2. Get loan details
    // 3. Check user wallet balance
    // 4. Validate repayment amount
    // 5. Begin transaction
    // 6. Deduct from wallet
    // 7. Update loan remaining_amount
    // 8. Create loan_repayments record
    // 9. Create transaction record
    // 10. If fully paid, update loan status to 'completed'
    // 11. Commit transaction
    
    await client.query('BEGIN');
    
    res.json({ 
      success: true, 
      message: 'Loan repayment - To be implemented',
      data: {
        // repayment_id: 'generated-id',
        // amount: 856.07,
        // remaining_balance: 9143.93,
        // payment_date: new Date()
      }
    });
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Loan repayment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to repay loan' 
    });
  } finally {
    client.release();
  }
});

export default router;