// ==============================================
// AUTH CONTROLLER (The Waiter)
// ==============================================

import authService from '../services/authService.js';

class AuthController {
  // POST /api/v1/auth/register
  // Body: { name, phone,city , nid, epin, role }
  async register(req, res, next) {
    try {
      // Validate input
      const { name, phone, city, nid, epin, role } = req.body;

      if (!name || !phone || !city || !nid || !epin || !role) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required '
        });
      }

      // Validate phone format
      const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number.'
        });
      }

      // Validate NID length
      if (nid.length < 10 || nid.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'NID must be exactly 10 digits'
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

      // Call service to register user
      const result = await authService.register(req.body);

      //Send success response
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });

    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'A user with this phone number or NID already exists'
        });
      }
      next(error);
    }
  }

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

      // Call service to login user
      const result = await authService.login(phone, epin);

      // Send success response
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

  // GET /api/v1/auth/profile
  // Headers: Authorization: Bearer <token>
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      const profile = await authService.getProfile(userId);

      return res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile
      });

    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/auth/logout
  // Headers: Authorization: Bearer <token>
  async logout(req, res) {
    return res.json({
      success: true,
      message: 'Logout successful'
    });
  }
}

export default new AuthController();
