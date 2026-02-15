import express from 'express';
import walletController from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();


// Get wallet balance
// GET /api/v1/wallet/balance
router.get('/balance', protect, walletController.getBalance);

// External top-up
// POST /api/v1/wallet/topup
router.post('/topup', protect, walletController.topup);

// Get payment methods
// GET /api/v1/wallet/payment-methods
router.get('/payment-methods', protect, walletController.getPaymentMethods);

// Add payment method
// POST /api/v1/wallet/payment-methods
router.post('/payment-methods', protect, walletController.addPaymentMethod);

export default router;