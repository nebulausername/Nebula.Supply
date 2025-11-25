import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { databaseService } from '../services/database';
import { cacheService } from '../services/cache';
import { botEventManager } from '../services/botEventManager';
import { telegramNotificationService } from '../services/telegramNotification';
import {
  getPersonalInviteCode,
  updatePersonalInviteCode,
  ensurePersonalInviteCode,
  validatePersonalInviteCodeAvailability
} from '../services/personalInviteCodeService';

const router = Router();

// Types für Bot-zu-API Kommunikation
interface BotUserData {
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  verified_at?: string;
}

interface CreateVerificationRequest {
  user_id: string;
  hand_sign: string;
  hand_sign_emoji: string;
  hand_sign_instructions: string;
  photo_url?: string;
  max_hand_sign_changes?: number;
  expires_at: string;
}

interface UpdateVerificationStatusRequest {
  status: 'pending_review' | 'approved' | 'rejected';
  admin_notes?: string;
}

interface CreateInviteCodeRequest {
  code: string;
  created_by: string;
  max_uses?: number;
  expires_at?: string;
  is_active?: boolean;
  metadata?: any;
}

interface AnalyticsEventData {
  user_id?: string;
  event_type: string;
  event_data: any;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface AdminActionData {
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  metadata?: any;
}

// ===== USER MANAGEMENT ENDPOINTS =====

// POST /api/bot/users/sync - Sync user data from bot
router.post('/users/sync', [
  body('telegram_id').isNumeric().notEmpty(),
  body('username').optional().isString(),
  body('first_name').optional().isString(),
  body('last_name').optional().isString(),
  body('verified_at').optional().isISO8601()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid user data', details: errors.array() });
  }

  const userData: BotUserData = req.body;

  try {
    // Prüfe, ob User bereits existiert
    const existingUser = await databaseService.getBotUserByTelegramId(userData.telegram_id);

    if (existingUser) {
      // Update existing user
      const updates: any = {};
      if (userData.username !== undefined) updates.username = userData.username;
      if (userData.first_name !== undefined) updates.first_name = userData.first_name;
      if (userData.last_name !== undefined) updates.last_name = userData.last_name;
      if (userData.verified_at !== undefined) updates.verified_at = userData.verified_at;

      if (Object.keys(updates).length > 0) {
        await databaseService.updateBotUser(userData.telegram_id, updates);
      }

      res.json({
        success: true,
        data: existingUser,
        message: 'User updated'
      });
    } else {
      // Create new user
      const newUser = await databaseService.createBotUser(userData);

      // Handle event
      await botEventManager.handleUserSynced(newUser);

      res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created'
      });
    }
  } catch (error) {
    logger.error('Failed to sync user data', { error, telegramId: userData.telegram_id });
    res.status(500).json({ error: 'Failed to sync user data' });
  }
}));

// GET /api/bot/users/telegram/:telegramId - Get user by Telegram ID
router.get('/users/telegram/:telegramId', [
  param('telegramId').isNumeric()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid telegram ID', details: errors.array() });
  }

  const { telegramId } = req.params;
  const user = await databaseService.getBotUserByTelegramId(parseInt(telegramId));

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    success: true,
    data: user
  });
}));

// GET /api/bot/users/personal-invite-code/:telegramId - Get user's personal invite code
router.get('/users/personal-invite-code/:telegramId', [
  param('telegramId').isNumeric()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid telegram ID', details: errors.array() });
  }

  const telegramId = parseInt(req.params.telegramId);
  const code = await getPersonalInviteCode(telegramId);

  res.json({
    success: true,
    data: {
      telegramId,
      personalInviteCode: code
    }
  });
}));

// POST /api/bot/users/personal-invite-code/update - Update personal invite code (VIP/Stammkunde only)
router.post('/users/personal-invite-code/update', [
  body('telegramId').isNumeric().notEmpty(),
  body('code').isString().notEmpty().isLength({ min: 6, max: 20 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid request data', details: errors.array() });
  }

  const { telegramId, code } = req.body;

  const result = await updatePersonalInviteCode(telegramId, code);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    });
  }

  // Broadcast WebSocket event
  await botEventManager.handlePersonalInviteCodeUpdated(telegramId, code);

  res.json({
    success: true,
    message: 'Personal invite code updated successfully',
    data: {
      telegramId,
      personalInviteCode: code.toUpperCase()
    }
  });
}));

