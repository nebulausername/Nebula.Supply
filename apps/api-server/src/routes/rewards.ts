import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { databaseService } from '../services/database';
import { liveHomepageEvents } from '../websocket/events/liveHomepageEvents';
import { cacheService } from '../services/cache';

const router = Router();

// Rate limiting for rewards (prevent spam)
const rewardRateLimits = new Map<number, { count: number; resetAt: number }>();

function checkRewardRateLimit(telegramId: number): boolean {
  const now = Date.now();
  const limit = rewardRateLimits.get(telegramId);

  if (!limit || now > limit.resetAt) {
    rewardRateLimits.set(telegramId, { count: 1, resetAt: now + 60000 }); // 1 minute window
    return true;
  }

  if (limit.count >= 10) {
    return false; // Max 10 requests per minute
  }

  limit.count++;
  return true;
}

// Telegram auth middleware (lightweight for rewards)
const telegramAuth = async (req: Request, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw createError('Authorization erforderlich', 401, 'AUTH_MISSING');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw createError('Token erforderlich', 401, 'TOKEN_MISSING');
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (!decoded.telegramId) {
      throw createError('Ungültiger Token', 401, 'TOKEN_INVALID');
    }

    // Attach telegram user to request
    (req as any).telegramUser = {
      telegramId: decoded.telegramId,
      username: decoded.username
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Ungültiger Token', 401, 'TOKEN_INVALID'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createError('Token abgelaufen', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

// Helper: Get day key for local timezone (YYYY-MM-DD in user's TZ)
function getDayKey(timezone?: string): string {
  const now = new Date();
  // If timezone provided, convert; else use UTC
  if (timezone) {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
    return formatter.format(now); // YYYY-MM-DD
  }
  return now.toISOString().split('T')[0]; // UTC fallback
}

// GET /api/rewards/status
router.get('/status', telegramAuth, asyncHandler(async (req: Request, res: Response) => {
  const { telegramId } = (req as any).telegramUser;
  const timezone = (req.query.timezone as string) || 'UTC';

  // Rate limiting
  if (!checkRewardRateLimit(telegramId)) {
    throw createError('Zu viele Anfragen, bitte später erneut versuchen', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Try cache first (short TTL to allow frequent checks)
  const cacheKey = `reward:status:${telegramId}:${getDayKey(timezone)}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    try {
      return res.json({ success: true, data: JSON.parse(cached), cached: true });
    } catch {
      // Cache parse error, continue
    }
  }

  const botUser = await databaseService.getBotUserByTelegramId(telegramId);
  if (!botUser) {
    throw createError('User nicht gefunden', 404, 'USER_NOT_FOUND');
  }

  // Get or create reward record
  let rewardRecord = await databaseService.getDailyReward(botUser.id);
  if (!rewardRecord) {
    rewardRecord = await databaseService.createDailyReward({
      userId: botUser.id,
      lastClaimAt: null,
      lastClaimDayKey: null,
      streak: 0,
      totalCoins: 0
    });
  }

  const todayKey = getDayKey(timezone);
  const eligible = rewardRecord.lastClaimDayKey !== todayKey;

  // Calculate next eligible time (midnight tonight in user's TZ)
  const nextEligible = new Date();
  if (timezone !== 'UTC') {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    // Simplified: just add 24h if already claimed today
    if (!eligible) {
      nextEligible.setHours(24, 0, 0, 0);
    }
  }

  const statusData = {
    eligible,
    lastClaimAt: rewardRecord.lastClaimAt || null,
    lastClaimDayKey: rewardRecord.lastClaimDayKey || null,
    streak: rewardRecord.streak || 0,
    totalCoins: rewardRecord.totalCoins || 0,
    nextEligibleAt: !eligible ? nextEligible.toISOString() : null,
    todayDayKey: todayKey
  };

  // Cache for 30 seconds
  await cacheService.set(cacheKey, JSON.stringify(statusData), 30);

  res.json({
    success: true,
    data: statusData
  });
}));

// POST /api/rewards/claim
router.post('/claim', telegramAuth, asyncHandler(async (req: Request, res: Response) => {
  const { telegramId, username } = (req as any).telegramUser;
  const { timezone = 'UTC' } = req.body;

  // Rate limiting (stricter for claims)
  if (!checkRewardRateLimit(telegramId)) {
    throw createError('Zu viele Anfragen, bitte später erneut versuchen', 429, 'RATE_LIMIT_EXCEEDED');
  }

  const botUser = await databaseService.getBotUserByTelegramId(telegramId);
  if (!botUser) {
    throw createError('User nicht gefunden', 404, 'USER_NOT_FOUND');
  }

  let rewardRecord = await databaseService.getDailyReward(botUser.id);
  if (!rewardRecord) {
    rewardRecord = await databaseService.createDailyReward({
      userId: botUser.id,
      lastClaimAt: null,
      lastClaimDayKey: null,
      streak: 0,
      totalCoins: 0
    });
  }

  const todayKey = getDayKey(timezone);

  // Check eligibility
  if (rewardRecord.lastClaimDayKey === todayKey) {
    logger.warn(`Duplicate claim attempt by user ${telegramId}`);
    throw createError('Heute bereits beansprucht', 400, 'ALREADY_CLAIMED_TODAY');
  }

  // Calculate streak
  let newStreak = rewardRecord.streak || 0;
  const lastKey = rewardRecord.lastClaimDayKey;

  // Simple streak logic: if last claim was yesterday, continue streak; else reset
  if (lastKey) {
    const lastDate = new Date(lastKey);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastKey === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1; // reset
    }
  } else {
    newStreak = 1; // first claim
  }

  // Calculate reward: 10 base + 5 per streak day (max 50 bonus)
  const bonusCoins = Math.min(newStreak * 5, 50);
  const rewardCoins = 10 + bonusCoins;

  // Update record (atomic operation)
  const updatedRecord = await databaseService.updateDailyReward(botUser.id, {
    lastClaimAt: new Date().toISOString(),
    lastClaimDayKey: todayKey,
    streak: newStreak,
    totalCoins: (rewardRecord.totalCoins || 0) + rewardCoins
  });

  if (!updatedRecord) {
    throw createError('Fehler beim Speichern', 500, 'UPDATE_FAILED');
  }

  // Invalidate status cache
  const cacheKey = `reward:status:${telegramId}:${todayKey}`;
  await cacheService.delete(cacheKey);

  // Broadcast to homepage WS (non-blocking)
  setImmediate(() => {
    liveHomepageEvents.broadcastUserActivity(
      botUser.id,
      username || `@user${telegramId}`,
      'achievement',
      'daily-reward',
      `hat ${rewardCoins} Coins beansprucht! 🎉 (Streak: ${newStreak})`
    );
  });

  logger.info(`Daily reward claimed: user=${telegramId}, coins=${rewardCoins}, streak=${newStreak}`);

  res.json({
    success: true,
    data: {
      coins: rewardCoins,
      streak: newStreak,
      totalCoins: updatedRecord.totalCoins,
      nextEligibleAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // approx
    },
    message: `${rewardCoins} Coins erhalten! Streak: ${newStreak} Tage 🔥`
  });
}));

export default router;


