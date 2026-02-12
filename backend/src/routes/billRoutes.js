import express from 'express';
import { protect } from '../middlewares/auth.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

// Get all billers
router.get('/billers', protect, (req, res) => {
  successResponse(res, [], 'Get billers endpoint - To be implemented');
});

// Get biller by category
router.get('/billers/category/:category', protect, (req, res) => {
  successResponse(res, [], 'Get billers by category endpoint - To be implemented');
});

// Pay bill
router.post('/pay', protect, (req, res) => {
  successResponse(res, null, 'Pay bill endpoint - To be implemented');
});

// Get bill payment history
router.get('/history', protect, (req, res) => {
  successResponse(res, [], 'Bill payment history endpoint - To be implemented');
});

export default router;
