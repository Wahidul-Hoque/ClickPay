import { query, getClient } from '../config/database.js';
import { comparePassword } from '../middleware/auth.js'; 

class LoanService {
  async getLoanEligibility(userId) {
    const inflowQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_inflow
      FROM (
          SELECT amount FROM external_topups 
          WHERE wallet_id IN (SELECT wallet_id FROM wallets WHERE user_id = $1)
          AND status = 'completed'
          UNION ALL
          SELECT amount FROM transactions 
          WHERE to_wallet_id IN (SELECT wallet_id FROM wallets WHERE user_id = $1)
          AND transaction_type = 'cash_in' 
          AND status = 'completed'
      ) as inflows;
    `;
    const result = await query(inflowQuery, [userId]);
    const totalInflow = parseFloat(result.rows[0].total_inflow);

    let limit = 0;
    if (totalInflow >= 100000) limit = 30000;
    else if (totalInflow >= 50000) limit = 20000;
    else if (totalInflow >= 25000) limit = 10000;
    else if (totalInflow >= 10000) limit = 5000;
    else if (totalInflow >= 2000) limit = 500;

    return { totalInflow, limit };
  }

  async applyForLoan(userId, amount) {
    // Check for existing active loan or pending app
    const existing = await query(
      `SELECT 1 FROM loans WHERE user_id = $1 AND status IN ('active', 'overdue')
       UNION
       SELECT 1 FROM loan_applications WHERE user_id = $1 AND decision_status = 'submitted'`,
      [userId]
    );
    if (existing.rows.length > 0) throw new Error("You already have an active loan or pending request.");

    const { limit } = await this.getLoanEligibility(userId);
    if (amount < 500 || amount > limit) throw new Error("Invalid loan amount.");

    const res = await query(
      `INSERT INTO loan_applications (user_id, requested_amount, interest_rate, term_days, decision_status)
       VALUES ($1, $2, 0.09, 30, 'submitted') RETURNING *`,
      [userId, amount]
    );
    return res.rows[0];
  }

  async repayLoan(userId, loanId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Get Loan and interest details
      const loanRes = await client.query(`SELECT * FROM loans WHERE loan_id = $1 AND user_id = $2 AND status != 'repaid' FOR UPDATE`, [loanId, userId]);
      if (loanRes.rows.length === 0) throw new Error("Loan not found or already repaid.");
      
      const loan = loanRes.rows[0];
      const principal = parseFloat(loan.principal_amount);
      const interest = principal * parseFloat(loan.interest_rate);
      const totalToPay = principal + interest;

      // 2. Validate User Balance
      const userWalletRes = await client.query(`SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND wallet_type = 'user' FOR UPDATE`, [userId]);
      if (parseFloat(userWalletRes.rows[0].balance) < totalToPay) throw new Error("Insufficient balance.");

      // 3. Transactions: User -> System wallets
      // Transaction for Principal
      const t1 = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, (SELECT wallet_id FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'loan'), $2, 'loan_repayment_base', 'completed', $3)
         RETURNING transaction_id`,
        [userWalletRes.rows[0].wallet_id, principal, `Principal for Loan #${loanId}`]
      );
      
