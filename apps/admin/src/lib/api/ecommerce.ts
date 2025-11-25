import { api } from './client';

// Types for e-commerce API responses
export interface Drop {
  id: string;
  name: string;
  description?: string;
  badge?: string;
  access: 'free' | 'limited' | 'vip' | 'standard';
  variants: DropVariant[];
  shipping?: any[];
  interestCount?: number;
  createdAt?: string;
  status: 'active' | 'inactive' | 'sold_out' | 'scheduled';
  scheduledDate?: string;
  totalStock?: number;
  soldCount?: number;
  revenue?: number;
}

export interface DropVariant {
  id: string;
  label: string;
  basePrice: number;
  stock: number;
  sold?: number;
  image?: string;
  description?: string;
  sku?: string;
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
  shippingAddress: any;
  billingAddress?: any;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
  notes: any[];
  timeline: any[];
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

export interface OrderItem {
  id: string;
  type: 'shop' | 'drop';
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  orders: Order[];
  totalSpent: number;
  joinDate: string;
  lastOrderDate?: string;
  status: 'active' | 'inactive' | 'vip';
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  type: 'product' | 'drop' | 'accessory';
  stock: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  supplier?: string;
  lastUpdated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
}

// Product Types
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  sku: string;
  description: string;
  price: number;
  currency: string;
  inventory: number;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  featured?: boolean;
  access?: 'free' | 'limited' | 'vip' | 'standard';
  type?: 'shop' | 'drop';
  variants?: any[];
  media?: Array<{ url: string; alt?: string }>;
  badges?: string[];
  createdAt: string;
  updatedAt: string;
  isBundle?: boolean;
  bundleProducts?: string[];
}

export interface ProductFilters {
  status?: string[];
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  access?: string[];
  type?: string[];
  inStock?: boolean;
  lowStock?: boolean;
  sortBy?: 'name' | 'price' | 'inventory' | 'createdAt' | 'updatedAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Category Types
export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  children?: Category[];
}

// Inventory Types Extended
export interface InventoryItemExtended {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  location?: string;
  lastUpdated: string;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  severity: 'warning' | 'critical';
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
  timestamp: string;
}

// Analytics Types
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
  growth: number;
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

export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    unitsSold: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    revenue: number;
    orders: number;
  }>;
  dropPerformance: Array<{
    dropId: string;
    dropName: string;
    sold: number;
    revenue: number;
    conversionRate: number;
  }>;
}

// Drop Management API
export const dropsApi = {
  // Get all drops with filtering and pagination (admin version with more data)
  getDrops: (params?: {
    filter?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
    status?: string;
  }) => api.getPaginated<Drop>('/api/admin/drops', params),

  // Get single drop details
  getDrop: (id: string) => api.get<Drop>(`/api/admin/drops/${id}`),

  // Create new drop
  createDrop: (drop: Omit<Drop, 'id' | 'createdAt' | 'interestCount'>) =>
    api.post<Drop>('/api/admin/drops', drop),

  // Update drop
  updateDrop: (id: string, drop: Partial<Drop>) =>
    api.put<Drop>(`/api/admin/drops/${id}`, drop),

  // Delete drop
  deleteDrop: (id: string) =>
    api.delete<void>(`/api/admin/drops/${id}`),

  // Get drop analytics
  getDropAnalytics: (id: string) =>
    api.get<any>(`/api/admin/drops/${id}/analytics`),

  // Track preorder
  trackPreorder: (id: string, data: { userId: string; variantId: string; quantity: number }) =>
    api.post<any>(`/api/admin/drops/${id}/preorder/track`, data),

  // Fake complete preorder (fill missing orders)
  fakeCompletePreorder: (id: string) =>
    api.post<any>(`/api/admin/drops/${id}/fake-complete`, {}),

  // Bulk operations
  bulkAction: (data: {
    action: 'activate' | 'deactivate' | 'delete' | 'status_change' | 'access_change';
    dropIds: string[];
    status?: 'active' | 'inactive' | 'sold_out' | 'scheduled';
    access?: 'free' | 'limited' | 'vip' | 'standard';
  }) => api.post<any>('/api/admin/drops/bulk', data),

  // Reorder drops
  reorderDrops: (dropIds: string[]) =>
    api.post<any>('/api/admin/drops/reorder', { dropIds }),
};

