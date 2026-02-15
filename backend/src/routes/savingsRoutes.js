import express from 'express';
import savingsController from '../controllers/savingsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();


// Create a savings account
// POST /api/v1/savings/create
router.post('/create', protect, savingsController.create);

// Get user's savings accounts
// GET /api/v1/savings/my-savings
router.get('/my-savings', protect, savingsController.getMySavings);

// Break/close a savings account
// POST /api/v1/savings/break/:savingsId
router.post('/break/:savingsId', protect, savingsController.breakSavings);

// Get savings account details
// GET /api/v1/savings/:savingsId
router.get('/:savingsId', protect, savingsController.getSavingsDetails);

export default router;