// POST /api/bot/users/personal-invite-code/validate - Validate code availability
router.post('/users/personal-invite-code/validate', [
  body('code').isString().notEmpty()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid request data', details: errors.array() });
  }

  const { code } = req.body;
  const isAvailable = await validatePersonalInviteCodeAvailability(code);

  res.json({
    success: true,
    data: {
      code,
      available: isAvailable
    }
  });
}));

// ===== VERIFICATION MANAGEMENT ENDPOINTS =====

// POST /api/bot/verifications - Create verification session
router.post('/verifications', [
  body('user_id').isString().notEmpty(),
  body('hand_sign').isString().notEmpty(),
  body('hand_sign_emoji').isString().notEmpty(),
  body('hand_sign_instructions').isString().notEmpty(),
  body('photo_url').optional().isString(),
  body('max_hand_sign_changes').optional().isNumeric(),
  body('expires_at').isISO8601().notEmpty()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid verification data', details: errors.array() });
  }

  const sessionData: CreateVerificationRequest = req.body;
  const verification = await databaseService.createVerificationSession({
    ...sessionData,
    status: 'pending_review',
    max_hand_sign_changes: sessionData.max_hand_sign_changes || 3
  });

  // Handle event
  await botEventManager.handleVerificationCreated(verification);

  // Invalidate cache
  await cacheService.invalidatePattern('bot:verifications:*');

  res.status(201).json({
    success: true,
    data: verification,
    message: 'Verification session created'
  });
}));

// GET /api/bot/verifications/pending - Get pending verifications
router.get('/verifications/pending', asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = 'bot:verifications:pending';

  const verifications = await cacheService.getOrSet(cacheKey, async () => {
    return await databaseService.getPendingVerificationSessions();
  }, 30); // 30 Sekunden Cache

  res.json({
    success: true,
    data: verifications
  });
}));

// PATCH /api/bot/verifications/:id/status - Update verification status
router.patch('/verifications/:id/status', [
  param('id').isString().notEmpty(),
  body('status').isIn(['pending_review', 'approved', 'rejected']),
  body('admin_notes').optional().isString()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid status data', details: errors.array() });
  }

  const { id } = req.params;
  const { status, admin_notes }: UpdateVerificationStatusRequest = req.body;

  const success = await databaseService.updateVerificationStatus(id, status, admin_notes);

  if (!success) {
    return res.status(404).json({ error: 'Verification session not found' });
  }

  // Handle event
  await botEventManager.handleVerificationStatusUpdated(id, status, admin_notes);

  // Invalidate cache
  await cacheService.invalidatePattern('bot:verifications:*');

  res.json({
    success: true,
    message: 'Verification status updated'
  });
}));

// ===== INVITE CODE MANAGEMENT ENDPOINTS =====

// POST /api/bot/invite-codes - Create invite code
router.post('/invite-codes', [
  body('code').optional().isString().isLength({ min: 6 }),
  body('created_by').isString().notEmpty(),
  body('max_uses').optional().isNumeric(),
  body('expires_at').optional().isISO8601(),
  body('is_active').optional().isBoolean(),
  body('metadata').optional().isObject()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid invite code data', details: errors.array() });
  }

  const inviteData: CreateInviteCodeRequest = req.body;
  
  // Generate code if not provided
  let finalCode = inviteData.code;
  if (!finalCode) {
    // Generate random code: NEB-XXXXXX format
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    finalCode = `NEB-${randomPart}`;
    
    // Ensure uniqueness (simple check, in production might need retry logic)
    const existing = await databaseService.getInviteCodeByCode(finalCode);
    if (existing) {
      // Retry with timestamp
      const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
      finalCode = `NEB-${timestamp}${randomPart.slice(0, 2)}`;
    }
  }
  
  const inviteCode = await databaseService.createInviteCode({
    ...inviteData,
    code: finalCode,
    is_active: inviteData.is_active !== false // Default to true
  });

  // Handle event
  await botEventManager.handleInviteCodeCreated(inviteCode);

  // Invalidate cache
  await cacheService.invalidatePattern('bot:invite-codes:*');

  res.status(201).json({
    success: true,
    data: inviteCode,
    message: 'Invite code created'
  });
}));

// GET /api/bot/invite-codes/code/:code - Get invite code by code
router.get('/invite-codes/code/:code', [
  param('code').isString().notEmpty()
], asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const inviteCode = await databaseService.getInviteCodeByCode(code);

  if (!inviteCode) {
    return res.status(404).json({ error: 'Invite code not found' });
  }

  res.json({
    success: true,
    data: inviteCode
  });
}));

