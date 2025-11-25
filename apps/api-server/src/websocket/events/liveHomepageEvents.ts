import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { cacheService } from '../../services/cache';
import { databaseService } from '../../services/database';

export interface HomepageDropEvent {
  type: 'homepage:drop_new' | 'homepage:drop_stock_changed' | 'homepage:drop_progress';
  data: {
    dropId: string;
    dropName: string;
    status: string;
    stock?: number;
    progress?: number;
    timestamp: string;
  };
}

export interface HomepageActivityEvent {
  type: 'homepage:activity';
  data: {
    userId: string;
    userHandle: string;
    action: 'purchase' | 'interest' | 'invite' | 'achievement';
    resource: string;
    message: string;
    timestamp: string;
  };
}

export interface HomepageStatsEvent {
  type: 'homepage:stats_update';
  data: {
    activeDrops: number;
    vipMembers: number;
    totalProducts: number;
    successRate: string;
    revenue: number;
    timestamp: string;
  };
}

export type HomepageEvent = HomepageDropEvent | HomepageActivityEvent | HomepageStatsEvent;

export class LiveHomepageEvents extends EventEmitter {
  private statsCache = new Map<string, any>();
  private lastStatsUpdate = 0;
  private readonly STATS_CACHE_TTL = 5000; // 5 seconds

  constructor() {
    super();
    this.startStatsAggregator();
    this.startActivityGenerator();
  }

  // Drop Events
  public broadcastDropNew(dropId: string, dropName: string, status: string) {
    const event: HomepageDropEvent = {
      type: 'homepage:drop_new',
      data: {
        dropId,
        dropName,
        status,
        timestamp: new Date().toISOString()
      }
    };

    logger.info(`[HomepageEvents] Broadcasting new drop: ${dropName}`);
    this.emit('broadcast', event);
  }

  public broadcastDropStockChanged(dropId: string, dropName: string, stock: number) {
    const event: HomepageDropEvent = {
      type: 'homepage:drop_stock_changed',
      data: {
        dropId,
        dropName,
        status: 'available',
        stock,
        timestamp: new Date().toISOString()
      }
    };

    logger.info(`[HomepageEvents] Broadcasting stock change: ${dropName} - ${stock} left`);
    this.emit('broadcast', event);
  }

  public broadcastDropProgress(dropId: string, dropName: string, progress: number) {
    const event: HomepageDropEvent = {
      type: 'homepage:drop_progress',
      data: {
        dropId,
        dropName,
        status: 'available',
        progress,
        timestamp: new Date().toISOString()
      }
    };

    logger.info(`[HomepageEvents] Broadcasting progress: ${dropName} - ${Math.round(progress * 100)}%`);
    this.emit('broadcast', event);
  }

  // Activity Events
  public broadcastUserActivity(
    userId: string,
    userHandle: string,
    action: 'purchase' | 'interest' | 'invite' | 'achievement',
    resource: string,
    message: string
  ) {
    const event: HomepageActivityEvent = {
      type: 'homepage:activity',
      data: {
        userId,
        userHandle,
        action,
        resource,
        message,
        timestamp: new Date().toISOString()
      }
    };

    logger.info(`[HomepageEvents] Broadcasting activity: ${userHandle} ${action}`);
    this.emit('broadcast', event);
  }

  // Stats Aggregation
  private async startStatsAggregator() {
    setInterval(async () => {
      try {
        const now = Date.now();
        if (now - this.lastStatsUpdate < this.STATS_CACHE_TTL) {
          return; // Use cached data
        }

        const stats = await this.aggregateHomepageStats();
        this.lastStatsUpdate = now;
        this.statsCache.set('homepage_stats', stats);

        const event: HomepageStatsEvent = {
          type: 'homepage:stats_update',
          data: {
            ...stats,
            timestamp: new Date().toISOString()
          }
        };

        this.emit('broadcast', event);
      } catch (error) {
        logger.error('[HomepageEvents] Stats aggregation failed:', error);
      }
    }, 10000); // Update every 10 seconds
  }

