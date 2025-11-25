// IndexedDB Integration für lokale Datenpersistierung
// Ermöglicht Offline-Zugriff auf große Datensätze

const DB_NAME = 'nebula-admin-db';
const DB_VERSION = 1;

interface StoreConfig {
  name: string;
  keyPath: string;
  indexes?: Array<{ name: string; keyPath: string; unique?: boolean }>;
}

const STORES: StoreConfig[] = [
  {
    name: 'products',
    keyPath: 'id',
    indexes: [
      { name: 'name', keyPath: 'name' },
      { name: 'category', keyPath: 'category' },
      { name: 'updatedAt', keyPath: 'updatedAt' }
    ]
  },
  {
    name: 'orders',
    keyPath: 'id',
    indexes: [
      { name: 'orderId', keyPath: 'orderId' },
      { name: 'status', keyPath: 'status' },
      { name: 'customerEmail', keyPath: 'customerEmail' },
      { name: 'createdAt', keyPath: 'createdAt' }
    ]
  },
  {
    name: 'tickets',
    keyPath: 'id',
    indexes: [
      { name: 'status', keyPath: 'status' },
      { name: 'priority', keyPath: 'priority' },
      { name: 'assignedAgent', keyPath: 'assignedAgent' },
      { name: 'updatedAt', keyPath: 'updatedAt' }
    ]
  },
  {
    name: 'customers',
    keyPath: 'id',
    indexes: [
      { name: 'email', keyPath: 'email', unique: true },
      { name: 'name', keyPath: 'name' },
      { name: 'updatedAt', keyPath: 'updatedAt' }
    ]
  },
  {
    name: 'cache',
    keyPath: 'key',
    indexes: [
      { name: 'expiresAt', keyPath: 'expiresAt' }
    ]
  }
];

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`IndexedDB error: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        STORES.forEach((storeConfig) => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath
            });

            // Create indexes
            storeConfig.indexes?.forEach((index) => {
              store.createIndex(index.name, index.keyPath, {
                unique: index.unique || false
              });
            });
          }
        });
      };
    });

    return this.initPromise;
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Generic CRUD operations
  async add<T>(storeName: string, data: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query<T>(
    storeName: string,
    indexName: string,
    range?: IDBKeyRange
  ): Promise<T[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async count(storeName: string): Promise<number> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Batch operations
  async bulkPut<T>(storeName: string, items: T[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      let hasError = false;

      items.forEach((item) => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === items.length && !hasError) {
            resolve();
          }
        };
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      });
    });
  }

  async bulkDelete(storeName: string, keys: string[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      let hasError = false;

      keys.forEach((key) => {
        const request = store.delete(key);
        request.onsuccess = () => {
          completed++;
          if (completed === keys.length && !hasError) {
            resolve();
          }
        };
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      });
    });
  }

  // Cache operations with expiration
  async setCache<T>(key: string, data: T, ttl: number = 60 * 60 * 1000): Promise<void> {
    const expiresAt = Date.now() + ttl;
    await this.put('cache', {
      key,
      data,
      expiresAt,
      createdAt: Date.now()
    });
  }

  async getCache<T>(key: string): Promise<T | undefined> {
    const cached = await this.get<{ data: T; expiresAt: number }>('cache', key);
    if (!cached) {
      return undefined;
    }

    if (Date.now() > cached.expiresAt) {
      await this.delete('cache', key);
      return undefined;
    }

    return cached.data;
  }

  async clearExpiredCache(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(Date.now());
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  // Delete entire database
  async deleteDatabase(): Promise<void> {
    this.close();
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
let dbManager: IndexedDBManager | null = null;

export function getIndexedDBManager(): IndexedDBManager {
  if (!dbManager) {
    dbManager = new IndexedDBManager();
  }
  return dbManager;
}

// Auto-initialize
if (typeof window !== 'undefined') {
  getIndexedDBManager().init().catch((error) => {
    console.warn('IndexedDB initialization failed:', error);
  });

  // Clean up expired cache on startup
  getIndexedDBManager().clearExpiredCache().catch(() => {
    // Ignore errors
  });
}

export { IndexedDBManager };

