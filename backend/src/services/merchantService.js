import { query } from '../config/database.js';

class MerchantService {
  async getMerchantRankings(filters = {}) {
    const { regions, startDate, endDate, transactionTypes, rankBy, merchantId } = filters;
    let queryParams = [];
    let paramIdx = 1;

    // Default transaction types for merchants: 'payment' variants and P2B transfers
    let transactionFilter = "AND t.transaction_type IN ('payment', 'merchant_payment', 'request_payment', 'transfer', 'merchant_transfer')";
    if (transactionTypes) {
      const allowedTypes = ['payment', 'merchant_payment', 'request_payment', 'merchant_transfer', 'transfer'];
      const typesList = transactionTypes.split(',').filter(t => allowedTypes.includes(t));
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
        regionFilter = `AND LOWER(TRIM(u.city)) IN (${regionsList.map((_, i) => `$${paramIdx + i}`).join(', ')})`;
        queryParams.push(...regionsList.map(r => r.trim().toLowerCase()));
        paramIdx += regionsList.length;
      }
    }

    let orderByClause = "ORDER BY total_volume DESC";
    let rankOverClause = "ORDER BY COALESCE(SUM(t.amount), 0) DESC";
    
    if (rankBy) {
      const allowedRanks = ['total_volume', 'transaction_count'];
      const ranksList = rankBy.split(',').filter(r => allowedRanks.includes(r));
      if (ranksList.length > 0) {
        orderByClause = `ORDER BY ${ranksList.map(r => `${r} DESC`).join(', ')}`;
        rankOverClause = `ORDER BY ${ranksList.map(r => `${r === 'total_volume' ? 'COALESCE(SUM(t.amount), 0)' : 'COUNT(t.transaction_id)'} DESC`).join(', ')}`;
      }
    }

    let finalMerchantIdParam = "";
    if (merchantId) {
      finalMerchantIdParam = `$${paramIdx++}`;
      queryParams.push(merchantId);
    }

    const rankingQuery = `
      WITH ranking_table AS (
        SELECT 
          u.user_id,
          mp.merchant_name as name,
          u.phone,
          u.city,
          COALESCE(SUM(t.amount), 0) as total_volume,
          COUNT(t.transaction_id) as transaction_count,
          RANK() OVER (${rankOverClause}) as rank
        FROM users u
        JOIN merchant_profiles mp ON u.user_id = mp.merchant_user_id
        JOIN wallets w ON u.user_id = w.user_id AND w.wallet_type = 'merchant'
        LEFT JOIN transactions t ON t.to_wallet_id = w.wallet_id 
          AND t.status = 'completed'
          ${transactionFilter}
          ${dateFilter}
        WHERE 1=1
          ${regionFilter}
        GROUP BY u.user_id, mp.merchant_name, u.phone, u.city
      )
      SELECT * FROM ranking_table
      ${merchantId ? `WHERE user_id = ${finalMerchantIdParam}` : `ORDER BY rank ASC, total_volume DESC LIMIT 10`}
    `;

    const result = await query(rankingQuery, queryParams);
    return result.rows;
  }

  async getMerchantRank(merchantId, filters = {}) {
    const results = await this.getMerchantRankings({ ...filters, merchantId });
    return results[0] || null;
  }

  async getRegions(searchQuery) {
    let queryParams = [];
    let condition = "WHERE mp.merchant_user_id IS NOT NULL";

    if (searchQuery) {
      condition += " AND u.city ILIKE $1";
      queryParams.push(`%${searchQuery}%`);
    }

    const q = `
      SELECT DISTINCT u.city 
      FROM users u
      JOIN merchant_profiles mp ON u.user_id = mp.merchant_user_id
      ${condition} AND u.city IS NOT NULL
      ORDER BY u.city ASC
      LIMIT 20;
    `;
    const res = await query(q, queryParams);
    return res.rows.map(row => row.city);
  }
}

export default new MerchantService();
