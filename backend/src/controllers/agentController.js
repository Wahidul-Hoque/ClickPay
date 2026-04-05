import agentService from '../services/agentService.js';

class AgentController {
  // Pulls core metrics including earned commissions, wallet balance, and peer ranking for agents
  async getDashboard(req, res, next) {
    try {
      const dashboardData = await agentService.getDashboard(req.user.userId);
      const rankingData = await agentService.getAgentRank(req.user.userId);
      
      res.json({ 
        success: true, 
        data: {
          ...dashboardData,
          rank: rankingData ? rankingData.rank : 'N/A'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Processes a user's cash deposit request via an agent after verifying ePins
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

  // Retrieves a detailed historical log of all cash-in and withdraw operations for an agent
  async getHistory(req, res, next) {
    try {
      const data = await agentService.getHistory(req.user.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Provides performance rankings for agents based on volume, region, and custom filters
  async getRankings(req, res, next) {
    try {
      const filters = {
        regions: req.query.regions,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        transactionTypes: req.query.transactionTypes,
        rankBy: req.query.rankBy
      };

      if (req.user.role === 'agent') {
        const myRank = await agentService.getAgentRank(req.user.userId, filters);
        return res.json({ success: true, data: myRank ? [myRank] : [] });
      }

      const rankings = await agentService.getAgentRankings(filters);
      res.json({ success: true, data: rankings });
    } catch (error) {
      next(error);
    }
  }

  // Lists unique cities where agents are currently providing financial services
  async getRegions(req, res, next) {
    try {
      const regions = await agentService.getRegions(req.query.q);
      res.json({ success: true, data: regions });
    } catch (error) {
      next(error);
    }
  }
}

export default new AgentController();