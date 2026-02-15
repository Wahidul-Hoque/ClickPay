// ==============================================
// AUTHENTICATION ROUTES
// ==============================================
// This file handles all authentication-related endpoints:
// 1. POST /api/v1/auth/register - Register new user
// 2. POST /api/v1/auth/login - Login user
// 3. GET /api/v1/auth/profile - Get user profile (protected)
// 4. POST /api/v1/auth/logout - Logout user (protected)

import express from 'express';
import { query, db } from '../config/db.js';
import { hashPassword, comparePassword, generateToken, protect } from '../utils/auth.js';

const router = express.Router();

// ==============================================
// ROUTE 1: REGISTER NEW USER
// ==============================================
// Method: POST
// URL: /api/v1/auth/register
// Body: { name, phone, nid, epin, role }
// Response: { success, message, data: { user, token } }

router.post('/register', async (req, res) => {
  
  // Get a client from connection pool for transaction
  const client = await db.connect();
  
  try {
    // ==========================================
    // STEP 1: EXTRACT DATA FROM REQUEST BODY
    // ==========================================
    const { name, phone, nid, epin, role } = req.body;
    
    // ==========================================
    // STEP 2: VALIDATE INPUT DATA
    // ==========================================
    
    // Check if all required fields are present
    if (!name || !phone || !nid || !epin || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required (name, phone, nid, epin, role)' 
      });
    }
    
    // Validate phone number format (must be Bangladeshi number)
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid phone number. Format: 01XXXXXXXXX' 
      });
    }
    
    // Validate NID length (10-17 digits)
    if (nid.length < 10 || nid.length > 17) {
      return res.status(400).json({ 
        success: false, 
        message: 'NID must be between 10 and 17 characters' 
      });
    }
    
    // Validate ePin (must be exactly 5 digits)
    if (epin.length !== 5 || !/^\d+$/.test(epin)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ePin must be exactly 5 digits' 
      });
    }
    
    // Validate role (must be user, agent, or admin)
    const validRoles = ['user', 'agent', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role must be user, agent, or admin' 
      });
    }
    
    // ==========================================
    // STEP 3: START DATABASE TRANSACTION
    // ==========================================
    // A transaction ensures all queries succeed or all fail together
    // If anything fails, we ROLLBACK to undo all changes
    await client.query('BEGIN');
    
    // ==========================================
    // STEP 4: HASH THE EPIN
    // ==========================================
    // Never store passwords in plain text!
    // Hash converts "12345" into "$2a$10$abc123..."
    const epinHash = await hashPassword(epin);
    
    // ==========================================
    // STEP 5: INSERT USER INTO DATABASE
    // ==========================================
    const insertUserQuery = `
      INSERT INTO users (name, phone, nid, epin_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, name, phone, nid, role, status, created_at
    `;
    
    const userResult = await client.query(insertUserQuery, [
      name,
      phone,
      nid,
      epinHash,    // Store hashed ePin, not plain text
      role,
      'active'     // New users are active by default
    ]);
    
    const newUser = userResult.rows[0];
    
    // ==========================================
    // STEP 6: CREATE WALLET FOR THE USER
    // ==========================================
    // Every user needs a wallet to store money
    // Wallet type depends on role: 'agent' or 'user'
    
    const walletType = (role === 'agent') ? 'agent' : 'user';
    
    const insertWalletQuery = `
      INSERT INTO wallets (user_id, wallet_type, balance, status)
      VALUES ($1, $2, $3, $4)
      RETURNING wallet_id, wallet_type, balance, status
    `;
    
    const walletResult = await client.query(insertWalletQuery, [
      newUser.user_id,
      walletType,
      0.00,        // Initial balance is 0
      'active'
    ]);
    
    const newWallet = walletResult.rows[0];
    
    // ==========================================
    // STEP 7: COMMIT TRANSACTION
    // ==========================================
    // All queries succeeded, save changes to database
    await client.query('COMMIT');
    
    // ==========================================
    // STEP 8: GENERATE JWT TOKEN
    // ==========================================
    // Token allows user to stay logged in
    const token = generateToken(newUser.user_id, newUser.role);
    
    // ==========================================
    // STEP 9: SEND SUCCESS RESPONSE
    // ==========================================
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          ...newUser,
          wallet: newWallet
        },
        token: token
      }
    });
    
  } catch (error) {
    // ==========================================
    // ERROR HANDLING
    // ==========================================
    
    // Rollback transaction if anything failed
    await client.query('ROLLBACK');
    
    console.error('Registration error:', error);
    
    // Check for unique constraint violation (phone or NID already exists)
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number or NID already registered' 
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed. Please try again.' 
    });
    
  } finally {
    // ==========================================
    // CLEANUP: RELEASE DATABASE CLIENT
    // ==========================================
    // Always release client back to pool, even if error occurs
    client.release();
  }
});

