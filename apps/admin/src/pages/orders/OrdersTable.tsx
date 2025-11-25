import React, { useState, useMemo } from 'react';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { useToastHelpers } from '../../components/ui/Toast';
import { OrdersBulkBar } from './OrdersBulkBar';
import { OrderStatus, canTransition, getNextStatuses, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@nebula/shared';
import { Order } from '../../schemas/api';
import { logger } from '../../lib/logger';

interface OrdersTableProps {
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: OrderStatus, version?: number) => Promise<void>;
  onOrderSelect: (orderId: string) => void;
  className?: string;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  onStatusChange,
  onOrderSelect,
  className
}) => {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  const { success, error: showError } = useToastHelpers();

  // Group orders by status for bulk operations
  const ordersByStatus = useMemo(() => {
    const groups: Record<OrderStatus, Order[]> = {
      created: [],
      paid: [],
      packed: [],
      shipped: [],
      delivered: [],
      returned: [],
      cancelled: []
    };

    orders.forEach(order => {
      groups[order.status].push(order);
    });

    return groups;
  }, [orders]);

  const handleSelectOrder = (orderId: string, selected: boolean) => {
    setSelectedOrderIds(prev => 
      selected 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  };

  const handleSelectAll = (status: OrderStatus, selected: boolean) => {
    const orderIds = ordersByStatus[status].map(order => order.id);
    setSelectedOrderIds(prev => {
      if (selected) {
        return [...new Set([...prev, ...orderIds])];
      } else {
        return prev.filter(id => !orderIds.includes(id));
      }
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (!canTransition(order.status, newStatus)) {
      showError('Invalid Transition', `Cannot transition from ${order.status} to ${newStatus}`);
      return;
    }

    setProcessingOrders(prev => new Set([...prev, orderId]));
    
    try {
      await onStatusChange(orderId, newStatus, order.version);
      success('Status Updated', `Order ${orderId.slice(-8)} status changed to ${newStatus}`);
      logger.logUserAction('order_status_change', {
        orderId,
        fromStatus: order.status,
        toStatus: newStatus
      });
    } catch (err) {
      showError('Status Update Failed', 'Could not update order status');
      logger.error('Order status change failed', err);
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleBulkStatusChange = async (orderIds: string[], newStatus: OrderStatus) => {
    const promises = orderIds.map(orderId => 
      onStatusChange(orderId, newStatus, orders.find(o => o.id === orderId)?.version)
    );
    
    await Promise.allSettled(promises);
    setSelectedOrderIds([]);
  };

  const clearSelection = () => {
    setSelectedOrderIds([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const StatusBadge = ({ status }: { status: OrderStatus }) => (
    <Badge className={`${ORDER_STATUS_COLORS[status]} text-white`}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );

  const StatusSelect = ({ order }: { order: Order }) => {
    const nextStatuses = getNextStatuses(order.status);
    const isProcessing = processingOrders.has(order.id);

    if (nextStatuses.length === 0) {
      return <StatusBadge status={order.status} />;
    }

    return (
      <div className="flex items-center gap-2">
        <StatusBadge status={order.status} />
        <Select
          value=""
          onChange={(e) => {
            const newStatus = e.target.value as OrderStatus;
            if (newStatus) {
              handleStatusChange(order.id, newStatus);
            }
          }}
          disabled={isProcessing}
          className="min-w-24 text-xs"
        >
          <option value="">Change...</option>
          {nextStatuses.map(status => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
        {isProcessing && (
          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Bulk Actions Bar */}
      {selectedOrderIds.length > 0 && (
        <OrdersBulkBar
          selectedOrderIds={selectedOrderIds}
          currentStatus={ordersByStatus[selectedOrderIds[0]]?.[0]?.status || 'created'}
          onBulkStatusChange={handleBulkStatusChange}
          onClearSelection={clearSelection}
          className="mb-4"
        />
      )}

      {/* Orders by Status */}
      <div className="space-y-6">
        {Object.entries(ordersByStatus).map(([status, statusOrders]) => {
          if (statusOrders.length === 0) return null;

          const nextStatuses = getNextStatuses(status as OrderStatus);
          const canBulkChange = nextStatuses.length > 0;
          const allSelected = statusOrders.every(order => selectedOrderIds.includes(order.id));
          const someSelected = statusOrders.some(order => selectedOrderIds.includes(order.id));

          return (
            <div key={status} className="space-y-3">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={status as OrderStatus} />
                  <span className="text-sm text-gray-400">
                    {statusOrders.length} order{statusOrders.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {canBulkChange && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={(e) => handleSelectAll(status as OrderStatus, e.target.checked)}
                        className="rounded border-gray-600"
                      />
                      Select all
                    </label>
                  </div>
                )}
              </div>

              {/* Orders Table */}
              <Table>
                <thead>
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={(e) => handleSelectAll(status as OrderStatus, e.target.checked)}
                        className="rounded border-gray-600"
                      />
                    </th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {statusOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-800/50">
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                          className="rounded border-gray-600"
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => onOrderSelect(order.id)}
                          className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                        >
                          #{order.id.slice(-8)}
                        </button>
                      </td>
                      <td className="text-sm">
                        {order.shippingAddress.name}
                      </td>
                      <td className="font-mono text-sm">
                        {formatCurrency(order.total, order.currency)}
                      </td>
                      <td>
                        <StatusSelect order={order} />
                      </td>
                      <td className="text-sm text-gray-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td>
                        <Button
                          onClick={() => onOrderSelect(order.id)}
                          variant="outline"
                          size="sm"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No orders found
        </div>
      )}
    </div>
  );
};



