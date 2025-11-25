import { WebSocketServer } from '../websocket/server';
import { databaseService } from './database';
import { logger } from '../utils/logger';

// Loyalty points calculation and award function
async function awardLoyaltyPointsForOrder(order: Order): Promise<void> {
  try {
    // Check if points were already awarded for this order
    const existingTransaction = await databaseService.findOne<{ orderId: string; type: string }>('loyalty_transactions', {
      orderId: order.id,
      type: 'earned'
    });

    if (existingTransaction) {
      logger.info('Loyalty points already awarded for order', { orderId: order.id });
      return;
    }

    // Calculate points: 1 point per 100€ (1% of order value)
    // Convert to cents for calculation, then divide by 10000 to get points
    const orderValueInEuros = order.totalAmount / 100; // Convert from cents to euros
    const points = Math.floor(orderValueInEuros / 100); // 1 point per 100€ (1% of order value)

    if (points <= 0) {
      logger.info('No loyalty points to award (order value too low)', { orderId: order.id, orderValue: orderValueInEuros });
      return;
    }

    // Create loyalty transaction
    const transaction = {
      id: `loyalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: order.customerId,
      type: 'earned',
      points,
      reason: `Bestellung #${order.orderId}`,
      orderId: order.id,
      timestamp: new Date().toISOString(),
      description: `${points} Punkte für erfolgreich abgeschlossene Bestellung erhalten`
    };

    // Save transaction to database
    await databaseService.create('loyalty_transactions', transaction);

    // Update user's loyalty points (get current points and add new points)
    const userLoyalty = await databaseService.findOne<{ userId: string; currentPoints: number; currentTier: string }>('loyalty', {
      userId: order.customerId
    });

    const newPoints = (userLoyalty?.currentPoints || 0) + points;
    
    // Calculate new tier based on points
    let newTier = 'bronze';
    if (newPoints >= 50000) newTier = 'diamond';
    else if (newPoints >= 15000) newTier = 'platinum';
    else if (newPoints >= 5000) newTier = 'gold';
    else if (newPoints >= 1000) newTier = 'silver';

    // Update or create loyalty record
    if (userLoyalty) {
      await databaseService.update('loyalty', userLoyalty.userId, {
        currentPoints: newPoints,
        currentTier: newTier,
        totalEarned: (userLoyalty.totalEarned || 0) + points,
        updatedAt: new Date().toISOString()
      });
    } else {
      await databaseService.create('loyalty', {
        userId: order.customerId,
        currentPoints: newPoints,
        currentTier: newTier,
        totalEarned: points,
        totalRedeemed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    logger.info('Loyalty points awarded for order', {
      orderId: order.id,
      userId: order.customerId,
      points,
      orderValue: orderValueInEuros,
      newTier
    });

    // Broadcast loyalty points update via WebSocket
    const wsServer = WebSocketServer.getInstance();
    if (wsServer) {
      await wsServer.broadcastLoyaltyPointsEarned(
        order.customerId,
        points,
        newPoints,
        newTier,
        order.id,
        `Bestellung #${order.orderId}`
      );
    }
  } catch (error) {
    logger.error('Failed to award loyalty points for order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: order.id,
      userId: order.customerId
    });
    // Don't throw - we don't want to fail the order status update if loyalty points fail
  }
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
  notes: OrderNote[];
  timeline: OrderEvent[];
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
  category?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  vatNumber?: string;
}

export interface OrderNote {
  id: string;
  content: string;
  author: string;
  isInternal: boolean;
  createdAt: string;
}

export interface OrderEvent {
  id: string;
  type: 'status_changed' | 'payment_confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'note_added' | 'tracking_updated' | 'return_requested' | 'return_approved' | 'return_rejected' | 'refund_processed';
  title: string;
  description: string;
  status?: string;
  oldStatus?: string;
  newStatus?: string;
  trackingNumber?: string;
  carrier?: string;
  author?: string;
  timestamp: string;
  metadata?: any;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  returnNumber: string;
  items: Array<{
    orderItemId: string;
    productId: string;
    productName: string;
    quantity: number;
    reason: string;
  }>;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'in_transit' | 'received' | 'completed';
  requestedAt: string;
  approvedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  refundAmount?: number;
  refundedAt?: string;
  adminNotes?: string;
  customerNotes?: string;
}

export interface OrderRefund {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  type: 'full' | 'partial';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: string;
  completedAt?: string;
  paymentMethod: string;
  transactionId?: string;
  adminNotes?: string;
}

export interface OrderExchange {
  id: string;
  originalOrderId: string;
  newOrderId?: string;
  exchangeNumber: string;
  items: Array<{
    originalItemId: string;
    originalProductId: string;
    originalProductName: string;
    newProductId: string;
    newProductName: string;
    quantity: number;
    reason: string;
    priceDifference: number;
  }>;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'processing' | 'completed';
  requestedAt: string;
  approvedAt?: string;
  completedAt?: string;
  totalPriceDifference: number;
  additionalPaymentRequired?: number;
  refundAmount?: number;
  adminNotes?: string;
  customerNotes?: string;
}

export interface OrderFilters {
  status?: string[];
  paymentStatus?: string[];
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  hasTracking?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface OrderMetrics {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  conversionRate: number;
  refundRate: number;
}

export class OrderService {
  private wsServer: WebSocketServer;

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  // Create new order
  async createOrder(orderData: Partial<Order>): Promise<Order> {
    try {
      const order: Order = {
        id: this.generateOrderId(),
        orderId: this.generateOrderNumber(),
        customerId: orderData.customerId || '',
        customerEmail: orderData.customerEmail || '',
        customerName: orderData.customerName || '',
        status: 'pending',
        totalAmount: orderData.totalAmount || 0,
        currency: orderData.currency || 'EUR',
        items: orderData.items || [],
        shippingAddress: orderData.shippingAddress || {} as ShippingAddress,
        billingAddress: orderData.billingAddress,
        paymentMethod: orderData.paymentMethod || 'card',
        paymentStatus: 'pending',
        paymentId: orderData.paymentId,
        notes: [],
        timeline: [{
          id: this.generateEventId(),
          type: 'status_changed',
          title: 'Order Created',
          description: 'Order has been created and is pending payment',
          status: 'pending',
          timestamp: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const createdOrder = await databaseService.create('orders', order);

      // Broadcast order created event
      await this.broadcastOrderUpdate('order:created', {
        orderId: createdOrder.id,
        order: createdOrder,
        timestamp: new Date().toISOString()
      });

      logger.info('Order created', { orderId: createdOrder.id, customerId: createdOrder.customerId });
      return createdOrder;
    } catch (error) {
      logger.error('Failed to create order', { error: error.message, orderData });
      throw error;
    }
  }

  // Get orders with filters
  async getOrders(filters: OrderFilters = {}): Promise<{ orders: Order[]; total: number; metrics: OrderMetrics }> {
    try {
      const allOrders = await databaseService.findMany<Order>('orders');
      
      let filteredOrders = allOrders;

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        filteredOrders = filteredOrders.filter(order => filters.status!.includes(order.status));
      }

      if (filters.paymentStatus && filters.paymentStatus.length > 0) {
        filteredOrders = filteredOrders.filter(order => filters.paymentStatus!.includes(order.paymentStatus));
      }

      if (filters.dateFrom) {
        filteredOrders = filteredOrders.filter(order => order.createdAt >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        filteredOrders = filteredOrders.filter(order => order.createdAt <= filters.dateTo!);
      }

      if (filters.customerId) {
        filteredOrders = filteredOrders.filter(order => order.customerId === filters.customerId);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.orderId.toLowerCase().includes(searchTerm) ||
          order.customerName.toLowerCase().includes(searchTerm) ||
          order.customerEmail.toLowerCase().includes(searchTerm) ||
          order.items.some(item => item.productName.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.minAmount !== undefined) {
        filteredOrders = filteredOrders.filter(order => order.totalAmount >= filters.minAmount!);
      }

      if (filters.maxAmount !== undefined) {
        filteredOrders = filteredOrders.filter(order => order.totalAmount <= filters.maxAmount!);
      }

      if (filters.hasTracking !== undefined) {
        filteredOrders = filteredOrders.filter(order => 
          filters.hasTracking ? !!order.trackingNumber : !order.trackingNumber
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredOrders.sort((a, b) => {
          const aValue = a[filters.sortBy!];
          const bValue = b[filters.sortBy!];
          const order = filters.sortOrder === 'desc' ? -1 : 1;
          return aValue > bValue ? order : aValue < bValue ? -order : 0;
        });
      }

      // Apply pagination
      const total = filteredOrders.length;
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      const paginatedOrders = filteredOrders.slice(offset, offset + limit);

      // Calculate metrics
      const metrics = await this.calculateOrderMetrics(allOrders);

      return {
        orders: paginatedOrders,
        total,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get orders', { error: error.message, filters });
      throw error;
    }
  }

  // Get single order
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const order = await databaseService.findById<Order>('orders', orderId);
      return order;
    } catch (error) {
      logger.error('Failed to get order', { error: error.message, orderId });
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['status'], trackingInfo?: {
    trackingNumber?: string;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }): Promise<Order> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const oldStatus = order.status;
      const now = new Date().toISOString();

      // Update order
      const updatedOrder = await databaseService.update<Order>('orders', orderId, {
        status,
        trackingNumber: trackingInfo?.trackingNumber || order.trackingNumber,
        trackingUrl: trackingInfo?.trackingUrl || order.trackingUrl,
        carrier: trackingInfo?.carrier || order.carrier,
        estimatedDelivery: trackingInfo?.estimatedDelivery || order.estimatedDelivery,
        shippedAt: status === 'shipped' ? now : order.shippedAt,
        deliveredAt: status === 'delivered' ? now : order.deliveredAt,
        cancelledAt: status === 'cancelled' ? now : order.cancelledAt,
        refundedAt: status === 'refunded' ? now : order.refundedAt,
        updatedAt: now
      });

      if (!updatedOrder) {
        throw new Error('Failed to update order');
      }

      // Add timeline event
      const event = this.generateStatusChangeEvent(oldStatus, status, trackingInfo);
      updatedOrder.timeline.push(event);

      await databaseService.update<Order>('orders', orderId, {
        timeline: updatedOrder.timeline
      });

      // Award loyalty points if order is delivered (completed)
      if (status === 'delivered' && oldStatus !== 'delivered') {
        await awardLoyaltyPointsForOrder(updatedOrder);
      }

      // Broadcast update
      await this.broadcastOrderUpdate('order:status_changed', {
        orderId,
        oldStatus,
        newStatus: status,
        trackingInfo,
        timestamp: now
      });

      logger.info('Order status updated', { orderId, oldStatus, newStatus: status });
      return updatedOrder;
    } catch (error) {
      logger.error('Failed to update order status', { error: error.message, orderId, status });
      throw error;
    }
  }

  // Update tracking info
  async updateOrderTracking(orderId: string, trackingInfo: {
    trackingNumber: string;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }): Promise<Order> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const updatedOrder = await databaseService.update<Order>('orders', orderId, {
        trackingNumber: trackingInfo.trackingNumber,
        trackingUrl: trackingInfo.trackingUrl,
        carrier: trackingInfo.carrier,
        estimatedDelivery: trackingInfo.estimatedDelivery,
        updatedAt: new Date().toISOString()
      });

      if (!updatedOrder) {
        throw new Error('Failed to update order tracking');
      }

      // Add timeline event
      const event: OrderEvent = {
        id: this.generateEventId(),
        type: 'tracking_updated',
        title: 'Tracking Updated',
        description: `Tracking number: ${trackingInfo.trackingNumber}`,
        trackingNumber: trackingInfo.trackingNumber,
        carrier: trackingInfo.carrier,
        timestamp: new Date().toISOString()
      };

      updatedOrder.timeline.push(event);
      await databaseService.update<Order>('orders', orderId, {
        timeline: updatedOrder.timeline
      });

      // Broadcast update
      await this.broadcastOrderUpdate('order:tracking_updated', {
        orderId,
        trackingInfo,
        timestamp: new Date().toISOString()
      });

      logger.info('Order tracking updated', { orderId, trackingNumber: trackingInfo.trackingNumber });
      return updatedOrder;
    } catch (error) {
      logger.error('Failed to update order tracking', { error: error.message, orderId, trackingInfo });
      throw error;
    }
  }

  // Add order note
  async addOrderNote(orderId: string, content: string, author: string, isInternal: boolean = false): Promise<Order> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const note: OrderNote = {
        id: this.generateEventId(),
        content,
        author,
        isInternal,
        createdAt: new Date().toISOString()
      };

      const updatedNotes = [...order.notes, note];
      const updatedOrder = await databaseService.update<Order>('orders', orderId, {
        notes: updatedNotes,
        updatedAt: new Date().toISOString()
      });

      if (!updatedOrder) {
        throw new Error('Failed to add order note');
      }

      // Add timeline event
      const event: OrderEvent = {
        id: this.generateEventId(),
        type: 'note_added',
        title: 'Note Added',
        description: isInternal ? 'Internal note added' : 'Note added',
        author,
        timestamp: new Date().toISOString(),
        metadata: { isInternal }
      };

      updatedOrder.timeline.push(event);
      await databaseService.update<Order>('orders', orderId, {
        timeline: updatedOrder.timeline
      });

      // Broadcast update
      await this.broadcastOrderUpdate('order:updated', {
        orderId,
        changes: { noteAdded: true },
        timestamp: new Date().toISOString()
      });

      logger.info('Order note added', { orderId, author, isInternal });
      return updatedOrder;
    } catch (error) {
      logger.error('Failed to add order note', { error: error.message, orderId, content });
      throw error;
    }
  }

  // Bulk update orders
  async bulkUpdateOrders(orderIds: string[], updates: Partial<Order>): Promise<{ success: number; failed: number; errors: any[] }> {
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const orderId of orderIds) {
      try {
        await databaseService.update<Order>('orders', orderId, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ orderId, error: error.message });
      }
    }

    // Broadcast bulk update
    await this.broadcastOrderUpdate('order:bulk_updated', {
      orderIds,
      updates,
      results,
      timestamp: new Date().toISOString()
    });

    logger.info('Bulk order update completed', results);
    return results;
  }

  // Calculate order metrics
  async calculateOrderMetrics(orders: Order[]): Promise<OrderMetrics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const refundedOrders = orders.filter(o => o.status === 'refunded').length;

    const totalRevenue = orders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersToday = orders.filter(o => new Date(o.createdAt) >= today).length;
    const ordersThisWeek = orders.filter(o => new Date(o.createdAt) >= weekAgo).length;
    const ordersThisMonth = orders.filter(o => new Date(o.createdAt) >= monthAgo).length;

    const conversionRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
    const refundRate = totalOrders > 0 ? (refundedOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      refundedOrders,
      totalRevenue,
      averageOrderValue,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      conversionRate,
      refundRate
    };
  }

  // Generate tracking steps
  generateTrackingSteps(status: Order['status']): Array<{
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'current' | 'pending';
    timestamp?: string;
    eta?: string;
  }> {
    const steps = [
      { id: 'ordered', title: 'Bestellt', description: 'Bestellung erhalten', status: 'completed' as const },
      { id: 'processing', title: 'In Bearbeitung', description: 'Artikel werden vorbereitet', status: 'pending' as const },
      { id: 'shipped', title: 'Versendet', description: 'Paket ist unterwegs', status: 'pending' as const },
      { id: 'out_for_delivery', title: 'In Zustellung', description: 'Paket wird zugestellt', status: 'pending' as const },
      { id: 'delivered', title: 'Zugestellt', description: 'Paket wurde zugestellt', status: 'pending' as const }
    ];

    const statusMap = {
      pending: 0,
      processing: 1,
      shipped: 2,
      delivered: 4,
      cancelled: 0,
      refunded: 0
    };

    const currentStep = statusMap[status] || 0;

    return steps.map((step, index) => ({
      ...step,
      status: index < currentStep ? 'completed' as const : 
              index === currentStep ? 'current' as const : 'pending' as const,
      timestamp: index < currentStep ? new Date().toISOString() : undefined,
      eta: index === currentStep ? 'Morgen, 14:00-16:00' : undefined
    }));
  }

  // Broadcast order update
  private async broadcastOrderUpdate(eventType: string, data: any): Promise<void> {
    try {
      if (this.wsServer) {
        this.wsServer.broadcast(eventType, data);
      }
    } catch (error) {
      logger.error('Failed to broadcast order update', { error: error.message, eventType, data });
    }
  }

  // Generate status change event
  private generateStatusChangeEvent(oldStatus: string, newStatus: string, trackingInfo?: any): OrderEvent {
    const statusTitles = {
      pending: 'Order Created',
      processing: 'Processing Started',
      shipped: 'Order Shipped',
      delivered: 'Order Delivered',
      cancelled: 'Order Cancelled',
      refunded: 'Order Refunded'
    };

    return {
      id: this.generateEventId(),
      type: 'status_changed',
      title: statusTitles[newStatus as keyof typeof statusTitles] || 'Status Changed',
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      oldStatus,
      newStatus,
      trackingNumber: trackingInfo?.trackingNumber,
      carrier: trackingInfo?.carrier,
      timestamp: new Date().toISOString(),
      metadata: trackingInfo
    };
  }

  // Generate unique IDs
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOrderNumber(): string {
    return `ORD-${Date.now().toString(36).toUpperCase()}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== RETURNS & REFUNDS ====================

  // Request order return
  async requestReturn(orderId: string, returnData: {
    items: Array<{
      orderItemId: string;
      productId: string;
      productName: string;
      quantity: number;
      reason: string;
    }>;
    reason: string;
    customerNotes?: string;
  }): Promise<OrderReturn> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const orderReturn: OrderReturn = {
        id: this.generateEventId(),
        orderId,
        returnNumber: `RET-${Date.now().toString(36).toUpperCase()}`,
        items: returnData.items,
        reason: returnData.reason,
        status: 'requested',
        requestedAt: new Date().toISOString(),
        customerNotes: returnData.customerNotes,
      };

      await databaseService.create('order_returns', orderReturn);

      // Add timeline event
      const event: OrderEvent = {
        id: this.generateEventId(),
        type: 'return_requested',
        title: 'Return Requested',
        description: `Customer requested return: ${returnData.reason}`,
        timestamp: new Date().toISOString(),
        metadata: { returnId: orderReturn.id }
      };

      order.timeline.push(event);
      await databaseService.update('orders', orderId, { timeline: order.timeline });

      // Broadcast return request
      await this.broadcastOrderUpdate('order:return_requested', {
        orderId,
        returnId: orderReturn.id,
        timestamp: new Date().toISOString()
      });

      logger.info('Order return requested', { orderId, returnId: orderReturn.id });
      return orderReturn;
    } catch (error) {
      logger.error('Failed to request return', { error: error.message, orderId });
      throw error;
    }
  }

  // Approve/reject return
  async updateReturnStatus(returnId: string, status: OrderReturn['status'], adminNotes?: string): Promise<OrderReturn> {
    try {
      const orderReturn = await databaseService.findById<OrderReturn>('order_returns', returnId);
      if (!orderReturn) {
        throw new Error('Return not found');
      }

      const now = new Date().toISOString();
      const updates: Partial<OrderReturn> = {
        status,
        adminNotes,
        approvedAt: status === 'approved' ? now : orderReturn.approvedAt,
        receivedAt: status === 'received' ? now : orderReturn.receivedAt,
        completedAt: status === 'completed' ? now : orderReturn.completedAt,
      };

      const updatedReturn = await databaseService.update<OrderReturn>('order_returns', returnId, updates);
      if (!updatedReturn) {
        throw new Error('Failed to update return');
      }

      // Add timeline event to order
      const order = await this.getOrder(orderReturn.orderId);
      if (order) {
        const event: OrderEvent = {
          id: this.generateEventId(),
          type: status === 'approved' ? 'return_approved' : 'return_rejected',
          title: status === 'approved' ? 'Return Approved' : 'Return Rejected',
          description: adminNotes || `Return ${status}`,
          timestamp: now,
          metadata: { returnId }
        };

        order.timeline.push(event);
        await databaseService.update('orders', orderReturn.orderId, { timeline: order.timeline });
      }

      // Broadcast return status update
      await this.broadcastOrderUpdate('order:return_updated', {
        orderId: orderReturn.orderId,
        returnId,
        status,
        timestamp: now
      });

      logger.info('Return status updated', { returnId, status });
      return updatedReturn;
    } catch (error) {
      logger.error('Failed to update return status', { error: error.message, returnId, status });
      throw error;
    }
  }

  // Process refund
  async processRefund(orderId: string, refundData: {
    amount: number;
    reason: string;
    type: 'full' | 'partial';
    adminNotes?: string;
  }): Promise<OrderRefund> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (refundData.type === 'full' && refundData.amount !== order.totalAmount) {
        throw new Error('Full refund amount must match order total');
      }

      if (refundData.amount > order.totalAmount) {
        throw new Error('Refund amount cannot exceed order total');
      }

      const now = new Date().toISOString();
      const refund: OrderRefund = {
        id: this.generateEventId(),
        orderId,
        amount: refundData.amount,
        reason: refundData.reason,
        type: refundData.type,
        status: 'pending',
        paymentMethod: order.paymentMethod,
        adminNotes: refundData.adminNotes,
        processedAt: now,
      };

      await databaseService.create('order_refunds', refund);

      // Update order status if full refund
      if (refundData.type === 'full') {
        await this.updateOrderStatus(orderId, 'refunded');
      }

      // Update payment status
      await databaseService.update<Order>('orders', orderId, {
        paymentStatus: 'refunded',
        refundedAt: now
      });

      // Add timeline event
      const event: OrderEvent = {
        id: this.generateEventId(),
        type: 'refund_processed',
        title: 'Refund Processed',
        description: `${refundData.type === 'full' ? 'Full' : 'Partial'} refund of €${refundData.amount.toFixed(2)}`,
        timestamp: now,
        metadata: { refundId: refund.id, amount: refundData.amount }
      };

      order.timeline.push(event);
      await databaseService.update('orders', orderId, { timeline: order.timeline });

      // Broadcast refund processed
      await this.broadcastOrderUpdate('order:refund_processed', {
        orderId,
        refundId: refund.id,
        amount: refundData.amount,
        type: refundData.type,
        timestamp: now
      });

      logger.info('Refund processed', { orderId, refundId: refund.id, amount: refundData.amount });
      return refund;
    } catch (error) {
      logger.error('Failed to process refund', { error: error.message, orderId, refundData });
      throw error;
    }
  }

  // Get order returns
  async getOrderReturns(orderId: string): Promise<OrderReturn[]> {
    try {
      const returns = await databaseService.findMany<OrderReturn>('order_returns');
      return returns.filter(r => r.orderId === orderId);
    } catch (error) {
      logger.error('Failed to get order returns', { error: error.message, orderId });
      throw error;
    }
  }

  // Get order refunds
  async getOrderRefunds(orderId: string): Promise<OrderRefund[]> {
    try {
      const refunds = await databaseService.findMany<OrderRefund>('order_refunds');
      return refunds.filter(r => r.orderId === orderId);
    } catch (error) {
      logger.error('Failed to get order refunds', { error: error.message, orderId });
      throw error;
    }
  }

  // ==================== EXCHANGES ====================

  // Request order exchange
  async requestExchange(orderId: string, exchangeData: {
    items: Array<{
      originalItemId: string;
      originalProductId: string;
      originalProductName: string;
      newProductId: string;
      newProductName: string;
      quantity: number;
      reason: string;
      priceDifference: number;
    }>;
    reason: string;
    customerNotes?: string;
  }): Promise<OrderExchange> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const totalPriceDifference = exchangeData.items.reduce((sum, item) => 
        sum + (item.priceDifference * item.quantity), 0
      );

      const exchange: OrderExchange = {
        id: this.generateEventId(),
        originalOrderId: orderId,
        exchangeNumber: `EXC-${Date.now().toString(36).toUpperCase()}`,
        items: exchangeData.items,
        reason: exchangeData.reason,
        status: 'requested',
        requestedAt: new Date().toISOString(),
        totalPriceDifference,
        additionalPaymentRequired: totalPriceDifference > 0 ? totalPriceDifference : undefined,
        refundAmount: totalPriceDifference < 0 ? Math.abs(totalPriceDifference) : undefined,
        customerNotes: exchangeData.customerNotes,
      };

      await databaseService.create('order_exchanges', exchange);

      // Add timeline event
      const event: OrderEvent = {
        id: this.generateEventId(),
        type: 'note_added', // Using existing type for now
        title: 'Exchange Requested',
        description: `Customer requested exchange: ${exchangeData.reason}`,
        timestamp: new Date().toISOString(),
        metadata: { exchangeId: exchange.id, type: 'exchange' }
      };

      order.timeline.push(event);
      await databaseService.update('orders', orderId, { timeline: order.timeline });

      // Broadcast exchange request
      await this.broadcastOrderUpdate('order:exchange_requested', {
        orderId,
        exchangeId: exchange.id,
        timestamp: new Date().toISOString()
      });

      logger.info('Order exchange requested', { orderId, exchangeId: exchange.id });
      return exchange;
    } catch (error) {
      logger.error('Failed to request exchange', { error: error.message, orderId });
      throw error;
    }
  }

  // Approve/process exchange
  async updateExchangeStatus(exchangeId: string, status: OrderExchange['status'], adminNotes?: string): Promise<OrderExchange> {
    try {
      const exchange = await databaseService.findById<OrderExchange>('order_exchanges', exchangeId);
      if (!exchange) {
        throw new Error('Exchange not found');
      }

      const now = new Date().toISOString();
      const updates: Partial<OrderExchange> = {
        status,
        adminNotes,
        approvedAt: status === 'approved' ? now : exchange.approvedAt,
        completedAt: status === 'completed' ? now : exchange.completedAt,
      };

      // If approved, create new order for exchange items
      if (status === 'approved' && !exchange.newOrderId) {
        const originalOrder = await this.getOrder(exchange.originalOrderId);
        if (originalOrder) {
          const newOrder = await this.createOrder({
            customerId: originalOrder.customerId,
            customerEmail: originalOrder.customerEmail,
            customerName: originalOrder.customerName,
            items: exchange.items.map(item => ({
              id: this.generateEventId(),
              productId: item.newProductId,
              productName: item.newProductName,
              variantId: '',
              variantName: '',
              sku: '',
              quantity: item.quantity,
              unitPrice: 0, // Would need to fetch from product
              totalPrice: 0,
            })),
            shippingAddress: originalOrder.shippingAddress,
            billingAddress: originalOrder.billingAddress,
            paymentMethod: originalOrder.paymentMethod,
            totalAmount: Math.abs(exchange.totalPriceDifference),
            currency: originalOrder.currency,
          });

          updates.newOrderId = newOrder.id;
        }
      }

      const updatedExchange = await databaseService.update<OrderExchange>('order_exchanges', exchangeId, updates);
      if (!updatedExchange) {
        throw new Error('Failed to update exchange');
      }

      // Broadcast exchange status update
      await this.broadcastOrderUpdate('order:exchange_updated', {
        orderId: exchange.originalOrderId,
        exchangeId,
        status,
        timestamp: now
      });

      logger.info('Exchange status updated', { exchangeId, status });
      return updatedExchange;
    } catch (error) {
      logger.error('Failed to update exchange status', { error: error.message, exchangeId, status });
      throw error;
    }
  }

  // Get order exchanges
  async getOrderExchanges(orderId: string): Promise<OrderExchange[]> {
    try {
      const exchanges = await databaseService.findMany<OrderExchange>('order_exchanges');
      return exchanges.filter(e => e.originalOrderId === orderId);
    } catch (error) {
      logger.error('Failed to get order exchanges', { error: error.message, orderId });
      throw error;
    }
  }
}

// Export singleton instance
let orderServiceInstance: OrderService | null = null;

export const createOrderService = (wsServer: WebSocketServer): OrderService => {
  if (!orderServiceInstance) {
    orderServiceInstance = new OrderService(wsServer);
  }
  return orderServiceInstance;
};

export const getOrderService = (): OrderService | null => orderServiceInstance;





































