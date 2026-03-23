import { query } from '../config/database.js';

class MerchantService {
  async getMerchantRankings(filters = {}) {
    const { regions, startDate, endDate, transactionTypes, rankBy } = filters;
    let queryParams = [];
    let paramIdx = 1;

    // Default transaction types for merchants: 'payment' variants
    let transactionFilter = "AND t.transaction_type IN ('payment', 'merchant_payment', 'request_payment')";
    if (transactionTypes) {
      const allowedTypes = ['payment', 'merchant_payment', 'request_payment'];
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
        regionFilter = `AND LOWER(u.city) IN (${regionsList.map((_, i) => `$${paramIdx + i}`).join(', ')})`;
        queryParams.push(...regionsList.map(r => r.trim().toLowerCase()));
        paramIdx += regionsList.length;
      }
    }

    let orderByClause = "ORDER BY total_volume DESC";
    if (rankBy) {
      const allowedRanks = ['total_volume', 'transaction_count'];
      const ranksList = rankBy.split(',').filter(r => allowedRanks.includes(r));
      if (ranksList.length > 0) {
        orderByClause = `ORDER BY ${ranksList.map(r => `${r} DESC`).join(', ')}`;
      }
    }

    const rankingQuery = `
      SELECT 
        u.user_id,
        mp.merchant_name as name,
        u.phone,
        u.city,
        SUM(t.amount) as total_volume,
        COUNT(t.transaction_id) as transaction_count
      FROM users u
      JOIN merchant_profiles mp ON u.user_id = mp.merchant_user_id
      JOIN wallets w ON u.user_id = w.user_id
      JOIN transactions t ON t.to_wallet_id = w.wallet_id
      WHERE 
        t.status = 'completed'
        ${transactionFilter}
        ${dateFilter}
        ${regionFilter}
      GROUP BY u.user_id, mp.merchant_name, u.phone, u.city
      ${orderByClause}
      LIMIT 100;
    `;

    const result = await query(rankingQuery, queryParams);
    return result.rows;
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
