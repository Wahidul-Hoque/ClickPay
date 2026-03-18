import { query, getClient } from '../config/database.js';

class AdminService {
  async getFinancialAnalytics(city, startDate, endDate) {
    const buildDateFilter = (prefix = 't', dateCol = 'created_at') => {
      let filter = "";
      let params = [];
      if (startDate && endDate) {
        filter = `DATE(${prefix}.${dateCol}) >= $1 AND DATE(${prefix}.${dateCol}) <= $2`;
        params = [startDate, endDate];
      } else if (startDate) {
        filter = `DATE(${prefix}.${dateCol}) >= $1`;
        params = [startDate];
      } else if (endDate) {
        filter = `DATE(${prefix}.${dateCol}) <= $1`;
        params = [endDate];
      } else {
        filter = `DATE(${prefix}.${dateCol}) >= CURRENT_DATE - INTERVAL '1 month'`;
      }
      return { filter, params };
    };

    // 1. Financial Stats
    const statsDate = buildDateFilter('t', 'created_at');
    const statsParams = [...statsDate.params];
    let statsCityFilter = "";
    if (city) {
      statsParams.push(city);
      statsCityFilter = `AND u.city = $${statsParams.length}`;
    }
    const stats = await query(`
      SELECT 
        COALESCE(SUM(t.amount), 0) as total_volume,
        COUNT(t.transaction_id) as transaction_count,
        COALESCE(AVG(t.amount), 0) as avg_transaction
      FROM transactions t
      JOIN wallets w ON t.from_wallet_id = w.wallet_id
      JOIN users u ON w.user_id = u.user_id
      WHERE t.status = 'completed' AND ${statsDate.filter} ${statsCityFilter}
    `, statsParams);

    // 2. Platform Revenue (Fees)
    const revDate = buildDateFilter('t', 'created_at');
    const revenue = await query(`
      SELECT COALESCE(SUM(af.fee_amount), 0) as total_fees
      FROM agent_fees af
      JOIN transactions t ON af.cashout_transaction_id = t.transaction_id
      WHERE ${revDate.filter}
    `, revDate.params);

    // 3. Trend Analysis
    const trendDate = buildDateFilter('t', 'created_at');
    const trendParams = [...trendDate.params];
    let trendFilterStr = `WHERE t.status = 'completed' AND ${trendDate.filter}`;
    if (city) {
      trendFilterStr = `JOIN wallets w ON t.from_wallet_id = w.wallet_id JOIN users u ON w.user_id = u.user_id WHERE t.status = 'completed' AND ${trendDate.filter} AND u.city = $${trendParams.length + 1}`;
      trendParams.push(city);
    }
    const trend = await query(`
      SELECT DATE(t.created_at) as date, COALESCE(SUM(t.amount), 0) as volume
      FROM transactions t
      ${trendFilterStr}
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `, trendParams);

    // 4. User Segmentation
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

    // 5. Daily Reconciliation Dashboard => Now Date Range Reconciliation Dashboard
    const reconDate = buildDateFilter('t', 'created_at');
    const reconParams = [...reconDate.params];
    let reconFilterStr = `WHERE t.status = 'completed' AND ${reconDate.filter}`;
    if (city) {
      reconFilterStr = `JOIN wallets w ON t.from_wallet_id = w.wallet_id JOIN users u ON w.user_id = u.user_id WHERE t.status = 'completed' AND ${reconDate.filter} AND u.city = $${reconParams.length + 1}`;
      reconParams.push(city);
    }
    const reconciliation = await query(`
      SELECT 
        COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type IN ('cash_in', 'add_money')), 0) as inflow,
        COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type IN ('cash_out', 'payment', 'send_money')), 0) as outflow
      FROM transactions t
      ${reconFilterStr}
    `, reconParams);

    return { 
      stats: stats.rows[0], 
      revenue: revenue.rows[0],
      trend: trend.rows,
      segmentation: segmentation.rows[0],
      reconciliation: reconciliation.rows[0]
    };
  }

