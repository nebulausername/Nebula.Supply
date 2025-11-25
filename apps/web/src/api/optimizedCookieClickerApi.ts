import { saveStats, type CookieStats } from './cookieClicker';

// 🚀 Optimierte API-Client für Cookie Clicker mit Batching, Optimistic Updates, etc.

interface PendingUpdate {
  stats: CookieStats;
  resolve: () => void;
  reject: (error: Error) => void;
  timestamp: number;
}

class OptimizedCookieClickerApi {
  private pendingUpdates: PendingUpdate[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 2000; // 2 Sekunden
  private readonly MAX_BATCH_SIZE = 10;
  
  private requestQueue: Map<string, Promise<any>> = new Map();
  private retryDelays: Map<string, number> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 Sekunde

  // 🎯 Request Deduplication - Verhindere doppelte Requests
  private deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  // 🎯 Exponential Backoff für fehlgeschlagene Requests
  private async retryWithBackoff<T>(
    key: string,
    requestFn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      const result = await requestFn();
      // Success - reset retry delay
      this.retryDelays.delete(key);
      return result;
    } catch (error) {
      if (retryCount >= this.MAX_RETRIES) {
        this.retryDelays.delete(key);
        throw error;
      }

      // Calculate exponential backoff delay
      const currentDelay = this.retryDelays.get(key) || this.INITIAL_RETRY_DELAY;
      const nextDelay = currentDelay * Math.pow(2, retryCount);
      this.retryDelays.set(key, nextDelay);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, nextDelay));

      return this.retryWithBackoff(key, requestFn, retryCount + 1);
    }
  }

  // 🎯 Request Batching - Sammle mehrere Updates
  private scheduleBatch() {
    if (this.batchTimeout) {
      return; // Already scheduled
    }

    this.batchTimeout = setTimeout(() => {
      this.flushBatch();
    }, this.BATCH_DELAY);
  }

  // 🎯 Flush batched updates
  private async flushBatch() {
    if (this.pendingUpdates.length === 0) {
      this.batchTimeout = null;
      return;
    }

    const updates = this.pendingUpdates.splice(0, this.MAX_BATCH_SIZE);
    this.batchTimeout = null;

    // 🎯 Merge updates - neueste Stats haben Priorität
    const mergedStats = updates.reduce((acc, update) => {
      return {
        totalCookies: Math.max(acc.totalCookies, update.stats.totalCookies),
        cookiesPerSecond: Math.max(acc.cookiesPerSecond, update.stats.cookiesPerSecond),
        timePlayed: Math.max(acc.timePlayed, update.stats.timePlayed),
        avatarUrl: update.stats.avatarUrl || acc.avatarUrl
      };
    }, {
      totalCookies: 0,
      cookiesPerSecond: 0,
      timePlayed: 0,
      avatarUrl: null
    } as CookieStats);

    // 🚀 Send batched request with retry
    const requestKey = `batch-save-${Date.now()}`;
    try {
      await this.retryWithBackoff(requestKey, () => saveStats(mergedStats));
      
      // Success - resolve all pending updates
      updates.forEach(update => update.resolve());
    } catch (error) {
      // Failure - reject all pending updates
      updates.forEach(update => update.reject(error as Error));
    }
  }

  // 🎯 Optimistic Update - UI sofort aktualisieren, Server-Sync im Hintergrund
  saveStatsOptimistic(stats: CookieStats): Promise<void> {
    return new Promise((resolve, reject) => {
      // 🚀 Optimistic: Resolve sofort (UI wird sofort aktualisiert)
      resolve();

      // 🎯 Queue für Batch-Update
      this.pendingUpdates.push({
        stats,
        resolve: () => {
          // Silent success - already resolved optimistically
        },
        reject: (error) => {
          // Log error but don't interrupt gameplay
          if (import.meta.env.DEV) {
            console.warn('Failed to sync stats to server:', error);
          }
        },
        timestamp: Date.now()
      });

      // 🎯 Schedule batch if not already scheduled
      this.scheduleBatch();
    });
  }

  // 🎯 Immediate save (for critical updates)
  async saveStatsImmediate(stats: CookieStats): Promise<void> {
    const requestKey = `immediate-save-${Date.now()}`;
    return this.deduplicateRequest(requestKey, () =>
      this.retryWithBackoff(requestKey, () => saveStats(stats))
    );
  }

  // 🎯 Flush all pending updates (call before page unload)
  async flushAll(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    await this.flushBatch();
  }
}

// 🎯 Singleton Instance
export const optimizedCookieClickerApi = new OptimizedCookieClickerApi();

// 🎯 Auto-flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    optimizedCookieClickerApi.flushAll().catch(() => {
      // Ignore errors on page unload
    });
  });

  // Also flush on visibility change (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      optimizedCookieClickerApi.flushAll().catch(() => {
        // Ignore errors
      });
    }
  });
}

