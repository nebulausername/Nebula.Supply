import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';
import { queryKeys } from '../../api/hooks';

export interface ShopEvent {
  type: 'product:created' | 'product:updated' | 'product:deleted' | 'product:stock_changed' | 'product:price_changed' | 'product:status_changed' | 'category:created' | 'category:updated' | 'category:deleted' | 'inventory:low_stock' | 'inventory:stock_adjusted';
  productId?: string;
  categoryId?: string;
  product?: any;
  category?: any;
  oldStock?: number;
  newStock?: number;
  oldPrice?: number;
  newPrice?: number;
  oldStatus?: string;
  newStatus?: string;
  timestamp: string;
}

export interface UseRealtimeShopOptions extends UseRealtimeOptions {
  filters?: {
    productIds?: string[];
    categoryIds?: string[];
  };
  onProductCreated?: (event: ShopEvent) => void;
  onProductUpdated?: (event: ShopEvent) => void;
  onProductDeleted?: (event: ShopEvent) => void;
  onProductStockChanged?: (event: ShopEvent) => void;
  onProductPriceChanged?: (event: ShopEvent) => void;
  onProductStatusChanged?: (event: ShopEvent) => void;
  onCategoryCreated?: (event: ShopEvent) => void;
  onCategoryUpdated?: (event: ShopEvent) => void;
  onCategoryDeleted?: (event: ShopEvent) => void;
  onLowStock?: (event: ShopEvent) => void;
  onStockAdjusted?: (event: ShopEvent) => void;
}

export function useRealtimeShop(options: UseRealtimeShopOptions = {}) {
  const queryClient = useQueryClient();
  const { subscribe, unsubscribe, isConnected, client } = useRealtime({
    enabled: options.enabled,
    onConnect: options.onConnect,
    onDisconnect: options.onDisconnect,
    onError: options.onError
  });

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleEvent = useCallback((event: ShopEvent) => {
    logger.info('[useRealtimeShop] Event received:', event.type);

    switch (event.type) {
      case 'product:created':
        queryClient.invalidateQueries({ queryKey: queryKeys.products?.list() || ['products'] });
        optionsRef.current.onProductCreated?.(event);
        break;
      case 'product:updated':
        queryClient.invalidateQueries({ queryKey: queryKeys.products?.list() || ['products'] });
        if (event.productId) {
          queryClient.invalidateQueries({ queryKey: ['products', event.productId] });
        }
        optionsRef.current.onProductUpdated?.(event);
        break;
      case 'product:deleted':
        queryClient.invalidateQueries({ queryKey: queryKeys.products?.list() || ['products'] });
        if (event.productId) {
          queryClient.removeQueries({ queryKey: ['products', event.productId] });
        }
        optionsRef.current.onProductDeleted?.(event);
        break;
      case 'product:stock_changed':
        queryClient.invalidateQueries({ queryKey: queryKeys.products?.list() || ['products'] });
        if (event.productId) {
          queryClient.invalidateQueries({ queryKey: ['products', event.productId] });
        }
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        optionsRef.current.onProductStockChanged?.(event);
        break;
      case 'product:price_changed':
        queryClient.invalidateQueries({ queryKey: queryKeys.products?.list() || ['products'] });
        if (event.productId) {
          queryClient.invalidateQueries({ queryKey: ['products', event.productId] });
        }
        optionsRef.current.onProductPriceChanged?.(event);
        break;
      case 'product:status_changed':
        queryClient.invalidateQueries({ queryKey: queryKeys.products?.list() || ['products'] });
        if (event.productId) {
          queryClient.invalidateQueries({ queryKey: ['products', event.productId] });
        }
        optionsRef.current.onProductStatusChanged?.(event);
        break;
      case 'category:created':
        queryClient.invalidateQueries({ queryKey: queryKeys.categories?.list() || ['categories'] });
        optionsRef.current.onCategoryCreated?.(event);
        break;
      case 'category:updated':
        queryClient.invalidateQueries({ queryKey: queryKeys.categories?.list() || ['categories'] });
        if (event.categoryId) {
          queryClient.invalidateQueries({ queryKey: ['categories', event.categoryId] });
        }
        optionsRef.current.onCategoryUpdated?.(event);
        break;
      case 'category:deleted':
        queryClient.invalidateQueries({ queryKey: queryKeys.categories?.list() || ['categories'] });
        if (event.categoryId) {
          queryClient.removeQueries({ queryKey: ['categories', event.categoryId] });
        }
        optionsRef.current.onCategoryDeleted?.(event);
        break;
      case 'inventory:low_stock':
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        optionsRef.current.onLowStock?.(event);
        break;
      case 'inventory:stock_adjusted':
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        if (event.productId) {
          queryClient.invalidateQueries({ queryKey: ['products', event.productId] });
        }
        optionsRef.current.onStockAdjusted?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToShop(options.filters);

    const unsubscribeProductCreated = subscribe('product:created', handleEvent);
    const unsubscribeProductUpdated = subscribe('product:updated', handleEvent);
    const unsubscribeProductDeleted = subscribe('product:deleted', handleEvent);
    const unsubscribeProductStockChanged = subscribe('product:stock_changed', handleEvent);
    const unsubscribeProductPriceChanged = subscribe('product:price_changed', handleEvent);
    const unsubscribeProductStatusChanged = subscribe('product:status_changed', handleEvent);
    const unsubscribeCategoryCreated = subscribe('category:created', handleEvent);
    const unsubscribeCategoryUpdated = subscribe('category:updated', handleEvent);
    const unsubscribeCategoryDeleted = subscribe('category:deleted', handleEvent);
    const unsubscribeLowStock = subscribe('inventory:low_stock', handleEvent);
    const unsubscribeStockAdjusted = subscribe('inventory:stock_adjusted', handleEvent);

    return () => {
      unsubscribeProductCreated();
      unsubscribeProductUpdated();
      unsubscribeProductDeleted();
      unsubscribeProductStockChanged();
      unsubscribeProductPriceChanged();
      unsubscribeProductStatusChanged();
      unsubscribeCategoryCreated();
      unsubscribeCategoryUpdated();
      unsubscribeCategoryDeleted();
      unsubscribeLowStock();
      unsubscribeStockAdjusted();
      client.unsubscribeFromShop();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

