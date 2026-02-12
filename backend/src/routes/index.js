import express from 'express';
import authRoutes from './authRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import walletRoutes from './walletRoutes.js';
import qrRoutes from './qrRoutes.js';
import billRoutes from './billRoutes.js';
import loanRoutes from './loanRoutes.js';
import savingsRoutes from './savingsRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';

const router = express.Router();

// API version
const API_VERSION = '/api/v1';

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ClickPay API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/transactions`, transactionRoutes);
router.use(`${API_VERSION}/wallet`, walletRoutes);
router.use(`${API_VERSION}/qr`, qrRoutes);
router.use(`${API_VERSION}/bills`, billRoutes);
router.use(`${API_VERSION}/loans`, loanRoutes);
router.use(`${API_VERSION}/savings`, savingsRoutes);
router.use(`${API_VERSION}/subscriptions`, subscriptionRoutes);

export default router;
