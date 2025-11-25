import { useState, useEffect, useCallback, useRef } from 'react';
import { useDropsStore } from '../store/drops';
import { useShopStore } from '../store/shop';

export interface WebSocketMessage {
  type: 'drop_update' | 'new_purchase' | 'invite_activated' | 'coin_reward' | 'activity' | 'ping' | 'pong';
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  url: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  useExponentialBackoff?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = ({
  url,
  enabled = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  useExponentialBackoff = true,
  onMessage,
  onConnect,
  onDisconnect,
  onError
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const messageQueue = useRef<Array<{ message: any; priority: number; timestamp: number }>>([]);
  const lastMessageTime = useRef<number>(0);
  const messageThrottle = 50; // Reduced to 50ms for better responsiveness
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalMs = 30000; // 30 seconds
  const lastPongTime = useRef<number>(Date.now());
  const connectionStateRef = useRef<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const isManualCloseRef = useRef<boolean>(false);
  const optionsRef = useRef({ reconnectInterval, maxReconnectAttempts, useExponentialBackoff, enabled });
  const connectRef = useRef<(() => void) | null>(null);
  
  // 🚀 Performance Optimizations
  const messageBatchTimer = useRef<NodeJS.Timeout | null>(null);
  const BATCH_INTERVAL = 50; // Batch messages every 50ms
  const MAX_BATCH_SIZE = 10;
  const connectionQuality = useRef({ latency: 0, packetLoss: 0, lastPing: 0 });
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const networkHandlersRef = useRef<{ online: () => void; offline: () => void } | null>(null);

  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = { reconnectInterval, maxReconnectAttempts, useExponentialBackoff, enabled };
  }, [reconnectInterval, maxReconnectAttempts, useExponentialBackoff, enabled]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const clearHeartbeat = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  }, []);

  const clearBatchTimer = useCallback(() => {
    if (messageBatchTimer.current) {
      clearTimeout(messageBatchTimer.current);
      messageBatchTimer.current = null;
    }
  }, []);

  const processMessageBatch = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || messageQueue.current.length === 0) {
      clearBatchTimer();
      return;
    }

    // Sort by priority (higher first), then by timestamp (older first)
    messageQueue.current.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    // Process up to MAX_BATCH_SIZE messages
    const batch = messageQueue.current.splice(0, MAX_BATCH_SIZE);
    
    batch.forEach(({ message }) => {
      try {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        wsRef.current?.send(messageStr);
        lastMessageTime.current = Date.now();
      } catch (error) {
        console.error('[WebSocket] Failed to send batched message:', error);
        // Re-queue failed message with lower priority
        messageQueue.current.unshift({ message, priority: 0, timestamp: Date.now() });
      }
    });

    clearBatchTimer();

    // Schedule next batch if queue is not empty
    if (messageQueue.current.length > 0) {
      messageBatchTimer.current = setTimeout(() => {
        processMessageBatch();
      }, BATCH_INTERVAL);
    }
  }, [clearBatchTimer]);

  const attemptReconnect = useCallback(() => {
    const { enabled, maxReconnectAttempts, reconnectInterval, useExponentialBackoff } = optionsRef.current;
    
    if (!enabled) {
      return;
    }
    
    // Prevent infinite reconnect loops
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      if (import.meta.env.DEV) {
        console.warn(`[WebSocket] Max reconnection attempts (${maxReconnectAttempts}) reached. Stopping reconnection.`);
      }
      connectionStateRef.current = 'disconnected';
      setIsConnected(false);
      return;
    }

    // Don't reconnect if we're already reconnecting
    if (connectionStateRef.current === 'reconnecting') {
      return;
    }

    connectionStateRef.current = 'reconnecting';
    reconnectAttemptsRef.current += 1;
    
    const delay = useExponentialBackoff 
      ? Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000)
      : reconnectInterval;
    
    // Only log in dev mode to reduce console spam
    if (import.meta.env.DEV) {
      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      // Only connect if still enabled and not manually closed
      if (optionsRef.current.enabled && !isManualCloseRef.current && connectRef.current) {
        connectRef.current();
      }
    }, delay);
  }, []);

  const connect = useCallback(() => {
    const { enabled } = optionsRef.current;
    
    // Validate URL
    if (!url) {
      if (import.meta.env.DEV) {
        console.warn('[WebSocket] No URL provided, skipping connection');
      }
      return;
    }
    
    // Convert HTTP/HTTPS URLs to WebSocket URLs
    let wsUrl = url;
    if (url.startsWith('http://')) {
      wsUrl = url.replace('http://', 'ws://');
    } else if (url.startsWith('https://')) {
      wsUrl = url.replace('https://', 'wss://');
    } else if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      if (import.meta.env.DEV) {
        console.error('[WebSocket] Invalid URL format:', url);
      }
      return;
    }

    // Don't connect if disabled
    if (!enabled) {
      if (import.meta.env.DEV) {
        console.debug('[WebSocket] Connection disabled, skipping');
      }
      return;
    }
    
    // Prevent multiple simultaneous connection attempts
    if (connectionStateRef.current === 'connecting' || connectionStateRef.current === 'connected') {
      if (import.meta.env.DEV) {
        console.debug('[WebSocket] Already connecting/connected, skipping new connection attempt');
      }
      return;
    }
    
    // Use the converted WebSocket URL
    const finalUrl = wsUrl;
    
    const currentState = wsRef.current?.readyState;
    if (currentState === WebSocket.OPEN || currentState === WebSocket.CONNECTING) {
      return;
    }

    // Clean up any existing connection
    if (wsRef.current) {
      try {
        wsRef.current.onopen = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        if (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      } catch (err) {
        // Ignore cleanup errors
      }
    }

    try {
      connectionStateRef.current = 'connecting';
      const ws = new WebSocket(finalUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (import.meta.env.DEV) {
          console.log('[WebSocket] Connected to', finalUrl);
        }
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        connectionStateRef.current = 'connected';
        lastPongTime.current = Date.now();
        clearReconnectTimeout();
        
        // Process queued messages in batches
        if (messageQueue.current.length > 0) {
          processMessageBatch();
        }
        
        onConnect?.();
        
        // Start heartbeat
        clearHeartbeat();
        heartbeatInterval.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
              
              // Check if we haven't received a pong in too long (connection might be dead)
              const timeSinceLastPong = Date.now() - lastPongTime.current;
              if (timeSinceLastPong > heartbeatIntervalMs * 3) {
                console.warn('[WebSocket] No pong received, connection might be dead. Closing connection.');
                connectionQuality.current.packetLoss += 1;
                wsRef.current.close(1000, 'No pong received');
              } else {
                // Update connection quality
                connectionQuality.current.lastPing = Date.now();
              }
            } catch (err) {
              console.error('[WebSocket] Heartbeat failed:', err);
              if (wsRef.current) {
                wsRef.current.close(1000, 'Heartbeat failed');
              }
            }
          } else {
            clearHeartbeat();
          }
        }, heartbeatIntervalMs);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle pong responses with latency measurement
          if (message.type === 'pong' || (message as any).type === 'pong') {
            lastPongTime.current = Date.now();
            if ((message as any).timestamp) {
              const latency = Date.now() - (message as any).timestamp;
              connectionQuality.current.latency = latency;
              connectionQuality.current.packetLoss = 0; // Reset on successful pong
            }
            return;
          }
          
          setLastMessage(message);
          onMessage?.(message);

          // Handle different message types
          switch (message.type) {
            case 'drop_update':
              if (message.data?.dropId && message.data.progress !== undefined) {
                useDropsStore.getState().applyProgress(message.data.dropId, message.data.progress);
              }
              break;
            
            case 'new_purchase':
              // Activity feed will handle this via onMessage callback
              break;
            
            case 'invite_activated':
              // Could trigger achievement toast
              break;
            
            case 'coin_reward':
              if (message.data?.amount) {
                useShopStore.getState().addCoins(message.data.amount);
              }
              break;
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error, event.data);
        }
      };

      ws.onerror = (error) => {
        // Only log in dev mode to reduce console spam
        // The onclose handler will handle the actual error state
        if (import.meta.env.DEV) {
          console.error('[WebSocket] Error:', error);
        }
        // Don't call onError here as onclose will handle it
        // This prevents duplicate error handling
      };

      ws.onclose = (event) => {
        const wasConnected = connectionStateRef.current === 'connected';
        
        // Only log in dev mode to reduce console spam
        if (import.meta.env.DEV) {
          console.log('[WebSocket] Disconnected', { 
            code: event.code, 
            reason: event.reason || 'No reason provided',
            wasConnected,
            wasManualClose: isManualCloseRef.current
          });
        }
        
        setIsConnected(false);
        connectionStateRef.current = 'disconnected';
        clearHeartbeat();
        
        // Clean up WebSocket reference
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        
        if (wasConnected) {
          onDisconnect?.();
        }

        // Don't reconnect on:
        // - Manual close
        // - Normal closure (1000)
        // - Going away (1001) - server shutdown
        // - Protocol error (1002)
        // - Unsupported data (1003)
        // - No status received (1005)
        // - Abnormal closure (1006) - but only if we weren't connected (prevents spam)
        const shouldReconnect = !isManualCloseRef.current && 
          event.code !== 1000 && 
          event.code !== 1001 && 
          event.code !== 1002 && 
          event.code !== 1003 &&
          event.code !== 1005 &&
          !(event.code === 1006 && !wasConnected); // Don't reconnect on 1006 if we were never connected
        
        if (shouldReconnect) {
          attemptReconnect();
        } else {
          isManualCloseRef.current = false;
          // Reset reconnect attempts if it was a normal closure
          if (event.code === 1000) {
            reconnectAttemptsRef.current = 0;
          }
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      connectionStateRef.current = 'disconnected';
      setIsConnected(false);
      
      // Attempt reconnect on connection failure
      attemptReconnect();
    }
  }, [url, onConnect, onDisconnect, onError, onMessage, clearReconnectTimeout, clearHeartbeat, attemptReconnect]);

  // Update connect ref whenever connect changes
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    isManualCloseRef.current = true;
    clearReconnectTimeout();
    clearHeartbeat();
    clearBatchTimer();
    
    // Cleanup visibility and network handlers
    if (visibilityHandlerRef.current) {
      document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      visibilityHandlerRef.current = null;
    }
    if (networkHandlersRef.current) {
      window.removeEventListener('online', networkHandlersRef.current.online);
      window.removeEventListener('offline', networkHandlersRef.current.offline);
      networkHandlersRef.current = null;
    }
    
    if (wsRef.current) {
      try {
        const currentState = wsRef.current.readyState;
        if (currentState === WebSocket.CONNECTING || currentState === WebSocket.OPEN) {
          wsRef.current.close(1000, 'Manual disconnect');
        }
      } catch (err) {
        console.error('[WebSocket] Error during disconnect:', err);
      }
      wsRef.current = null;
    }
    
    setIsConnected(false);
    connectionStateRef.current = 'disconnected';
    reconnectAttemptsRef.current = 0;
  }, [clearReconnectTimeout, clearHeartbeat, clearBatchTimer]);

  const sendMessage = useCallback((message: any, priority: number = 0) => {
    if (!message) {
      console.warn('[WebSocket] Cannot send empty message');
      return false;
    }

    const now = Date.now();
    
    // Queue message with priority and timestamp
    const queuedMessage = { message, priority, timestamp: now };
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Check throttle
      if (now - lastMessageTime.current < messageThrottle) {
        messageQueue.current.push(queuedMessage);
        // Start batch timer if not already running
        if (!messageBatchTimer.current) {
          messageBatchTimer.current = setTimeout(() => {
            processMessageBatch();
          }, BATCH_INTERVAL);
        }
        return true;
      }
      
      try {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        wsRef.current.send(messageStr);
        lastMessageTime.current = now;
        return true;
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
        // Queue message for retry with lower priority
        messageQueue.current.push({ ...queuedMessage, priority: Math.max(0, priority - 1) });
        return false;
      }
    }
    
    // Queue message if not connected (but only if enabled)
    if (optionsRef.current.enabled) {
      messageQueue.current.push(queuedMessage);
      if (connectionStateRef.current !== 'connecting' && connectionStateRef.current !== 'reconnecting') {
        console.warn('[WebSocket] Message queued, not connected. Connection state:', connectionStateRef.current);
      }
    } else {
      console.warn('[WebSocket] Cannot queue message, WebSocket is disabled');
    }
    return false;
  }, [processMessageBatch]);

  // Handle URL changes
  const urlRef = useRef(url);
  useEffect(() => {
    if (urlRef.current !== url) {
      urlRef.current = url;
      // Reconnect if URL changes and we're enabled
      if (optionsRef.current.enabled && (isConnected || connectionStateRef.current === 'connecting' || connectionStateRef.current === 'reconnecting')) {
        disconnect();
        // Small delay before reconnecting with new URL
        setTimeout(() => {
          if (optionsRef.current.enabled) {
            connect();
          }
        }, 100);
      }
    }
  }, [url, isConnected, connect, disconnect]);

  // Setup visibility and network handlers
  useEffect(() => {
    if (!optionsRef.current.enabled) return;

    // Reconnect when tab becomes visible
    visibilityHandlerRef.current = () => {
      if (document.visibilityState === 'visible' && !isConnected && connectionStateRef.current !== 'connecting' && connectionStateRef.current !== 'reconnecting') {
        console.log('[WebSocket] Tab visible, attempting reconnection...');
        reconnectAttemptsRef.current = 0;
        connect();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandlerRef.current);

    // Handle network online/offline
    networkHandlersRef.current = {
      online: () => {
        if (!isConnected && connectionStateRef.current !== 'connecting' && connectionStateRef.current !== 'reconnecting') {
          console.log('[WebSocket] Network online, attempting reconnection...');
          reconnectAttemptsRef.current = 0;
          connect();
        }
      },
      offline: () => {
        console.warn('[WebSocket] Network offline, will reconnect when available');
      }
    };
    window.addEventListener('online', networkHandlersRef.current.online);
    window.addEventListener('offline', networkHandlersRef.current.offline);

    return () => {
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      }
      if (networkHandlersRef.current) {
        window.removeEventListener('online', networkHandlersRef.current.online);
        window.removeEventListener('offline', networkHandlersRef.current.offline);
      }
    };
  }, [isConnected, connect]);

  useEffect(() => {
    if (optionsRef.current.enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect: useCallback(() => {
      reconnectAttemptsRef.current = 0;
      disconnect();
      setTimeout(() => {
        if (optionsRef.current.enabled) {
          connect();
        }
      }, 100);
    }, [connect, disconnect]),
    disconnect,
    reconnectAttempts: reconnectAttemptsRef.current,
    connectionQuality: connectionQuality.current,
    queuedMessages: messageQueue.current.length
  };
};



