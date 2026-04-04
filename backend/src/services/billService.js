// BILL SERVICE (The Kitchen)
//   BEGIN → lock wallet → verify ePin → deduct → record → COMMIT

import { query, getClient } from '../config/database.js';
import { comparePassword } from '../middleware/auth.js';
import { logEvent, recordFailure, verifyUserLimits } from '../utils/dbHelpers.js';

// ──────────────────────────────────────────────────────────────
// BILL SERVICE CLASS
// ──────────────────────────────────────────────────────────────

class BillService {
//get all billers
  async getBillers() {
    const result = await query(
      `SELECT biller_id, name, category, status
       FROM billers
       WHERE status = 'active'
       ORDER BY category, name`
    );
    return result.rows;
  }
// get billers by category
  async getBillersByCategory(category) {
    const result = await query(
      `SELECT biller_id, name, category, status
       FROM billers
       WHERE status = 'active' AND category = $1
       ORDER BY name`,
      [category]
    );
    return result.rows;
  }

  // PAY A BILL
  //   1. Verify ePin
  //   2. Check biller exists
  //   3. Lock wallet & check balance
  //   4. Create transaction record (with user-provided reference)
  //   5. Deduct from wallet
  //   6. Record in bill_payments
  //   7. COMMIT
  async payBill(userId, billerId, amount, epin, reference) {
    const client = await getClient();
    let transactionId = null;

    try {
      await client.query('BEGIN');

      // ── Step 1: Get user's wallet (locked) ──────────────────
      const walletRes = await client.query(
        `SELECT w.wallet_id, w.balance, w.status
         FROM wallets w
         WHERE w.user_id = $1
         FOR UPDATE`,
        [userId]
      );
      if (walletRes.rows.length === 0) throw new Error('Wallet not found');
      const wallet = walletRes.rows[0];

      if (wallet.status !== 'active') {
        throw new Error('Your wallet is not active');
      }

      // ── Step 2: Verify ePin ─────────────────────────────────
      const epinRow = await client.query('SELECT fn_get_epin_hash($1) as epin_hash', [userId]);
      const isValid = await comparePassword(epin, epinRow.rows[0].epin_hash);
      if (!isValid) throw new Error('Invalid ePin');

      // ── Step 3: Verify biller exists and is active ──────────
      const billerRes = await client.query(
        'SELECT biller_id, name, category FROM billers WHERE biller_id = $1 AND status = $2',
        [billerId, 'active']
      );
      if (billerRes.rows.length === 0) {
        throw new Error('Biller not found or inactive');
      }
      const biller = billerRes.rows[0];

      // ── Step 4: Check sufficient balance ────────────────────
      const payAmount = parseFloat(amount);
      if (parseFloat(wallet.balance) < payAmount) {
        throw new Error(
          `Insufficient balance. Available: ৳${parseFloat(wallet.balance).toFixed(2)}`
        );
      }

      // ── Step 4.5: Check Daily & Monthly Limits ───────────────
      if (biller.category === 'mobile') {
        await verifyUserLimits(client, userId, wallet.wallet_id, 'mobile_recharge', amount);
      }

      // ── Step 5: Create transaction record (initiated) ───────
      const txnRes = await client.query(
        `INSERT INTO transactions
           (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $1, $2, 'bill_payment', 'initiated', $3)
         RETURNING transaction_id, created_at`,
        [wallet.wallet_id, payAmount, reference]
      );
      transactionId = txnRes.rows[0].transaction_id;
      const createdAt = txnRes.rows[0].created_at;

      await logEvent(client, transactionId, 'initiated', 'info',
        `Bill payment of ৳${payAmount} to ${biller.name} initiated`);
      await logEvent(client, transactionId, 'epin_verified', 'info', 'User ePin verified');

      // ── Step 6: Deduct from wallet ──────────────────────────
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2',
        [payAmount, wallet.wallet_id]
      );
      const newBalanceRow = await client.query(
        'SELECT balance FROM wallets WHERE wallet_id = $1',
        [wallet.wallet_id]
      );
      const newBalance = parseFloat(newBalanceRow.rows[0].balance);

      await logEvent(client, transactionId, 'amount_deducted', 'info',
        `৳${payAmount} deducted. New balance: ৳${newBalance.toFixed(2)}`);

      // ── Step 7: Record in bill_payments table ───────────────
      const providerRef = `${biller.category.toUpperCase()}-${biller.biller_id}-${Date.now()}`;
      const billRes = await client.query(
        `INSERT INTO bill_payments
           (wallet_id, biller_id, transaction_id, amount, provider_reference, status)
         VALUES ($1, $2, $3, $4, $5, 'completed')
         RETURNING bill_payment_id`,
        [wallet.wallet_id, billerId, transactionId, payAmount, providerRef]
      );

      await logEvent(client, transactionId, 'bill_recorded', 'info',
        `Bill payment recorded. Provider ref: ${providerRef}`);

      // ── Step 8: Mark transaction as completed ───────────────
      await client.query(
        `UPDATE transactions SET status = 'completed' WHERE transaction_id = $1`,
        [transactionId]
      );

      await logEvent(client, transactionId, 'completed', 'success',
        `Bill payment of ৳${payAmount} to ${biller.name} completed`);

      await client.query('COMMIT');

      return {
        bill_payment_id: billRes.rows[0].bill_payment_id,
        transaction_id: transactionId,
        reference,
        provider_reference: providerRef,
        biller_name: biller.name,
        biller_category: biller.category,
        amount: payAmount,
        new_balance: newBalance,
        date: createdAt,
      };

    } catch (error) {
      await client.query('ROLLBACK');
      await recordFailure(transactionId, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // GET BILL PAYMENT HISTORY
  // ============================================================
  async getHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    // Count total
    const countRes = await query(
      `SELECT COUNT(*) AS total
       FROM bill_payments bp
       JOIN wallets w ON bp.wallet_id = w.wallet_id
       WHERE w.user_id = $1`,
      [userId]
    );
    const total = parseInt(countRes.rows[0].total);

    // Fetch paginated records
    const result = await query(
      `SELECT
         bp.bill_payment_id,
         bp.amount,
         bp.provider_reference,
         bp.status,
         bp.created_at,
         b.name AS biller_name,
         b.category AS biller_category,
         t.reference AS transaction_reference,
         t.status AS transaction_status
       FROM bill_payments bp
       JOIN billers b ON bp.biller_id = b.biller_id
       JOIN wallets w ON bp.wallet_id = w.wallet_id
       LEFT JOIN transactions t ON bp.transaction_id = t.transaction_id
       WHERE w.user_id = $1
       ORDER BY bp.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      payments: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new BillService();