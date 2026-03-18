import express from 'express';
import adminController from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here require Admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboardData);
router.get('/dashboard/trend', adminController.getTrendData);
router.get('/dashboard/segmentation', adminController.getSegmentationData);
router.get('/users', adminController.getUsers);
router.get('/users/:id/transactions', adminController.getUserTransactions);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/cities', adminController.getCities);
router.get('/agent/rankings', adminController.getRankings);
router.get('/agent/regions', adminController.getRegions);

export default router;