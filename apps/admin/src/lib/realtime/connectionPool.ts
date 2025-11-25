import { getRealtimeClient, RealtimeClient, ConnectionStatus } from '../realtime';
import { logger } from '../logger';

export type Topic = 
  | 'kpis'
  | 'tickets'
  | 'orders'
  | 'shop'
  | 'drops'
  | 'inventory'
  | 'customers'
  | 'users'
  | 'system_health'
  | 'notifications'
  | 'activity'
  | 'automation'
  | 'contests'
  | 'cookieClicker'
  | 'maintenance'
  | 'inviteCodes'
  | 'settings'
  | 'security'
  | 'images'
  | 'shipping';

export interface TopicSubscription {
  topic: Topic;
  filters?: Record<string, any>;
  callback: Function;
  componentId: string;
}

export interface ConnectionMetrics {
  latency: number;
  packetLoss: number;
  lastHeartbeat: number;
  reconnectCount: number;
}

class ConnectionPool {
  private client: RealtimeClient;
  private subscriptions: Map<Topic, Set<TopicSubscription>> = new Map();
  private componentSubscriptions: Map<string, Set<Topic>> = new Map();
  private metrics: ConnectionMetrics = {
    latency: 0,
    packetLoss: 0,
    lastHeartbeat: 0,
    reconnectCount: 0
  };
  private heartbeatLatencies: number[] = [];
  private readonly MAX_LATENCY_SAMPLES = 10;
  private eventThrottleMap: Map<string, { lastEmit: number; throttleMs: number }> = new Map();
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly INITIAL_RECONNECT_DELAY = 1000; // 1 second

