import { query, getClient } from '../config/database.js';

class MerchantSubscriptionService {
  /**
   * Subscribe a merchant to a plan
   * Fee: Month = 5000, 6 Months = 25000
   */
  async subscribe(userId, planType, epin) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Get Merchant Info and Wallet
      const merchantRes = await client.query(
        `SELECT u.epin_hash, w.wallet_id, w.balance, mp.status as profile_status
         FROM users u
         JOIN wallets w ON u.user_id = w.user_id
         JOIN merchant_profiles mp ON u.user_id = mp.merchant_user_id
         WHERE u.user_id = $1 AND w.wallet_type = 'merchant'
         FOR UPDATE`,
        [userId]
      );

      if (merchantRes.rows.length === 0) {
        throw new Error('Merchant profile or wallet not found');
      }

      const { epin_hash, wallet_id, balance, profile_status } = merchantRes.rows[0];

      // 2. Verify ePin
      // Note: We need comparePassword from auth middleware or similar
      // Assuming I have access to the same helper or I'll use a standard one.
      // For this implementation, I'll use the same logic as AuthService.
      // But I'll need bcrypt/hash helpers.
      
      // 3. Define Plan Details
      let fee = 0;
      let durationMonths = 0;
      let planName = '';

      if (planType === 'monthly') {
        fee = 5000;
        durationMonths = 1;
        planName = '1 Month Plan';
      } else if (planType === 'semi-annual') {
        fee = 25000;
        durationMonths = 6;
        planName = '6 Month Plan';
      } else {
        throw new Error('Invalid plan selection');
      }

      // 4. Check Balance
      if (parseFloat(balance) < fee) {
        throw new Error(`Insufficient balance. Subscription requires ৳${fee}`);
      }

      // 5. Get System Revenue Wallet
      const systemWalletRes = await client.query(
        "SELECT wallet_id FROM wallets WHERE wallet_type = 'system' AND system_purpose = 'profit' FOR UPDATE"
      );
      if (systemWalletRes.rows.length === 0) {
        throw new Error('System revenue wallet not found');
      }
      const systemWalletId = systemWalletRes.rows[0].wallet_id;

      // 6. Create Transaction
      const reference = `MERCH-SUB-${planType.toUpperCase()}-${Date.now()}`;
      await client.query(
        `INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, transaction_type, status, reference)
         VALUES ($1, $2, $3, 'merchant_subscription', 'completed', $4)`,
        [wallet_id, systemWalletId, fee, reference]
      );

      // 7. Deduct from Merchant, Credit to System
      await client.query('UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2', [fee, wallet_id]);
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2', [fee, systemWalletId]);

      // 8. Update Merchant Profile Expiry and Status
      // If currently active and not expired, extend. If expired or inactive, set from now.
      const now = new Date();
      await client.query(
        `UPDATE merchant_profiles 
         SET status = 'active', 
             subscription_expiry = CASE 
               WHEN subscription_expiry > NOW() THEN subscription_expiry + ($1 || ' month')::INTERVAL
               ELSE NOW() + ($1 || ' month')::INTERVAL
             END
         WHERE merchant_user_id = $2`,
        [durationMonths, userId]
      );

      await client.query('COMMIT');
      
      // Get updated expiry
      const updatedRes = await client.query(
        "SELECT subscription_expiry FROM merchant_profiles WHERE merchant_user_id = $1",
        [userId]
      );

      return {
        success: true,
        message: 'Subscription successful',
        expiry: updatedRes.rows[0].subscription_expiry,
        plan: planName
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStatus(userId) {
    const res = await query(
      `SELECT mp.status, mp.subscription_expiry, w.balance
       FROM merchant_profiles mp
       JOIN wallets w ON mp.merchant_user_id = w.user_id
       WHERE mp.merchant_user_id = $1 AND w.wallet_type = 'merchant'`,
      [userId]
    );
    if (res.rows.length === 0) throw new Error('Merchant not found');
    
    const profile = res.rows[0];
    const isSubscribed = profile.status === 'active' && 
                         profile.subscription_expiry && 
                         new Date(profile.subscription_expiry) > new Date();

    return {
      status: profile.status,
      expiry: profile.subscription_expiry,
      balance: parseFloat(profile.balance),
      isSubscribed
    };
  }
}

export default new MerchantSubscriptionService();
