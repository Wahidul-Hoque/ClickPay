import savingsService from '../services/savingsService.js';

class SavingsController {
  async create(req, res, next) {
    try {
      const { amount, durationMonths, epin } = req.body;
      const result = await savingsService.createSavingsAccount(req.user.userId, parseFloat(amount), parseInt(durationMonths), epin);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAccounts(req, res, next) {
    try {
      const accounts = await savingsService.getMySavings(req.user.userId);
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  }

  async breakAccount(req, res, next) {
    try {
      const result = await savingsService.breakAccount(req.user.userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new SavingsController();