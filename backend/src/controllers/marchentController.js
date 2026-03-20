import { query } from '../config/database.js';

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
}

export default new MerchantController();