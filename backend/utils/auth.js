// ==============================================
// AUTHENTICATION & SECURITY UTILITIES
// ==============================================
// This file contains helper functions for:
// 1. Password hashing (bcrypt)
// 2. Password verification
// 3. JWT token generation
// 4. JWT token verification (middleware)

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ==============================================
// PASSWORD HASHING
// ==============================================
// Converts plain text password into a secure hash
// We use bcrypt with salt rounds = 10 (good balance of security and speed)
// Example: "12345" becomes "$2a$10$N9qo8uLOickgx2ZMRZoMye..."
export const hashPassword = async (password) => {
  const saltRounds = 10;  // How many times to hash (higher = more secure but slower)
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// ==============================================
// PASSWORD VERIFICATION
// ==============================================
// Compares plain text password with hashed password
// Returns true if they match, false otherwise
// Example: comparePassword("12345", "$2a$10$N9qo8u...") -> true or false
export const comparePassword = async (plainPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
};

// ==============================================
// JWT TOKEN GENERATION
// ==============================================
// Creates a JWT token containing user information
// Token expires after 7 days
// Token structure: Header.Payload.Signature
// Payload contains: { userId, role, iat, exp }
export const generateToken = (userId, role) => {
  const payload = {
    userId: userId,   // User's ID from database
    role: role        // User's role (user, agent, admin)
  };
  
  const options = {
    expiresIn: '7d'   // Token valid for 7 days
  };
  
  // Sign the token with secret key from .env
  const token = jwt.sign(payload, process.env.JWT_SECRET, options);
  return token;
};

// ==============================================
// VERIFY JWT TOKEN (MIDDLEWARE)
// ==============================================
// This middleware function protects routes
// It checks if user has a valid token before allowing access
// Add this to any route that requires authentication
// Example: router.get('/profile', protect, (req, res) => {...})

export const protect = async (req, res, next) => {
  try {
    // STEP 1: Get token from Authorization header
    // Format: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Please login.' 
      });
    }
    
    // Extract token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];
    
    // STEP 2: Verify token with secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // STEP 3: Add user info to request object
    // Now you can access req.user.userId and req.user.role in your routes
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    
    // STEP 4: Continue to next middleware/route handler
    next();
    
  } catch (error) {
    // Token is invalid or expired
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Please login again.' 
    });
  }
};

// ==============================================
// ROLE-BASED AUTHORIZATION (OPTIONAL)
// ==============================================
// Restricts access based on user role
// Example: Only agents can access cash-in route
// Usage: router.post('/cash-in', protect, authorizeRole('agent'), handler)

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${allowedRoles.join(', ')} can access this.`
      });
    }
    next();
  };
};
