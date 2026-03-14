// ==============================================
// AUTH SERVICE (The Kitchen - Business Logic)
// ==============================================

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
      const walletType = role === 'agent' ? 'agent' : 'user';
      const walletInsertQuery = `
        INSERT INTO wallets (user_id, wallet_type, balance, status)
        VALUES ($1, $2, $3, $4)
      `;

      await client.query(walletInsertQuery, [userId, walletType, 0.00, 'active']);

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
          w.wallet_id, w.wallet_type, w.balance, w.status as wallet_status
        FROM users u
        JOIN wallets w ON u.user_id = w.user_id 
        WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent')
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
          }
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
          w.wallet_id, w.wallet_type, w.balance, w.status as wallet_status
        FROM users u
        JOIN wallets w ON u.user_id = w.user_id 
        WHERE u.user_id = $1 AND w.wallet_type IN ('user', 'agent')
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
        }
      };

    } catch (error) {
      throw error;
    }
  }
}

// Export a single instance
export default new AuthService();
