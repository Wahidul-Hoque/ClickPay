import express from 'express';
import merchantSubscriptionController from '../controllers/merchantSubscriptionController.js';
import merchantController from '../controllers/merchantController.js';
import transactionController from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Merchant dashboard metrics and competitive ranking access
router.get('/dashboard', authorize('merchant'), merchantController.getDashboard);
router.get('/rankings', merchantController.getMerchantRankings);
router.get('/regions', merchantController.getMerchantRegions);

// Billing and active subscription lifecycle management
router.get('/subscription/status', authorize('merchant'), merchantSubscriptionController.getStatus);

router.post('/subscription/subscribe', authorize('merchant'), merchantSubscriptionController.subscribe);

// Specialized business-to-customer money transfers with commission logic
router.post('/send', authorize('merchant'), transactionController.merchantSend);

// Public merchant profile retrieval and discovery
router.get('/', merchantController.getAllMerchants);
router.get('/:id', merchantController.getMerchantDetails);

export default router;
