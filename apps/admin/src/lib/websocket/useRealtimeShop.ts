import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getWebSocketClient, ShopRealtimeChannel } from './client';
import { logger } from '../logger';
import { queryKeys } from '../api/hooks';

export type ShopRealtimeEventType =
  | 'product:created'
  | 'product:updated'
  | 'product:deleted'
  | 'product:stock_changed'
  | 'drop:created'
  | 'drop:updated'
  | 'drop:deleted'
  | 'drop:stock_changed'
  | 'inventory:stock_adjusted'
  | 'inventory:stock_reserved'
  | 'inventory:stock_released'
  | 'inventory:low_stock_alert'
  | 'category:created'
  | 'category:updated'
  | 'category:deleted'
  | 'analytics:updated'
  | 'order:created'
  | 'sync:status';

export interface ShopRealtimeEvent<TPayload = any> {
  type: ShopRealtimeEventType;
  payload: TPayload;
  timestamp?: string;
}

export interface UseRealtimeShopOptions {
  enabled?: boolean;
  channels?: ShopRealtimeChannel[];
  scope?: string;
  filters?: Record<string, any>;
  onEvent?: (event: ShopRealtimeEvent) => void;
  onProductCreated?: (event: ShopRealtimeEvent) => void;
  onProductUpdated?: (event: ShopRealtimeEvent) => void;
  onProductDeleted?: (event: ShopRealtimeEvent) => void;
  onInventoryEvent?: (event: ShopRealtimeEvent) => void;
  onDropEvent?: (event: ShopRealtimeEvent) => void;
  onCategoryEvent?: (event: ShopRealtimeEvent) => void;
  onAnalyticsUpdated?: (event: ShopRealtimeEvent) => void;
  onOrderCreated?: (event: ShopRealtimeEvent) => void;
  onSyncStatus?: (event: ShopRealtimeEvent) => void;
}

const DEFAULT_CHANNELS: ShopRealtimeChannel[] = [
  'products',
  'drops',
  'inventory',
  'categories',
  'analytics',
  'orders',
  'sync'
];

