// ==============================================
// TRANSACTION CONTROLLER (The Waiter)
// ==============================================
// This file handles HTTP requests/responses for transactions
// It calls the transactionService (Kitchen) to do the actual work

import transactionService from '../services/transactionService.js';

class TransactionController {
  // ==============================================
  // SEND MONEY
  // ==============================================
  // POST /api/v1/transactions/send
  // Headers: Authorization: Bearer <token>
  // Body: { toPhone, amount, epin }
  async send(req, res, next) {
    try {
      // STEP 1: Validate input
      const { toPhone, amount, epin } = req.body;
      const fromUserId = req.user.userId; // From JWT token

      if (!toPhone || !amount || !epin) {
        return res.status(400).json({
          success: false,
          message: 'Phone number, amount, and ePin are required'
        });
      }

      // Validate amount
      const transferAmount = parseFloat(amount);
      if (transferAmount <= 0 || isNaN(transferAmount)) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      // Validate ePin format
      if (epin.length !== 5 || !/^\d+$/.test(epin)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ePin format'
        });
      }

      // STEP 2: Call service to send money
      const result = await transactionService.sendMoney(
        fromUserId,
        toPhone,
        transferAmount,
        epin
      );

      // STEP 3: Send success response
      return res.json({
        success: true,
        message: 'Money sent successfully',
        data: result
      });

    } catch (error) {
      // Handle specific errors
      if (error.message.includes('Invalid') || 
          error.message.includes('Insufficient') ||
          error.message.includes('not found') ||
          error.message.includes('not active') ||
          error.message.includes('Cannot send')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // ==============================================
  // GET TRANSACTION HISTORY
  // ==============================================
  // GET /api/v1/transactions/history?page=1&limit=10
  // Headers: Authorization: Bearer <token>
  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId; // From JWT token
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      // Call service to get history
      const result = await transactionService.getHistory(userId, page, limit);

      // Send success response
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

  // ==============================================
  // PLACEHOLDER METHODS - TO BE IMPLEMENTED
  // ==============================================

  // Request money from another user
  async request(req, res) {
    // TODO: Implement request money
    // Steps:
    // 1. Validate input (fromPhone, amount, message)
    // 2. Call transactionService.requestMoney()
    // 3. Return response
    return res.json({
      success: true,
      message: 'Request money - To be implemented'
    });
  }

  // Cash in (agents only)
  async cashIn(req, res) {
    // TODO: Implement cash-in
    // Steps:
    // 1. Validate input (userPhone, amount, agentEpin)
    // 2. Call transactionService.cashIn()
    // 3. Return response
    return res.json({
      success: true,
      message: 'Cash in - To be implemented'
    });
  }

  // Cash out
  async cashOut(req, res) {
    // TODO: Implement cash-out
    // Steps:
    // 1. Validate input (agentPhone, amount, userEpin)
    // 2. Call transactionService.cashOut()
    // 3. Return response
    return res.json({
      success: true,
      message: 'Cash out - To be implemented'
    });
  }
}

// Export a single instance
export default new TransactionController();
