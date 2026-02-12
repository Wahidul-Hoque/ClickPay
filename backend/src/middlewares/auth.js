import { verifyToken } from '../utils/auth.js';
import { errorResponse } from '../utils/response.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Not authorized, no token', 401);
    }

    // Verify token
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 'Not authorized, token failed', 401);
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      );
    }
    next();
  };
};
