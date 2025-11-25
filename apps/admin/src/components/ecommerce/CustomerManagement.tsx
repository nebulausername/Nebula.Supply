import React, { useState } from 'react';
import { useCustomers, useCustomer, useCustomerOrders, useUpdateCustomerStatus } from '../../lib/api/hooks';
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
import { Search, MoreHorizontal, Eye, Users, Star, ShoppingBag, Calendar, Mail, Phone } from 'lucide-react';
import { Customer, Order } from '../../lib/api/ecommerce';

export function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customersData, isLoading, error } = useCustomers({
    search: searchTerm,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: 50
  });

  const { data: customerDetails } = useCustomer(selectedCustomer?.id || '');
  const { data: customerOrders } = useCustomerOrders(selectedCustomer?.id || '');
  const updateCustomerStatusMutation = useUpdateCustomerStatus();

  const handleStatusUpdate = async (customerId: string, newStatus: Customer['status']) => {
    try {
      await updateCustomerStatusMutation.mutateAsync({ id: customerId, status: newStatus });
    } catch (error) {
      console.error('Failed to update customer status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      vip: 'default'
    } as const;

    const colors = {
      active: 'text-green-500',
      inactive: 'text-muted',
      vip: 'text-yellow-500'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <span className={`w-2 h-2 rounded-full mr-2 ${colors[status as keyof typeof colors] || 'bg-gray-500'}`} />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 1000) return { label: 'VIP', color: 'text-yellow-500' };
    if (totalSpent >= 500) return { label: 'Premium', color: 'text-blue-500' };
    if (totalSpent >= 100) return { label: 'Regular', color: 'text-green-500' };
    return { label: 'New', color: 'text-muted' };
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Error loading customers: {error.message}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Management</h1>
          <p className="text-muted">Manage customer relationships and support</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-white/10 rounded-md bg-black/25 text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </Card>

      {/* Customers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customersData?.data?.map((customer) => {
              const tier = getCustomerTier(customer.totalSpent);
              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {customer.firstName} {customer.lastName}
                        <span className={`text-xs px-2 py-1 rounded-full ${tier.color} bg-current bg-opacity-10`}>
                          {tier.label}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell className="font-medium">€{customer.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>{customer.orders?.length || 0}</TableCell>
                  <TableCell className="text-sm text-muted">
                    {new Date(customer.joinDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted">
                    {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        {customer.status !== 'vip' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(customer.id, 'vip')}>
                            <Star className="w-4 h-4 mr-2" />
                            Upgrade to VIP
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {(!customersData?.data || customersData.data.length === 0) && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-muted">No customers found</p>
          </div>
        )}
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.firstName} {selectedCustomer?.lastName} - {selectedCustomer?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-neon/10 rounded-lg">
                      <Users className="w-5 h-5 text-neon" />
                    </div>
                    <div>
                      <p className="text-sm text-muted">Customer Since</p>
                      <p className="font-semibold">
                        {new Date(selectedCustomer.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted">Total Spent</p>
                      <p className="font-semibold">€{selectedCustomer.totalSpent.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Star className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted">Status</p>
                      <p className="font-semibold">{getStatusBadge(selectedCustomer.status)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Order History */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Order History</h3>
                {customerOrders && customerOrders.length > 0 ? (
                  <div className="space-y-3">
                    {customerOrders.slice(0, 5).map((order) => (
                      <div key={order.orderId} className="flex items-center justify-between p-3 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-mono text-muted">
                            #{order.orderId.slice(-8)}
                          </div>
                          <div className="text-sm text-muted">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-medium">€{order.totalAmount.toFixed(2)}</div>
                            <div className="text-sm text-muted">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant={order.status === 'delivered' ? 'success' : 'outline'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {customerOrders.length > 5 && (
                      <p className="text-sm text-muted text-center">
                        +{customerOrders.length - 5} more orders
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No orders found</p>
                  </div>
                )}
              </Card>

              {/* Customer Actions */}
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <Button
                  onClick={() => handleStatusUpdate(selectedCustomer.id, selectedCustomer.status === 'vip' ? 'active' : 'vip')}
                  className={selectedCustomer.status === 'vip' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-neon hover:bg-neon/80'}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {selectedCustomer.status === 'vip' ? 'Remove VIP Status' : 'Upgrade to VIP'}
                </Button>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


