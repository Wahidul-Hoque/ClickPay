import express from 'express';
import billController from '../controllers/billController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ==============================================
// PROTECTED ROUTES (All require authentication)
// ==============================================

// Get list of available billers
// GET /api/v1/bills/billers
router.get('/billers', protect, billController.getBillers);

// Pay a utility bill
// POST /api/v1/bills/pay
router.post('/pay', protect, billController.pay);

// Get bill payment history
// GET /api/v1/bills/history?page=1&limit=10
router.get('/history', protect, billController.getHistory);

export default router;