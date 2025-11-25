import { OrderStatus, ALLOWED_TRANSITIONS, canTransition } from '../constants/orderStatus';

export interface OrderStatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  timestamp: string;
  userId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface OrderStatusHistory {
  orderId: string;
  transitions: OrderStatusTransition[];
  currentStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export class OrderStatusMachine {
  private history: OrderStatusHistory;

  constructor(orderId: string, initialStatus: OrderStatus = 'created') {
    this.history = {
      orderId,
      transitions: [],
      currentStatus: initialStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Check if a transition is valid
  canTransitionTo(newStatus: OrderStatus): boolean {
    return canTransition(this.history.currentStatus, newStatus);
  }

  // Get all possible next statuses
  getNextStatuses(): OrderStatus[] {
    return ALLOWED_TRANSITIONS[this.history.currentStatus] || [];
  }

  // Attempt to transition to a new status
  transitionTo(
    newStatus: OrderStatus, 
    userId?: string, 
    reason?: string, 
    metadata?: Record<string, any>
  ): boolean {
    if (!this.canTransitionTo(newStatus)) {
      return false;
    }

    const transition: OrderStatusTransition = {
      from: this.history.currentStatus,
      to: newStatus,
      timestamp: new Date().toISOString(),
      userId,
      reason,
      metadata
    };

    this.history.transitions.push(transition);
    this.history.currentStatus = newStatus;
    this.history.updatedAt = new Date().toISOString();

    return true;
  }

  // Get current status
  getCurrentStatus(): OrderStatus {
    return this.history.currentStatus;
  }

  // Get transition history
  getHistory(): OrderStatusHistory {
    return { ...this.history };
  }

  // Get last transition
  getLastTransition(): OrderStatusTransition | undefined {
    return this.history.transitions[this.history.transitions.length - 1];
  }

  // Check if order is in a terminal state
  isTerminal(): boolean {
    return ALLOWED_TRANSITIONS[this.history.currentStatus].length === 0;
  }

  // Get time spent in current status
  getTimeInCurrentStatus(): number {
    const lastTransition = this.getLastTransition();
    if (!lastTransition) {
      return Date.now() - new Date(this.history.createdAt).getTime();
    }
    return Date.now() - new Date(lastTransition.timestamp).getTime();
  }

  // Get total processing time
  getTotalProcessingTime(): number {
    return Date.now() - new Date(this.history.createdAt).getTime();
  }

  // Validate transition with business rules
  validateTransition(newStatus: OrderStatus, context?: any): { valid: boolean; reason?: string } {
    // Basic transition check
    if (!this.canTransitionTo(newStatus)) {
      return {
        valid: false,
        reason: `Cannot transition from ${this.history.currentStatus} to ${newStatus}`
      };
    }

    // Add custom business rules here
    switch (newStatus) {
      case 'shipped':
        // Check if order has tracking information
        if (!context?.trackingNumber) {
          return {
            valid: false,
            reason: 'Tracking number is required to ship order'
          };
        }
        break;
      
      case 'delivered':
        // Check if order was actually shipped
        if (this.history.currentStatus !== 'shipped') {
          return {
            valid: false,
            reason: 'Order must be shipped before it can be delivered'
          };
        }
        break;
      
      case 'returned':
        // Check if order was delivered
        if (!['shipped', 'delivered'].includes(this.history.currentStatus)) {
          return {
            valid: false,
            reason: 'Order must be shipped or delivered before it can be returned'
          };
        }
        break;
    }

    return { valid: true };
  }
}

// Factory function to create status machine from existing history
export function createOrderStatusMachineFromHistory(history: OrderStatusHistory): OrderStatusMachine {
  const machine = new OrderStatusMachine(history.orderId, history.currentStatus);
  machine['history'] = { ...history };
  return machine;
}

// Utility functions for bulk operations
export function validateBulkTransition(
  orderIds: string[], 
  fromStatus: OrderStatus, 
  toStatus: OrderStatus
): { valid: boolean; invalidOrderIds: string[] } {
  const invalidOrderIds: string[] = [];
  
  if (!canTransition(fromStatus, toStatus)) {
    return { valid: false, invalidOrderIds: orderIds };
  }
  
  return { valid: true, invalidOrderIds };
}

// Get status statistics for dashboard
export function getStatusStatistics(orders: Array<{ status: OrderStatus; createdAt: string }>) {
  const stats = {
    total: orders.length,
    byStatus: {} as Record<OrderStatus, number>,
    recent: 0, // Orders created in last 24h
    averageProcessingTime: 0
  };

  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  orders.forEach(order => {
    // Count by status
    stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
    
    // Count recent orders
    if (new Date(order.createdAt).getTime() > oneDayAgo) {
      stats.recent++;
    }
  });

  return stats;
}



