// ==============================================
// AUTH CONTROLLER (The Waiter)
// ==============================================
// This file handles HTTP requests/responses for authentication
// It calls the authService (Kitchen) to do the actual work

import authService from '../services/authService.js';

class AuthController {
  // ==============================================
  // REGISTER NEW USER
  // ==============================================
  // POST /api/v1/auth/register
  // Body: { name, phone, nid, epin, role }
  async register(req, res, next) {
    try {
      // STEP 1: Validate input
      const { name, phone, nid, epin, role } = req.body;
      
      if (!name || !phone || !nid || !epin || !role) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required (name, phone, nid, epin, role)'
        });
      }

      // Validate phone format
      const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number. Format: 01XXXXXXXXX'
        });
      }

      // Validate NID length
      if (nid.length < 10 || nid.length > 17) {
        return res.status(400).json({
          success: false,
          message: 'NID must be between 10 and 17 characters'
        });
      }

      // Validate ePin
      if (epin.length !== 5 || !/^\d+$/.test(epin)) {
        return res.status(400).json({
          success: false,
          message: 'ePin must be exactly 5 digits'
        });
      }

      // Validate role
      const validRoles = ['user', 'agent', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be user, agent, or admin'
        });
      }

      // STEP 2: Call service to register user
      const result = await authService.register(req.body);

      // STEP 3: Send success response
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });

    } catch (error) {
      // Pass error to error handler middleware
      next(error);
    }
  }

  // ==============================================
  // LOGIN USER
  // ==============================================
  // POST /api/v1/auth/login
  // Body: { phone, epin }
  async login(req, res, next) {
    try {
      // STEP 1: Validate input
      const { phone, epin } = req.body;

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

      // STEP 2: Call service to login user
      const result = await authService.login(phone, epin);

      // STEP 3: Send success response
      return res.json({
        success: true,
        message: 'Login successful',
        data: result
      });

    } catch (error) {
      // Handle specific errors
      if (error.message.includes('Invalid')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // ==============================================
  // GET USER PROFILE
  // ==============================================
  // GET /api/v1/auth/profile
  // Headers: Authorization: Bearer <token>
  async getProfile(req, res, next) {
    try {
      // User ID comes from JWT token (added by protect middleware)
      const userId = req.user.userId;

      // Call service to get profile
      const profile = await authService.getProfile(userId);

      // Send success response
      return res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile
      });

    } catch (error) {
      next(error);
    }
  }

  // ==============================================
  // LOGOUT USER
  // ==============================================
  // POST /api/v1/auth/logout
  // Headers: Authorization: Bearer <token>
  async logout(req, res) {
    // Logout happens on client-side (delete token from localStorage)
    // Server doesn't need to do anything since JWT is stateless
    return res.json({
      success: true,
      message: 'Logout successful'
    });
  }
}

// Export a single instance
export default new AuthController();
