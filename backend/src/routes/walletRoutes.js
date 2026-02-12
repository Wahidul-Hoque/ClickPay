import express from 'express';
import { protect } from '../middlewares/auth.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

// Get wallet balance
router.get('/balance', protect, (req, res) => {
  successResponse(res, { balance: 0 }, 'Wallet balance endpoint - To be implemented');
});

// Get wallet transactions
router.get('/transactions', protect, (req, res) => {
  successResponse(res, [], 'Wallet transactions endpoint - To be implemented');
});

// Add payment method
router.post('/payment-methods', protect, (req, res) => {
  successResponse(res, null, 'Add payment method endpoint - To be implemented');
});

// Get payment methods
router.get('/payment-methods', protect, (req, res) => {
  successResponse(res, [], 'Get payment methods endpoint - To be implemented');
});

// External top-up
router.post('/topup', protect, (req, res) => {
  successResponse(res, null, 'External top-up endpoint - To be implemented');
});

export default router;
