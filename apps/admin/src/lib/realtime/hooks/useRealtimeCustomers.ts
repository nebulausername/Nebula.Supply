import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';
import { queryKeys } from '../../api/hooks';

export interface CustomerEvent {
  type: 'customer:created' | 'customer:updated' | 'customer:activity' | 'customer:order_placed';
  customerId: string;
  customer?: any;
  activity?: any;
  orderId?: string;
  timestamp: string;
}

export interface UseRealtimeCustomersOptions extends UseRealtimeOptions {
  filters?: {
    customerIds?: string[];
  };
  onCreated?: (event: CustomerEvent) => void;
  onUpdated?: (event: CustomerEvent) => void;
  onActivity?: (event: CustomerEvent) => void;
  onOrderPlaced?: (event: CustomerEvent) => void;
}

export function useRealtimeCustomers(options: UseRealtimeCustomersOptions = {}) {
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

  const handleEvent = useCallback((event: CustomerEvent) => {
    logger.info('[useRealtimeCustomers] Event received:', event.type);

    switch (event.type) {
      case 'customer:created':
        queryClient.invalidateQueries({ queryKey: queryKeys.customers?.() || ['customers'] });
        optionsRef.current.onCreated?.(event);
        break;
      case 'customer:updated':
        queryClient.invalidateQueries({ queryKey: queryKeys.customers?.() || ['customers'] });
        if (event.customerId) {
          queryClient.invalidateQueries({ queryKey: ['customers', event.customerId] });
        }
        optionsRef.current.onUpdated?.(event);
        break;
      case 'customer:activity':
        optionsRef.current.onActivity?.(event);
        break;
      case 'customer:order_placed':
        queryClient.invalidateQueries({ queryKey: ['customers', event.customerId, 'orders'] });
        optionsRef.current.onOrderPlaced?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToCustomers(options.filters);

    const unsubscribeCreated = subscribe('customer:created', handleEvent);
    const unsubscribeUpdated = subscribe('customer:updated', handleEvent);
    const unsubscribeActivity = subscribe('customer:activity', handleEvent);
    const unsubscribeOrderPlaced = subscribe('customer:order_placed', handleEvent);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeActivity();
      unsubscribeOrderPlaced();
      client.unsubscribeFromCustomers();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

