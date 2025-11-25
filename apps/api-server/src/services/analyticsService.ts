import { WebSocketServer } from '../websocket/server';
import { databaseService } from './database';
import { logger } from '../utils/logger';
import { getOrderService } from './orderService';
import { getProductService } from './productService';
import { getCategoryService } from './categoryService';
import type { Order } from './orderService';

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  productsSold: number;
}

export interface RevenueReport {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  growth: number; // Percentage growth vs previous period
  dataPoints: SalesDataPoint[];
}

export interface BestsellerProduct {
  productId: string;
  productName: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
  orders: number;
  rank: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  totalProducts: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  productsSold: number;
  conversionRate: number;
  growth: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerLifetimeValue: number;
  averageOrderFrequency: number;
  averageDaysBetweenOrders: number;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
  }>;
}

export interface DashboardMetrics {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  monthRevenue: number;
  monthOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  activeCustomers: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: BestsellerProduct[];
  recentOrders: Order[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export class AnalyticsService {
  private wsServer: WebSocketServer;

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  // Get sales analytics
  async getSalesAnalytics(period: 'day' | 'week' | 'month' | 'year', dateRange?: DateRange): Promise<RevenueReport> {
    try {
      const orderService = getOrderService();
      if (!orderService) {
        throw new Error('Order service not available');
      }

      const { orders } = await orderService.getOrders({});
      
      // Filter orders by date range
      let filteredOrders = orders;
      if (dateRange) {
        filteredOrders = orders.filter(order => 
          order.createdAt >= dateRange.startDate && order.createdAt <= dateRange.endDate
        );
      } else {
        // Use period to determine date range
        const now = new Date();
        let startDate: Date;
        
        switch (period) {
          case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
        
        filteredOrders = orders.filter(order => new Date(order.createdAt) >= startDate);
      }

      // Group by date
      const dataPoints: SalesDataPoint[] = [];
      const groupedByDate = this.groupOrdersByDate(filteredOrders, period);

      for (const [date, dateOrders] of Object.entries(groupedByDate)) {
        const revenue = dateOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const orders = dateOrders.length;
        const productsSold = dateOrders.reduce((sum, o) => 
          sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );
        const averageOrderValue = orders > 0 ? revenue / orders : 0;

        dataPoints.push({
          date,
          revenue,
          orders,
          averageOrderValue,
          productsSold
        });
      }

      // Sort by date
      dataPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate totals
      const totalRevenue = filteredOrders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      const totalOrders = filteredOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate growth (compare with previous period)
      const growth = await this.calculateGrowth(filteredOrders, period);

      const startDate = dateRange?.startDate || dataPoints[0]?.date || new Date().toISOString();
      const endDate = dateRange?.endDate || dataPoints[dataPoints.length - 1]?.date || new Date().toISOString();

      return {
        period,
        startDate,
        endDate,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        growth,
        dataPoints
      };
    } catch (error) {
      logger.error('Failed to get sales analytics', { error: error.message, period });
      throw error;
    }
  }

  // Get revenue reports
  async getRevenueReports(dateRange: DateRange): Promise<RevenueReport> {
    try {
      return await this.getSalesAnalytics('month', dateRange);
    } catch (error) {
      logger.error('Failed to get revenue reports', { error: error.message, dateRange });
      throw error;
    }
  }

  // Get bestseller products
  async getBestsellers(limit: number = 10, dateRange?: DateRange): Promise<BestsellerProduct[]> {
    try {
      const orderService = getOrderService();
      const productService = getProductService();
      const categoryService = getCategoryService();

      if (!orderService || !productService) {
        throw new Error('Services not available');
      }

      const { orders } = await orderService.getOrders({});
      
      // Filter by date range
      let filteredOrders = orders;
      if (dateRange) {
        filteredOrders = orders.filter(order => 
          order.createdAt >= dateRange.startDate && order.createdAt <= dateRange.endDate
        );
      }

      // Count product sales
      const productSales = new Map<string, {
        productId: string;
        totalSold: number;
        totalRevenue: number;
        orders: Set<string>;
      }>();

      for (const order of filteredOrders) {
        if (order.paymentStatus !== 'paid') continue;

        for (const item of order.items) {
          const existing = productSales.get(item.productId) || {
            productId: item.productId,
            totalSold: 0,
            totalRevenue: 0,
            orders: new Set<string>()
          };

          existing.totalSold += item.quantity;
          existing.totalRevenue += item.totalPrice;
          existing.orders.add(order.id);
          productSales.set(item.productId, existing);
        }
      }

      // Convert to bestseller array
      const bestsellers: BestsellerProduct[] = [];
      
      for (const [productId, sales] of productSales.entries()) {
        const product = await productService.getProduct(productId);
        if (!product) continue;

        const category = categoryService 
          ? await categoryService.getCategory(product.categoryId)
          : null;

        bestsellers.push({
          productId,
          productName: product.name,
          sku: product.sku,
          categoryId: product.categoryId,
          categoryName: category?.name || 'Unknown',
          totalSold: sales.totalSold,
          totalRevenue: sales.totalRevenue,
          averagePrice: sales.totalSold > 0 ? sales.totalRevenue / sales.totalSold : 0,
          orders: sales.orders.size,
          rank: 0 // Will be set after sorting
        });
      }

      // Sort by total sold
      bestsellers.sort((a, b) => b.totalSold - a.totalSold);
      
      // Set ranks
      bestsellers.forEach((product, index) => {
        product.rank = index + 1;
      });

      return bestsellers.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get bestsellers', { error: error.message });
      throw error;
    }
  }

  // Get category performance
  async getCategoryPerformance(dateRange?: DateRange): Promise<CategoryPerformance[]> {
    try {
      const orderService = getOrderService();
      const productService = getProductService();
      const categoryService = getCategoryService();

      if (!orderService || !productService || !categoryService) {
        throw new Error('Services not available');
      }

      const { categories } = await categoryService.getCategories({});
      const { orders } = await orderService.getOrders({});
      
      // Filter by date range
      let filteredOrders = orders;
      if (dateRange) {
        filteredOrders = orders.filter(order => 
          order.createdAt >= dateRange.startDate && order.createdAt <= dateRange.endDate
        );
      }

      const categoryPerformance: CategoryPerformance[] = [];

      for (const category of categories) {
        const categoryProducts = await productService.getProducts({ categoryId: category.id });
        const categoryOrders = filteredOrders.filter(order =>
          order.items.some(item => item.productId && 
            categoryProducts.products.some(p => p.id === item.productId))
        );

        const totalRevenue = categoryOrders
          .filter(o => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = categoryOrders.length;
        const productsSold = categoryOrders.reduce((sum, o) =>
          sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        );
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const conversionRate = 0; // Would need visitor data

        categoryPerformance.push({
          categoryId: category.id,
          categoryName: category.name,
          totalProducts: categoryProducts.products.length,
          totalRevenue,
          totalOrders,
          averageOrderValue,
          productsSold,
          conversionRate,
          growth: 0 // Would need historical comparison
        });
      }

      return categoryPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue);
    } catch (error) {
      logger.error('Failed to get category performance', { error: error.message });
      throw error;
    }
  }

  // Get customer analytics
  async getCustomerAnalytics(): Promise<CustomerAnalytics> {
    try {
      const orderService = getOrderService();
      if (!orderService) {
        throw new Error('Order service not available');
      }

      const { orders } = await orderService.getOrders({});
      
      // Group orders by customer
      const customerOrders = new Map<string, Order[]>();
      for (const order of orders) {
        const customerId = order.customerId;
        if (!customerOrders.has(customerId)) {
          customerOrders.set(customerId, []);
        }
        customerOrders.get(customerId)!.push(order);
      }

      const totalCustomers = customerOrders.size;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const newCustomers = Array.from(customerOrders.values())
        .filter(orders => orders.some(o => new Date(o.createdAt) >= thirtyDaysAgo))
        .length;
      
      const returningCustomers = Array.from(customerOrders.values())
        .filter(orders => orders.length > 1)
        .length;

      // Calculate top customers
      const topCustomers = Array.from(customerOrders.entries())
        .map(([customerId, orders]) => {
          const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
          const totalSpent = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
          const lastOrder = orders.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          return {
            customerId,
            customerName: lastOrder.customerName || 'Unknown',
            totalOrders: orders.length,
            totalSpent,
            lastOrderDate: lastOrder.createdAt
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      const customerLifetimeValue = topCustomers.length > 0
        ? topCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / topCustomers.length
        : 0;

      const averageOrderFrequency = totalCustomers > 0
        ? orders.length / totalCustomers
        : 0;

      return {
        totalCustomers,
        newCustomers,
        returningCustomers,
        customerLifetimeValue,
        averageOrderFrequency,
        averageDaysBetweenOrders: 0, // Would need more complex calculation
        topCustomers
      };
    } catch (error) {
      logger.error('Failed to get customer analytics', { error: error.message });
      throw error;
    }
  }

  // Get dashboard metrics
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const orderService = getOrderService();
      const inventoryService = await import('./inventoryService').then(m => m.getInventoryService());

      if (!orderService) {
        throw new Error('Order service not available');
      }

      const { orders, metrics: orderMetrics } = await orderService.getOrders({});
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
      const weekOrders = orders.filter(o => new Date(o.createdAt) >= weekAgo);
      const monthOrders = orders.filter(o => new Date(o.createdAt) >= monthAgo);

      const todayRevenue = todayOrders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      
      const weekRevenue = weekOrders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      
      const monthRevenue = monthOrders
        .filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      
      let lowStockItems = 0;
      if (inventoryService) {
        const lowStock = await inventoryService.getLowStockItems();
        lowStockItems = lowStock.length;
      }

      const uniqueCustomers = new Set(orders.map(o => o.customerId)).size;
      const conversionRate = orderMetrics.conversionRate || 0;
      const averageOrderValue = orderMetrics.averageOrderValue || 0;

      const topProducts = await this.getBestsellers(5);
      const recentOrders = orders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      return {
        todayRevenue,
        todayOrders: todayOrders.length,
        weekRevenue,
        weekOrders: weekOrders.length,
        monthRevenue,
        monthOrders: monthOrders.length,
        pendingOrders,
        lowStockItems,
        activeCustomers: uniqueCustomers,
        conversionRate,
        averageOrderValue,
        topProducts,
        recentOrders
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics', { error: error.message });
      throw error;
    }
  }

  // Helper: Group orders by date
  private groupOrdersByDate(orders: Order[], period: 'day' | 'week' | 'month' | 'year'): Record<string, Order[]> {
    const grouped: Record<string, Order[]> = {};

    for (const order of orders) {
      const date = new Date(order.createdAt);
      let key: string;

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(order);
    }

    return grouped;
  }

  // Helper: Calculate growth percentage
  private async calculateGrowth(orders: Order[], period: 'day' | 'week' | 'month' | 'year'): Promise<number> {
    // This would compare with previous period
    // For now, return 0 as placeholder
    return 0;
  }
}

// Export singleton instance
let analyticsServiceInstance: AnalyticsService | null = null;

export const createAnalyticsService = (wsServer: WebSocketServer): AnalyticsService => {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService(wsServer);
  }
  return analyticsServiceInstance;
};

export const getAnalyticsService = (): AnalyticsService | null => analyticsServiceInstance;


