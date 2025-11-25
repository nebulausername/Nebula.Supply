import React, { memo, useMemo } from 'react';
import { VirtualList } from '../ui/VirtualList';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/Table';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/DropdownMenu';
import {
  MoreHorizontal,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { OrderStatusBadge, OrderStatus } from './OrderStatusBadge';
import { Order } from '../../lib/api/ecommerce';
import { OrderDetails } from './OrderDetailsModal';
import { cn } from '../../utils/cn';

interface VirtualizedOrderTableProps {
  orders: Order[];
  selectedOrders: Set<string>;
  onOrderSelect: (orderId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onOrderClick: (order: OrderDetails) => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  containerHeight?: number;
}

const ROW_HEIGHT = 80; // Approximate row height for order rows

export const VirtualizedOrderTable = memo(({
  orders,
  selectedOrders,
  onOrderSelect,
  onSelectAll,
  onOrderClick,
  onStatusUpdate,
  containerHeight = 600,
}: VirtualizedOrderTableProps) => {
  const allSelected = useMemo(() => {
    return orders.length > 0 && selectedOrders.size === orders.length;
  }, [orders.length, selectedOrders.size]);

  const renderOrderRow = (order: Order, index: number) => {
    const isSelected = selectedOrders.has(order.id);

    // Convert Order to OrderDetails format for modal
    const orderDetails: OrderDetails = {
      ...order,
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.type === 'shop' ? `prod-${item.id}` : `drop-${item.id}`,
        name: item.name,
        variant: item.variant,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        productName: item.name,
        sku: `${item.type}-${item.id}`,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        variantName: item.variant,
      })),
      notes: order.notes || [],
      timeline: order.timeline || [],
    };

    return (
      <TableRow
        key={order.id}
        className={cn(
          "hover:bg-white/5 transition-colors",
          isSelected && "bg-blue-500/10"
        )}
        style={{ height: ROW_HEIGHT }}
      >
        <TableCell>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onOrderSelect(order.id, e.target.checked)}
            className="rounded border-white/20 bg-black/25"
            aria-label={`Select order ${order.orderId}`}
          />
        </TableCell>
        <TableCell>
          <div className="font-mono text-sm">{order.orderId}</div>
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{order.customerName}</div>
            <div className="text-sm text-muted">{order.customerEmail}</div>
          </div>
        </TableCell>
        <TableCell>
          <OrderStatusBadge 
            status={order.status as OrderStatus}
            onClick={() => {
              // Handle inline status edit - could open dropdown
            }}
          />
        </TableCell>
        <TableCell>
          <div className="font-medium">€{order.totalAmount.toFixed(2)}</div>
          <div className="text-sm text-muted">{order.currency}</div>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
          <div className="text-xs text-muted">
            {new Date(order.createdAt).toLocaleTimeString()}
          </div>
        </TableCell>
        <TableCell>
          {order.trackingNumber ? (
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                {order.trackingNumber}
              </code>
              {order.trackingUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(order.trackingUrl, '_blank')}
                  aria-label="Open tracking URL"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
            </div>
          ) : (
            <span className="text-muted text-sm">No tracking</span>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Order actions">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onOrderClick(orderDetails)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'processing')}>
                <Package className="w-4 h-4 mr-2" />
                Mark Processing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'shipped')}>
                <Truck className="w-4 h-4 mr-2" />
                Mark Shipped
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusUpdate(order.id, 'delivered')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Delivered
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusUpdate(order.id, 'cancelled')}
                className="text-red-400"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  // Use virtual scrolling for large lists
  const useVirtualScrolling = orders.length > 50;

  if (!useVirtualScrolling) {
    // Render normal table for small lists
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-white/20 bg-black/25"
                  aria-label="Select all orders"
                />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, index) => renderOrderRow(order, index))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Render virtualized table for large lists
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-white/20 bg-black/25"
                aria-label="Select all orders"
              />
            </TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Tracking</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      <div style={{ height: containerHeight, overflow: 'auto' }}>
        <VirtualList
          items={orders}
          itemHeight={ROW_HEIGHT}
          containerHeight={containerHeight}
          renderItem={(order, index) => renderOrderRow(order, index)}
          enabled={true}
        />
      </div>
    </div>
  );
});

VirtualizedOrderTable.displayName = 'VirtualizedOrderTable';

