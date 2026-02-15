// ==============================================
// TRANSACTION SERVICE (The Kitchen - Business Logic)
// ==============================================
// This file contains all transaction-related database operations
// All SQL queries for transactions are written here

import { query, getClient } from '../config/database.js';
import { comparePassword } from '../middleware/auth.js';

class TransactionService {
  // ==============================================
  // SEND MONEY
  // ==============================================
  // Transfers money from one wallet to another
  async sendMoney(fromUserId, toPhone, amount, epin) {
    const client = await getClient();
    
    try {
      // START TRANSACTION
      await client.query('BEGIN');

      // STEP 1: Verify sender's ePin
      const epinQuery = 'SELECT epin_hash FROM users WHERE user_id = $1';
      const epinResult = await client.query(epinQuery, [fromUserId]);
      
      if (epinResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const isValidEpin = await comparePassword(epin, epinResult.rows[0].epin_hash);
      if (!isValidEpin) {
        throw new Error('Invalid ePin');
      }

      // STEP 2: Get sender's wallet
      const senderWalletQuery = `
        SELECT wallet_id, balance, status, user_id
        FROM wallets 
        WHERE user_id = $1 AND wallet_type IN ('user', 'agent')
      `;
      
      const senderWalletResult = await client.query(senderWalletQuery, [fromUserId]);
      
      if (senderWalletResult.rows.length === 0) {
        throw new Error('Sender wallet not found');
      }
      
      const senderWallet = senderWalletResult.rows[0];
      
      if (senderWallet.status !== 'active') {
        throw new Error('Your wallet is not active');
      }

      // STEP 3: Check sufficient balance
      const currentBalance = parseFloat(senderWallet.balance);
      if (currentBalance < parseFloat(amount)) {
        throw new Error(`Insufficient balance. You have ৳${currentBalance.toFixed(2)}`);
      }

      // STEP 4: Get receiver's wallet
      const receiverWalletQuery = `
        SELECT w.wallet_id, w.status, u.name, u.user_id
        FROM wallets w
        JOIN users u ON w.user_id = u.user_id
        WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent')
      `;
      
      const receiverWalletResult = await client.query(receiverWalletQuery, [toPhone]);
      
      if (receiverWalletResult.rows.length === 0) {
        throw new Error('Receiver not found with this phone number');
      }
      
      const receiverWallet = receiverWalletResult.rows[0];
      
      // Check if trying to send to yourself
      if (receiverWallet.user_id === fromUserId) {
        throw new Error('Cannot send money to yourself');
      }
      
      if (receiverWallet.status !== 'active') {
        throw new Error('Receiver wallet is not active');
      }

      // STEP 5: Create transaction record
      const reference = `TXN-${Date.now()}`;
      const createTransactionQuery = `
        INSERT INTO transactions 
          (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING transaction_id, created_at
      `;
      
      const transactionResult = await client.query(createTransactionQuery, [
        senderWallet.wallet_id,
        receiverWallet.wallet_id,
        amount,
        'transfer',
        'completed',
        reference
      ]);
      
      const transaction = transactionResult.rows[0];

      // STEP 6: Deduct from sender's wallet
      const deductQuery = `
        UPDATE wallets 
        SET balance = balance - $1 
        WHERE wallet_id = $2
        RETURNING balance
      `;
      
      const deductResult = await client.query(deductQuery, [
        amount,
        senderWallet.wallet_id
      ]);
      
      const newSenderBalance = parseFloat(deductResult.rows[0].balance);

      // STEP 7: Add to receiver's wallet
      const addQuery = `
        UPDATE wallets 
        SET balance = balance + $1 
        WHERE wallet_id = $2
      `;
      
      await client.query(addQuery, [amount, receiverWallet.wallet_id]);

      // STEP 8: Create transaction event log
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

      // COMMIT TRANSACTION
      await client.query('COMMIT');

      // Return transaction details
      return {
        transaction_id: transaction.transaction_id,
        reference: reference,
        amount: parseFloat(amount),
        to: receiverWallet.name,
        to_phone: toPhone,
        new_balance: newSenderBalance,
        date: transaction.created_at
      };

    } catch (error) {
      // ROLLBACK if anything fails
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Always release the client
      client.release();
    }
  }

  // ==============================================
  // GET TRANSACTION HISTORY
  // ==============================================
  // Retrieves user's transaction history with pagination
  async getHistory(userId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      // Get transactions
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

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM transactions t
        JOIN wallets sender_wallet ON t.from_wallet_id = sender_wallet.wallet_id
        JOIN wallets receiver_wallet ON t.to_wallet_id = receiver_wallet.wallet_id
        WHERE sender_wallet.user_id = $1 OR receiver_wallet.user_id = $1
      `;
      
      const countResult = await query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].total);

      return {
        transactions: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // TODO: ADD MORE TRANSACTION METHODS
  // ==============================================
  // Add methods for:
  // - requestMoney()
  // - cashIn() (for agents)
  // - cashOut()
  // Follow the same pattern as sendMoney()
}

// Export a single instance
export default new TransactionService();
