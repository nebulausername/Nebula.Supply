
import type { MiddlewareFn } from "telegraf";
import type { NebulaContext, SessionState } from "../types";
import Redis from "ioredis";

// In-memory session store as fallback
const memoryStore = new Map<string, string>();

// Initialize Redis only if URL is provided, otherwise use memory store
let redis: Redis | null = null;
let redisConnectionAttempts = 0;
let redisDisabled = false; // Flag to prevent further Redis usage
let healthCheckTimer: NodeJS.Timeout | null = null;
let lastHealthCheck = 0;
const MAX_REDIS_RETRIES = 10; // Increased for better resilience
const HEALTH_CHECK_INTERVAL = 60000; // 60 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds max

// Session statistics
interface SessionStats {
  totalSessions: number;
  redisSessions: number;
  memorySessions: number;
  errors: number;
  lastHealthCheck: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error';
}

const sessionStats: SessionStats = {
  totalSessions: 0,
  redisSessions: 0,
  memorySessions: 0,
  errors: 0,
  lastHealthCheck: 0,
  connectionStatus: 'disconnected',
};

const retryStrategy = (times: number): number | null => {
  if (times > MAX_REDIS_RETRIES || redisDisabled) {
    return null; // Stop retrying
  }
  // Exponential backoff: 100ms, 200ms, 400ms, ..., max 30s
  const delay = Math.min(times * 100, MAX_RETRY_DELAY);
  return delay;
};

const performHealthCheck = async (): Promise<void> => {
  if (!redis || redisDisabled) {
    sessionStats.connectionStatus = 'disconnected';
    return;
  }

  try {
    const startTime = Date.now();
    await redis.ping();
    const latency = Date.now() - startTime;
    lastHealthCheck = Date.now();
    sessionStats.lastHealthCheck = Date.now();
    sessionStats.connectionStatus = 'connected';
    
    if (latency > 1000) {
      console.warn(`[BOT] Redis health check latency high: ${latency}ms`);
    }
  } catch (error) {
    console.warn('[BOT] Redis health check failed:', error);
    sessionStats.connectionStatus = 'error';
    redisDisabled = true;
  }
};

const startHealthChecks = (): void => {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
  }

  healthCheckTimer = setInterval(() => {
    performHealthCheck();
  }, HEALTH_CHECK_INTERVAL);

  // Perform initial health check
  setTimeout(() => performHealthCheck(), 5000);
};

if (process.env.REDIS_URL && process.env.REDIS_URL.trim() !== '') {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      retryStrategy,
      enableOfflineQueue: false, // Don't queue commands when offline
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
      reconnectOnError: (err) => {
        // Only reconnect on specific errors
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some(target => err.message.includes(target));
      },
      enableReadyCheck: true,
      showFriendlyErrorStack: false,
    });

    redis.on('connect', () => {
      console.log('[BOT] ✅ Redis session store connected');
      redisConnectionAttempts = 0;
      redisDisabled = false;
      sessionStats.connectionStatus = 'connected';
      startHealthChecks();
    });

    redis.on('ready', () => {
      console.log('[BOT] ✅ Redis session store ready');
      redisConnectionAttempts = 0;
      redisDisabled = false;
      sessionStats.connectionStatus = 'connected';
    });

    redis.on('error', (err) => {
      redisConnectionAttempts++;
      sessionStats.errors++;
      
      // Only log every 5th error to reduce spam
      if (redisConnectionAttempts % 5 === 0 || redisConnectionAttempts <= 3) {
        console.warn(`[BOT] Redis connection error (attempt ${redisConnectionAttempts}/${MAX_REDIS_RETRIES}):`, err.message);
      }
      
      if (redisConnectionAttempts >= MAX_REDIS_RETRIES && !redisDisabled) {
        console.warn('[BOT] ⚠️ Max Redis retry attempts reached, switching to memory store');
        sessionStats.connectionStatus = 'error';
        redisDisabled = true;
      } else {
        sessionStats.connectionStatus = 'reconnecting';
      }
    });

    redis.on('close', () => {
      if (!redisDisabled) {
        console.warn('[BOT] Redis connection closed, using memory store');
        sessionStats.connectionStatus = 'disconnected';
      }
    });

    redis.on('end', () => {
      if (!redisDisabled) {
        console.log('[BOT] Redis connection ended, switching to memory store');
        sessionStats.connectionStatus = 'disconnected';
      }
    });

    redis.on('reconnecting', (delay: number) => {
      console.log(`[BOT] Redis reconnecting in ${delay}ms...`);
      sessionStats.connectionStatus = 'reconnecting';
    });

  } catch (err) {
    console.warn('[BOT] Failed to initialize Redis, using memory store:', err);
    redisDisabled = true;
    sessionStats.connectionStatus = 'error';
    redis = null;
  }
} else {
  console.log('[BOT] ℹ️ No REDIS_URL provided, using memory store for sessions');
  redisDisabled = true;
  sessionStats.connectionStatus = 'disconnected';
}

