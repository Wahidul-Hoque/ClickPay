import subscriptionService from '../services/subscriptionService.js';

class SubscriptionController {
  // GET all available merchant plans and user's current subscriptions
  async getDashboard(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = await subscriptionService.getSubscriptionDashboard(userId);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/subscriptions/subscribe
  async subscribe(req, res, next) {
    try {
      const userId = req.user.userId;
      const { merchantUserId, epin } = req.body;

      if (!merchantUserId || !epin) {
        return res.status(400).json({ success: false, message: 'Merchant ID and ePin are required' });
      }

      const result = await subscriptionService.createSubscription(userId, merchantUserId, epin);
      return res.json({
        success: true,
        message: `Subscribed to ${result.merchant_name} successfully`,
        data: result
      });
    } catch (error) {
      const clientErrors = ['balance', 'ePin', 'active', 'Already'];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // PATCH /api/v1/subscriptions/:id/toggle-renew
  async toggleRenew(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const result = await subscriptionService.toggleAutoRenew(id, userId);
      return res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new SubscriptionController();