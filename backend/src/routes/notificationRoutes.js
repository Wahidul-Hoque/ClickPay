import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET /api/v1/notifications         — paginated list
router.get('/', notificationController.getNotifications);

// GET /api/v1/notifications/recent  — last 10
router.get('/recent', notificationController.getRecent);

// DELETE /api/v1/notifications/:id  — delete one
router.delete('/:id', notificationController.deleteNotification);

// DELETE /api/v1/notifications      — clear all
router.delete('/', notificationController.clearAll);

export default router;
