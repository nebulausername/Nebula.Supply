import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDrops, useUpdateDrop, useDeleteDrop, useFakeCompletePreorder } from '../../lib/api/hooks';
import { useRealtimeDrops } from '../../lib/websocket/useRealtimeDrops';
import { useDropStore, useDropFilters, useDropSorting, useDropPagination } from '../../store/dropStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { InlineEditCell } from './InlineEditCell';
import { DropVariantEditor } from './DropVariantEditor';
import { ConnectionStatus, ConnectionStatusBadge } from './ConnectionStatus';
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
  Filter, 
  SortAsc, 
  SortDesc, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Plus,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';

export const RealtimeDropDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<any>(null);
  const [showVariants, setShowVariants] = useState(false);

  // Store state
  const filters = useDropFilters();
  const sorting = useDropSorting();
  const pagination = useDropPagination();
  const { setFilters, setSorting, setPagination } = useDropStore();

  // Real-time connection
  const { isConnected, connectionStatus } = useRealtimeDrops({
    enabled: true,
    filters,
    onDropCreated: (event) => {
      console.log('Drop created:', event);
    },
    onDropUpdated: (event) => {
      console.log('Drop updated:', event);
    },
    onDropDeleted: (event) => {
      console.log('Drop deleted:', event);
    }
  });

  // Data fetching
  const { data: dropsData, isLoading, error } = useDrops({
    filter: filters.status,
    search: searchTerm,
    sort: sorting.sortBy,
    limit: pagination.pageSize,
    offset: (pagination.currentPage - 1) * pagination.pageSize
  });

  const updateDropMutation = useUpdateDrop();
  const deleteDropMutation = useDeleteDrop();
  const fakeCompleteMutation = useFakeCompletePreorder();

  // Computed values
  const drops = dropsData?.data || [];
  const totalDrops = dropsData?.pagination?.total || 0;
  const hasMore = dropsData?.pagination?.hasMore || false;

  // Real-time stats
  const stats = useMemo(() => {
    const totalStock = drops.reduce((sum, drop) => 
      sum + (drop.totalStock || 0), 0
    );
    const totalRevenue = drops.reduce((sum, drop) => 
      sum + (drop.revenue || 0), 0
    );
    const activeDrops = drops.filter(drop => drop.status === 'active').length;
    const lowStockDrops = drops.filter(drop => {
      const available = (drop.totalStock || 0) - (drop.soldCount || 0);
      return available <= 10;
    }).length;

    return {
      totalDrops,
      totalStock,
      totalRevenue,
      activeDrops,
      lowStockDrops
    };
  }, [drops]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ search: value });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ [key]: value });
  };

  const handleSortChange = (sortBy: string) => {
    setSorting(sortBy as any);
  };

  const handleDropUpdate = async (dropId: string, field: string, value: any) => {
    try {
      await updateDropMutation.mutateAsync({
        id: dropId,
        data: { [field]: value }
      });
    } catch (error) {
      console.error('Failed to update drop:', error);
    }
  };

  const handleStockUpdate = async (dropId: string, variantId: string, oldStock: number, newStock: number) => {
    try {
      // Use the dedicated stock endpoint for real-time updates
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/drops/${dropId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId,
          stock: newStock,
          oldStock
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  const handleDropDelete = async (dropId: string) => {
    if (window.confirm('Are you sure you want to delete this drop?')) {
      try {
        await deleteDropMutation.mutateAsync(dropId);
      } catch (error) {
        console.error('Failed to delete drop:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'sold_out': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessColor = (access: string) => {
    switch (access) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatus = (drop: any) => {
    const available = (drop.totalStock || 0) - (drop.soldCount || 0);
    const percentage = drop.totalStock > 0 ? (available / drop.totalStock) * 100 : 0;

    if (available <= 0) {
      return { status: 'out', color: 'text-red-600', icon: AlertTriangle };
    } else if (percentage <= 10) {
      return { status: 'low', color: 'text-yellow-600', icon: AlertTriangle };
    } else if (percentage <= 50) {
      return { status: 'medium', color: 'text-orange-600', icon: Clock };
    } else {
      return { status: 'good', color: 'text-green-600', icon: CheckCircle };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">Failed to load drops</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drop Management</h1>
          <p className="text-gray-600">Real-time drop administration</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatusBadge />
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Drop
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Drops</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDrops}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeDrops}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockDrops}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search drops..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Status: {filters.status || 'All'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterChange('status', '')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'active')}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'inactive')}>
                Inactive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'sold_out')}>
                Sold Out
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('status', 'scheduled')}>
                Scheduled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SortAsc className="w-4 h-4 mr-2" />
                Sort: {sorting.sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSortChange('name')}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('price')}>
                Price
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('popularity')}>
                Popularity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('availability')}>
                Availability
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('newest')}>
                Newest
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('status')}>
                Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() => setShowVariants(!showVariants)}
          >
            {showVariants ? 'Hide' : 'Show'} Variants
          </Button>
        </div>
      </Card>

      {/* Drops Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Preorder</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drops.map((drop) => {
              const stockStatus = getStockStatus(drop);
              const StockIcon = stockStatus.icon;

              return (
                <React.Fragment key={drop.id}>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{drop.name}</div>
                          {drop.description && (
                            <div className="text-sm text-gray-500">{drop.description}</div>
                          )}
                        </div>
                        {drop.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {drop.badge}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <InlineEditCell
                        value={drop.status}
                        onSave={(newValue) => handleDropUpdate(drop.id, 'status', newValue)}
                        type="select"
                        options={[
                          { value: 'active', label: 'Active' },
                          { value: 'inactive', label: 'Inactive' },
                          { value: 'sold_out', label: 'Sold Out' },
                          { value: 'scheduled', label: 'Scheduled' }
                        ]}
                        formatDisplay={(value) => (
                          <Badge className={getStatusColor(value)}>
                            {value}
                          </Badge>
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <InlineEditCell
                        value={drop.access}
                        onSave={(newValue) => handleDropUpdate(drop.id, 'access', newValue)}
                        type="select"
                        options={[
                          { value: 'free', label: 'Free' },
                          { value: 'limited', label: 'Limited' },
                          { value: 'vip', label: 'VIP' },
                          { value: 'standard', label: 'Standard' }
                        ]}
                        formatDisplay={(value) => (
                          <Badge className={getAccessColor(value)}>
                            {value}
                          </Badge>
                        )}
                      />
                    </TableCell>

                    {/* Preorder Status Column */}
                    <TableCell>
                      {drop.minimumOrders !== undefined ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">
                              {(drop as any).currentOrders || 0} / {drop.minimumOrders}
                            </span>
                          </div>
                          <Badge 
                            className={
                              (drop as any).preorderStatus === 'reached' || (drop as any).preorderStatus === 'ordered' 
                                ? 'bg-green-100 text-green-800'
                                : (drop as any).preorderStatus === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {(drop as any).preorderStatus || 'collecting'}
                          </Badge>
                          {((drop as any).currentOrders || 0) < drop.minimumOrders && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1 text-xs"
                              onClick={async () => {
                                if (confirm(`Fake-complete preorder? This will fill ${drop.minimumOrders - ((drop as any).currentOrders || 0)} missing orders.`)) {
                                  try {
                                    await fakeCompleteMutation.mutateAsync(drop.id);
                                    alert('Preorder fake-completed successfully!');
                                  } catch (error) {
                                    alert('Failed to fake-complete preorder');
                                  }
                                }
                              }}
                              disabled={fakeCompleteMutation.isPending}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Fake Complete
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StockIcon className={`w-4 h-4 ${stockStatus.color}`} />
                        <span className={stockStatus.color}>
                          {(drop.totalStock || 0) - (drop.soldCount || 0)} / {drop.totalStock || 0}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        €{Math.min(...(drop.variants || []).map((v: any) => v.basePrice)).toFixed(2)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-medium">
                        €{(drop.revenue || 0).toFixed(2)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDrop(drop)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDropDelete(drop.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Variants Row */}
                  {showVariants && drop.variants && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <DropVariantEditor
                          variants={drop.variants}
                          onVariantsChange={(newVariants) => 
                            handleDropUpdate(drop.id, 'variants', newVariants)
                          }
                          onStockChange={(variantId, oldStock, newStock) =>
                            handleStockUpdate(drop.id, variantId, oldStock, newStock)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalDrops > pagination.pageSize && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, totalDrops)} of {totalDrops} drops
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(pagination.currentPage + 1)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Connection Status Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Connection Details
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connection Status</DialogTitle>
            <DialogDescription>
              Real-time connection information
            </DialogDescription>
          </DialogHeader>
          <ConnectionStatus showDetails />
        </DialogContent>
      </Dialog>
    </div>
  );
};
