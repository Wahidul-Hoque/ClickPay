import notificationService from '../services/notificationService.js';

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page, limit } = req.query;
      const result = await notificationService.listUserNotifications(userId, page, limit);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getRecent(req, res, next) {
    try {
      const userId = req.user.userId;
      const notifications = await notificationService.recentUserNotifications(userId);
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const result = await notificationService.deleteNotification(userId, id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async clearAll(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await notificationService.clearAll(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
