import walletService from '../services/walletService.js';

class WalletController {
  async getBalance(req, res, next) {
    try {
      const userId = req.user.userId;
      const balance = await walletService.getBalance(userId);
      
      return res.json({
        success: true,
        message: 'Balance retrieved',
        data: balance
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WalletController();