import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Cache schema definition
interface CacheDB extends DBSchema {
  cache: {
    key: string;
    value: {
      data: any;
      timestamp: number;
      expiresAt: number;
    };
    indexes: { 'by-expires': number };
  };
  products: {
    key: string;
    value: {
      data: any;
      timestamp: number;
    };
  };
  drops: {
    key: string;
    value: {
      data: any;
      timestamp: number;
    };
  };
  profile: {
    key: string;
    value: {
      data: any;
      timestamp: number;
    };
  };
}

// Cache configuration
const CACHE_CONFIG = {
  DB_NAME: 'nebula-cache',
  DB_VERSION: 1,
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  PRODUCTS_TTL: 10 * 60 * 1000, // 10 minutes
  DROPS_TTL: 2 * 60 * 1000, // 2 minutes
  PROFILE_TTL: 30 * 60 * 1000, // 30 minutes
};

let dbInstance: IDBPDatabase<CacheDB> | null = null;

// Initialize IndexedDB
export const initCache = async (): Promise<IDBPDatabase<CacheDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<CacheDB>(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.DB_VERSION, {
    upgrade(db) {
      // Generic cache store
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('by-expires', 'value.expiresAt');
      }

      // Products store
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'key' });
      }

      // Drops store
      if (!db.objectStoreNames.contains('drops')) {
        db.createObjectStore('drops', { keyPath: 'key' });
      }

      // Profile store
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'key' });
      }
    },
  });

  // Cleanup expired entries on init
  cleanupExpired();

  return dbInstance;
};

// Cleanup expired cache entries
const cleanupExpired = async () => {
  if (!dbInstance) return;

  const tx = dbInstance.transaction('cache', 'readwrite');
  const index = tx.store.index('by-expires');
  const now = Date.now();

  for await (const cursor of index.iterate(IDBKeyRange.upperBound(now))) {
    await cursor.delete();
  }

  await tx.done;
};

// Generic cache operations
export const cacheGet = async <T>(key: string, storeName: 'cache' | 'products' | 'drops' | 'profile' = 'cache'): Promise<T | null> => {
  try {
    const db = await initCache();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.store;
    const cached = await store.get(key);

    if (!cached) return null;

    // Check expiration for cache store
    if (storeName === 'cache' && cached.value.expiresAt < Date.now()) {
      // Delete expired entry
      const writeTx = db.transaction(storeName, 'readwrite');
      await writeTx.store.delete(key);
      await writeTx.done;
      return null;
    }

    return cached.value.data as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

export const cacheSet = async <T>(
  key: string,
  data: T,
  ttl: number = CACHE_CONFIG.DEFAULT_TTL,
  storeName: 'cache' | 'products' | 'drops' | 'profile' = 'cache'
): Promise<void> => {
  try {
    const db = await initCache();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.store;

    const value = storeName === 'cache'
      ? {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        }
      : {
          data,
          timestamp: Date.now(),
        };

    await store.put({ key, value } as any);
    await tx.done;
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

export const cacheDelete = async (key: string, storeName: 'cache' | 'products' | 'drops' | 'profile' = 'cache'): Promise<void> => {
  try {
    const db = await initCache();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.store.delete(key);
    await tx.done;
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

export const cacheClear = async (storeName?: 'cache' | 'products' | 'drops' | 'profile'): Promise<void> => {
  try {
    const db = await initCache();
    
    if (storeName) {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.store.clear();
      await tx.done;
    } else {
      // Clear all stores
      const stores: Array<'cache' | 'products' | 'drops' | 'profile'> = ['cache', 'products', 'drops', 'profile'];
      for (const store of stores) {
        const tx = db.transaction(store, 'readwrite');
        await tx.store.clear();
        await tx.done;
      }
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

// Stale-While-Revalidate pattern
export const staleWhileRevalidate = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_CONFIG.DEFAULT_TTL,
  storeName: 'cache' | 'products' | 'drops' | 'profile' = 'cache'
): Promise<T> => {
  // Get cached data (even if stale)
  const cached = await cacheGet<T>(key, storeName);
  
  if (cached) {
    // Return cached data immediately
    // Fetch fresh data in background
    fetcher()
      .then((freshData) => {
        cacheSet(key, freshData, ttl, storeName);
      })
      .catch((error) => {
        console.error('Background fetch error:', error);
      });
    
    return cached;
  }

  // No cache, fetch fresh data
  const freshData = await fetcher();
  await cacheSet(key, freshData, ttl, storeName);
  return freshData;
};

// Product-specific cache helpers
export const cacheProduct = async (productId: string, product: any): Promise<void> => {
  await cacheSet(productId, product, CACHE_CONFIG.PRODUCTS_TTL, 'products');
};

export const getCachedProduct = async (productId: string): Promise<any | null> => {
  return cacheGet(productId, 'products');
};

// Drop-specific cache helpers
export const cacheDrop = async (dropId: string, drop: any): Promise<void> => {
  await cacheSet(dropId, drop, CACHE_CONFIG.DROPS_TTL, 'drops');
};

export const getCachedDrop = async (dropId: string): Promise<any | null> => {
  return cacheGet(dropId, 'drops');
};

// Profile-specific cache helpers
export const cacheProfile = async (userId: string, profile: any): Promise<void> => {
  await cacheSet(userId, profile, CACHE_CONFIG.PROFILE_TTL, 'profile');
};

export const getCachedProfile = async (userId: string): Promise<any | null> => {
  return cacheGet(userId, 'profile');
};

// Export cache config
export { CACHE_CONFIG };





