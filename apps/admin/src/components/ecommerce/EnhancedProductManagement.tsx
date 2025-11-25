import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus, 
  Download, 
  Upload,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  Package,
  Zap,
  Crown,
  Lock,
  Globe
} from 'lucide-react';
import { AdminProductCard } from './AdminProductCard';
import { EnhancedImagePicker } from '../media/EnhancedImagePicker';
import { ProductImageGallery } from '../media/ProductImageGallery';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { logger } from '../../lib/logger';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  inventory: number;
  media: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
  badges?: string[];
  analytics?: {
    views: number;
    sales: number;
    conversion: number;
    trend: 'up' | 'down' | 'stable';
  };
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface EnhancedProductManagementProps {
  viewMode?: 'grid' | 'list';
  searchTerm?: string;
  className?: string;
}

export const EnhancedProductManagement = ({
  viewMode: initialViewMode = 'grid',
  searchTerm: initialSearchTerm = '',
  className
}: EnhancedProductManagementProps) => {
  const { handleError } = useErrorHandler('EnhancedProductManagement');
  const { measureAsync } = usePerformanceMonitor('EnhancedProductManagement');

  // State Management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('products');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Mock Data - In production, this would come from API
  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Nebula Pro Headphones',
      description: 'Premium wireless headphones with active noise cancellation',
      price: 299.99,
      currency: '€',
      status: 'active',
      inventory: 45,
      media: [
        { id: '1', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', alt: 'Nebula Pro Headphones' }
      ],
      badges: ['BESTSELLER', 'NEW'],
      analytics: {
        views: 1250,
        sales: 89,
        conversion: 7.1,
        trend: 'up'
      },
      category: 'Audio',
      tags: ['wireless', 'noise-cancelling', 'premium'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      name: 'Quantum Smartwatch',
      description: 'Advanced fitness tracking with health monitoring',
      price: 199.99,
      currency: '€',
      status: 'active',
      inventory: 8,
      media: [
        { id: '2', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', alt: 'Quantum Smartwatch' }
      ],
      badges: ['LIMITED'],
      analytics: {
        views: 890,
        sales: 67,
        conversion: 7.5,
        trend: 'up'
      },
      category: 'Wearables',
      tags: ['fitness', 'smartwatch', 'health'],
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-18T16:45:00Z'
    },
    {
      id: '3',
      name: 'Cosmic Gaming Mouse',
      description: 'High-precision gaming mouse with RGB lighting',
      price: 79.99,
      currency: '€',
      status: 'draft',
      inventory: 0,
      media: [
        { id: '3', url: 'https://images.unsplash.com/photo-1527864550417-7f91c4c4b7c0?w=800', alt: 'Cosmic Gaming Mouse' }
      ],
      badges: ['COMING SOON'],
      analytics: {
        views: 450,
        sales: 0,
        conversion: 0,
        trend: 'stable'
      },
      category: 'Gaming',
      tags: ['gaming', 'mouse', 'rgb'],
      createdAt: '2024-01-05T11:00:00Z',
      updatedAt: '2024-01-12T13:20:00Z'
    }
  ]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.status === 'active').length;
    const lowStock = products.filter(p => p.inventory <= 10 && p.inventory > 0).length;
    const outOfStock = products.filter(p => p.inventory === 0).length;
    const totalViews = products.reduce((sum, p) => sum + (p.analytics?.views || 0), 0);
    const totalSales = products.reduce((sum, p) => sum + (p.analytics?.sales || 0), 0);

    return {
      total,
      active,
      lowStock,
      outOfStock,
      totalViews,
      totalSales
    };
  }, [products]);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  const handleProductSelect = useCallback((productId: string, selected: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  }, [selectedProducts.size, filteredProducts]);

  const handleProductEdit = useCallback((product: Product) => {
    logger.info('Edit product:', product.id);
    // Open edit modal or navigate to edit page
  }, []);

  const handleProductDelete = useCallback((productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    logger.info('Deleted product:', productId);
  }, []);

  const handleProductView = useCallback((product: Product) => {
    logger.info('View product:', product.id);
    // Open product preview modal
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await measureAsync(async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
    } catch (error) {
      handleError(error, { operation: 'refresh_products' });
    } finally {
      setIsRefreshing(false);
    }
  }, [measureAsync, handleError]);

  const handleBulkAction = useCallback((action: string) => {
    if (selectedProducts.size === 0) return;

    switch (action) {
      case 'delete':
        setProducts(prev => prev.filter(p => !selectedProducts.has(p.id)));
        setSelectedProducts(new Set());
        break;
      case 'activate':
        setProducts(prev => prev.map(p => 
          selectedProducts.has(p.id) ? { ...p, status: 'active' as const } : p
        ));
        setSelectedProducts(new Set());
        break;
      case 'deactivate':
        setProducts(prev => prev.map(p => 
          selectedProducts.has(p.id) ? { ...p, status: 'inactive' as const } : p
        ));
        setSelectedProducts(new Set());
        break;
    }
    
    logger.info(`Bulk action ${action} on ${selectedProducts.size} products`);
  }, [selectedProducts]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Product Management</h2>
          <p className="text-muted-foreground">
            Manage your product catalog with enhanced image support
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button className="bg-accent text-black hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Products</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.lowStock}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.outOfStock}</p>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
              <p className="text-xs text-muted-foreground">Total Sales</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-white/20 p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => handleViewModeChange('grid')}
              className="px-3"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => handleViewModeChange('list')}
              className="px-3"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedProducts.size} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('activate')}
            >
              Activate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('deactivate')}
            >
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction('delete')}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Select All */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
          onChange={handleSelectAll}
          className="rounded border-white/20"
        />
        <span className="text-sm text-muted-foreground">
          Select all ({filteredProducts.length} products)
        </span>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="relative">
              <input
                type="checkbox"
                checked={selectedProducts.has(product.id)}
                onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                className="absolute top-3 left-3 z-10 rounded border-white/20"
              />
              <AdminProductCard
                product={product}
                viewMode={viewMode}
                onEdit={handleProductEdit}
                onDelete={handleProductDelete}
                onView={handleProductView}
                showAnalytics={true}
                showStock={true}
                enableQuickActions={true}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="relative">
              <input
                type="checkbox"
                checked={selectedProducts.has(product.id)}
                onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                className="absolute top-4 left-4 z-10 rounded border-white/20"
              />
              <AdminProductCard
                product={product}
                viewMode={viewMode}
                onEdit={handleProductEdit}
                onDelete={handleProductDelete}
                onView={handleProductView}
                showAnalytics={true}
                showStock={true}
                enableQuickActions={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2 text-white">No products found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first product'}
          </p>
          <Button className="bg-accent text-black hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Card>
      )}
    </div>
  );
};

// Import missing components
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';





