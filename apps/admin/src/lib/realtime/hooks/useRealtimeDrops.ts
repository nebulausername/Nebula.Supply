import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';
import { queryKeys } from '../../api/hooks';

export interface DropEvent {
  type: 'drop:created' | 'drop:status_changed' | 'drop:live' | 'drop:ended' | 'drop:updated';
  dropId: string;
  drop?: any;
  oldStatus?: string;
  newStatus?: string;
  timestamp: string;
}

export interface UseRealtimeDropsOptions extends UseRealtimeOptions {
  filters?: {
    dropIds?: string[];
  };
  onCreated?: (event: DropEvent) => void;
  onStatusChanged?: (event: DropEvent) => void;
  onLive?: (event: DropEvent) => void;
  onEnded?: (event: DropEvent) => void;
  onUpdated?: (event: DropEvent) => void;
}

export function useRealtimeDrops(options: UseRealtimeDropsOptions = {}) {
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

  const handleEvent = useCallback((event: DropEvent) => {
    logger.info('[useRealtimeDrops] Event received:', event.type);

    switch (event.type) {
      case 'drop:created':
        queryClient.invalidateQueries({ queryKey: queryKeys.drops?.() || ['drops'] });
        optionsRef.current.onCreated?.(event);
        break;
      case 'drop:status_changed':
        queryClient.invalidateQueries({ queryKey: queryKeys.drops?.() || ['drops'] });
        if (event.dropId) {
          queryClient.invalidateQueries({ queryKey: ['drops', event.dropId] });
        }
        optionsRef.current.onStatusChanged?.(event);
        break;
      case 'drop:live':
        queryClient.invalidateQueries({ queryKey: ['drops', 'live'] });
        optionsRef.current.onLive?.(event);
        break;
      case 'drop:ended':
        queryClient.invalidateQueries({ queryKey: queryKeys.drops?.() || ['drops'] });
        optionsRef.current.onEnded?.(event);
        break;
      case 'drop:updated':
        queryClient.invalidateQueries({ queryKey: queryKeys.drops?.() || ['drops'] });
        if (event.dropId) {
          queryClient.invalidateQueries({ queryKey: ['drops', event.dropId] });
        }
        optionsRef.current.onUpdated?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToDrops(options.filters);

    const unsubscribeCreated = subscribe('drop:created', handleEvent);
    const unsubscribeStatusChanged = subscribe('drop:status_changed', handleEvent);
    const unsubscribeLive = subscribe('drop:live', handleEvent);
    const unsubscribeEnded = subscribe('drop:ended', handleEvent);
    const unsubscribeUpdated = subscribe('drop:updated', handleEvent);

    return () => {
      unsubscribeCreated();
      unsubscribeStatusChanged();
      unsubscribeLive();
      unsubscribeEnded();
      unsubscribeUpdated();
      client.unsubscribeFromDrops();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

