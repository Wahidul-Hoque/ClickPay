// ==============================================
// SEND MONEY ROUTE
// ==============================================
// This file handles sending money to another user
// POST /api/v1/send - Send money to another user

import express from 'express';
import { query, db } from '../config/db.js';
import { protect, comparePassword } from '../utils/auth.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// ==============================================
// SEND MONEY
// ==============================================
router.post('/', protect, async (req, res) => {
  const client = await db.connect();
  
  try {
    // ==========================================
    // STEP 1: GET DATA FROM REQUEST
    // ==========================================
    const senderId = req.user.userId; // From JWT token
    const { toPhone, amount, epin } = req.body;
    
    // ==========================================
    // STEP 2: INPUT VALIDATION
    // ==========================================
    if (!toPhone || !amount || !epin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: toPhone, amount, epin' 
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      });
    }
    
    // ==========================================
    // STEP 3: VERIFY SENDER'S EPIN
    // ==========================================
    const senderResult = await query(
      'SELECT user_id, epin_hash, name FROM users WHERE user_id = $1',
      [senderId]
    );
    
    const epinValid = await comparePassword(epin, senderResult.rows[0].epin_hash);
    
    if (!epinValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid ePin' 
      });
    }
    
    // ==========================================
    // STEP 4: GET SENDER'S WALLET
    // ==========================================
    const senderWalletResult = await query(
      `SELECT wallet_id, balance, status 
       FROM wallets 
       WHERE user_id = $1 AND wallet_type = 'personal'`,
      [senderId]
    );
    
    if (senderWalletResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sender wallet not found' 
      });
    }
    
    const senderWallet = senderWalletResult.rows[0];
    
    if (senderWallet.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your wallet is not active' 
      });
    }
    
    // ==========================================
    // STEP 5: CHECK SUFFICIENT BALANCE
    // ==========================================
    if (parseFloat(senderWallet.balance) < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }
    
    // ==========================================
    // STEP 6: FIND RECEIVER BY PHONE
    // ==========================================
    const receiverResult = await query(
      'SELECT user_id, name FROM users WHERE phone = $1',
      [toPhone]
    );
    
    if (receiverResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Recipient not found with this phone number' 
      });
    }
    
    const receiverId = receiverResult.rows[0].user_id;
    const receiverName = receiverResult.rows[0].name;
    
    // Prevent sending to self
    if (senderId === receiverId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot send money to yourself' 
      });
    }
    
    // ==========================================
    // STEP 7: GET RECEIVER'S WALLET
    // ==========================================
    const receiverWalletResult = await query(
      `SELECT wallet_id, status 
       FROM wallets 
       WHERE user_id = $1 AND wallet_type = 'personal'`,
      [receiverId]
    );
    
    if (receiverWalletResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Recipient wallet not found' 
      });
    }
    
    const receiverWallet = receiverWalletResult.rows[0];
    
    if (receiverWallet.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Recipient wallet is not active' 
      });
    }
    
    // ==========================================
    // STEP 8: BEGIN DATABASE TRANSACTION
    // ==========================================
    await client.query('BEGIN');
    
    // ==========================================
    // STEP 9: CREATE TRANSACTION RECORD
    // ==========================================
    const transactionResult = await client.query(
      `INSERT INTO transactions (
        user_id, 
        transaction_type, 
        amount, 
        status, 
        description
      ) VALUES ($1, $2, $3, $4, $5) 
      RETURNING transaction_id, created_at`,
      [
        senderId,
        'send_money',
        amount,
        'completed',
        `Money sent to ${receiverName}`
      ]
    );
    
    const transactionId = transactionResult.rows[0].transaction_id;
    
    // ==========================================
    // STEP 10: DEDUCT FROM SENDER'S WALLET
    // ==========================================
    await client.query(
      `UPDATE wallets 
       SET balance = balance - $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE wallet_id = $2`,
      [amount, senderWallet.wallet_id]
    );
    
    // ==========================================
    // STEP 11: ADD TO RECEIVER'S WALLET
    // ==========================================
    await client.query(
      `UPDATE wallets 
       SET balance = balance + $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE wallet_id = $2`,
      [amount, receiverWallet.wallet_id]
    );
    
    // ==========================================
    // STEP 12: CREATE TRANSACTION EVENTS
    // ==========================================
    // Event for sender (debit)
    await client.query(
      `INSERT INTO transaction_events (
        transaction_id, 
        wallet_id, 
        event_type, 
        amount
      ) VALUES ($1, $2, $3, $4)`,
      [transactionId, senderWallet.wallet_id, 'debit', amount]
    );
    
    // Event for receiver (credit)
    await client.query(
      `INSERT INTO transaction_events (
        transaction_id, 
        wallet_id, 
        event_type, 
        amount
      ) VALUES ($1, $2, $3, $4)`,
      [transactionId, receiverWallet.wallet_id, 'credit', amount]
    );
    
    // ==========================================
    // STEP 13: COMPLIANCE CHECK (OPTIONAL)
    // ==========================================
    // Log for monitoring large transactions
    if (amount > 10000) {
      await client.query(
        `INSERT INTO compliance_logs (
          transaction_id, 
          check_type, 
          status, 
          notes
        ) VALUES ($1, $2, $3, $4)`,
        [
          transactionId,
          'transaction_monitoring',
          'flagged',
          `Large transaction: ${amount} BDT`
        ]
      );
    }

    // STEP 14: CREATE NOTIFICATION

    // Notification for sender
    await createNotification(senderId, `You sent ৳${amount} to ${receiverName} (${toPhone})`, client);
    
    // Notification for receiver
    await createNotification(receiverId, `You received ৳${amount} from ${senderResult.rows[0].name}`, client);
    
    // ==========================================
    // STEP 15: COMMIT TRANSACTION
    // ==========================================
    await client.query('COMMIT');
    
    // ==========================================
    // STEP 16: SEND SUCCESS RESPONSE
    // ==========================================
    res.json({
      success: true,
      message: 'Money sent successfully',
      data: {
        transaction_id: transactionId,
        amount: amount,
        recipient: receiverName,
        recipient_phone: toPhone,
        timestamp: transactionResult.rows[0].created_at
      }
    });
    
  } catch (error) {
    // Rollback on any error
    await client.query('ROLLBACK');
    console.error('Send money error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send money. Please try again.' 
    });
  } finally {
    // Always release the client back to the pool
    client.release();
  }
});

export default router;