/**
 * Rate Limiting Middleware for Telegram Bot
 * 
 * Protects against spam and abuse by limiting the number of requests
 * a user can make within a specific time window.
 */

import type { MiddlewareFn } from 'telegraf';
import type { NebulaContext } from '../types';
import { logger } from '../logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (ctx: NebulaContext) => string; // Custom key generator
  onLimitReached?: (ctx: NebulaContext) => Promise<void>; // Callback when limit is reached
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Create a rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig): MiddlewareFn<NebulaContext> {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (ctx) => {
      // Default: use user ID + command/action
      const userId = ctx.from?.id?.toString() || 'unknown';
      const command = (ctx.message as any)?.text?.split(' ')[0] || 
                     (ctx.callbackQuery as any)?.data || 
                     'default';
      return `${userId}:${command}`;
    },
    onLimitReached = async (ctx) => {
      await ctx.reply(
        `⏱️ *Rate Limit erreicht*\n\n` +
        `Du hast zu viele Anfragen gesendet. Bitte warte einen Moment und versuche es erneut.\n\n` +
        `🕐 Bitte warte ${Math.ceil(config.windowMs / 1000)} Sekunden.`,
        { parse_mode: 'Markdown' }
      );
    }
  } = config;

  return async (ctx, next) => {
    const key = keyGenerator(ctx);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, entry);
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      logger.warn('[RateLimiter] Rate limit exceeded', {
        key,
        count: entry.count,
        maxRequests,
        userId: ctx.from?.id
      });

      await onLimitReached(ctx);
      return; // Don't call next()
    }

    // Update store
    rateLimitStore.set(key, entry);

    // Continue to next middleware
    return next();
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
  /**
   * Rate limiter for ticket creation (5 tickets per hour)
   */
  ticketCreation: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyGenerator: (ctx) => `ticket:create:${ctx.from?.id || 'unknown'}`,
    onLimitReached: async (ctx) => {
      await ctx.reply(
        `⏱️ *Zu viele Tickets erstellt*\n\n` +
        `Du kannst maximal 5 Tickets pro Stunde erstellen.\n\n` +
        `Bitte warte eine Stunde oder kontaktiere den Support für dringende Anliegen.`,
        { parse_mode: 'Markdown' }
      );
    }
  }),

  /**
   * Rate limiter for ticket messages (20 messages per 10 minutes)
   */
  ticketMessages: createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 20,
    keyGenerator: (ctx) => `ticket:message:${ctx.from?.id || 'unknown'}`,
    onLimitReached: async (ctx) => {
      await ctx.reply(
        `⏱️ *Zu viele Nachrichten*\n\n` +
        `Du kannst maximal 20 Nachrichten pro 10 Minuten senden.\n\n` +
        `Bitte warte einen Moment und versuche es erneut.`,
        { parse_mode: 'Markdown' }
      );
    }
  }),

  /**
   * Rate limiter for general commands (30 commands per minute)
   */
  generalCommands: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    keyGenerator: (ctx) => `command:${ctx.from?.id || 'unknown'}`,
    onLimitReached: async (ctx) => {
      await ctx.reply(
        `⏱️ *Zu viele Anfragen*\n\n` +
        `Bitte warte einen Moment und versuche es erneut.`,
        { parse_mode: 'Markdown' }
      );
    }
  }),

  /**
   * Rate limiter for VIP reply command (50 replies per hour for VIPs)
   */
  vipReply: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    keyGenerator: (ctx) => `vip:reply:${ctx.from?.id || 'unknown'}`,
    onLimitReached: async (ctx) => {
      await ctx.reply(
        `⏱️ *Rate Limit erreicht*\n\n` +
        `Du hast zu viele VIP-Replies gesendet. Bitte warte eine Stunde.`,
        { parse_mode: 'Markdown' }
      );
    }
  })
};

/**
 * Get rate limit status for a user
 */
export function getRateLimitStatus(key: string): {
  remaining: number;
  resetTime: number;
  isLimited: boolean;
} {
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetTime < Date.now()) {
    return {
      remaining: 0,
      resetTime: Date.now(),
      isLimited: false
    };
  }

  // This would need to know the maxRequests, so we return a generic status
  return {
    remaining: 0, // Would need config to calculate
    resetTime: entry.resetTime,
    isLimited: entry.count > 0
  };
}

/**
 * Clear rate limit for a specific key (useful for testing or admin actions)
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (use with caution)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Check rate limit without using middleware pattern
 * Returns true if rate limit is OK, false if exceeded
 */
export async function checkRateLimit(
  ctx: NebulaContext,
  config: {
    windowMs: number;
    maxRequests: number;
    key: string;
    onLimitReached?: (ctx: NebulaContext) => Promise<void>;
  }
): Promise<boolean> {
  const { windowMs, maxRequests, key, onLimitReached } = config;
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetTime: now + windowMs
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    logger.warn('[RateLimiter] Rate limit exceeded', {
      key,
      count: entry.count,
      maxRequests,
      userId: ctx.from?.id
    });

    if (onLimitReached) {
      await onLimitReached(ctx);
    }
    
    // Update store before returning
    rateLimitStore.set(key, entry);
    return false; // Rate limit exceeded
  }

  // Update store
  rateLimitStore.set(key, entry);
  return true; // Rate limit OK
}

