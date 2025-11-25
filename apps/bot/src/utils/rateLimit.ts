/**
 * Rate Limiting System for NEBULA Bot
 * Prevents spam and abuse with intelligent rate limiting
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface UserRequest {
  timestamp: number;
  count: number;
}

class RateLimitManager {
  private userRequests: Map<string, UserRequest[]> = new Map();
  private config: RateLimitConfig;

  constructor() {
    this.config = {
      windowMs: 60000, // 1 minute
      maxRequests: 20   // 20 requests per minute
    };
  }

  init(windowMs: number, maxRequests: number) {
    this.config = { windowMs, maxRequests };
    console.log(`[RateLimit] Initialized: ${maxRequests} requests per ${windowMs}ms`);
  }

  isAllowed(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.userRequests.get(userId) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      req => now - req.timestamp < this.config.windowMs
    );

    // Check if user has exceeded the limit
    if (validRequests.length >= this.config.maxRequests) {
      console.log(`[RateLimit] User ${userId} rate limited (${validRequests.length}/${this.config.maxRequests})`);
      return false;
    }

    // Add new request
    validRequests.push({ timestamp: now, count: 1 });
    this.userRequests.set(userId, validRequests);

    return true;
  }

  getRemainingRequests(userId: string): number {
    const now = Date.now();
    const userRequests = this.userRequests.get(userId) || [];
    const validRequests = userRequests.filter(
      req => now - req.timestamp < this.config.windowMs
    );

    return Math.max(0, this.config.maxRequests - validRequests.length);
  }

  getResetTime(userId: string): number {
    const userRequests = this.userRequests.get(userId) || [];
    if (userRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...userRequests.map(req => req.timestamp));
    return oldestRequest + this.config.windowMs;
  }

  // Cleanup old data periodically
  cleanup() {
    const now = Date.now();
    for (const [userId, requests] of this.userRequests.entries()) {
      const validRequests = requests.filter(
        req => now - req.timestamp < this.config.windowMs
      );
      
      if (validRequests.length === 0) {
        this.userRequests.delete(userId);
      } else {
        this.userRequests.set(userId, validRequests);
      }
    }
  }
}

// Singleton instance
export const rateLimitManager = new RateLimitManager();

export const initRateLimiter = (windowMs: number, maxRequests: number) => {
  rateLimitManager.init(windowMs, maxRequests);
  
  // Cleanup every 5 minutes
  setInterval(() => {
    rateLimitManager.cleanup();
  }, 5 * 60 * 1000);
};

export const rateLimitMiddleware = async (ctx: any, next: () => Promise<void>) => {
  const userId = ctx.from?.id?.toString();
  if (!userId) return next();

  if (!rateLimitManager.isAllowed(userId)) {
    const resetTime = rateLimitManager.getResetTime(userId);
    const waitTime = Math.ceil((resetTime - Date.now()) / 1000);
    
    await ctx.reply(
      `⏰ Rate limit erreicht! Bitte warte ${waitTime} Sekunden vor der nächsten Anfrage.`
    );
    return;
  }

  return next();
};