// Order Management API
export const ordersApi = {
  // Get all orders with filtering
  getOrders: (params?: {
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
  }) => api.get<{
    success: boolean;
    data: Order[];
    total: number;
    metrics: any;
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>('/api/orders', params),

  // Get single order details
  getOrder: (orderId: string) => api.get<Order>(`/api/orders/${orderId}`),

  // Update order status
  updateOrderStatus: (orderId: string, status: Order['status'], trackingInfo?: {
    trackingNumber?: string;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }) => api.put<{
    success: boolean;
    data: Order;
    message: string;
  }>(`/api/orders/${orderId}/status`, { status, ...trackingInfo }),

  // Update order tracking
  updateOrderTracking: (orderId: string, trackingInfo: {
    trackingNumber: string;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }) => api.patch<{
    success: boolean;
    data: Order;
    message: string;
  }>(`/api/orders/${orderId}/tracking`, trackingInfo),

  // Add order note
  addOrderNote: (orderId: string, content: string, isInternal: boolean = false) => 
    api.post<{
      success: boolean;
      data: Order;
      message: string;
    }>(`/api/orders/${orderId}/notes`, { content, isInternal }),

  // Bulk update orders
  bulkUpdateOrders: (orderIds: string[], updates: any) => 
    api.patch<{
      success: boolean;
      data: {
        success: number;
        failed: number;
        errors: any[];
      };
      message: string;
    }>('/api/orders/bulk-update', { orderIds, updates }),

  // Get order metrics
  getOrderMetrics: () => api.get<any>('/api/orders/metrics'),

  // Get order timeline
  getOrderTimeline: (orderId: string) => api.get<any>(`/api/orders/${orderId}/timeline`),

  // Get order tracking info
  getOrderTracking: (orderId: string) =>
    api.get<any>(`/api/orders/${orderId}/tracking`),

  // Create new order
  createOrder: (orderData: {
    userId: string;
    items: Array<{
      id: string;
      type: 'shop' | 'drop';
      name: string;
      variant: string;
      price: number;
      quantity: number;
    }>;
    shippingAddress: {
      firstName: string;
      lastName: string;
      address1: string;
      address2?: string;
      city: string;
      postalCode: string;
      country: string;
    };
    billingAddress?: {
      firstName: string;
      lastName: string;
      address1: string;
      address2?: string;
      city: string;
      postalCode: string;
      country: string;
    };
    paymentMethod: string;
    totalAmount: number;
    currency: string;
  }) => api.post<{
    orderId: string;
    status: string;
    items: any[];
    totalAmount: number;
    currency: string;
    shippingAddress: any;
    billingAddress?: any;
    paymentMethod: string;
    estimatedDelivery: string;
    createdAt: string;
    updatedAt: string;
  }>('/api/orders', orderData),
};

// Customer Management API
export const customersApi = {
  // Get all customers
  getCustomers: (params?: {
    search?: string;
    limit?: number;
    offset?: number;
    status?: string;
  }) => api.getPaginated<Customer>('/api/customers', params),

  // Get customer details
  getCustomer: (id: string) => api.get<Customer>(`/api/customers/${id}`),

  // Update customer status
  updateCustomerStatus: (id: string, status: Customer['status']) =>
    api.patch<Customer>(`/api/customers/${id}/status`, { status }),

  // Get customer order history
  getCustomerOrders: (id: string) =>
    api.get<Order[]>(`/api/customers/${id}/orders`),

  // Create new customer
  createCustomer: (customerData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    status?: 'active' | 'inactive' | 'vip';
  }) => api.post<{
    success: boolean;
    data: Customer;
    message: string;
  }>('/api/customers', customerData),
};

