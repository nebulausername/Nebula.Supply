import { io, Socket } from 'socket.io-client';
import { useEffect, useState, useCallback } from 'react';
import { logger } from '../logger';

export interface WebSocketClientConfig {
  url: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
  lastConnected?: Date;
}

export type ShopRealtimeChannel =
  | 'products'
  | 'drops'
  | 'inventory'
  | 'categories'
  | 'analytics'
  | 'orders';

interface ShopSubscriptionPayload {
  channels?: ShopRealtimeChannel[];
  scope?: string;
  filters?: Record<string, any>;
}

export class WebSocketClient {
  public socket: Socket | null = null;
  private config: WebSocketClientConfig;
  private status: ConnectionStatus = {
    connected: false,
    reconnecting: false
  };
  private listeners: Map<string, Function[]> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000; // 1 second
  private maxReconnectDelay = 30000; // 30 seconds
  
  // 🚀 Performance Optimizations
  private messageQueue: Array<{ event: string; data: any; priority: number }> = [];
  private messageBatchTimer?: NodeJS.Timeout;
  private readonly BATCH_INTERVAL = 50; // Batch messages every 50ms
  private readonly MAX_BATCH_SIZE = 10; // Max messages per batch
  private connectionQuality = { latency: 0, packetLoss: 0, lastPing: 0 };
  private visibilityHandler?: () => void;
  private networkOnlineHandler?: () => void;
  private networkOfflineHandler?: () => void;

  constructor(config: WebSocketClientConfig) {
    this.config = {
      autoConnect: true,
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      ...config
    };

    // 🎯 Smart Connection Management
    this.setupVisibilityHandlers();
    this.setupNetworkHandlers();

    if (this.config.autoConnect) {
      // Delay connection to ensure DOM is ready
      setTimeout(() => this.connect(), 100);
    }
  }

