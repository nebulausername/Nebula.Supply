import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Package, 
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Settings,
  Edit
} from 'lucide-react';
import { useInventory, useLowStockItems, useCheckAutoReorder } from '../../lib/api/shopHooks';
import { LowStockAlerts } from './LowStockAlerts';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { StockAuditLog } from './StockAuditLog';
import { useRealtimeInventory } from '../../lib/websocket/useRealtimeInventory';
import { springConfigs } from '../../utils/springConfigs';
import { logger } from '../../lib/logger';
import type { InventoryItemExtended } from '../../lib/api/ecommerce';

// Optimized date formatting function with error handling
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (Number.isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString('de-DE', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

function StatsCard({ label, value, subValue, icon, color, delay = 0 }: StatsCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfigs.gentle, delay }}
    >
      <Card className={`p-6 border ${colors.border} hover:shadow-lg transition-all duration-300`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            {subValue && (
              <p className="text-sm text-muted-foreground">{subValue}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function InventoryManagementNew() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'movements'>('overview');
  const [stockAdjustmentItem, setStockAdjustmentItem] = useState<InventoryItemExtended | null>(null);
  const [selectedProductForAudit, setSelectedProductForAudit] = useState<string | null>(null);

  // Real-time inventory updates
  const { isConnected, connectionStatus } = useRealtimeInventory({
    enabled: true,
    onUpdated: (event) => {
      logger.info('Inventory updated', { productId: event.productId, newStock: event.newStock });
    },
    onLowStock: (event) => {
      logger.warn('Low stock alert', { productId: event.productId, stock: event.newStock });
    },
    onOutOfStock: (event) => {
      logger.error('Out of stock', { productId: event.productId });
    },
  });

  // API hooks
  const {
    data: inventoryResponse,
    isLoading,
    error,
    refetch
  } = useInventory({
    search: searchTerm,
    lowStock: filterStock === 'low' ? true : undefined,
    outOfStock: filterStock === 'out' ? true : undefined,
    sortBy: 'stock',
    sortOrder: 'asc',
  });

  const { data: lowStockResponse } = useLowStockItems();
  const { data: autoReorderResponse } = useCheckAutoReorder();

  const inventory = inventoryResponse?.data || [];
  const metrics = inventoryResponse?.metrics || {
    totalProducts: 0,
    totalStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
  };

  const handleAdjustStock = (item: InventoryItemExtended) => {
    setStockAdjustmentItem(item);
  };

  // Memoized stock badge function for better performance
  const getStockBadge = useCallback((item: InventoryItemExtended) => {
    if (item.currentStock === 0) {
      return <Badge variant="destructive" className="text-red-400">Out of Stock</Badge>;
    }
    if (item.currentStock < (item.lowStockThreshold || 0)) {
      return <Badge variant="outline" className="text-orange-400 border-orange-400">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="text-green-400 border-green-400">In Stock</Badge>;
  }, []);

  if (error) {
    return (
      <Card className="p-12 text-center border-red-500/30">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold mb-2">Failed to load inventory</h3>
        <p className="text-muted-foreground mb-4">Please try again</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-16 bg-gray-800/50 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Connection Status */}
      {!isConnected && (
        <Card className="p-4 bg-orange-900/20 border-orange-500/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-orange-400">
              Real-time updates disconnected. Inventory changes may not appear immediately.
            </span>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Package className="w-7 h-7 text-blue-400" />
            Inventory Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track stock levels, alerts, and movements
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'low', label: 'Low Stock' },
              { value: 'out', label: 'Out of Stock' },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={filterStock === filter.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterStock(filter.value as any)}
                className={filterStock === filter.value ? 'bg-blue-500/20 text-blue-400' : ''}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Products"
          value={metrics.totalProducts}
          subValue={`${metrics.totalStock.toLocaleString()} total units`}
          icon={<Package className="w-6 h-6" />}
          color="blue"
          delay={0}
        />
        <StatsCard
          label="Available Stock"
          value={metrics.totalStock - (metrics.reservedStock || 0)}
          subValue={`${metrics.reservedStock || 0} reserved`}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          delay={0.05}
        />
        <StatsCard
          label="Low Stock Items"
          value={metrics.lowStockItems}
          subValue="Below threshold"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="orange"
          delay={0.1}
        />
        <StatsCard
          label="Out of Stock"
          value={metrics.outOfStockItems}
          subValue="Needs restock"
          icon={<TrendingDown className="w-6 h-6" />}
          color="red"
          delay={0.15}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
          <TabsTrigger value="overview">Stock Overview</TabsTrigger>
          <TabsTrigger value="alerts">Low Stock Alerts</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        {/* Stock Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Inventory Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">SKU</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Current</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Reserved</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Available</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Last Updated</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, index) => {
                    const stockBadge = getStockBadge(item);
                    return (
                    <motion.tr
                      key={item.productId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-400" />
                          <span className="font-medium text-white">{item.productName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground font-mono">{item.sku}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-white text-lg">{item.currentStock}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-orange-400">{item.reservedStock}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-green-400">{item.availableStock}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {stockBadge}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs text-muted-foreground">{formatDate(item.lastUpdated)}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAdjustStock(item)}
                            className="hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Adjust
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProductForAudit(item.productId);
                              setActiveTab('movements');
                            }}
                            className="hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-400"
                          >
                            <Activity className="w-4 h-4 mr-1" />
                            History
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {inventory.length === 0 && (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No inventory items found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search' : 'No products in inventory yet'}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Low Stock Alerts Tab */}
        <TabsContent value="alerts" className="mt-6">
          <LowStockAlerts />
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="mt-6">
          {selectedProductForAudit ? (
            <StockAuditLog
              productId={selectedProductForAudit}
              productName={inventory.find(item => item.productId === selectedProductForAudit)?.productName}
            />
          ) : (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Stock Movements</h3>
                  <p className="text-sm text-muted-foreground">View stock history and movements</p>
                </div>
              </div>

              <p className="text-center text-muted-foreground py-12">
                Select a product from the overview to view its stock history
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Stock Adjustment Modal */}
      {stockAdjustmentItem && (
        <StockAdjustmentModal
          open={!!stockAdjustmentItem}
          onClose={() => {
            setStockAdjustmentItem(null);
            refetch();
          }}
          productId={stockAdjustmentItem.productId}
          productName={stockAdjustmentItem.productName}
          currentStock={stockAdjustmentItem.currentStock}
          sku={stockAdjustmentItem.sku}
        />
      )}
    </div>
  );
}

