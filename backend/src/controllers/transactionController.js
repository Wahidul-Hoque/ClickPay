// This file handles HTTP requests/responses for all transaction operations.
// Validates input, delegates to transactionService, returns standardised responses.

import transactionService from '../services/transactionService.js';

class TransactionController {

  // ──────────────────────────────────────────
  // MONEY TRANSFER (User to User)
  // POST /api/v1/transactions/send
  // ──────────────────────────────────────────
  async send(req, res, next) {
    try {
      const { toPhone, amount, epin } = req.body;
      const fromUserId = req.user.userId;

      if (!toPhone || !amount || !epin) {
        return res.status(400).json({ success: false, message: 'Phone, amount, and ePin are required' });
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
      const clientErrors = ['not found', 'Invalid', 'Insufficient', 'not active', 'yourself'];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async merchantSend(req, res, next) {
    try {
      const { toPhone, amount, epin } = req.body;
      const merchantUserId = req.user.userId;

      console.log('--- Merchant Send Attempt ---');
      console.log('From Merchant:', merchantUserId);
      console.log('To:', toPhone, '| Amount:', amount);

      if (!toPhone || !amount || !epin) {
        return res.status(400).json({ success: false, message: 'Phone, amount, and ePin are required' });
      }

      const result = await transactionService.merchantSendMoney(merchantUserId, toPhone, parseFloat(amount), epin);
      console.log('Transfer Result:', result);
      return res.json({ success: true, message: 'Money sent successfully', data: result });

    } catch (error) {
      console.error('Merchant Send Controller Error:', error.message);
      const bizErrors = ['not found', 'Invalid', 'Insufficient', 'active', 'yourself'];
      if (bizErrors.some(m => error.message.includes(m))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // CREATE MONEY REQUEST (Asking someone for money)
  // POST /api/v1/transactions/request
  // ──────────────────────────────────────────
  async request(req, res, next) {
    try {
      const requesterUserId = req.user.userId;
      const { recipientPhone, amount, message } = req.body;

      if (!recipientPhone || !amount) {
        return res.status(400).json({ success: false, message: 'Recipient phone and amount are required' });
      }

      const requestAmount = parseFloat(amount);
      if (isNaN(requestAmount) || requestAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
      }

      const result = await transactionService.requestMoney(requesterUserId, recipientPhone, requestAmount, message);
      return res.status(201).json({ success: true, message: 'Money request sent successfully', data: result });

    } catch (error) {
      const clientErrors = ['not found', 'yourself'];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // APPROVE / PAY A REQUEST (The Payer pays the requester)
  // POST /api/v1/transactions/requests/:requestId/pay
  // ──────────────────────────────────────────
  async approveRequest(req, res, next) {
    try {
      const payerUserId = req.user.userId;
      const requestId = parseInt(req.params.requestId);
      const { epin } = req.body;

      if (!requestId || isNaN(requestId)) {
        return res.status(400).json({ success: false, message: 'Invalid request ID' });
      }
      if (!epin || epin.length !== 5) {
        return res.status(400).json({ success: false, message: 'Valid 5-digit ePin is required' });
      }

      const result = await transactionService.approveRequest(requestId, payerUserId, epin);
      return res.json({ success: true, message: 'Money request paid successfully', data: result });

    } catch (error) {
      const clientErrors = ['not found', 'authorised', 'already', 'expired', 'Invalid', 'Insufficient'];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // UPDATE REQUEST STATUS (Decline or Cancel)
  // PATCH /api/v1/transactions/requests/:requestId/status
  // ──────────────────────────────────────────
  async updateRequestStatus(req, res, next) {
    try {
      const userId = req.user.userId;
      const requestId = parseInt(req.params.requestId);
      const { status } = req.body;

      const allowedStatuses = ['declined', 'cancelled'];
      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be declined or cancelled' });
      }

      const result = await transactionService.updateRequestStatus(requestId, userId, status);
      return res.json({ success: true, message: `Request ${status} successfully`, data: result });

    } catch (error) {
      const clientErrors = ['not found', 'Only', 'already'];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // CASH IN (Agent deposits into User account)
  // POST /api/v1/transactions/cash-in
  // ──────────────────────────────────────────
  async cashIn(req, res, next) {
    try {
      const agentUserId = req.user.userId;
      const { userPhone, amount, epin } = req.body;

      if (!userPhone || !amount || !epin) {
        return res.status(400).json({ success: false, message: 'User phone, amount, and ePin are required' });
      }

      const result = await transactionService.cashIn(agentUserId, userPhone, parseFloat(amount), epin);
      return res.json({ success: true, message: 'Cash in successful', data: result });

    } catch (error) {
      const clientErrors = ['not found', 'Invalid', 'Insufficient', 'agent', 'yourself'];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // CASH OUT (User withdraws via Agent)
  // POST /api/v1/transactions/cash-out
  // ──────────────────────────────────────────
  async cashOut(req, res, next) {
    try {
      const userId = req.user.userId;
      const { agentPhone, amount, epin } = req.body;

      if (!agentPhone || !amount || !epin) {
        return res.status(400).json({ success: false, message: 'Agent phone, amount, and ePin are required' });
      }

      const cashoutAmount = parseFloat(amount);
      if (isNaN(cashoutAmount) || cashoutAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }

      const result = await transactionService.cashOut(userId, agentPhone, cashoutAmount, epin);
      
      return res.json({ 
        success: true, 
        message: 'Cash out successful', 
        data: result 
      });
    } catch (error) {
      const clientErrors = ['not found', 'Invalid', 'Insufficient', 'inactive', 'yourself'];
      if (clientErrors.some(msg => error.message.toLowerCase().includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // ──────────────────────────────────────────
  // HISTORY & FETCHING (Select Only)
  // ──────────────────────────────────────────

  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        type: req.query.type
      };
      const result = await transactionService.getHistory(userId, page, limit, filters);
      return res.json({ success: true, data: result.transactions, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req, res, next) {
    try {
      const userId = req.user.userId;
      const transactionId = parseInt(req.params.id);
      const result = await transactionService.getTransactionDetails(transactionId, userId);
      return res.json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('denied')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  async getIncomingRequests(req, res, next) {
    try {
      const result = await transactionService.getIncomingRequests(req.user.userId);
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getSentRequests(req, res, next) {
    try {
      const result = await transactionService.getSentRequests(req.user.userId);
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();