      // Transaction for Interest
      await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, (SELECT wallet_id FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'profit'), $2, 'loan_interest', 'completed', $3)`,
        [userWalletRes.rows[0].wallet_id, interest, `Interest for Loan #${loanId}`]
      );

      // 4. Update All Balances
      await client.query(`UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2`, [totalToPay, userWalletRes.rows[0].wallet_id]);
      await client.query(`UPDATE wallets SET balance = balance + $1 WHERE wallet_type = 'system' AND system_purpose = 'loan'`, [principal]);
      await client.query(`UPDATE wallets SET balance = balance + $1 WHERE wallet_type = 'system' AND system_purpose = 'profit'`, [interest]);

      // 5. Close Loan Record
      await client.query(`UPDATE loans SET status = 'repaid', repayment_transaction_id = $1 WHERE loan_id = $2`, [t1.rows[0].transaction_id, loanId]);

      await client.query('COMMIT');
      return { success: true, totalPaid: totalToPay };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getLoanData(userId) {
    const active = await query(`SELECT * FROM loans WHERE user_id = $1 AND status IN ('active', 'overdue') LIMIT 1`, [userId]);
    const latestApp = await query(`SELECT * FROM loan_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`, [userId]);
    const history = await query(
      `SELECT l.*, t.created_at as repaid_at 
       FROM loans l 
       JOIN transactions t ON l.repayment_transaction_id = t.transaction_id
       WHERE l.user_id = $1 AND l.status = 'repaid' 
       ORDER BY t.created_at DESC`, 
      [userId]
    );
    const eligibility = await this.getLoanEligibility(userId);

    return { activeLoan: active.rows[0], latestApplication: latestApp.rows[0], history: history.rows, ...eligibility };
  }

  async getAllApplications(status = 'submitted', limit = null) {
    let sql = `
      SELECT la.*, u.name, u.phone 
      FROM loan_applications la
      JOIN users u ON la.user_id = u.user_id
    `;
    const params = [];
    if (status && status !== 'all') {
      sql += ` WHERE la.decision_status = $1`;
      params.push(status);
    }
    sql += ` ORDER BY la.created_at DESC`;
    if (limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }
    const res = await query(sql, params);
    return res.rows;
  }

  async approveLoan(adminId, applicationId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Get Application
      const appRes = await client.query(
        `SELECT * FROM loan_applications WHERE application_id = $1 AND decision_status = 'submitted' FOR UPDATE`,
        [applicationId]
      );
      if (appRes.rows.length === 0) throw new Error("Application not found or already processed.");
      const app = appRes.rows[0];

      // 2. Check System Loan Wallet Balance
      const sysWalletRes = await client.query(
        `SELECT wallet_id, balance FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'loan' FOR UPDATE`
      );
      if (sysWalletRes.rows.length === 0) throw new Error("System loan wallet not configured.");
      const sysWallet = sysWalletRes.rows[0];

      if (parseFloat(sysWallet.balance) < parseFloat(app.requested_amount)) {
        throw new Error("Insufficient balance in system loan wallet.");
      }

      // 3. Update Application Status
      await client.query(
        `UPDATE loan_applications SET decision_status = 'approved' WHERE application_id = $1`,
        [applicationId]
      );

      // 4. Create Disbursement Transaction
      const transRes = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, (SELECT wallet_id FROM wallets WHERE user_id = $2 AND wallet_type = 'user'), $3, 'loan_disbursement', 'completed', $4)
         RETURNING transaction_id`,
        [sysWallet.wallet_id, app.user_id, app.requested_amount, `Loan Disbursed for App #${applicationId}`]
      );

      // 5. Update Wallets (System - , User +)
      await client.query(`UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2`, [app.requested_amount, sysWallet.wallet_id]);
      await client.query(
        `UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND wallet_type = 'user'`,
        [app.requested_amount, app.user_id]
      );

      // 6. Create Loan Record
      const loanRes = await client.query(
        `INSERT INTO loans (application_id, user_id, principal_amount, interest_rate, disbursed_at, due_at, disbursement_transaction_id, status)
         VALUES ($1, $2, $3, $4, NOW(), NOW() + interval '30 days', $5, 'active') returning loan_id`,
        [applicationId, app.user_id, app.requested_amount, app.interest_rate, transRes.rows[0].transaction_id]
      );
      const loanId = loanRes.rows[0].loan_id;

      // 7. Log Admin Activity
      await client.query(
        `INSERT INTO admin_activity_logs (admin_user_id, action_type, target_id, description)
         VALUES ($1, 'loan_approve', $2, $3)`,
        [adminId, applicationId.toString(), `Approved loan of ৳${app.requested_amount} for User ID ${app.user_id}. Loan ID: ${loanRes.rows[0].loan_id}`]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async rejectLoan(applicationId) {
    await query(
      `UPDATE loan_applications SET decision_status = 'rejected' WHERE application_id = $1`,
      [applicationId]
    );
    return { success: true };
  }

  async getAllLoansDetailed() {
    const res = await query(`
      SELECT l.*, u.name as user_name, u.phone as user_phone
      FROM loans l
      JOIN users u ON l.user_id = u.user_id
      ORDER BY l.disbursed_at DESC
    `);
    return res.rows;
  }
}

export default new LoanService();