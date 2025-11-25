import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';
import { queryKeys } from '../../api/hooks';

export interface UserEvent {
  type: 'user:created' | 'user:updated' | 'user:logged_in' | 'user:permission_changed';
  userId: string;
  user?: any;
  permissions?: string[];
  timestamp: string;
}

export interface UseRealtimeUsersOptions extends UseRealtimeOptions {
  filters?: {
    userIds?: string[];
  };
  onCreated?: (event: UserEvent) => void;
  onUpdated?: (event: UserEvent) => void;
  onLoggedIn?: (event: UserEvent) => void;
  onPermissionChanged?: (event: UserEvent) => void;
}

export function useRealtimeUsers(options: UseRealtimeUsersOptions = {}) {
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

  const handleEvent = useCallback((event: UserEvent) => {
    logger.info('[useRealtimeUsers] Event received:', event.type);

    switch (event.type) {
      case 'user:created':
        queryClient.invalidateQueries({ queryKey: queryKeys.users?.() || ['users'] });
        optionsRef.current.onCreated?.(event);
        break;
      case 'user:updated':
        queryClient.invalidateQueries({ queryKey: queryKeys.users?.() || ['users'] });
        if (event.userId) {
          queryClient.invalidateQueries({ queryKey: ['users', event.userId] });
        }
        optionsRef.current.onUpdated?.(event);
        break;
      case 'user:logged_in':
        optionsRef.current.onLoggedIn?.(event);
        break;
      case 'user:permission_changed':
        queryClient.invalidateQueries({ queryKey: ['users', event.userId] });
        optionsRef.current.onPermissionChanged?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToUsers(options.filters);

    const unsubscribeCreated = subscribe('user:created', handleEvent);
    const unsubscribeUpdated = subscribe('user:updated', handleEvent);
    const unsubscribeLoggedIn = subscribe('user:logged_in', handleEvent);
    const unsubscribePermissionChanged = subscribe('user:permission_changed', handleEvent);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeLoggedIn();
      unsubscribePermissionChanged();
      client.unsubscribeFromUsers();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

