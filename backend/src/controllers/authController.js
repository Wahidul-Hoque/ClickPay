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
      const { name, phone, email, city, nid, epin, role } = req.body;

      if (!name || !phone || !email || !city || !nid || !epin || !role) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required '
        });
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address.'
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
      const validRoles = ['user', 'agent', 'admin', 'merchant'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be user, agent, admin, or merchant'
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
      if (error.message.includes('Account locked')) {
        return res.status(423).json({
          success: false,
          message: error.message
        });
      }
      if (error.message.includes('not active')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }
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

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const { name, city } = req.body;

      if (!name && !city) {
        return res.status(400).json({
          success: false,
          message: 'Name or city must be provided'
        });
      }

      const updatedUser = await authService.updateProfile(userId, { name, city });

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
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

async changePin(req, res, next) {
  try {
    const userId = req.user.userId;
    const { oldPin, newPin } = req.body;

    if (!oldPin || !newPin) {
      return res.status(400).json({
        success: false,
        message: 'Old and new PIN are required'
      });
    }

    if (newPin.length !== 5) {
      return res.status(400).json({
        success: false,
        message: 'New PIN must be 5 digits'
      });
    }
    if (oldPin === newPin) {
      return res.status(400).json({
        success: false,
        message: 'New PIN must be different from old PIN'
      });
    }

    const result = await authService.changePin(userId, oldPin, newPin);

    return res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
      if (error.message === 'Incorrect old PIN') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // ==============================================
  // FORGOT PASSWORD
  // ==============================================

  async forgotPassword(req, res, next) {
    try {
      const { phone } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      const result = await authService.forgotPassword(phone);
      return res.status(200).json({ 
        success: true, 
        message: result.message, 
        maskedEmail: result.maskedEmail,
        previewUrl: result.previewUrl 
      });
    } catch (error) {
      if (error.message.includes('No account found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async verifyResetOtp(req, res, next) {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) {
        return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
      }

      const result = await authService.verifyResetOtp(phone, otp);
      return res.status(200).json(result);
    } catch (error) {
      if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('not found')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { phone, otp, newEpin } = req.body;
      if (!phone || !otp || !newEpin) {
        return res.status(400).json({ success: false, message: 'Phone, OTP, and new ePin are required' });
      }

      if (newEpin.length !== 5 || !/^\d+$/.test(newEpin)) {
        return res.status(400).json({
          success: false,
          message: 'ePin must be exactly 5 digits'
        });
      }

      const result = await authService.resetPassword(phone, otp, newEpin);
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('not found')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

export default new AuthController();
