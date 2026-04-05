

import authService from '../services/authService.js';

class AuthController {
  // Validates user input and creates a new account across all supported roles
  async register(req, res, next) {
    try {
      const { name, phone, email, city, nid, epin, role } = req.body;

      if (!name || !phone || !email || !city || !nid || !epin || !role) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required '
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email address.'
        });
      }

      const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number.'
        });
      }

      if (nid.length < 10 || nid.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'NID must be exactly 10 digits'
        });
      }

      if (epin.length !== 5 || !/^\d+$/.test(epin)) {
        return res.status(400).json({
          success: false,
          message: 'ePin must be exactly 5 digits'
        });
      }

      const validRoles = ['user', 'agent', 'admin', 'merchant'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be user, agent, admin, or merchant'
        });
      }

      const result = await authService.register(req.body);

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

  // Authenticates credentials and returns a secure JWT token for session management
  async login(req, res, next) {
    try {
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

      const result = await authService.login(phone, epin);

      return res.json({
        success: true,
        message: 'Login successful',
        data: result
      });

    } catch (error) {
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

  // Retrieves the complete authorized profile for the currently logged-in user
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

  // Updates mutable profile fields like name and city for the active user
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
  // Terminates the current session by acknowledging a logout request
  async logout(req, res) {
    return res.json({
      success: true,
      message: 'Logout successful'
    });
  }

  // Securely updates the user's ePin after verifying their current one
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

  // Initiates the recovery flow by generating and emailing a reset OTP
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

  // Validates a provided OTP against the stored recovery record
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

  // Finalizes the PIN reset using a verified OTP and a new ePin value
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
