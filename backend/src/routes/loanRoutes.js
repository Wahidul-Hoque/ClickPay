import express from 'express';
import loanController from '../controllers/loanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
// User routes
router.get('/status', protect, loanController.getStatus);
router.post('/apply', protect, loanController.apply);
router.post('/repay/:loanId', protect, loanController.repay);

// Admin routes
router.get('/admin/applications', protect, loanController.adminGetAll);
router.post('/admin/approve/:id', protect, loanController.adminApprove);
router.post('/admin/reject/:id', protect, loanController.adminReject);
router.get('/admin/detailed', protect, loanController.adminGetDetailedLoans);
export default router;