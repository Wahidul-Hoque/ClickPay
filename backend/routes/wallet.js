// ==============================================
// WALLET MANAGEMENT ROUTES
// ==============================================
// This file handles wallet-related operations:
// 1. GET /api/v1/wallet/balance - Get wallet balance
// 2. POST /api/v1/wallet/topup - Add money from external source
// 3. GET /api/v1/wallet/payment-methods - Get linked payment methods
// 4. POST /api/v1/wallet/payment-methods - Add new payment method

import express from 'express';
import { query, db } from '../config/db.js';
import { protect } from '../utils/auth.js';

const router = express.Router();

// ==============================================
// GET WALLET BALANCE
// ==============================================
router.get('/balance', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // TODO: Implement this route
    // Steps needed:
    // 1. Query wallets table for user's wallet
    // 2. Return balance and wallet details
    
    const result = await query(
      `SELECT wallet_id, wallet_type, balance, status 
       FROM wallets 
       WHERE user_id = $1 AND wallet_type IN ('user', 'agent')`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wallet not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Balance retrieved',
      data: {
        balance: parseFloat(result.rows[0].balance),
        wallet_type: result.rows[0].wallet_type,
        status: result.rows[0].status
      }
    });
    
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get balance' 
    });
  }
});

// ==============================================
// EXTERNAL TOP-UP (Add money from bank/card)
// ==============================================
router.post('/topup', protect, async (req, res) => {
  // TODO: Implement external top-up
  // Steps needed:
  // 1. Validate input (payment_method_id, amount)
  // 2. Get payment method details
  // 3. Integrate with payment gateway (Stripe/SSLCommerz)
  // 4. Create external_topup record
  // 5. On success, add money to wallet
  // 6. Create transaction record
  // 7. Return success response
  
  res.json({ 
    success: true, 
    message: 'External top-up - To be implemented' 
  });
});

// ==============================================
// GET PAYMENT METHODS
// ==============================================
router.get('/payment-methods', protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // TODO: Implement this route
    // Steps needed:
    // 1. Query payment_methods table
    // 2. Return list of user's payment methods
    // 3. Don't return sensitive data (full card number, etc.)
    
    const result = await query(
      `SELECT 
        payment_method_id, 
        type, 
        provider, 
        masked_identifier, 
        status, 
        created_at
       FROM payment_methods 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Payment methods retrieved',
      data: result.rows
    });
    
  } catch (error) {
    console.error('Payment methods error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get payment methods' 
    });
  }
});

// ==============================================
// ADD PAYMENT METHOD
// ==============================================
router.post('/payment-methods', protect, async (req, res) => {
  // TODO: Implement add payment method
  // Steps needed:
  // 1. Validate input (type, provider, account_number, etc.)
  // 2. Verify with payment provider (optional)
  // 3. Tokenize sensitive data
  // 4. Create masked identifier (e.g., **** **** **** 1234)
  // 5. Insert into payment_methods table
  // 6. Return payment method details
  
  res.json({ 
    success: true, 
    message: 'Add payment method - To be implemented' 
  });
});

export default router;
