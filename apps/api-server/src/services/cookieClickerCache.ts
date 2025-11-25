import { cacheService } from './cache';
import { logger } from '../utils/logger';

// 🚀 Query-Caching für Cookie Clicker Leaderboard-Queries
class CookieClickerCache {
  private readonly CACHE_TTL = 30; // 30 Sekunden für Leaderboard
  private readonly STATS_CACHE_TTL = 60; // 60 Sekunden für Stats

  // 🎯 Leaderboard Cache Key
  private getLeaderboardKey(type: string, limit: number): string {
    return `cookie:leaderboard:${type}:${limit}`;
  }

  // 🎯 Stats Cache Key
  private getStatsKey(userId: string): string {
    return `cookie:stats:${userId}`;
  }

  // 🎯 Admin Stats Cache Key
  private getAdminStatsKey(): string {
    return 'cookie:admin:stats';
  }

  // 🚀 Get Leaderboard mit Cache
  async getLeaderboard<T>(
    type: string,
    limit: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = this.getLeaderboardKey(type, limit);
    
    try {
      // Try cache first
      const cached = await cacheService.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Fetch from database
      const data = await fetchFn();
      
      // Cache result
      await cacheService.set(cacheKey, data, this.CACHE_TTL);
      
      return data;
    } catch (error) {
      logger.warn('Cookie Clicker cache error:', error);
      // Fallback to direct fetch
      return fetchFn();
    }
  }

  // 🚀 Get Stats mit Cache
  async getStats<T>(
    userId: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = this.getStatsKey(userId);
    
    try {
      const cached = await cacheService.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const data = await fetchFn();
      await cacheService.set(cacheKey, data, this.STATS_CACHE_TTL);
      
      return data;
    } catch (error) {
      logger.warn('Cookie Clicker stats cache error:', error);
      return fetchFn();
    }
  }

  // 🚀 Get Admin Stats mit Cache
  async getAdminStats<T>(fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = this.getAdminStatsKey();
    
    try {
      const cached = await cacheService.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const data = await fetchFn();
      await cacheService.set(cacheKey, data, this.CACHE_TTL);
      
      return data;
    } catch (error) {
      logger.warn('Cookie Clicker admin stats cache error:', error);
      return fetchFn();
    }
  }

  // 🧹 Invalidate Cache nach Updates
  async invalidateLeaderboard(type?: string): Promise<void> {
    try {
      if (type) {
        // Invalidate specific type
        const pattern = `cookie:leaderboard:${type}:*`;
        await cacheService.deletePattern(pattern);
      } else {
        // Invalidate all leaderboards
        await cacheService.deletePattern('cookie:leaderboard:*');
      }
    } catch (error) {
      logger.warn('Failed to invalidate leaderboard cache:', error);
    }
  }

  async invalidateStats(userId: string): Promise<void> {
    try {
      const cacheKey = this.getStatsKey(userId);
      await cacheService.delete(cacheKey);
    } catch (error) {
      logger.warn('Failed to invalidate stats cache:', error);
    }
  }

  async invalidateAdminStats(): Promise<void> {
    try {
      const cacheKey = this.getAdminStatsKey();
      await cacheService.delete(cacheKey);
    } catch (error) {
      logger.warn('Failed to invalidate admin stats cache:', error);
    }
  }

  // 🧹 Invalidate all Cookie Clicker caches
  async invalidateAll(): Promise<void> {
    try {
      await cacheService.deletePattern('cookie:*');
    } catch (error) {
      logger.warn('Failed to invalidate all cookie caches:', error);
    }
  }
}

export const cookieClickerCache = new CookieClickerCache();

