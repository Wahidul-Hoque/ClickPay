import express from 'express';
import subscriptionController from '../controllers/subscriptionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, subscriptionController.getDashboard);
router.post('/subscribe', protect, subscriptionController.subscribe);
router.patch('/:id/toggle-renew', protect, subscriptionController.toggleRenew);

export default router;