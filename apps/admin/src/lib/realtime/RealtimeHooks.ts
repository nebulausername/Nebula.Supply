import { useEffect, useState, useCallback, useRef } from 'react';
import { getRealtimeClient, RealtimeClient, ConnectionStatus } from '../realtime';
import { logger } from '../logger';

export interface UseRealtimeOptions {
  enabled?: boolean;
  autoReconnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface UseRealtimeResult {
  client: RealtimeClient;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  subscribe: (event: string, callback: Function) => () => void;
  unsubscribe: (event: string, callback?: Function) => void;
  emit: (event: string, ...args: any[]) => void;
  reconnect: () => void;
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeResult {
  const {
    enabled = true,
    autoReconnect = true,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [client] = useState(() => getRealtimeClient());
  const [isConnected, setIsConnected] = useState(client.isConnected);
  const [connectionStatus, setConnectionStatus] = useState(client.connectionStatus);
  const listenersRef = useRef<Map<string, Set<Function>>>(new Map());

  useEffect(() => {
    if (!enabled) {
      return;
    }

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

    return () => {
      client.off('status', handleStatusChange);
    };
  }, [enabled, client, onConnect, onDisconnect, onError]);

  const subscribe = useCallback((event: string, callback: Function): (() => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    client.on(event, callback);

    return () => {
      unsubscribe(event, callback);
    };
  }, [client]);

  const unsubscribe = useCallback((event: string, callback?: Function) => {
    if (callback) {
      client.off(event, callback);
      listenersRef.current.get(event)?.delete(callback);
    } else {
      client.off(event);
      listenersRef.current.delete(event);
    }
  }, [client]);

  const emit = useCallback((event: string, ...args: any[]) => {
    if (client.socket?.connected) {
      client.socket.emit(event, ...args);
    } else {
      logger.warn(`[useRealtime] Cannot emit ${event}: not connected`);
    }
  }, [client]);

  const reconnect = useCallback(() => {
    client.forceReconnect();
  }, [client]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          client.off(event, callback);
        });
      });
      listenersRef.current.clear();
    };
  }, [client]);

  return {
    client,
    isConnected,
    connectionStatus,
    subscribe,
    unsubscribe,
    emit,
    reconnect
  };
}

export interface UseRealtimeSubscriptionOptions extends UseRealtimeOptions {
  event: string;
  onMessage?: (data: any) => void;
  filter?: (data: any) => boolean;
}

export function useRealtimeSubscription<T = any>(
  options: UseRealtimeSubscriptionOptions
): {
  data: T | null;
  isConnected: boolean;
  error: Error | null;
} {
  const {
    event,
    onMessage,
    filter,
    enabled = true,
    ...realtimeOptions
  } = options;

  const { subscribe, isConnected } = useRealtime({
    ...realtimeOptions,
    enabled
  });

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !isConnected) {
      return;
    }

    const handleMessage = (messageData: any) => {
      try {
        if (filter && !filter(messageData)) {
          return;
        }

        setData(messageData);
        setError(null);
        onMessage?.(messageData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logger.error(`[useRealtimeSubscription] Error handling ${event}:`, error);
      }
    };

    const unsubscribe = subscribe(event, handleMessage);

    return unsubscribe;
  }, [enabled, isConnected, event, subscribe, onMessage, filter]);

  return {
    data,
    isConnected,
    error
  };
}

