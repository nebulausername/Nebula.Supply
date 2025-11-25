import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getWebSocketClient } from './client';
import { logger } from '../logger';
import { queryKeys } from '../api/hooks';
import { Order, OrderChanges, TrackingInfo } from '../types/common';

export interface OrderEvent {
  type: 'order:created' | 'order:updated' | 'order:status_changed' | 'order:shipped' | 'order:delivered' | 'order:cancelled' | 'order:refunded';
  orderId: string;
  order?: Order;
  changes?: OrderChanges;
  oldStatus?: string;
  newStatus?: string;
  trackingInfo?: TrackingInfo;
  timestamp: string;
}

export interface UseRealtimeOrdersOptions {
  enabled?: boolean;
  filters?: {
    orderIds?: string[];
    userId?: string;
  };
  onCreated?: (event: OrderEvent) => void;
  onUpdated?: (event: OrderEvent) => void;
  onStatusChanged?: (event: OrderEvent) => void;
  onShipped?: (event: OrderEvent) => void;
  onDelivered?: (event: OrderEvent) => void;
  onCancelled?: (event: OrderEvent) => void;
  onRefunded?: (event: OrderEvent) => void;
}

export const useRealtimeOrders = (options: UseRealtimeOrdersOptions = {}) => {
  const queryClient = useQueryClient();
  const wsClient = getWebSocketClient();
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleOrderEvent = useCallback((event: OrderEvent) => {
    logger.info('Received order event', { type: event.type, orderId: event.orderId });

    switch (event.type) {
      case 'order:created': {
        // Invalidate orders list to include new order
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        optionsRef.current.onCreated?.(event);
        break;
      }
      case 'order:updated': {
        // Update order detail if present in cache
        if (event.order) {
          queryClient.setQueryData(queryKeys.order(event.orderId), event.order);
        }
        // Invalidate list for consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        optionsRef.current.onUpdated?.(event);
        break;
      }
      case 'order:status_changed': {
        // Patch order status in caches
        queryClient.setQueryData(queryKeys.order(event.orderId), (old: Order | undefined) => {
          if (!old) return old;
          return { ...old, status: event.newStatus as Order['status'], updatedAt: event.timestamp };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        optionsRef.current.onStatusChanged?.(event);
        break;
      }
      case 'order:shipped': {
        queryClient.setQueryData(queryKeys.order(event.orderId), (old: Order | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'shipped' as Order['status'],
            trackingInfo: event.trackingInfo,
            updatedAt: event.timestamp
          };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        optionsRef.current.onShipped?.(event);
        break;
      }
      case 'order:delivered': {
        queryClient.setQueryData(queryKeys.order(event.orderId), (old: Order | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'delivered' as Order['status'],
            deliveredAt: event.timestamp
          };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        optionsRef.current.onDelivered?.(event);
        break;
      }
      case 'order:cancelled': {
        queryClient.setQueryData(queryKeys.order(event.orderId), (old: Order | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'cancelled' as Order['status'],
            cancelledAt: event.timestamp
          };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        optionsRef.current.onCancelled?.(event);
        break;
      }
      case 'order:refunded': {
        queryClient.setQueryData(queryKeys.order(event.orderId), (old: Order | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'refunded' as Order['status'],
            refundedAt: event.timestamp
          };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        optionsRef.current.onRefunded?.(event);
        break;
      }
    }
  }, [queryClient]);

  useEffect(() => {
    if (!options.enabled) return;

    // subscribe to events
    wsClient.on('order:created', handleOrderEvent);
    wsClient.on('order:updated', handleOrderEvent);
    wsClient.on('order:status_changed', handleOrderEvent);
    wsClient.on('order:shipped', handleOrderEvent);
    wsClient.on('order:delivered', handleOrderEvent);
    wsClient.on('order:cancelled', handleOrderEvent);
    wsClient.on('order:refunded', handleOrderEvent);

    wsClient.subscribeToOrders(options.filters);

    return () => {
      wsClient.off('order:created', handleOrderEvent);
      wsClient.off('order:updated', handleOrderEvent);
      wsClient.off('order:status_changed', handleOrderEvent);
      wsClient.off('order:shipped', handleOrderEvent);
      wsClient.off('order:delivered', handleOrderEvent);
      wsClient.off('order:cancelled', handleOrderEvent);
      wsClient.off('order:refunded', handleOrderEvent);
    };
  }, [options.enabled, options.filters, handleOrderEvent, wsClient]);

  return {
    isConnected: wsClient.isConnected,
    connectionStatus: wsClient.connectionStatus,
    forceReconnect: wsClient.forceReconnect.bind(wsClient)
  };
};
































































