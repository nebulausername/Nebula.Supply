import { WebSocketServer } from '../websocket/server';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import { getProductService } from './productService';
import {
  LowStockAlertEvent,
  StockAdjustedEvent,
  StockReleasedEvent,
  StockReservedEvent
} from '../websocket/events/inventoryEvents';
import { shopRealtimeEvents } from '../websocket/shopEvents';

export interface InventoryItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reservedStock: number; // Stock reserved for pending orders
  availableStock: number; // currentStock - reservedStock
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  location?: string; // Multi-location support
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'reservation' | 'release' | 'sale' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  orderId?: string;
  location?: string;
  userId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  severity: 'warning' | 'critical';
  location?: string;
  lastAlerted?: string;
}

export interface AutoReorderConfig {
  productId: string;
  enabled: boolean;
  reorderPoint: number;
  reorderQuantity: number;
  supplier?: string;
  leadTime?: number; // Days
  lastOrdered?: string;
}

export interface InventoryFilters {
  lowStock?: boolean;
  outOfStock?: boolean;
  location?: string;
  search?: string;
  sortBy?: 'name' | 'stock' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface InventoryMetrics {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  reservedStock: number;
  availableStock: number;
  averageStock: number;
  stockTurnoverRate: number;
}

export class InventoryService {
  private wsServer: WebSocketServer;

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  // Get inventory overview
  async getInventory(filters: InventoryFilters = {}): Promise<{ items: InventoryItem[]; total: number; metrics: InventoryMetrics }> {
    try {
      const productService = getProductService();
      if (!productService) {
        throw new Error('Product service not available');
      }

      const { products } = await productService.getProducts({});
      
      // Convert products to inventory items
      let inventoryItems: InventoryItem[] = products.map(product => {
        const reservedStock = this.getReservedStock(product.id);
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          currentStock: product.inventory || 0,
          reservedStock,
          availableStock: (product.inventory || 0) - reservedStock,
          lowStockThreshold: 10, // Default threshold
          reorderPoint: 5, // Default reorder point
          reorderQuantity: 20, // Default reorder quantity
          lastUpdated: product.updatedAt || new Date().toISOString()
        };
      });

      // Apply filters
      if (filters.lowStock) {
        inventoryItems = inventoryItems.filter(item => 
          item.currentStock > 0 && item.currentStock < item.lowStockThreshold
        );
      }

      if (filters.outOfStock) {
        inventoryItems = inventoryItems.filter(item => item.currentStock === 0);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        inventoryItems = inventoryItems.filter(item =>
          item.productName.toLowerCase().includes(searchTerm) ||
          item.sku.toLowerCase().includes(searchTerm)
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        inventoryItems.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (filters.sortBy) {
            case 'name':
              aValue = a.productName;
              bValue = b.productName;
              break;
            case 'stock':
              aValue = a.currentStock;
              bValue = b.currentStock;
              break;
            case 'updatedAt':
              aValue = new Date(a.lastUpdated);
              bValue = new Date(b.lastUpdated);
              break;
            default:
              aValue = a.productName;
              bValue = b.productName;
          }

          const order = filters.sortOrder === 'desc' ? -1 : 1;
          return aValue > bValue ? order : aValue < bValue ? -order : 0;
        });
      }

      // Apply pagination
      const total = inventoryItems.length;
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      const paginatedItems = inventoryItems.slice(offset, offset + limit);

      // Calculate metrics
      const metrics = await this.calculateInventoryMetrics(inventoryItems);