// Export session stats for monitoring
export const getSessionStats = (): SessionStats => ({
  ...sessionStats,
  totalSessions: memoryStore.size,
});

const defaultSession = (): SessionState => ({
  onboardingStatus: "unknown"
});

const getKey = (ctx: NebulaContext): string | undefined => {
  if (ctx.from?.id) return `user:${ctx.from.id}`;
  if (ctx.chat?.id) return `chat:${ctx.chat.id}`;
  return undefined;
};

// Memory store cleanup to prevent memory leaks
const MAX_MEMORY_SESSIONS = 10000;
const cleanupMemoryStore = () => {
  if (memoryStore.size > MAX_MEMORY_SESSIONS) {
    const toDelete = memoryStore.size - MAX_MEMORY_SESSIONS;
    const keys = Array.from(memoryStore.keys());
    for (let i = 0; i < toDelete; i++) {
      memoryStore.delete(keys[i]);
    }
    console.log(`[BOT] 🧹 Cleaned up ${toDelete} old sessions from memory store`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupMemoryStore, 5 * 60 * 1000);

export const sessionMiddleware: MiddlewareFn<NebulaContext> = async (ctx, next) => {
  const key = getKey(ctx);
  if (!key) {
    return next();
  }

  let session: SessionState | undefined;
  let usedRedis = false;
  
  try {
    let raw: string | null = null;
    // Only use Redis if it's available and not disabled
    if (redis && !redisDisabled) {
      try {
        // Quick health check before using Redis
        if (sessionStats.connectionStatus === 'connected' || lastHealthCheck > Date.now() - HEALTH_CHECK_INTERVAL) {
          raw = await redis.get(key);
          usedRedis = true;
          sessionStats.redisSessions++;
        } else {
          // Health check might be stale, try Redis but be ready to fallback
          try {
            raw = await Promise.race([
              redis.get(key),
              new Promise<string | null>((_, reject) => 
                setTimeout(() => reject(new Error('Redis timeout')), 1000)
              )
            ]) as string | null;
            usedRedis = true;
            sessionStats.redisSessions++;
          } catch {
            raw = memoryStore.get(key) || null;
            sessionStats.memorySessions++;
          }
        }
      } catch (redisErr) {
        // Fallback to memory store on Redis error
        if (redisConnectionAttempts < MAX_REDIS_RETRIES) {
          console.warn('[BOT] Redis get error, using memory store:', (redisErr as Error).message);
        }
        raw = memoryStore.get(key) || null;
        sessionStats.memorySessions++;
        sessionStats.errors++;
      }
    } else {
      raw = memoryStore.get(key) || null;
      sessionStats.memorySessions++;
    }
    
    session = raw ? JSON.parse(raw) : defaultSession();
    sessionStats.totalSessions++;
  } catch (err) {
    sessionStats.errors++;
    session = defaultSession();
  }
  
  ctx.session = { ...session!, onboardingStatus: session!.onboardingStatus ?? "unknown" };

  try {
    await next();
  } finally {
    try {
      // Only use Redis if it's available and not disabled
      if (redis && !redisDisabled && usedRedis) {
        try {
          await Promise.race([
            redis.set(key, JSON.stringify(ctx.session), 'EX', 86400), // 24h TTL
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Redis timeout')), 1000)
            )
          ]);
        } catch (redisErr) {
          // Fallback to memory store on Redis error
          if (redisConnectionAttempts < MAX_REDIS_RETRIES) {
            console.warn('[BOT] Redis set error, using memory store:', (redisErr as Error).message);
          }
          memoryStore.set(key, JSON.stringify(ctx.session));
          sessionStats.errors++;
        }
      } else {
        memoryStore.set(key, JSON.stringify(ctx.session));
      }
    } catch (err) {
      sessionStats.errors++;
      console.warn('[BOT] Failed to save session:', err);
    }
  }
};

export const resetSession = async (ctx: NebulaContext) => {
  const key = getKey(ctx);
  if (!key) return;
  try {
    // Only use Redis if it's available and not disabled
    if (redis && !redisDisabled && sessionStats.connectionStatus === 'connected') {
      try {
        await Promise.race([
          redis.set(key, JSON.stringify(defaultSession()), 'EX', 86400),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis timeout')), 1000)
          )
        ]);
      } catch (redisErr) {
        console.warn('[BOT] Redis reset error, using memory store:', (redisErr as Error).message);
        memoryStore.set(key, JSON.stringify(defaultSession()));
        sessionStats.errors++;
      }
    } else {
      memoryStore.set(key, JSON.stringify(defaultSession()));
    }
    ctx.session = defaultSession();
  } catch (err) {
    sessionStats.errors++;
    console.warn('[BOT] Failed to reset session:', err);
  }
};
