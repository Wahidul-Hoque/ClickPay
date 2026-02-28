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
      await client.query('BEGIN');

      // STEP 1: Verify sender's ePin
      const epinResult = await client.query(
        'SELECT epin_hash FROM users WHERE user_id = $1',
        [fromUserId]
      );
      if (epinResult.rows.length === 0) throw new Error('User not found');

      const isValidEpin = await comparePassword(epin, epinResult.rows[0].epin_hash);
      if (!isValidEpin) throw new Error('Invalid ePin');

      // STEP 2: Get sender's wallet
      const senderWalletResult = await client.query(
        `SELECT wallet_id, balance, status, user_id
         FROM wallets
         WHERE user_id = $1 AND wallet_type IN ('user', 'agent')`,
        [fromUserId]
      );
      if (senderWalletResult.rows.length === 0) throw new Error('Sender wallet not found');

      const senderWallet = senderWalletResult.rows[0];
      if (senderWallet.status !== 'active') throw new Error('Your wallet is not active');

      const currentBalance = parseFloat(senderWallet.balance);
      if (currentBalance < parseFloat(amount)) {
        throw new Error(`Insufficient balance. You have ৳${currentBalance.toFixed(2)}`);
      }

      // STEP 3: Get receiver's wallet
      const receiverWalletResult = await client.query(
        `SELECT w.wallet_id, w.status, u.name, u.user_id FROM wallets w
         JOIN users u ON w.user_id = u.user_id
         WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent')`,
        [toPhone]
      );
      if (receiverWalletResult.rows.length === 0) {
        throw new Error('Receiver not found with this phone number');
      }

      const receiverWallet = receiverWalletResult.rows[0];
      if (receiverWallet.user_id === fromUserId) throw new Error('Cannot send money to yourself');
      if (receiverWallet.status !== 'active') throw new Error('Receiver wallet is not active');

      // STEP 4: Create transaction record
      const reference = `TXN-${Date.now()}`;
      const transactionResult = await client.query(
        `INSERT INTO transactions
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [senderWallet.wallet_id, receiverWallet.wallet_id, amount, 'transfer', 'completed', reference]
      );
      const txnIdResult = await client.query('SELECT LASTVAL() as id');
      const transactionId = txnIdResult.rows[0].id;
      const transactionData = await client.query('SELECT created_at FROM transactions WHERE transaction_id = $1', [transactionId]);

      // STEP 5: Deduct from sender
      await client.query(
        `UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2`,
        [amount, senderWallet.wallet_id]
      );
      const balanceFetch = await client.query('SELECT balance FROM wallets WHERE wallet_id = $1', [senderWallet.wallet_id]);
      const newSenderBalance = parseFloat(balanceFetch.rows[0].balance);

      // STEP 6: Add to receiver
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`,
        [amount, receiverWallet.wallet_id]
      );

      // STEP 7: Log event
      await client.query(
        `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
         VALUES ($1, $2, $3, $4)`,
        [transactionId, 'transfer_completed', 'success', `Money sent to ${receiverWallet.name}`]
      );

      await client.query('COMMIT');

      return {
        transaction_id: transactionId,
        reference,
        amount: parseFloat(amount),
        to: receiverWallet.name,
        to_phone: toPhone,
        new_balance: newSenderBalance,
        date: transactionData.rows[0].created_at
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==============================================
  // GET TRANSACTION HISTORY
  // ==============================================
  async getHistory(userId, page = 1, limit = 10) {
    // Get paginated transaction history where the user is either sender or receiver
  }

  // ==============================================
  // GET TRANSACTION DETAILS
  // ==============================================
  // Get full details of a single transaction (must be a party to it)
  async getTransactionDetails(transactionId, userId) {
    // Fetch transaction details, including from/to wallet info, and ensure the user is either sender or receiver
  }

  // ==============================================
  // REQUEST MONEY
  // ==============================================
  // Requester asks a recipient (by phone) to pay them
  async requestMoney(requesterUserId, recipientPhone, amount, message) {
    try {
      // Get requester wallet
      const requesterWalletResult = await query(
        `SELECT wallet_id FROM wallets
         WHERE user_id = $1 AND wallet_type IN ('user', 'agent')`,
        [requesterUserId]
      );
      if (requesterWalletResult.rows.length === 0) throw new Error('Your wallet not found');

      const requesterWalletId = requesterWalletResult.rows[0].wallet_id;

      // Get requestee (recipient) by phone
      const requesteeResult = await query(
        `SELECT u.user_id, u.name, w.wallet_id
         FROM users u
         JOIN wallets w ON u.user_id = w.user_id
         WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent')`,
        [recipientPhone]
      );
      if (requesteeResult.rows.length === 0) {
        throw new Error('Recipient not found with this phone number');
      }

      const requestee = requesteeResult.rows[0];
      if (requestee.user_id === requesterUserId) {
        throw new Error('Cannot request money from yourself');
      }

      // Set expiry 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await query(
        `INSERT INTO money_requests (requester_user_id, requester_wallet_id, requestee_user_id, requestee_wallet_id, amount, message, expires_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'requested')`,
        [requesterUserId, requesterWalletId, requestee.user_id, requestee.wallet_id, amount, message || null, expiresAt]
      );

      // Manual Fetch
      const reqIdRes = await query('SELECT LASTVAL() as id');
      const requestId = reqIdRes.rows[0].id;
      const finalRequestResult = await query('SELECT * FROM money_requests WHERE request_id = $1', [requestId]);

      return {
        ...finalRequestResult.rows[0],
        requestee_name: requestee.name,
        requestee_phone: recipientPhone
      };
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // GET INCOMING REQUESTS
  // ==============================================
  // Requests where the current user is the PAYER (requestee_user_id = userId)
  async getIncomingRequests(userId) {
    try {
      const result = await query(
        `SELECT
           mr.*,
           u.name  AS requester_name,
           u.phone AS requester_phone
         FROM money_requests mr
         JOIN users u ON mr.requester_user_id = u.user_id
         WHERE mr.requestee_user_id = $1
           AND mr.status = 'requested'
         ORDER BY mr.created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // GET SENT REQUESTS
  // ==============================================
  // Requests the current user created (requester_user_id = userId)
  async getSentRequests(userId) {
    try {
      const result = await query(
        `SELECT
           mr.*,
           u.name  AS requestee_name,
           u.phone AS requestee_phone
         FROM money_requests mr
         JOIN users u ON mr.requestee_user_id = u.user_id
         WHERE mr.requester_user_id = $1
         ORDER BY mr.created_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // APPROVE / PAY A REQUEST
  // ==============================================
  // The requestee (payer) pays the pending request
  async approveRequest(requestId, payerUserId, epin) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // STEP 1: Fetch the request
      const reqResult = await client.query(
        `SELECT * FROM money_requests WHERE request_id = $1 FOR UPDATE`,
        [requestId]
      );
      if (reqResult.rows.length === 0) throw new Error('Money request not found');

      const moneyRequest = reqResult.rows[0];

      // STEP 2: Validate the payer is the correct requestee
      if (moneyRequest.requestee_user_id !== payerUserId) {
        throw new Error('You are not authorised to pay this request');
      }
      if (moneyRequest.status !== 'requested') {
        throw new Error(`Request is already ${moneyRequest.status}`);
      }
      if (moneyRequest.expires_at && new Date(moneyRequest.expires_at) < new Date()) {
        throw new Error('This money request has expired');
      }

      // STEP 3: Verify ePin
      const epinResult = await client.query(
        'SELECT epin_hash FROM users WHERE user_id = $1',
        [payerUserId]
      );
      const isValidEpin = await comparePassword(epin, epinResult.rows[0].epin_hash);
      if (!isValidEpin) throw new Error('Invalid ePin');

      // STEP 4: Get payer wallet and check balance
      const payerWalletResult = await client.query(
        `SELECT wallet_id, balance, status FROM wallets
         WHERE wallet_id = $1 FOR UPDATE`,
        [moneyRequest.requestee_wallet_id]
      );
      if (payerWalletResult.rows.length === 0) throw new Error('Payer wallet not found');

      const payerWallet = payerWalletResult.rows[0];
      if (payerWallet.status !== 'active') throw new Error('Your wallet is not active');

      const payerBalance = parseFloat(payerWallet.balance);
      const requestAmount = parseFloat(moneyRequest.amount);
      if (payerBalance < requestAmount) {
        throw new Error(`Insufficient balance. You have ৳${payerBalance.toFixed(2)}`);
      }

      // STEP 5: Create the actual transaction
      const reference = `REQ-${Date.now()}`;
      await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'request_payment', 'completed', $4)`,
        [moneyRequest.requestee_wallet_id, moneyRequest.requester_wallet_id, requestAmount, reference]
      );

      const txnIdRes = await client.query('SELECT LASTVAL() as id');
      const transactionId = txnIdRes.rows[0].id;
      const txnData = await client.query('SELECT created_at FROM transactions WHERE transaction_id = $1', [transactionId]);

      // STEP 6: Deduct from payer
      await client.query(
        `UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2`,
        [requestAmount, moneyRequest.requestee_wallet_id]
      );

      // STEP 7: Credit requester
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2`,
        [requestAmount, moneyRequest.requester_wallet_id]
      );

      // STEP 8: Update request status → 'paid'
      await client.query(
        `UPDATE money_requests
         SET status = 'paid', paid_transaction_id = $1
         WHERE request_id = $2`,
        [transactionId, requestId]
      );

      // STEP 9: Log event
      await client.query(
        `INSERT INTO transaction_events (transaction_id, event_type, event_status, details)
         VALUES ($1, 'request_paid', 'success', $2)`,
        [transactionId, `Request #${requestId} paid`]
      );

      await client.query('COMMIT');

      return {
        transaction_id: transactionId,
        reference,
        amount: requestAmount,
        request_id: requestId,
        date: txnData.rows[0].created_at
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ==============================================
  // UPDATE REQUEST STATUS (decline / cancel)
  // ==============================================
  async updateRequestStatus(requestId, userId, status) {
    try {
      await query(`UPDATE money_requests SET status = $1 WHERE request_id = $2`, [status, requestId]);
      const result = await query('SELECT * FROM money_requests WHERE request_id = $1', [requestId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // CASH IN (Agent → User)
  // ==============================================
  // Agent deposits physical cash into a user's wallet
 async cashIn(agentUserId, userPhone, amount, agentEpin) {
    // This function allows an agent to cash in money into a user's wallet. The agent must provide their ePin for authentication.
  }
  // ==============================================
  // CASH OUT (User → Agent, with 1.5% fee)
  // ==============================================
  // User withdraws cash through an agent; agent earns 1.5% fee
  async cashOut(userId, agentPhone, amount, userEpin) {
    // This function allows a user to cash out money through an agent. The user must provide their ePin for authentication. The agent receives the cash and earns a 1.5% fee on the transaction.
  }
}

// Export a single instance
export default new TransactionService();
