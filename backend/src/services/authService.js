// ==============================================
// AUTH SERVICE (The Kitchen - Business Logic)
// ==============================================
// This file contains all authentication-related database operations
// All SQL queries for auth are written here

import { query, getClient } from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../middleware/auth.js';

class AuthService {
  // ==============================================
  // REGISTER NEW USER
  // ==============================================
  // Creates a new user and their wallet
  async register(userData) {
    const { name, phone, nid, epin, role } = userData;
    const client = await getClient();

    try {
      // START TRANSACTION
      await client.query('BEGIN');

      // STEP 1: Hash the ePin
      const epinHash = await hashPassword(epin);

      // STEP 2: Insert user into database
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

      // STEP 3: Create wallet for the user
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

      // COMMIT TRANSACTION
      await client.query('COMMIT');

      // STEP 4: Generate JWT token
      const token = generateToken(user.user_id, user.role);

      // Return user data with wallet and token
      return {
        user: {
          ...user,
          wallet
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

  // ==============================================
  // LOGIN USER
  // ==============================================
  // Authenticates user and returns JWT token
  async login(phone, epin) {
    try {
      // STEP 1: Find user by phone with wallet
      const userQuery = `
        SELECT 
          u.user_id, u.name, u.phone, u.nid, u.epin_hash, u.role, u.status, u.created_at,
          w.wallet_id, w.wallet_type, w.balance, w.status as wallet_status
        FROM users u
        LEFT JOIN wallets w ON u.user_id = w.user_id 
        WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent')
      `;
      
      const result = await query(userQuery, [phone]);

      // Check if user exists
      if (result.rows.length === 0) {
        throw new Error('Invalid phone number or ePin');
      }

      const user = result.rows[0];

      // STEP 2: Check if account is active
      if (user.status !== 'active') {
        throw new Error('Account is not active. Please contact support.');
      }

      // STEP 3: Verify ePin
      const isValidEpin = await comparePassword(epin, user.epin_hash);
      
      if (!isValidEpin) {
        throw new Error('Invalid phone number or ePin');
      }

      // STEP 4: Remove epin_hash from response
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
        LEFT JOIN wallets w ON u.user_id = w.user_id 
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
