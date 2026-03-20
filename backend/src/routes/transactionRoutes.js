// Defines all transaction-related API endpoints.
// Order matters: specific paths must come before parameterised ones.

import express from 'express';
import transactionController from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes below require authentication
// ──────────────────────────────────────────────────────────────
// MONEY TRANSFER
// ──────────────────────────────────────────────────────────────

// Send money to another user
// POST /api/v1/transactions/send
router.post('/send', protect, transactionController.send);

// ──────────────────────────────────────────────────────────────
// MONEY REQUESTS
// ──────────────────────────────────────────────────────────────

// Create a money request (ask someone to pay you)
// POST /api/v1/transactions/request
router.post('/request', protect, transactionController.request);

// Get all incoming requests (people asking YOU for money)
// GET /api/v1/transactions/requests/incoming
router.get('/requests/incoming', protect, transactionController.getIncomingRequests);

// Get all requests YOU sent (you are asking others for money)
// GET /api/v1/transactions/requests/sent
router.get('/requests/sent', protect, transactionController.getSentRequests);

// Pay / approve a pending money request
// POST /api/v1/transactions/requests/:requestId/pay
router.post('/requests/:requestId/pay', protect, transactionController.approveRequest);

// Decline or cancel a money request
// PATCH /api/v1/transactions/requests/:requestId/status
router.patch('/requests/:requestId/status', protect, transactionController.updateRequestStatus);

// ──────────────────────────────────────────────────────────────
// CASH IN / OUT
// ──────────────────────────────────────────────────────────────

// Cash in: agent deposits money into a user's wallet (agents only)
// POST /api/v1/transactions/cash-in
router.post('/cash-in', protect, authorize('agent'), transactionController.cashIn);

// Cash out: user withdraws cash through an agent
// POST /api/v1/transactions/cash-out
router.post('/cash-out', protect, transactionController.cashOut);

// ──────────────────────────────────────────────────────────────
// HISTORY & DETAILS
// ──────────────────────────────────────────────────────────────

// Get paginated transaction history
// GET /api/v1/transactions/history?page=1&limit=10
router.get('/history', protect, transactionController.getHistory);

// Get details of a single transaction (must be a party to it)
// GET /api/v1/transactions/:id
// NOTE: keep this LAST so it doesn't shadow named paths above
router.get('/:id', protect, transactionController.getDetails);

export default router;
