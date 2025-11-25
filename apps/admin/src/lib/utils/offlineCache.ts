// Offline Cache Management for API responses
// Provides fallback data when network is unavailable

const CACHE_PREFIX = 'nebula_api_cache_';
const CACHE_VERSION = '1.0';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  url: string;
}

export class OfflineCache {
  private static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static getCacheKey(url: string, params?: Record<string, unknown>): string {
    const key = params ? `${url}_${JSON.stringify(params)}` : url;
    return `${CACHE_PREFIX}${btoa(key).replace(/[+/=]/g, '')}`;
  }

  static set<T>(url: string, data: T, params?: Record<string, unknown>): void {
    if (!this.isStorageAvailable()) return;

    try {
      const key = this.getCacheKey(url, params);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        url,
      };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      // Silently fail - cache errors shouldn't break the app
      // Could log to error tracking service in production
    }
  }

  static get<T>(url: string, params?: Record<string, unknown>): T | null {
    if (!this.isStorageAvailable() || !url) return null;

    try {
      const key = this.getCacheKey(url, params);
      const item = localStorage.getItem(key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Validate entry structure
      if (!entry || typeof entry !== 'object' || !entry.data) {
        this.remove(url, params);
        return null;
      }
      
      // Check version
      if (entry.version !== CACHE_VERSION) {
        this.remove(url, params);
        return null;
      }

      // Check age
      const age = Date.now() - (entry.timestamp || 0);
      if (age > MAX_CACHE_AGE || age < 0) {
        this.remove(url, params);
        return null;
      }

      return entry.data;
    } catch (error) {
      // Silently fail - cache errors shouldn't break the app
      return null;
    }
  }

  static remove(url: string, params?: Record<string, unknown>): void {
    if (!this.isStorageAvailable()) return;

    try {
      const key = this.getCacheKey(url, params);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove cached data:', error);
    }
  }

  static clear(pattern?: string): void {
    if (!this.isStorageAvailable()) return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          if (!pattern || key.includes(pattern)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Smart invalidation - invalidate related caches
  static invalidateRelated(url: string): void {
    if (!this.isStorageAvailable()) return;

    try {
      const keys = Object.keys(localStorage);
      const urlPattern = url.split('?')[0]; // Base URL without query params
      
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const entry: CacheEntry<unknown> = JSON.parse(item);
              // Invalidate if URL matches or is related (e.g., parent endpoint)
              if (entry.url && (
                entry.url.includes(urlPattern) || 
                urlPattern.includes(entry.url.split('?')[0])
              )) {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to invalidate related cache:', error);
    }
  }

  // Batch operations for better performance
  static setBatch<T>(entries: Array<{ url: string; data: T; params?: Record<string, unknown> }>): void {
    if (!this.isStorageAvailable()) return;

    try {
      entries.forEach(({ url, data, params }) => {
        this.set(url, data, params);
      });
    } catch (error) {
      console.warn('Failed to set batch cache:', error);
    }
  }

  static getBatch<T>(entries: Array<{ url: string; params?: Record<string, unknown> }>): Array<{ url: string; data: T | null }> {
    if (!this.isStorageAvailable()) return entries.map(e => ({ url: e.url, data: null }));

    try {
      return entries.map(({ url, params }) => ({
        url,
        data: this.get<T>(url, params),
      }));
    } catch (error) {
      console.warn('Failed to get batch cache:', error);
      return entries.map(e => ({ url: e.url, data: null }));
    }
  }

  static getAllKeys(): string[] {
    if (!this.isStorageAvailable()) return [];

    try {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.startsWith(CACHE_PREFIX));
    } catch {
      return [];
    }
  }

  static getCacheSize(): number {
    if (!this.isStorageAvailable()) return 0;

    try {
      const keys = this.getAllKeys();
      let totalSize = 0;
      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      });
      return totalSize;
    } catch {
      return 0;
    }
  }
}

// Network status monitoring
export class NetworkMonitor {
  private static listeners: Set<(online: boolean) => void> = new Set();
  private static isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  static init(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });
  }

  static subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners(online: boolean): void {
    this.listeners.forEach(callback => callback(online));
  }

  static getStatus(): boolean {
    return this.isOnline;
  }
}

// Initialize network monitor
if (typeof window !== 'undefined') {
  NetworkMonitor.init();
}

