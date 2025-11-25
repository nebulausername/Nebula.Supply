import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';

export interface AutomationEvent {
  type: 'automation:triggered' | 'automation:completed' | 'automation:failed' | 'automation:rule_updated';
  automationId?: string;
  automation?: any;
  rule?: any;
  error?: string;
  timestamp: string;
}

export interface UseRealtimeAutomationOptions extends UseRealtimeOptions {
  filters?: {
    automationIds?: string[];
  };
  onTriggered?: (event: AutomationEvent) => void;
  onCompleted?: (event: AutomationEvent) => void;
  onFailed?: (event: AutomationEvent) => void;
  onRuleUpdated?: (event: AutomationEvent) => void;
}

export function useRealtimeAutomation(options: UseRealtimeAutomationOptions = {}) {
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

  const handleEvent = useCallback((event: AutomationEvent) => {
    logger.info('[useRealtimeAutomation] Event received:', event.type);

    switch (event.type) {
      case 'automation:triggered':
        queryClient.invalidateQueries({ queryKey: ['automation'] });
        optionsRef.current.onTriggered?.(event);
        break;
      case 'automation:completed':
        queryClient.invalidateQueries({ queryKey: ['automation'] });
        if (event.automationId) {
          queryClient.invalidateQueries({ queryKey: ['automation', event.automationId] });
        }
        optionsRef.current.onCompleted?.(event);
        break;
      case 'automation:failed':
        queryClient.invalidateQueries({ queryKey: ['automation'] });
        if (event.automationId) {
          queryClient.invalidateQueries({ queryKey: ['automation', event.automationId] });
        }
        optionsRef.current.onFailed?.(event);
        break;
      case 'automation:rule_updated':
        queryClient.invalidateQueries({ queryKey: ['automation', 'rules'] });
        optionsRef.current.onRuleUpdated?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToAutomation(options.filters);

    const unsubscribeTriggered = subscribe('automation:triggered', handleEvent);
    const unsubscribeCompleted = subscribe('automation:completed', handleEvent);
    const unsubscribeFailed = subscribe('automation:failed', handleEvent);
    const unsubscribeRuleUpdated = subscribe('automation:rule_updated', handleEvent);

    return () => {
      unsubscribeTriggered();
      unsubscribeCompleted();
      unsubscribeFailed();
      unsubscribeRuleUpdated();
      client.unsubscribeFromAutomation();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

