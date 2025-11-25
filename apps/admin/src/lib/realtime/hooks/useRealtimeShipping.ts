import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';
import { queryKeys } from '../../api/hooks';

export interface ShippingEvent {
  type: 'shipping:label_created' | 'shipping:tracking_updated' | 'shipping:delivered' | 'shipping:carrier_error';
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  status?: string;
  error?: string;
  timestamp: string;
}

export interface UseRealtimeShippingOptions extends UseRealtimeOptions {
  filters?: {
    orderIds?: string[];
  };
  onLabelCreated?: (event: ShippingEvent) => void;
  onTrackingUpdated?: (event: ShippingEvent) => void;
  onDelivered?: (event: ShippingEvent) => void;
  onCarrierError?: (event: ShippingEvent) => void;
}

export function useRealtimeShipping(options: UseRealtimeShippingOptions = {}) {
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

  const handleEvent = useCallback((event: ShippingEvent) => {
    logger.info('[useRealtimeShipping] Event received:', event.type);

    switch (event.type) {
      case 'shipping:label_created':
        queryClient.invalidateQueries({ queryKey: queryKeys.orders?.() || ['orders'] });
        if (event.orderId) {
          queryClient.invalidateQueries({ queryKey: ['orders', event.orderId] });
        }
        optionsRef.current.onLabelCreated?.(event);
        break;
      case 'shipping:tracking_updated':
        if (event.orderId) {
          queryClient.invalidateQueries({ queryKey: ['orders', event.orderId] });
        }
        optionsRef.current.onTrackingUpdated?.(event);
        break;
      case 'shipping:delivered':
        queryClient.invalidateQueries({ queryKey: queryKeys.orders?.() || ['orders'] });
        if (event.orderId) {
          queryClient.invalidateQueries({ queryKey: ['orders', event.orderId] });
        }
        optionsRef.current.onDelivered?.(event);
        break;
      case 'shipping:carrier_error':
        optionsRef.current.onCarrierError?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToShipping(options.filters);

    const unsubscribeLabelCreated = subscribe('shipping:label_created', handleEvent);
    const unsubscribeTrackingUpdated = subscribe('shipping:tracking_updated', handleEvent);
    const unsubscribeDelivered = subscribe('shipping:delivered', handleEvent);
    const unsubscribeCarrierError = subscribe('shipping:carrier_error', handleEvent);

    return () => {
      unsubscribeLabelCreated();
      unsubscribeTrackingUpdated();
      unsubscribeDelivered();
      unsubscribeCarrierError();
      client.unsubscribeFromShipping();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

