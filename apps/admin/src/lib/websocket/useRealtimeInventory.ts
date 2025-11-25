import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getWebSocketClient } from './client';
import { logger } from '../logger';
import { queryKeys } from '../api/hooks';

export interface InventoryEvent {
  type: 'inventory:updated' | 'inventory:low_stock' | 'inventory:out_of_stock' | 'inventory:adjusted' | 'inventory:reserved' | 'inventory:released';
  productId: string;
  variantId?: string;
  oldStock?: number;
  newStock: number;
  adjustment?: number;
  reason?: string;
  location?: string;
  timestamp: string;
}

export interface UseRealtimeInventoryOptions {
  enabled?: boolean;
  productIds?: string[];
  onUpdated?: (event: InventoryEvent) => void;
  onLowStock?: (event: InventoryEvent) => void;
  onOutOfStock?: (event: InventoryEvent) => void;
  onAdjusted?: (event: InventoryEvent) => void;
}

export const useRealtimeInventory = (options: UseRealtimeInventoryOptions = {}) => {
  const queryClient = useQueryClient();
  const wsClient = getWebSocketClient();
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleInventoryEvent = useCallback((event: InventoryEvent) => {
    logger.info('Received inventory event', { type: event.type, productId: event.productId });

    switch (event.type) {
      case 'inventory:updated':
      case 'inventory:adjusted':
      case 'inventory:reserved':
      case 'inventory:released': {
        // Update product detail if present in cache
        queryClient.setQueryData(queryKeys.products.detail(event.productId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            inventory: event.newStock,
            updatedAt: event.timestamp
          };
        });
        // Invalidate inventory list
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(event.productId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
        optionsRef.current.onUpdated?.(event);
        break;
      }
      case 'inventory:low_stock': {
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.lowStock() });
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(event.productId) });
        optionsRef.current.onLowStock?.(event);
        break;
      }
      case 'inventory:out_of_stock': {
        queryClient.setQueryData(queryKeys.products.detail(event.productId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            inventory: 0,
            updatedAt: event.timestamp
          };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.detail(event.productId) });
        optionsRef.current.onOutOfStock?.(event);
        break;
      }
    }
  }, [queryClient]);

  useEffect(() => {
    if (!options.enabled) return;

    // Subscribe to inventory events
    wsClient.on('inventory:updated', handleInventoryEvent);
    wsClient.on('inventory:low_stock', handleInventoryEvent);
    wsClient.on('inventory:out_of_stock', handleInventoryEvent);
    wsClient.on('inventory:adjusted', handleInventoryEvent);
    wsClient.on('inventory:reserved', handleInventoryEvent);
    wsClient.on('inventory:released', handleInventoryEvent);

    // Subscribe to specific products if provided
    if (options.productIds && options.productIds.length > 0) {
      wsClient.subscribeToInventory(options.productIds);
    } else {
      wsClient.subscribeToInventory();
    }

    return () => {
      wsClient.off('inventory:updated', handleInventoryEvent);
      wsClient.off('inventory:low_stock', handleInventoryEvent);
      wsClient.off('inventory:out_of_stock', handleInventoryEvent);
      wsClient.off('inventory:adjusted', handleInventoryEvent);
      wsClient.off('inventory:reserved', handleInventoryEvent);
      wsClient.off('inventory:released', handleInventoryEvent);
    };
  }, [options.enabled, options.productIds, handleInventoryEvent, wsClient]);

  return {
    isConnected: wsClient.isConnected,
    connectionStatus: wsClient.connectionStatus,
    forceReconnect: wsClient.forceReconnect?.bind(wsClient)
  };
};

