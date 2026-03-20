import express from 'express';
import subscriptionController from '../controllers/subscriptionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/my-subscriptions', subscriptionController.getMySubscriptions);
router.post('/subscribe', subscriptionController.subscribe);
router.patch('/:id/status', subscriptionController.updateStatus); // Added this

export default router;