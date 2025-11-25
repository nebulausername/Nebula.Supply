import Redis, { Cluster, Sentinel } from 'ioredis';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number; // Default TTL in Sekunden
  redisUrl?: string;
  enableCompression?: boolean;
  compressionThreshold?: number; // Bytes
  maxRetries?: number;
  retryDelay?: number;
  healthCheckInterval?: number; // milliseconds
  poolSize?: number;
  clusterNodes?: Array<{ host: string; port: number }>;
  sentinels?: Array<{ host: string; port: number }>;
  sentinelName?: string;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalLatency: number;
  operationCount: number;
  lastHealthCheck: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  reconnectAttempts: number;
}

class CacheService {
  private client: Redis | Cluster | null = null;
  private isConnected = false;
  private config: CacheConfig;
  private memoryStore = new Map<string, { value: string; expiry: number }>();
  private metrics: CacheMetrics;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private readonly COMPRESSION_PREFIX = '__compressed__';
  private readonly COMPRESSION_THRESHOLD = 1024; // 1KB default

  constructor() {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_PREFIX || 'nebula:',
      ttl: parseInt(process.env.CACHE_TTL || '300'), // 5 Minuten Default
      redisUrl: process.env.REDIS_URL,
      enableCompression: process.env.REDIS_COMPRESSION !== 'false',
      compressionThreshold: parseInt(process.env.REDIS_COMPRESSION_THRESHOLD || '1024'),
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
      healthCheckInterval: parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL || '30000'), // 30s
      poolSize: parseInt(process.env.REDIS_POOL_SIZE || '10'),
    };

    // Parse cluster nodes if provided
    if (process.env.REDIS_CLUSTER_NODES) {
      try {
        this.config.clusterNodes = JSON.parse(process.env.REDIS_CLUSTER_NODES);
      } catch (e) {
        logger.warn('Invalid REDIS_CLUSTER_NODES format, ignoring');
      }
    }

    // Parse sentinels if provided
    if (process.env.REDIS_SENTINELS) {
      try {
        this.config.sentinels = JSON.parse(process.env.REDIS_SENTINELS);
        this.config.sentinelName = process.env.REDIS_SENTINEL_NAME || 'mymaster';
      } catch (e) {
        logger.warn('Invalid REDIS_SENTINELS format, ignoring');
      }
    }

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalLatency: 0,
      operationCount: 0,
      lastHealthCheck: 0,
      connectionStatus: 'disconnected',
      reconnectAttempts: 0,
    };
  }

  private createRedisClient(): Redis | Cluster {
    // Priority: Cluster > Sentinel > URL > Host/Port
    if (this.config.clusterNodes && this.config.clusterNodes.length > 0) {
      logger.info('Initializing Redis Cluster mode');
      return new Redis.Cluster(this.config.clusterNodes, {
        redisOptions: {
          password: this.config.password,
          keyPrefix: this.config.keyPrefix,
          retryStrategy: this.retryStrategy.bind(this),
          maxRetriesPerRequest: this.config.maxRetries,
          lazyConnect: true,
          connectTimeout: 5000,
          commandTimeout: 3000,
        },
        clusterRetryStrategy: this.retryStrategy.bind(this),
      });
    }

    if (this.config.sentinels && this.config.sentinels.length > 0) {
      logger.info('Initializing Redis Sentinel mode');
      return new Redis({
        sentinels: this.config.sentinels,
        name: this.config.sentinelName,
        password: this.config.password,
        db: this.config.db,
        keyPrefix: this.config.keyPrefix,
        retryStrategy: this.retryStrategy.bind(this),
        maxRetriesPerRequest: this.config.maxRetries,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
      });
    }

    // Use REDIS_URL if provided, otherwise use host/port
    if (this.config.redisUrl && this.config.redisUrl.trim() !== '') {
      logger.info('Initializing Redis with REDIS_URL');
      return new Redis(this.config.redisUrl, {
        retryStrategy: this.retryStrategy.bind(this),
        maxRetriesPerRequest: this.config.maxRetries,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 3000,
        enableReadyCheck: true,
        enableOfflineQueue: false,
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        },
      });
    }

    // Fallback to host/port
    return new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      retryStrategy: this.retryStrategy.bind(this),
      maxRetriesPerRequest: this.config.maxRetries,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
    });
  }

  private retryStrategy(times: number): number | null {
    if (times > this.maxReconnectAttempts) {
      logger.warn(`Max Redis reconnect attempts (${this.maxReconnectAttempts}) reached`);
      this.metrics.connectionStatus = 'error';
      return null; // Stop retrying
    }

    this.reconnectAttempts = times;
    this.metrics.reconnectAttempts = times;
    this.metrics.connectionStatus = 'reconnecting';

    // Exponential backoff: 100ms, 200ms, 400ms, ..., max 30s
    const delay = Math.min(times * 100, 30000);
    logger.info(`Redis retry attempt ${times}/${this.maxReconnectAttempts} in ${delay}ms`);
    return delay;
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.info('Redis Verbindung hergestellt');
      this.isConnected = true;
      this.metrics.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.metrics.reconnectAttempts = 0;
    });

    this.client.on('ready', () => {
      logger.info('Redis bereit');
      this.isConnected = true;
      this.metrics.connectionStatus = 'connected';
      this.startHealthChecks();
    });

    this.client.on('error', (error) => {
      logger.warn('Redis Fehler:', error.message);
      this.metrics.errors++;
      this.metrics.connectionStatus = 'error';
      
      // Don't set isConnected to false immediately - let retry strategy handle it
      if (!error.message.includes('ECONNREFUSED') && !error.message.includes('ENOTFOUND')) {
        // Only fallback for non-connection errors
        this.isConnected = false;
      }
    });

    this.client.on('close', () => {
      logger.warn('Redis Verbindung geschlossen');
      this.isConnected = false;
      this.metrics.connectionStatus = 'disconnected';
      this.attemptReconnect();
    });

    this.client.on('end', () => {
      logger.info('Redis Verbindung beendet');
      this.isConnected = false;
      this.metrics.connectionStatus = 'disconnected';
    });

    this.client.on('reconnecting', (delay: number) => {
      logger.info(`Redis Wiederverbindung in ${delay}ms...`);
      this.metrics.connectionStatus = 'reconnecting';
    });
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectTimer) return; // Already attempting

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (!this.isConnected && this.client) {
        try {
          logger.info('Versuche Redis Wiederverbindung...');
          await this.client.connect();
        } catch (error) {
          logger.warn('Redis Wiederverbindung fehlgeschlagen:', error);
        }
      }
    }, 5000); // Wait 5s before attempting reconnect
  }

  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.client || !this.isConnected) {
      this.metrics.connectionStatus = 'disconnected';
      return;
    }

    try {
      const startTime = Date.now();
      await this.client.ping();
      const latency = Date.now() - startTime;
      this.metrics.lastHealthCheck = Date.now();
      this.metrics.connectionStatus = 'connected';
      
      if (latency > 1000) {
        logger.warn(`Redis health check latency high: ${latency}ms`);
      }
    } catch (error) {
      logger.warn('Redis health check failed:', error);
      this.metrics.connectionStatus = 'error';
      this.isConnected = false;
    }
  }

  private async compressValue(value: string): Promise<string> {
    if (!this.config.enableCompression) return value;
    if (Buffer.byteLength(value, 'utf8') < (this.config.compressionThreshold || this.COMPRESSION_THRESHOLD)) {
      return value;
    }

    try {
      const compressed = await gzipAsync(value);
      return this.COMPRESSION_PREFIX + compressed.toString('base64');
    } catch (error) {
      logger.warn('Compression failed, storing uncompressed:', error);
      return value;
    }
  }

  private async decompressValue(value: string): Promise<string> {
    if (!value.startsWith(this.COMPRESSION_PREFIX)) return value;

    try {
      const compressed = Buffer.from(value.slice(this.COMPRESSION_PREFIX.length), 'base64');
      const decompressed = await gunzipAsync(compressed);
      return decompressed.toString('utf8');
    } catch (error) {
      logger.warn('Decompression failed:', error);
      return value; // Return as-is if decompression fails
    }
  }

  async init(): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'test') {
        this.isConnected = true;
        logger.info('Memory Cache für Tests aktiviert');
        return;
      }

      // Prüfe ob Redis explizit deaktiviert wurde
      if (process.env.REDIS_DISABLED === 'true') {
        logger.info('Redis explizit deaktiviert, verwende Memory Cache');
        this.isConnected = false;
        return;
      }

      // Prüfe ob Redis-Konfiguration vorhanden ist
      if (!this.config.redisUrl && !this.config.host && !this.config.clusterNodes && !this.config.sentinels) {
        logger.info('Keine Redis-Konfiguration gefunden, verwende Memory Cache');
        this.isConnected = false;
        return;
      }

      this.client = this.createRedisClient();
      this.setupEventHandlers();

      // Teste Verbindung mit Timeout
      await Promise.race([
        this.client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )
      ]);

      // Verify connection with ping
      await Promise.race([
        this.client.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis ping timeout')), 3000)
        )
      ]);

      logger.info('Redis erfolgreich initialisiert');
      this.startHealthChecks();

    } catch (error) {
      logger.warn('Redis nicht verfügbar, verwende Memory Cache:', error instanceof Error ? error.message : error);
      this.isConnected = false;
      this.metrics.connectionStatus = 'error';
      this.client = null;
    }
  }

  // Basic Cache Operations
  async get(key: string): Promise<string | null> {
    const startTime = Date.now();
    try {
      if (this.isConnected && this.client) {
        const fullKey = this.config.keyPrefix + key;
        const raw = await this.client.get(fullKey);
        
        if (raw) {
          const value = await this.decompressValue(raw);
          const latency = Date.now() - startTime;
          this.updateMetrics('hit', latency);
          return value;
        } else {
          const latency = Date.now() - startTime;
          this.updateMetrics('miss', latency);
          return null;
        }
      } else {
        // Fallback zu Memory Store
        const fullKey = this.config.keyPrefix + key;
        const item = this.memoryStore.get(fullKey);
        
        if (item && item.expiry > Date.now()) {
          const value = await this.decompressValue(item.value);
          const latency = Date.now() - startTime;
          this.updateMetrics('hit', latency);
          return value;
        } else if (item) {
          // Abgelaufen, entfernen
          this.memoryStore.delete(fullKey);
        }
        const latency = Date.now() - startTime;
        this.updateMetrics('miss', latency);
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      logger.warn('Cache GET Error:', error);
      // Fallback to memory store
      const fullKey = this.config.keyPrefix + key;
      const item = this.memoryStore.get(fullKey);
      if (item && item.expiry > Date.now()) {
        return await this.decompressValue(item.value);
      }
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    const startTime = Date.now();
    try {
      const compressed = await this.compressValue(value);
      const fullKey = this.config.keyPrefix + key;
      const expiry = ttl || this.config.ttl;

      if (this.isConnected && this.client) {
        await this.client.setex(fullKey, expiry!, compressed);
        const latency = Date.now() - startTime;
        this.updateMetrics('set', latency);
        return true;
      } else {
        // Fallback zu Memory Store
        const expiryTime = Date.now() + (expiry! * 1000);
        this.memoryStore.set(fullKey, { value: compressed, expiry: expiryTime });
        const latency = Date.now() - startTime;
        this.updateMetrics('set', latency);
        return true;
      }
    } catch (error) {
      this.metrics.errors++;
      logger.warn('Cache SET Error:', error);
      // Fallback to memory store
      try {
        const compressed = await this.compressValue(value);
        const fullKey = this.config.keyPrefix + key;
        const expiry = ttl || this.config.ttl;
        const expiryTime = Date.now() + (expiry! * 1000);
        this.memoryStore.set(fullKey, { value: compressed, expiry: expiryTime });
        return true;
      } catch {
        return false;
      }
    }
  }

  async delete(key: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      const fullKey = this.config.keyPrefix + key;

      if (this.isConnected && this.client) {
        await this.client.del(fullKey);
        const latency = Date.now() - startTime;
        this.updateMetrics('delete', latency);
        return true;
      } else {
        // Fallback zu Memory Store
        this.memoryStore.delete(fullKey);
        const latency = Date.now() - startTime;
        this.updateMetrics('delete', latency);
        return true;
      }
    } catch (error) {
      this.metrics.errors++;
      logger.warn('Cache DELETE Error:', error);
      // Fallback to memory store
      const fullKey = this.config.keyPrefix + key;
      this.memoryStore.delete(fullKey);
      return true;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.isConnected && this.client) {
        const fullKey = this.config.keyPrefix + key;
        const result = await this.client.exists(fullKey);
        return result === 1;
      } else {
        // Fallback zu Memory Store
        const fullKey = this.config.keyPrefix + key;
        const item = this.memoryStore.get(fullKey);
        return item ? item.expiry > Date.now() : false;
      }
    } catch (error) {
      logger.warn('Cache EXISTS Error:', error);
      return false;
    }
  }

  // Batch Operations
  async mget(keys: string[]): Promise<(string | null)[]> {
    const startTime = Date.now();
    try {
      if (this.isConnected && this.client && keys.length > 0) {
        const fullKeys = keys.map(k => this.config.keyPrefix + k);
        const results = await this.client.mget(...fullKeys);
        
        // Decompress all values
        const decompressed = await Promise.all(
          results.map(r => r ? this.decompressValue(r) : null)
        );
        
        const latency = Date.now() - startTime;
        this.updateMetrics('hit', latency, keys.length);
        return decompressed;
      } else {
        // Fallback to individual gets
        const results = await Promise.all(keys.map(k => this.get(k)));
        const latency = Date.now() - startTime;
        this.updateMetrics('hit', latency, keys.length);
        return results;
      }
    } catch (error) {
      this.metrics.errors++;
      logger.warn('Cache MGET Error:', error);
      // Fallback to individual gets
      return Promise.all(keys.map(k => this.get(k)));
    }
  }

  async mset(items: Array<{ key: string; value: string; ttl?: number }>): Promise<boolean> {
    const startTime = Date.now();
    try {
      if (this.isConnected && this.client && items.length > 0) {
        const pipeline = this.client.pipeline();
        
        for (const item of items) {
          const fullKey = this.config.keyPrefix + item.key;
          const expiry = item.ttl || this.config.ttl;
          pipeline.setex(fullKey, expiry!, item.value);
        }
        
        await pipeline.exec();
        const latency = Date.now() - startTime;
        this.updateMetrics('set', latency, items.length);
        return true;
      } else {
        // Fallback to individual sets
        await Promise.all(items.map(item => this.set(item.key, item.value, item.ttl)));
        const latency = Date.now() - startTime;
        this.updateMetrics('set', latency, items.length);
        return true;
      }
    } catch (error) {
      this.metrics.errors++;
      logger.warn('Cache MSET Error:', error);
      // Fallback to individual sets
      await Promise.all(items.map(item => this.set(item.key, item.value, item.ttl)));
      return true;
    }
  }

  // Advanced Cache Operations
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get(key);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {
        logger.warn('Cache Parse Error:', error);
        // Bei Parse-Fehler, neuen Wert holen
      }
    }

    const value = await factory();
    await this.set(key, JSON.stringify(value), ttl);
    return value;
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      if (this.isConnected && this.client) {
        const fullPattern = this.config.keyPrefix + pattern;
        const keys = await this.client.keys(fullPattern);

        if (keys.length > 0) {
          // Use pipeline for better performance
          const pipeline = this.client.pipeline();
          keys.forEach(key => pipeline.del(key));
          await pipeline.exec();
        }
        return true;
      } else {
        // Fallback zu Memory Store - einfache Pattern-Matching
        const fullPattern = this.config.keyPrefix + pattern;
        const regex = new RegExp(fullPattern.replace(/\*/g, '.*'));
        
        for (const [key] of this.memoryStore) {
          if (regex.test(key)) {
            this.memoryStore.delete(key);
          }
        }
        return true;
      }
    } catch (error) {
      logger.warn('Cache Invalidate Pattern Error:', error);
      return false;
    }
  }

  private updateMetrics(operation: 'hit' | 'miss' | 'set' | 'delete', latency: number, count: number = 1): void {
    this.metrics.operationCount += count;
    this.metrics.totalLatency += latency * count;

    switch (operation) {
      case 'hit':
        this.metrics.hits += count;
        break;
      case 'miss':
        this.metrics.misses += count;
        break;
      case 'set':
        this.metrics.sets += count;
        break;
      case 'delete':
        this.metrics.deletes += count;
        break;
    }
  }

  getMetrics(): CacheMetrics & {
    hitRate: number;
    missRate: number;
    avgLatency: number;
  } {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    const missRate = total > 0 ? (this.metrics.misses / total) * 100 : 0;
    const avgLatency = this.metrics.operationCount > 0 
      ? this.metrics.totalLatency / this.metrics.operationCount 
      : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      missRate: Math.round(missRate * 100) / 100,
      avgLatency: Math.round(avgLatency * 100) / 100,
    };
  }

  // Cache Keys für verschiedene Datentypen
  static getKeys() {
    return {
      // KPI Cache
      kpi: {
        dashboard: 'kpi:dashboard',
        tickets: 'kpi:tickets',
        trends: 'kpi:trends'
      },

      // Ticket Cache
      tickets: {
        list: 'tickets:list',
        detail: (id: string) => `tickets:detail:${id}`,
        stats: 'tickets:stats'
      },

      // User Cache
      users: {
        profile: (id: string) => `users:profile:${id}`,
        sessions: (id: string) => `users:sessions:${id}`
      },

      // Dashboard Cache
      dashboard: {
        overview: 'dashboard:overview',
        realtime: 'dashboard:realtime'
      }
    };
  }

  // Cache Health Check
  async healthCheck(): Promise<{
    connected: boolean;
    mode: 'redis' | 'memory';
    info?: any;
    error?: string;
    memoryStoreSize?: number;
    metrics?: ReturnType<typeof this.getMetrics>;
    redisInfo?: {
      version?: string;
      usedMemory?: string;
      connectedClients?: string;
      totalCommandsProcessed?: string;
    };
  }> {
    try {
      if (this.isConnected && this.client) {
        let redisInfo: any = {};
        try {
          const info = await this.client.info();
          // Parse Redis INFO output
          const lines = info.split('\r\n');
          redisInfo = {};
          for (const line of lines) {
            if (line.includes(':')) {
              const [key, value] = line.split(':');
              redisInfo[key] = value;
            }
          }
        } catch (error) {
          logger.warn('Failed to get Redis INFO:', error);
        }

        return { 
          connected: true, 
          mode: 'redis', 
          info: redisInfo,
          metrics: this.getMetrics(),
          redisInfo: {
            version: redisInfo.redis_version,
            usedMemory: redisInfo.used_memory_human,
            connectedClients: redisInfo.connected_clients,
            totalCommandsProcessed: redisInfo.total_commands_processed,
          }
        };
      } else {
        // Memory Store Status
        this.cleanupExpiredItems();
        return { 
          connected: true, 
          mode: 'memory', 
          memoryStoreSize: this.memoryStore.size,
          metrics: this.getMetrics(),
        };
      }
    } catch (error) {
      return {
        connected: false,
        mode: 'memory',
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: this.getMetrics(),
      };
    }
  }

  // Cleanup abgelaufene Items aus Memory Store
  private cleanupExpiredItems(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryStore) {
      if (item.expiry <= now) {
        this.memoryStore.delete(key);
      }
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.metrics.connectionStatus = 'disconnected';
    }
  }
}

export const cacheService = new CacheService();

// Initialize cache service
export const initCache = () => cacheService.init();
