// Using native WebSocket instead of socket.io to avoid dependency issues
import { WebSocketServer as NativeWebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache';
import { databaseService } from '../services/database';
import EventEmitter from 'events';
import { 
  DropEvent, 
  DropCreatedEvent, 
  DropUpdatedEvent, 
  DropDeletedEvent, 
  DropStockChangedEvent, 
  DropStatusChangedEvent,
  dropEventManager 
} from './events/dropEvents';
import { 
  OrderEventData,
  OrderEventManager,
  OrderCreatedEvent,
  orderEventManager 
} from './events/orderEvents';
import {
  ProductCreatedEvent,
  ProductDeletedEvent,
  ProductStockChangedEvent,
  ProductUpdatedEvent,
  productEventManager
} from './events/productEvents';
import {
  LowStockAlertEvent,
  StockAdjustedEvent,
  StockReleasedEvent,
  StockReservedEvent,
  inventoryEventManager
} from './events/inventoryEvents';

export interface WebSocketEvents {
  // Dashboard Events
  'dashboard:kpi_update': (data: { kpis: any }) => void;
  'dashboard:ticket_update': (data: { ticket: any }) => void;
  'dashboard:trend_update': (data: { trends: any[] }) => void;

  // Ticket Events
  'ticket:created': (data: { ticket: any }) => void;
  'ticket:updated': (data: { ticket: any, changes: any }) => void;
  'ticket:status_changed': (data: { ticketId: string, oldStatus: string, newStatus: string }) => void;
  'ticket:assigned': (data: { ticketId: string, agent: string }) => void;
  'ticket:message_added': (data: { ticketId: string, message: any, ticket: any }) => void;

  // Payment Events
  'payment:initiated': (data: { paymentId: string, method: string, amount: number }) => void;
  'payment:btc_mempool': (data: { paymentId: string, txHash: string, fee: number, eta: string }) => void;
  'payment:btc_confirmed': (data: { paymentId: string, txHash: string, confirmations: number, blockHeight: number }) => void;
  'payment:eth_pending': (data: { paymentId: string, txHash: string, gasPrice: string, nonce: number }) => void;
  'payment:eth_confirmed': (data: { paymentId: string, txHash: string, confirmations: number }) => void;
  'payment:voucher_validated': (data: { paymentId: string, code: string, amount: number, provider: string }) => void;
  'payment:completed': (data: { paymentId: string, orderId: string, trackingNumber?: string }) => void;
  'payment:failed': (data: { paymentId: string, reason: string }) => void;

  // Order Events
  'order:created': (data: { orderId: string, order: any, timestamp: string }) => void;
  'order:updated': (data: { orderId: string, changes: any, timestamp: string }) => void;
  'order:status_changed': (data: { orderId: string, oldStatus: string, newStatus: string, trackingInfo?: any, timestamp: string }) => void;
  'order:tracking_updated': (data: { orderId: string, trackingInfo: any, timestamp: string }) => void;
  'order:payment_confirmed': (data: { orderId: string, paymentId: string, paymentMethod: string, timestamp: string }) => void;
  'order:shipped': (data: { orderId: string, trackingNumber: string, carrier: string, estimatedDelivery: string, timestamp: string }) => void;
  'order:delivered': (data: { orderId: string, deliveredAt: string, timestamp: string }) => void;
  'order:cancelled': (data: { orderId: string, reason?: string, cancelledBy: string, timestamp: string }) => void;
  'order:refunded': (data: { orderId: string, refundAmount: number, refundReason?: string, refundedBy: string, timestamp: string }) => void;
  'order:note_added': (data: { orderId: string, note: any, timestamp: string }) => void;
  'order:bulk_updated': (data: { orderIds: string[], updates: any, results: any, timestamp: string }) => void;

  // Profile Events
  'profile:payment_updated': (data: { userId: string, paymentId: string, status: string }) => void;
  'profile:order_updated': (data: { userId: string, orderId: string, status: string }) => void;

  // System Events
  'system:alert': (data: { type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' }) => void;
  'system:health_check': (data: { status: 'healthy' | 'degraded' | 'unhealthy', metrics: any }) => void;

  // User Events
  'user:activity': (data: { userId: string, action: string, resource: string }) => void;

  // ===== BOT INTEGRATION EVENTS =====

  // Bot User Events
  'bot:user_joined': (data: { user: any, source: string }) => void;
  'bot:user_verified': (data: { userId: string, verificationId: string }) => void;
  'bot:user_active': (data: { userId: string, lastSeen: string }) => void;

  // Bot Verification Events
  'bot:verification_created': (data: { verification: any }) => void;
  'bot:verification_pending': (data: { verificationId: string, userId: string }) => void;
  'bot:verification_approved': (data: { verificationId: string, userId: string, adminId: string }) => void;
  'bot:verification_rejected': (data: { verificationId: string, userId: string, adminId: string, reason: string }) => void;
  'bot:verification_queue_update': (data: { pendingCount: number, totalCount: number }) => void;
  'homepage:verification_live': (data: { telegramId: number, userName: string, inviterTelegramId?: number, timestamp: string }) => void;

  // Bot Invite Code Events
  'bot:invite_code_created': (data: { inviteCode: any }) => void;
  'bot:invite_code_used': (data: { code: string, userId: string, usedBy: string }) => void;
  'bot:invite_code_expired': (data: { code: string, reason: string }) => void;
  'bot:invite_codes_stats': (data: { total: number, active: number, used: number }) => void;
  'user:personal_invite_code_updated': (data: { telegramId: number, personalInviteCode: string, timestamp: string }) => void;

  // Bot Analytics Events
  'bot:analytics_update': (data: { eventType: string, count: number, timestamp: string }) => void;
  'bot:performance_metrics': (data: { responseTime: number, uptime: number, errorRate: number }) => void;

  // Bot Admin Events
  'bot:admin_action': (data: { adminId: string, action: string, target: string, metadata: any }) => void;
  'bot:admin_dashboard_access': (data: { adminId: string, timestamp: string }) => void;

  // Bot System Events
  'bot:system_alert': (data: { type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' }) => void;
  'bot:health_status': (data: { status: 'healthy' | 'degraded' | 'unhealthy', metrics: any }) => void;
}

export declare interface WebSocketServer {
  on<U extends keyof WebSocketEvents>(
    event: U, listener: WebSocketEvents[U]
  ): this;

  emit<U extends keyof WebSocketEvents>(
    event: U, ...args: Parameters<WebSocketEvents[U]>
  ): this;
}

type ShopRealtimeChannel =
  | 'products'
  | 'drops'
  | 'inventory'
  | 'categories'
  | 'analytics'
  | 'orders'
  | 'sync';

export type ShopRealtimeEvent =
  | { type: 'product:created'; payload: ProductCreatedEvent }
  | { type: 'product:updated'; payload: ProductUpdatedEvent }
  | { type: 'product:deleted'; payload: ProductDeletedEvent }
  | { type: 'product:stock_changed'; payload: ProductStockChangedEvent }
  | { type: 'drop:created'; payload: DropCreatedEvent }
  | { type: 'drop:updated'; payload: DropUpdatedEvent }
  | { type: 'drop:deleted'; payload: DropDeletedEvent }
  | { type: 'drop:stock_changed'; payload: DropStockChangedEvent }
  | { type: 'drop:status_changed'; payload: DropStatusChangedEvent }
  | { type: 'inventory:stock_adjusted'; payload: StockAdjustedEvent }
  | { type: 'inventory:stock_reserved'; payload: StockReservedEvent }
  | { type: 'inventory:stock_released'; payload: StockReleasedEvent }
  | { type: 'inventory:low_stock_alert'; payload: LowStockAlertEvent }
  | { type: 'category:created'; payload: any }
  | { type: 'category:updated'; payload: any }
  | { type: 'category:deleted'; payload: any }
  | { type: 'analytics:updated'; payload: any }
  | { type: 'order:created'; payload: OrderCreatedEvent }
  | { type: 'sync:status'; payload: any };

class WebSocketServer extends EventEmitter {
  private io: SocketServer;
  private connectedClients = new Map<string, Socket>();
  private heartbeatInterval?: NodeJS.Timeout;
  private reconnectAttempts = new Map<string, number>();
  private maxReconnectAttempts = 5;
  private shopEventCleanups: Array<() => void> = [];

  constructor(io: SocketServer) {
    super();
    this.io = io;
    this.setupEventHandlers();
    this.startHeartbeat();
    this.setupShopEventBridge();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.logWebSocketConnection(socket.id, 'connection');

      // Client-Registrierung
      socket.on('register', (data: { userId: string; role: string }) => {
        this.handleClientRegister(socket, data);
      });

      // Dashboard Subscription
      socket.on('subscribe:dashboard', (data: { components: string[] }) => {
        this.handleDashboardSubscription(socket, data);
      });

      // Ticket Subscription
      socket.on('subscribe:tickets', (data: { ticketIds?: string[]; filters?: any }) => {
        this.handleTicketSubscription(socket, data);
      });

      // Payment Subscription
      socket.on('subscribe:payments', (data: { paymentIds?: string[]; userId?: string }) => {
        this.handlePaymentSubscription(socket, data);
      });

      // Order Subscription
      socket.on('subscribe:orders', (data: { orderIds?: string[]; userId?: string }) => {
        this.handleOrderSubscription(socket, data);
      });

      // Profile Subscription
      socket.on('subscribe:profile', (data: { userId: string; sections: string[] }) => {
        this.handleProfileSubscription(socket, data);
      });

      // ===== BOT SUBSCRIPTION HANDLERS =====

      // Bot Dashboard Subscription
      socket.on('subscribe:bot_dashboard', (data: { components: string[] }) => {
        this.handleBotDashboardSubscription(socket, data);
      });

      // Bot User Subscription
      socket.on('subscribe:bot_users', (data: { userIds?: string[]; filters?: any }) => {
        this.handleBotUserSubscription(socket, data);
      });

      // Bot Verification Subscription
      socket.on('subscribe:bot_verifications', (data: { verificationIds?: string[]; status?: string }) => {
        this.handleBotVerificationSubscription(socket, data);
      });

      // Bot Invite Code Subscription
      socket.on('subscribe:bot_invite_codes', (data: { codeIds?: string[]; status?: string }) => {
        this.handleBotInviteCodeSubscription(socket, data);
      });

      // Bot Analytics Subscription
      socket.on('subscribe:bot_analytics', (data: { eventTypes?: string[]; timeRange?: string }) => {
        this.handleBotAnalyticsSubscription(socket, data);
      });

      // ===== DROP SUBSCRIPTION HANDLERS =====

      // Drop Subscription
      socket.on('subscribe:drops', (data: { dropIds?: string[]; filters?: any }) => {
        this.handleDropSubscription(socket, data);
      });

      // Single Drop Subscription
      socket.on('subscribe:drop', (data: { dropId: string }) => {
        this.handleSingleDropSubscription(socket, data);
      });

      // Cookie Clicker Leaderboard Subscription
      socket.on('subscribe:cookie_leaderboard', (data?: { types?: string[] }) => {
        this.handleCookieLeaderboardSubscription(socket, data);
      });

      // Shop Management Subscription
      socket.on('subscribe:shop', (data: { channels?: ShopRealtimeChannel[]; scope?: string; filters?: any }) => {
        this.handleShopSubscription(socket, data || {});
      });

      socket.on('unsubscribe:shop', (data?: { channels?: ShopRealtimeChannel[]; scope?: string }) => {
        this.handleShopUnsubscribe(socket, data || {});
      });

      // Heartbeat
      socket.on('heartbeat', () => {
        socket.emit('heartbeat_ack', { timestamp: Date.now() });
      });

      // Error Handling
      socket.on('error', (error) => {
        logger.error('WebSocket Client Error:', { socketId: socket.id, error });
      });

      // Disconnection
      socket.on('disconnect', (reason) => {
        this.handleClientDisconnect(socket, reason);
      });
    });
  }

  private handleClientRegister(socket: Socket, data: { userId: string; role: string }) {
    this.connectedClients.set(socket.id, socket);

    // Join user-specific room
    socket.join(`user:${data.userId}`);
    socket.join(`role:${data.role}`);

    logger.logWebSocketConnection(socket.id, 'registered', {
      userId: data.userId,
      role: data.role
    });

    // Send welcome message with current state
    this.sendInitialState(socket, data.userId);
  }

  private handleDashboardSubscription(socket: Socket, data: { components: string[] }) {
    data.components.forEach(component => {
      socket.join(`dashboard:${component}`);
    });

    logger.logWebSocketConnection(socket.id, 'dashboard_subscribed', {
      components: data.components
    });
  }

  private handleTicketSubscription(socket: Socket, data: { ticketIds?: string[]; filters?: any }) {
    // Always join dashboard:tickets room for admin dashboard notifications
    socket.join('dashboard:tickets');
    
    if (data.ticketIds) {
      data.ticketIds.forEach(ticketId => {
        socket.join(`ticket:${ticketId}`);
      });
    }

    if (data.filters) {
      // Join filter-based rooms
      Object.entries(data.filters).forEach(([key, value]) => {
        socket.join(`tickets:${key}:${value}`);
      });
      
      // Join status-specific room if status filter is provided
      if (data.filters.status) {
        const statuses = Array.isArray(data.filters.status) 
          ? data.filters.status 
          : data.filters.status.split(',').map((s: string) => s.trim());
        statuses.forEach((status: string) => {
          socket.join(`tickets:status:${status}`);
        });
      }
    }

    logger.logWebSocketConnection(socket.id, 'tickets_subscribed', data);
  }

  private handlePaymentSubscription(socket: Socket, data: { paymentIds?: string[]; userId?: string }) {
    if (data.paymentIds) {
      data.paymentIds.forEach(paymentId => {
        socket.join(`payment:${paymentId}`);
      });
    }

    if (data.userId) {
      socket.join(`payments:user:${data.userId}`);
    }

    logger.logWebSocketConnection(socket.id, 'payments_subscribed', data);
  }

  private handleOrderSubscription(socket: Socket, data: { orderIds?: string[]; userId?: string }) {
    if (data.orderIds) {
      data.orderIds.forEach(orderId => {
        socket.join(`order:${orderId}`);
      });
    }

    if (data.userId) {
      socket.join(`orders:user:${data.userId}`);
    }

    logger.logWebSocketConnection(socket.id, 'orders_subscribed', data);
  }

  private handleProfileSubscription(socket: Socket, data: { userId: string; sections: string[] }) {
    data.sections.forEach(section => {
      socket.join(`profile:${data.userId}:${section}`);
    });

    logger.logWebSocketConnection(socket.id, 'profile_subscribed', data);
  }

  // ===== BOT SUBSCRIPTION HANDLERS =====

  private handleBotDashboardSubscription(socket: Socket, data: { components: string[] }) {
    data.components.forEach(component => {
      socket.join(`bot:${component}`);
    });

    logger.logWebSocketConnection(socket.id, 'bot_dashboard_subscribed', {
      components: data.components
    });
  }

  private handleBotUserSubscription(socket: Socket, data: { userIds?: string[]; filters?: any }) {
    if (data.userIds) {
      data.userIds.forEach(userId => {
        socket.join(`bot:user:${userId}`);
      });
    }

    if (data.filters) {
      Object.entries(data.filters).forEach(([key, value]) => {
        socket.join(`bot:users:${key}:${value}`);
      });
    }

    logger.logWebSocketConnection(socket.id, 'bot_users_subscribed', data);
  }

  private handleBotVerificationSubscription(socket: Socket, data: { verificationIds?: string[]; status?: string }) {
    if (data.verificationIds) {
      data.verificationIds.forEach(verificationId => {
        socket.join(`bot:verification:${verificationId}`);
      });
    }

    if (data.status) {
      socket.join(`bot:verifications:status:${data.status}`);
    }

    socket.join('bot:verifications:all');

    logger.logWebSocketConnection(socket.id, 'bot_verifications_subscribed', data);
  }

  private handleBotInviteCodeSubscription(socket: Socket, data: { codeIds?: string[]; status?: string }) {
    if (data.codeIds) {
      data.codeIds.forEach(codeId => {
        socket.join(`bot:invite_code:${codeId}`);
      });
    }

    if (data.status) {
      socket.join(`bot:invite_codes:status:${data.status}`);
    }

    socket.join('bot:invite_codes:all');

    logger.logWebSocketConnection(socket.id, 'bot_invite_codes_subscribed', data);
  }

  private handleBotAnalyticsSubscription(socket: Socket, data: { eventTypes?: string[]; timeRange?: string }) {
    if (data.eventTypes) {
      data.eventTypes.forEach(eventType => {
        socket.join(`bot:analytics:${eventType}`);
      });
    }

    if (data.timeRange) {
      socket.join(`bot:analytics:time:${data.timeRange}`);
    }

    socket.join('bot:analytics:all');

    logger.logWebSocketConnection(socket.id, 'bot_analytics_subscribed', data);
  }

  // ===== DROP SUBSCRIPTION HANDLERS =====

  private handleDropSubscription(socket: Socket, data: { dropIds?: string[]; filters?: any }) {
    dropEventManager.subscribeToDrops(socket, data);
    logger.logWebSocketConnection(socket.id, 'drops_subscribed', data);
  }

  private handleSingleDropSubscription(socket: Socket, data: { dropId: string }) {
    dropEventManager.subscribeToDrop(socket, data.dropId);
    logger.logWebSocketConnection(socket.id, 'drop_subscribed', { dropId: data.dropId });
  }

  private handleCookieLeaderboardSubscription(socket: Socket, data?: { types?: string[] }) {
    socket.join('cookie:leaderboard');
    
    // Subscribe to specific types if provided
    const types = data?.types || ['totalCookies', 'cps', 'timePlayed'];
    types.forEach(type => {
      socket.join(`cookie:leaderboard:${type}`);
    });
    
    logger.logWebSocketConnection(socket.id, 'cookie_leaderboard_subscribed', { types });
    
    // Send initial leaderboard data
    this.sendInitialCookieLeaderboard(socket, types);
  }

  private handleShopSubscription(
    socket: Socket,
    data: { channels?: ShopRealtimeChannel[]; scope?: string; filters?: Record<string, any> }
  ) {
    const defaultChannels: ShopRealtimeChannel[] = [
      'products',
      'drops',
      'inventory',
      'categories',
      'analytics',
      'orders',
      'sync'
    ];

    const channels = data.channels && data.channels.length > 0
      ? Array.from(new Set(data.channels))
      : defaultChannels;

    // Join shared rooms
    socket.join('shop:all');
    channels.forEach(channel => {
      socket.join(`shop:${channel}`);
      if (data.scope) {
        socket.join(`shop:${data.scope}:${channel}`);
      }
    });

    if (data.filters) {
      Object.entries(data.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          socket.join(`shop:filter:${key}:${value}`);
        }
      });
    }

    logger.logWebSocketConnection(socket.id, 'shop_subscribed', {
      channels,
      scope: data.scope,
      filters: data.filters
    });
  }

  private handleShopUnsubscribe(
    socket: Socket,
    data: { channels?: ShopRealtimeChannel[]; scope?: string }
  ) {
    const defaultChannels: ShopRealtimeChannel[] = [
      'products',
      'drops',
      'inventory',
      'categories',
      'analytics',
      'orders',
      'sync'
    ];

    const channels = data.channels && data.channels.length > 0
      ? Array.from(new Set(data.channels))
      : defaultChannels;

    if (data.scope) {
      channels.forEach(channel => socket.leave(`shop:${data.scope}:${channel}`));
      logger.logWebSocketConnection(socket.id, 'shop_unsubscribed', {
        channels,
        scope: data.scope
      });
      return;
    }

    channels.forEach(channel => socket.leave(`shop:${channel}`));
    socket.leave('shop:all');

    logger.logWebSocketConnection(socket.id, 'shop_unsubscribed', { channels });
  }

  private async sendInitialCookieLeaderboard(socket: Socket, types: string[]) {
    try {
      for (const type of types) {
        if (['totalCookies', 'cps', 'timePlayed'].includes(type)) {
          const leaderboard = await databaseService.getCookieClickerLeaderboard(
            type as 'totalCookies' | 'cps' | 'timePlayed',
            100
          );
          socket.emit('cookie:leaderboard_update', {
            type,
            leaderboard,
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      logger.error('Error sending initial cookie leaderboard:', error);
    }
  }

  private setupShopEventBridge() {
    const registerCleanup = (cleanup: () => void) => {
      this.shopEventCleanups.push(cleanup);
    };

    // Product Events
    const productCreatedHandler = (event: ProductCreatedEvent) => {
      this.broadcastShopEvent({ type: 'product:created', payload: event });
    };
    productEventManager.onProductEvent('product:created', productCreatedHandler as any);
    registerCleanup(() => productEventManager.offProductEvent('product:created', productCreatedHandler as any));

    const productUpdatedHandler = (event: ProductUpdatedEvent) => {
      this.broadcastShopEvent({ type: 'product:updated', payload: event });
    };
    productEventManager.onProductEvent('product:updated', productUpdatedHandler as any);
    registerCleanup(() => productEventManager.offProductEvent('product:updated', productUpdatedHandler as any));

    const productDeletedHandler = (event: ProductDeletedEvent) => {
      this.broadcastShopEvent({ type: 'product:deleted', payload: event });
    };
    productEventManager.onProductEvent('product:deleted', productDeletedHandler as any);
    registerCleanup(() => productEventManager.offProductEvent('product:deleted', productDeletedHandler as any));

    const productStockHandler = (event: ProductStockChangedEvent) => {
      this.broadcastShopEvent({ type: 'product:stock_changed', payload: event });
    };
    productEventManager.onProductEvent('product:stock_changed', productStockHandler as any);
    registerCleanup(() => productEventManager.offProductEvent('product:stock_changed', productStockHandler as any));

    // Inventory Events
    const stockAdjustedHandler = (event: StockAdjustedEvent) => {
      this.broadcastShopEvent({ type: 'inventory:stock_adjusted', payload: event });
    };
    inventoryEventManager.onInventoryEvent('inventory:stock_adjusted', stockAdjustedHandler as any);
    registerCleanup(() => inventoryEventManager.offInventoryEvent('inventory:stock_adjusted', stockAdjustedHandler as any));

    const stockReservedHandler = (event: StockReservedEvent) => {
      this.broadcastShopEvent({ type: 'inventory:stock_reserved', payload: event });
    };
    inventoryEventManager.onInventoryEvent('inventory:stock_reserved', stockReservedHandler as any);
    registerCleanup(() => inventoryEventManager.offInventoryEvent('inventory:stock_reserved', stockReservedHandler as any));

    const stockReleasedHandler = (event: StockReleasedEvent) => {
      this.broadcastShopEvent({ type: 'inventory:stock_released', payload: event });
    };
    inventoryEventManager.onInventoryEvent('inventory:stock_released', stockReleasedHandler as any);
    registerCleanup(() => inventoryEventManager.offInventoryEvent('inventory:stock_released', stockReleasedHandler as any));

    const lowStockHandler = (event: LowStockAlertEvent) => {
      this.broadcastShopEvent({ type: 'inventory:low_stock_alert', payload: event });
    };
    inventoryEventManager.onInventoryEvent('inventory:low_stock_alert', lowStockHandler as any);
    registerCleanup(() => inventoryEventManager.offInventoryEvent('inventory:low_stock_alert', lowStockHandler as any));
  }

  private teardownShopEventBridge() {
    if (this.shopEventCleanups.length === 0) {
      return;
    }

    this.shopEventCleanups.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        logger.error('Failed to cleanup shop realtime bridge', { error });
      }
    });

    this.shopEventCleanups = [];
  }

  private broadcastShopEvent(event: ShopRealtimeEvent) {
    const rooms = new Set<string>(['shop:all']);

    switch (event.type) {
      case 'product:created':
      case 'product:updated':
      case 'product:deleted':
      case 'product:stock_changed':
        rooms.add('shop:products');
        break;
      case 'drop:created':
      case 'drop:updated':
      case 'drop:deleted':
      case 'drop:stock_changed':
      case 'drop:status_changed':
        rooms.add('shop:drops');
        break;
      case 'inventory:stock_adjusted':
      case 'inventory:stock_reserved':
      case 'inventory:stock_released':
      case 'inventory:low_stock_alert':
        rooms.add('shop:inventory');
        break;
      case 'category:created':
      case 'category:updated':
      case 'category:deleted':
        rooms.add('shop:categories');
        break;
      case 'analytics:updated':
        rooms.add('shop:analytics');
        break;
      case 'order:created':
        rooms.add('shop:orders');
        break;
      case 'sync:status':
        rooms.add('shop:sync');
        break;
    }

    const payload = {
      ...event.payload,
      type: event.type,
      timestamp: (event.payload as any)?.timestamp || new Date().toISOString()
    };

    rooms.forEach(room => {
      this.io.to(room).emit(event.type, payload);
    });

    logger.debug('Shop realtime event broadcasted', {
      type: event.type,
      rooms: Array.from(rooms),
      referenceId: (event.payload as any)?.productId || (event.payload as any)?.dropId
    });
  }

  publishShopEvent(event: ShopRealtimeEvent) {
    this.broadcastShopEvent(event);
  }


  private handleClientDisconnect(socket: Socket, reason: string) {
    this.connectedClients.delete(socket.id);

    logger.logWebSocketConnection(socket.id, 'disconnected', { reason });

    // Cleanup subscriptions
    // Socket.IO handles room cleanup automatically
  }

  private async sendInitialState(socket: Socket, userId: string) {
    try {
      // Send current KPIs
      const kpis = await this.getCurrentKPIs();
      socket.emit('dashboard:kpi_update', { kpis });

      // Send recent tickets
      const recentTickets = await this.getRecentTickets();
      recentTickets.forEach(ticket => {
        socket.emit('ticket:updated', { ticket, changes: {} });
      });

      // Send system health
      const health = await this.getSystemHealth();
      socket.emit('system:health_check', health);

    } catch (error) {
      logger.error('Error sending initial state:', error);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const timestamp = Date.now();

      // Send heartbeat to all clients
      this.io.emit('heartbeat', { timestamp });

      // Check for stale connections
      this.checkStaleConnections();

    }, 30000); // Every 30 seconds
  }

  private checkStaleConnections() {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    this.connectedClients.forEach((socket, socketId) => {
      if (socket.lastHeartbeat && (now - socket.lastHeartbeat) > staleThreshold) {
        logger.warn('Stale connection detected:', { socketId });
        socket.disconnect();
      }
    });
  }

  // Event Broadcasting Methods
  async broadcastKPIUpdate(kpis: any) {
    this.io.to('dashboard:kpis').emit('dashboard:kpi_update', { kpis });
    logger.info('KPI Update broadcasted', { kpiCount: Object.keys(kpis).length });
  }

  async broadcastTicketUpdate(ticket: any, changes?: any) {
    const updateData = { ticket, changes };
    
    // Broadcast to specific ticket room
    this.io.to(`ticket:${ticket.id}`).emit('ticket:updated', updateData);
    
    // Broadcast to status-specific room
    this.io.to(`tickets:status:${ticket.status}`).emit('ticket:updated', updateData);
    
    // Broadcast to dashboard
    this.io.to('dashboard:tickets').emit('ticket:updated', updateData);
    
    // Broadcast to user-specific room if telegramUserId exists
    if (ticket.telegramUserId) {
      this.io.to(`user:${ticket.telegramUserId}`).emit('ticket:updated', updateData);
      this.io.to(`tickets:user:${ticket.telegramUserId}`).emit('ticket:updated', updateData);
    }
    
    // Broadcast to user-specific room if userId exists
    if (ticket.userId && ticket.userId !== ticket.telegramUserId) {
      this.io.to(`user:${ticket.userId}`).emit('ticket:updated', updateData);
      this.io.to(`tickets:user:${ticket.userId}`).emit('ticket:updated', updateData);
    }

    logger.logTicketEvent(ticket.id, 'updated', undefined, { changes });
  }

  async broadcastTicketStatusChange(ticketId: string, oldStatus: string, newStatus: string, ticket?: any) {
    const statusChangeData = {
      ticketId,
      oldStatus,
      newStatus,
      ticket
    };
    
    // Broadcast to specific ticket room
    this.io.to(`ticket:${ticketId}`).emit('ticket:status_changed', statusChangeData);

    // Broadcast to status-specific rooms
    this.io.to(`tickets:status:${oldStatus}`).emit('ticket:status_changed', statusChangeData);
    this.io.to(`tickets:status:${newStatus}`).emit('ticket:status_changed', statusChangeData);
    
    // Broadcast to dashboard
    this.io.to('dashboard:tickets').emit('ticket:status_changed', statusChangeData);
    
    // Broadcast to user-specific room if ticket data is available
    if (ticket) {
      if (ticket.telegramUserId) {
        this.io.to(`user:${ticket.telegramUserId}`).emit('ticket:status_changed', statusChangeData);
        this.io.to(`tickets:user:${ticket.telegramUserId}`).emit('ticket:status_changed', statusChangeData);
      }
      
      if (ticket.userId && ticket.userId !== ticket.telegramUserId) {
        this.io.to(`user:${ticket.userId}`).emit('ticket:status_changed', statusChangeData);
        this.io.to(`tickets:user:${ticket.userId}`).emit('ticket:status_changed', statusChangeData);
      }
    }

    logger.logTicketEvent(ticketId, 'status_changed', undefined, { oldStatus, newStatus });
  }

  async broadcastTicketCreated(ticket: any) {
    // Validate ticket data before broadcasting
    if (!ticket || !ticket.id) {
      logger.warn('[WebSocket] Invalid ticket data for broadcast', { 
        ticket,
        hasTicket: !!ticket,
        hasId: !!ticket?.id
      });
      return;
    }

    logger.info('[WebSocket] Broadcasting ticket:created event', {
      ticketId: ticket.id,
      source: ticket.telegramUserId ? 'telegram' : 'web'
    });

    // Ensure required fields exist
    const validatedTicket = {
      id: ticket.id,
      subject: ticket.subject || ticket.summary || 'Neues Ticket',
      summary: ticket.summary || ticket.subject || '',
      status: ticket.status || 'open',
      priority: ticket.priority || 'medium',
      category: ticket.category || 'other',
      createdAt: ticket.createdAt || new Date().toISOString(),
      updatedAt: ticket.updatedAt || ticket.createdAt || new Date().toISOString(),
      userId: ticket.userId || null,
      telegramUserId: ticket.telegramUserId || null,
      channel: ticket.channel || (ticket.telegramUserId ? 'telegram' : 'web'),
      messages: ticket.messages || [],
      ...ticket // Include any additional fields
    };

    const eventData = { 
      type: 'ticket:created',
      ticketId: validatedTicket.id,
      ticket: validatedTicket,
      timestamp: new Date().toISOString()
    };

    try {
      const roomsBroadcasted: string[] = [];
      
      // Broadcast to all ticket subscribers (admin dashboard)
      const dashboardRoom = 'dashboard:tickets';
      this.io.to(dashboardRoom).emit('ticket:created', eventData);
      roomsBroadcasted.push(dashboardRoom);
      logger.debug('[WebSocket] Broadcasted to dashboard:tickets room', {
        ticketId: validatedTicket.id
      });
      
      // Broadcast to status-specific room
      const statusRoom = `tickets:status:${validatedTicket.status}`;
      this.io.to(statusRoom).emit('ticket:created', eventData);
      roomsBroadcasted.push(statusRoom);
      logger.debug('[WebSocket] Broadcasted to status room', {
        ticketId: validatedTicket.id,
        status: validatedTicket.status
      });
      
      // Broadcast to user-specific room if telegramUserId exists
      if (validatedTicket.telegramUserId) {
        const telegramUserRoom = `user:${validatedTicket.telegramUserId}`;
        const telegramTicketsRoom = `tickets:user:${validatedTicket.telegramUserId}`;
        this.io.to(telegramUserRoom).emit('ticket:created', eventData);
        this.io.to(telegramTicketsRoom).emit('ticket:created', eventData);
        roomsBroadcasted.push(telegramUserRoom, telegramTicketsRoom);
        logger.debug('[WebSocket] Broadcasted to telegram user rooms', {
          ticketId: validatedTicket.id,
          telegramUserId: validatedTicket.telegramUserId
        });
      }
      
      // Broadcast to user-specific room if userId exists
      if (validatedTicket.userId && validatedTicket.userId !== validatedTicket.telegramUserId) {
        const userRoom = `user:${validatedTicket.userId}`;
        const userTicketsRoom = `tickets:user:${validatedTicket.userId}`;
        this.io.to(userRoom).emit('ticket:created', eventData);
        this.io.to(userTicketsRoom).emit('ticket:created', eventData);
        roomsBroadcasted.push(userRoom, userTicketsRoom);
        logger.debug('[WebSocket] Broadcasted to web user rooms', {
          ticketId: validatedTicket.id,
          userId: validatedTicket.userId
        });
      }

      // Also broadcast to specific ticket room for detail views
      const ticketRoom = `ticket:${validatedTicket.id}`;
      this.io.to(ticketRoom).emit('ticket:created', eventData);
      roomsBroadcasted.push(ticketRoom);
      logger.debug('[WebSocket] Broadcasted to ticket-specific room', {
        ticketId: validatedTicket.id
      });

      logger.logTicketEvent(validatedTicket.id, 'created', undefined, { 
        status: validatedTicket.status, 
        priority: validatedTicket.priority,
        category: validatedTicket.category,
        roomsBroadcasted: roomsBroadcasted.length
      });

      logger.info('[WebSocket] Ticket:created event broadcasted successfully', {
        ticketId: validatedTicket.id,
        roomsCount: roomsBroadcasted.length,
        rooms: roomsBroadcasted
      });
    } catch (error) {
      logger.error('[WebSocket] Error broadcasting ticket:created event', {
        ticketId: validatedTicket.id,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  async broadcastTicketMessageAdded(ticketId: string, message: any, ticket: any) {
    // Broadcast to specific ticket room
    this.io.to(`ticket:${ticketId}`).emit('ticket:message_added', {
      ticketId,
      message,
      ticket
    });

    // Broadcast to status-specific room
    this.io.to(`tickets:status:${ticket.status}`).emit('ticket:message_added', {
      ticketId,
      message,
      ticket
    });

    // Broadcast to dashboard
    this.io.to('dashboard:tickets').emit('ticket:message_added', {
      ticketId,
      message,
      ticket
    });

    // Broadcast to user-specific room if telegramUserId exists
    if (ticket.telegramUserId) {
      this.io.to(`user:${ticket.telegramUserId}`).emit('ticket:message_added', {
        ticketId,
        message,
        ticket
      });
      this.io.to(`tickets:user:${ticket.telegramUserId}`).emit('ticket:message_added', {
        ticketId,
        message,
        ticket
      });
    }

    // Broadcast to user-specific room if userId exists
    if (ticket.userId && ticket.userId !== ticket.telegramUserId) {
      this.io.to(`user:${ticket.userId}`).emit('ticket:message_added', {
        ticketId,
        message,
        ticket
      });
      this.io.to(`tickets:user:${ticket.userId}`).emit('ticket:message_added', {
        ticketId,
        message,
        ticket
      });
    }

    // Also emit as ticket:updated for compatibility
    this.io.to(`ticket:${ticketId}`).emit('ticket:updated', {
      ticket,
      changes: { messageAdded: true }
    });

    logger.logTicketEvent(ticketId, 'message_added', undefined, { 
      messageId: message.id,
      from: message.from 
    });
  }

  // Loyalty Broadcasting Methods
  async broadcastLoyaltyPointsEarned(userId: string, points: number, newTotalPoints: number, newTier: string, orderId?: string, reason?: string) {
    const data = {
      userId,
      points,
      newTotalPoints,
      newTier,
      orderId,
      reason: reason || `Bestellung #${orderId || 'N/A'}`,
      timestamp: new Date().toISOString()
    };

    // Broadcast to user-specific room
    this.io.to(`user:${userId}`).emit('loyalty:points_earned', data);
    this.io.to(`loyalty:user:${userId}`).emit('loyalty:points_earned', data);
    
    // Broadcast to dashboard
    this.io.to('dashboard:loyalty').emit('loyalty:points_earned', data);

    logger.info('Loyalty points earned broadcasted', { userId, points, newTier });
  }

  async broadcastLoyaltyPointsAdjusted(userId: string, points: number, reason: string, orderId?: string) {
    const data = {
      userId,
      points,
      reason,
      orderId,
      timestamp: new Date().toISOString()
    };

    // Broadcast to user-specific room
    this.io.to(`user:${userId}`).emit('loyalty:points_adjusted', data);
    this.io.to(`loyalty:user:${userId}`).emit('loyalty:points_adjusted', data);
    
    // Broadcast to dashboard
    this.io.to('dashboard:loyalty').emit('loyalty:points_adjusted', data);

    logger.info('Loyalty points adjusted broadcasted', { userId, points, reason });
  }

  async broadcastLoyaltyTierUpgraded(userId: string, oldTier: string, newTier: string) {
    const data = {
      userId,
      oldTier,
      newTier,
      timestamp: new Date().toISOString()
    };

    // Broadcast to user-specific room
    this.io.to(`user:${userId}`).emit('loyalty:tier_upgraded', data);
    this.io.to(`loyalty:user:${userId}`).emit('loyalty:tier_upgraded', data);
    
    // Broadcast to dashboard
    this.io.to('dashboard:loyalty').emit('loyalty:tier_upgraded', data);

    logger.info('Loyalty tier upgraded broadcasted', { userId, oldTier, newTier });
  }

  // Payment Broadcasting Methods
  async broadcastPaymentInitiated(paymentId: string, method: string, amount: number, userId: string) {
    this.io.to(`payment:${paymentId}`).emit('payment:initiated', {
      paymentId,
      method,
      amount,
      userId
    });

    this.io.to(`payments:user:${userId}`).emit('payment:initiated', {
      paymentId,
      method,
      amount
    });

    logger.info('Payment initiated broadcasted', { paymentId, method, amount });
  }

  async broadcastBtcMempool(paymentId: string, txHash: string, fee: number, eta: string) {
    this.io.to(`payment:${paymentId}`).emit('payment:btc_mempool', {
      paymentId,
      txHash,
      fee,
      eta
    });

    logger.info('BTC mempool broadcasted', { paymentId, txHash, fee });
  }

  async broadcastBtcConfirmed(paymentId: string, txHash: string, confirmations: number, blockHeight: number) {
    this.io.to(`payment:${paymentId}`).emit('payment:btc_confirmed', {
      paymentId,
      txHash,
      confirmations,
      blockHeight
    });

    logger.info('BTC confirmation broadcasted', { paymentId, txHash, confirmations });
  }

  async broadcastEthPending(paymentId: string, txHash: string, gasPrice: string, nonce: number) {
    this.io.to(`payment:${paymentId}`).emit('payment:eth_pending', {
      paymentId,
      txHash,
      gasPrice,
      nonce
    });

    logger.info('ETH pending broadcasted', { paymentId, txHash, gasPrice });
  }

  async broadcastEthConfirmed(paymentId: string, txHash: string, confirmations: number) {
    this.io.to(`payment:${paymentId}`).emit('payment:eth_confirmed', {
      paymentId,
      txHash,
      confirmations
    });

    logger.info('ETH confirmation broadcasted', { paymentId, txHash, confirmations });
  }

  async broadcastVoucherValidated(paymentId: string, code: string, amount: number, provider: string) {
    this.io.to(`payment:${paymentId}`).emit('payment:voucher_validated', {
      paymentId,
      code,
      amount,
      provider
    });

    logger.info('Voucher validation broadcasted', { paymentId, code, amount });
  }

  async broadcastPaymentCompleted(paymentId: string, orderId: string, trackingNumber?: string) {
    this.io.to(`payment:${paymentId}`).emit('payment:completed', {
      paymentId,
      orderId,
      trackingNumber
    });

    logger.info('Payment completion broadcasted', { paymentId, orderId, trackingNumber });
  }

  async broadcastPaymentFailed(paymentId: string, reason: string) {
    this.io.to(`payment:${paymentId}`).emit('payment:failed', {
      paymentId,
      reason
    });

    logger.warn('Payment failure broadcasted', { paymentId, reason });
  }

  async broadcastOrderCreated(orderId: string, order: any, timestamp: string = new Date().toISOString()) {
    const event: OrderCreatedEvent = {
      type: 'order:created',
      orderId,
      order,
      timestamp
    };

    this.io.to('orders:all').emit('order:created', event);
    this.broadcastShopEvent({ type: 'order:created', payload: event });
    logger.info('Order created broadcasted', { orderId });
  }

  async broadcastOrderStatusChange(orderId: string, oldStatus: string, newStatus: string, trackingSteps: any[]) {
    this.io.to(`order:${orderId}`).emit('order:status_changed', {
      orderId,
      oldStatus,
      newStatus,
      trackingSteps
    });

    logger.info('Order status change broadcasted', { orderId, oldStatus, newStatus });
  }

  async broadcastOrderShipped(orderId: string, trackingNumber: string, carrier: string) {
    this.io.to(`order:${orderId}`).emit('order:shipped', {
      orderId,
      trackingNumber,
      carrier
    });

    logger.info('Order shipment broadcasted', { orderId, trackingNumber, carrier });
  }

  async broadcastProfilePaymentUpdate(userId: string, paymentId: string, status: string) {
    this.io.to(`profile:${userId}:payments`).emit('profile:payment_updated', {
      userId,
      paymentId,
      status
    });

    logger.info('Profile payment update broadcasted', { userId, paymentId, status });
  }

  async broadcastProfileOrderUpdate(userId: string, orderId: string, status: string) {
    this.io.to(`profile:${userId}:orders`).emit('profile:order_updated', {
      userId,
      orderId,
      status
    });

    logger.info('Profile order update broadcasted', { userId, orderId, status });
  }

  async broadcastSystemAlert(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.io.emit('system:alert', { type, message, severity });

    logger.info('System alert broadcasted', { type, severity });
  }

  // ===== BOT BROADCASTING METHODS =====

  // Bot User Events
  async broadcastBotUserJoined(user: any, source: string = 'telegram') {
    this.io.to('bot:users').emit('bot:user_joined', { user, source });
    logger.info('Bot user joined broadcasted', { userId: user.id, source });
  }

  async broadcastBotUserVerified(userId: string, verificationId: string) {
    this.io.to(`bot:user:${userId}`).emit('bot:user_verified', { userId, verificationId });
    this.io.to('bot:users:verified').emit('bot:user_verified', { userId, verificationId });
    logger.info('Bot user verification broadcasted', { userId, verificationId });
  }

  async broadcastBotUserActive(userId: string, lastSeen: string) {
    this.io.to(`bot:user:${userId}`).emit('bot:user_active', { userId, lastSeen });
    this.io.to('bot:users:active').emit('bot:user_active', { userId, lastSeen });
    logger.debug('Bot user active broadcasted', { userId, lastSeen });
  }

  // Bot Verification Events
  async broadcastBotVerificationCreated(verification: any) {
    this.io.to('bot:verifications:all').emit('bot:verification_created', { verification });
    this.io.to(`bot:verification:${verification.id}`).emit('bot:verification_created', { verification });
    logger.info('Bot verification created broadcasted', { verificationId: verification.id });
  }

  async broadcastBotVerificationPending(verificationId: string, userId: string) {
    this.io.to('bot:verifications:all').emit('bot:verification_pending', { verificationId, userId });
    this.io.to('bot:verifications:status:pending_review').emit('bot:verification_pending', { verificationId, userId });
    this.io.to(`bot:verification:${verificationId}`).emit('bot:verification_pending', { verificationId, userId });
    logger.info('Bot verification pending broadcasted', { verificationId, userId });
  }

  async broadcastBotVerificationApproved(verificationId: string, userId: string, adminId: string) {
    this.io.to('bot:verifications:all').emit('bot:verification_approved', { verificationId, userId, adminId });
    this.io.to('bot:verifications:status:approved').emit('bot:verification_approved', { verificationId, userId, adminId });
    this.io.to(`bot:verification:${verificationId}`).emit('bot:verification_approved', { verificationId, userId, adminId });
    this.io.to(`bot:user:${userId}`).emit('bot:verification_approved', { verificationId, userId, adminId });
    logger.info('Bot verification approved broadcasted', { verificationId, userId, adminId });
  }

  async broadcastBotVerificationRejected(verificationId: string, userId: string, adminId: string, reason: string) {
    this.io.to('bot:verifications:all').emit('bot:verification_rejected', { verificationId, userId, adminId, reason });
    this.io.to('bot:verifications:status:rejected').emit('bot:verification_rejected', { verificationId, userId, adminId, reason });
    this.io.to(`bot:verification:${verificationId}`).emit('bot:verification_rejected', { verificationId, userId, adminId, reason });
    this.io.to(`bot:user:${userId}`).emit('bot:verification_rejected', { verificationId, userId, adminId, reason });
    logger.info('Bot verification rejected broadcasted', { verificationId, userId, adminId, reason });
  }

  async broadcastBotVerificationQueueUpdate(pendingCount: number, totalCount: number) {
    this.io.to('bot:dashboard').emit('bot:verification_queue_update', { pendingCount, totalCount });
    logger.info('Bot verification queue update broadcasted', { pendingCount, totalCount });
  }

  // Bot Invite Code Events
  async broadcastBotInviteCodeCreated(inviteCode: any) {
    this.io.to('bot:invite_codes:all').emit('bot:invite_code_created', { inviteCode });
    this.io.to(`bot:invite_code:${inviteCode.id}`).emit('bot:invite_code_created', { inviteCode });
    logger.info('Bot invite code created broadcasted', { code: inviteCode.code });
  }

  async broadcastBotInviteCodeUsed(code: string, userId: string, usedBy: string) {
    this.io.to('bot:invite_codes:all').emit('bot:invite_code_used', { code, userId, usedBy });
    this.io.to(`bot:invite_code:${code}`).emit('bot:invite_code_used', { code, userId, usedBy });
    logger.info('Bot invite code used broadcasted', { code, userId, usedBy });
  }

  async broadcastBotInviteCodeExpired(code: string, reason: string) {
    this.io.to('bot:invite_codes:all').emit('bot:invite_code_expired', { code, reason });
    this.io.to(`bot:invite_code:${code}`).emit('bot:invite_code_expired', { code, reason });
    logger.info('Bot invite code expired broadcasted', { code, reason });
  }

  async broadcastBotInviteCodesStats(stats: { total: number; active: number; used: number }) {
    this.io.to('bot:dashboard').emit('bot:invite_codes_stats', { ...stats, timestamp: new Date().toISOString() });
    logger.info('Bot invite codes stats broadcasted', stats);
  }

  // Personal Invite Code Events
  async broadcastPersonalInviteCodeUpdated(telegramId: number, personalInviteCode: string) {
    const data = {
      telegramId,
      personalInviteCode,
      timestamp: new Date().toISOString()
    };
    this.io.to(`user:${telegramId}`).emit('user:personal_invite_code_updated', data);
    this.io.to('homepage').emit('user:personal_invite_code_updated', data);
    logger.info('Personal invite code updated broadcasted', { telegramId, personalInviteCode });
  }

  // Homepage Live Verification Events
  async broadcastHomepageVerificationLive(data: { telegramId: number, userName: string, inviterTelegramId?: number, timestamp: string }) {
    this.io.to('homepage').emit('homepage:verification_live', data);
    if (data.inviterTelegramId) {
      this.io.to(`user:${data.inviterTelegramId}`).emit('homepage:verification_live', data);
    }
    logger.info('Homepage verification live broadcasted', data);
  }

  // Bot Analytics Events
  async broadcastBotAnalyticsUpdate(eventType: string, count: number) {
    this.io.to('bot:analytics:all').emit('bot:analytics_update', { eventType, count, timestamp: new Date().toISOString() });
    this.io.to(`bot:analytics:${eventType}`).emit('bot:analytics_update', { eventType, count, timestamp: new Date().toISOString() });
    logger.debug('Bot analytics update broadcasted', { eventType, count });
  }

  // ===== COOKIE CLICKER LEADERBOARD BROADCASTING =====

  // 🚀 Optimierte Leaderboard-Broadcasts mit Delta-Updates und Compression
  private lastLeaderboardCache: Map<string, any> = new Map();

  async broadcastCookieLeaderboardUpdate(type?: 'totalCookies' | 'cps' | 'timePlayed') {
    try {
      const types = type ? [type] : ['totalCookies', 'cps', 'timePlayed'];
      
      for (const leaderboardType of types) {
        const leaderboard = await databaseService.getCookieClickerLeaderboard(leaderboardType, 100);
        const cacheKey = `leaderboard:${leaderboardType}`;
        const lastLeaderboard = this.lastLeaderboardCache.get(cacheKey);
        
        // 🎯 Delta-Update: Nur Änderungen senden
        let updateData: any;
        if (lastLeaderboard) {
          // Berechne Delta - nur geänderte/neue Einträge
          const delta = this.calculateLeaderboardDelta(lastLeaderboard, leaderboard);
          if (delta.changes.length === 0 && delta.removals.length === 0) {
            // Keine Änderungen - skip broadcast
            continue;
          }
          updateData = {
            type: leaderboardType,
            delta,
            timestamp: new Date().toISOString(),
            isDelta: true
          };
        } else {
          // Erster Broadcast - vollständige Daten
          updateData = {
            type: leaderboardType,
            leaderboard,
            timestamp: new Date().toISOString(),
            isDelta: false
          };
        }
        
        // 🚀 Compression für große Payloads
        const payload = JSON.stringify(updateData);
        const shouldCompress = payload.length > 1024; // Compress wenn > 1KB
        
        if (shouldCompress) {
          const { gzip } = await import('zlib');
          const { promisify } = await import('util');
          const gzipAsync = promisify(gzip);
          const compressed = await gzipAsync(Buffer.from(payload));
          
          // Broadcast compressed data
          this.io.to('cookie:leaderboard').emit('cookie:leaderboard_update', {
            compressed: true,
            data: compressed.toString('base64')
          });
          
          this.io.to(`cookie:leaderboard:${leaderboardType}`).emit('cookie:leaderboard_update', {
            compressed: true,
            data: compressed.toString('base64')
          });
        } else {
          // Broadcast uncompressed
          this.io.to('cookie:leaderboard').emit('cookie:leaderboard_update', updateData);
          this.io.to(`cookie:leaderboard:${leaderboardType}`).emit('cookie:leaderboard_update', updateData);
        }
        
        // Update cache
        this.lastLeaderboardCache.set(cacheKey, leaderboard);
      }
      
      logger.debug('Cookie leaderboard update broadcasted', { type });
    } catch (error) {
      logger.error('Error broadcasting cookie leaderboard update:', error);
    }
  }

  // 🎯 Berechne Delta zwischen zwei Leaderboards
  private calculateLeaderboardDelta(oldLeaderboard: any[], newLeaderboard: any[]): {
    changes: Array<{ rank: number; player: any }>;
    removals: number[];
    additions: Array<{ rank: number; player: any }>;
  } {
    const changes: Array<{ rank: number; player: any }> = [];
    const removals: number[] = [];
    const additions: Array<{ rank: number; player: any }> = [];
    
    const oldMap = new Map(oldLeaderboard.map((p, i) => [p.userId, { ...p, oldRank: i + 1 }]));
    const newMap = new Map(newLeaderboard.map((p, i) => [p.userId, { ...p, newRank: i + 1 }]));
    
    // Find changes and removals
    oldMap.forEach((oldPlayer, userId) => {
      const newPlayer = newMap.get(userId);
      if (!newPlayer) {
        removals.push(oldPlayer.oldRank);
      } else if (
        oldPlayer.totalCookies !== newPlayer.totalCookies ||
        oldPlayer.rank !== newPlayer.rank
      ) {
        changes.push({ rank: newPlayer.rank, player: newPlayer });
      }
    });
    
    // Find additions
    newMap.forEach((newPlayer, userId) => {
      if (!oldMap.has(userId)) {
        additions.push({ rank: newPlayer.rank, player: newPlayer });
      }
    });
    
    return { changes, removals, additions };
  }

  async broadcastBotPerformanceMetrics(metrics: { responseTime: number; uptime: number; errorRate: number }) {
    this.io.to('bot:dashboard').emit('bot:performance_metrics', { ...metrics, timestamp: new Date().toISOString() });
    logger.info('Bot performance metrics broadcasted', metrics);
  }

  // Bot Admin Events
  async broadcastBotAdminAction(adminId: string, action: string, target: string, metadata: any) {
    this.io.to('bot:admin').emit('bot:admin_action', { adminId, action, target, metadata, timestamp: new Date().toISOString() });
    logger.info('Bot admin action broadcasted', { adminId, action, target });
  }

  async broadcastBotAdminDashboardAccess(adminId: string) {
    this.io.to('bot:admin').emit('bot:admin_dashboard_access', { adminId, timestamp: new Date().toISOString() });
    logger.info('Bot admin dashboard access broadcasted', { adminId });
  }

  // Bot System Events
  async broadcastBotSystemAlert(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical') {
    this.io.to('bot:system').emit('bot:system_alert', { type, message, severity, timestamp: new Date().toISOString() });
    logger.info('Bot system alert broadcasted', { type, severity });
  }

  async broadcastBotHealthStatus(status: 'healthy' | 'degraded' | 'unhealthy', metrics: any) {
    this.io.to('bot:system').emit('bot:health_status', { status, metrics, timestamp: new Date().toISOString() });
    logger.info('Bot health status broadcasted', { status });
  }

  // ===== DROP BROADCASTING METHODS =====

  async broadcastDropCreated(drop: any, adminId?: string) {
    const event: DropCreatedEvent = {
      type: 'drop:created',
      dropId: drop.id,
      drop,
      timestamp: new Date().toISOString(),
      adminId
    };

    this.io.to('drops:all').emit('drop:created', event);
    this.broadcastShopEvent({ type: 'drop:created', payload: event });
    logger.info('Drop created broadcasted', { dropId: drop.id, adminId });
  }

  async broadcastDropUpdated(dropId: string, changes: any[], fullDrop: any, adminId?: string) {
    const event: DropUpdatedEvent = {
      type: 'drop:updated',
      dropId,
      drop: fullDrop,
      changes,
      timestamp: new Date().toISOString(),
      adminId
    };

    this.io.to(`drop:${dropId}`).emit('drop:updated', event);
    this.io.to('drops:all').emit('drop:updated', event);
    this.broadcastShopEvent({ type: 'drop:updated', payload: event });
    logger.info('Drop updated broadcasted', { dropId, changesCount: changes.length, adminId });
  }

  async broadcastDropDeleted(dropId: string, adminId?: string) {
    const event: DropDeletedEvent = {
      type: 'drop:deleted',
      dropId,
      drop: { id: dropId },
      timestamp: new Date().toISOString(),
      adminId
    };

    this.io.to(`drop:${dropId}`).emit('drop:deleted', event);
    this.io.to('drops:all').emit('drop:deleted', event);
    this.broadcastShopEvent({ type: 'drop:deleted', payload: event });
    logger.info('Drop deleted broadcasted', { dropId, adminId });
  }

  async broadcastDropStockChanged(dropId: string, variantId: string, oldStock: number, newStock: number, adminId?: string) {
    const event: DropStockChangedEvent = {
      type: 'drop:stock_changed',
      dropId,
      drop: { id: dropId },
      variantId,
      oldStock,
      newStock,
      timestamp: new Date().toISOString(),
      adminId
    };

    this.io.to(`drop:${dropId}`).emit('drop:stock_changed', event);
    this.io.to('drops:all').emit('drop:stock_changed', event);
    this.broadcastShopEvent({ type: 'drop:stock_changed', payload: event });
    logger.info('Drop stock changed broadcasted', { dropId, variantId, oldStock, newStock, adminId });
  }

  async broadcastDropStatusChanged(dropId: string, oldStatus: string, newStatus: string, adminId?: string) {
    const event: DropStatusChangedEvent = {
      type: 'drop:status_changed',
      dropId,
      drop: { id: dropId },
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString(),
      adminId
    };

    this.io.to(`drop:${dropId}`).emit('drop:status_changed', event);
    this.io.to('drops:all').emit('drop:status_changed', event);
    this.broadcastShopEvent({ type: 'drop:status_changed', payload: event });
    logger.info('Drop status changed broadcasted', { dropId, oldStatus, newStatus, adminId });
  }

  // Data Fetching Methods
  private async getCurrentKPIs() {
    const cacheKey = 'kpi:current';

    return await cacheService.getOrSet(cacheKey, async () => {
      // Hole echte KPI-Daten aus der Datenbank
      const ticketStats = await databaseService.getTicketStats();

      return {
        openTickets: ticketStats.open,
        waitingTickets: ticketStats.waiting,
        escalatedTickets: ticketStats.escalated,
        totalTickets: ticketStats.total,
        avgResponseTime: 6, // Placeholder
        satisfactionScore: 4.6, // Placeholder
        automationRate: 0.42, // Placeholder
        timestamp: new Date().toISOString()
      };
    }, 30); // 30 Sekunden Cache
  }

  private async getRecentTickets() {
    const cacheKey = 'tickets:recent';

    return await cacheService.getOrSet(cacheKey, async () => {
      return await databaseService.getTickets({ limit: 10 });
    }, 15); // 15 Sekunden Cache
  }

  private async getSystemHealth() {
    const cacheKey = 'system:health';

    return await cacheService.getOrSet(cacheKey, async () => {
      // Prüfe verschiedene System-Komponenten
      const cacheHealth = await cacheService.healthCheck();
      const dbConnection = databaseService.getConnection();

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        components: {
          database: dbConnection.isConnected ? 'healthy' : 'unhealthy',
          cache: cacheHealth.connected ? 'healthy' : 'unhealthy',
          websocket: this.connectedClients.size > 0 ? 'healthy' : 'degraded'
        },
        metrics: {
          connectedClients: this.connectedClients.size,
          uptime: process.uptime()
        }
      };
    }, 60); // 1 Minute Cache
  }

  // Statistics
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      rooms: this.io.sockets.adapter.rooms.size,
      uptime: process.uptime()
    };
  }

  // Cleanup
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.teardownShopEventBridge();
    this.removeAllListeners();
  }
}

// Factory function
let wsServerInstance: WebSocketServer | null = null;

export const initWebSocket = (io: SocketServer) => {
  wsServerInstance = new WebSocketServer(io);
  return wsServerInstance;
};

export const getWebSocketServer = (): WebSocketServer | null => {
  return wsServerInstance;
};

// Payment Monitor Service
export class PaymentMonitor {
  private btcMonitor: BtcTransactionMonitor;
  private ethMonitor: EthTransactionMonitor;
  private voucherMonitor: VoucherMonitor;
  private wsServer: WebSocketServer;

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
    this.btcMonitor = new BtcTransactionMonitor(wsServer);
    this.ethMonitor = new EthTransactionMonitor(wsServer);
    this.voucherMonitor = new VoucherMonitor(wsServer);
  }

  async startMonitoringPayment(paymentId: string, method: string, userId: string, txData?: any) {
    // Broadcast payment initiation
    await this.wsServer.broadcastPaymentInitiated(paymentId, method, txData?.amount || 0, userId);

    switch (method) {
      case 'btc_chain':
        if (txData?.txHash) {
          await this.btcMonitor.trackTransaction(txData.txHash, paymentId, userId);
        }
        break;

      case 'eth_chain':
        if (txData?.txHash) {
          await this.ethMonitor.trackTransaction(txData.txHash, paymentId, userId);
        }
        break;

      case 'crypto_voucher':
        if (txData?.code) {
          await this.voucherMonitor.trackVoucher(txData.code, paymentId, userId);
        }
        break;
    }
  }

  async markPaymentCompleted(paymentId: string, orderId: string, trackingNumber?: string) {
    await this.wsServer.broadcastPaymentCompleted(paymentId, orderId, trackingNumber);
  }

  async markPaymentFailed(paymentId: string, reason: string) {
    await this.wsServer.broadcastPaymentFailed(paymentId, reason);
  }
}

