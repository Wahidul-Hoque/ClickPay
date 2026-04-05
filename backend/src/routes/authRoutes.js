

import express from 'express';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();


// Registers a new user account with role-based wallet initialization
router.post('/register', authController.register);

// Authenticates user and returns a session token
router.post('/login', authController.login);

// Handles the end-to-end PIN recovery flow via OTP
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);



// Fetches the profile data for the authenticated user
router.get('/profile', protect, authController.getProfile);

// Allows partial updates to user profile information
router.patch('/profile', protect, authController.updateProfile);

// Invalidates the current user session
router.post('/logout', protect, authController.logout)

// Updates the user's secure ePin
router.post('/change-pin', protect, authController.changePin);

export default router;