  async getTrendAnalytics(city, startDate, endDate) {
    const buildDateFilter = (prefix = 't', dateCol = 'created_at') => {
      let filter = "";
      let params = [];
      if (startDate && endDate) {
        filter = `DATE(${prefix}.${dateCol}) >= $1 AND DATE(${prefix}.${dateCol}) <= $2`;
        params = [startDate, endDate];
      } else if (startDate) {
        filter = `DATE(${prefix}.${dateCol}) >= $1`;
        params = [startDate];
      } else if (endDate) {
        filter = `DATE(${prefix}.${dateCol}) <= $1`;
        params = [endDate];
      } else {
        filter = `DATE(${prefix}.${dateCol}) >= CURRENT_DATE - INTERVAL '1 month'`;
      }
      return { filter, params };
    };

    const trendDate = buildDateFilter('t', 'created_at');
    const trendParams = [...trendDate.params];
    let trendFilterStr = `WHERE t.status = 'completed' AND ${trendDate.filter}`;
    if (city) {
      trendFilterStr = `JOIN wallets w ON t.from_wallet_id = w.wallet_id JOIN users u ON w.user_id = u.user_id WHERE t.status = 'completed' AND ${trendDate.filter} AND u.city = $${trendParams.length + 1}`;
      trendParams.push(city);
    }

    const trend = await query(`
      SELECT 
        DATE(t.created_at) as date, 
        t.transaction_type, 
        COALESCE(SUM(t.amount), 0) as volume
      FROM transactions t
      ${trendFilterStr}
      GROUP BY DATE(t.created_at), t.transaction_type
      ORDER BY date ASC
    `, trendParams);

    // Format the data so we have an array grouped by date
    const groupedTrend = {};
    for (const row of trend.rows) {
      const d = new Date(row.date).toISOString().split('T')[0];
      if (!groupedTrend[d]) {
        groupedTrend[d] = { date: row.date, total_volume: 0 };
      }
      groupedTrend[d][row.transaction_type] = parseFloat(row.volume);
      groupedTrend[d].total_volume += parseFloat(row.volume);
    }

    return Object.values(groupedTrend).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getSegmentationAnalytics(city, startDate, endDate) {
    let filterStr = "";
    let params = [];

    if (city) {
      params.push(city);
      filterStr += ` AND u.city = $${params.length}`;
    }

    if (startDate && endDate) {
      params.push(startDate, endDate);
      filterStr += ` AND DATE(u.created_at) >= $${params.length - 1} AND DATE(u.created_at) <= $${params.length}`;
    } else if (startDate) {
      params.push(startDate);
      filterStr += ` AND DATE(u.created_at) >= $${params.length}`;
    } else if (endDate) {
      params.push(endDate);
      filterStr += ` AND DATE(u.created_at) <= $${params.length}`;
    }

    const activityQuery = await query(`
      WITH UserActivity AS (
        SELECT 
          u.user_id,
          MAX(t.created_at) as last_tx_date
        FROM users u
        LEFT JOIN wallets w ON u.user_id = w.user_id
        LEFT JOIN transactions t ON (w.wallet_id = t.from_wallet_id OR w.wallet_id = t.to_wallet_id)
        WHERE u.role = 'user' ${filterStr}
        GROUP BY u.user_id
      )
      SELECT 
        COUNT(*) FILTER (WHERE last_tx_date >= CURRENT_DATE - INTERVAL '7 days') as active_users,
        COUNT(*) FILTER (WHERE last_tx_date < CURRENT_DATE - INTERVAL '7 days' AND last_tx_date >= CURRENT_DATE - INTERVAL '30 days') as irregular_users,
        COUNT(*) FILTER (WHERE last_tx_date < CURRENT_DATE - INTERVAL '30 days' AND last_tx_date >= CURRENT_DATE - INTERVAL '90 days') as dormant_users,
        COUNT(*) FILTER (WHERE last_tx_date < CURRENT_DATE - INTERVAL '90 days' OR last_tx_date IS NULL) as inactive_users,
        COUNT(*) as total_users
      FROM UserActivity
    `, params);

    const walletsQuery = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE w.status = 'active') as active_wallets,
        COUNT(*) FILTER (WHERE w.status = 'frozen') as frozen_wallets,
        COUNT(*) FILTER (WHERE w.status = 'disabled') as disabled_wallets,
        COUNT(*) as total_wallets
      FROM users u
      JOIN wallets w ON u.user_id = w.user_id
      WHERE u.role = 'user' ${filterStr}
    `, params);

    return {
      activity: activityQuery.rows[0],
      wallets: walletsQuery.rows[0]
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
      LIMIT 10
    `, params);
    return res.rows;
  }

  async getUserTransactions(userId, startDate, endDate, types) {
    let filterStr = "";
    const params = [userId];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      filterStr += ` AND DATE(t.created_at) >= $${params.length - 1} AND DATE(t.created_at) <= $${params.length}`;
    } else if (startDate) {
      params.push(startDate);
      filterStr += ` AND DATE(t.created_at) >= $${params.length}`;
    } else if (endDate) {
      params.push(endDate);
      filterStr += ` AND DATE(t.created_at) <= $${params.length}`;
    }

    if (types) {
      const typeList = types.split(',');
      const typePlaceholders = typeList.map((_, i) => `$${params.length + 1 + i}`).join(',');
      filterStr += ` AND t.transaction_type IN (${typePlaceholders})`;
      params.push(...typeList);
    }

    const res = await query(`
      SELECT DISTINCT t.*, 
        u_from.name as sender_name, u_from.phone as sender_phone,
        u_to.name as receiver_name, u_to.phone as receiver_phone
      FROM transactions t
      JOIN wallets w ON (w.wallet_id = t.from_wallet_id OR w.wallet_id = t.to_wallet_id)
      LEFT JOIN wallets w_from ON w_from.wallet_id = t.from_wallet_id
      LEFT JOIN users u_from ON u_from.user_id = w_from.user_id
      LEFT JOIN wallets w_to ON w_to.wallet_id = t.to_wallet_id
      LEFT JOIN users u_to ON u_to.user_id = w_to.user_id
      WHERE w.user_id = $1 ${filterStr}
      ORDER BY t.created_at DESC
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