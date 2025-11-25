import { io, Socket } from 'socket.io-client';
import { logger } from './logger';

export interface RealtimeConfig {
  url: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    load: number[];
  };
  database: {
    connected: boolean;
    latency?: number;
  };
  redis: {
    connected: boolean;
    latency?: number;
  };
  timestamp: string;
}

class RealtimeClient {
  public socket: Socket | null = null;
  private config: RealtimeConfig;
  private status: ConnectionStatus = {
    connected: false,
    reconnecting: false,
    reconnectAttempts: 0
  };
  private listeners: Map<string, Function[]> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private isOnline = navigator.onLine;

  constructor(config: RealtimeConfig) {
    this.config = {
      autoConnect: true,
      reconnectAttempts: 5,
      reconnectDelay: 3000,
      heartbeatInterval: 30000,
      ...config
    };

    this.setupOnlineOfflineHandlers();

    if (this.config.autoConnect) {
      setTimeout(() => this.connect(), 100);
    }
  }

  private setupOnlineOfflineHandlers(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('Network connection restored');
      if (!this.socket?.connected) {
        this.connect();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.warn('Network connection lost');
      this.updateStatus({ 
        connected: false, 
        reconnecting: false,
        error: 'Network offline'
      });
    });
  }

  connect(): void {
    if (this.socket?.connected || !this.isOnline) {
      return;
    }

    try {
      const token = localStorage.getItem('nebula_access_token') || undefined;
      this.socket = io(this.config.url, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.config.reconnectAttempts,
        reconnectionDelay: this.config.reconnectDelay,
        reconnectionDelayMax: this.config.reconnectDelay * 4,
        autoConnect: true,
        auth: token ? { token } : undefined,
        // Add jitter to prevent thundering herd
        randomizationFactor: 0.5
      });

      this.setupEventHandlers();
      this.startHeartbeat();

      logger.info('Realtime client connecting...', { url: this.config.url });
    } catch (error) {
      logger.error('Failed to create realtime connection:', error);
      this.updateStatus({ 
        connected: false, 
        error: 'Connection failed',
        reconnectAttempts: this.status.reconnectAttempts + 1
      });
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

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    this.updateStatus({ 
      connected: false, 
      reconnecting: false,
      reconnectAttempts: 0
    });
    logger.info('Realtime client disconnected');
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('Realtime connected', { socketId: this.socket?.id });
      this.updateStatus({ 
        connected: true, 
        reconnecting: false, 
        lastConnected: new Date(),
        error: undefined,
        reconnectAttempts: 0
      });
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('Realtime disconnected', { reason });
      this.updateStatus({ 
        connected: false, 
        reconnecting: false,
        error: reason
      });
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Realtime connection error:', error);
      this.updateStatus({ 
        connected: false, 
        reconnecting: true, 
        error: error.message,
        reconnectAttempts: this.status.reconnectAttempts + 1
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      logger.info('Realtime reconnected', { attemptNumber });
      this.updateStatus({ 
        connected: true, 
        reconnecting: false,
        lastConnected: new Date(),
        error: undefined,
        reconnectAttempts: 0
      });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      logger.info('Realtime reconnection attempt', { attemptNumber });
      this.updateStatus({ 
        connected: false, 
        reconnecting: true,
        error: `Reconnecting... (attempt ${attemptNumber})`,
        reconnectAttempts: attemptNumber
      });
    });

    this.socket.on('reconnect_failed', () => {
      logger.error('Realtime reconnection failed');
      this.updateStatus({ 
        connected: false, 
        reconnecting: false,
        error: 'Reconnection failed'
      });
    });

    // Heartbeat handling
    this.socket.on('heartbeat', (data) => {
      this.socket?.emit('heartbeat_ack', { timestamp: Date.now() });
    });

    // Generic event forwarding with throttling
    this.socket.onAny((eventName, ...args) => {
      this.throttledEmit(eventName, ...args);
    });
  }

  private eventThrottleMap = new Map<string, number>();
  private readonly THROTTLE_DELAY = 100; // 100ms throttle

  private throttledEmit(eventName: string, ...args: any[]): void {
    const now = Date.now();
    const lastEmit = this.eventThrottleMap.get(eventName) || 0;
    
    if (now - lastEmit > this.THROTTLE_DELAY) {
      this.eventThrottleMap.set(eventName, now);
      this.emit(eventName, ...args);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat');
      }
    }, this.config.heartbeatInterval);
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
          logger.error(`Error in realtime event handler for ${event}:`, error);
        }
      });
    }
  }

  // Generic subscription method
  subscribe(channel: string, filters?: Record<string, any>): void {
    if (!this.socket?.connected) {
      logger.warn(`Cannot subscribe to ${channel}: Realtime not connected`);
      return;
    }

    this.socket.emit(`subscribe:${channel}`, filters || {});
    logger.info(`Subscribed to ${channel}`, filters);
  }

  unsubscribe(channel: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit(`unsubscribe:${channel}`);
    logger.info(`Unsubscribed from ${channel}`);
  }

  // Subscription methods for different data streams
  subscribeToOrders(filters?: { orderIds?: string[]; userId?: string }): void {
    this.subscribe('orders', filters);
  }

  subscribeToInventory(filters?: { productIds?: string[] }): void {
    this.subscribe('inventory', filters);
  }

  subscribeToSystemHealth(): void {
    this.subscribe('system_health');
  }

  subscribeToShop(filters?: { productIds?: string[]; categoryIds?: string[] }): void {
    this.subscribe('shop', filters);
  }

  subscribeToDrops(filters?: { dropIds?: string[] }): void {
    this.subscribe('drops', filters);
  }

  subscribeToCustomers(filters?: { customerIds?: string[] }): void {
    this.subscribe('customers', filters);
  }

  subscribeToImages(filters?: { imageIds?: string[] }): void {
    this.subscribe('images', filters);
  }

  subscribeToShipping(filters?: { orderIds?: string[] }): void {
    this.subscribe('shipping', filters);
  }

  subscribeToTickets(filters?: { ticketIds?: string[]; status?: string[] }): void {
    this.subscribe('tickets', filters);
  }

  subscribeToUsers(filters?: { userIds?: string[] }): void {
    this.subscribe('users', filters);
  }

  subscribeToSecurity(): void {
    this.subscribe('security');
  }

  subscribeToContests(filters?: { contestIds?: string[] }): void {
    this.subscribe('contests', filters);
  }

  subscribeToCookieClicker(filters?: { playerIds?: string[] }): void {
    this.subscribe('cookieClicker', filters);
  }

  subscribeToMaintenance(): void {
    this.subscribe('maintenance');
  }

  subscribeToInviteCodes(filters?: { codeIds?: string[] }): void {
    this.subscribe('inviteCodes', filters);
  }

  subscribeToAutomation(filters?: { automationIds?: string[] }): void {
    this.subscribe('automation', filters);
  }

  subscribeToSettings(): void {
    this.subscribe('settings');
  }

  subscribeToKPIs(): void {
    this.subscribe('kpis');
  }

  unsubscribeFromOrders(): void {
    this.unsubscribe('orders');
  }

  unsubscribeFromInventory(): void {
    this.unsubscribe('inventory');
  }

  unsubscribeFromSystemHealth(): void {
    this.unsubscribe('system_health');
  }

  unsubscribeFromShop(): void {
    this.unsubscribe('shop');
  }

  unsubscribeFromDrops(): void {
    this.unsubscribe('drops');
  }

  unsubscribeFromCustomers(): void {
    this.unsubscribe('customers');
  }

  unsubscribeFromImages(): void {
    this.unsubscribe('images');
  }

  unsubscribeFromShipping(): void {
    this.unsubscribe('shipping');
  }

  unsubscribeFromTickets(): void {
    this.unsubscribe('tickets');
  }

  unsubscribeFromUsers(): void {
    this.unsubscribe('users');
  }

  unsubscribeFromSecurity(): void {
    this.unsubscribe('security');
  }

  unsubscribeFromContests(): void {
    this.unsubscribe('contests');
  }

  unsubscribeFromCookieClicker(): void {
    this.unsubscribe('cookieClicker');
  }

  unsubscribeFromMaintenance(): void {
    this.unsubscribe('maintenance');
  }

  unsubscribeFromInviteCodes(): void {
    this.unsubscribe('inviteCodes');
  }

  unsubscribeFromAutomation(): void {
    this.unsubscribe('automation');
  }

  unsubscribeFromSettings(): void {
    this.unsubscribe('settings');
  }

  unsubscribeFromKPIs(): void {
    this.unsubscribe('kpis');
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

  // Force reconnection
  forceReconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.updateStatus({ reconnecting: true, error: 'Manual reconnect' });
    setTimeout(() => this.connect(), 1000);
  }

  // Graceful degradation to polling
  enablePollingFallback(pollingInterval: number = 30000): void {
    if (!this.isConnected) {
      this.reconnectTimeout = setTimeout(() => {
        if (!this.isConnected) {
          logger.warn('Realtime unavailable, falling back to polling');
          this.emit('polling_fallback', { interval: pollingInterval });
        }
      }, 5000);
    }
  }
}

// Singleton instance
let realtimeClient: RealtimeClient | null = null;

export const getRealtimeClient = (config?: RealtimeConfig): RealtimeClient => {
  if (!realtimeClient) {
    const defaultConfig: RealtimeConfig = {
      url: import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001',
      autoConnect: true
    };
    
    realtimeClient = new RealtimeClient(config || defaultConfig);
  }
  
  return realtimeClient;
};

export const disconnectRealtime = (): void => {
  if (realtimeClient) {
    realtimeClient.disconnect();
    realtimeClient = null;
  }
};

export { RealtimeClient };
