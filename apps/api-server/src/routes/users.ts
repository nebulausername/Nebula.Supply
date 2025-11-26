import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { databaseService } from '../services/database';

const router = Router();

interface NotificationPreferences {
  ticketMessages: boolean;
  ticketStatusChanges: boolean;
  ticketAssignments: boolean;
  onlyMyTickets: boolean;
  telegramEnabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  ticketMessages: true,
  ticketStatusChanges: true,
  ticketAssignments: false,
  onlyMyTickets: true,
  telegramEnabled: true
};

// GET /api/users/me/notification-preferences - Get user notification preferences
router.get('/me/notification-preferences', asyncHandler(async (req: Request, res: Response) => {
  // Get user ID from request (could be from auth middleware or telegram_id)
  const userId = (req as any).user?.id || (req as any).user?.telegram_id || req.query.userId || req.query.telegram_id;
  
  if (!userId) {
    throw createError('User ID erforderlich', 400, 'USER_ID_REQUIRED');
  }

  logger.debug('Fetching notification preferences', { userId });

  // Try to find user in database
  const users = await databaseService.findMany('users');
  const user = users.find((u: any) => 
    u.id === userId || 
    u.telegram_id === userId || 
    String(u.telegram_id) === String(userId) ||
    String(u.id) === String(userId)
  );

  if (!user) {
    // Return default preferences if user not found
    logger.debug('User not found, returning default preferences', { userId });
    return res.json({
      success: true,
      data: defaultPreferences
    });
  }

  // Get preferences from user object or return defaults
  const preferences = (user as any).notificationPreferences || defaultPreferences;

  res.json({
    success: true,
    data: preferences
  });
}));

// PUT /api/users/me/notification-preferences - Update user notification preferences
router.put('/me/notification-preferences', [
  body('ticketMessages').optional().isBoolean(),
  body('ticketStatusChanges').optional().isBoolean(),
  body('ticketAssignments').optional().isBoolean(),
  body('onlyMyTickets').optional().isBoolean(),
  body('telegramEnabled').optional().isBoolean()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Ungültige Präferenzen', 400, 'VALIDATION_ERROR', { details: errors.array() });
  }

  // Get user ID from request
  const userId = (req as any).user?.id || (req as any).user?.telegram_id || req.body.userId || req.body.telegram_id;
  
  if (!userId) {
    throw createError('User ID erforderlich', 400, 'USER_ID_REQUIRED');
  }

  logger.info('Updating notification preferences', { userId, preferences: req.body });

  // Find user in database
  const users = await databaseService.findMany('users');
  const user = users.find((u: any) => 
    u.id === userId || 
    u.telegram_id === userId || 
    String(u.telegram_id) === String(userId) ||
    String(u.id) === String(userId)
  );

  if (!user) {
    // Create new user entry if not found (for telegram users)
    logger.info('User not found, creating new entry', { userId });
    const newUser = {
      id: userId,
      telegram_id: userId,
      notificationPreferences: {
        ...defaultPreferences,
        ...req.body
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await databaseService.create('users', newUser);
    
    return res.json({
      success: true,
      data: newUser.notificationPreferences,
      message: 'Präferenzen gespeichert'
    });
  }

  // Update user preferences
  const currentPreferences = (user as any).notificationPreferences || defaultPreferences;
  const updatedPreferences: NotificationPreferences = {
    ...currentPreferences,
    ...req.body
  };

  // Update user in database
  await databaseService.update('users', user.id, {
    notificationPreferences: updatedPreferences,
    updatedAt: new Date().toISOString()
  });

  logger.info('Notification preferences updated', { userId, preferences: updatedPreferences });

  res.json({
    success: true,
    data: updatedPreferences,
    message: 'Präferenzen aktualisiert'
  });
}));

export { router as userRoutes };

