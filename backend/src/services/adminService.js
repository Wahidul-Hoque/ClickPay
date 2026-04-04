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
      SELECT COALESCE(SUM(amount), 0) as total_fees
      FROM transactions t 
      WHERE to_wallet_id= (SELECT wallet_id FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'profit') and ${revDate.filter}
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
        COALESCE(SUM(t.amount) FILTER (WHERE t.transaction_type IN ('cash_out', 'payment', 'transfer')), 0) as outflow
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
        COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM loans l WHERE l.user_id = u.user_id AND l.status = 'defaulted')) as loan_defaults,
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
      SELECT COUNT(*) as active_count, COALESCE(SUM(principal_amount), 0) as total_savings 
      FROM fixed_savings_accounts WHERE status = 'active'
    `);
    const subs = await query(`
      SELECT SUM(amount) as mrr FROM subscriptions WHERE status = 'active'
    `);
    return { loans: loans.rows, totalSavings: savings.rows[0], activeSavingsCount: parseInt(savings.rows[0]?.active_count || '0', 10), mrr: subs.rows[0] };
  }

  async getActiveSavingsPlans(limit = 3) {
    const params = [limit];
    const plans = await query(
      `SELECT 
         f.fixed_savings_id,
         f.principal_amount,
         f.annual_interest_rate,
         f.finish_at,
         u.user_id,
         u.name as user_name,
         u.phone
       FROM fixed_savings_accounts f
       JOIN users u ON f.user_id = u.user_id
       WHERE f.status = 'active'
       ORDER BY f.principal_amount DESC
       LIMIT $1`,
      params
    );
    return plans.rows;
  }

  // 9: User Management
  async getAllUsers(search) {
    const searchFilter = search ? "AND (u.name ILIKE $1 OR u.phone ILIKE $1 OR u.nid ILIKE $1)" : "";
    const params = search ? [`%${search}%`] : [];
    
    const res = await query(`
      SELECT u.user_id, u.name, u.phone, u.nid, u.role, u.status, w.balance,
             EXISTS(SELECT 1 FROM loans l WHERE l.user_id = u.user_id AND (l.status = 'defaulted' OR (l.status IN ('active', 'overdue') AND l.due_at <= NOW()))) as has_loan_default
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
    const logActionType = action === 'freeze' ? 'user_freeze' : 'user_activate';
    
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1 & 2. Update User and Wallet status
      await client.query(`CALL p_set_user_account_status($1, $2)`, [userId, status]);

      // 3. Log Admin Activity
      const description = `${action === 'freeze' ? 'Froze' : 'Activated'} user account and wallets for user ${userId}.`;
      
      await client.query(
        `CALL p_log_admin_activity($1, $2, $3, $4)`,
        [
          adminId, 
          logActionType, 
          userId.toString(), 
          description
        ]
      );

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
  // 12: Audit Logs
  async getAuditLogs(filters = {}) {
    const { startDate, endDate, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;
    const client = await getClient();
    
    try {
      let whereClause = "";
      const params = [];

      if (startDate && endDate) {
        params.push(startDate, endDate);
        whereClause = `WHERE DATE(log.created_at) >= $1 AND DATE(log.created_at) <= $2`;
      } else if (startDate) {
        params.push(startDate);
        whereClause = `WHERE DATE(log.created_at) >= $1`;
      } else if (endDate) {
        params.push(endDate);
        whereClause = `WHERE DATE(log.created_at) <= $1`;
      }

      const limitIdx = params.length + 1;
      const offsetIdx = params.length + 2;
      params.push(limit, offset);

      const res = await client.query(`
        SELECT 
          log.log_id,
          log.admin_user_id,
          admin.name AS admin_name,
          log.action_type,
          log.target_id,
          log.description,
          log.created_at
        FROM admin_activity_logs log
        JOIN users admin ON log.admin_user_id = admin.user_id
        ${whereClause}
        ORDER BY log.created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `, params);

      return res.rows;
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return [];
    } finally {
      client.release();
    }
  }

  // Get distinct cities
  async getAllCities() {
    const res = await query(`SELECT DISTINCT city FROM users WHERE city IS NOT NULL ORDER BY city ASC`);
    return res.rows.map(row => row.city);
  }

  async getSystemSettings() {
    const res = await query('SELECT * FROM system_settings ORDER BY setting_key');
    return res.rows;
  }

  async updateSystemSetting(key, value, adminId) {
    await query(
      'UPDATE system_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2',
      [value, key]
    );

    await query(
      `CALL p_log_admin_activity($1, 'update_setting', $2, $3)`,
      [adminId, key, `Updated ${key} to ${value}`]
    );

    return { success: true };
  }

  async getAdminWalletReconciliation(period = 'day') {
    const sanitizedPeriod = period === 'month' ? 'month' : 'day';
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const walletRes = await client.query(
        `SELECT wallet_id FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'profit' LIMIT 1 FOR UPDATE`
      );
      if (walletRes.rows.length === 0) {
        throw new Error('Admin profit wallet is not configured');
      }
      const adminWalletId = walletRes.rows[0].wallet_id;

      const periodClause =
        sanitizedPeriod === 'month'
          ? "DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)"
          : "DATE(t.created_at) = CURRENT_DATE";

      const buildSummary = async (periodCondition) => {
        const res = await client.query(
          `
          SELECT
            COALESCE(SUM(t.amount) FILTER (WHERE t.to_wallet_id = $1), 0) AS total_incoming,
            COALESCE(SUM(t.amount) FILTER (WHERE t.from_wallet_id = $1), 0) AS total_outgoing,
            COALESCE(SUM(t.amount) FILTER (WHERE t.to_wallet_id = $1 AND t.transaction_type = 'loan_interest'), 0) AS loan_interest,
            COALESCE(SUM(t.amount) FILTER (WHERE t.to_wallet_id = $1 AND t.transaction_type = 'system_profit'), 0) AS system_profit,
            COALESCE(SUM(t.amount) FILTER (WHERE t.to_wallet_id = $1 AND t.transaction_type = 'merchant_subscription'), 0) AS merchant_subscription
          FROM transactions t
          WHERE t.status = 'completed'
            AND ${periodCondition}
            AND (t.to_wallet_id = $1 OR t.from_wallet_id = $1)
          `,
          [adminWalletId]
        );
        return res.rows[0] || {};
      };

      const [currentSummary, previousMonthSummary] = await Promise.all([
        buildSummary(periodClause),
        buildSummary("DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')")
      ]);

      await client.query('COMMIT');

      const formatRow = (summaryRow) => ({
        totalIncoming: parseFloat(summaryRow.total_incoming) || 0,
        totalOutgoing: parseFloat(summaryRow.total_outgoing) || 0,
        loanInterest: parseFloat(summaryRow.loan_interest) || 0,
        systemProfit: parseFloat(summaryRow.system_profit) || 0,
        merchantSubscription: parseFloat(summaryRow.merchant_subscription) || 0,
      });

      return {
        current: formatRow(currentSummary),
        previousMonth: formatRow(previousMonthSummary),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new AdminService();
