import { api } from '../api/client';
import { logger } from '../logger';

export type ShopSyncDirection = 'product_to_drop' | 'drop_to_product' | 'bidirectional';

export interface ShopSyncOptions {
  fields?: string[];
  strategy?: 'overwrite' | 'merge' | 'prefer_product' | 'prefer_drop';
  includeInventory?: boolean;
  includeImages?: boolean;
  includeVariants?: boolean;
  dryRun?: boolean;
}

export interface ShopSyncItem {
  productId?: string;
  dropId?: string;
  direction: ShopSyncDirection;
  options?: ShopSyncOptions;
}

export interface ShopSyncStatus {
  syncId: string;
  state: 'pending' | 'in_progress' | 'completed' | 'failed' | 'conflict';
  progress?: number;
  startedAt?: string;
  completedAt?: string;
  items?: Array<{
    productId?: string;
    dropId?: string;
    direction: ShopSyncDirection;
    status: 'pending' | 'synced' | 'skipped' | 'failed' | 'conflict';
    message?: string;
  }>;
  conflicts?: Array<ShopSyncConflict>;
  logs?: Array<{ timestamp: string; message: string; level: 'info' | 'warn' | 'error' }>;
}

export interface ShopSyncConflict {
  conflictId: string;
  productId?: string;
  dropId?: string;
  field: string;
  productValue: any;
  dropValue: any;
  resolution?: 'product' | 'drop' | 'manual';
  resolvedAt?: string;
}

export interface ResolveSyncConflictPayload {
  resolution: 'product' | 'drop' | 'manual';
  value?: any;
  notes?: string;
}

class ShopSyncService {
  async syncProductToDrop(productId: string, dropId: string, options?: ShopSyncOptions) {
    logger.info('[ShopSync] Sync product → drop requested', { productId, dropId, options });
    return api.post('/api/admin/shop/sync', {
      items: [{ productId, dropId, direction: 'product_to_drop', options }]
    });
  }

  async syncDropToProduct(dropId: string, productId: string, options?: ShopSyncOptions) {
    logger.info('[ShopSync] Sync drop → product requested', { productId, dropId, options });
    return api.post('/api/admin/shop/sync', {
      items: [{ productId, dropId, direction: 'drop_to_product', options }]
    });
  }

  async syncBidirectional(productId: string, dropId: string, options?: ShopSyncOptions) {
    logger.info('[ShopSync] Bidirectional sync requested', { productId, dropId, options });
    return api.post('/api/admin/shop/sync', {
      items: [{ productId, dropId, direction: 'bidirectional', options }]
    });
  }

  async bulkSync(items: ShopSyncItem[]) {
    if (!items.length) {
      throw new Error('Cannot start bulk sync with empty item list');
    }

    logger.info('[ShopSync] Bulk sync requested', { count: items.length });
    return api.post('/api/admin/shop/sync', { items });
  }

  async getSyncStatus(syncId: string): Promise<ShopSyncStatus> {
    logger.debug('[ShopSync] Fetching sync status', { syncId });
    const response = await api.get(`/api/admin/shop/sync/status?syncId=${encodeURIComponent(syncId)}`);
    return response.data as ShopSyncStatus;
  }

  async getItemSyncStatus(itemId: string) {
    logger.debug('[ShopSync] Fetching item sync status', { itemId });
    const response = await api.get(`/api/admin/shop/sync/status?itemId=${encodeURIComponent(itemId)}`);
    return response.data as ShopSyncStatus;
  }

  async resolveConflict(conflictId: string, payload: ResolveSyncConflictPayload) {
    logger.info('[ShopSync] Resolving sync conflict', { conflictId, resolution: payload.resolution });
    return api.post('/api/admin/shop/sync/resolve', {
      conflictId,
      ...payload
    });
  }

  /**
   * Anonyme Synchronisation von Shop zu Drops
   * Entfernt persönliche Daten und synchronisiert nur Produktdaten
   */
  async syncShopToDropsAnonymously(options?: ShopSyncOptions & { productIds?: string[] }) {
    logger.info('[ShopSync] Anonymous sync shop → drops requested', { options });
    return api.post('/api/admin/shop/sync/anonymous', {
      direction: 'shop_to_drops',
      options: {
        ...options,
        // Anonymisierungs-Flags
        anonymize: true,
        excludePersonalData: true,
        excludeUserData: true,
      }
    });
  }

  /**
   * Anonyme Synchronisation von Drops zu Shop
   * Entfernt persönliche Daten und synchronisiert nur Produktdaten
   */
  async syncDropsToShopAnonymously(options?: ShopSyncOptions & { dropIds?: string[] }) {
    logger.info('[ShopSync] Anonymous sync drops → shop requested', { options });
    return api.post('/api/admin/shop/sync/anonymous', {
      direction: 'drops_to_shop',
      options: {
        ...options,
        // Anonymisierungs-Flags
        anonymize: true,
        excludePersonalData: true,
        excludeUserData: true,
      }
    });
  }

  /**
   * Bidirektionale anonyme Synchronisation
   */
  async syncBidirectionalAnonymously(options?: ShopSyncOptions) {
    logger.info('[ShopSync] Bidirectional anonymous sync requested', { options });
    return api.post('/api/admin/shop/sync/anonymous', {
      direction: 'bidirectional',
      options: {
        ...options,
        anonymize: true,
        excludePersonalData: true,
        excludeUserData: true,
      }
    });
  }
}

export const shopSyncService = new ShopSyncService();

