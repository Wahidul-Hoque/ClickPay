

import express from 'express';
import transactionController from '../controllers/transactionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Initiates a secure money transfer between users
router.post('/send', protect, transactionController.send);


// Creates a new request to receive money from another user
router.post('/request', protect, transactionController.request);

// Lists all inbound requests where the current user is being asked for funds
router.get('/requests/incoming', protect, transactionController.getIncomingRequests);

// Fetches all outbound requests created by the user for others to pay
router.get('/requests/sent', protect, transactionController.getSentRequests);

// Validates and processes the payment for a specific money request
router.post('/requests/:requestId/pay', protect, transactionController.approveRequest);

// Updates the status of a request to declined or cancelled
router.patch('/requests/:requestId/status', protect, transactionController.updateRequestStatus);


// Endpoint for agents to credit cash into a user's wallet
router.post('/cash-in', protect, authorize('agent'), transactionController.cashIn);

// Endpoint for users to withdraw cash through an authorized agent
router.post('/cash-out', protect, transactionController.cashOut);


// Provides paginated history of all user transactions
router.get('/history', protect, transactionController.getHistory);

// Retrieves remaining transaction limits for the current user session
router.get('/limits', protect, transactionController.getLimits);

// Fetches detailed state and events for a specific transaction ID
router.get('/:id', protect, transactionController.getDetails);

// Admin-only tool to reverse a specific transaction and rebalance wallets
router.post('/:id/reverse', protect, authorize('admin'), transactionController.reverse);

export default router;
