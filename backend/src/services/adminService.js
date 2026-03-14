import { query, getClient } from '../config/database.js';

class AdminService {
  async getFinancialAnalytics(city) {
    const cityFilter = city ? "AND u.city = $1" : "";
    const params = city ? [city] : [];

    // Financial Stats
    const stats = await query(`
      SELECT 
        COALESCE(SUM(t.amount), 0) as total_volume,
        COUNT(t.transaction_id) as transaction_count,
        COALESCE(AVG(t.amount), 0) as avg_transaction
      FROM transactions t
      JOIN wallets w ON t.from_wallet_id = w.wallet_id
      JOIN users u ON w.user_id = u.user_id
      WHERE t.status = 'completed' ${cityFilter}
    `, params);

    // Platform Revenue (Fees)
    const revenue = await query(`
      SELECT COALESCE(SUM(fee_amount), 0) as total_fees
      FROM agent_fees
    `);

    // Trend Analysis (Last 10 Days)
    const trendFilter = city ? "JOIN wallets w ON t.from_wallet_id = w.wallet_id JOIN users u ON w.user_id = u.user_id WHERE t.status = 'completed' AND t.created_at >= CURRENT_DATE - INTERVAL '10 days' AND u.city = $1" : "WHERE status = 'completed' AND created_at >= CURRENT_DATE - INTERVAL '10 days'";
    const trend = await query(`
      SELECT DATE(t.created_at) as date, COALESCE(SUM(t.amount), 0) as volume
      FROM transactions t
      ${trendFilter}
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `, params);

    // User Segmentation
    const segmentParams = city ? [city] : [];
    const segmentFilter = city ? "AND city = $1" : "";
    const segmentation = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'frozen') as frozen_users,
        COUNT(*) as total_users
      FROM users
      WHERE role = 'user' ${segmentFilter}
    `, segmentParams);

    // Daily Reconciliation Dashboard
    const reconTarget = city ? "JOIN wallets w ON t.from_wallet_id = w.wallet_id JOIN users u ON w.user_id = u.user_id AND u.city = $1" : "";
    const reconciliation = await query(`
      SELECT 
        COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type IN ('cash_in', 'add_money')), 0) as inflow,
        COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type IN ('cash_out', 'payment', 'send_money')), 0) as outflow
      FROM transactions t
      ${reconTarget}
      WHERE DATE(t.created_at) = CURRENT_DATE AND t.status = 'completed'
    `, params);

    return { 
      stats: stats.rows[0], 
      revenue: revenue.rows[0],
      trend: trend.rows,
      segmentation: segmentation.rows[0],
      reconciliation: reconciliation.rows[0]
    };
  }

  async getAgentPerformance(city) {
    const cityFilter = city ? "WHERE u.city = $1" : "";
    const params = city ? [city] : [];

    const res = await query(`
      SELECT 
        u.name, u.phone, u.city,
        COALESCE(SUM(af.fee_amount), 0) as total_commissions,
        COUNT(t.transaction_id) as total_transactions
      FROM users u
      JOIN wallets w ON u.user_id = w.user_id
      LEFT JOIN agent_fees af ON w.wallet_id = af.agent_wallet_id
      LEFT JOIN transactions t ON w.wallet_id = t.from_wallet_id
      WHERE u.role = 'agent' ${city ? "AND u.city = $1" : ""}
      GROUP BY u.user_id, u.name, u.phone, u.city
      ORDER BY total_commissions DESC
    `, params);
    return res.rows;
  }

  // 6, 7, 8: Loans, Savings & Subscriptions
  async getPortfolioReports() {
    const loans = await query(`
      SELECT status, SUM(principal_amount) as total_amount, COUNT(*) as count 
      FROM loans GROUP BY status
    `);
    const savings = await query(`
      SELECT SUM(principal_amount) as total_savings 
      FROM fixed_savings_accounts WHERE status = 'active'
    `);
    const subs = await query(`
      SELECT SUM(amount) as mrr FROM subscriptions WHERE status = 'active'
    `);
    return { loans: loans.rows, totalSavings: savings.rows[0], mrr: subs.rows[0] };
  }

  // 9: User Management
  async getAllUsers(search) {
    const searchFilter = search ? "AND (u.name ILIKE $1 OR u.phone ILIKE $1 OR u.nid ILIKE $1)" : "";
    const params = search ? [`%${search}%`] : [];
    
    const res = await query(`
      SELECT u.user_id, u.name, u.phone, u.nid, u.role, u.status, w.balance
      FROM users u
      JOIN wallets w ON u.user_id = w.user_id
      WHERE w.wallet_type != 'system' ${searchFilter}
      ORDER BY u.created_at DESC
    `, params);
    return res.rows;
  }

  async toggleUserStatus(adminId, userId, action) {
    const status = action === 'freeze' ? 'frozen' : 'active';
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET status = $1 WHERE user_id = $2', [status, userId]);
      await client.query('UPDATE wallets SET status = $1 WHERE user_id = $2', [status, userId]);
      await client.query('COMMIT');
      return { success: true, status };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // 12: Audit Logs
  async getAuditLogs() {
    return [
      { admin_name: 'System', action_type: 'System Started', target_id: 'SYSTEM', created_at: new Date() }
    ];
  }

  // Get distinct cities
  async getAllCities() {
    const res = await query(`SELECT DISTINCT city FROM users WHERE city IS NOT NULL ORDER BY city ASC`);
    return res.rows.map(row => row.city);
  }
}

export default new AdminService();