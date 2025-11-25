import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { databaseService } from '../services/database';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { getWebSocketServer } from '../websocket/server';
import { auditLogger } from '../utils/auditLogger';

const router = Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminOnly);

// GET /api/admin/cookie/stats - Overall statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await databaseService.getCookieClickerAdminStats();
  
  res.json({
    success: true,
    data: stats
  });
}));

// GET /api/admin/cookie/players - List all players with pagination (Optimiert)
// POST /api/admin/cookie/players - List all players with advanced filters
router.get('/players', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200); // Max 200 für Performance
  const search = (req.query.search as string || '').trim().substring(0, 100); // Limit search length
  const sortBy = (req.query.sortBy as 'totalCookies' | 'cookiesPerSecond' | 'timePlayed' | 'lastUpdated') || 'totalCookies';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

  const result = await databaseService.getAllCookiePlayers({
    page,
    limit,
    search,
    sortBy,
    sortOrder
  });

  // 🚀 Response-Caching für Admin-Endpoints (kürzer wegen häufiger Updates)
  res.set({
    'Cache-Control': 'private, max-age=10', // 10 Sekunden Cache (nur für Admin)
    'X-Total-Pages': result.totalPages.toString(),
    'X-Total-Count': result.total.toString()
  });

  res.json({
    success: true,
    data: result
  });
}));

router.post('/players', asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 200);
  const search = (req.query.search as string || '').trim().substring(0, 100);
  const sortBy = (req.query.sortBy as 'totalCookies' | 'cookiesPerSecond' | 'timePlayed' | 'lastUpdated') || 'totalCookies';
  const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
  const filters = req.body.filters || {};

  const result = await databaseService.getAllCookiePlayersWithFilters({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    filters
  });

  res.set({
    'Cache-Control': 'private, max-age=10',
    'X-Total-Pages': result.totalPages.toString(),
    'X-Total-Count': result.total.toString()
  });

  res.json({
    success: true,
    data: result
  });
}));

// GET /api/admin/cookie/player/:userId - Get specific player details
router.get('/player/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const stats = await databaseService.getCookieClickerStats(userId);

  if (!stats) {
    throw createError('Spieler nicht gefunden', 404, 'PLAYER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: stats
  });
}));

// POST /api/admin/cookie/player/:userId/reset - Reset player progress
router.post('/player/:userId/reset', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  await databaseService.resetCookiePlayerStats(userId);

  // 🚀 Audit Logging
  auditLogger.logPlayerAction(
    req.user!.id,
    'reset',
    userId,
    undefined,
    req.ip
  );

  // Broadcast leaderboard update
  const wsServer = getWebSocketServer();
  if (wsServer) {
    await wsServer.broadcastCookieLeaderboardUpdate();
  }

  logger.info(`Admin ${req.user?.id} reset stats for player ${userId}`);

  res.json({
    success: true,
    message: 'Spieler-Statistiken wurden zurückgesetzt'
  });
}));

// POST /api/admin/cookie/player/:userId/ban - Ban/unban player (placeholder - would need ban table)
router.post('/player/:userId/ban', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { reason, banned } = req.body;

  // TODO: Implement ban system with separate table
  // For now, just log the action
  logger.info(`Admin ${req.user?.id} ${banned ? 'banned' : 'unbanned'} player ${userId}`, { reason });

  res.json({
    success: true,
    message: `Spieler wurde ${banned ? 'gebannt' : 'entbannt'}`
  });
}));

// POST /api/admin/cookie/leaderboard/reset - Reset leaderboard
router.post('/leaderboard/reset', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.body; // Optional: 'totalCookies' | 'cps' | 'timePlayed'

  await databaseService.resetCookieLeaderboard(type);

  // 🚀 Audit Logging
  auditLogger.logLeaderboardAction(
    req.user!.id,
    'reset',
    type,
    undefined,
    req.ip
  );

  // Broadcast leaderboard update
  const wsServer = getWebSocketServer();
  if (wsServer) {
    await wsServer.broadcastCookieLeaderboardUpdate();
  }

  logger.info(`Admin ${req.user?.id} reset leaderboard${type ? ` (${type})` : ''}`);

  res.json({
    success: true,
    message: 'Leaderboard wurde zurückgesetzt'
  });
}));

