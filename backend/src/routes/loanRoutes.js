import express from 'express';
import { protect } from '../middlewares/auth.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

// Apply for loan
router.post('/apply', protect, (req, res) => {
  successResponse(res, null, 'Apply for loan endpoint - To be implemented');
});

// Get loan applications
router.get('/applications', protect, (req, res) => {
  successResponse(res, [], 'Get loan applications endpoint - To be implemented');
});

// Get active loans
router.get('/active', protect, (req, res) => {
  successResponse(res, [], 'Get active loans endpoint - To be implemented');
});

// Repay loan
router.post('/:loanId/repay', protect, (req, res) => {
  successResponse(res, null, 'Repay loan endpoint - To be implemented');
});

// Get loan details
router.get('/:loanId', protect, (req, res) => {
  successResponse(res, null, 'Loan details endpoint - To be implemented');
});

export default router;