// Product Management API
export const productsApi = {
  // Get all products with filtering
  getProducts: async (params?: ProductFilters) => {
    try {
      const response = await api.get<{
        success: boolean;
        data: Product[];
        total: number;
        metrics: any;
        pagination: { limit: number; offset: number; hasMore: boolean };
      }>('/api/products', params, { returnFullResponse: true });
      
      // Ensure consistent response structure
      if (!response || typeof response !== 'object') {
        return {
          success: true,
          data: [],
          total: 0,
          metrics: {},
          pagination: { limit: params?.limit || 50, offset: params?.offset || 0, hasMore: false }
        };
      }
      
      // Ensure data is always an array
      if (!Array.isArray(response.data)) {
        response.data = [];
      }
      
      // Ensure total is set
      if (typeof response.total !== 'number') {
        response.total = response.data.length;
      }
      
      return response;
    } catch (error) {
      // Return empty response structure on error
      return {
        success: false,
        data: [],
        total: 0,
        metrics: {},
        pagination: { limit: params?.limit || 50, offset: params?.offset || 0, hasMore: false }
      };
    }
  },

  // Get single product
  getProduct: (id: string) =>
    api.get<{ success: boolean; data: Product }>(`/api/products/${id}`),

  // Create product
  createProduct: (product: Partial<Product>) =>
    api.post<{ success: boolean; data: Product; message: string }>('/api/products', product),

  // Update product
  updateProduct: (id: string, product: Partial<Product>) =>
    api.put<{ success: boolean; data: Product; message: string }>(`/api/products/${id}`, product),

  // Delete product
  deleteProduct: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/products/${id}`),

  // Update product variants
  updateProductVariants: (id: string, variants: any[]) =>
    api.patch<{ success: boolean; data: Product; message: string }>(
      `/api/products/${id}/variants`,
      { variants }
    ),

  // Update variant stock
  updateVariantStock: (id: string, variantStocks: Array<{ variantId: string; stock: number }>) =>
    api.patch<{ success: boolean; data: Product; message: string }>(
      `/api/products/${id}/variant-stock`,
      { variantStocks }
    ),

  // Upload product images
  uploadProductImages: (id: string, images: Array<{ url: string; alt?: string }>) =>
    api.post<{ success: boolean; data: Product; message: string }>(
      `/api/products/${id}/images`,
      { images }
    ),

  // Bulk import products
  bulkImportProducts: (products: Partial<Product>[]) =>
    api.post<{
      success: boolean;
      data: { success: number; failed: number; errors: any[]; imported: Product[] };
      message: string;
    }>('/api/products/bulk', { products }),

  // Duplicate product
  duplicateProduct: (id: string, newName?: string) =>
    api.post<{ success: boolean; data: Product; message: string }>(
      `/api/products/${id}/duplicate`,
      { newName }
    ),

  // Bulk generate products for categories
  bulkGenerateProducts: (categories: Array<{ id: string; name: string; icon?: string; description?: string }>, count?: number) =>
    api.post<{
      success: boolean;
      data: { created: number; failed: number; errors: Array<{ category: string; error: string }>; products: Product[] };
      message: string;
    }>('/api/products/bulk-generate', { categories, count }),
};

// Category Management API
export const categoriesApi = {
  // Get all categories
  getCategories: async (params?: {
    featured?: boolean;
    search?: string;
    parentId?: string;
    sortBy?: 'name' | 'order' | 'products' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    type?: 'shop' | 'drop';
  }) => {
    try {
      const response = await api.get<{
        success: boolean;
        data: Category[];
        total: number;
        metrics: any;
        pagination: { limit: number; offset: number; hasMore: boolean };
      }>('/api/categories', params);
      
      // Ensure consistent response structure
      if (!response || typeof response !== 'object') {
        return {
          success: true,
          data: [],
          total: 0,
          metrics: {},
          pagination: { limit: params?.limit || 50, offset: params?.offset || 0, hasMore: false }
        };
      }
      
      // Ensure data is always an array
      if (!Array.isArray(response.data)) {
        response.data = [];
      }
      
      // Ensure total is set
      if (typeof response.total !== 'number') {
        response.total = response.data.length;
      }
      
      return response;
    } catch (error) {
      // Return empty response structure on error
      return {
        success: false,
        data: [],
        total: 0,
        metrics: {},
        pagination: { limit: params?.limit || 50, offset: params?.offset || 0, hasMore: false }
      };
    }
  },

  // Get category tree (hierarchical)
  getCategoryTree: (parentId?: string) =>
    api.get<{ success: boolean; data: Category[] }>('/api/categories/tree', { parentId }),

  // Get single category
  getCategory: (id: string) =>
    api.get<{ success: boolean; data: Category }>(`/api/categories/${id}`),

  // Get category analytics
  getCategoryAnalytics: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/api/categories/${id}/analytics`),

  // Create category
  createCategory: (category: Partial<Category>) =>
    api.post<{ success: boolean; data: Category; message: string }>('/api/categories', category),

  // Update category
  updateCategory: (id: string, category: Partial<Category>) =>
    api.put<{ success: boolean; data: Category; message: string }>(`/api/categories/${id}`, category),

  // Update category order
  updateCategoryOrder: (id: string, order: number) =>
    api.patch<{ success: boolean; data: Category; message: string }>(
      `/api/categories/${id}/order`,
      { order }
    ),

  // Bulk update category order
  bulkUpdateCategoryOrder: (updates: Array<{ categoryId: string; order: number }>) =>
    api.patch<{ success: boolean; data: { success: number; failed: number }; message: string }>(
      '/api/categories/bulk-order',
      { updates }
    ),

  // Delete category
  deleteCategory: (id: string) =>
    api.delete<{ success: boolean; message: string }>(`/api/categories/${id}`),
};

