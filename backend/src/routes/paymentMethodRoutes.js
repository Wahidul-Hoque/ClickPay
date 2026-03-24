import express from 'express';
import * as controller from '../controllers/paymentMethodController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get the master list for the "Selection" UI
router.get('/options', protect, controller.getOptions);

// Link a new external account (Handshake)
router.post('/link', protect, controller.linkMethod);

// Get the user's saved/linked accounts
router.get('/my-methods', protect, controller.getMyMethods);

// Perform the actual "Add Money" transaction
router.post('/topup', protect, controller.topupWallet);

export default router;