  private setupVisibilityHandlers(): void {
    // Reconnect when tab becomes visible (user came back)
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible' && !this.socket?.connected && !this.status.reconnecting) {
        logger.info('Tab visible, attempting reconnection...');
        this.reconnectAttempts = 0; // Reset attempts
        this.connect();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private setupNetworkHandlers(): void {
    // Handle online/offline events
    this.networkOnlineHandler = () => {
      if (!this.socket?.connected && !this.status.reconnecting) {
        logger.info('Network online, attempting reconnection...');
        this.reconnectAttempts = 0;
        this.connect();
      }
    };
    
    this.networkOfflineHandler = () => {
      logger.warn('Network offline, will reconnect when available');
      this.updateStatus({ 
        connected: false, 
        reconnecting: false,
        error: 'Network offline'
      });
    };

    window.addEventListener('online', this.networkOnlineHandler);
    window.addEventListener('offline', this.networkOfflineHandler);
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    try {
      const token = localStorage.getItem('nebula_access_token') || undefined;
      
      // Calculate exponential backoff delay
      const calculateDelay = (attempt: number): number => {
        const delay = Math.min(
          this.baseReconnectDelay * Math.pow(2, attempt),
          this.maxReconnectDelay
        );
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * delay;
        return Math.floor(delay + jitter);
      };

      this.socket = io(this.config.url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.baseReconnectDelay,
        reconnectionDelayMax: this.maxReconnectDelay,
        randomizationFactor: 0.3, // Add jitter (0-30% of delay)
        autoConnect: true,
        auth: token ? { token } : undefined
      });

      this.setupEventHandlers();
      this.startHeartbeat();

      logger.info('WebSocket client connecting...', { url: this.config.url });
    } catch (error) {
      logger.error('Failed to create WebSocket connection:', error);
      this.updateStatus({ connected: false, error: 'Connection failed' });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    if (this.messageBatchTimer) {
      clearTimeout(this.messageBatchTimer);
      this.messageBatchTimer = undefined;
    }

    // Cleanup event listeners
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.networkOnlineHandler) {
      window.removeEventListener('online', this.networkOnlineHandler);
    }
    if (this.networkOfflineHandler) {
      window.removeEventListener('offline', this.networkOfflineHandler);
    }

    this.updateStatus({ connected: false, reconnecting: false });
    logger.info('WebSocket client disconnected');
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('WebSocket connected', { socketId: this.socket?.id });
      this.updateStatus({ 
        connected: true, 
        reconnecting: false, 
        lastConnected: new Date(),
        error: undefined 
      });
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('WebSocket disconnected', { reason });
      this.updateStatus({ connected: false, reconnecting: false });
    });

    this.socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error:', error);
      this.updateStatus({ 
        connected: false, 
        reconnecting: true, 
        error: error.message 
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      logger.info('WebSocket reconnected', { attemptNumber, totalAttempts: this.reconnectAttempts });
      this.reconnectAttempts = 0; // Reset on successful reconnect
      this.updateStatus({ 
        connected: true, 
        reconnecting: false,
        lastConnected: new Date(),
        error: undefined 
      });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
      const delay = Math.min(
        this.baseReconnectDelay * Math.pow(2, attemptNumber - 1),
        this.maxReconnectDelay
      );
      logger.info('WebSocket reconnection attempt', { 
        attemptNumber, 
        delay: `${delay}ms`,
        maxAttempts: this.maxReconnectAttempts
      });
      this.updateStatus({ 
        connected: false, 
        reconnecting: true,
        error: `Reconnecting... (attempt ${attemptNumber}/${this.maxReconnectAttempts}, next retry in ${Math.round(delay / 1000)}s)`
      });
    });

    this.socket.on('reconnect_failed', () => {
      logger.error('WebSocket reconnection failed');
      this.updateStatus({ 
        connected: false, 
        reconnecting: false,
        error: 'Reconnection failed'
      });
    });

    // Heartbeat handling with latency measurement
    this.socket.on('heartbeat', (data: any) => {
      const now = Date.now();
      if (data?.timestamp) {
        const latency = now - data.timestamp;
        this.connectionQuality.latency = latency;
        this.connectionQuality.packetLoss = 0; // Reset on successful ping
      }
      this.socket?.emit('heartbeat_ack', { timestamp: now });
    });

    this.socket.on('heartbeat_ack', (data: any) => {
      if (data?.timestamp && this.connectionQuality.lastPing) {
        const latency = Date.now() - this.connectionQuality.lastPing;
        this.connectionQuality.latency = latency;
      }
    });

    // Generic event forwarding
    this.socket.onAny((eventName, ...args) => {
      this.emit(eventName, ...args);
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        const pingTime = Date.now();
        this.connectionQuality.lastPing = pingTime;
        this.socket.emit('heartbeat', { timestamp: pingTime });
        
        // Measure latency
        setTimeout(() => {
          if (this.connectionQuality.lastPing === pingTime) {
            // No response yet, connection might be slow
            this.connectionQuality.latency = -1; // Unknown
          }
        }, 5000); // 5 second timeout
      }
    }, 30000); // Every 30 seconds
  }

  private updateStatus(newStatus: Partial<ConnectionStatus>): void {
    this.status = { ...this.status, ...newStatus };
    this.emit('status', this.status);
  }

  // Event subscription methods
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!this.listeners.has(event)) return;

    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          logger.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Drop-specific subscription methods
  subscribeToDrops(filters?: { dropIds?: string[]; filters?: any }): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to drops: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:drops', filters || {});
    logger.info('Subscribed to drops', filters);
  }

  subscribeToDrop(dropId: string): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to drop: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:drop', { dropId });
    logger.info('Subscribed to drop', { dropId });
  }

  unsubscribeFromDrops(): void {
    if (!this.socket?.connected) return;

    this.socket.emit('unsubscribe:drops');
    logger.info('Unsubscribed from drops');
  }

  unsubscribeFromDrop(dropId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('unsubscribe:drop', { dropId });
    logger.info('Unsubscribed from drop', { dropId });
  }

  // Order-specific subscription methods
  subscribeToOrders(filters?: { orderIds?: string[]; userId?: string }): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to orders: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:orders', filters || {});
    logger.info('Subscribed to orders', filters);
  }

  subscribeToOrder(orderId: string): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to order: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:orders', { orderIds: [orderId] });
    logger.info('Subscribed to order', { orderId });
  }

  // Ticket-specific subscription methods
  subscribeToTickets(filters?: { ticketIds?: string[]; status?: string; priority?: string; assignedTo?: string; filters?: any }): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to tickets: WebSocket not connected');
      return;
    }

    const subscriptionData: any = {};
    
    if (filters?.ticketIds) {
      subscriptionData.ticketIds = filters.ticketIds;
    }
    
    if (filters?.status || filters?.priority || filters?.assignedTo) {
      subscriptionData.filters = {};
      if (filters.status) subscriptionData.filters.status = filters.status;
      if (filters.priority) subscriptionData.filters.priority = filters.priority;
      if (filters.assignedTo) subscriptionData.filters.assignedTo = filters.assignedTo;
    }
    
    if (filters?.filters) {
      subscriptionData.filters = { ...subscriptionData.filters, ...filters.filters };
    }

    this.socket.emit('subscribe:tickets', subscriptionData);
    logger.info('Subscribed to tickets', subscriptionData);
  }

  subscribeToTicket(ticketId: string): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to ticket: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:tickets', { ticketIds: [ticketId] });
    logger.info('Subscribed to ticket', { ticketId });
  }

  unsubscribeFromTickets(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('unsubscribe:tickets');
    logger.info('Unsubscribed from tickets');
  }

  unsubscribeFromTicket(ticketId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('unsubscribe:ticket', { ticketId });
    logger.info('Unsubscribed from ticket', { ticketId });
  }

  // KPI-specific subscription methods
  subscribeToKPIs(): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to KPIs: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:kpis');
    logger.info('Subscribed to KPIs');
  }

  unsubscribeFromKPIs(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('unsubscribe:kpis');
    logger.info('Unsubscribed from KPIs');
  }

  // System health subscription methods
  subscribeToSystemHealth(): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to system health: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:system_health');
    logger.info('Subscribed to system health');
  }

  unsubscribeFromSystemHealth(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('unsubscribe:system_health');
    logger.info('Unsubscribed from system health');
  }

  // Notification subscription methods
  subscribeToNotifications(): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to notifications: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:notifications');
    logger.info('Subscribed to notifications');
  }

  unsubscribeFromNotifications(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('unsubscribe:notifications');
    logger.info('Unsubscribed from notifications');
  }

  // Inventory-specific subscription methods
  subscribeToInventory(productIds?: string[]): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to inventory: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:inventory', { productIds: productIds || [] });
    logger.info('Subscribed to inventory', { productIds });
  }

  unsubscribeFromInventory(): void {
    if (!this.socket?.connected) return;
    this.socket.emit('unsubscribe:inventory');
    logger.info('Unsubscribed from inventory');
  }

  // Shop management subscription methods
  subscribeToShop(options?: ShopSubscriptionPayload): void {
    if (!this.socket?.connected) {
      logger.warn('Cannot subscribe to shop realtime: WebSocket not connected');
      return;
    }

    const payload: ShopSubscriptionPayload = {
      channels: options?.channels && options.channels.length > 0
        ? Array.from(new Set(options.channels))
        : undefined,
      scope: options?.scope,
      filters: options?.filters
    };

    this.socket.emit('subscribe:shop', payload);
    logger.info('Subscribed to shop realtime channels', payload);
  }

  unsubscribeFromShop(options?: { channels?: ShopRealtimeChannel[]; scope?: string }): void {
    if (!this.socket?.connected) return;

    const payload = options
      ? {
          channels: options.channels && options.channels.length > 0
            ? Array.from(new Set(options.channels))
            : undefined,
          scope: options.scope
        }
      : undefined;

    this.socket.emit('unsubscribe:shop', payload);
    logger.info('Unsubscribed from shop realtime channels', payload);
  }

  // Getters
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get connectionStatus(): ConnectionStatus {
    return { ...this.status };
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }

  get connectionQuality() {
    return { ...this.connectionQuality };
  }

  // 🚀 Optimized message sending with batching
  send(event: string, data: any, priority: number = 0): void {
    if (!this.socket?.connected) {
      // Queue message if not connected
      this.messageQueue.push({ event, data, priority });
      this.messageQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
      return;
    }

    // Add to batch queue
    this.messageQueue.push({ event, data, priority });
    
    // Process batch if timer doesn't exist
    if (!this.messageBatchTimer) {
      this.messageBatchTimer = setTimeout(() => {
        this.processMessageBatch();
      }, this.BATCH_INTERVAL);
    }

    // Process immediately if batch is full
    if (this.messageQueue.length >= this.MAX_BATCH_SIZE) {
      this.processMessageBatch();
    }
  }

  private processMessageBatch(): void {
    if (!this.socket?.connected || this.messageQueue.length === 0) {
      if (this.messageBatchTimer) {
        clearTimeout(this.messageBatchTimer);
        this.messageBatchTimer = undefined;
      }
      return;
    }

    // Sort by priority
    this.messageQueue.sort((a, b) => b.priority - a.priority);
    
    // Process up to MAX_BATCH_SIZE messages
    const batch = this.messageQueue.splice(0, this.MAX_BATCH_SIZE);
    
    batch.forEach(({ event, data }) => {
      try {
        this.socket?.emit(event, data);
      } catch (error) {
        logger.error(`Failed to send message ${event}:`, error);
        // Re-queue failed message
        this.messageQueue.unshift({ event, data, priority: 0 });
      }
    });

    // Clear timer
    if (this.messageBatchTimer) {
      clearTimeout(this.messageBatchTimer);
      this.messageBatchTimer = undefined;
    }

    // Schedule next batch if queue is not empty
    if (this.messageQueue.length > 0) {
      this.messageBatchTimer = setTimeout(() => {
        this.processMessageBatch();
      }, this.BATCH_INTERVAL);
    }
  }

  // Force reconnection with exponential backoff
  forceReconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.reconnectAttempts = 0;
    const delay = this.calculateReconnectDelay();
    logger.info('Force reconnecting with exponential backoff', { delay: `${delay}ms` });
    setTimeout(() => this.connect(), delay);
  }

  private calculateReconnectDelay(): number {
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    // Add jitter
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (config?: WebSocketClientConfig): WebSocketClient => {
  if (!wsClient) {
    const defaultConfig: WebSocketClientConfig = {
      url: (import.meta as any).env?.VITE_WS_URL || (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001',
      autoConnect: true
    };
    
    wsClient = new WebSocketClient(config || defaultConfig);
  }
  
  return wsClient;
};

export const disconnectWebSocket = (): void => {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
};

// React Hook for WebSocket
export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnecting: false
  });
  const [wsManager, setWsManager] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    // Initialize WebSocket Client
    const client = getWebSocketClient();
    setWsManager(client);

    // Subscribe to connection status changes
    const handleStatusChange = (status: ConnectionStatus) => {
      setConnectionStatus(status);
    };

    client.on('status', handleStatusChange);

    // Cleanup on unmount
    return () => {
      client.off('status', handleStatusChange);
    };
  }, []);

  const reconnect = useCallback(() => {
    if (wsManager) {
      wsManager.forceReconnect();
    }
  }, [wsManager]);

  return {
    wsManager,
    connectionStatus,
    reconnect,
    isConnected: connectionStatus.connected
  };
};