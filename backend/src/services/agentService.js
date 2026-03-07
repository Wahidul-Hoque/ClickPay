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

  async getAgentRankings() {
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
        AND t.transaction_type IN ('cash_in', 'cash_out')
        AND t.created_at >= DATE_TRUNC('month', CURRENT_DATE) -- From beginning of this month
      GROUP BY u.user_id
      ORDER BY total_volume DESC
      LIMIT 100; -- Top 100 agents
    `;
    
    const result = await query(rankingQuery);
    return result.rows;
  }
}

export default new AgentService();