// Bitcoin Transaction Monitor
class BtcTransactionMonitor {
  constructor(private wsServer: WebSocketServer) {}

  async trackTransaction(txHash: string, paymentId: string, userId: string) {
    // Simulate mempool detection
    setTimeout(() => {
      this.wsServer.broadcastBtcMempool(paymentId, txHash, 2.5, '10-30 Minuten');
    }, 1000);

    // Simulate confirmations
    setTimeout(() => {
      this.wsServer.broadcastBtcConfirmed(paymentId, txHash, 1, 812345);
    }, 5000);

    setTimeout(() => {
      this.wsServer.broadcastBtcConfirmed(paymentId, txHash, 3, 812346);
    }, 15000);

    setTimeout(() => {
      this.wsServer.broadcastBtcConfirmed(paymentId, txHash, 6, 812347);
    }, 30000);
  }
}

// Ethereum Transaction Monitor
class EthTransactionMonitor {
  constructor(private wsServer: WebSocketServer) {}

  async trackTransaction(txHash: string, paymentId: string, userId: string) {
    // Simulate pending transaction
    setTimeout(() => {
      this.wsServer.broadcastEthPending(paymentId, txHash, '25.0', 42);
    }, 1000);

    // Simulate confirmations
    setTimeout(() => {
      this.wsServer.broadcastEthConfirmed(paymentId, txHash, 1);
    }, 3000);

    setTimeout(() => {
      this.wsServer.broadcastEthConfirmed(paymentId, txHash, 3);
    }, 8000);

    setTimeout(() => {
      this.wsServer.broadcastEthConfirmed(paymentId, txHash, 12);
    }, 15000);
  }
}

// Voucher Monitor
class VoucherMonitor {
  constructor(private wsServer: WebSocketServer) {}

  async trackVoucher(code: string, paymentId: string, userId: string) {
    // Simulate voucher validation
    setTimeout(() => {
      this.wsServer.broadcastVoucherValidated(paymentId, code, 99.99, 'dundle.com');
    }, 2000);
  }
}
