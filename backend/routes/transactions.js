// ==============================================
// TRANSACTION ROUTES
// ==============================================
// This file handles all money transfer operations:
// 1. POST /api/v1/transactions/send - Send money to another user
// 2. GET /api/v1/transactions/history - Get transaction history
// 3. POST /api/v1/transactions/request - Request money (TODO)
// 4. POST /api/v1/transactions/cash-in - Cash in (agents only) (TODO)
// 5. POST /api/v1/transactions/cash-out - Cash out (TODO)

import express from 'express';
import { query, db } from '../config/db.js';
import { protect, comparePassword, authorizeRole } from '../utils/auth.js';

const router = express.Router();

// ==============================================
// ROUTE 1: SEND MONEY
// ==============================================
// Method: POST
// URL: /api/v1/transactions/send
// Headers: Authorization: Bearer <token>
// Body: { toPhone, amount, epin }
// Response: { success, message, data: transaction }

router.post('/send', protect, async (req, res) => {
  
  // Get database client for transaction
  const client = await db.connect();
  
  try {
    // ==========================================
    // STEP 1: EXTRACT DATA FROM REQUEST
    // ==========================================
    const { toPhone, amount, epin } = req.body;
    const fromUserId = req.user.userId;  // From JWT token
    
    // ==========================================
    // STEP 2: VALIDATE INPUT DATA
    // ==========================================
    
    // Check required fields
    if (!toPhone || !amount || !epin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number, amount, and ePin are required' 
      });
    }
    
    // Validate amount (must be positive number)
    const transferAmount = parseFloat(amount);
    if (transferAmount <= 0 || isNaN(transferAmount)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      });
    }
    
    // Validate ePin format
    if (epin.length !== 5 || !/^\d+$/.test(epin)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid ePin format' 
      });
    }
    
    // ==========================================
    // STEP 3: START DATABASE TRANSACTION
    // ==========================================
    await client.query('BEGIN');
    
    // ==========================================
    // STEP 4: VERIFY SENDER'S EPIN
    // ==========================================
    const epinQuery = 'SELECT epin_hash FROM users WHERE user_id = $1';
    const epinResult = await client.query(epinQuery, [fromUserId]);
    
    if (epinResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const isValidEpin = await comparePassword(epin, epinResult.rows[0].epin_hash);
    
    if (!isValidEpin) {
      await client.query('ROLLBACK');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid ePin' 
      });
    }
    
    // ==========================================
    // STEP 5: GET SENDER'S WALLET
    // ==========================================
    const senderWalletQuery = `
      SELECT wallet_id, balance, status 
      FROM wallets 
      WHERE user_id = $1 AND wallet_type IN ('user', 'agent')
    `;
    
    const senderWalletResult = await client.query(senderWalletQuery, [fromUserId]);
    
    if (senderWalletResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Sender wallet not found' 
      });
    }
    
    const senderWallet = senderWalletResult.rows[0];
    
    // Check if wallet is active
    if (senderWallet.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        success: false, 
        message: 'Your wallet is not active' 
      });
    }
    
    // ==========================================
    // STEP 6: CHECK SUFFICIENT BALANCE
    // ==========================================
    const currentBalance = parseFloat(senderWallet.balance);
    
    if (currentBalance < transferAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. You have ৳${currentBalance.toFixed(2)}` 
      });
    }
    
    // ==========================================
    // STEP 7: GET RECEIVER'S WALLET
    // ==========================================
    const receiverWalletQuery = `
      SELECT w.wallet_id, w.status, u.name, u.user_id
      FROM wallets w
      JOIN users u ON w.user_id = u.user_id
      WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent')
    `;
    
    const receiverWalletResult = await client.query(receiverWalletQuery, [toPhone]);
    
    if (receiverWalletResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Receiver not found with this phone number' 
      });
    }
    
    const receiverWallet = receiverWalletResult.rows[0];
    
    // Check if trying to send to yourself
    if (receiverWallet.user_id === fromUserId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot send money to yourself' 
      });
    }
    
    // Check if receiver's wallet is active
    if (receiverWallet.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        success: false, 
        message: 'Receiver wallet is not active' 
      });
    }
    
    // ==========================================
    // STEP 8: CREATE TRANSACTION RECORD
    // ==========================================
    const createTransactionQuery = `
      INSERT INTO transactions 
        (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING transaction_id, created_at
    `;
    
    const reference = `TXN-${Date.now()}`; // Generate unique reference
    
    const transactionResult = await client.query(createTransactionQuery, [
      senderWallet.wallet_id,
      receiverWallet.wallet_id,
      transferAmount,
      'transfer',      // Transaction type
      'completed',     // Transaction status
      reference
    ]);
    
    const transaction = transactionResult.rows[0];
    
    // ==========================================
    // STEP 9: DEDUCT FROM SENDER'S WALLET
    // ==========================================
    const deductQuery = `
      UPDATE wallets 
      SET balance = balance - $1 
      WHERE wallet_id = $2
      RETURNING balance
    `;
    
    const deductResult = await client.query(deductQuery, [
      transferAmount,
      senderWallet.wallet_id
    ]);
    
    const newSenderBalance = parseFloat(deductResult.rows[0].balance);
    
    // ==========================================
    // STEP 10: ADD TO RECEIVER'S WALLET
    // ==========================================
    const addQuery = `
      UPDATE wallets 
      SET balance = balance + $1 
      WHERE wallet_id = $2
      RETURNING balance
    `;
    
    await client.query(addQuery, [
      transferAmount,
      receiverWallet.wallet_id
    ]);
    
    // ==========================================
    // STEP 11: CREATE TRANSACTION EVENT LOG
    // ==========================================
    // This helps with auditing and tracking
    const eventQuery = `
      INSERT INTO transaction_events 
        (transaction_id, event_type, event_status, details)
      VALUES ($1, $2, $3, $4)
    `;
    
    await client.query(eventQuery, [
      transaction.transaction_id,
      'transfer_completed',
      'success',
      `Money sent to ${receiverWallet.name}`
    ]);
    
    // ==========================================
    // STEP 12: COMMIT TRANSACTION
    // ==========================================
    // All queries succeeded, save changes permanently
    await client.query('COMMIT');
    
    // ==========================================
    // STEP 13: SEND SUCCESS RESPONSE
    // ==========================================
    res.json({
      success: true,
      message: 'Money sent successfully',
      data: {
        transaction_id: transaction.transaction_id,
        reference: reference,
        amount: transferAmount,
        to: receiverWallet.name,
        to_phone: toPhone,
        new_balance: newSenderBalance,
        date: transaction.created_at
      }
    });
    
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    await client.query('ROLLBACK');
    console.error('Send money error:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send money. Please try again.' 
    });
    
  } finally {
    // Always release the database client
    client.release();
  }
});

// ==============================================
// ROUTE 2: GET TRANSACTION HISTORY
// ==============================================
// Method: GET
// URL: /api/v1/transactions/history?page=1&limit=10
// Headers: Authorization: Bearer <token>
// Response: { success, message, data: transactions[] }

router.get('/history', protect, async (req, res) => {
  try {
    // ==========================================
    // STEP 1: GET USER ID AND PAGINATION PARAMS
    // ==========================================
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // ==========================================
    // STEP 2: GET TRANSACTION HISTORY
    // ==========================================
    // Get transactions where user is either sender or receiver
    const historyQuery = `
      SELECT 
        t.transaction_id,
        t.amount,
        t.transaction_type,
        t.status,
        t.reference,
        t.created_at,
        sender_user.name as sender_name,
        sender_user.phone as sender_phone,
        receiver_user.name as receiver_name,
        receiver_user.phone as receiver_phone,
        CASE 
          WHEN sender_wallet.user_id = $1 THEN 'debit'
          ELSE 'credit'
        END as transaction_direction
      FROM transactions t
      JOIN wallets sender_wallet ON t.from_wallet_id = sender_wallet.wallet_id
      JOIN wallets receiver_wallet ON t.to_wallet_id = receiver_wallet.wallet_id
      JOIN users sender_user ON sender_wallet.user_id = sender_user.user_id
      JOIN users receiver_user ON receiver_wallet.user_id = receiver_user.user_id
      WHERE sender_wallet.user_id = $1 OR receiver_wallet.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await query(historyQuery, [userId, limit, offset]);
    
    // ==========================================
    // STEP 3: GET TOTAL COUNT FOR PAGINATION
    // ==========================================
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      JOIN wallets sender_wallet ON t.from_wallet_id = sender_wallet.wallet_id
      JOIN wallets receiver_wallet ON t.to_wallet_id = receiver_wallet.wallet_id
      WHERE sender_wallet.user_id = $1 OR receiver_wallet.user_id = $1
    `;
    
    const countResult = await query(countQuery, [userId]);
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
        page: page,
        limit: limit,
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
// PLACEHOLDER ROUTES - TO BE IMPLEMENTED
// ==============================================
// These are skeleton routes for features you'll implement later
// Each has comments showing what needs to be done

// ==========================================
// REQUEST MONEY
// ==========================================
router.post('/request', protect, async (req, res) => {
  // TODO: Implement money request feature
  // Steps needed:
  // 1. Validate input (fromPhone, amount, message)
  // 2. Find requestee by phone
  // 3. Create money_request record in database
  // 4. Set expiry date (optional)
  // 5. Send notification (optional)
  // 6. Return request details
  
  res.json({ 
    success: true, 
    message: 'Request money - To be implemented' 
  });
});

// ==========================================
// CASH IN (AGENTS ONLY)
// ==========================================
router.post('/cash-in', protect, authorizeRole('agent'), async (req, res) => {
  // TODO: Implement cash-in feature for agents
  // Steps needed:
  // 1. Validate input (userPhone, amount, agentEpin)
  // 2. Verify agent's ePin
  // 3. Find user's wallet
  // 4. Create transaction
  // 5. Add money to user's wallet
  // 6. Calculate and record agent fee
  // 7. Return transaction details
  
  res.json({ 
    success: true, 
    message: 'Cash in - To be implemented' 
  });
});

// ==========================================
// CASH OUT
// ==========================================
router.post('/cash-out', protect, async (req, res) => {
  // TODO: Implement cash-out feature
  // Steps needed:
  // 1. Validate input (agentPhone, amount, userEpin)
  // 2. Verify user's ePin
  // 3. Check user balance
  // 4. Find agent's wallet
  // 5. Create transaction
  // 6. Deduct from user, add to agent
  // 7. Calculate and record agent fee
  // 8. Return transaction details
  
  res.json({ 
    success: true, 
    message: 'Cash out - To be implemented' 
  });
});

// Export router
export default router;
