import express from 'express';
import loanController from '../controllers/loanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
// Personal loan lifecycle management for authenticated users
router.get('/status', protect, loanController.getStatus);
router.post('/apply', protect, loanController.apply);
router.post('/repay/:loanId', protect, loanController.repay);

// Administrative oversight for application processing and loan auditing
router.get('/admin/applications', protect, loanController.adminGetAll);
router.post('/admin/approve/:id', protect, loanController.adminApprove);
router.post('/admin/reject/:id', protect, loanController.adminReject);
router.get('/admin/detailed', protect, loanController.adminGetDetailedLoans);
export default router;