// ==============================================
// AUTHENTICATION MIDDLEWARE (The Security Guard)
// ==============================================
// This middleware protects routes and verifies JWT tokens

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ==============================================
// PROTECT MIDDLEWARE - Verify JWT Token
// ==============================================
// Use this to protect routes that require authentication
// Example: router.get('/profile', protect, controller.getProfile)
export const protect = async (req, res, next) => {
  try {
    // STEP 1: Get token from Authorization header
    // Format: "Authorization: Bearer eyJhbGciOiJIUzI1..."
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.'
      });
    }

    // STEP 2: Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // STEP 3: Add user info to request
    // Now you can access req.user.userId and req.user.role in controllers
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    // STEP 4: Continue to next middleware/controller
    next();

  } catch (error) {
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

// ==============================================
// AUTHORIZE ROLES - Role-based Access Control
// ==============================================
// Restrict access to certain roles
// Example: router.post('/cash-in', protect, authorize('agent'), controller.cashIn)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${roles.join(', ')} can access this route.`
      });
    }
    next();
  };
};

// ==============================================
// HASH PASSWORD - For Registration
// ==============================================
// Use this in services when creating new users
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// ==============================================
// COMPARE PASSWORD - For Login
// ==============================================
// Use this in services when verifying login
export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// ==============================================
// GENERATE JWT TOKEN
// ==============================================
// Creates a JWT token for authenticated users
export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};
