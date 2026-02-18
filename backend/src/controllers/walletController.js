// ==============================================
// WALLET CONTROLLER (The Waiter)
// ==============================================
// This file handles HTTP requests/responses for wallet management

class WalletController {
  // ==============================================
  // GET WALLET BALANCE
  // ==============================================
  // GET /api/v1/wallet/balance
  async getBalance(req, res, next) {
    try {
      // TODO: Implement wallet balance
      // const userId = req.user.userId;
      // const balance = await walletService.getBalance(userId);
      
      return res.json({
        success: true,
        message: 'Get balance - To be implemented',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  // ==============================================
  // EXTERNAL TOP-UP
  // ==============================================
  // POST /api/v1/wallet/topup
  async topup(req, res, next) {
    try {
      // TODO: Implement external top-up
      
      return res.json({
        success: true,
        message: 'Top-up - To be implemented',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  // ==============================================
  // GET PAYMENT METHODS
  // ==============================================
  // GET /api/v1/wallet/payment-methods
  async getPaymentMethods(req, res, next) {
    try {
      // TODO: Implement get payment methods
      
      return res.json({
        success: true,
        message: 'Get payment methods - To be implemented',
        data: []
      });
    } catch (error) {
      next(error);
    }
  }

  // ==============================================
  // ADD PAYMENT METHOD
  // ==============================================
  // POST /api/v1/wallet/payment-methods
  async addPaymentMethod(req, res, next) {
    try {
      // TODO: Implement add payment method
      
      return res.json({
        success: true,
        message: 'Add payment method - To be implemented',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export a single instance
export default new WalletController();