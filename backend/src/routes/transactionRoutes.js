// ==============================================
// TRANSACTION ROUTES (The Menu)
// ==============================================
// This file defines transaction endpoints

import express from 'express';
import transactionController from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ==============================================
// PROTECTED ROUTES (All require authentication)
// ==============================================

// Send money to another user
// POST /api/v1/transactions/send
router.post('/send', protect, transactionController.send);

// Get transaction history
// GET /api/v1/transactions/history?page=1&limit=10
router.get('/history', protect, transactionController.getHistory);

// Request money from another user
// POST /api/v1/transactions/request
router.post('/request', protect, transactionController.request);

// Cash in (agents only)
// POST /api/v1/transactions/cash-in
router.post('/cash-in', protect, authorize('agent'), transactionController.cashIn);

// Cash out
// POST /api/v1/transactions/cash-out
router.post('/cash-out', protect, transactionController.cashOut);

export default router;
