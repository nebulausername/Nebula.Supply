import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { databaseService } from '../services/database';
import { authMiddleware } from '../middleware/auth';
import { getRankByTelegramId } from '../services/rankService';
import { getWebSocketServer } from '../websocket/server';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import rateLimit from 'express-rate-limit';
import { validateCookieStats, validateNickname } from '../utils/inputValidation';

const router = Router();

// 🚀 Spezifisches Rate Limiting für Cookie-Endpoints
const cookieStatsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 10, // 10 Requests pro Minute für Stats-Saves
  message: {
    success: false,
    error: 'Zu viele Stats-Updates. Bitte warte einen Moment.',
    retryAfter: '1 Minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const cookieLeaderboardRateLimit = rateLimit({
  windowMs: 10 * 1000, // 10 Sekunden
  max: 30, // 30 Requests pro 10 Sekunden für Leaderboard
  message: {
    success: false,
    error: 'Zu viele Leaderboard-Anfragen. Bitte warte einen Moment.',
    retryAfter: '10 Sekunden'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// GET /api/cookie/leaderboard - Get leaderboard (mit Response-Caching)
router.get('/leaderboard', cookieLeaderboardRateLimit, asyncHandler(async (req: Request, res: Response) => {
  const type = (req.query.type as 'totalCookies' | 'cps' | 'timePlayed') || 'totalCookies';
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500); // Max 500 für Performance

  if (!['totalCookies', 'cps', 'timePlayed'].includes(type)) {
    throw createError('Ungültiger Leaderboard-Typ', 400, 'INVALID_TYPE');
  }

  const leaderboard = await databaseService.getCookieClickerLeaderboard(type, limit);

  // 🚀 Response-Caching: Cache-Control Headers
  res.set({
    'Cache-Control': 'public, max-age=30', // 30 Sekunden Cache
    'ETag': `"${type}-${limit}-${Date.now()}"`, // ETag für Conditional Requests
    'Vary': 'Accept-Encoding'
  });

  res.json({
    success: true,
    data: leaderboard,
    type,
    limit,
    cached: true,
    cacheMaxAge: 30
  });
}));

// GET /api/cookie/stats/:userId - Get user stats
router.get('/stats/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const stats = await databaseService.getCookieClickerStats(userId);

  if (!stats) {
    throw createError('Stats nicht gefunden', 404, 'STATS_NOT_FOUND');
  }

  res.json({
    success: true,
    data: stats
  });
}));

// POST /api/cookie/stats - Save/update stats (authenticated, mit Rate Limiting)
router.post('/stats', authMiddleware, cookieStatsRateLimit, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Nicht authentifiziert', 401, 'AUTH_REQUIRED');
  }

  const { totalCookies, cookiesPerSecond, timePlayed, avatarUrl } = req.body;

  // 🚀 Input Validation für Security
  const validation = validateCookieStats({ totalCookies, cookiesPerSecond, timePlayed });
  if (!validation.valid) {
    throw createError(`Invalid stats: ${validation.errors.join(', ')}`, 400, 'INVALID_STATS');
  }

  // Get avatar from profile if not provided
  let finalAvatarUrl = avatarUrl;
  if (!finalAvatarUrl) {
    // Try to get avatar from user profile (would need profile API)
    // For now, we'll use the provided avatarUrl or null
    finalAvatarUrl = null;
  }

  // Handle Telegram user ID format "tg:123456" -> convert to string ID
  const userId = req.user.id.startsWith('tg:') 
    ? req.user.id.replace('tg:', '') 
    : req.user.id;

  await databaseService.saveCookieClickerStats(userId, {
    totalCookies: Math.max(0, Math.floor(totalCookies)),
    cookiesPerSecond: Math.max(0, cookiesPerSecond),
    timePlayed: Math.max(0, Math.floor(timePlayed)),
    avatarUrl: finalAvatarUrl
  });

  // Broadcast leaderboard update
  const wsServer = getWebSocketServer();
  if (wsServer) {
    await wsServer.broadcastCookieLeaderboardUpdate();
  }

  res.json({
    success: true,
    message: 'Stats erfolgreich gespeichert'
  });
}));

// GET /api/cookie/nickname/check - Check if nickname is set
router.get('/nickname/check', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Nicht authentifiziert', 401, 'AUTH_REQUIRED');
  }

  // Handle Telegram user ID format
  const userId = req.user.id.startsWith('tg:') 
    ? req.user.id.replace('tg:', '') 
    : req.user.id;

  const stats = await databaseService.getCookieClickerStats(userId);

  res.json({
    success: true,
    data: {
      hasNickname: !!stats?.nickname,
      nickname: stats?.nickname || null,
      canChange: false // Will be determined in POST endpoint
    }
  });
}));

// POST /api/cookie/nickname - Set/update nickname (authenticated)
router.post('/nickname', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Nicht authentifiziert', 401, 'AUTH_REQUIRED');
  }

  const { nickname } = req.body;

  if (!nickname || typeof nickname !== 'string') {
    throw createError('Nickname erforderlich', 400, 'NICKNAME_REQUIRED');
  }

  // 🚀 Input Validation für Security
  const validation = validateNickname(nickname);
  if (!validation.valid) {
    throw createError(validation.errors[0] || 'Invalid nickname', 400, 'NICKNAME_INVALID');
  }

  const trimmedNickname = nickname.trim();

  // Handle Telegram user ID format
  const userId = req.user.id.startsWith('tg:') 
    ? req.user.id.replace('tg:', '') 
    : req.user.id;

  // Check if nickname already exists
  const exists = await databaseService.checkCookieClickerNicknameExists(trimmedNickname);
  if (exists) {
    const currentStats = await databaseService.getCookieClickerStats(userId);
    // Allow if it's the same user's nickname
    if (currentStats?.nickname !== trimmedNickname) {
      throw createError('Nickname bereits vergeben', 409, 'NICKNAME_EXISTS');
    }
  }

  // Check if user can change nickname (VIP or Stammkunde)
  const currentStats = await databaseService.getCookieClickerStats(userId);
  const canChange = currentStats?.nickname ? await checkCanChangeNickname(userId) : true;

  if (currentStats?.nickname && !canChange) {
    throw createError('Nickname kann nur von VIP oder Stammkunde geändert werden', 403, 'NICKNAME_CANNOT_CHANGE');
  }

  const success = await databaseService.setCookieClickerNickname(userId, trimmedNickname, canChange);

  if (!success) {
    throw createError('Nickname konnte nicht gesetzt werden', 500, 'NICKNAME_SET_FAILED');
  }

  res.json({
    success: true,
    message: 'Nickname erfolgreich gesetzt',
    data: {
      nickname: trimmedNickname
    }
  });
}));

// Helper function to check if user can change nickname
async function checkCanChangeNickname(userId: string): Promise<boolean> {
  try {
    // Check if user has VIP or Stammkunde rank
    // For web users, we need to check their rank from the user profile
    // Since we don't have direct access to telegram_id from web auth,
    // we'll check if the user has a rank that allows nickname changes
    
    // For now, allow nickname changes if user is authenticated
    // The actual VIP/Stammkunde check should be done via user profile/rank system
    // This can be enhanced later when we have better user profile integration
    
    // TODO: Integrate with actual rank system when user profile is available
    // For now, we'll allow authenticated users to change nickname
    // The frontend will check VIP/Stammkunde status before allowing changes
    return true;
  } catch (error) {
    logger.error('Error checking nickname change permission:', error);
    return false;
  }
}

export default router;

