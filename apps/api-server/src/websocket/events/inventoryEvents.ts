import EventEmitter from 'events';
import { logger } from '../../utils/logger';

// Inventory Event Types
export type InventoryEventType =
  | 'inventory:stock_adjusted'
  | 'inventory:stock_reserved'
  | 'inventory:stock_released'
  | 'inventory:low_stock_alert'
  | 'inventory:out_of_stock'
  | 'inventory:reorder_needed'
  | 'inventory:reorder_triggered';

export interface InventoryEventData {
  productId: string;
  productName?: string;
  timestamp: string;
  userId?: string;
}

export interface StockAdjustedEvent extends InventoryEventData {
  adjustment: number;
  previousStock: number;
  newStock: number;
  reason?: string;
}

export interface StockReservedEvent extends InventoryEventData {
  quantity: number;
  orderId: string;
  reservedStock: number;
}

export interface StockReleasedEvent extends InventoryEventData {
  quantity: number;
  orderId: string;
}

export interface LowStockAlertEvent extends InventoryEventData {
  currentStock: number;
  threshold: number;
  severity: 'warning' | 'critical';
}

export interface OutOfStockEvent extends InventoryEventData {
  lastKnownStock: number;
}

export interface ReorderNeededEvent extends InventoryEventData {
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
}

export class InventoryEventManager extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  // Emit stock adjusted event
  stockAdjusted(data: StockAdjustedEvent): void {
    this.emit('inventory:stock_adjusted', data);
    logger.info('Stock adjusted event emitted', { 
      productId: data.productId,
      adjustment: data.adjustment,
      newStock: data.newStock
    });
  }

  // Emit stock reserved event
  stockReserved(data: StockReservedEvent): void {
    this.emit('inventory:stock_reserved', data);
    logger.info('Stock reserved event emitted', { 
      productId: data.productId,
      quantity: data.quantity,
      orderId: data.orderId
    });
  }

  // Emit stock released event
  stockReleased(data: StockReleasedEvent): void {
    this.emit('inventory:stock_released', data);
    logger.info('Stock released event emitted', { 
      productId: data.productId,
      quantity: data.quantity,
      orderId: data.orderId
    });
  }

  // Emit low stock alert event
  lowStockAlert(data: LowStockAlertEvent): void {
    this.emit('inventory:low_stock_alert', data);
    logger.warn('Low stock alert event emitted', { 
      productId: data.productId,
      currentStock: data.currentStock,
      severity: data.severity
    });
  }

  // Emit out of stock event
  outOfStock(data: OutOfStockEvent): void {
    this.emit('inventory:out_of_stock', data);
    logger.warn('Out of stock event emitted', { 
      productId: data.productId
    });
  }

  // Emit reorder needed event
  reorderNeeded(data: ReorderNeededEvent): void {
    this.emit('inventory:reorder_needed', data);
    logger.info('Reorder needed event emitted', { 
      productId: data.productId,
      currentStock: data.currentStock,
      reorderQuantity: data.reorderQuantity
    });
  }

  // Subscribe to specific event
  onInventoryEvent(eventType: InventoryEventType, callback: (data: any) => void): void {
    this.on(eventType, callback);
  }

  // Unsubscribe from specific event
  offInventoryEvent(eventType: InventoryEventType, callback: (data: any) => void): void {
    this.off(eventType, callback);
  }
}

// Export singleton instance
export const inventoryEventManager = new InventoryEventManager();

