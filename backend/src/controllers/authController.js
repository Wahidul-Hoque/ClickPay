import authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/response.js';

class AuthController {
  // Register new user
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return successResponse(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  // Login user
  async login(req, res, next) {
    try {
      const { phone, epin } = req.body;
      const result = await authService.login(phone, epin);
      return successResponse(res, result, 'Login successful');
    } catch (error) {
      if (error.message.includes('Invalid')) {
        return errorResponse(res, error.message, 401);
      }
      next(error);
    }
  }

  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const profile = await authService.getProfile(userId);
      return successResponse(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Logout (client-side token removal)
  async logout(req, res) {
    return successResponse(res, null, 'Logout successful');
  }
}

export default new AuthController();
