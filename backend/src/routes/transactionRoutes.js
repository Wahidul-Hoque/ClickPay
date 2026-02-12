import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

// Placeholder routes - implement these later

// Send money to another user
router.post('/send', protect, (req, res) => {
  successResponse(res, null, 'Send money endpoint - To be implemented');
});

// Request money from another user
router.post('/request', protect, (req, res) => {
  successResponse(res, null, 'Request money endpoint - To be implemented');
});

// Cash in (for agents)
router.post('/cash-in', protect, authorize('agent'), (req, res) => {
  successResponse(res, null, 'Cash in endpoint - To be implemented');
});

// Cash out
router.post('/cash-out', protect, (req, res) => {
  successResponse(res, null, 'Cash out endpoint - To be implemented');
});

// Get transaction history
router.get('/history', protect, (req, res) => {
  successResponse(res, [], 'Transaction history endpoint - To be implemented');
});

// Get transaction details
router.get('/:transactionId', protect, (req, res) => {
  successResponse(res, null, 'Transaction details endpoint - To be implemented');
});

export default router;