      return {
        items: paginatedItems,
        total,
        metrics
      };
    } catch (error) {
      logger.error('Failed to get inventory', { error: error.message, filters });
      throw error;
    }
  }

  // Get low stock items
  async getLowStockItems(threshold?: number): Promise<LowStockAlert[]> {
    try {
      const productService = getProductService();
      if (!productService) {
        throw new Error('Product service not available');
      }

      const { products } = await productService.getProducts({});
      const defaultThreshold = threshold || 10;

      const lowStockItems: LowStockAlert[] = [];

      for (const product of products) {
        const stock = product.inventory || 0;
        if (stock > 0 && stock < defaultThreshold) {
          const severity = stock < 5 ? 'critical' : 'warning';
          lowStockItems.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            currentStock: stock,
            threshold: defaultThreshold,
            severity
          });
        }
      }

      return lowStockItems;
    } catch (error) {
      logger.error('Failed to get low stock items', { error: error.message });
      throw error;
    }
  }

  // Adjust stock
  async adjustStock(productId: string, adjustment: number, reason?: string, userId?: string, location?: string): Promise<InventoryItem> {
    try {
      const productService = getProductService();
      if (!productService) {
        throw new Error('Product service not available');
      }

      const product = await productService.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const previousStock = product.inventory || 0;
      const newStock = Math.max(0, previousStock + adjustment);

      // Update product inventory
      await productService.updateProduct(productId, { inventory: newStock });

      // Record stock movement
      await this.recordStockMovement({
        productId,
        productName: product.name,
        type: 'adjustment',
        quantity: adjustment,
        previousStock,
        newStock,
        reason: reason || 'Manual adjustment',
        userId,
        location
      });

      // Check for low stock alerts
      await this.checkLowStockAlerts(productId);

      // Broadcast update
      await this.broadcastInventoryUpdate('inventory:stock_adjusted', {
        productId,
        adjustment,
        previousStock,
        newStock,
        timestamp: new Date().toISOString()
      });

      logger.info('Stock adjusted', { productId, adjustment, previousStock, newStock });

      return {
        productId,
        productName: product.name,
        sku: product.sku,
        currentStock: newStock,
        reservedStock: this.getReservedStock(productId),
        availableStock: newStock - this.getReservedStock(productId),
        lowStockThreshold: 10,
        reorderPoint: 5,
        reorderQuantity: 20,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to adjust stock', { error: error.message, productId, adjustment });
      throw error;
    }
  }

  // Reserve stock (for pending orders)
  async reserveStock(productId: string, quantity: number, orderId: string): Promise<boolean> {
    try {
      const productService = getProductService();
      if (!productService) {
        throw new Error('Product service not available');
      }

      const product = await productService.getProduct(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const availableStock = (product.inventory || 0) - this.getReservedStock(productId);
      
      if (availableStock < quantity) {
        throw new Error('Insufficient stock available');
      }

      // Record reservation
      await this.recordStockMovement({
        productId,
        productName: product.name,
        type: 'reservation',
        quantity,
        previousStock: product.inventory || 0,
        newStock: product.inventory || 0, // Stock doesn't change, just reserved
        reason: `Reserved for order ${orderId}`,
        orderId
      });

      logger.info('Stock reserved', { productId, quantity, orderId });
      return true;
    } catch (error) {
      logger.error('Failed to reserve stock', { error: error.message, productId, quantity });
      throw error;
    }
  }

  // Release reserved stock
  async releaseStock(productId: string, quantity: number, orderId: string): Promise<boolean> {
    try {
      await this.recordStockMovement({
        productId,
        productName: '', // Will be fetched if needed
        type: 'release',
        quantity,
        previousStock: 0,
        newStock: 0,
        reason: `Released from order ${orderId}`,
        orderId
      });

      logger.info('Stock released', { productId, quantity, orderId });
      return true;
    } catch (error) {
      logger.error('Failed to release stock', { error: error.message, productId, quantity });
      throw error;
    }
  }

  // Get stock history
  async getStockHistory(productId: string, limit: number = 50): Promise<StockMovement[]> {
    try {
      const movements = await databaseService.findMany<StockMovement>('stock_movements');
      const productMovements = movements
        .filter(m => m.productId === productId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return productMovements;
    } catch (error) {
      logger.error('Failed to get stock history', { error: error.message, productId });
      throw error;
    }
  }

  // Configure auto-reorder
  async configureAutoReorder(productId: string, config: Partial<AutoReorderConfig>): Promise<AutoReorderConfig> {
    try {
      const reorderConfig: AutoReorderConfig = {
        productId,
        enabled: config.enabled ?? true,
        reorderPoint: config.reorderPoint ?? 5,
        reorderQuantity: config.reorderQuantity ?? 20,
        supplier: config.supplier,
        leadTime: config.leadTime,
        lastOrdered: config.lastOrdered
      };

      await databaseService.create<AutoReorderConfig>('auto_reorder_configs', reorderConfig);

      logger.info('Auto-reorder configured', { productId, config: reorderConfig });
      return reorderConfig;
    } catch (error) {
      logger.error('Failed to configure auto-reorder', { error: error.message, productId, config });
      throw error;
    }
  }

  // Check and trigger auto-reorder
  async checkAutoReorder(): Promise<Array<{ productId: string; quantity: number; config: AutoReorderConfig }>> {
    try {
      const configs = await databaseService.findMany<AutoReorderConfig>('auto_reorder_configs');
      const productService = getProductService();
      if (!productService) {
        throw new Error('Product service not available');
      }

      const reorderNeeded: Array<{ productId: string; quantity: number; config: AutoReorderConfig }> = [];

      for (const config of configs) {
        if (!config.enabled) continue;

        const product = await productService.getProduct(config.productId);
        if (!product) continue;

        const currentStock = product.inventory || 0;
        
        if (currentStock <= config.reorderPoint) {
          reorderNeeded.push({
            productId: config.productId,
            quantity: config.reorderQuantity,
            config
          });

          // Update last ordered timestamp
          await databaseService.update<AutoReorderConfig>('auto_reorder_configs', config.productId, {
            lastOrdered: new Date().toISOString()
          });

          // Broadcast reorder alert
          await this.broadcastInventoryUpdate('inventory:reorder_needed', {
            productId: config.productId,
            productName: product.name,
            currentStock,
            reorderQuantity: config.reorderQuantity,
            timestamp: new Date().toISOString()
          });
        }
      }

      return reorderNeeded;
    } catch (error) {
      logger.error('Failed to check auto-reorder', { error: error.message });
      throw error;
    }
  }

  // Record stock movement
  private async recordStockMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): Promise<void> {
    try {
      const stockMovement: StockMovement = {
        id: this.generateMovementId(),
        ...movement,
        timestamp: new Date().toISOString()
      };

      await databaseService.create<StockMovement>('stock_movements', stockMovement);
    } catch (error) {
      logger.error('Failed to record stock movement', { error: error.message, movement });
    }
  }

  // Check low stock alerts
  private async checkLowStockAlerts(productId: string): Promise<void> {
    try {
      const productService = getProductService();
      if (!productService) return;

      const product = await productService.getProduct(productId);
      if (!product) return;

      const stock = product.inventory || 0;
      const threshold = 10; // Default threshold

      if (stock > 0 && stock < threshold) {
        const severity = stock < 5 ? 'critical' : 'warning';
        
        await this.broadcastInventoryUpdate('inventory:low_stock_alert', {
          productId,
          productName: product.name,
          currentStock: stock,
          threshold,
          severity,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Failed to check low stock alerts', { error: error.message, productId });
    }
  }

  // Get reserved stock (from pending orders)
  private getReservedStock(productId: string): number {
    // This would typically query pending orders
    // For now, return 0 as placeholder
    return 0;
  }

  // Calculate inventory metrics
  private async calculateInventoryMetrics(items: InventoryItem[]): Promise<InventoryMetrics> {
    const totalProducts = items.length;
    const totalStock = items.reduce((sum, item) => sum + item.currentStock, 0);
    const reservedStock = items.reduce((sum, item) => sum + item.reservedStock, 0);
    const availableStock = items.reduce((sum, item) => sum + item.availableStock, 0);
    const lowStockItems = items.filter(item => 
      item.currentStock > 0 && item.currentStock < item.lowStockThreshold
    ).length;
    const outOfStockItems = items.filter(item => item.currentStock === 0).length;

    // Calculate total value (would need product prices)
    const totalValue = 0; // Placeholder

    const averageStock = totalProducts > 0 ? totalStock / totalProducts : 0;
    const stockTurnoverRate = 0; // Would need sales data

    return {
      totalProducts,
      totalStock,
      totalValue,
      lowStockItems,
      outOfStockItems,
      reservedStock,
      availableStock,
      averageStock,
      stockTurnoverRate
    };
  }

  // Broadcast inventory update
  private async broadcastInventoryUpdate(eventType: string, data: any): Promise<void> {
    try {
      switch (eventType) {
        case 'inventory:stock_adjusted':
          shopRealtimeEvents.inventoryAdjusted(data as StockAdjustedEvent);
          break;
        case 'inventory:stock_reserved':
          shopRealtimeEvents.inventoryReserved(data as StockReservedEvent);
          break;
        case 'inventory:stock_released':
          shopRealtimeEvents.inventoryReleased(data as StockReleasedEvent);
          break;
        case 'inventory:low_stock_alert':
          shopRealtimeEvents.lowStockAlert(data as LowStockAlertEvent);
          break;
        default: {
          const wsServerAny = this.wsServer as unknown as { emit?: (event: string, payload: any) => void };
          wsServerAny.emit?.(eventType, data);
        }
      }
    } catch (error) {
      logger.error('Failed to broadcast inventory update', { error: (error as Error).message, eventType, data });
    }
  }

  // Generate unique IDs
  private generateMovementId(): string {
    return `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
let inventoryServiceInstance: InventoryService | null = null;

export const createInventoryService = (wsServer: WebSocketServer): InventoryService => {
  if (!inventoryServiceInstance) {
    inventoryServiceInstance = new InventoryService(wsServer);
  }
  return inventoryServiceInstance;
};

export const getInventoryService = (): InventoryService | null => inventoryServiceInstance;