// POST /api/bot/invite-codes/:code/use - Use invite code
router.post('/invite-codes/:code/use', [
  param('code').isString().notEmpty(),
  body('user_id').optional().isString(),
  body('used_by').optional().isString()
], asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const userId = req.body.user_id || req.body.used_by || 'unknown';
  
  // Get invite code first to check validity
  const inviteCode = await databaseService.getInviteCodeByCode(code);
  
  if (!inviteCode) {
    return res.status(404).json({ 
      success: false,
      error: 'Invite code not found' 
    });
  }

  // Check if code is active
  if (!inviteCode.is_active) {
    return res.status(400).json({ 
      success: false,
      error: 'Invite code is inactive' 
    });
  }

  // Check if code is expired
  if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
    return res.status(400).json({ 
      success: false,
      error: 'Invite code has expired' 
    });
  }

  // Check if code has reached max uses
  if (inviteCode.used_count >= inviteCode.max_uses) {
    return res.status(400).json({ 
      success: false,
      error: 'Invite code has reached maximum uses' 
    });
  }

  // Use the invite code
  const success = await databaseService.useInviteCode(code);

  if (!success) {
    return res.status(400).json({ 
      success: false,
      error: 'Failed to use invite code' 
    });
  }

  // Get updated invite code for response
  const updatedCode = await databaseService.getInviteCodeByCode(code);
  
  // Handle event
  if (updatedCode) {
    await botEventManager.handleInviteCodeUsed(code, userId, userId);
  }

  // Invalidate cache
  await cacheService.invalidatePattern('bot:invite-codes:*');

  res.json({
    success: true,
    data: updatedCode,
    message: 'Invite code used successfully'
  });
}));

// GET /api/bot/invite-codes/active - Get active invite codes
router.get('/invite-codes/active', asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = 'bot:invite-codes:active';

  const inviteCodes = await cacheService.getOrSet(cacheKey, async () => {
    return await databaseService.getActiveInviteCodes();
  }, 60); // 1 Minute Cache

  res.json({
    success: true,
    data: inviteCodes
  });
}));

// PATCH /api/bot/invite-codes/:code/deactivate - Deactivate invite code
router.patch('/invite-codes/:code/deactivate', [
  param('code').isString().notEmpty()
], asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  const success = await databaseService.deactivateInviteCode(code);

  if (!success) {
    return res.status(404).json({ error: 'Invite code not found' });
  }

  // Invalidate cache
  await cacheService.invalidatePattern('bot:invite-codes:*');

  res.json({
    success: true,
    message: 'Invite code deactivated'
  });
}));

// ===== ANALYTICS ENDPOINTS =====

// POST /api/bot/analytics - Log analytics event
router.post('/analytics', [
  body('event_type').isString().notEmpty(),
  body('event_data').isObject(),
  body('user_id').optional().isString(),
  body('session_id').optional().isString(),
  body('ip_address').optional().isString(),
  body('user_agent').optional().isString()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid analytics data', details: errors.array() });
  }

  const eventData: AnalyticsEventData = req.body;
  const analyticsEvent = await databaseService.logBotAnalytics(eventData);

  // Handle event
  await botEventManager.handleAnalyticsEvent(eventData);

  // Invalidate analytics cache
  await cacheService.invalidatePattern('bot:analytics:*');

  res.status(201).json({
    success: true,
    data: analyticsEvent,
    message: 'Analytics event logged'
  });
}));

// GET /api/bot/stats - Get bot statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = 'bot:stats';

  const stats = await cacheService.getOrSet(cacheKey, async () => {
    // Hole echte Daten aus der Datenbank
    const [allUsers, activeUsers, allVerifications, pendingVerifications, allInviteCodes, activeInviteCodes] = await Promise.all([
      databaseService.getBotAnalytics({ eventType: 'user_joined' }),
      databaseService.getBotAnalytics({ eventType: 'user_active', limit: 1 }),
      databaseService.getAllVerificationSessions(),
      databaseService.getPendingVerificationSessions(),
      databaseService.getAllInviteCodes(),
      databaseService.getActiveInviteCodes()
    ]);

    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalVerifications: allVerifications.length,
      pendingVerifications: pendingVerifications.length,
      totalInviteCodes: allInviteCodes.length,
      activeInviteCodes: activeInviteCodes.length,
      timestamp: new Date().toISOString()
    };
  }, 30); // 30 Sekunden Cache

  res.json({
    success: true,
    data: stats
  });
}));