  private async aggregateHomepageStats() {
    try {
      // Try to get from cache first
      const cached = this.statsCache.get('homepage_stats');
      if (cached && Date.now() - this.lastStatsUpdate < this.STATS_CACHE_TTL) {
        return cached;
      }

      // Aggregate from database
      const [
        activeDrops,
        activeUsers,
        totalProducts,
        liveOrders,
        revenue
      ] = await Promise.all([
        this.getActiveDropsCount(),
        this.getActiveUsersCount(),
        this.getTotalProductsCount(),
        this.getLiveOrdersCount(),
        this.getRevenueToday()
      ]);

      const stats = {
        activeDrops,
        activeUsers,
        totalProducts,
        liveOrders,
        revenue
      };

      return stats;
    } catch (error) {
      logger.error('[HomepageEvents] Failed to aggregate stats:', error);
      // Return fallback stats
      return {
        activeDrops: 12,
        activeUsers: 523,
        totalProducts: 45,
        liveOrders: 15,
        revenue: 12500
      };
    }
  }

  private async getActiveDropsCount(): Promise<number> {
    try {
      // Simulate database query
      return Math.floor(Math.random() * 20) + 8; // 8-28 active drops
    } catch (error) {
      return 12;
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      // Get active users from database
      const { databaseService } = await import('../../services/database');
      const pool = databaseService.getPool();
      if (pool) {
        const result = await pool.query(`
          SELECT COUNT(DISTINCT telegram_id) as active_count
          FROM bot_users
          WHERE verified_at IS NOT NULL
          AND (updated_at > NOW() - INTERVAL '24 hours'
          OR created_at > NOW() - INTERVAL '24 hours')
        `);
        return parseInt(result.rows[0]?.active_count || '0', 10);
      }
      // Fallback simulation
      return Math.floor(Math.random() * 200) + 450; // 450-650 active users
    } catch (error) {
      return 523;
    }
  }

  private async getTotalProductsCount(): Promise<number> {
    try {
      // Simulate database query
      return Math.floor(Math.random() * 20) + 40; // 40-60 products
    } catch (error) {
      return 45;
    }
  }

  private async getLiveOrdersCount(): Promise<number> {
    try {
      // Get live orders from database
      const { databaseService } = await import('../../services/database');
      const pool = databaseService.getPool();
      if (pool) {
        const result = await pool.query(`
          SELECT COUNT(*) as live_count
          FROM orders
          WHERE status IN ('processing', 'pending', 'paid')
          AND created_at > NOW() - INTERVAL '1 hour'
        `);
        return parseInt(result.rows[0]?.live_count || '0', 10);
      }
      // Fallback simulation
      return Math.floor(Math.random() * 15) + 8; // 8-23 live orders
    } catch (error) {
      return 15;
    }
  }

  private async getRevenueToday(): Promise<number> {
    try {
      // Simulate database query
      return Math.floor(Math.random() * 5000) + 10000; // 10k-15k revenue
    } catch (error) {
      return 12500;
    }
  }

  // Activity Generator for Demo
  private startActivityGenerator() {
    const activities = [
      { action: 'purchase', messages: ['hat einen Drop gekauft 🎯', 'hat 3 Produkte bestellt 🛍️', 'hat VIP freigeschaltet 👑'] },
      { action: 'interest', messages: ['ist interessiert an einem Drop ⭐', 'hat einen Drop geliked ❤️'] },
      { action: 'invite', messages: ['hat 5 Freunde eingeladen 🎉', 'Team Level aufgestiegen ⭐', 'Invite Code aktiviert ✨'] },
      { action: 'achievement', messages: ['Erfolg freigeschaltet! 🏆', 'hat 100 Coins verdient 💰', 'ist jetzt Supernova 🌟'] }
    ];

    const users = ['@neo', '@luna', '@max', '@stella', '@kai', '@nova', '@orbit', '@flux'];

    setInterval(() => {
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const message = activity.messages[Math.floor(Math.random() * activity.messages.length)];

      this.broadcastUserActivity(
        Math.random().toString(36).slice(2),
        user,
        activity.action as any,
        'homepage',
        `${user} ${message}`
      );
    }, Math.random() * 15000 + 5000); // 5-20 seconds
  }

  public getCachedStats() {
    return this.statsCache.get('homepage_stats') || {
      activeDrops: 12,
      vipMembers: 2400,
      totalProducts: 45,
      successRate: '94%',
      revenue: 12500
    };
  }
}

export const liveHomepageEvents = new LiveHomepageEvents();












