// Inventory Management API
export const inventoryApi = {
  // Get all inventory items
  getInventory: (params?: {
    lowStock?: boolean;
    outOfStock?: boolean;
    location?: string;
    search?: string;
    sortBy?: 'name' | 'stock' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }) =>
    api.get<{
      success: boolean;
      data: InventoryItemExtended[];
      total: number;
      metrics: any;
      pagination: { limit: number; offset: number; hasMore: boolean };
    }>('/api/inventory', params),

  // Get single inventory item
  getInventoryItem: (id: string) =>
    api.get<InventoryItem>(`/api/inventory/${id}`),

  // Get low stock items
  getLowStockItems: (threshold?: number) =>
    api.get<{ success: boolean; data: LowStockAlert[] }>('/api/inventory/low-stock', { threshold }),

  // Get stock history
  getStockHistory: (productId: string, limit?: number) =>
    api.get<{ success: boolean; data: StockMovement[] }>(`/api/inventory/${productId}/history`, { limit }),

  // Adjust stock
  adjustStock: (productId: string, adjustment: number, reason?: string, location?: string) =>
    api.patch<{ success: boolean; data: InventoryItemExtended; message: string }>(
      `/api/inventory/${productId}/adjust`,
      { adjustment, reason, location }
    ),

  // Reserve stock
  reserveStock: (productId: string, quantity: number, orderId: string) =>
    api.post<{ success: boolean; message: string }>(`/api/inventory/${productId}/reserve`, {
      quantity,
      orderId
    }),

  // Release stock
  releaseStock: (productId: string, quantity: number, orderId: string) =>
    api.post<{ success: boolean; message: string }>(`/api/inventory/${productId}/release`, {
      quantity,
      orderId
    }),

  // Configure low stock alerts
  configureAlerts: (productId: string, threshold: number) =>
    api.post<{ success: boolean; message: string }>('/api/inventory/alerts/configure', {
      productId,
      threshold
    }),

  // Configure auto-reorder
  configureAutoReorder: (config: {
    productId: string;
    enabled?: boolean;
    reorderPoint?: number;
    reorderQuantity?: number;
    supplier?: string;
    leadTime?: number;
  }) =>
    api.post<{ success: boolean; data: any; message: string }>('/api/inventory/auto-reorder/configure', config),

  // Check auto-reorder
  checkAutoReorder: () =>
    api.get<{ success: boolean; data: any[]; message: string }>('/api/inventory/auto-reorder/check'),

  // Update inventory item (legacy)
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) =>
    api.patch<InventoryItem>(`/api/inventory/${id}`, updates),

  // Get low stock alerts (legacy)
  getLowStockAlerts: () =>
    api.get<InventoryItem[]>('/api/inventory/alerts/low-stock'),

  // Get inventory analytics
  getInventoryAnalytics: () =>
    api.get<any>('/api/inventory/analytics'),
};