// ===== ADMIN ENDPOINTS =====

// GET /api/bot/admin/settings - Get admin settings
router.get('/admin/settings', asyncHandler(async (req: Request, res: Response) => {
  // Diese Settings würden normalerweise aus einer Konfigurationsdatei oder Datenbank kommen
  const settings = {
    enableVerification: process.env.ENABLE_VERIFICATION !== 'false',
    enableInviteSystem: process.env.ENABLE_INVITE_SYSTEM !== 'false',
    enableSupportTickets: process.env.ENABLE_SUPPORT_TICKETS !== 'false',
    adminIds: (process.env.ADMIN_IDS || '').split(',').filter(Boolean),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15'),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100')
  };

  res.json({
    success: true,
    data: settings
  });
}));

// POST /api/bot/admin/actions - Log admin action
router.post('/admin/actions', [
  body('admin_id').isString().notEmpty(),
  body('action_type').isString().notEmpty(),
  body('target_type').isString().notEmpty(),
  body('target_id').isString().notEmpty(),
  body('metadata').optional().isObject()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid admin action data', details: errors.array() });
  }

  const actionData: AdminActionData = req.body;
  await databaseService.logAdminAction(actionData);

  // Handle event
  await botEventManager.handleAdminAction(
    actionData.admin_id,
    actionData.action_type,
    actionData.target_type,
    actionData.target_id,
    actionData.metadata
  );

  res.status(201).json({
    success: true,
    message: 'Admin action logged'
  });
}));

// ===== REAL-TIME EVENTS =====

// POST /api/bot/events - Send real-time event
router.post('/events', [
  body('type').isString().notEmpty(),
  body('data').isObject(),
  body('target').optional().isString()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid event data', details: errors.array() });
  }

  const { type, data, target } = req.body;

  // Hier würde das Event an alle verbundenen Clients gesendet werden
  // Für jetzt nur Logging
  logger.info('Bot real-time event', { type, data, target });

  res.json({
    success: true,
    message: 'Event sent'
  });
}));

// ===== CASH PAYMENT VERIFICATION (ADMIN) =====

// GET /api/bot/cash-verifications/pending - Get all pending cash payment verifications (Admin)
router.get('/cash-verifications/pending', asyncHandler(async (req: Request, res: Response) => {
  try {
    // In production: Query database for pending cash payment verifications
    // For now, return mock data
    const pendingVerifications = [
      // Will be populated from database in production
    ];

    res.json({
      success: true,
      data: pendingVerifications
    });
  } catch (error) {
    logger.error('Failed to fetch pending cash verifications', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending cash verifications'
    });
  }
}));

// PATCH /api/bot/cash-verifications/:id/status - Update cash payment verification status (Admin)
router.patch('/cash-verifications/:id/status', [
  param('id').isString().notEmpty(),
  body('status').isIn(['approved', 'rejected']),
  body('admin_notes').optional().isString()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid data', details: errors.array() });
  }

  const { id } = req.params;
  const { status, admin_notes } = req.body;

  try {
    // In production:
    // 1. Update verification record in database
    // 2. Notify user of approval/rejection
    // 3. If approved, allow order to proceed
    // 4. If rejected, allow user to retry

    logger.info('Cash verification status updated', { 
      verificationId: id, 
      status, 
      admin_notes 
    });

    // Mock response
    res.json({
      success: true,
      data: {
        id,
        status,
        admin_notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin_user_id' // In production: actual admin user ID from auth
      },
      message: status === 'approved' ? 'Verification approved' : 'Verification rejected'
    });
  } catch (error) {
    logger.error('Failed to update cash verification status', { error, verificationId: id });
    res.status(500).json({
      success: false,
      error: 'Failed to update verification status'
    });
  }
}));

// POST /api/bot/telegram-webhook - Handle Telegram webhook callbacks
router.post('/telegram-webhook', asyncHandler(async (req: Request, res: Response) => {
  const update = req.body;

  try {
    // Handle callback queries (inline button clicks)
    if (update.callback_query) {
      await telegramNotificationService.handleCallbackQuery(update.callback_query);
      
      // Answer callback query to remove loading state
      // In production, you'd call Telegram API here
      logger.info('Telegram callback query handled', {
        callbackData: update.callback_query.data
      });
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error('Failed to handle Telegram webhook', { error });
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}));

export { router as botRoutes };
