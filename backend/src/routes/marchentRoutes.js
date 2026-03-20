import express from 'express';
import merchantController from '../controllers/merchantController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken); // Users must be logged in to see merchants

router.get('/', merchantController.getAllMerchants);
router.get('/:id', merchantController.getMerchantDetails);

export default router;