// ==============================================
// ROUTE 2: LOGIN USER
// ==============================================
// Method: POST
// URL: /api/v1/auth/login
// Body: { phone, epin }
// Response: { success, message, data: { user, token } }

router.post('/login', async (req, res) => {
  try {
    // ==========================================
    // STEP 1: EXTRACT LOGIN CREDENTIALS
    // ==========================================
    const { phone, epin } = req.body;
    
    // ==========================================
    // STEP 2: VALIDATE INPUT
    // ==========================================
    if (!phone || !epin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone and ePin are required' 
      });
    }
    
    if (epin.length !== 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'ePin must be 5 digits' 
      });
    }
    
    // ==========================================
    // STEP 3: FIND USER BY PHONE NUMBER
    // ==========================================
    // Join users table with wallets table to get all info at once
    const findUserQuery = `
      SELECT 
        u.user_id, 
        u.name, 
        u.phone, 
        u.nid, 
        u.epin_hash, 
        u.role, 
        u.status,
        w.wallet_id, 
        w.wallet_type, 
        w.balance, 
        w.status as wallet_status
      FROM users u
      LEFT JOIN wallets w ON u.user_id = w.user_id 
      WHERE u.phone = $1 AND w.wallet_type IN ('user', 'agent')
    `;
    
    const result = await query(findUserQuery, [phone]);
    
    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid phone number or ePin' 
      });
    }
    
    const user = result.rows[0];
    
    // ==========================================
    // STEP 4: CHECK ACCOUNT STATUS
    // ==========================================
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is not active. Please contact support.' 
      });
    }
    
    // ==========================================
    // STEP 5: VERIFY EPIN
    // ==========================================
    // Compare plain text ePin with hashed ePin from database
    const isValidEpin = await comparePassword(epin, user.epin_hash);
    
    if (!isValidEpin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid phone number or ePin' 
      });
    }
    
    // ==========================================
    // STEP 6: PREPARE USER DATA
    // ==========================================
    // Remove sensitive information (epin_hash) before sending to client
    const userData = {
      user_id: user.user_id,
      name: user.name,
      phone: user.phone,
      nid: user.nid,
      role: user.role,
      status: user.status,
      wallet: {
        wallet_id: user.wallet_id,
        wallet_type: user.wallet_type,
        balance: parseFloat(user.balance),  // Convert to number
        status: user.wallet_status
      }
    };
    
    // ==========================================
    // STEP 7: GENERATE JWT TOKEN
    // ==========================================
    const token = generateToken(user.user_id, user.role);
    
    // ==========================================
    // STEP 8: SEND SUCCESS RESPONSE
    // ==========================================
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token: token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
});

// ==============================================
// ROUTE 3: GET USER PROFILE
// ==============================================
// Method: GET
// URL: /api/v1/auth/profile
// Headers: Authorization: Bearer <token>
// Response: { success, message, data: user }
// NOTE: This route is PROTECTED - requires valid JWT token

router.get('/profile', protect, async (req, res) => {
  try {
    // ==========================================
    // STEP 1: GET USER ID FROM TOKEN
    // ==========================================
    // The 'protect' middleware adds req.user to the request
    const userId = req.user.userId;
    
    // ==========================================
    // STEP 2: FETCH USER PROFILE FROM DATABASE
    // ==========================================
    const profileQuery = `
      SELECT 
        u.user_id, 
        u.name, 
        u.phone, 
        u.nid, 
        u.role, 
        u.status, 
        u.created_at,
        w.wallet_id, 
        w.wallet_type, 
        w.balance, 
        w.status as wallet_status
      FROM users u
      LEFT JOIN wallets w ON u.user_id = w.user_id
      WHERE u.user_id = $1 AND w.wallet_type IN ('user', 'agent')
    `;
    
    const result = await query(profileQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const user = result.rows[0];
    
    // ==========================================
    // STEP 3: FORMAT USER DATA
    // ==========================================
    const userData = {
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
    
    // ==========================================
    // STEP 4: SEND RESPONSE
    // ==========================================
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: userData
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get profile' 
    });
  }
});

// ==============================================
// ROUTE 4: LOGOUT
// ==============================================
// Method: POST
// URL: /api/v1/auth/logout
// Headers: Authorization: Bearer <token>
// Response: { success, message }
// NOTE: Actual logout happens on client side (delete token from localStorage)

router.post('/logout', protect, (req, res) => {
  // Client-side will delete the token from localStorage
  // Server doesn't need to do anything since JWT is stateless
  res.json({ 
    success: true, 
    message: 'Logout successful' 
  });
});

// Export router to be used in server.js
export default router;