  constructor() {
    this.client = getRealtimeClient();
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring(): void {
    // Monitor connection status
    this.client.on('status', (status: ConnectionStatus) => {
      if (status.connected && !status.reconnecting) {
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
        // Resubscribe to all active topics on reconnect
        this.resubscribeAll();
      } else if (!status.connected && !status.reconnecting) {
        // Handle disconnection with exponential backoff
        this.handleDisconnection();
      }
      
      if (status.reconnectAttempts) {
        this.metrics.reconnectCount = status.reconnectAttempts;
        this.reconnectAttempts = status.reconnectAttempts;
      }
    });

    // Monitor heartbeat for latency calculation
    let heartbeatStartTime = 0;
    this.client.on('heartbeat', () => {
      heartbeatStartTime = Date.now();
    });

    // Listen for heartbeat_ack events from server
    if (this.client.socket) {
      this.client.socket.on('heartbeat_ack', () => {
        if (heartbeatStartTime > 0) {
          const latency = Date.now() - heartbeatStartTime;
          this.updateLatency(latency);
          heartbeatStartTime = 0;
        }
      });
    }
  }

  private updateLatency(latency: number): void {
    this.heartbeatLatencies.push(latency);
    if (this.heartbeatLatencies.length > this.MAX_LATENCY_SAMPLES) {
      this.heartbeatLatencies.shift();
    }
    
    const avgLatency = this.heartbeatLatencies.reduce((a, b) => a + b, 0) / this.heartbeatLatencies.length;
    this.metrics.latency = Math.round(avgLatency);
    this.metrics.lastHeartbeat = Date.now();
  }

  /**
   * Handle disconnection with exponential backoff
   */
  private handleDisconnection(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      logger.error('[ConnectionPool] Max reconnect attempts reached', { attempts: this.reconnectAttempts });
      return;
    }

    const delay = Math.min(
      this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    logger.warn('[ConnectionPool] Connection lost, reconnecting...', { 
      attempt: this.reconnectAttempts + 1,
      delay 
    });

    setTimeout(() => {
      this.reconnectAttempts++;
      if (this.client && !this.client.isConnected) {
        this.client.connect();
      }
    }, delay);
  }

  /**
   * Subscribe to a topic with optional filters
   */
  subscribe(
    topic: Topic,
    callback: Function,
    componentId: string,
    filters?: Record<string, any>
  ): () => void {
    const subscription: TopicSubscription = {
      topic,
      filters,
      callback,
      componentId
    };

    // Add to subscriptions map
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(subscription);

    // Track component subscriptions
    if (!this.componentSubscriptions.has(componentId)) {
      this.componentSubscriptions.set(componentId, new Set());
    }
    this.componentSubscriptions.get(componentId)!.add(topic);

    // Subscribe to WebSocket if connected
    if (this.client.isConnected) {
      this.subscribeToTopic(topic, filters);
    }

    // Set up event listener - map topics to actual event names
    const eventNames = this.getEventNamesForTopic(topic);
    const eventHandler = (data: any) => {
      // Apply filters if provided
      if (filters && !this.matchesFilters(data, filters)) {
        return;
      }
      
      // Throttle high-frequency events
      const throttleKey = `${topic}-${componentId}`;
      const throttle = this.eventThrottleMap.get(throttleKey);
      const now = Date.now();
      
      // Default throttle: 100ms for high-frequency topics, 0ms for others
      const throttleMs = topic === 'kpis' || topic === 'activity' ? 100 : 0;
      
      if (throttle && (now - throttle.lastEmit) < throttleMs) {
        return; // Skip this event due to throttling
      }
      
      this.eventThrottleMap.set(throttleKey, { lastEmit: now, throttleMs });
      callback(data);
    };

    // Subscribe to all relevant event names for this topic
    eventNames.forEach(eventName => {
      this.client.on(eventName, eventHandler);
    });

    logger.info(`[ConnectionPool] Subscribed to ${topic}`, { componentId, filters });

    // Return unsubscribe function
    return () => {
      this.unsubscribe(topic, componentId, callback);
    };
  }

  /**
   * Unsubscribe from a topic
   */
  unsubscribe(topic: Topic, componentId: string, callback?: Function): void {
    const topicSubs = this.subscriptions.get(topic);
    if (!topicSubs) return;

    // Remove specific subscription
    if (callback) {
      const toRemove = Array.from(topicSubs).find(
        sub => sub.componentId === componentId && sub.callback === callback
      );
      if (toRemove) {
        topicSubs.delete(toRemove);
        const eventNames = this.getEventNamesForTopic(topic);
        eventNames.forEach(eventName => {
          this.client.off(eventName, callback);
        });
      }
    } else {
      // Remove all subscriptions for this component
      const toRemove = Array.from(topicSubs).filter(sub => sub.componentId === componentId);
      toRemove.forEach(sub => {
        topicSubs.delete(sub);
        const eventNames = this.getEventNamesForTopic(sub.topic);
        eventNames.forEach(eventName => {
          this.client.off(eventName, sub.callback);
        });
      });
    }

    // Remove from component tracking
    const componentTopics = this.componentSubscriptions.get(componentId);
    if (componentTopics) {
      componentTopics.delete(topic);
      if (componentTopics.size === 0) {
        this.componentSubscriptions.delete(componentId);
      }
    }

    // Unsubscribe from WebSocket if no more subscriptions for this topic
    if (topicSubs.size === 0) {
      this.subscriptions.delete(topic);
      this.unsubscribeFromTopic(topic);
    }

    logger.info(`[ConnectionPool] Unsubscribed from ${topic}`, { componentId });
  }

  /**
   * Unsubscribe all topics for a component (cleanup on unmount)
   */
  unsubscribeAll(componentId: string): void {
    const topics = this.componentSubscriptions.get(componentId);
    if (!topics) return;

    const topicsArray = Array.from(topics);
    topicsArray.forEach(topic => {
      this.unsubscribe(topic, componentId);
    });

    logger.info(`[ConnectionPool] Unsubscribed all topics for component`, { componentId });
  }

  /**
   * Subscribe to topic on WebSocket
   */
  private subscribeToTopic(topic: Topic, filters?: Record<string, any>): void {
    if (!this.client.isConnected) return;

    switch (topic) {
      case 'kpis':
        this.client.subscribeToKPIs();
        break;
      case 'tickets':
        this.client.subscribeToTickets(filters as any);
        break;
      case 'orders':
        this.client.subscribeToOrders(filters as any);
        break;
      case 'shop':
        this.client.subscribeToShop(filters as any);
        break;
      case 'drops':
        this.client.subscribeToDrops(filters as any);
        break;
      case 'inventory':
        this.client.subscribeToInventory(filters?.productIds);
        break;
      case 'customers':
        this.client.subscribeToCustomers(filters as any);
        break;
      case 'users':
        this.client.subscribeToUsers(filters as any);
        break;
      case 'system_health':
        this.client.subscribeToSystemHealth();
        break;
      case 'notifications':
        // Use generic subscribe for notifications
        this.client.subscribe('notifications', filters);
        break;
      case 'activity':
        this.client.subscribe('activity', filters);
        break;
      case 'automation':
        this.client.subscribeToAutomation(filters as any);
        break;
      case 'contests':
        this.client.subscribeToContests(filters as any);
        break;
      case 'cookieClicker':
        this.client.subscribeToCookieClicker(filters as any);
        break;
      case 'maintenance':
        this.client.subscribeToMaintenance();
        break;
      case 'inviteCodes':
        this.client.subscribeToInviteCodes(filters as any);
        break;
      case 'settings':
        this.client.subscribeToSettings();
        break;
      case 'security':
        this.client.subscribeToSecurity();
        break;
      case 'images':
        this.client.subscribeToImages(filters as any);
        break;
      case 'shipping':
        this.client.subscribeToShipping(filters as any);
        break;
      default:
        // Generic subscription
        this.client.subscribe(topic, filters);
    }
  }

  /**
   * Unsubscribe from topic on WebSocket
   */
  private unsubscribeFromTopic(topic: Topic): void {
    if (!this.client.isConnected) return;

    switch (topic) {
      case 'kpis':
        this.client.unsubscribeFromKPIs();
        break;
      case 'tickets':
        this.client.unsubscribeFromTickets();
        break;
      case 'orders':
        this.client.unsubscribeFromOrders();
        break;
      case 'shop':
        this.client.unsubscribeFromShop();
        break;
      case 'drops':
        this.client.unsubscribeFromDrops();
        break;
      case 'inventory':
        this.client.unsubscribeFromInventory();
        break;
      case 'customers':
        this.client.unsubscribeFromCustomers();
        break;
      case 'users':
        this.client.unsubscribeFromUsers();
        break;
      case 'system_health':
        this.client.unsubscribeFromSystemHealth();
        break;
      case 'notifications':
        this.client.unsubscribe('notifications');
        break;
      case 'activity':
        this.client.unsubscribe('activity');
        break;
      case 'automation':
        this.client.unsubscribeFromAutomation();
        break;
      case 'contests':
        this.client.unsubscribeFromContests();
        break;
      case 'cookieClicker':
        this.client.unsubscribeFromCookieClicker();
        break;
      case 'maintenance':
        this.client.unsubscribeFromMaintenance();
        break;
      case 'inviteCodes':
        this.client.unsubscribeFromInviteCodes();
        break;
      case 'settings':
        this.client.unsubscribeFromSettings();
        break;
      case 'security':
        this.client.unsubscribeFromSecurity();
        break;
      case 'images':
        this.client.unsubscribeFromImages();
        break;
      case 'shipping':
        this.client.unsubscribeFromShipping();
        break;
      default:
        this.client.unsubscribe(topic);
    }
  }

  /**
   * Resubscribe to all active topics (after reconnection)
   */
  private resubscribeAll(): void {
    this.subscriptions.forEach((subs, topic) => {
      // Get unique filters from all subscriptions
      const filters = Array.from(subs).reduce((acc, sub) => {
        if (sub.filters) {
          return { ...acc, ...sub.filters };
        }
        return acc;
      }, {} as Record<string, any>);

      this.subscribeToTopic(topic, Object.keys(filters).length > 0 ? filters : undefined);
    });

    logger.info('[ConnectionPool] Resubscribed to all active topics');
  }

  /**
   * Get event names for a topic
   */
  private getEventNamesForTopic(topic: Topic): string[] {
    const eventMap: Record<Topic, string[]> = {
      kpis: ['kpi:updated', 'kpi:stats_changed', 'dashboard:kpi_update'],
      tickets: ['ticket:created', 'ticket:updated', 'ticket:status_changed', 'ticket:assigned', 'ticket:message_added'],
      orders: ['order:created', 'order:updated', 'order:status_changed', 'order:tracking_updated'],
      shop: ['shop:product_updated', 'shop:category_updated'],
      drops: ['drop:created', 'drop:updated', 'drop:deleted', 'drop:stock_changed', 'drop:status_changed'],
      inventory: ['inventory:updated', 'inventory:stock_changed'],
      customers: ['customer:created', 'customer:updated'],
      users: ['user:created', 'user:updated'],
      system_health: ['system:health'],
      notifications: ['notification:new'],
      activity: ['activity:new'],
      automation: ['automation:triggered', 'automation:completed'],
      contests: ['contest:updated', 'contest:leaderboard_updated'],
      cookieClicker: ['cookieClicker:updated'],
      maintenance: ['maintenance:status_changed'],
      inviteCodes: ['inviteCode:created', 'inviteCode:used'],
      settings: ['settings:updated'],
      security: ['security:alert'],
      images: ['image:uploaded', 'image:deleted'],
      shipping: ['shipping:updated', 'shipping:tracking_updated']
    };

    return eventMap[topic] || [topic];
  }

  /**
   * Check if data matches filters
   */
  private matchesFilters(data: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (data[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.client.connectionStatus;
  }

  /**
   * Get connection metrics
   */
  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active subscriptions count
   */
  getActiveSubscriptionsCount(): number {
    return Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.size, 0);
  }

  /**
   * Get topics for a component
   */
  getComponentTopics(componentId: string): Topic[] {
    return Array.from(this.componentSubscriptions.get(componentId) || []);
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.client.isConnected;
  }

  /**
   * Get the underlying client
   */
  getClient(): RealtimeClient {
    return this.client;
  }

  /**
   * Get connection health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    latency: number;
    reconnectCount: number;
    lastHeartbeat: number;
    issues: string[];
  } {
    const issues: string[] = [];
    const now = Date.now();
    
    // Check if connection is healthy
    if (!this.client.isConnected) {
      issues.push('Not connected');
    }
    
    // Check latency
    if (this.metrics.latency > 1000) {
      issues.push('High latency');
    }
    
    // Check if heartbeat is recent (within last 30 seconds)
    if (now - this.metrics.lastHeartbeat > 30000) {
      issues.push('No recent heartbeat');
    }
    
    // Check reconnect count
    if (this.metrics.reconnectCount > 5) {
      issues.push('Multiple reconnects');
    }
    
    return {
      isHealthy: issues.length === 0,
      latency: this.metrics.latency,
      reconnectCount: this.metrics.reconnectCount,
      lastHeartbeat: this.metrics.lastHeartbeat,
      issues
    };
  }
}

// Singleton instance
let connectionPool: ConnectionPool | null = null;

export const getConnectionPool = (): ConnectionPool => {
  if (!connectionPool) {
    connectionPool = new ConnectionPool();
  }
  return connectionPool;
};

export const resetConnectionPool = (): void => {
  if (connectionPool) {
    // Cleanup all subscriptions
    connectionPool = null;
  }
};