// Advanced Caching Strategy with Stale-While-Revalidate Pattern
interface CacheConfig {
  staleTime?: number; // Time before data is considered stale
  cacheTime?: number; // Time before cache is cleared
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}

export class AdvancedCache {
  private static configs: Map<string, CacheConfig> = new Map();
  private static revalidationQueue: Set<string> = new Set();
  private static backgroundSyncEnabled = true;

  /**
   * Configure cache behavior for a specific URL pattern
   */
  static configure(urlPattern: string, config: CacheConfig): void {
    this.configs.set(urlPattern, {
      staleTime: 5 * 60 * 1000, // 5 minutes default
      cacheTime: 30 * 60 * 1000, // 30 minutes default
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      ...config,
    });
  }

  /**
   * Get cache config for URL
   */
  private static getConfig(url: string): CacheConfig {
    for (const [pattern, config] of this.configs.entries()) {
      if (url.includes(pattern)) {
        return config;
      }
    }
    return {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    };
  }

  /**
   * Stale-While-Revalidate: Return stale data immediately, revalidate in background
   */
  static async getWithRevalidate<T>(
    url: string,
    fetchFn: () => Promise<T>,
    params?: Record<string, unknown>
  ): Promise<T> {
    const cached = OfflineCache.get<T>(url, params);
    const config = this.getConfig(url);

    if (cached) {
      const entry = this.getCacheEntry(url, params);
      if (entry) {
        const age = Date.now() - entry.timestamp;
        const isStale = age > (config.staleTime || 0);

        // Return stale data immediately
        if (isStale && this.backgroundSyncEnabled) {
          // Revalidate in background
          this.revalidateInBackground(url, fetchFn, params);
        }

        return cached;
      }
    }

    // No cache, fetch fresh data
    const data = await fetchFn();
    OfflineCache.set(url, data, params);
    return data;
  }

  /**
   * Revalidate cache in background
   */
  private static async revalidateInBackground<T>(
    url: string,
    fetchFn: () => Promise<T>,
    params?: Record<string, unknown>
  ): Promise<void> {
    if (this.revalidationQueue.has(url)) {
      return; // Already revalidating
    }

    this.revalidationQueue.add(url);

    try {
      const data = await fetchFn();
      OfflineCache.set(url, data, params);
    } catch (error) {
      // Silently fail - keep stale data
      console.warn('Background revalidation failed:', error);
    } finally {
      this.revalidationQueue.delete(url);
    }
  }

  /**
   * Get cache entry with metadata
   */
  private static getCacheEntry<T>(
    url: string,
    params?: Record<string, unknown>
  ): CacheEntry<T> | null {
    if (!OfflineCache['isStorageAvailable']()) return null;

    try {
      const key = OfflineCache['getCacheKey'](url, params);
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as CacheEntry<T>;
    } catch {
      return null;
    }
  }

  /**
   * Invalidate cache for URL pattern
   */
  static invalidatePattern(pattern: string): void {
    const keys = OfflineCache.getAllKeys();
    keys.forEach((key) => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const entry: CacheEntry<unknown> = JSON.parse(item);
          if (entry.url && entry.url.includes(pattern)) {
            OfflineCache.remove(entry.url);
          }
        }
      } catch {
        // Ignore invalid entries
      }
    });
  }

  /**
   * Enable/disable background sync
   */
  static setBackgroundSyncEnabled(enabled: boolean): void {
    this.backgroundSyncEnabled = enabled;
  }
}

// Initialize revalidation on focus/reconnect
if (typeof window !== 'undefined') {
  // Revalidate on window focus
  window.addEventListener('focus', () => {
    const keys = OfflineCache.getAllKeys();
    keys.forEach((key) => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const entry: CacheEntry<unknown> = JSON.parse(item);
          const config = AdvancedCache['getConfig'](entry.url);
          if (config.revalidateOnFocus) {
            // Trigger revalidation (would need fetch function)
            // This is a placeholder - actual implementation would need fetch functions
          }
        }
      } catch {
        // Ignore
      }
    });
  });

  // Revalidate on reconnect
  NetworkMonitor.subscribe((online) => {
    if (online) {
      // Trigger revalidation for stale entries
      // Placeholder - actual implementation would need fetch functions
    }
  });
}

