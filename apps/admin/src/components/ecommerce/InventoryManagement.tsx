import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { InlineEdit } from '../ui/InlineEdit';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Grid3X3,
  List,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Copy,
  Star,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Zap,
  Crown,
  Lock,
  Globe,
  ShoppingBag,
  Euro,
  Activity,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { products, categories } from '@nebula/shared';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { logger } from '../../lib/logger';
import { extractBrands, calculateBrandStats, getBrandColor, filterProductsByBrands } from '../../lib/utils/brandUtils';
import { useCategories, useProducts } from '../../lib/api/shopHooks';
import { useUpdateProduct, useAdjustStock } from '../../lib/api/shopHooks';
import { useToast } from '../ui/Toast';

interface InventoryManagementProps {
  viewMode: 'grid' | 'list';
  searchTerm: string;
}

export function InventoryManagement({ viewMode, searchTerm }: InventoryManagementProps) {
  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('InventoryManagement');
  const { handleError } = useErrorHandler('InventoryManagement');

  // Fetch categories and products for brand extraction
  const { data: categoriesResponse } = useCategories({ type: 'shop' });
  const { data: productsResponse } = useProducts({ type: ['shop'] });
  
  const categoriesArray = categoriesResponse?.data || [];
  const productsArray = productsResponse?.data || [];

  // Extract brands
  const brands = useMemo(() => {
    if (!categoriesArray.length) return [];
    return extractBrands(categoriesArray, productsArray);
  }, [categoriesArray, productsArray]);
  const { showToast } = useToast();
  const updateProductMutation = useUpdateProduct();
  const adjustStockMutation = useAdjustStock();

  // State management
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category' | 'value' | 'movement'>('stock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStock, setFilterStock] = useState<string>('all');
  const [filterBrandId, setFilterBrandId] = useState<string>('all');

  // Process inventory data
  const inventoryData = useMemo(() => {
    if (productsArray.length === 0) return [];
    
    return productsArray.map(product => {
      const category = categoriesArray.find(cat => cat && cat.id === product?.categoryId);
      const currentStock = product.inventory || 0;
      const totalValue = currentStock * product.price;
      const isLowStock = currentStock < 10;
      const isOutOfStock = currentStock === 0;
      const isHighStock = currentStock > 100;
      const stockMovement = Math.floor(Math.random() * 20) - 10; // Mock movement data
      const lastRestocked = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const nextRestock = new Date(lastRestocked.getTime() + (Math.random() * 14 + 7) * 24 * 60 * 60 * 1000);
      
      return {
        ...product,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || '📦',
        currentStock,
        totalValue,
        isLowStock,
        isOutOfStock,
        isHighStock,
        stockMovement,
        lastRestocked: lastRestocked.toISOString(),
        nextRestock: nextRestock.toISOString(),
        daysUntilRestock: Math.ceil((nextRestock.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        turnoverRate: Math.random() * 5 + 0.5, // Mock turnover rate
        demandLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
      };
    });
  }, [productsArray, categoriesArray]);

  // Filter and sort inventory
  const filteredInventory = useMemo(() => {
    let filtered = inventoryData;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.sku?.toLowerCase().includes(term) ||
        item.categoryName.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.categoryId === filterCategory);
    }

    // Brand filter
    if (filterBrandId !== 'all' && categoriesArray.length > 0) {
      const brandProducts = filterProductsByBrands(filtered, [filterBrandId], categoriesArray);
      filtered = brandProducts;
    }

    // Stock filter
    if (filterStock !== 'all') {
      if (filterStock === 'low') {
        filtered = filtered.filter(item => item.isLowStock);
      } else if (filterStock === 'out') {
        filtered = filtered.filter(item => item.isOutOfStock);
      } else if (filterStock === 'high') {
        filtered = filtered.filter(item => item.isHighStock);
      }
    }

    // Sort inventory
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'stock':
          aValue = a.currentStock;
          bValue = b.currentStock;
          break;
        case 'category':
          aValue = a.categoryName;
          bValue = b.categoryName;
          break;
        case 'value':
          aValue = a.totalValue;
          bValue = b.totalValue;
          break;
        case 'movement':
          aValue = a.stockMovement;
          bValue = b.stockMovement;
          break;
        default:
          aValue = a.currentStock;
          bValue = b.currentStock;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [inventoryData, searchTerm, filterCategory, filterStock, filterBrandId, sortBy, sortOrder, categoriesArray]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalItems = filteredInventory.length;
    const totalStock = filteredInventory.reduce((sum, item) => sum + item.currentStock, 0);
    const totalValue = filteredInventory.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = filteredInventory.filter(item => item.isLowStock).length;
    const outOfStockItems = filteredInventory.filter(item => item.isOutOfStock).length;
    const highValueItems = filteredInventory.filter(item => item.totalValue > 1000).length;
    const averageStock = totalItems > 0 ? totalStock / totalItems : 0;
    const averageValue = totalItems > 0 ? totalValue / totalItems : 0;

    return {
      totalItems,
      totalStock,
      totalValue,
      lowStockItems,
      outOfStockItems,
      highValueItems,
      averageStock,
      averageValue
    };
  }, [filteredInventory]);

  // Handlers
  const handleItemSelect = useCallback((itemId: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredInventory.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  }, [filteredInventory]);

  const handleStockUpdate = useCallback(async (itemId: string, newStock: number) => {
    await measureAsync('stock_update', async () => {
      logger.logUserAction('stock_updated', { itemId, newStock });
      
      try {
        const product = inventoryData.find(item => item.id === itemId);
        if (!product) {
          throw new Error('Product not found');
        }

        const currentStock = product.currentStock || 0;
        const adjustment = newStock - currentStock;

        if (adjustment === 0) {
          return; // No change needed
        }

        // Use adjustStock for better tracking
        await adjustStockMutation.mutateAsync({
          productId: itemId,
          adjustment,
          reason: `Manual stock update from ${currentStock} to ${newStock}`,
          location: 'admin-dashboard'
        });

        showToast({
          type: 'success',
          title: 'Stock updated',
          message: `Stock updated from ${currentStock} to ${newStock}`
        });
      } catch (error) {
        handleError(error, { operation: 'stock_update', itemId, newStock });
        showToast({
          type: 'error',
          title: 'Failed to update stock',
          message: 'Could not update product stock. Please try again.'
        });
      }
    });
  }, [measureAsync, inventoryData, adjustStockMutation, showToast, handleError]);

  const handleBulkAction = useCallback(async (action: string) => {
    await measureAsync('bulk_action', async () => {
      logger.logUserAction('bulk_action', { action, itemIds: Array.from(selectedItems) });
      // Implement bulk actions
    });
  }, [selectedItems, measureAsync]);

  const getStockBadge = (item: any) => {
    if (item.isOutOfStock) {
      return <Badge variant="destructive" className="text-red-400">Out of Stock</Badge>;
    }
    if (item.isLowStock) {
      return <Badge variant="warning" className="text-yellow-400">Low Stock</Badge>;
    }
    if (item.isHighStock) {
      return <Badge variant="outline" className="text-blue-400">High Stock</Badge>;
    }
    return <Badge variant="success" className="text-green-400">In Stock</Badge>;
  };

  const getMovementIcon = (movement: number) => {
    if (movement > 0) return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (movement < 0) return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getDemandBadge = (demand: string) => {
    switch (demand) {
      case 'high':
        return <Badge variant="outline" className="text-red-400 border-red-400">High Demand</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Medium Demand</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-gray-400 border-gray-400">Low Demand</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400">Unknown</Badge>;
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="space-y-4">
        {/* Brand Inventory Cards */}
        {brands.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {brands.slice(0, 6).map(brand => {
              const stats = calculateBrandStats(brand, productsArray);
              const colors = getBrandColor(brand.name);
              
              return (
                <Card key={brand.id} className={`p-4 bg-gradient-to-br ${colors.primary} border ${colors.secondary}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-lg font-bold ${colors.accent}`}>{brand.name}</h3>
                    <Badge variant="outline" className={colors.badge}>
                      {brand.productCount} Produkte
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-black/20 rounded p-2">
                      <p className="text-xs text-muted-foreground">Lagerbestand</p>
                      <p className={`text-sm font-bold ${colors.accent}`}>{stats.totalStock}</p>
                    </div>
                    <div className="bg-black/20 rounded p-2">
                      <p className="text-xs text-muted-foreground">Ø Preis</p>
                      <p className={`text-sm font-bold ${colors.accent}`}>€{stats.averagePrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {stats.lowStockCount > 0 && (
                        <span className="text-orange-400">{stats.lowStockCount} niedrig</span>
                      )}
                      {stats.lowStockCount > 0 && stats.outOfStockCount > 0 && ' • '}
                      {stats.outOfStockCount > 0 && (
                        <span className="text-red-400">{stats.outOfStockCount} ausverkauft</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterBrandId(brand.id)}
                      className={filterBrandId === brand.id ? `bg-gradient-to-r ${colors.primary}` : ''}
                    >
                      Anzeigen
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-blue-400">{summaryMetrics.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-400 opacity-60" />
            </div>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-4 bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 hover:border-green-400/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
                  <p className="text-2xl font-bold text-green-400">{summaryMetrics.totalStock.toLocaleString()}</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <BarChart3 className="w-8 h-8 text-green-400 opacity-60" />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 hover:border-purple-400/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-purple-400">€{summaryMetrics.totalValue.toLocaleString()}</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Euro className="w-8 h-8 text-purple-400 opacity-60" />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="p-4 bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/30 hover:border-orange-400/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-400">{summaryMetrics.lowStockItems}</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AlertCircle className="w-8 h-8 text-orange-400 opacity-60" />
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
            >
              <option value="all">All Categories</option>
              {categoriesArray.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
          {brands.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Brand:</label>
              <select
                value={filterBrandId}
                onChange={(e) => setFilterBrandId(e.target.value)}
                className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
              >
                <option value="all">All Brands</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Stock Level:</label>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
              <option value="high">High Stock</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
            >
              <option value="stock">Stock Level</option>
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="value">Value</option>
              <option value="movement">Movement</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <Card className="p-4 bg-orange-900/20 border-orange-500/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleBulkAction('restock')}>
                  <Package className="w-4 h-4 mr-1" />
                  Restock
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('adjust')}>
                  <Edit className="w-4 h-4 mr-1" />
                  Adjust Stock
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                  <Copy className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredInventory.map((item) => (
            <Card key={item.id} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                    className="rounded border-white/20 bg-black/25"
                  />
                  <span className="text-2xl">{item.categoryIcon}</span>
                </div>
                <DropdownMenu>
                  {/* @ts-ignore - asChild is supported by DropdownMenuTrigger */}
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Adjust Stock
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    SKU: {item.sku || 'N/A'}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-neon">€{item.price}</span>
                  {getStockBadge(item)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-black/25 rounded p-2">
                    <div className="text-muted-foreground">Current Stock</div>
                    <InlineEdit
                      value={item.currentStock}
                      onSave={(newStock) => handleStockUpdate(item.id, typeof newStock === 'string' ? parseFloat(newStock) || 0 : newStock)}
                      type="number"
                      className="font-semibold text-neon"
                    />
                  </div>
                  <div className="bg-black/25 rounded p-2">
                    <div className="text-muted-foreground">Total Value</div>
                    <div className="font-semibold text-green-400">€{item.totalValue.toFixed(0)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {getMovementIcon(item.stockMovement)}
                    <span className="text-sm">
                      {item.stockMovement > 0 ? '+' : ''}{item.stockMovement}
                    </span>
                  </div>
                  {getDemandBadge(item.demandLevel)}
                </div>

                <div className="text-xs text-muted-foreground">
                  <div>Turnover: {item.turnoverRate.toFixed(1)}x/month</div>
                  <div>Last restocked: {new Date(item.lastRestocked).toLocaleDateString()}</div>
                  {item.daysUntilRestock > 0 && (
                    <div>Next restock in {item.daysUntilRestock} days</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredInventory.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No inventory items found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Item
            </Button>
          </Card>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold text-blue-400">{summaryMetrics.totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400 opacity-60" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
              <p className="text-2xl font-bold text-green-400">{summaryMetrics.totalStock.toLocaleString()}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-400 opacity-60" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-purple-400">€{summaryMetrics.totalValue.toLocaleString()}</p>
            </div>
            <Euro className="w-8 h-8 text-purple-400 opacity-60" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-orange-400">{summaryMetrics.lowStockItems}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-400 opacity-60" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
          >
              <option value="all">All Categories</option>
              {categoriesArray.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
          {brands.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Brand:</label>
              <select
                value={filterBrandId}
                onChange={(e) => setFilterBrandId(e.target.value)}
                className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
              >
                <option value="all">All Brands</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Stock Level:</label>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
          >
            <option value="all">All Stock Levels</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="high">High Stock</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
          >
            <option value="stock">Stock Level</option>
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="value">Value</option>
            <option value="movement">Movement</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredInventory.length && filteredInventory.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-white/20 bg-black/25"
                  />
                </TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead>Demand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id} className="hover:bg-white/5">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                      className="rounded border-white/20 bg-black/25"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.categoryIcon}</span>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {item.sku || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.categoryIcon}</span>
                      <span className="text-sm">{item.categoryName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-neon">€{item.price}</div>
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      value={item.currentStock}
                      onSave={(newStock) => handleStockUpdate(item.id, typeof newStock === 'string' ? parseFloat(newStock) || 0 : newStock)}
                      type="number"
                      className="font-semibold"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-400">€{item.totalValue.toFixed(0)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getMovementIcon(item.stockMovement)}
                      <span className="text-sm">
                        {item.stockMovement > 0 ? '+' : ''}{item.stockMovement}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getDemandBadge(item.demandLevel)}
                  </TableCell>
                  <TableCell>
                    {getStockBadge(item)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      {/* @ts-ignore - asChild is supported by DropdownMenuTrigger */}
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Adjust Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No inventory items found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Item
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}