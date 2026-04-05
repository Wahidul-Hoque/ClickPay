import { query } from '../config/database.js';
import merchantService from '../services/merchantService.js';

class MerchantController {
  /**
   * Get all active merchants for discovery
   * GET /api/v1/merchants
   */
  async getAllMerchants(req, res, next) {
    try {
      const result = await query(
        `SELECT mp.*, u.phone, w.wallet_id 
         FROM merchant_profiles mp
         JOIN users u ON mp.merchant_user_id = u.user_id
         JOIN wallets w ON u.user_id = w.user_id
         WHERE mp.status = 'active' AND w.wallet_type = 'merchant'
         ORDER BY mp.merchant_name ASC`
      );
      
      return res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get details for a specific merchant
   * GET /api/v1/merchants/:id
   */
  async getMerchantDetails(req, res, next) {
    try {
      const { id } = req.params;
      const result = await query(
        `SELECT mp.*, u.phone 
         FROM merchant_profiles mp
         JOIN users u ON mp.merchant_user_id = u.user_id
         WHERE mp.merchant_user_id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Merchant not found' });
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const merchantId = req.user.userId;
      
      const result = await query(
        `SELECT mp.merchant_name, u.city, w.balance, w.wallet_id, mp.subscription_expiry
         FROM merchant_profiles mp
         JOIN users u ON mp.merchant_user_id = u.user_id
         JOIN wallets w ON u.user_id = w.user_id
         WHERE u.user_id = $1 AND w.wallet_type = 'merchant'`,
        [merchantId]
      );

      const stats = await query(
        `SELECT COUNT(*) as total_tx, COALESCE(SUM(amount), 0) as total_volume 
         FROM transactions t
         JOIN wallets w ON t.to_wallet_id = w.wallet_id
         WHERE w.user_id = $1 AND t.created_at >= CURRENT_DATE AND t.status = 'completed'`,
        [merchantId]
      );

      // Get rank for the current month
      const rankingInfo = await merchantService.getMerchantRank(merchantId);

      res.json({
        success: true,
        data: {
          profile: result.rows[0] || {},
          todayStats: stats.rows[0] || { total_tx: 0, total_volume: 0 },
          rank: rankingInfo?.rank || 'N/A'
        }
      });
    } catch (error) { next(error); }
  }

  async getMerchantRankings(req, res, next) {
    try {
      const filters = {
        regions: req.query.regions,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        transactionTypes: req.query.transactionTypes,
        rankBy: req.query.rankBy
      };

      // For security and privacy, merchants should only see their own rank
      if (req.user.role === 'merchant') {
        filters.merchantId = req.user.userId;
      }

      const rankings = await merchantService.getMerchantRankings(filters);
      res.json({ success: true, data: rankings });
    } catch (error) {
      next(error);
    }
  }

  async getMerchantRegions(req, res, next) {
    try {
      const regions = await merchantService.getRegions(req.query.q);
      res.json({ success: true, data: regions });
    } catch (error) {
      next(error);
    }
  }
}

export default new MerchantController();