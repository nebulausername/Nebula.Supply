import { useEffect, useCallback, useRef, useState } from 'react';
import { getConnectionPool, Topic, ConnectionStatus, ConnectionMetrics } from '../connectionPool';
import { logger } from '../../logger';

export interface UseConnectionPoolOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface UseConnectionPoolResult {
  subscribe: (topic: Topic, callback: Function, filters?: Record<string, any>) => () => void;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  metrics: ConnectionMetrics;
  activeSubscriptions: number;
}

/**
 * Hook for using the centralized connection pool
 * Automatically handles subscription cleanup on unmount
 */
export function useConnectionPool(
  componentId: string,
  options: UseConnectionPoolOptions = {}
): UseConnectionPoolResult {
  const {
    enabled = true,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const poolRef = useRef(getConnectionPool());
  const [isConnected, setIsConnected] = useState(poolRef.current.isConnected);
  const [connectionStatus, setConnectionStatus] = useState(poolRef.current.getConnectionStatus());
  const [metrics, setMetrics] = useState(poolRef.current.getMetrics());
  const [activeSubscriptions, setActiveSubscriptions] = useState(
    poolRef.current.getActiveSubscriptionsCount()
  );

  // Update connection status
  useEffect(() => {
    if (!enabled) return;

    const pool = poolRef.current;
    const client = pool.getClient();

    const handleStatusChange = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      setIsConnected(status.connected);

      if (status.connected) {
        onConnect?.();
      } else if (!status.reconnecting) {
        onDisconnect?.();
      }

      if (status.error) {
        onError?.(new Error(status.error));
      }
    };

    client.on('status', handleStatusChange);

    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      setMetrics(pool.getMetrics());
      setActiveSubscriptions(pool.getActiveSubscriptionsCount());
    }, 1000);

    return () => {
      client.off('status', handleStatusChange);
      clearInterval(metricsInterval);
    };
  }, [enabled, onConnect, onDisconnect, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (enabled) {
        poolRef.current.unsubscribeAll(componentId);
        logger.info(`[useConnectionPool] Cleaned up subscriptions for ${componentId}`);
      }
    };
  }, [componentId, enabled]);

  const subscribe = useCallback(
    (topic: Topic, callback: Function, filters?: Record<string, any>): (() => void) => {
      if (!enabled) {
        return () => {};
      }

      return poolRef.current.subscribe(topic, callback, componentId, filters);
    },
    [componentId, enabled]
  );

  return {
    subscribe,
    isConnected,
    connectionStatus,
    metrics,
    activeSubscriptions
  };
}

