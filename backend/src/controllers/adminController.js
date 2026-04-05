import adminService from '../services/adminService.js';
import agentService from '../services/agentService.js';
import merchantService from '../services/merchantService.js';
import notificationService from '../services/notificationService.js';
import fraudDetectionService from '../services/fraudDetectionService.js';

class AdminController {
  // Compiles overall dashboard data including financial analytics, agent performance, and audit logs
  async getDashboardData(req, res, next) {
    try {
      const { city, startDate, endDate } = req.query;
      const analytics = await adminService.getFinancialAnalytics(city, startDate, endDate);
      const agents = await adminService.getAgentPerformance(city);
      const portfolio = await adminService.getPortfolioReports();
      const audit = await adminService.getAuditLogs({ limit: 10 });

      res.json({
        success: true,
        data: { analytics, agents, portfolio, audit }
      });
    } catch (error) { next(error); }
  }

  // Retrieves time-series volume data for various transaction types across specific regions
  async getTrendData(req, res, next) {
    try {
      const { city, startDate, endDate } = req.query;
      const trend = await adminService.getTrendAnalytics(city, startDate, endDate);
      res.json({ success: true, data: trend });
    } catch (error) { next(error); }
  }

  // Provides user partitioning data based on activity and wallet state for strategic review
  async getSegmentationData(req, res, next) {
    try {
      const { city, startDate, endDate } = req.query;
      const segmentation = await adminService.getSegmentationAnalytics(city, startDate, endDate);
      res.json({ success: true, data: segmentation });
    } catch (error) { next(error); }
  }

  // Searches for and returns a list of system users based on provided search criteria
  async getUsers(req, res, next) {
    try {
      const { search } = req.query;
      const users = await adminService.getAllUsers(search);
      res.json({ success: true, data: users });
    } catch (error) { next(error); }
  }

  // Fetches a detailed transaction history for a specific user ID with date and type filtering
  async getUserTransactions(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate, types } = req.query;
      const transactions = await adminService.getUserTransactions(id, startDate, endDate, types);
      res.json({ success: true, data: transactions });
    } catch (error) { next(error); }
  }

  // Administrative tool to toggle user account status between active and frozen states
  async updateUserStatus(req, res, next) {
    try {
      const { action } = req.body;
      const { id } = req.params;
      const adminId = req.user.userId;
      const result = await adminService.toggleUserStatus(adminId, id, action);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  // Lists all unique cities present in the user database for regional analytics
  async getCities(req, res, next) {
    try {
      const cities = await adminService.getAllCities();
      res.json({ success: true, data: cities });
    } catch (error) { next(error); }
  }

  // Generates performance rankings for agents based on volume and regional filters
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

  // Retrieves unique regions where agents are currently operating
  async getRegions(req, res, next) {
    try {
      const regions = await agentService.getRegions(req.query.q);
      res.json({ success: true, data: regions });
    } catch (error) {
      next(error);
    }
  }

  // Generates performance rankings for merchants across the platform
  async getMerchantRankings(req, res, next) {
    try {
      const filters = {
        regions: req.query.regions,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        transactionTypes: req.query.transactionTypes,
        rankBy: req.query.rankBy
      };

      const rankings = await merchantService.getMerchantRankings(filters);
      res.json({ success: true, data: rankings });
    } catch (error) {
      next(error);
    }
  }

  // Lists unique regions where merchant profiles have been established
  async getMerchantRegions(req, res, next) {
    try {
      const regions = await merchantService.getRegions(req.query.q);
      res.json({ success: true, data: regions });
    } catch (error) {
      next(error);
    }
  }

  // Distributes administrative notifications to targeted audiences or specific users
  async sendNotification(req, res, next) {
    try {
      console.log('[ADMIN NOTIFY] Request received');
      console.log('[ADMIN NOTIFY] Body:', JSON.stringify(req.body));
      console.log('[ADMIN NOTIFY] User:', req.user?.userId, req.user?.role);
      
      const adminId = req.user.userId;
      const { message, audience, phone } = req.body;
      const result = await notificationService.sendAdminNotification({
        adminId,
        message,
        audience,
        phone,
      });
      console.log('[ADMIN NOTIFY] Success:', JSON.stringify(result));
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('[ADMIN NOTIFY] Error:', error.message);
      next(error);
    }
  }

  // Fetches an audit of previously broadcasted administrative notifications
  async getSentNotifications(req, res, next) {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const notifications = await notificationService.getSentNotifications(limit);
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  // Lists active high-value savings plans currently managed by the platform
  async getActiveSavings(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const data = await adminService.getActiveSavingsPlans(limit);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Performs a reconciliation of the system profit wallet for the specified period
  async getAdminWalletReconciliation(req, res, next) {
    try {
      const period = req.query.period === 'month' ? 'month' : 'day';
      const data = await adminService.getAdminWalletReconciliation(period);
      res.json({ success: true, data, period });
    } catch (error) {
      next(error);
    }
  }

  // Retrieves system-generated flags for potentially fraudulent user activity
  async getFraudAlerts(req, res, next) {
    try {
      const { status } = req.query;
      const alerts = await fraudDetectionService.getFraudAlerts(status || null);
      res.json({ success: true, data: alerts });
    } catch (error) { next(error); }
  }

  // Updates a fraud alert status and takes mandatory action on the flagged account
  async resolveFraudAlert(req, res, next) {
    try {
      const { id } = req.params;
      const { action, note } = req.body;
      const adminId = req.user.userId;

      if (!action || !['freeze', 'dismiss'].includes(action)) {
        return res.status(400).json({ success: false, message: 'Action must be "freeze" or "dismiss"' });
      }

      const result = await fraudDetectionService.resolveAlert(parseInt(id), adminId, action, note);
      res.json({ success: true, message: `Alert ${action === 'freeze' ? 'resolved - account frozen' : 'dismissed'}`, ...result });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('already')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  // Compiles overall statistics on fraud alerts and resolution rates
  async getFraudStats(req, res, next) {
    try {
      const stats = await fraudDetectionService.getAlertStats();
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  }

  // Retrieves all configurable application and environment settings
  async getSettings(req, res, next) {
    try {
      const settings = await adminService.getSystemSettings();
      res.json({ success: true, data: settings });
    } catch (error) { next(error); }
  }

  // Updates a specific system setting and logs the administrative change
  async updateSetting(req, res, next) {
    try {
      const { key, value } = req.body;
      const adminId = req.user.userId;
      const result = await adminService.updateSystemSetting(key, value, adminId);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  // Provides a paginated history of administrative activity for auditing
  async getAuditLogs(req, res, next) {
    try {
      const { startDate, endDate, page, limit } = req.query;
      const filters = {
        startDate,
        endDate,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      };
      
      const logs = await adminService.getAuditLogs(filters);
      res.status(200).json({ success: true, data: logs });
    } catch (error) { next(error); }
  }
}

export default new AdminController();
