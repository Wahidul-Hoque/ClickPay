

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

export const protect = async (req, res, next) => {
  console.log(`[PROTECT] Request received from ${req.ip}`);
  try {
    // STEP 1: Get token from Authorization header
  
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.warn('[PROTECT] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.'
      });
    }

    // STEP 2: Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[PROTECT] Token decoded for User: ${decoded.userId}`);

  
    const query = 'SELECT user_id, name, role, status FROM users WHERE user_id = $1';
    const result = await pool.query(query, [decoded.userId]);

    const currentUser = result.rows[0];

    if (!currentUser) {
      console.warn(`[PROTECT] User ${decoded.userId} not found in DB`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User not found.'
      });
    }

    if (currentUser.status !== 'active') {
      console.warn(`[PROTECT] User ${decoded.userId} is INACTIVE`);
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      });
    }
    // STEP 3: Add user info to request
 
    req.user = {
      userId: currentUser.user_id,
      role: currentUser.role,
      name: currentUser.name
    };
    console.log(`[PROTECT] Authorized for user ${req.user.userId} (${req.user.role})`);

    // STEP 4: Continue to next middleware/controller
    next();

  } catch (error) {
    console.error('[PROTECT] ERROR:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid token.'
    });
  }
};

// Restrict access to certain roles

export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log(`[AUTH] Checking roles for user ${req.user.userId}: ${req.user.role} vs required: ${roles}`);
    if (!roles.includes(req.user.role)) {
      console.warn(`[AUTH] DENIED: User ${req.user.userId} has role ${req.user.role}`);     
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${roles.join(', ')} can access this route.`
      });
    }
    console.log(`[AUTH] PASSED for user ${req.user.userId}`);
    next();
  };
};

// ==============================================
// HASH PASSWORD - For Registration
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// ==============================================
// COMPARE PASSWORD - For Login

export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// ==============================================
// GENERATE JWT TOKEN

export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};
