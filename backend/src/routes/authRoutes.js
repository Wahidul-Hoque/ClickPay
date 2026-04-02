// ==============================================
// AUTH ROUTES (The Menu)
// ==============================================
// This file defines authentication endpoints

import express from 'express';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ==============================================
// PUBLIC ROUTES (No authentication required)
// ==============================================

// Register new user
// POST /api/v1/auth/register
router.post('/register', authController.register);

// Login user
// POST /api/v1/auth/login
router.post('/login', authController.login);

// Forgot Password Flow
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOtp);
router.post('/reset-password', authController.resetPassword);

// ==============================================
// PROTECTED ROUTES (Authentication required)
// ==============================================

// Get current user profile
// GET /api/v1/auth/profile
router.get('/profile', protect, authController.getProfile);

// Update profile (name/city)
// PATCH /api/v1/auth/profile
router.patch('/profile', protect, authController.updateProfile);

// Logout user
// POST /api/v1/auth/logout
router.post('/logout', protect, authController.logout)

// Change user PIN
// POST /api/v1/auth/change-pin
router.post('/change-pin', protect, authController.changePin);

export default router;
