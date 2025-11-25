import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';

export interface SecurityEvent {
  type: 'security:threat_detected' | 'security:event_logged' | 'security:policy_updated' | 'security:breach_detected';
  threatId?: string;
  threat?: any;
  event?: any;
  policy?: any;
  breach?: any;
  timestamp: string;
}

export interface UseRealtimeSecurityOptions extends UseRealtimeOptions {
  onThreatDetected?: (event: SecurityEvent) => void;
  onEventLogged?: (event: SecurityEvent) => void;
  onPolicyUpdated?: (event: SecurityEvent) => void;
  onBreachDetected?: (event: SecurityEvent) => void;
}

export function useRealtimeSecurity(options: UseRealtimeSecurityOptions = {}) {
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

  const handleEvent = useCallback((event: SecurityEvent) => {
    logger.info('[useRealtimeSecurity] Event received:', event.type);

    switch (event.type) {
      case 'security:threat_detected':
        queryClient.invalidateQueries({ queryKey: ['security', 'threats'] });
        optionsRef.current.onThreatDetected?.(event);
        break;
      case 'security:event_logged':
        queryClient.invalidateQueries({ queryKey: ['security', 'events'] });
        optionsRef.current.onEventLogged?.(event);
        break;
      case 'security:policy_updated':
        queryClient.invalidateQueries({ queryKey: ['security', 'policies'] });
        optionsRef.current.onPolicyUpdated?.(event);
        break;
      case 'security:breach_detected':
        queryClient.invalidateQueries({ queryKey: ['security', 'breaches'] });
        optionsRef.current.onBreachDetected?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToSecurity();

    const unsubscribeThreatDetected = subscribe('security:threat_detected', handleEvent);
    const unsubscribeEventLogged = subscribe('security:event_logged', handleEvent);
    const unsubscribePolicyUpdated = subscribe('security:policy_updated', handleEvent);
    const unsubscribeBreachDetected = subscribe('security:breach_detected', handleEvent);

    return () => {
      unsubscribeThreatDetected();
      unsubscribeEventLogged();
      unsubscribePolicyUpdated();
      unsubscribeBreachDetected();
      client.unsubscribeFromSecurity();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent]);

  return {
    isConnected
  };
}

