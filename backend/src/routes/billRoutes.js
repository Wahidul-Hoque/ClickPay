import express from 'express';
import billController from '../controllers/billController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Exposes all active organizations registered for utility billing
router.get('/billers', protect, billController.getBillers);

// Filters billers by their respective utility categories
router.get('/billers/category/:category', protect, billController.getBillersByCategory);

// Securely processes the settlement of an outstanding service bill
router.post('/pay', protect, billController.pay);

// Lists all successful bill payment transactions for the user
router.get('/history', protect, billController.getHistory);

export default router;