import express from 'express';
import savingsController from '../controllers/savingsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, savingsController.create);
router.get('/accounts', protect, savingsController.getAccounts);
router.post('/accounts/:id/break', protect, savingsController.breakAccount);

export default router;