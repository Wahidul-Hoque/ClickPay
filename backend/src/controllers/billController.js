
import billService from '../services/billService.js';

class BillController {

  // Lists all available billing organizations and service providers
  async getBillers(req, res, next) {
    try {
      const billers = await billService.getBillers();

      return res.json({
        success: true,
        data: billers,
      });
    } catch (error) {
      next(error);
    }
  }

  // Filters and returns billers associated with a specific utility or service category
  async getBillersByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const billers = await billService.getBillersByCategory(category);

      return res.json({
        success: true,
        data: billers,
      });
    } catch (error) {
      next(error);
    }
  }

  // Validates payment parameters and processes a utility bill settlement
  async pay(req, res, next) {
    try {
      const userId = req.user.userId;
      const { billerId, amount, epin, reference } = req.body;

      // ── Validation ──────────────────────────────────
      if (!billerId || !amount || !epin || !reference) {
        return res.status(400).json({
          success: false,
          message: 'Biller ID, amount, ePin, and reference are required',
        });
      }

      const payAmount = parseFloat(amount);
      if (isNaN(payAmount) || payAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be a positive number',
        });
      }

      if (epin.length !== 5 || !/^\d+$/.test(epin)) {
        return res.status(400).json({
          success: false,
          message: 'ePin must be exactly 5 digits',
        });
      }

      // ── Delegate to service ─────────────────────────
      const result = await billService.payBill(userId, billerId, payAmount, epin, reference);

      return res.json({
        success: true,
        message: `Bill paid successfully to ${result.biller_name}`,
        data: result,
      });

    } catch (error) {
      const clientErrors = ['not found', 'Invalid', 'Insufficient', 'not active', 'inactive', 'exceeded'];
      if (clientErrors.some((msg) => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // Retrieves a paginated history of all bill payments completed by the user
  async getHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await billService.getHistory(userId, page, limit);

      return res.json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BillController();