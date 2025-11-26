import { Socket } from 'socket.io';
import EventEmitter from 'events';
import { logger } from '../../utils/logger';

export interface OrderEvent {
  orderId: string;
  order?: any;
  oldStatus?: string;
  newStatus?: string;
  trackingInfo?: any;
  changes?: any;
  timestamp: string;
  adminId?: string;
  userId?: string;
}

export interface OrderSubscriptionData {
  orderIds?: string[];
  filters?: {
    status?: string[];
    customerId?: string;
  };
}

export interface OrderEventManager {
  subscribeToOrders(socket: Socket, data: OrderSubscriptionData): void;
  subscribeToOrder(socket: Socket, orderId: string): void;
  unsubscribeFromOrders(socket: Socket): void;
  unsubscribeFromOrder(socket: Socket, orderId: string): void;
}

export class OrderEventManagerImpl implements OrderEventManager {
  subscribeToOrders(socket: Socket, data: OrderSubscriptionData): void {
    // Join general orders room
    socket.join('orders:all');
    
    // Join filter-specific rooms
    if (data.filters) {
      Object.entries(data.filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => socket.join(`orders:filter:${key}:${v}`));
          } else {
            socket.join(`orders:filter:${key}:${value}`);
          }
        }
      });
    }
    
    // Join specific order rooms
    if (data.orderIds) {
      data.orderIds.forEach(orderId => {
        socket.join(`order:${orderId}`);
      });
    }

    logger.info('Socket subscribed to orders', { 
      socketId: socket.id, 
      orderIds: data.orderIds?.length || 0,
      filters: data.filters 
    });
  }

  subscribeToOrder(socket: Socket, orderId: string): void {
    socket.join(`order:${orderId}`);
    logger.info('Socket subscribed to order', { socketId: socket.id, orderId });
  }

  unsubscribeFromOrders(socket: Socket): void {
    socket.leave('orders:all');
    
    // Leave all filter rooms
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room.startsWith('orders:filter:') || room.startsWith('order:')) {
        socket.leave(room);
      }
    });

    logger.info('Socket unsubscribed from orders', { socketId: socket.id });
  }

  unsubscribeFromOrder(socket: Socket, orderId: string): void {
    socket.leave(`order:${orderId}`);
    logger.info('Socket unsubscribed from order', { socketId: socket.id, orderId });
  }
}

export const orderEventManager = new OrderEventManagerImpl();

// Order event types for type safety
export type OrderEventType = 
  | 'order:created'
  | 'order:updated'
  | 'order:status_changed'
  | 'order:tracking_updated'
  | 'order:payment_confirmed'
  | 'order:shipped'
  | 'order:delivered'
  | 'order:cancelled'
  | 'order:refunded'
  | 'order:note_added'
  | 'order:bulk_updated';

// Event data interfaces
export interface OrderCreatedEvent extends OrderEvent {
  type: 'order:created';
  order: any;
}

export interface OrderUpdatedEvent extends OrderEvent {
  type: 'order:updated';
  changes: any;
}

export interface OrderStatusChangedEvent extends OrderEvent {
  type: 'order:status_changed';
  oldStatus: string;
  newStatus: string;
  trackingInfo?: any;
}

export interface OrderTrackingUpdatedEvent extends OrderEvent {
  type: 'order:tracking_updated';
  trackingInfo: any;
}

export interface OrderPaymentConfirmedEvent extends OrderEvent {
  type: 'order:payment_confirmed';
  paymentId: string;
  paymentMethod: string;
}

export interface OrderShippedEvent extends OrderEvent {
  type: 'order:shipped';
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
}

export interface OrderDeliveredEvent extends OrderEvent {
  type: 'order:delivered';
  deliveredAt: string;
}

export interface OrderCancelledEvent extends OrderEvent {
  type: 'order:cancelled';
  reason?: string;
  cancelledBy: string;
}

export interface OrderRefundedEvent extends OrderEvent {
  type: 'order:refunded';
  refundAmount: number;
  refundReason?: string;
  refundedBy: string;
}

export interface OrderNoteAddedEvent extends OrderEvent {
  type: 'order:note_added';
  note: {
    id: string;
    content: string;
    author: string;
    isInternal: boolean;
  };
}

export interface OrderBulkUpdatedEvent extends OrderEvent {
  type: 'order:bulk_updated';
  orderIds: string[];
  updates: any;
  results: {
    success: number;
    failed: number;
    errors: any[];
  };
}

// Union type for all order events
export type OrderEventData = 
  | OrderCreatedEvent
  | OrderUpdatedEvent
  | OrderStatusChangedEvent
  | OrderTrackingUpdatedEvent
  | OrderPaymentConfirmedEvent
  | OrderShippedEvent
  | OrderDeliveredEvent
  | OrderCancelledEvent
  | OrderRefundedEvent
  | OrderNoteAddedEvent
  | OrderBulkUpdatedEvent;























































