// POST /api/admin/cookie/leaderboard/adjust - Manually adjust player stats
router.post('/leaderboard/adjust', asyncHandler(async (req: Request, res: Response) => {
  const { userId, stats } = req.body;

  if (!userId || !stats) {
    throw createError('userId und stats erforderlich', 400, 'INVALID_REQUEST');
  }

  await databaseService.adjustCookiePlayerStats(userId, {
    totalCookies: stats.totalCookies,
    cookiesPerSecond: stats.cookiesPerSecond,
    timePlayed: stats.timePlayed
  });

  // 🚀 Audit Logging
  auditLogger.logPlayerAction(
    req.user!.id,
    'adjust',
    userId,
    stats,
    req.ip
  );

  // Broadcast leaderboard update
  const wsServer = getWebSocketServer();
  if (wsServer) {
    await wsServer.broadcastCookieLeaderboardUpdate();
  }

  logger.info(`Admin ${req.user?.id} adjusted stats for player ${userId}`, { stats });

  res.json({
    success: true,
    message: 'Spieler-Statistiken wurden angepasst'
  });
}));

// GET /api/admin/cookie/analytics - Analytics data
router.get('/analytics', asyncHandler(async (req: Request, res: Response) => {
  const range = (req.query.range as '24h' | '7d' | '30d' | 'all') || '7d';

  const stats = await databaseService.getCookieClickerAdminStats();

  // Additional analytics calculations
  const analytics = {
    ...stats,
    range,
    growthRate: {
      players24h: stats.activePlayers24h,
      players7d: stats.activePlayers7d,
      players30d: stats.activePlayers30d
    },
    engagement: {
      averageSessionTime: stats.averagePlaytime / 3600, // Convert to hours
      averageCPS: stats.averageCPS,
      totalCookiesPerPlayer: stats.totalPlayers > 0 ? stats.totalCookiesGenerated / stats.totalPlayers : 0
    }
  };

  res.json({
    success: true,
    data: analytics
  });
}));

// GET /api/admin/cookie/player/:userId/history - Get player game history
router.get('/player/:userId/history', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

  const history = await databaseService.getCookiePlayerHistory(userId, limit);

  res.json({
    success: true,
    data: history
  });
}));

// GET /api/admin/cookie/player/:userId/achievements - Get player achievements
router.get('/player/:userId/achievements', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const achievements = await databaseService.getCookiePlayerAchievements(userId);

  res.json({
    success: true,
    data: achievements
  });
}));

// GET /api/admin/cookie/player/:userId/stats - Get detailed player stats (buildings, upgrades, prestige, etc.)
router.get('/player/:userId/stats', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const detailedStats = await databaseService.getCookiePlayerDetailedStats(userId);

  res.json({
    success: true,
    data: detailedStats
  });
}));

// GET /api/admin/cookie/player/:userId/notes - Get player notes
router.get('/player/:userId/notes', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const notes = await databaseService.getCookiePlayerNotes(userId);

  res.json({
    success: true,
    data: notes
  });
}));

// POST /api/admin/cookie/player/:userId/notes - Add player note
router.post('/player/:userId/notes', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { note } = req.body;

  if (!note || typeof note !== 'string' || note.trim().length === 0) {
    throw createError('Note is required', 400, 'INVALID_NOTE');
  }

  const newNote = await databaseService.addCookiePlayerNote(userId, req.user!.id, note.trim());

  auditLogger.logPlayerAction(
    req.user!.id,
    'add_note',
    userId,
    { noteId: newNote.id },
    req.ip
  );

  res.json({
    success: true,
    data: newNote
  });
}));

// PUT /api/admin/cookie/player/notes/:noteId - Update player note
router.put('/player/notes/:noteId', asyncHandler(async (req: Request, res: Response) => {
  const { noteId } = req.params;
  const { note } = req.body;

  if (!note || typeof note !== 'string' || note.trim().length === 0) {
    throw createError('Note is required', 400, 'INVALID_NOTE');
  }

  const updated = await databaseService.updateCookiePlayerNote(parseInt(noteId), req.user!.id, note.trim());

  if (!updated) {
    throw createError('Note not found or unauthorized', 404, 'NOTE_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Note updated successfully'
  });
}));

// DELETE /api/admin/cookie/player/notes/:noteId - Delete player note
router.delete('/player/notes/:noteId', asyncHandler(async (req: Request, res: Response) => {
  const { noteId } = req.params;

  const deleted = await databaseService.deleteCookiePlayerNote(parseInt(noteId), req.user!.id);

  if (!deleted) {
    throw createError('Note not found or unauthorized', 404, 'NOTE_NOT_FOUND');
  }

  res.json({
    success: true,
    message: 'Note deleted successfully'
  });
}));

// GET /api/admin/cookie/player/:userId/tags - Get player tags
router.get('/player/:userId/tags', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const tags = await databaseService.getCookiePlayerTags(userId);

  res.json({
    success: true,
    data: tags
  });
}));

