/**
 * Ticket Cache Service
 * 
 * Provides Redis-based caching for frequently accessed tickets
 * to improve performance and reduce database load.
 */

import Redis from 'ioredis';
import { logger } from '../logger';
import { botApiClient } from '../clients/apiClient';

// Ticket cache interface
interface CachedTicket {
  id: string;
  subject: string;
  summary?: string;
  status: 'open' | 'waiting' | 'in_progress' | 'escalated' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  createdAt: string;
  messages?: Array<{
    id: string;
    text: string;
    from: 'user' | 'agent' | 'bot' | 'system';
    timestamp: string;
    attachments?: any[];
  }>;
  telegramUserId?: string;
  userId?: string;
}

// Redis client (reuse existing connection if available)
let redis: Redis | null = null;
let redisEnabled = false;

// Initialize Redis connection
function initRedis(): void {
  if (process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '') {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
      });

      redis.on('connect', () => {
        logger.info('[TicketCache] Redis connected');
        redisEnabled = true;
      });

      redis.on('ready', () => {
        logger.info('[TicketCache] Redis ready');
        redisEnabled = true;
      });

      redis.on('error', (err) => {
        logger.warn('[TicketCache] Redis error, falling back to memory cache', { error: err.message });
        redisEnabled = false;
      });

      redis.on('close', () => {
        logger.warn('[TicketCache] Redis connection closed');
        redisEnabled = false;
      });

      // Connect lazily
      redis.connect().catch(() => {
        logger.warn('[TicketCache] Failed to connect to Redis, using memory cache');
        redisEnabled = false;
      });
    } catch (error) {
      logger.warn('[TicketCache] Redis initialization failed, using memory cache', { error });
      redisEnabled = false;
    }
  } else {
    logger.info('[TicketCache] Redis URL not configured, using memory cache');
  }
}

// Memory fallback cache
const memoryCache = new Map<string, { data: any; expiresAt: number }>();

// Cache configuration
const CACHE_TTL = {
  TICKET_DETAIL: 60, // 1 minute for ticket details
  TICKET_LIST: 30, // 30 seconds for ticket lists
  USER_TICKETS: 30 // 30 seconds for user tickets
};

/**
 * Get cache key for ticket
 */
function getTicketKey(ticketId: string): string {
  return `ticket:detail:${ticketId}`;
}

/**
 * Get cache key for user tickets
 */
function getUserTicketsKey(telegramUserId: string): string {
  return `ticket:user:${telegramUserId}`;
}

/**
 * Get cached value
 */
async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (redisEnabled && redis) {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } else {
      // Memory fallback
      const entry = memoryCache.get(key);
      if (entry && entry.expiresAt > Date.now()) {
        return entry.data as T;
      } else if (entry) {
        memoryCache.delete(key);
      }
    }
  } catch (error) {
    logger.warn('[TicketCache] Error reading cache', { error, key });
  }
  return null;
}

/**
 * Set cached value
 */
async function setCached(key: string, value: any, ttlSeconds: number): Promise<void> {
  try {
    if (redisEnabled && redis) {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } else {
      // Memory fallback
      memoryCache.set(key, {
        data: value,
        expiresAt: Date.now() + ttlSeconds * 1000
      });
    }
  } catch (error) {
    logger.warn('[TicketCache] Error writing cache', { error, key });
  }
}

/**
 * Invalidate cache for a key
 */
async function invalidateCache(key: string): Promise<void> {
  try {
    if (redisEnabled && redis) {
      await redis.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    logger.warn('[TicketCache] Error invalidating cache', { error, key });
  }
}

/**
 * Invalidate cache pattern (for Redis)
 */
async function invalidatePattern(pattern: string): Promise<void> {
  try {
    if (redisEnabled && redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      // Memory fallback: simple pattern matching
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          memoryCache.delete(key);
        }
      }
    }
  } catch (error) {
    logger.warn('[TicketCache] Error invalidating pattern', { error, pattern });
  }
}

/**
 * Get ticket with caching
 */
