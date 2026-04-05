import notificationService from '../services/notificationService.js';

class NotificationController {
  // Fetches a paginated list of all system and transaction alerts for the authenticated user
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

  // Retrieves the most recent unread or high-priority notifications for the user's quick-view
  async getRecent(req, res, next) {
    try {
      const userId = req.user.userId;
      const notifications = await notificationService.recentUserNotifications(userId);
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  // Permanently deletes a specific notification from the user's history
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

  // Clears all existing notifications for the user's account in a single operation
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