// POST /api/admin/cookie/player/:userId/tags - Add player tag
router.post('/player/:userId/tags', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { tag } = req.body;

  if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
    throw createError('Tag is required', 400, 'INVALID_TAG');
  }

  if (tag.length > 50) {
    throw createError('Tag must be 50 characters or less', 400, 'INVALID_TAG');
  }

  const newTag = await databaseService.addCookiePlayerTag(userId, req.user!.id, tag.trim().toLowerCase());

  auditLogger.logPlayerAction(
    req.user!.id,
    'add_tag',
    userId,
    { tag: newTag.tag },
    req.ip
  );

  res.json({
    success: true,
    data: newTag
  });
}));

// DELETE /api/admin/cookie/player/:userId/tags/:tag - Remove player tag
router.delete('/player/:userId/tags/:tag', asyncHandler(async (req: Request, res: Response) => {
  const { userId, tag } = req.params;

  const deleted = await databaseService.removeCookiePlayerTag(userId, decodeURIComponent(tag));

  if (!deleted) {
    throw createError('Tag not found', 404, 'TAG_NOT_FOUND');
  }

  auditLogger.logPlayerAction(
    req.user!.id,
    'remove_tag',
    userId,
    { tag },
    req.ip
  );

  res.json({
    success: true,
    message: 'Tag removed successfully'
  });
}));

// Season Management Endpoints
// GET /api/admin/cookie/seasons - Get all seasons
router.get('/seasons', asyncHandler(async (req: Request, res: Response) => {
  const seasons = await databaseService.getSeasons();
  res.json({
    success: true,
    data: seasons
  });
}));

// GET /api/admin/cookie/seasons/:id - Get season details
router.get('/seasons/:id', asyncHandler(async (req: Request, res: Response) => {
  const seasonId = parseInt(req.params.id);
  const season = await databaseService.getSeason(seasonId);
  
  if (!season) {
    throw createError('Season not found', 404, 'SEASON_NOT_FOUND');
  }

  const leaderboard = await databaseService.getSeasonLeaderboard(seasonId);
  const rewards = await databaseService.getSeasonRewards(seasonId);

  res.json({
    success: true,
    data: {
      ...season,
      leaderboard,
      rewards
    }
  });
}));

// POST /api/admin/cookie/seasons - Create new season
router.post('/seasons', asyncHandler(async (req: Request, res: Response) => {
  const { name, description, startDate, endDate } = req.body;

  if (!name || !startDate || !endDate) {
    throw createError('name, startDate, and endDate are required', 400, 'INVALID_REQUEST');
  }

  const season = await databaseService.createSeason({
    name,
    description,
    startDate,
    endDate
  });

  auditLogger.logLeaderboardAction(
    req.user!.id,
    'create_season',
    undefined,
    { seasonId: season.id, name: season.name },
    req.ip
  );

  res.json({
    success: true,
    data: season
  });
}));

// PUT /api/admin/cookie/seasons/:id - Update season
router.put('/seasons/:id', asyncHandler(async (req: Request, res: Response) => {
  const seasonId = parseInt(req.params.id);
  const updates = req.body;

  const updated = await databaseService.updateSeason(seasonId, updates);

  if (!updated) {
    throw createError('Season not found', 404, 'SEASON_NOT_FOUND');
  }

  auditLogger.logLeaderboardAction(
    req.user!.id,
    'update_season',
    undefined,
    { seasonId, updates },
    req.ip
  );

  res.json({
    success: true,
    message: 'Season updated successfully'
  });
}));

// DELETE /api/admin/cookie/seasons/:id - Delete season
router.delete('/seasons/:id', asyncHandler(async (req: Request, res: Response) => {
  const seasonId = parseInt(req.params.id);

  const deleted = await databaseService.deleteSeason(seasonId);

  if (!deleted) {
    throw createError('Season not found', 404, 'SEASON_NOT_FOUND');
  }

  auditLogger.logLeaderboardAction(
    req.user!.id,
    'delete_season',
    undefined,
    { seasonId },
    req.ip
  );

  res.json({
    success: true,
    message: 'Season deleted successfully'
  });
}));

// POST /api/admin/cookie/seasons/:id/snapshot - Create leaderboard snapshot
router.post('/seasons/:id/snapshot', asyncHandler(async (req: Request, res: Response) => {
  const seasonId = parseInt(req.params.id);

  await databaseService.snapshotSeasonLeaderboard(seasonId);

  res.json({
    success: true,
    message: 'Season leaderboard snapshot created'
  });
}));

