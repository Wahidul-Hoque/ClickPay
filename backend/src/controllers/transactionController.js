// ==============================================
// TRANSACTION CONTROLLER (The Waiter)
// ==============================================
// This file handles HTTP requests/responses for all transaction operations.
// Validates input, delegates to transactionService, returns standardised responses.

import transactionService from '../services/transactionService.js';

class TransactionController {

  // ──────────────────────────────────────────
  // POST /api/v1/transactions/send
  // Body: { toPhone, amount, epin }
  // ──────────────────────────────────────────
  async send(req, res, next) {
    try {
      const { toPhone, amount, epin } = req.body;
      const fromUserId = req.user.userId;

      if (!toPhone || !amount || !epin) {
        return res.status(400).json({
          success: false,
          message: 'Phone number, amount, and ePin are required'
        });
      }

      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }

      if (epin.length !== 5 || !/^\d+$/.test(epin)) {
        return res.status(400).json({ success: false, message: 'ePin must be exactly 5 digits' });
      }

      const result = await transactionService.sendMoney(fromUserId, toPhone, transferAmount, epin);

      return res.json({ success: true, message: 'Money sent successfully', data: result });

    } catch (error) {
      const clientErrors = [
        'Invalid', 'Insufficient', 'not found', 'not active',
        'Cannot send', 'expired', 'already'
      ];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // GET /api/v1/transactions/history?page=1&limit=10
  // ──────────────────────────────────────────
  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ success: false, message: 'Invalid pagination parameters' });
      }

      const result = await transactionService.getHistory(userId, page, limit);

      return res.json({
        success: true,
        message: 'Transaction history retrieved',
        data: result.transactions,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // GET /api/v1/transactions/:id
  // ──────────────────────────────────────────
  async getDetails(req, res, next) {
    try {
      const userId = req.user.userId;
      const transactionId = parseInt(req.params.id);

      if (!transactionId || isNaN(transactionId)) {
        return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
      }

      const result = await transactionService.getTransactionDetails(transactionId, userId);

      return res.json({ success: true, message: 'Transaction details retrieved', data: result });

    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // POST /api/v1/transactions/request
  // Body: { recipientPhone, amount, message? }
  // ──────────────────────────────────────────
  async request(req, res, next) {
    try {
      const { recipientPhone, amount, message } = req.body;
      const fromUserId = req.user.userId;

      if (!recipientPhone || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Recipient phone number and amount are required'
        });
      }

      const requestAmount = parseFloat(amount);
      if (isNaN(requestAmount) || requestAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }

      const result = await transactionService.requestMoney(
        fromUserId, recipientPhone, requestAmount, message
      );

      return res.status(201).json({
        success: true,
        message: 'Money request sent successfully',
        data: result
      });

    } catch (error) {
      const clientErrors = ['not found', 'yourself', 'access denied'];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // GET /api/v1/transactions/requests/incoming
  // ──────────────────────────────────────────
  async getIncomingRequests(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await transactionService.getIncomingRequests(userId);

      return res.json({
        success: true,
        message: 'Incoming money requests retrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // GET /api/v1/transactions/requests/sent
  // ──────────────────────────────────────────
  async getSentRequests(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await transactionService.getSentRequests(userId);

      return res.json({
        success: true,
        message: 'Sent money requests retrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // POST /api/v1/transactions/requests/:requestId/pay
  // Body: { epin }
  // ──────────────────────────────────────────
  async approveRequest(req, res, next) {
    try {
      const payerUserId = req.user.userId;
      const requestId = parseInt(req.params.requestId);
      const { epin } = req.body;

      if (!requestId || isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'Invalid request ID' });
      }
      if (!epin) {
        return res.status(400).json({ success: false, message: 'ePin is required to approve a payment' });
      }
      if (epin.length !== 5 || !/^\d+$/.test(epin)) {
        return res.status(400).json({ success: false, message: 'ePin must be exactly 5 digits' });
      }

      const result = await transactionService.approveRequest(requestId, payerUserId, epin);

      return res.json({ success: true, message: 'Money request paid successfully', data: result });

    } catch (error) {
      const clientErrors = [
        'not found', 'authorised', 'already', 'expired', 'Invalid', 'Insufficient', 'not active'
      ];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // PATCH /api/v1/transactions/requests/:requestId/status
  // Body: { status: 'declined' | 'cancelled' }
  // ──────────────────────────────────────────
  async updateRequestStatus(req, res, next) {
    try {
      const userId = req.user.userId;
      const requestId = parseInt(req.params.requestId);
      const { status } = req.body;

      if (!requestId || isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'Invalid request ID' });
      }

      const allowedStatuses = ['declined', 'cancelled'];
      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${allowedStatuses.join(', ')}`
        });
      }

      const result = await transactionService.updateRequestStatus(requestId, userId, status);

      return res.json({
        success: true,
        message: `Money request ${status} successfully`,
        data: result
      });

    } catch (error) {
      const clientErrors = ['not found', 'Only', 'already', 'access denied'];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // POST /api/v1/transactions/cash-in  (agents only)
  // Body: { userPhone, amount, epin }
  // ──────────────────────────────────────────
  async cashIn(req, res, next) {
    try {
      const agentUserId = req.user.userId;
      const { userPhone, amount, epin } = req.body;

      if (!userPhone || !amount || !epin) {
        return res.status(400).json({
          success: false,
          message: 'User phone, amount, and ePin are required'
        });
      }

      const cashInAmount = parseFloat(amount);
      if (isNaN(cashInAmount) || cashInAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }

      if (epin.length !== 5 || !/^\d+$/.test(epin)) {
        return res.status(400).json({ success: false, message: 'ePin must be exactly 5 digits' });
      }

      const result = await transactionService.cashIn(agentUserId, userPhone, cashInAmount, epin);

      return res.json({ success: true, message: 'Cash in successful', data: result });

    } catch (error) {
      const clientErrors = [
        'not found', 'Invalid', 'Insufficient', 'not active', 'yourself'
      ];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // POST /api/v1/transactions/cash-out
  // Body: { agentPhone, amount, epin }
  // ──────────────────────────────────────────
  async cashOut(req, res, next) {
    try {
      const userId = req.user.userId;
      const { agentPhone, amount, epin } = req.body;

      if (!agentPhone || !amount || !epin) {
        return res.status(400).json({
          success: false,
          message: 'Agent phone, amount, and ePin are required'
        });
      }

      const cashOutAmount = parseFloat(amount);
      if (isNaN(cashOutAmount) || cashOutAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }

      if (epin.length !== 5 || !/^\d+$/.test(epin)) {
        return res.status(400).json({ success: false, message: 'ePin must be exactly 5 digits' });
      }

      const result = await transactionService.cashOut(userId, agentPhone, cashOutAmount, epin);

      return res.json({ success: true, message: 'Cash out successful', data: result });

    } catch (error) {
      const clientErrors = [
        'not found', 'Invalid', 'Insufficient', 'not active', 'yourself'
      ];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

// Export a single instance
export default new TransactionController();
