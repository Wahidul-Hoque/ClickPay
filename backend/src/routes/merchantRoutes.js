import express from 'express';
import merchantSubscriptionController from '../controllers/merchantSubscriptionController.js';
import merchantController from '../controllers/merchantController.js';
import transactionController from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Dashboard and public discovery (if needed)
router.get('/dashboard', authorize('merchant'), merchantController.getDashboard);
router.get('/rankings', merchantController.getMerchantRankings);
router.get('/regions', merchantController.getMerchantRegions);

// Subscription status (Accessible by merchants)
router.get('/subscription/status', authorize('merchant'), merchantSubscriptionController.getStatus);

// Process subscription pay
router.post('/subscription/subscribe', authorize('merchant'), merchantSubscriptionController.subscribe);

// Send money (1.25% commission)
router.post('/send', authorize('merchant'), transactionController.merchantSend);

// Discovery
router.get('/', merchantController.getAllMerchants);
router.get('/:id', merchantController.getMerchantDetails);

export default router;