// Analytics API
export const analyticsApi = {
  // Get sales analytics
  getSalesAnalytics: (params?: {
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
  }) =>
    api.get<{ success: boolean; data: RevenueReport }>('/api/analytics/sales', params),

  // Get revenue reports
  getRevenueReports: (startDate: string, endDate: string) =>
    api.get<{ success: boolean; data: RevenueReport }>('/api/analytics/revenue', { startDate, endDate }),

  // Get bestsellers
  getBestsellers: (params?: { limit?: number; startDate?: string; endDate?: string }) =>
    api.get<{ success: boolean; data: BestsellerProduct[] }>('/api/analytics/bestsellers', params),

  // Get category performance
  getCategoryPerformance: (params?: { startDate?: string; endDate?: string }) =>
    api.get<{ success: boolean; data: CategoryPerformance[] }>('/api/analytics/categories', params),

  // Get customer analytics
  getCustomerAnalytics: () =>
    api.get<{ success: boolean; data: CustomerAnalytics }>('/api/analytics/customers'),

  // Get dashboard metrics
  getDashboardMetrics: () =>
    api.get<{ success: boolean; data: DashboardMetrics }>('/api/analytics/dashboard'),

  // Export analytics data
  exportAnalytics: (format: 'csv' | 'pdf' | 'excel', type: string) =>
    api.get<Blob>(`/api/analytics/export?format=${format}&type=${type}`),
};

// Dashboard API for real-time data
export const dashboardApi = {
  // Get real-time dashboard stats
  getRealtimeStats: () =>
    api.get<any>('/api/dashboard/realtime'),

  // Get today's summary
  getTodaySummary: () =>
    api.get<any>('/api/dashboard/today'),

  // Get recent activity
  getRecentActivity: (limit = 10) =>
    api.get<any[]>(`/api/dashboard/activity?limit=${limit}`),
};

// Shipping Types
export interface ShippingLabel {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  carrierService?: string;
  labelUrl: string;
  labelFormat: 'pdf' | 'png' | 'zpl';
  status: 'created' | 'printed' | 'voided';
  cost: number;
  createdAt: string;
  printedAt?: string;
}

export interface ShippingTracking {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: Array<{
    timestamp: string;
    location?: string;
    description: string;
    status: string;
  }>;
  lastUpdated: string;
}

export interface ShippingReturn {
  id: string;
  orderId: string;
  returnNumber: string;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'in_transit' | 'received' | 'refunded';
  requestedAt: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    reason: string;
  }>;
  returnLabel?: ShippingLabel;
  refundAmount?: number;
  refundedAt?: string;
}

export interface ShippingProvider {
  id: string;
  name: string;
  code: 'dhl' | 'ups' | 'fedex' | 'dpd' | 'hermes' | 'gls' | 'custom';
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  testMode: boolean;
  services: Array<{
    id: string;
    name: string;
    code: string;
    enabled: boolean;
    estimatedDays: number;
  }>;
}

export interface ShippingCostEstimate {
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  estimatedDelivery: string;
}

export interface ShippingStats {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  returnedShipments: number;
  totalShippingCost: number;
  averageShippingCost: number;
  averageDeliveryTime: number;
  byCarrier: Array<{
    carrier: string;
    count: number;
    cost: number;
  }>;
  byPeriod: Array<{
    period: string;
    shipments: number;
    cost: number;
  }>;
}

