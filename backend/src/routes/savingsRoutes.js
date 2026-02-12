import express from 'express';
import { protect } from '../middlewares/auth.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

// Create fixed savings account
router.post('/create', protect, (req, res) => {
  successResponse(res, null, 'Create fixed savings endpoint - To be implemented');
});

// Get all savings accounts
router.get('/accounts', protect, (req, res) => {
  successResponse(res, [], 'Get savings accounts endpoint - To be implemented');
});

// Get savings account details
router.get('/accounts/:savingsId', protect, (req, res) => {
  successResponse(res, null, 'Savings account details endpoint - To be implemented');
});

// Break savings account
router.post('/accounts/:savingsId/break', protect, (req, res) => {
  successResponse(res, null, 'Break savings account endpoint - To be implemented');
});

// Calculate interest
router.get('/accounts/:savingsId/interest', protect, (req, res) => {
  successResponse(res, { interest: 0 }, 'Calculate interest endpoint - To be implemented');
});

export default router;
