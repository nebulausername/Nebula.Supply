// Offline Cache Management for API responses
// Provides fallback data when network is unavailable

const CACHE_PREFIX = 'nebula_web_cache_';
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

  private static getCacheKey(url: string, params?: any): string {
    const key = params ? `${url}_${JSON.stringify(params)}` : url;
    return `${CACHE_PREFIX}${btoa(key).replace(/[+/=]/g, '')}`;
  }

  static set<T>(url: string, data: T, params?: any): void {
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
    }
  }

  static get<T>(url: string, params?: any): T | null {
    if (!this.isStorageAvailable() || !url) return null;

    try {
      const key = this.getCacheKey(url, params);
      const item = localStorage.getItem(key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (!entry || typeof entry !== 'object' || !entry.data) {
        this.remove(url, params);
        return null;
      }
      
      if (entry.version !== CACHE_VERSION) {
        this.remove(url, params);
        return null;
      }

      const age = Date.now() - (entry.timestamp || 0);
      if (age > MAX_CACHE_AGE || age < 0) {
        this.remove(url, params);
        return null;
      }

      return entry.data;
    } catch (error) {
      return null;
    }
  }

  static remove(url: string, params?: any): void {
    if (!this.isStorageAvailable()) return;

    try {
      const key = this.getCacheKey(url, params);
      localStorage.removeItem(key);
    } catch (error) {
      // Silently fail
    }
  }

  static clear(): void {
    if (!this.isStorageAvailable()) return;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      // Silently fail
    }
  }
}

export class NetworkMonitor {
  private static listeners: Set<(online: boolean) => void> = new Set();
  private static isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  static init(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.listeners.forEach(listener => listener(true));
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.listeners.forEach(listener => listener(false));
    });
  }

  static getStatus(): boolean {
    return this.isOnline;
  }

  static subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.isOnline);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

// Initialize network monitor
if (typeof window !== 'undefined') {
  NetworkMonitor.init();
}

