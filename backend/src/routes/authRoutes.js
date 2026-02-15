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

// ==============================================
// PROTECTED ROUTES (Authentication required)
// ==============================================

// Get current user profile
// GET /api/v1/auth/profile
router.get('/profile', protect, authController.getProfile);

// Logout user
// POST /api/v1/auth/logout
router.post('/logout', protect, authController.logout);

export default router;