// Shipping Management API
export const shippingApi = {
  // Get shipping stats
  getShippingStats: (params?: {
    dateFrom?: string;
    dateTo?: string;
    carrier?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.set('dateTo', params.dateTo);
    if (params?.carrier) searchParams.set('carrier', params.carrier);
    
    const url = searchParams.toString() 
      ? `/api/shipping/stats?${searchParams.toString()}`
      : '/api/shipping/stats';
    
    return api.get<ShippingStats>(url);
  },

  // Get orders ready for shipping
  getOrdersReadyForShipping: (params?: {
    limit?: number;
    offset?: number;
    carrier?: string;
  }) => api.getPaginated<Order>('/api/shipping/ready', params),

  // Create shipping label
  createShippingLabel: (orderId: string, data: {
    carrier: string;
    service?: string;
    packageType?: string;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }) => api.post<ShippingLabel>(`/api/shipping/labels`, { orderId, ...data }),

  // Create bulk shipping labels
  createBulkShippingLabels: (orderIds: string[], data: {
    carrier: string;
    service?: string;
  }) => api.post<{
    success: number;
    failed: number;
    labels: ShippingLabel[];
    errors: Array<{ orderId: string; error: string }>;
  }>('/api/shipping/labels/bulk', { orderIds, ...data }),

  // Get shipping label
  getShippingLabel: (labelId: string) => api.get<ShippingLabel>(`/api/shipping/labels/${labelId}`),

  // Download shipping label
  downloadShippingLabel: (labelId: string, format?: 'pdf' | 'png' | 'zpl') => {
    const url = format 
      ? `/api/shipping/labels/${labelId}/download?format=${format}`
      : `/api/shipping/labels/${labelId}/download`;
    return api.get<Blob>(url);
  },

  // Void shipping label
  voidShippingLabel: (labelId: string) => api.post<void>(`/api/shipping/labels/${labelId}/void`),

  // Get tracking information
  getTracking: (orderId: string) => api.get<ShippingTracking>(`/api/shipping/tracking/${orderId}`),

  // Update tracking information
  updateTracking: (orderId: string, trackingNumber: string, carrier: string) => 
    api.post<ShippingTracking>(`/api/shipping/tracking/${orderId}`, { trackingNumber, carrier }),

  // Get shipping providers
  getShippingProviders: () => api.get<ShippingProvider[]>('/api/shipping/providers'),

  // Update shipping provider
  updateShippingProvider: (providerId: string, updates: Partial<ShippingProvider>) =>
    api.patch<ShippingProvider>(`/api/shipping/providers/${providerId}`, updates),

  // Calculate shipping cost
  calculateShippingCost: (data: {
    from: {
      country: string;
      postalCode: string;
    };
    to: {
      country: string;
      postalCode: string;
    };
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }) => api.post<ShippingCostEstimate[]>('/api/shipping/calculate', data),

  // Get returns
  getReturns: (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => api.getPaginated<ShippingReturn>('/api/shipping/returns', params),

  // Get return details
  getReturn: (returnId: string) => api.get<ShippingReturn>(`/api/shipping/returns/${returnId}`),

  // Process return
  processReturn: (returnId: string, action: 'approve' | 'reject', refundAmount?: number) =>
    api.post<ShippingReturn>(`/api/shipping/returns/${returnId}/process`, { action, refundAmount }),

  // Create return label
  createReturnLabel: (returnId: string, carrier: string) =>
    api.post<ShippingLabel>(`/api/shipping/returns/${returnId}/label`, { carrier }),

  // Send shipping notification
  sendShippingNotification: (orderId: string, trackingNumber?: string) =>
    api.post<void>(`/api/shipping/notifications/${orderId}`, { trackingNumber }),

  // Get shipping history
  getShippingHistory: (params?: {
    orderId?: string;
    trackingNumber?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) => api.getPaginated<{
    id: string;
    orderId: string;
    trackingNumber: string;
    carrier: string;
    status: string;
    createdAt: string;
    deliveredAt?: string;
  }>('/api/shipping/history', params),
};