export async function getCachedTicket(ticketId: string): Promise<CachedTicket | null> {
  const cacheKey = getTicketKey(ticketId);
  
  // Try cache first
  const cached = await getCached<CachedTicket>(cacheKey);
  if (cached) {
    logger.debug('[TicketCache] Cache hit for ticket', { ticketId });
    return cached;
  }

  // Cache miss - fetch from API
  logger.debug('[TicketCache] Cache miss for ticket, fetching from API', { ticketId });
  const ticket = await botApiClient.getTicket(ticketId);
  
  if (ticket) {
    // Cache the result
    await setCached(cacheKey, ticket as CachedTicket, CACHE_TTL.TICKET_DETAIL);
    return ticket as CachedTicket;
  }

  return null;
}

/**
 * Get user tickets with caching
 */
export async function getCachedUserTickets(telegramUserId: string): Promise<CachedTicket[]> {
  const cacheKey = getUserTicketsKey(telegramUserId);
  
  // Try cache first
  const cached = await getCached<CachedTicket[]>(cacheKey);
  if (cached) {
    logger.debug('[TicketCache] Cache hit for user tickets', { telegramUserId });
    return cached;
  }

  // Cache miss - fetch from API
  logger.debug('[TicketCache] Cache miss for user tickets, fetching from API', { telegramUserId });
  const tickets = await botApiClient.getUserTickets(telegramUserId);
  
  // Cache the result
  await setCached(cacheKey, tickets as CachedTicket[], CACHE_TTL.USER_TICKETS);

  return tickets as CachedTicket[];
}

/**
 * Invalidate ticket cache
 */
export async function invalidateTicketCache(ticketId: string): Promise<void> {
  await invalidateCache(getTicketKey(ticketId));
}

/**
 * Invalidate user tickets cache
 */
export async function invalidateUserTicketsCache(telegramUserId: string): Promise<void> {
  await invalidateCache(getUserTicketsKey(telegramUserId));
}

/**
 * Batch invalidate multiple ticket caches
 */
export async function invalidateTicketCaches(ticketIds: string[]): Promise<void> {
  if (ticketIds.length === 0) return;
  
  try {
    if (redisEnabled && redis) {
      const keys = ticketIds.map(id => getTicketKey(id));
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      // Memory fallback
      ticketIds.forEach(id => {
        memoryCache.delete(getTicketKey(id));
      });
    }
  } catch (error) {
    logger.warn('[TicketCache] Error batch invalidating tickets', { error, count: ticketIds.length });
  }
}

/**
 * Batch invalidate multiple user ticket caches
 */
export async function invalidateUserTicketsCaches(telegramUserIds: string[]): Promise<void> {
  if (telegramUserIds.length === 0) return;
  
  try {
    if (redisEnabled && redis) {
      const keys = telegramUserIds.map(id => getUserTicketsKey(id));
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      // Memory fallback
      telegramUserIds.forEach(id => {
        memoryCache.delete(getUserTicketsKey(id));
      });
    }
  } catch (error) {
    logger.warn('[TicketCache] Error batch invalidating user tickets', { error, count: telegramUserIds.length });
  }
}

/**
 * Invalidate all ticket-related caches (optimized batch)
 */
export async function invalidateAllTicketCaches(): Promise<void> {
  await invalidatePattern('ticket:*');
}

/**
 * Get multiple tickets with caching (batch operation)
 */
export async function getCachedTickets(ticketIds: string[]): Promise<Map<string, CachedTicket>> {
  const results = new Map<string, CachedTicket>();
  const uncachedIds: string[] = [];

    // Try to get all from cache first
  for (const ticketId of ticketIds) {
    const cacheKey = getTicketKey(ticketId);
    const cached = await getCached<CachedTicket>(cacheKey);
    if (cached) {
      results.set(ticketId, cached);
    } else {
      uncachedIds.push(ticketId);
    }
  }

  // Fetch uncached tickets in parallel
  if (uncachedIds.length > 0) {
    const fetchPromises = uncachedIds.map(async (ticketId) => {
      const ticket = await botApiClient.getTicket(ticketId);
      if (ticket) {
        const cacheKey = getTicketKey(ticketId);
        await setCached(cacheKey, ticket as CachedTicket, CACHE_TTL.TICKET_DETAIL);
        results.set(ticketId, ticket as CachedTicket);
      }
    });

    await Promise.allSettled(fetchPromises);
  }

  return results;
}

/**
 * Cleanup expired memory cache entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}, 60 * 1000); // Cleanup every minute

// Initialize Redis on module load
initRedis();

// Export Redis client for advanced usage
export { redis, redisEnabled };

