import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConnectionPool } from './useConnectionPool';
import { getConnectionPool } from '../connectionPool';
import { logger } from '../../logger';
import { KpiUpdateEvent } from '../../types/common';
import { SystemHealth } from '../../lib/realtime';

export interface ActivityEvent {
  type: string;
  message: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface KPIEvent {
  type: 'kpi:updated' | 'activity:new' | 'system:health';
  kpis?: KpiUpdateEvent['data'];
  activity?: ActivityEvent;
  health?: SystemHealth;
  timestamp: string;
}

export interface UseRealtimeKPIsOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onKPIUpdated?: (event: KPIEvent) => void;
  onActivityNew?: (event: KPIEvent) => void;
  onSystemHealth?: (event: KPIEvent) => void;
}

// Generate unique component ID for this hook instance
const generateComponentId = () => `useRealtimeKPIs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function useRealtimeKPIs(options: UseRealtimeKPIsOptions = {}) {
  const queryClient = useQueryClient();
  const componentIdRef = useRef(generateComponentId());
  const poolRef = useRef(getConnectionPool());
  
  const { subscribe, isConnected, connectionStatus, metrics } = useConnectionPool(
    componentIdRef.current,
    {
      enabled: options.enabled,
      onConnect: options.onConnect,
      onDisconnect: options.onDisconnect,
      onError: options.onError
    }
  );

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleKPIEvent = useCallback((event: KPIEvent) => {
    logger.info('[useRealtimeKPIs] Event received:', event.type);

    switch (event.type) {
      case 'kpi:updated':
        queryClient.invalidateQueries({ queryKey: ['kpis'] });
        optionsRef.current.onKPIUpdated?.(event);
        break;
      case 'activity:new':
        queryClient.invalidateQueries({ queryKey: ['activity'] });
        optionsRef.current.onActivityNew?.(event);
        break;
      case 'system:health':
        queryClient.invalidateQueries({ queryKey: ['system', 'health'] });
        optionsRef.current.onSystemHealth?.(event);
        break;
    }
  }, [queryClient]);

  // Subscribe to KPI events
  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    const pool = poolRef.current.getClient();

    // Listen to direct event names from WebSocket
    const handleKPIUpdatedEvent = (data: any) => {
      handleKPIEvent({
        type: 'kpi:updated',
        kpis: data,
        timestamp: new Date().toISOString()
      });
    };

    const handleActivityEvent = (data: any) => {
      handleKPIEvent({
        type: 'activity:new',
        activity: data,
        timestamp: new Date().toISOString()
      });
    };

    const handleSystemHealthEvent = (data: any) => {
      handleKPIEvent({
        type: 'system:health',
        health: data,
        timestamp: new Date().toISOString()
      });
    };

    // Subscribe via connection pool for topic-based subscription
    const unsubscribeKPIUpdated = subscribe('kpis', handleKPIUpdatedEvent);
    const unsubscribeActivityNew = subscribe('activity', handleActivityEvent);
    const unsubscribeSystemHealth = subscribe('system_health', handleSystemHealthEvent);

    // Also listen to direct event names (for backward compatibility)
    pool.on('kpi:updated', handleKPIUpdatedEvent);
    pool.on('kpi:stats_changed', handleKPIUpdatedEvent);
    pool.on('activity:new', handleActivityEvent);
    pool.on('system:health', handleSystemHealthEvent);

    return () => {
      unsubscribeKPIUpdated();
      unsubscribeActivityNew();
      unsubscribeSystemHealth();
      pool.off('kpi:updated', handleKPIUpdatedEvent);
      pool.off('kpi:stats_changed', handleKPIUpdatedEvent);
      pool.off('activity:new', handleActivityEvent);
      pool.off('system:health', handleSystemHealthEvent);
    };
  }, [isConnected, options.enabled, subscribe, handleKPIEvent]);

  return {
    isConnected,
    connectionStatus,
    metrics
  };
}

