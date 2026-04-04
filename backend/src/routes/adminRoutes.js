import express from 'express';
import adminController from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here require Admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard',protect, adminController.getDashboardData);
router.get('/dashboard/trend',protect, adminController.getTrendData);
router.get('/dashboard/segmentation', protect, adminController.getSegmentationData);
router.get('/users', protect, adminController.getUsers);
router.get('/users/:id/transactions', protect, adminController.getUserTransactions);
router.patch('/users/:id/status', protect, adminController.updateUserStatus);
router.get('/cities', protect, adminController.getCities);
router.get('/agent/rankings', protect, adminController.getRankings);
router.get('/agent/regions', protect, adminController.getRegions);
router.get('/merchant/rankings', protect, adminController.getMerchantRankings);
router.get('/merchant/regions', protect, adminController.getMerchantRegions);
router.post('/notifications/send', protect, adminController.sendNotification);
router.get('/notifications/sent', protect, adminController.getSentNotifications);
router.get('/savings/active', protect, adminController.getActiveSavings);

// Fraud Detection routes
router.get('/fraud/alerts', protect, adminController.getFraudAlerts);
router.post('/fraud/alerts/:id/resolve', protect, adminController.resolveFraudAlert);
router.get('/fraud/stats', protect, adminController.getFraudStats);

// System Settings
router.get('/settings', protect, adminController.getSettings);
router.patch('/settings', protect, adminController.updateSetting);

export default router;
