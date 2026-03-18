import adminService from '../services/adminService.js';
import agentService from '../services/agentService.js';

class AdminController {
  async getDashboardData(req, res, next) {
    try {
      const { city, startDate, endDate } = req.query;
      const analytics = await adminService.getFinancialAnalytics(city, startDate, endDate);
      const agents = await adminService.getAgentPerformance(city);
      const portfolio = await adminService.getPortfolioReports();
      const audit = await adminService.getAuditLogs();

      res.json({
        success: true,
        data: { analytics, agents, portfolio, audit }
      });
    } catch (error) { next(error); }
  }

  async getTrendData(req, res, next) {
    try {
      const { city, startDate, endDate } = req.query;
      const trend = await adminService.getTrendAnalytics(city, startDate, endDate);
      res.json({ success: true, data: trend });
    } catch (error) { next(error); }
  }

  async getSegmentationData(req, res, next) {
    try {
      const { city, startDate, endDate } = req.query;
      const segmentation = await adminService.getSegmentationAnalytics(city, startDate, endDate);
      res.json({ success: true, data: segmentation });
    } catch (error) { next(error); }
  }

  async getUsers(req, res, next) {
    try {
      const { search } = req.query;
      const users = await adminService.getAllUsers(search);
      res.json({ success: true, data: users });
    } catch (error) { next(error); }
  }

  async getUserTransactions(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate, types } = req.query;
      const transactions = await adminService.getUserTransactions(id, startDate, endDate, types);
      res.json({ success: true, data: transactions });
    } catch (error) { next(error); }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { action } = req.body;
      const { id } = req.params;
      const adminId = req.user.userId;
      const result = await adminService.toggleUserStatus(adminId, id, action);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async getCities(req, res, next) {
    try {
      const cities = await adminService.getAllCities();
      res.json({ success: true, data: cities });
    } catch (error) { next(error); }
  }

  async getRankings(req, res, next) {
    try {
      const filters = {
        regions: req.query.regions,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        transactionTypes: req.query.transactionTypes,
        rankBy: req.query.rankBy
      };

      const rankings = await agentService.getAgentRankings(filters);
      res.json({ success: true, data: rankings });
    } catch (error) {
      next(error);
    }
  }

  async getRegions(req, res, next) {
    try {
      const regions = await agentService.getRegions(req.query.q);
      res.json({ success: true, data: regions });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();