export const useRealtimeShop = (options: UseRealtimeShopOptions = {}) => {
  const queryClient = useQueryClient();
  const wsClient = getWebSocketClient();
  const optionsRef = useRef(options);
  const isSubscribedRef = useRef(false);
  const subscriptionKeyRef = useRef<string | undefined>();

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const invalidateProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.products.metrics });
  }, [queryClient]);

  const invalidateDrops = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.drops.list() });
  }, [queryClient]);

  const invalidateInventory = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lowStock(undefined) });
  }, [queryClient]);

  const invalidateCategories = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.list() });
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.tree() });
  }, [queryClient]);

  const invalidateAnalytics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.sales(undefined) });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard });
  }, [queryClient]);

  const invalidateOrders = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
  }, [queryClient]);

  const emitEvent = useCallback((event: ShopRealtimeEvent) => {
    const opts = optionsRef.current;
    opts.onEvent?.(event);

    switch (event.type) {
      case 'product:created':
        opts.onProductCreated?.(event);
        break;
      case 'product:updated':
        opts.onProductUpdated?.(event);
        break;
      case 'product:deleted':
        opts.onProductDeleted?.(event);
        break;
      case 'product:stock_changed':
        opts.onProductUpdated?.(event);
        break;
      case 'drop:created':
      case 'drop:updated':
      case 'drop:deleted':
      case 'drop:stock_changed':
        opts.onDropEvent?.(event);
        break;
      case 'inventory:stock_adjusted':
      case 'inventory:stock_reserved':
      case 'inventory:stock_released':
      case 'inventory:low_stock_alert':
        opts.onInventoryEvent?.(event);
        break;
      case 'category:created':
      case 'category:updated':
      case 'category:deleted':
        opts.onCategoryEvent?.(event);
        break;
      case 'analytics:updated':
        opts.onAnalyticsUpdated?.(event);
        break;
      case 'order:created':
        opts.onOrderCreated?.(event);
        break;
      case 'sync:status':
        opts.onSyncStatus?.(event);
        break;
      default:
        break;
    }
  }, []);

  const handleEvent = useCallback(
    (type: ShopRealtimeEventType, payload: any) => {
      logger.debug('[ShopRealtime] Received event', { type, payload });

      switch (type) {
        case 'product:created':
        case 'product:updated':
        case 'product:deleted':
        case 'product:stock_changed':
          invalidateProducts();
          invalidateInventory();
          break;

        case 'drop:created':
        case 'drop:updated':
        case 'drop:deleted':
        case 'drop:stock_changed':
          invalidateDrops();
          break;

        case 'inventory:stock_adjusted':
        case 'inventory:stock_reserved':
        case 'inventory:stock_released':
        case 'inventory:low_stock_alert':
          invalidateInventory();
          break;

        case 'category:created':
        case 'category:updated':
        case 'category:deleted':
          invalidateCategories();
          break;

        case 'analytics:updated':
          invalidateAnalytics();
          break;

        case 'order:created':
          invalidateOrders();
          break;
      case 'sync:status':
        // Sync status updates don't require cache invalidation by default.
        break;
      }

      emitEvent({ type, payload, timestamp: payload?.timestamp });
    },
    [emitEvent, invalidateAnalytics, invalidateCategories, invalidateDrops, invalidateInventory, invalidateOrders, invalidateProducts]
  );

  useEffect(() => {
    if (!options.enabled) {
      return undefined;
    }

    const channels = options.channels && options.channels.length > 0 ? options.channels : DEFAULT_CHANNELS;

    const productCreatedHandler = (payload: any) => handleEvent('product:created', payload);
    const productUpdatedHandler = (payload: any) => handleEvent('product:updated', payload);
    const productDeletedHandler = (payload: any) => handleEvent('product:deleted', payload);
    const productStockHandler = (payload: any) => handleEvent('product:stock_changed', payload);

    const dropCreatedHandler = (payload: any) => handleEvent('drop:created', payload);
    const dropUpdatedHandler = (payload: any) => handleEvent('drop:updated', payload);
    const dropDeletedHandler = (payload: any) => handleEvent('drop:deleted', payload);
    const dropStockHandler = (payload: any) => handleEvent('drop:stock_changed', payload);

    const inventoryAdjustedHandler = (payload: any) => handleEvent('inventory:stock_adjusted', payload);
    const inventoryReservedHandler = (payload: any) => handleEvent('inventory:stock_reserved', payload);
    const inventoryReleasedHandler = (payload: any) => handleEvent('inventory:stock_released', payload);
    const inventoryLowHandler = (payload: any) => handleEvent('inventory:low_stock_alert', payload);

    const categoryCreatedHandler = (payload: any) => handleEvent('category:created', payload);
    const categoryUpdatedHandler = (payload: any) => handleEvent('category:updated', payload);
    const categoryDeletedHandler = (payload: any) => handleEvent('category:deleted', payload);

    const analyticsUpdatedHandler = (payload: any) => handleEvent('analytics:updated', payload);
    const orderCreatedHandler = (payload: any) => handleEvent('order:created', payload);
    const syncStatusHandler = (payload: any) => handleEvent('sync:status', payload);

    wsClient.on('product:created', productCreatedHandler);
    wsClient.on('product:updated', productUpdatedHandler);
    wsClient.on('product:deleted', productDeletedHandler);
    wsClient.on('product:stock_changed', productStockHandler);

    wsClient.on('drop:created', dropCreatedHandler);
    wsClient.on('drop:updated', dropUpdatedHandler);
    wsClient.on('drop:deleted', dropDeletedHandler);
    wsClient.on('drop:stock_changed', dropStockHandler);

    wsClient.on('inventory:stock_adjusted', inventoryAdjustedHandler);
    wsClient.on('inventory:stock_reserved', inventoryReservedHandler);
    wsClient.on('inventory:stock_released', inventoryReleasedHandler);
    wsClient.on('inventory:low_stock_alert', inventoryLowHandler);

    wsClient.on('category:created', categoryCreatedHandler);
    wsClient.on('category:updated', categoryUpdatedHandler);
    wsClient.on('category:deleted', categoryDeletedHandler);

    wsClient.on('analytics:updated', analyticsUpdatedHandler);
    wsClient.on('order:created', orderCreatedHandler);
    wsClient.on('sync:status', syncStatusHandler);

    if (!isSubscribedRef.current) {
      wsClient.subscribeToShop({
        channels,
        scope: options.scope,
        filters: options.filters
      });
      subscriptionKeyRef.current = options.scope;
      isSubscribedRef.current = true;
    }

    return () => {
      wsClient.off('product:created', productCreatedHandler);
      wsClient.off('product:updated', productUpdatedHandler);
      wsClient.off('product:deleted', productDeletedHandler);
      wsClient.off('product:stock_changed', productStockHandler);

      wsClient.off('drop:created', dropCreatedHandler);
      wsClient.off('drop:updated', dropUpdatedHandler);
      wsClient.off('drop:deleted', dropDeletedHandler);
      wsClient.off('drop:stock_changed', dropStockHandler);

      wsClient.off('inventory:stock_adjusted', inventoryAdjustedHandler);
      wsClient.off('inventory:stock_reserved', inventoryReservedHandler);
      wsClient.off('inventory:stock_released', inventoryReleasedHandler);
      wsClient.off('inventory:low_stock_alert', inventoryLowHandler);

      wsClient.off('category:created', categoryCreatedHandler);
      wsClient.off('category:updated', categoryUpdatedHandler);
      wsClient.off('category:deleted', categoryDeletedHandler);

      wsClient.off('analytics:updated', analyticsUpdatedHandler);
      wsClient.off('order:created', orderCreatedHandler);
      wsClient.off('sync:status', syncStatusHandler);
    };
  }, [handleEvent, options.channels, options.enabled, options.filters, options.scope, wsClient]);

  useEffect(() => {
    return () => {
      if (isSubscribedRef.current) {
        wsClient.unsubscribeFromShop({ scope: subscriptionKeyRef.current });
        isSubscribedRef.current = false;
        subscriptionKeyRef.current = undefined;
      }
    };
  }, [wsClient]);

  return {
    isConnected: wsClient.isConnected,
    connectionStatus: wsClient.connectionStatus,
    forceReconnect: wsClient.forceReconnect.bind(wsClient)
  };
};
