import express from 'express';
import qrController from '../controllers/qrController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ==============================================
// PROTECTED ROUTES (All require authentication)
// ==============================================

// Generate QR code for payment
// POST /api/v1/qr/generate
router.post('/generate', protect, qrController.generate);

// Scan and process QR code payment
// POST /api/v1/qr/scan
router.post('/scan', protect, qrController.scan);

// Get user's QR codes
// GET /api/v1/qr/my-codes
router.get('/my-codes', protect, qrController.getMyCodes);

export default router;