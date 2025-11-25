import EventEmitter from 'events';
import { logger } from '../../utils/logger';

// Product Event Types
export type ProductEventType =
  | 'product:created'
  | 'product:updated'
  | 'product:deleted'
  | 'product:stock_changed'
  | 'product:variant_updated'
  | 'product:image_uploaded'
  | 'product:bulk_imported';

export interface ProductEventData {
  productId: string;
  product?: any;
  changes?: Record<string, any>;
  timestamp: string;
  userId?: string;
}

export interface ProductCreatedEvent extends ProductEventData {
  product: any;
}

export interface ProductUpdatedEvent extends ProductEventData {
  changes: Record<string, any>;
}

export interface ProductDeletedEvent {
  productId: string;
  timestamp: string;
}

export interface ProductStockChangedEvent extends ProductEventData {
  previousStock: number;
  newStock: number;
  adjustment: number;
}

export interface ProductBulkImportedEvent {
  result: {
    success: number;
    failed: number;
    errors: any[];
    imported: any[];
  };
  timestamp: string;
}

export class ProductEventManager extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  // Emit product created event
  productCreated(data: ProductCreatedEvent): void {
    this.emit('product:created', data);
    logger.info('Product created event emitted', { productId: data.productId });
  }

  // Emit product updated event
  productUpdated(data: ProductUpdatedEvent): void {
    this.emit('product:updated', data);
    logger.info('Product updated event emitted', { productId: data.productId, changes: data.changes });
  }

  // Emit product deleted event
  productDeleted(data: ProductDeletedEvent): void {
    this.emit('product:deleted', data);
    logger.info('Product deleted event emitted', { productId: data.productId });
  }

  // Emit product stock changed event
  productStockChanged(data: ProductStockChangedEvent): void {
    this.emit('product:stock_changed', data);
    logger.info('Product stock changed event emitted', { 
      productId: data.productId,
      previousStock: data.previousStock,
      newStock: data.newStock
    });
  }

  // Emit product variant updated event
  productVariantUpdated(data: ProductEventData): void {
    this.emit('product:variant_updated', data);
    logger.info('Product variant updated event emitted', { productId: data.productId });
  }

  // Emit product image uploaded event
  productImageUploaded(data: ProductEventData): void {
    this.emit('product:image_uploaded', data);
    logger.info('Product image uploaded event emitted', { productId: data.productId });
  }

  // Emit product bulk imported event
  productBulkImported(data: ProductBulkImportedEvent): void {
    this.emit('product:bulk_imported', data);
    logger.info('Product bulk import event emitted', { 
      success: data.result.success,
      failed: data.result.failed
    });
  }

  // Subscribe to specific event
  onProductEvent(eventType: ProductEventType, callback: (data: any) => void): void {
    this.on(eventType, callback);
  }

  // Unsubscribe from specific event
  offProductEvent(eventType: ProductEventType, callback: (data: any) => void): void {
    this.off(eventType, callback);
  }
}

// Export singleton instance
export const productEventManager = new ProductEventManager();