// POST /api/admin/cookie/seasons/:id/rewards - Create season reward
router.post('/seasons/:id/rewards', asyncHandler(async (req: Request, res: Response) => {
  const seasonId = parseInt(req.params.id);
  const { rankMin, rankMax, rewardType, rewardAmount, rewardDescription } = req.body;

  if (!rankMin || !rankMax || !rewardType || rewardAmount === undefined) {
    throw createError('rankMin, rankMax, rewardType, and rewardAmount are required', 400, 'INVALID_REQUEST');
  }

  const reward = await databaseService.createSeasonReward(seasonId, {
    rankMin,
    rankMax,
    rewardType,
    rewardAmount,
    rewardDescription: rewardDescription || ''
  });

  res.json({
    success: true,
    data: reward
  });
}));

// POST /api/admin/cookie/seasons/:id/distribute - Distribute season rewards
router.post('/seasons/:id/distribute', asyncHandler(async (req: Request, res: Response) => {
  const seasonId = parseInt(req.params.id);

  const distributedCount = await databaseService.distributeSeasonRewards(seasonId);

  auditLogger.logLeaderboardAction(
    req.user!.id,
    'distribute_rewards',
    undefined,
    { seasonId, distributedCount },
    req.ip
  );

  res.json({
    success: true,
    message: `Rewards distributed to ${distributedCount} players`,
    data: { distributedCount }
  });
}));

// POST /api/admin/cookie/players/bulk - Bulk operations
router.post('/players/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { action, userIds, data } = req.body;

  if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw createError('action and userIds array required', 400, 'INVALID_REQUEST');
  }

  const results = {
    success: [] as string[],
    failed: [] as Array<{ userId: string; error: string }>
  };

  switch (action) {
    case 'reset':
      for (const userId of userIds) {
        try {
          await databaseService.resetCookiePlayerStats(userId);
          results.success.push(userId);
          auditLogger.logPlayerAction(req.user!.id, 'bulk_reset', userId, undefined, req.ip);
        } catch (error: any) {
          results.failed.push({ userId, error: error.message || 'Unknown error' });
        }
      }
      break;

    case 'ban':
      const banReason = data?.reason || 'Bulk ban';
      for (const userId of userIds) {
        try {
          // TODO: Implement actual ban system
          logger.info(`Admin ${req.user!.id} banned player ${userId}`, { reason: banReason });
          results.success.push(userId);
          auditLogger.logPlayerAction(req.user!.id, 'bulk_ban', userId, { reason: banReason }, req.ip);
        } catch (error: any) {
          results.failed.push({ userId, error: error.message || 'Unknown error' });
        }
      }
      break;

    case 'unban':
      for (const userId of userIds) {
        try {
          // TODO: Implement actual unban system
          logger.info(`Admin ${req.user!.id} unbanned player ${userId}`);
          results.success.push(userId);
          auditLogger.logPlayerAction(req.user!.id, 'bulk_unban', userId, undefined, req.ip);
        } catch (error: any) {
          results.failed.push({ userId, error: error.message || 'Unknown error' });
        }
      }
      break;

    case 'adjust_stats':
      if (!data?.stats) {
        throw createError('stats required for adjust_stats action', 400, 'INVALID_REQUEST');
      }
      for (const userId of userIds) {
        try {
          await databaseService.adjustCookiePlayerStats(userId, {
            totalCookies: data.stats.totalCookies,
            cookiesPerSecond: data.stats.cookiesPerSecond,
            timePlayed: data.stats.timePlayed
          });
          results.success.push(userId);
          auditLogger.logPlayerAction(req.user!.id, 'bulk_adjust', userId, data.stats, req.ip);
        } catch (error: any) {
          results.failed.push({ userId, error: error.message || 'Unknown error' });
        }
      }
      break;

    case 'add_tag':
      if (!data?.tag) {
        throw createError('tag required for add_tag action', 400, 'INVALID_REQUEST');
      }
      for (const userId of userIds) {
        try {
          await databaseService.addCookiePlayerTag(userId, req.user!.id, data.tag);
          results.success.push(userId);
          auditLogger.logPlayerAction(req.user!.id, 'bulk_add_tag', userId, { tag: data.tag }, req.ip);
        } catch (error: any) {
          results.failed.push({ userId, error: error.message || 'Unknown error' });
        }
      }
      break;

    case 'remove_tag':
      if (!data?.tag) {
        throw createError('tag required for remove_tag action', 400, 'INVALID_REQUEST');
      }
      for (const userId of userIds) {
        try {
          await databaseService.removeCookiePlayerTag(userId, data.tag);
          results.success.push(userId);
          auditLogger.logPlayerAction(req.user!.id, 'bulk_remove_tag', userId, { tag: data.tag }, req.ip);
        } catch (error: any) {
          results.failed.push({ userId, error: error.message || 'Unknown error' });
        }
      }
      break;

    default:
      throw createError(`Unknown bulk action: ${action}`, 400, 'INVALID_ACTION');
  }

  // Broadcast leaderboard update if stats were changed
  if (['reset', 'adjust_stats'].includes(action)) {
    const wsServer = getWebSocketServer();
    if (wsServer) {
      await wsServer.broadcastCookieLeaderboardUpdate();
    }
  }

  res.json({
    success: true,
    data: results
  });
}));

