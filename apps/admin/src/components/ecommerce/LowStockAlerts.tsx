import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  AlertTriangle,
  Package,
  RefreshCw,
  Bell,
  BellOff,
  ChevronRight,
  TrendingDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useLowStockItems, useCheckAutoReorder } from '../../lib/api/shopHooks';
import { springConfigs } from '../../utils/springConfigs';

export function LowStockAlerts() {
  const {
    data: lowStockItems,
    isLoading,
    error,
    refetch
  } = useLowStockItems();

  const {
    data: autoReorderNeeded,
    refetch: refetchAutoReorder
  } = useCheckAutoReorder();

  const criticalItems = useMemo(() => {
    if (!lowStockItems) return [];
    return lowStockItems.filter(item => item.severity === 'critical');
  }, [lowStockItems]);

  const warningItems = useMemo(() => {
    if (!lowStockItems) return [];
    return lowStockItems.filter(item => item.severity === 'warning');
  }, [lowStockItems]);

  const handleRefresh = () => {
    refetch();
    refetchAutoReorder();
  };

  if (error) {
    return (
      <Card className="p-6 border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-medium">Failed to load stock alerts</p>
            <p className="text-sm text-muted-foreground">Please try again</p>
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin">
            <RefreshCw className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-muted-foreground">Loading stock alerts...</p>
        </div>
      </Card>
    );
  }

  if (!lowStockItems || lowStockItems.length === 0) {
    return (
      <Card className="p-6 border-green-500/30 bg-green-500/5">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-400" />
          <div>
            <p className="font-medium text-white">All Stock Levels Good</p>
            <p className="text-sm text-muted-foreground">No low stock items detected</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              criticalItems.length > 0 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-orange-500/20 text-orange-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Low Stock Alerts</h3>
              <p className="text-sm text-muted-foreground">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} need attention
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Alert Summary */}
            <div className="flex items-center gap-2">
              {criticalItems.length > 0 && (
                <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                  {criticalItems.length} Critical
                </Badge>
              )}
              {warningItems.length > 0 && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                  {warningItems.length} Warning
                </Badge>
              )}
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Critical Alerts */}
      {criticalItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.gentle }}
        >
          <Card className="p-6 border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h4 className="font-semibold text-white">Critical Stock Levels</h4>
              <Badge variant="destructive">{criticalItems.length}</Badge>
            </div>
            
            <div className="space-y-3">
              {criticalItems.map((item, index) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-red-500/20 hover:border-red-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="font-medium text-white">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Current Stock</p>
                      <p className="text-lg font-bold text-red-400">{item.currentStock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Threshold</p>
                      <p className="text-lg font-medium text-white">{item.threshold}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      Reorder
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Warning Alerts */}
      {warningItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.gentle, delay: 0.1 }}
        >
          <Card className="p-6 border-orange-500/30 bg-orange-500/5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h4 className="font-semibold text-white">Low Stock Warnings</h4>
              <Badge variant="outline" className="text-orange-400 border-orange-400">
                {warningItems.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {warningItems.map((item, index) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="font-medium text-white">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Current Stock</p>
                      <p className="text-lg font-bold text-orange-400">{item.currentStock}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Threshold</p>
                      <p className="text-lg font-medium text-white">{item.threshold}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                    >
                      Review
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Auto-Reorder Suggestions */}
      {autoReorderNeeded && autoReorderNeeded.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.gentle, delay: 0.2 }}
        >
          <Card className="p-6 border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-blue-400" />
              <h4 className="font-semibold text-white">Auto-Reorder Suggestions</h4>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                {autoReorderNeeded.length}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              The following products have reached their reorder point and can be automatically restocked
            </p>

            <div className="space-y-2">
              {autoReorderNeeded.map((reorder, index) => (
                <motion.div
                  key={reorder.productId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-blue-500/20"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white">Reorder {reorder.quantity} units</span>
                  </div>
                  <Button size="sm" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                    Execute
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

