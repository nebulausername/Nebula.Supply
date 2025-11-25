import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';

export interface SettingsEvent {
  type: 'config:updated' | 'config:validated' | 'config:error' | 'system:status_changed';
  config?: any;
  error?: string;
  status?: string;
  timestamp: string;
}

export interface UseRealtimeSettingsOptions extends UseRealtimeOptions {
  onConfigUpdated?: (event: SettingsEvent) => void;
  onConfigValidated?: (event: SettingsEvent) => void;
  onConfigError?: (event: SettingsEvent) => void;
  onSystemStatusChanged?: (event: SettingsEvent) => void;
}

export function useRealtimeSettings(options: UseRealtimeSettingsOptions = {}) {
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

  const handleEvent = useCallback((event: SettingsEvent) => {
    logger.info('[useRealtimeSettings] Event received:', event.type);

    switch (event.type) {
      case 'config:updated':
        queryClient.invalidateQueries({ queryKey: ['settings', 'config'] });
        optionsRef.current.onConfigUpdated?.(event);
        break;
      case 'config:validated':
        queryClient.invalidateQueries({ queryKey: ['settings', 'config'] });
        optionsRef.current.onConfigValidated?.(event);
        break;
      case 'config:error':
        optionsRef.current.onConfigError?.(event);
        break;
      case 'system:status_changed':
        queryClient.invalidateQueries({ queryKey: ['settings', 'system'] });
        optionsRef.current.onSystemStatusChanged?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToSettings();

    const unsubscribeConfigUpdated = subscribe('config:updated', handleEvent);
    const unsubscribeConfigValidated = subscribe('config:validated', handleEvent);
    const unsubscribeConfigError = subscribe('config:error', handleEvent);
    const unsubscribeSystemStatusChanged = subscribe('system:status_changed', handleEvent);

    return () => {
      unsubscribeConfigUpdated();
      unsubscribeConfigValidated();
      unsubscribeConfigError();
      unsubscribeSystemStatusChanged();
      client.unsubscribeFromSettings();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent]);

  return {
    isConnected
  };
}