// Custom Leaderboards Routes
// GET /api/admin/cookie/custom-leaderboards - Get all custom leaderboards
router.get('/custom-leaderboards', asyncHandler(async (req: Request, res: Response) => {
  const leaderboards = await databaseService.getCustomLeaderboards();
  res.json({
    success: true,
    data: leaderboards
  });
}));

// GET /api/admin/cookie/custom-leaderboards/:id - Get custom leaderboard details
router.get('/custom-leaderboards/:id', asyncHandler(async (req: Request, res: Response) => {
  const leaderboardId = parseInt(req.params.id);
  const leaderboard = await databaseService.getCustomLeaderboard(leaderboardId);
  
  if (!leaderboard) {
    throw createError('Custom leaderboard not found', 404, 'LEADERBOARD_NOT_FOUND');
  }

  const rankings = await databaseService.getCustomLeaderboardRankings(leaderboardId);
  
  res.json({
    success: true,
    data: {
      ...leaderboard,
      rankings
    }
  });
}));

// POST /api/admin/cookie/custom-leaderboards - Create custom leaderboard
router.post('/custom-leaderboards', asyncHandler(async (req: Request, res: Response) => {
  const { name, description, metric, filter, isPublic, isTemporary, startDate, endDate } = req.body;

  if (!name || !metric) {
    throw createError('name and metric are required', 400, 'INVALID_REQUEST');
  }

  const leaderboard = await databaseService.createCustomLeaderboard({
    name,
    description,
    metric,
    filter,
    isPublic: isPublic !== false,
    isTemporary: isTemporary || false,
    startDate,
    endDate,
    createdBy: req.user!.id
  });

  auditLogger.logLeaderboardAction(
    req.user!.id,
    'create_custom_leaderboard',
    undefined,
    { leaderboardId: leaderboard.id, name: leaderboard.name },
    req.ip
  );

  res.json({
    success: true,
    data: leaderboard
  });
}));

// PUT /api/admin/cookie/custom-leaderboards/:id - Update custom leaderboard
router.put('/custom-leaderboards/:id', asyncHandler(async (req: Request, res: Response) => {
  const leaderboardId = parseInt(req.params.id);
  const updates = req.body;

  const updated = await databaseService.updateCustomLeaderboard(leaderboardId, updates);

  if (!updated) {
    throw createError('Custom leaderboard not found', 404, 'LEADERBOARD_NOT_FOUND');
  }

  auditLogger.logLeaderboardAction(
    req.user!.id,
    'update_custom_leaderboard',
    undefined,
    { leaderboardId, updates },
    req.ip
  );

  const leaderboard = await databaseService.getCustomLeaderboard(leaderboardId);
  res.json({
    success: true,
    data: leaderboard
  });
}));

// DELETE /api/admin/cookie/custom-leaderboards/:id - Delete custom leaderboard
router.delete('/custom-leaderboards/:id', asyncHandler(async (req: Request, res: Response) => {
  const leaderboardId = parseInt(req.params.id);

  const deleted = await databaseService.deleteCustomLeaderboard(leaderboardId);

  if (!deleted) {
    throw createError('Custom leaderboard not found', 404, 'LEADERBOARD_NOT_FOUND');
  }

  auditLogger.logLeaderboardAction(
    req.user!.id,
    'delete_custom_leaderboard',
    undefined,
    { leaderboardId },
    req.ip
  );

  res.json({
    success: true,
    message: 'Custom leaderboard deleted'
  });
}));

// GET /api/admin/cookie/custom-leaderboards/:id/rankings - Get custom leaderboard rankings
router.get('/custom-leaderboards/:id/rankings', asyncHandler(async (req: Request, res: Response) => {
  const leaderboardId = parseInt(req.params.id);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 100), 1000);

  const rankings = await databaseService.getCustomLeaderboardRankings(leaderboardId, limit);
  
  res.json({
    success: true,
    data: rankings
  });
}));

export default router;










































