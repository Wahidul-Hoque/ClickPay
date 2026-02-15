import express from 'express';
import loanController from '../controllers/loanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply for a loan
// POST /api/v1/loans/apply
router.post('/apply', protect, loanController.apply);

// Get user's loans
// GET /api/v1/loans/my-loans
router.get('/my-loans', protect, loanController.getMyLoans);

// Repay a loan
// POST /api/v1/loans/repay/:loanId
router.post('/repay/:loanId', protect, loanController.repay);

// Get loan details
// GET /api/v1/loans/:loanId
router.get('/:loanId', protect, loanController.getLoanDetails);

export default router;