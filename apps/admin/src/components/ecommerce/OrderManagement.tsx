import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useInfiniteOrders, useUpdateOrderStatus } from '../../lib/api/hooks';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { useOrderManagementShortcuts } from '../../lib/hooks/useKeyboardShortcuts';
import { useRealtimeOrders } from '../../lib/websocket/useRealtimeOrders';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/Dialog';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package,
  Plus,
  Download,
  Printer,
  Edit,
  Trash2,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc,
  ExternalLink
} from 'lucide-react';
import { Order } from '../../lib/api/ecommerce';
import { OrderStatusBadge, OrderStatus } from './OrderStatusBadge';
import { OrderDetailsModal, OrderDetails } from './OrderDetailsModal';
import { OrderFilters, OrderFilters as OrderFiltersType } from './OrderFilters';
import { BulkActionBar, BulkAction } from '../ui/BulkActionBar';
import { InlineEdit } from '../ui/InlineEdit';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { logger } from '../../lib/logger';
import { VirtualizedOrderTable } from './VirtualizedOrderTable';
import { TableLoadingState } from '../ui/LoadingStates';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { OrderExport } from './OrderExport';
import { OrderAnalytics } from './OrderAnalytics';

export function OrderManagement() {
  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('OrderManagement');
  const { handleError } = useErrorHandler('OrderManagement');

  // State management
  const [filters, setFilters] = useState<OrderFiltersType>({});
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'totalAmount' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [focusedOrderIndex, setFocusedOrderIndex] = useState<number | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; label?: string } | null>(null);
  
  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const orderRowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  // Debounce filters to reduce API calls (300ms delay)
  const debouncedFilters = useDebounce(filters, 300);
  const debouncedSearch = useDebounce(filters.search, 300);

  // Infinite scroll ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // API hooks with infinite scroll
  const {
    data: ordersData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteOrders({
    ...debouncedFilters,
    search: debouncedSearch,
    sortBy,
    sortOrder,
  });

  const updateOrderStatusMutation = useUpdateOrderStatus();

  // Memoized data
  const orders = useMemo(() => {
    if (!ordersData) return [];
    return ordersData.orders || [];
  }, [ordersData]);
  
  const metrics = useMemo(() => {
    if (!ordersData) return {};
    return ordersData.metrics || {};
  }, [ordersData]);

  // Infinite scroll with intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Keyboard shortcuts
  useOrderManagementShortcuts({
    onQuickSearch: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onOpenFilters: () => {
      setIsAdvancedFiltersOpen(true);
    },
    onNextOrder: () => {
      if (orders.length === 0) return;
      setFocusedOrderIndex((prev) => {
        const next = prev === null ? 0 : Math.min(prev + 1, orders.length - 1);
        orderRowRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return next;
      });
    },
    onPreviousOrder: () => {
      if (orders.length === 0) return;
      setFocusedOrderIndex((prev) => {
        const next = prev === null ? orders.length - 1 : Math.max(prev - 1, 0);
        orderRowRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return next;
      });
    },
    onOpenOrderDetails: () => {
      if (focusedOrderIndex !== null && orders[focusedOrderIndex]) {
        const order = orders[focusedOrderIndex];
        // Convert to OrderDetails format
        const orderDetails: OrderDetails = {
          ...order,
          customerId: order.customerId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          items: order.items.map(item => ({
            id: item.id,
            productId: item.type === 'shop' ? `prod-${item.id}` : `drop-${item.id}`,
            productName: item.name,
            variantId: item.variant,
            variantName: item.variant,
            sku: `${item.type}-${item.id}`,
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.price * item.quantity,
            image: item.image,
          })),
          notes: order.notes || [],
          timeline: order.timeline || [],
        };
        setSelectedOrder(orderDetails);
        setIsDetailsOpen(true);
      }
    },
    onCloseModal: () => {
      if (isDetailsOpen) {
        setIsDetailsOpen(false);
        setSelectedOrder(null);
      }
    },
    enabled: true,
  });

  // Handlers
  const handleFiltersChange = useCallback((newFilters: OrderFiltersType) => {
    setFilters(newFilters);
    setSelectedOrders(new Set()); // Clear selection when filters change
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSelectedOrders(new Set());
  }, []);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: OrderStatus, trackingInfo?: any) => {
    await measureAsync('status_update', async () => {
      try {
        await updateOrderStatusMutation.mutateAsync({
          orderId,
          status: newStatus,
          trackingInfo
        });
        
        logger.logUserAction('order_status_updated', { orderId, newStatus, trackingInfo });
      } catch (error) {
        handleError(error, { operation: 'status_update', orderId, newStatus });
        throw error;
      }
    });
  }, [measureAsync, updateOrderStatusMutation, handleError]);

  const handleTrackingUpdate = useCallback(async (orderId: string, trackingInfo: any) => {
    await measureAsync('tracking_update', async () => {
      try {
        // Implement tracking update API call
        logger.logUserAction('order_tracking_updated', { orderId, trackingInfo });
      } catch (error) {
        handleError(error, { operation: 'tracking_update', orderId, trackingInfo });
        throw error;
      }
    });
  }, [measureAsync, handleError]);

  const handleNoteAdd = useCallback(async (orderId: string, content: string, isInternal: boolean) => {
    await measureAsync('note_add', async () => {
      try {
        // Implement note add API call
        logger.logUserAction('order_note_added', { orderId, content, isInternal });
      } catch (error) {
        handleError(error, { operation: 'note_add', orderId, content, isInternal });
        throw error;
      }
    });
  }, [measureAsync, handleError]);

  const handleOrderSelect = useCallback((orderId: string, checked: boolean) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(orderId);
      } else {
        newSet.delete(orderId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(orders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  }, [orders]);

  const handleBulkStatusUpdate = useCallback(async (selectedIds: string[], status: string) => {
    await measureAsync('bulk_status_update', async () => {
      try {
        setBulkProgress({ current: 0, total: selectedIds.length, label: `Updating to ${status}...` });
        
        // Process with progress tracking
        for (let i = 0; i < selectedIds.length; i++) {
          const orderId = selectedIds[i];
          try {
            await handleStatusUpdate(orderId, status as OrderStatus);
            setBulkProgress({ current: i + 1, total: selectedIds.length, label: `Updating to ${status}...` });
          } catch (error) {
            console.error(`Failed to update order ${orderId}:`, error);
            // Continue with other orders
          }
        }
        
        setSelectedOrders(new Set());
        setBulkProgress(null);
        logger.logUserAction('bulk_status_update', { orderIds: selectedIds, status });
      } catch (error) {
        setBulkProgress(null);
        handleError(error, { operation: 'bulk_status_update', orderIds: selectedIds, status });
        throw error;
      }
    });
  }, [measureAsync, handleStatusUpdate, handleError]);

  const handleBulkExport = useCallback(async (selectedIds: string[], format: 'csv' | 'pdf') => {
    await measureAsync('bulk_export', async () => {
      try {
        // Implement bulk export
        logger.logUserAction('bulk_export', { orderIds: selectedIds, format });
      } catch (error) {
        handleError(error, { operation: 'bulk_export', orderIds: selectedIds, format });
        throw error;
      }
    });
  }, [measureAsync, handleError]);

  // Bulk actions configuration
  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: 'export-csv',
      label: 'Export CSV',
      icon: Download,
      onAction: (selectedIds) => handleBulkExport(selectedIds, 'csv')
    },
    {
      id: 'export-pdf',
      label: 'Export PDF',
      icon: Printer,
      onAction: (selectedIds) => handleBulkExport(selectedIds, 'pdf')
    },
    {
      id: 'mark-processing',
      label: 'Mark as Processing',
      icon: Package,
      onAction: (selectedIds) => handleBulkStatusUpdate(selectedIds, 'processing')
    },
    {
      id: 'mark-shipped',
      label: 'Mark as Shipped',
      icon: Truck,
      onAction: (selectedIds) => handleBulkStatusUpdate(selectedIds, 'shipped')
    },
    {
      id: 'mark-delivered',
      label: 'Mark as Delivered',
      icon: CheckCircle,
      onAction: (selectedIds) => handleBulkStatusUpdate(selectedIds, 'delivered')
    },
    {
      id: 'mark-cancelled',
      label: 'Mark as Cancelled',
      icon: XCircle,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationTitle: 'Cancel Orders',
      confirmationMessage: 'Are you sure you want to cancel these orders? This action cannot be undone.',
      onAction: (selectedIds) => handleBulkStatusUpdate(selectedIds, 'cancelled')
    }
  ], [handleBulkExport, handleBulkStatusUpdate]);

  // Loading and error states
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Order Management</h1>
          <Button variant="outline" disabled>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <Card className="p-6">
          <TableLoadingState rows={5} columns={7} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Order Management</h1>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
        <ErrorDisplay
          error={error instanceof Error ? error : new Error(String(error))}
          title="Error loading orders"
          onRetry={() => refetch()}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted text-sm sm:text-base">
            {ordersData?.total || 0} orders • {metrics.totalRevenue ? `€${metrics.totalRevenue.toFixed(2)}` : '€0.00'} revenue
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <OrderExport
            orders={orders}
            selectedOrderIds={selectedOrders.size > 0 ? Array.from(selectedOrders) : undefined}
            className="flex-1 sm:flex-initial"
          />
          <Button variant="outline" onClick={() => refetch()} className="flex-1 sm:flex-initial">
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button className="flex-1 sm:flex-initial">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">New Order</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <OrderFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        searchInputRef={searchInputRef}
        isAdvancedOpen={isAdvancedFiltersOpen}
        onAdvancedOpenChange={setIsAdvancedFiltersOpen}
      />

      {/* Analytics Dashboard with Real-time Updates */}
      <div className="relative">
        <OrderAnalytics orders={orders} />
        {/* Real-time indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Metrics Cards */}
      {Object.keys(metrics).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted">Total Orders</div>
            <div className="text-2xl font-bold text-text">{metrics.totalOrders || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">{metrics.pendingOrders || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted">Processing</div>
            <div className="text-2xl font-bold text-blue-400">{metrics.processingOrders || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted">Shipped</div>
            <div className="text-2xl font-bold text-purple-400">{metrics.shippedOrders || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted">Delivered</div>
            <div className="text-2xl font-bold text-green-400">{metrics.deliveredOrders || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted">Revenue</div>
            <div className="text-2xl font-bold text-text">€{metrics.totalRevenue?.toFixed(2) || '0.00'}</div>
          </Card>
        </div>
      )}

      {/* Orders Table */}
      <Card>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Orders</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              >
                {viewMode === 'table' ? 'Cards' : 'Table'}
              </Button>
            </div>
          </div>
        </div>

        {orders.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted opacity-50" />
            <p className="text-muted">No orders found</p>
            <p className="text-sm text-muted mt-2">
              Try adjusting your filters or create a new order
            </p>
          </div>
        ) : (
          <>
            <VirtualizedOrderTable
              orders={orders}
              selectedOrders={selectedOrders}
              onOrderSelect={handleOrderSelect}
              onSelectAll={handleSelectAll}
              onOrderClick={(orderDetails) => {
                setSelectedOrder(orderDetails);
                setIsDetailsOpen(true);
              }}
              onStatusUpdate={handleStatusUpdate}
              containerHeight={600}
            />
            {/* Infinite scroll trigger */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-muted">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading more orders...</span>
                  </div>
                ) : (
                  <div className="h-4" /> // Spacer for intersection observer
                )}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Bulk Actions */}
      <BulkActionBar
        selectedCount={selectedOrders.size}
        selectedIds={Array.from(selectedOrders)}
        onClearSelection={() => {
          setSelectedOrders(new Set());
          setBulkProgress(null);
        }}
        actions={bulkActions}
        isSticky
        showProgress={!!bulkProgress}
        progress={bulkProgress || undefined}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedOrder(null);
        }}
        onStatusUpdate={handleStatusUpdate}
        onTrackingUpdate={handleTrackingUpdate}
        onNoteAdd={handleNoteAdd}
      />
    </div>
  );
}
