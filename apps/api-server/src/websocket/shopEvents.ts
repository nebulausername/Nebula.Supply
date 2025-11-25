import { logger } from '../utils/logger';
import { getWebSocketServer, ShopRealtimeEvent } from './server';
import {
  ProductCreatedEvent,
  ProductDeletedEvent,
  ProductStockChangedEvent,
  ProductUpdatedEvent
} from './events/productEvents';
import {
  DropCreatedEvent,
  DropDeletedEvent,
  DropStatusChangedEvent,
  DropStockChangedEvent,
  DropUpdatedEvent
} from './events/dropEvents';
import {
  StockAdjustedEvent,
  StockReservedEvent,
  StockReleasedEvent,
  LowStockAlertEvent
} from './events/inventoryEvents';
import { OrderCreatedEvent } from './events/orderEvents';

const publishEvent = (event: ShopRealtimeEvent) => {
  const wsServer = getWebSocketServer();

  if (!wsServer) {
    logger.warn('Cannot publish shop realtime event: WebSocket server not initialized', {
      type: event.type
    });
    return;
  }

  wsServer.publishShopEvent(event);
};

export const shopRealtimeEvents = {
  productCreated(event: ProductCreatedEvent) {
    publishEvent({ type: 'product:created', payload: event });
  },
  productUpdated(event: ProductUpdatedEvent) {
    publishEvent({ type: 'product:updated', payload: event });
  },
  productDeleted(event: ProductDeletedEvent) {
    publishEvent({ type: 'product:deleted', payload: event });
  },
  productStockChanged(event: ProductStockChangedEvent) {
    publishEvent({ type: 'product:stock_changed', payload: event });
  },
  dropCreated(event: DropCreatedEvent) {
    publishEvent({ type: 'drop:created', payload: event });
  },
  dropUpdated(event: DropUpdatedEvent) {
    publishEvent({ type: 'drop:updated', payload: event });
  },
  dropDeleted(event: DropDeletedEvent) {
    publishEvent({ type: 'drop:deleted', payload: event });
  },
  dropStockChanged(event: DropStockChangedEvent) {
    publishEvent({ type: 'drop:stock_changed', payload: event });
  },
  dropStatusChanged(event: DropStatusChangedEvent) {
    publishEvent({ type: 'drop:status_changed', payload: event });
  },
  inventoryAdjusted(event: StockAdjustedEvent) {
    publishEvent({ type: 'inventory:stock_adjusted', payload: event });
  },
  inventoryReserved(event: StockReservedEvent) {
    publishEvent({ type: 'inventory:stock_reserved', payload: event });
  },
  inventoryReleased(event: StockReleasedEvent) {
    publishEvent({ type: 'inventory:stock_released', payload: event });
  },
  lowStockAlert(event: LowStockAlertEvent) {
    publishEvent({ type: 'inventory:low_stock_alert', payload: event });
  },
  categoryCreated(payload: any) {
    publishEvent({ type: 'category:created', payload });
  },
  categoryUpdated(payload: any) {
    publishEvent({ type: 'category:updated', payload });
  },
  categoryDeleted(payload: any) {
    publishEvent({ type: 'category:deleted', payload });
  },
  analyticsUpdated(payload: any) {
    publishEvent({ type: 'analytics:updated', payload });
  },
  orderCreated(event: OrderCreatedEvent) {
    publishEvent({ type: 'order:created', payload: event });
  },
  syncStatus(payload: any) {
    publishEvent({ type: 'sync:status', payload });
  }
};
