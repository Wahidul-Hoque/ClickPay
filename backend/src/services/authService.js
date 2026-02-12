import { query, getClient } from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';

class AuthService {
  // Register new user
  async register(userData) {
    const { name, phone, nid, epin, role } = userData;
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Hash the ePin
      const epinHash = await hashPassword(epin);

      // Insert user
      const userQuery = `
        INSERT INTO users (name, phone, nid, epin_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id, name, phone, nid, role, status, created_at
      `;
      
      const userResult = await client.query(userQuery, [
        name,
        phone,
        nid,
        epinHash,
        role,
        'active'
      ]);

      const user = userResult.rows[0];

      // Create wallet for the user
      const walletType = role === 'agent' ? 'agent' : 'user';
      const walletQuery = `
        INSERT INTO wallets (user_id, wallet_type, balance, status)
        VALUES ($1, $2, $3, $4)
        RETURNING wallet_id, wallet_type, balance, status
      `;
      
      const walletResult = await client.query(walletQuery, [
        user.user_id,
        walletType,
        0.00,
        'active'
      ]);

      const wallet = walletResult.rows[0];

      await client.query('COMMIT');

      // Generate JWT token
      const token = generateToken(user.user_id, user.role);

      return {
        user: {
          ...user,
          wallet
        },
        token
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Login user
  async login(phone, epin) {
    try {
      // Find user by phone
      const userQuery = `
        SELECT u.user_id, u.name, u.phone, u.nid, u.epin_hash, u.role, u.status, u.created_at,
               w.wallet_id, w.wallet_type, w.balance, w.status as wallet_status
        FROM users u
        LEFT JOIN wallets w ON u.user_id = w.user_id AND w.wallet_type IN ('user', 'agent')
        WHERE u.phone = $1
      `;
      
      const result = await query(userQuery, [phone]);

      if (result.rows.length === 0) {
        throw new Error('Invalid phone number or ePin');
      }

      const user = result.rows[0];

      // Check if user is active
      if (user.status !== 'active') {
        throw new Error('Account is not active. Please contact support.');
      }

      // Verify ePin
      const isValidEpin = await comparePassword(epin, user.epin_hash);
      
      if (!isValidEpin) {
        throw new Error('Invalid phone number or ePin');
      }

      // Remove epin_hash from response
      const { epin_hash, ...userData } = user;

      // Generate JWT token
      const token = generateToken(user.user_id, user.role);

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
            balance: userData.balance,
            status: userData.wallet_status
          }
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const profileQuery = `
        SELECT u.user_id, u.name, u.phone, u.nid, u.role, u.status, u.created_at,
               w.wallet_id, w.wallet_type, w.balance, w.status as wallet_status
        FROM users u
        LEFT JOIN wallets w ON u.user_id = w.user_id AND w.wallet_type IN ('user', 'agent')
        WHERE u.user_id = $1
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
          balance: user.balance,
          status: user.wallet_status
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService();
