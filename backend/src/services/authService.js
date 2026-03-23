
import { query, getClient } from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../middleware/auth.js';

class AuthService {
  // REGISTERS NEW USER and Creates a new user and their wallet
  async register(userData) {
    const { name, phone, city, nid, epin, role } = userData;
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const epinHash = await hashPassword(epin);
      //inserting user
      const userQuery = `
        INSERT INTO users (name, phone, city, nid, epin_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await client.query(userQuery, [name, phone, city, nid, epinHash, role, 'active']);

      const userIdResult = await client.query('SELECT LASTVAL() as id');
      const userId = userIdResult.rows[0].id;

      const userResult = await client.query(
        'SELECT user_id, name, phone, city, nid, role, status, created_at FROM users WHERE user_id = $1',
        [userId]
      );
      const user = userResult.rows[0];

      //Create wallet for the user
      const walletType = role === 'agent' ? 'agent' : (role === 'merchant' ? 'merchant' : 'user');
      const walletInsertQuery = `
        INSERT INTO wallets (user_id, wallet_type, balance, status)
        VALUES ($1, $2, $3, $4)
      `;

      await client.query(walletInsertQuery, [userId, walletType, 0.00, 'active']);

      // If user is a merchant, create merchant_profile
      if (role === 'merchant') {
        const merchantProfileQuery = `
          INSERT INTO merchant_profiles (merchant_user_id, merchant_name, status)
          VALUES ($1, $2, 'inactive')
        `;
        await client.query(merchantProfileQuery, [userId, name]);
      }

      // Manual Fetch Wallet ID using LASTVAL()
      const walletIdResult = await client.query('SELECT LASTVAL() as id');
      const walletId = walletIdResult.rows[0].id;

      const walletResult = await client.query(
        'SELECT wallet_id, wallet_type, balance, status FROM wallets WHERE wallet_id = $1',
        [walletId]
      );
      const wallet = walletResult.rows[0];

      await client.query('COMMIT');

      //Generate JWT token
      const token = generateToken(user.user_id, user.role);

      // Return user data with wallet and token
      return {
        user: {
          ...user,
          wallet: {
            ...wallet,
            balance: parseFloat(wallet.balance)
          }
        },
        token
      };

    } catch (error) {
      // ROLLBACK if anything fails
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Always release the client
      client.release();
    }
  }

  // LOGIN USER
  // Authenticates user and returns JWT token
  async login(phone, epin) {
    try {
      //Find user by phone with wallet
      const userQuery = `
        SELECT 
          u.user_id, u.name, u.phone, u.nid, u.epin_hash, u.role, u.status, u.created_at,
          w.wallet_id, w.wallet_type, w.balance, w.status as wallet_status,
          mp.status as merchant_status, mp.subscription_expiry
        FROM users u
        JOIN wallets w ON u.user_id = w.user_id 
        LEFT JOIN merchant_profiles mp ON u.user_id = mp.merchant_user_id
        WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent', 'merchant')
      `;

      const result = await query(userQuery, [phone]);

      if (result.rows.length === 0) {
        throw new Error('Invalid phone number or ePin');
      }

      const user = result.rows[0];

      if (user.status !== 'active') {
        throw new Error('Account is not active. Please contact support.');
      }

      const isValidEpin = await comparePassword(epin, user.epin_hash);

      if (!isValidEpin) {
        throw new Error('Invalid phone number or ePin');
      }

      // Remove epin_hash from response
      const { epin_hash, ...userData } = user;

      // STEP 5: Generate JWT token
      const token = generateToken(user.user_id, user.role);

      // Return formatted user data with token
      return {
        user: {
          user_id: userData.user_id,
          name: userData.name,
          phone: userData.phone,
          nid: userData.nid,
          role: userData.role,
          status: userData.status,
          created_at: userData.created_at,
          wallet: {
            wallet_id: userData.wallet_id,
            wallet_type: userData.wallet_type,
            balance: parseFloat(userData.balance),
            status: userData.wallet_status
          },
          merchant_status: userData.merchant_status,
          subscription_expiry: userData.subscription_expiry
        },
        token
      };

    } catch (error) {
      throw error;
    }
  }

  // ==============================================
  // GET USER PROFILE
  // ==============================================
  // Retrieves user profile with wallet information
  async getProfile(userId) {
    try {
      const profileQuery = `
        SELECT 
          u.user_id, u.name, u.phone, u.nid, u.role, u.status, u.created_at,
          w.wallet_id, w.wallet_type, w.balance, w.status as wallet_status,
          mp.status as merchant_status, mp.subscription_expiry
        FROM users u
        JOIN wallets w ON u.user_id = w.user_id 
        LEFT JOIN merchant_profiles mp ON u.user_id = mp.merchant_user_id
        WHERE u.user_id = $1 AND w.wallet_type IN ('user', 'agent', 'merchant')
      `;

      const result = await query(profileQuery, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      return {
        user_id: user.user_id,
        name: user.name,
        phone: user.phone,
        nid: user.nid,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        wallet: {
          wallet_id: user.wallet_id,
          wallet_type: user.wallet_type,
          balance: parseFloat(user.balance),
          status: user.wallet_status
        },
        merchant_status: user.merchant_status,
        subscription_expiry: user.subscription_expiry
      };

    } catch (error) {
      throw error;
    }
  }

async changePin(userId, oldPin, newPin) {
    try {
      // 1. Get user's current PIN hash
      const userResult = await query(
        'SELECT epin_hash FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];

      // 2. Verify old PIN
      const isMatch = await comparePassword(oldPin, user.epin_hash);
      if (!isMatch) {
        throw new Error('Incorrect old PIN');
      }

      // 3. Hash and save new PIN
      const newPinHash = await hashPassword(newPin);
      await query(
        'UPDATE users SET epin_hash = $1 WHERE user_id = $2',
        [newPinHash, userId]
      );

      return { message: 'PIN updated successfully' };
    } catch (error) {
      throw error;
    }
  }
}

// Export a single instance
export default new AuthService();
