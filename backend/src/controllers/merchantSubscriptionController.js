import merchantSubscriptionService from '../services/merchantSubscriptionService.js';

class MerchantSubscriptionController {
  
  async getStatus(req, res, next) {
    try {
      const { userId } = req.user;
      const status = await merchantSubscriptionService.getStatus(userId);
      
      return res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }

  async subscribe(req, res, next) {
    try {
      const { userId } = req.user;
      const { planType, epin } = req.body;

      if (!planType || !epin) {
        return res.status(400).json({ success: false, message: 'Plan type and ePin are required' });
      }

      const result = await merchantSubscriptionService.subscribe(userId, planType, epin);
      
      return res.json({
        success: true,
        message: 'Subscription successful. Activation complete.',
        data: result
      });
    } catch (error) {
      console.error('Subscription error:', error);
      const clientErrors = ['not found', 'Invalid', 'Insufficient', 'Unauthorized'];
      if (clientErrors.some(msg => error.message.includes(msg))) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

export default new MerchantSubscriptionController();
