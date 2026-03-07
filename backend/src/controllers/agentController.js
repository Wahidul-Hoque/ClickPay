import agentService from '../services/agentService.js';

class AgentController {
  async getDashboard(req, res, next) {
    try {
      const data = await agentService.getDashboard(req.user.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async cashIn(req, res, next) {
    try {
      const { userPhone, amount, epin } = req.body;
      if (!userPhone || !amount || !epin) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
      const result = await agentService.cashIn(req.user.userId, userPhone, parseFloat(amount), epin);
      res.json({ success: true, message: 'Cash-in successful', data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getHistory(req, res, next) {
    try {
      const data = await agentService.getHistory(req.user.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getRankings(req, res, next) {
    try {
      const rankings = await agentService.getAgentRankings();
      res.json({ success: true, data: rankings });
    } catch (error) {
      next(error);
    }
  }
}

export default new AgentController();