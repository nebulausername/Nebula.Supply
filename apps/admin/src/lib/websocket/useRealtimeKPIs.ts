import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getWebSocketClient } from './client';
import { logger } from '../logger';
import { queryKeys } from '../api/hooks';

export interface KPIEvent {
  type: 'kpi:updated' | 'kpi:stats_changed';
  kpis?: any;
  stats?: any;
  timestamp: string;
}

export interface UseRealtimeKPIsOptions {
  enabled?: boolean;
  onUpdated?: (event: KPIEvent) => void;
}

export const useRealtimeKPIs = (options: UseRealtimeKPIsOptions = {}) => {
  const queryClient = useQueryClient();
  const wsClient = getWebSocketClient();
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleKPIEvent = useCallback((event: KPIEvent) => {
    logger.info('Received KPI event', { type: event.type });

    switch (event.type) {
      case 'kpi:updated': {
        // Update KPI data in cache
        if (event.kpis) {
          queryClient.setQueryData(queryKeys.dashboard.kpis, (old: any) => ({
            ...old,
            ...event.kpis,
            timestamp: event.timestamp
          }));
        }
        optionsRef.current.onUpdated?.(event);
        break;
      }
      case 'kpi:stats_changed': {
        // Update ticket stats in cache
        if (event.stats) {
          queryClient.setQueryData(queryKeys.tickets.stats, (old: any) => ({
            ...old,
            ...event.stats,
            timestamp: event.timestamp
          }));
        }
        // Also invalidate to ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.kpis });
        optionsRef.current.onUpdated?.(event);
        break;
      }
    }
  }, [queryClient]);

  useEffect(() => {
    if (options.enabled === false) return;

    const wsClientInstance = wsClient;

    // Subscribe to KPI events
    wsClientInstance.on('kpi:updated', handleKPIEvent);
    wsClientInstance.on('kpi:stats_changed', handleKPIEvent);

    // Subscribe to KPIs stream via WebSocket
    const subscribeIfConnected = () => {
      if (wsClientInstance.isConnected) {
        wsClientInstance.subscribeToKPIs();
      }
    };

    // Subscribe immediately if already connected
    subscribeIfConnected();

    // Subscribe when connection is established
    wsClientInstance.on('status', (status: any) => {
      if (status.connected) {
        subscribeIfConnected();
      }
    });

    return () => {
      wsClientInstance.off('kpi:updated', handleKPIEvent);
      wsClientInstance.off('kpi:stats_changed', handleKPIEvent);
    };
  }, [options.enabled, handleKPIEvent, wsClient]);

  return {
    isConnected: wsClient.isConnected,
    connectionStatus: wsClient.connectionStatus,
    forceReconnect: wsClient.forceReconnect.bind(wsClient)
  };
};

