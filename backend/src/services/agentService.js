import { query, getClient } from '../config/database.js';
import { comparePassword } from '../middleware/auth.js';

class AgentService {
  // 1. GET AGENT DASHBOARD DATA
  async getDashboard(agentId) {
    const result = await query(
      `SELECT u.name, u.phone, u.city, w.balance, w.wallet_id
       FROM users u
       JOIN wallets w ON u.user_id = w.user_id
       WHERE u.user_id = $1 AND u.role = 'agent'`,
      [agentId]
    );

    // Also get today's transaction count
    const stats = await query(
      `SELECT COUNT(*) as total_tx, SUM(amount) as total_volume 
       FROM transactions t
       JOIN wallets w ON t.from_wallet_id = w.wallet_id
       WHERE w.user_id = $1 AND t.created_at >= CURRENT_DATE`,
      [agentId]
    );

    return {
      profile: result.rows[0],
      todayStats: stats.rows[0]
    };
  }

  // 2. CASH-IN (Agent -> User)
  async cashIn(agentId, userPhone, amount, epin) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Verify Agent ePin
      const agent = await client.query('SELECT epin_hash FROM users WHERE user_id = $1', [agentId]);
      if (!(await comparePassword(epin, agent.rows[0].epin_hash))) throw new Error('Invalid ePin');

      // Get Wallets
      const agentWallet = await client.query('SELECT wallet_id, balance FROM wallets WHERE user_id = $1 AND wallet_type = $2 FOR UPDATE', [agentId, 'agent']);
      const userRes = await client.query('SELECT w.wallet_id FROM wallets w JOIN users u ON w.user_id = u.user_id WHERE u.phone = $1 AND u.role = $2', [userPhone, 'user']);

      if (userRes.rows.length === 0) throw new Error('User not found');
      if (parseFloat(agentWallet.rows[0].balance) < amount) throw new Error('Insufficient balance');

      // Create Transaction
      const tx = await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status)
         VALUES ($1, $2, $3, 'cash_in', 'completed') RETURNING transaction_id`,
        [agentWallet.rows[0].wallet_id, userRes.rows[0].wallet_id, amount]
      );

      // Update Balances
      await client.query('UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2', [amount, agentWallet.rows[0].wallet_id]);
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [amount, userRes.rows[0].wallet_id]);

      await client.query('COMMIT');
      return tx.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 3. TRANSACTION HISTORY
  async getHistory(agentId) {
    const res = await query(
      `SELECT t.*, u_to.phone as receiver_phone, u_to.name as receiver_name
       FROM transactions t
       JOIN wallets w_from ON t.from_wallet_id = w_from.wallet_id
       JOIN wallets w_to ON t.to_wallet_id = w_to.wallet_id
       JOIN users u_to ON w_to.user_id = u_to.user_id
       WHERE w_from.user_id = $1
       ORDER BY t.created_at DESC LIMIT 20`,
      [agentId]
    );
    return res.rows;
  }

  async getAgentRankings(filters = {}) {
    const { regions, startDate, endDate, transactionTypes, rankBy } = filters;
    let queryParams = [];
    let paramIdx = 1;

    let transactionFilter = "AND t.transaction_type IN ('cash_in', 'cash_out')";
    if (transactionTypes) {
      const typesList = transactionTypes.split(',').filter(t => ['cash_in', 'cash_out'].includes(t));
      if (typesList.length > 0) {
        transactionFilter = `AND t.transaction_type IN (${typesList.map((_, i) => `$${paramIdx + i}`).join(', ')})`;
        queryParams.push(...typesList);
        paramIdx += typesList.length;
      }
    }

    let dateFilter = "AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
    if (startDate && endDate) {
      dateFilter = `AND t.created_at BETWEEN $${paramIdx++} AND $${paramIdx++}`;
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = `AND t.created_at >= $${paramIdx++}`;
      queryParams.push(startDate);
    } else if (endDate) {
      dateFilter = `AND t.created_at <= $${paramIdx++}`;
      queryParams.push(endDate);
    }

    let regionFilter = "";
    if (regions) {
      const regionsList = regions.split(',').filter(r => r.trim() !== "");
      if (regionsList.length > 0) {
        regionFilter = `AND LOWER(u.city) IN (${regionsList.map((_, i) => `$${paramIdx + i}`).join(', ')})`;
        queryParams.push(...regionsList.map(r => r.trim().toLowerCase()));
        paramIdx += regionsList.length;
      }
    }

    let orderByClause = "ORDER BY total_volume DESC";
    if (rankBy) {
      const ranksList = rankBy.split(',').filter(r => ['total_volume', 'transaction_count'].includes(r));
      if (ranksList.length > 0) {
        orderByClause = `ORDER BY ${ranksList.map(r => `${r} DESC`).join(', ')}`;
      }
    }

    const rankingQuery = `
      SELECT 
        u.user_id,
        u.name,
        u.phone,
        u.city,
        SUM(t.amount) as total_volume,
        COUNT(t.transaction_id) as transaction_count
      FROM users u
      JOIN wallets w ON u.user_id = w.user_id
      JOIN transactions t ON (t.from_wallet_id = w.wallet_id OR t.to_wallet_id = w.wallet_id)
      WHERE 
        u.role = 'agent' 
        AND t.status = 'completed'
        ${transactionFilter}
        ${dateFilter}
        ${regionFilter}
      GROUP BY u.user_id
      ${orderByClause}
      LIMIT 100;
    `;

    const result = await query(rankingQuery, queryParams);
    return result.rows;
  }

  async getRegions(searchQuery) {
    let queryParams = [];
    let condition = "WHERE role = 'agent'";

    if (searchQuery) {
      condition += " AND city ILIKE $1";
      queryParams.push(`%${searchQuery}%`);
    }

    const q = `
      SELECT DISTINCT city 
      FROM users 
      ${condition} AND city IS NOT NULL
      ORDER BY city ASC
      LIMIT 20;
    `;
    const res = await query(q, queryParams);
    return res.rows.map(row => row.city);
  }
}

export default new AgentService();