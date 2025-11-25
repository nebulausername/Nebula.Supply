import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { notificationService } from '../services/notificationService';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/admin/notifications - Get all notifications for admin
router.get('/notifications', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid parameters', details: errors.array() });
  }

  const limit = parseInt(req.query.limit as string) || 50;
  // In production, get admin ID from auth token
  const adminId = 'admin';

  try {
    const notifications = await notificationService.getNotifications(adminId, limit);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    logger.error('Failed to fetch notifications', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
}));

// GET /api/admin/notifications/new - Get new notifications since timestamp
router.get('/notifications/new', [
  query('since').isISO8601(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid parameters', details: errors.array() });
  }

  const since = req.query.since as string;
  const adminId = 'admin';

  try {
    const notifications = await notificationService.getNewNotifications(adminId, since);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    logger.error('Failed to fetch new notifications', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch new notifications'
    });
  }
}));

// PATCH /api/admin/notifications/:id/read - Mark notification as read
router.patch('/notifications/:id/read', [
  param('id').isString().notEmpty(),
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid parameters', details: errors.array() });
  }

  const { id } = req.params;

  try {
    await notificationService.markAsRead(id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Failed to mark notification as read', { error, notificationId: id });
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
}));

// POST /api/admin/notifications/mark-all-read - Mark all notifications as read
router.post('/notifications/mark-all-read', asyncHandler(async (req: Request, res: Response) => {
  const adminId = 'admin';

  try {
    await notificationService.markAllAsRead(adminId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
}));

export { router as adminNotificationRoutes };





