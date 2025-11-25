import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';

export interface MaintenanceEvent {
  type: 'maintenance:started' | 'maintenance:status_changed' | 'maintenance:completed' | 'maintenance:error';
  status?: string;
  error?: string;
  timestamp: string;
}

export interface UseRealtimeMaintenanceOptions extends UseRealtimeOptions {
  onStarted?: (event: MaintenanceEvent) => void;
  onStatusChanged?: (event: MaintenanceEvent) => void;
  onCompleted?: (event: MaintenanceEvent) => void;
  onError?: (event: MaintenanceEvent) => void;
}

export function useRealtimeMaintenance(options: UseRealtimeMaintenanceOptions = {}) {
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

  const handleEvent = useCallback((event: MaintenanceEvent) => {
    logger.info('[useRealtimeMaintenance] Event received:', event.type);

    switch (event.type) {
      case 'maintenance:started':
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        optionsRef.current.onStarted?.(event);
        break;
      case 'maintenance:status_changed':
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        optionsRef.current.onStatusChanged?.(event);
        break;
      case 'maintenance:completed':
        queryClient.invalidateQueries({ queryKey: ['maintenance'] });
        optionsRef.current.onCompleted?.(event);
        break;
      case 'maintenance:error':
        optionsRef.current.onError?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToMaintenance();

    const unsubscribeStarted = subscribe('maintenance:started', handleEvent);
    const unsubscribeStatusChanged = subscribe('maintenance:status_changed', handleEvent);
    const unsubscribeCompleted = subscribe('maintenance:completed', handleEvent);
    const unsubscribeError = subscribe('maintenance:error', handleEvent);

    return () => {
      unsubscribeStarted();
      unsubscribeStatusChanged();
      unsubscribeCompleted();
      unsubscribeError();
      client.unsubscribeFromMaintenance();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent]);

  return {
    isConnected
  };
}

