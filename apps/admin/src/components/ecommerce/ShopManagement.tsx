import React, { useState, useCallback, Suspense, lazy, useMemo, memo, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Package, 
  ShoppingBag, 
  Search, 
  Grid3X3,
  List,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { ProductManagement } from './ProductManagement';
import { CategoryManagement } from './CategoryManagement';
import { InventoryManagement } from './InventoryManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { CategoryHierarchyManager } from './CategoryHierarchyManager';
import { AutoProductGenerator } from './AutoProductGenerator';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { logger } from '../../lib/logger';
import { TabErrorBoundary } from './TabErrorBoundary';
import { SkeletonCard } from '../ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { cn } from '../../utils/cn';
import { ErrorCategory, ErrorSeverity } from '../../lib/error/ErrorManager';
import { useProducts, useCategories, useDashboardMetrics, useLowStockItems } from '../../lib/api/shopHooks';
import { useQueryClient } from '@tanstack/react-query';
import { ShippingConfigForm } from './ShippingConfigForm';
import { Truck, Layers, Tag } from 'lucide-react';
import { useRealtimeShop } from '../../lib/realtime/hooks/useRealtimeShop';
import { useAutoSync } from '../../lib/hooks/useAutoSync';
import { useToast } from '../ui/Toast';
import { setupSneakerHierarchy, type SetupProgress } from '../../lib/utils/mainCategoriesSetup';
import { useCreateCategory } from '../../lib/api/shopHooks';
import { extractBrands, calculateBrandStats, type Brand } from '../../lib/utils/brandUtils';
import { BrandManagement } from './BrandManagement';
import { CategoryEditor } from './CategoryEditor';
// New modular components
import { ShopHeader } from './ShopHeader';
import { ShopQuickActions } from './ShopQuickActions';
import { ShopHierarchyStats } from './ShopHierarchyStats';
import { ShopQuickStats } from './ShopQuickStats';
import { ShopTopCategories } from './ShopTopCategories';
import { ShopLowStockAlerts } from './ShopLowStockAlerts';
import { ShopBrandOverview } from './ShopBrandOverview';

// Lazy load heavy components for better performance - with error handling
const ProductPerformanceLive = lazy(() => 
  import('./ProductPerformanceLive')
    .then(m => ({ default: m.ProductPerformanceLive }))
    .catch(() => {
      return { default: React.memo(() => <div className="p-4 text-muted-foreground">ProductPerformanceLive konnte nicht geladen werden</div>) };
    })
);
const ProductStockLive = lazy(() => 
  import('./ProductStockLive')
    .then(m => ({ default: m.ProductStockLive }))
    .catch(() => {
      return { default: React.memo(() => <div className="p-4 text-muted-foreground">ProductStockLive konnte nicht geladen werden</div>) };
    })
);
const CategoryAnalyticsLive = lazy(() => 
  import('./CategoryAnalyticsLive')
    .then(m => ({ default: m.CategoryAnalyticsLive }))
    .catch(() => {
      return { default: React.memo(() => <div className="p-4 text-muted-foreground">CategoryAnalyticsLive konnte nicht geladen werden</div>) };
    })
);
const CategoryOrganizer = lazy(() => 
  import('./CategoryOrganizer')
    .then(m => ({ default: m.CategoryOrganizer }))
    .catch(() => {
      return { default: React.memo(() => <div className="p-4 text-muted-foreground">CategoryOrganizer konnte nicht geladen werden</div>) };
    })
);
const InventoryDashboardLive = lazy(() => 
  import('./InventoryDashboardLive')
    .then(m => ({ default: m.InventoryDashboardLive }))
    .catch(() => {
      return { default: React.memo(() => <div className="p-4 text-muted-foreground">InventoryDashboardLive konnte nicht geladen werden</div>) };
    })
);
const StockAutomation = lazy(() => 
  import('./StockAutomation')
    .then(m => ({ default: m.StockAutomation }))
    .catch(err => {
      logger.error('Failed to load lazy component', { component: 'StockAutomation', error: err });
      return { default: () => <div className="p-4 text-muted-foreground">StockAutomation konnte nicht geladen werden</div> };
    })
);
const MultiLocationInventory = lazy(() => 
  import('./MultiLocationInventory')
    .then(m => ({ default: m.MultiLocationInventory }))
    .catch(err => {
      logger.error('Failed to load lazy component', { component: 'MultiLocationInventory', error: err });
      return { default: () => <div className="p-4 text-muted-foreground">MultiLocationInventory konnte nicht geladen werden</div> };
    })
);
const SalesAnalyticsLive = lazy(() => 
  import('./SalesAnalyticsLive')
    .then(m => ({ default: m.SalesAnalyticsLive }))
    .catch(err => {
      logger.error('Failed to load lazy component', { component: 'SalesAnalyticsLive', error: err });
      return { default: () => <div className="p-4 text-muted-foreground">SalesAnalyticsLive konnte nicht geladen werden</div> };
    })
);
const PredictiveAnalytics = lazy(() => 
  import('./PredictiveAnalytics')
    .then(m => ({ default: m.PredictiveAnalytics }))
    .catch(err => {
      logger.error('Failed to load lazy component', { component: 'PredictiveAnalytics', error: err });
      return { default: () => <div className="p-4 text-muted-foreground">PredictiveAnalytics konnte nicht geladen werden</div> };
    })
);
const CustomerInsightsLive = lazy(() => 
  import('./CustomerInsightsLive')
    .then(m => ({ default: m.CustomerInsightsLive }))
    .catch(err => {
      logger.error('Failed to load lazy component', { component: 'CustomerInsightsLive', error: err });
      return { default: () => <div className="p-4 text-muted-foreground">CustomerInsightsLive konnte nicht geladen werden</div> };
    })
);

// QuickStatCard moved to ShopQuickStats.tsx

// Shop Shipping Config Tab Component
function ShopShippingConfigTab() {
  const { data: productsResponse } = useProducts({ limit: 100 });
  const products = productsResponse?.data || [];
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(
    products.length > 0 ? products[0]?.id : null
  );
  const queryClient = useQueryClient();

  const selectedProduct = Array.isArray(products) && products.length > 0
    ? products.find((p: any) => p && p.id === selectedProductId)
    : null;

  const handleSaveShipping = async (updatedOptions: any[]) => {
    if (!selectedProduct) return;
    
    try {
      const { productsApi } = await import('../../lib/api/ecommerce');
      await productsApi.updateProduct(selectedProduct.id, {
        // shippingOptions is not part of Product interface, using metadata or custom fields if needed
      } as any);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      logger.error('Error updating shipping config', error);
    }
  };

  React.useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0]?.id);
    }
  }, [products, selectedProductId]);

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p>Keine Produkte verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Produkt auswählen
        </label>
        <select
          value={selectedProductId || ''}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full px-3 py-2 bg-black/25 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {products.map((product: any) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {/* Shipping Config Form */}
      {selectedProduct && (
        <ShippingConfigForm
          shippingOptions={(selectedProduct as any).shippingOptions || []}
          onSave={handleSaveShipping}
          type="shop"
        />
      )}
    </div>
  );
}

export const ShopManagement = memo(() => {
  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('ShopManagement');
  const { handleError } = useErrorHandler('ShopManagement');
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState<string>('products');
  
  // Preload components on tab hover - Enhanced with more components
  const preloadComponent = useCallback((componentName: string) => {
    // Preload lazy components when hovering over tabs
    switch (componentName) {
      case 'analytics':
        import('./AnalyticsDashboard').catch(() => {});
        import('./SalesAnalyticsLive').catch(() => {});
        import('./PredictiveAnalytics').catch(() => {});
        break;
      case 'inventory':
        import('./InventoryManagement').catch(() => {});
        import('./InventoryDashboardLive').catch(() => {});
        import('./StockAutomation').catch(() => {});
        break;
      case 'categories':
        import('./CategoryManagement').catch(() => {});
        import('./CategoryOrganizer').catch(() => {});
        import('./CategoryAnalyticsLive').catch(() => {});
        break;
      case 'hierarchy':
        import('./CategoryHierarchyManager').catch(() => {});
        import('./AutoProductGenerator').catch(() => {});
        break;
      case 'products':
        import('./ProductPerformanceLive').catch(() => {});
        import('./ProductStockLive').catch(() => {});
        break;
      default:
        break;
    }
  }, []);
  
  // Handle tab change with transition
  const handleTabChange = useCallback((value: string) => {
    startTransition(() => {
      setActiveTab(value);
    });
  }, [startTransition]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [shopSearchTerm, setShopSearchTerm] = useState('');
  const debouncedShopSearchTerm = useDebounce(shopSearchTerm, 200); // Optimized from 300ms to 200ms
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingUpSneaker, setIsSettingUpSneaker] = useState(false);
  const [sneakerSetupProgress, setSneakerSetupProgress] = useState<SetupProgress | null>(null);
  const [showBulkImporter, setShowBulkImporter] = useState(false);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [categoryEditorParentId, setCategoryEditorParentId] = useState<string | undefined>(undefined);
  const [categoryEditorMode, setCategoryEditorMode] = useState<'create' | 'edit'>('create');
  const [categoryToEdit, setCategoryToEdit] = useState<any>(undefined);
  
  const createCategoryMutation = useCreateCategory();

  // Real-time WebSocket integration for live updates
  const { isConnected: isRealtimeConnected } = useRealtimeShop({
    enabled: true,
    onProductCreated: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onProductUpdated: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onProductDeleted: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onProductStockChanged: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onProductPriceChanged: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onProductStatusChanged: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onCategoryCreated: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onCategoryUpdated: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onCategoryDeleted: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onLowStock: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onStockAdjusted: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Auto-sync frontend data to backend on first load
  const { isSyncing: isAutoSyncing, syncStatus } = useAutoSync({
    enabled: true,
    autoFillEmptyCategories: true,
    onSyncComplete: (result) => {
      logger.info('Auto-sync completed', result);
      // Batch invalidate queries together for better performance
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
      ]).catch(err => logger.error('Failed to invalidate queries after sync', { error: err }));
      showToast({
        type: 'success',
        title: 'Synchronisation abgeschlossen',
        message: `${result.categories.created + result.products.created} neue Items synchronisiert`,
        duration: 4000,
      });
    },
    onSyncError: (error) => {
      logger.error('Auto-sync failed', { error });
      showToast({
        type: 'error',
        title: 'Synchronisation fehlgeschlagen',
        message: error.message || 'Bitte versuche es später erneut',
        duration: 5000,
      });
    },
    onAutoFillComplete: (result) => {
      if (result.filled > 0) {
        showToast({
          type: 'success',
          title: 'Produkte generiert',
          message: `${result.filled} Produkte für leere Kategorien erstellt`,
          duration: 4000,
        });
      }
    },
  });

  // Fetch real stats for Quick Stats - no limit to get all products
  const { data: productsData, isLoading: productsLoading } = useProducts(); // Get all products without limit
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({ type: 'shop' });
  const { data: dashboardMetrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: lowStockData, isLoading: lowStockLoading } = useLowStockItems(20);
  
  // Calculate low stock count outside useMemo for use in JSX
  const lowStockCount = dashboardMetrics?.lowStockItems || lowStockData?.length || 0;
  
  // Extract products array - handle both response formats with validation
  const productsArray = useMemo(() => {
    if (!productsData) return [];
    // Handle both { data: [...] } and direct array formats
    let products: any[] = [];
    if (Array.isArray(productsData)) {
      products = productsData;
    } else if (productsData.data && Array.isArray(productsData.data)) {
      products = productsData.data;
    }
    
    // Validate products - filter out invalid entries
    return products.filter((p: any) => {
      if (!p || typeof p !== 'object') return false;
      if (!p.id || !p.name) return false;
      if (typeof p.price !== 'number' || p.price < 0) return false;
      return true;
    });
  }, [productsData]);
  
  // Extract categories array with validation
  const categoriesArray = useMemo(() => {
    if (!categoriesData) return [];
    // Handle both array and object with data property
    let categories: any[] = [];
    if (Array.isArray(categoriesData)) {
      categories = categoriesData;
    } else if (categoriesData.data && Array.isArray(categoriesData.data)) {
      categories = categoriesData.data;
    }
    
    // Validate categories - filter out invalid entries
    return categories.filter((c: any) => {
      if (!c || typeof c !== 'object') return false;
      if (!c.id || !c.name) return false;
      return true;
    });
  }, [categoriesData]);

  // Extract brands
  const brands = useMemo(() => {
    if (categoriesLoading || !categoriesArray.length) return [];
    return extractBrands(categoriesArray, productsArray);
  }, [categoriesArray, productsArray, categoriesLoading]);

  // Calculate brand stats
  const brandStatsMap = useMemo(() => {
    const statsMap = new Map();
    brands.forEach(brand => {
      const stats = calculateBrandStats(brand, productsArray);
      statsMap.set(brand.id, stats);
    });
    return statsMap;
  }, [brands, productsArray]);

  // Top brands by revenue
  const topBrandsByRevenue = useMemo(() => {
    return [...brands]
      .map(brand => ({
        brand,
        stats: brandStatsMap.get(brand.id)
      }))
      .filter(item => item.stats)
      .sort((a, b) => (b.stats?.totalRevenue || 0) - (a.stats?.totalRevenue || 0))
      .slice(0, 6);
  }, [brands, brandStatsMap]);

  // Top brands by products
  const topBrandsByProducts = useMemo(() => {
    return [...brands]
      .map(brand => ({
        brand,
        stats: brandStatsMap.get(brand.id)
      }))
      .filter(item => item.stats)
      .sort((a, b) => (b.stats?.totalProducts || 0) - (a.stats?.totalProducts || 0))
      .slice(0, 6);
  }, [brands, brandStatsMap]);

  // Hierarchie-Statistiken berechnen
  const hierarchyStats = useMemo(() => {
    const stats = {
      level0: 0, // Hauptkategorien
      level1: 0, // Marken
      level2: 0, // Modelle
      level3Plus: 0,
      totalCategories: categoriesArray.length,
      sneakerBrands: 0,
      sneakerModels: 0,
      completeness: 0
    };
    
    // Berechne Level für jede Kategorie
    const getCategoryLevel = (cat: any): number => {
      if (!cat.parentId) return 0;
      
      let level = 0;
      let currentParentId: string | undefined = cat.parentId;
      const visited = new Set<string>();
      
      while (currentParentId) {
        if (visited.has(currentParentId)) return -1;
        visited.add(currentParentId);
        
        const parent = categoriesArray.find((c: any) => c.id === currentParentId);
        if (!parent) break;
        
        level++;
        currentParentId = parent.parentId;
        if (level > 10) break;
      }
      
      return level;
    };
    
    categoriesArray.forEach((cat: any) => {
      const level = getCategoryLevel(cat);
      if (level === 0) stats.level0++;
      else if (level === 1) stats.level1++;
      else if (level === 2) stats.level2++;
      else if (level >= 3) stats.level3Plus++;
      
      // SNEAKER-spezifische Stats
      const sneakerCategory = categoriesArray.find((c: any) => c.slug === 'sneaker' || c.name === 'SNEAKER');
      if (sneakerCategory && cat.parentId === sneakerCategory.id) {
        stats.sneakerBrands++;
      }
      if (sneakerCategory) {
        const brand = categoriesArray.find((c: any) => c.id === cat.parentId);
        if (brand && brand.parentId === sneakerCategory.id) {
          stats.sneakerModels++;
        }
      }
    });
    
    // Vollständigkeits-Berechnung für SNEAKER Hierarchie
    const expectedBrands = 6; // NIKE, AIR JORDAN, NOCTA, MAISON MARGIELA, CHANEL, LV
    const expectedModels = 23; // Alle Modelle zusammen
    const brandCompleteness = Math.min(100, (stats.sneakerBrands / expectedBrands) * 100);
    const modelCompleteness = Math.min(100, (stats.sneakerModels / expectedModels) * 100);
    stats.completeness = Math.round((brandCompleteness + modelCompleteness) / 2);
    
    return stats;
  }, [categoriesArray]);

  // Setup SNEAKER Hierarchie Handler
  const handleSetupSneakerHierarchy = useCallback(async () => {
    if (isSettingUpSneaker) return;
    
    setIsSettingUpSneaker(true);
    setSneakerSetupProgress(null);
    
    try {
      showToast({
        type: 'info',
        title: 'SNEAKER Hierarchie Setup gestartet',
        message: 'Erstelle Marken und Modelle...'
      });
      
      const result = await setupSneakerHierarchy(
        categoriesArray,
        async (category) => {
          const response = await createCategoryMutation.mutateAsync(category);
          return response.data;
        },
        (progress) => {
          setSneakerSetupProgress(progress);
        }
      );
      
      if (result.errors.length > 0) {
        showToast({
          type: 'warning',
          title: 'Setup mit Fehlern abgeschlossen',
          message: `${result.errors.length} Fehler aufgetreten. ${result.brands.length} Marken und ${result.models.length} Modelle erstellt.`,
          duration: 6000
        });
      } else {
        showToast({
          type: 'success',
          title: 'SNEAKER Hierarchie erfolgreich erstellt!',
          message: `${result.brands.length} Marken und ${result.models.length} Modelle erfolgreich erstellt. Die Hierarchie ist jetzt vollständig.`,
          duration: 5000
        });
      }
      
      // Refetch categories
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    } catch (error) {
      handleError(error, { operation: 'setup_sneaker_hierarchy' });
      showToast({
        type: 'error',
        title: 'Setup fehlgeschlagen',
        message: 'Beim Erstellen der SNEAKER Hierarchie ist ein Fehler aufgetreten. Bitte versuche es erneut.',
        duration: 6000
      });
    } finally {
      setIsSettingUpSneaker(false);
      setSneakerSetupProgress(null);
    }
  }, [categoriesArray, createCategoryMutation, showToast, handleError, queryClient, isSettingUpSneaker]);
  
  // Memoized Top Categories with product counts and analytics
  const topCategories = useMemo(() => {
    if (!categoriesArray.length || !productsArray.length) return [];
    
    return categoriesArray.slice(0, 5).map((category: any) => {
      const categoryProducts = productsArray.filter((p: any) => p.categoryId === category.id) || [];
      const productCount = categoryProducts.length;
      const totalRevenue = categoryProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
      const avgPrice = productCount > 0 ? totalRevenue / productCount : 0;
      
      return {
        ...category,
        productCount,
        totalRevenue,
        avgPrice
      };
    });
  }, [categoriesArray, productsArray]);
  
  // Memoized Quick Stats with real data and improved trends
  const quickStats = useMemo(() => {
    const totalProducts = productsData?.total || productsArray.length || 0;
    const totalCategories = categoriesArray.length || 0;
    
    // Calculate revenue from dashboard metrics (use monthRevenue as main metric)
    const revenue = dashboardMetrics?.monthRevenue || 0;
    const weekRevenue = dashboardMetrics?.weekRevenue || 0;
    const todayRevenue = dashboardMetrics?.todayRevenue || 0;
    
    // Calculate trend: compare week to month (simplified - would need historical data for real trend)
    const revenueTrend = weekRevenue > 0 && revenue > 0 
      ? ((weekRevenue / 7) / (revenue / 30)) * 100 - 100 // Weekly average vs monthly average
      : 0;
    
    // Calculate daily trend
    const dailyTrend = todayRevenue > 0 && weekRevenue > 0
      ? ((todayRevenue / (weekRevenue / 7)) * 100 - 100)
      : 0;
    
    const revenueFormatted = revenue >= 1000 
      ? `€${(revenue / 1000).toFixed(1)}K` 
      : `€${revenue.toFixed(0)}`;
    
    // Calculate product count trend (simplified - would need historical data)
    // For now, show static or calculate from orders
    const productTrend = dashboardMetrics?.todayOrders || 0;
    const productTrendFormatted = productTrend > 0 
      ? `${productTrend} heute` 
      : 'Keine heute';
    
    // Calculate category trend (categories with products vs total)
    const categoriesWithProducts = categoriesArray.filter(cat => {
      return productsArray.some(p => p.categoryId === cat.id);
    }).length;
    const categoryTrendValue = totalCategories > 0 
      ? `${categoriesWithProducts}/${totalCategories} mit Produkten`
      : 'Keine Kategorien';
    
    return {
      products: {
        value: totalProducts,
        isLoading: productsLoading,
        trend: { 
          value: productTrendFormatted, 
          color: productTrend > 0 ? 'text-green-400' : 'text-gray-400',
          icon: productTrend > 0 
            ? <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            : <Clock className="w-4 h-4 text-gray-400 mr-1" />,
          tooltip: `Gesamt: ${totalProducts} Produkte${productTrend > 0 ? `, ${productTrend} Bestellungen heute` : ''}`
        }
      },
      inventory: {
        value: lowStockCount,
        isLoading: lowStockLoading || metricsLoading,
        trend: { 
          value: `${lowStockCount} niedrig`, 
          color: lowStockCount > 0 ? 'text-yellow-400' : 'text-green-400',
          icon: lowStockCount > 0 ? <AlertCircle className="w-4 h-4 text-yellow-400 mr-1" /> : <CheckCircle className="w-4 h-4 text-green-400 mr-1" />,
          tooltip: lowStockCount > 0 
            ? `${lowStockCount} Produkte haben niedrigen Lagerbestand`
            : 'Alle Produkte haben ausreichend Lagerbestand'
        }
      },
      categories: {
        value: totalCategories,
        isLoading: categoriesLoading,
        trend: { 
          value: categoryTrendValue, 
          color: categoriesWithProducts === totalCategories && totalCategories > 0 ? 'text-green-400' : categoriesWithProducts > 0 ? 'text-yellow-400' : 'text-gray-400',
          icon: categoriesWithProducts === totalCategories && totalCategories > 0 
            ? <CheckCircle className="w-4 h-4 text-green-400 mr-1" /> 
            : categoriesWithProducts > 0 
            ? <AlertCircle className="w-4 h-4 text-yellow-400 mr-1" />
            : <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />,
          tooltip: `${categoriesWithProducts} von ${totalCategories} Kategorien haben Produkte`
        }
      },
      revenue: {
        value: revenueFormatted,
        isLoading: metricsLoading,
        trend: { 
          value: revenueTrend > 0 ? `+${revenueTrend.toFixed(1)}%` : revenueTrend < 0 ? `${revenueTrend.toFixed(1)}%` : 'Stabil', 
          color: revenueTrend > 5 ? 'text-green-400' : revenueTrend < -5 ? 'text-red-400' : 'text-gray-400',
          icon: revenueTrend > 5 
            ? <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            : revenueTrend < -5
              ? <TrendingUp className="w-4 h-4 text-red-400 mr-1 rotate-180" />
              : <Clock className="w-4 h-4 text-gray-400 mr-1" />,
          tooltip: `Monatsumsatz: ${revenueFormatted}${weekRevenue > 0 ? `, Woche: €${weekRevenue.toFixed(0)}` : ''}${dailyTrend !== 0 ? `, Trend: ${dailyTrend > 0 ? '+' : ''}${dailyTrend.toFixed(1)}%` : ''}`
        }
      }
    };
  }, [productsData, productsArray, categoriesArray, dashboardMetrics, lowStockData, productsLoading, categoriesLoading, metricsLoading, lowStockLoading, lowStockCount]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await measureAsync('refresh_data', async () => {
      // Batch invalidate all relevant queries together for better performance
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics'] }),
      ]);
      await new Promise(resolve => setTimeout(resolve, 500));
      logger.logUserAction('shop_data_refreshed');
    });
    setIsRefreshing(false);
  }, [measureAsync, queryClient]);

  const handleShopSearch = useCallback((term: string) => {
    startTransition(() => {
      setShopSearchTerm(term);
    });
    logger.logUserAction('shop_search', { term, area: 'shop' });
  }, [startTransition]);

  // Memoized handlers for category clicks
  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveTab('products');
    // Could trigger category filter in ProductManagement
  }, []);

  // Memoized handlers for low stock item clicks
  const handleLowStockItemClick = useCallback((itemId: string) => {
    setActiveTab('products');
    // Could focus on specific product
  }, []);

  // Memoized handlers for brand selection
  const handleBrandSelect = useCallback((brandId: string) => {
    setSelectedBrandIds([brandId]);
    setActiveTab('products');
  }, []);

  // Memoized handlers for brand filter change
  const handleBrandFilterChange = useCallback((brandIds: string[]) => {
    setSelectedBrandIds(brandIds);
  }, []);

  // Handler for opening category editor modal
  const handleAddSubcategory = useCallback((parentId: string) => {
    setCategoryEditorParentId(parentId);
    setCategoryEditorMode('create');
    setCategoryToEdit(undefined);
    setCategoryEditorOpen(true);
  }, []);

  // Handler for editing category
  const handleEditCategory = useCallback((category: any) => {
    setCategoryToEdit(category);
    setCategoryEditorParentId(category?.parentId);
    setCategoryEditorMode('edit');
    setCategoryEditorOpen(true);
  }, []);

  // Handler for closing category editor
  const handleCloseCategoryEditor = useCallback(() => {
    setCategoryEditorOpen(false);
    setCategoryEditorParentId(undefined);
    setCategoryToEdit(undefined);
    // Invalidate categories to refresh the list
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, [queryClient]);


  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
    logger.logUserAction('view_mode_changed', { mode });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ShopHeader
        isAutoSyncing={isAutoSyncing}
        isRealtimeConnected={isRealtimeConnected}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      {/* Quick Actions */}
      <ShopQuickActions
        showBulkImporter={showBulkImporter}
        isSettingUpSneaker={isSettingUpSneaker}
        sneakerSetupProgress={sneakerSetupProgress}
        onToggleBulkImporter={() => setShowBulkImporter(!showBulkImporter)}
        onSetupSneakerHierarchy={handleSetupSneakerHierarchy}
        onBulkImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          setShowBulkImporter(false);
        }}
      />

      {/* Hierarchie-Statistiken */}
      <ShopHierarchyStats hierarchyStats={hierarchyStats} />

      {/* Quick Stats */}
      <ShopQuickStats quickStats={quickStats} />

      {/* Top Categories & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ShopTopCategories
          categories={topCategories}
          totalCategories={categoriesArray.length}
          isLoading={categoriesLoading}
          onCategoryClick={handleCategoryClick}
        />
        <ShopLowStockAlerts
          items={lowStockData || []}
          count={lowStockCount}
          isLoading={lowStockLoading || metricsLoading}
          onItemClick={handleLowStockItemClick}
        />
      </div>

      {/* Brand Overview */}
      {brands.length > 0 && (
        <ShopBrandOverview
          brands={brands}
          brandStatsMap={brandStatsMap}
          topBrandsByRevenue={topBrandsByRevenue}
          topBrandsByProducts={topBrandsByProducts}
          selectedBrandIds={selectedBrandIds}
          onBrandSelect={handleBrandSelect}
          onBrandFilterChange={handleBrandFilterChange}
        />
      )}

      {/* Tabs Navigation - Enhanced */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-8 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-md border border-white/10 rounded-lg p-1 shadow-xl">
          <TabsTrigger 
            value="products"
            className={cn(
              "relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/30 data-[state=active]:to-cyan-500/30",
              "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/20",
              "data-[state=active]:border data-[state=active]:border-blue-400/50",
              "transition-all duration-300 hover:bg-white/5 rounded-md"
            )}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            <span className="font-medium">Produkte</span>
            {productsArray.length > 0 && (
              <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs bg-blue-500/20 border-blue-400/30">
                {productsArray.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="categories"
            className={cn(
              "relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/30 data-[state=active]:to-emerald-500/30",
              "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/20",
              "data-[state=active]:border data-[state=active]:border-green-400/50",
              "transition-all duration-300 hover:bg-white/5 rounded-md"
            )}
          >
            <Package className="w-4 h-4 mr-2" />
            <span className="font-medium">Kategorien</span>
            {categoriesArray.length > 0 && (
              <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs bg-green-500/20 border-green-400/30">
                {categoriesArray.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="brands"
            className={cn(
              "relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/30",
              "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20",
              "data-[state=active]:border data-[state=active]:border-purple-400/50",
              "transition-all duration-300 hover:bg-white/5 rounded-md"
            )}
          >
            <Tag className="w-4 h-4 mr-2" />
            <span className="font-medium">Brands</span>
            {brands.length > 0 && (
              <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs bg-purple-500/20 border-purple-400/30">
                {brands.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="hierarchy"
            className={cn(
              "relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/30 data-[state=active]:to-pink-500/30",
              "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/20",
              "data-[state=active]:border data-[state=active]:border-purple-400/50",
              "transition-all duration-300 hover:bg-white/5 rounded-md"
            )}
          >
            <Layers className="w-4 h-4 mr-2" />
            <span className="font-medium">Hierarchie</span>
            {hierarchyStats.sneakerBrands > 0 && (
              <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs bg-purple-500/20 border-purple-400/30">
                {hierarchyStats.sneakerBrands}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="inventory"
            className={cn(
              "relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/30 data-[state=active]:to-red-500/30",
              "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/20",
              "data-[state=active]:border data-[state=active]:border-orange-400/50",
              "transition-all duration-300 hover:bg-white/5 rounded-md"
            )}
          >
            <Package className="w-4 h-4 mr-2" />
            <span className="font-medium">Lagerbestand</span>
            {lowStockCount > 0 && (
              <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs bg-orange-500/20 border-orange-400/30 animate-pulse">
                {lowStockCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            className={cn(
              "relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/30 data-[state=active]:to-rose-500/30",
              "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-pink-500/20",
              "data-[state=active]:border data-[state=active]:border-pink-400/50",
              "transition-all duration-300 hover:bg-white/5 rounded-md"
            )}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="font-medium">Analytics</span>
          </TabsTrigger>
          <TabsTrigger 
            value="shipping"
            className={cn(
              "relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/30 data-[state=active]:to-blue-500/30",
              "data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/20",
              "data-[state=active]:border data-[state=active]:border-indigo-400/50",
              "transition-all duration-300 hover:bg-white/5 rounded-md"
            )}
          >
            <Truck className="w-4 h-4 mr-2" />
            <span className="font-medium">Versand</span>
          </TabsTrigger>
        </TabsList>

        {/* Products Tab - Enhanced */}
        <TabsContent value="products" className="mt-6">
            <Card className="p-6 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-black/40 backdrop-blur-sm border border-blue-500/30 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ShoppingBag className="w-8 h-8 text-blue-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Haupt Shop Management
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verwalte reguläre Shop-Produkte, Varianten und Preise
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-500/10 px-3 py-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {productsArray.length} Produkte
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="border-white/20 hover:bg-white/10"
                  >
                    {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Enhanced Shop Search */}
              <div className="mb-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Shop-Produkte durchsuchen... (Ctrl+F)"
                    value={shopSearchTerm}
                    onChange={(e) => handleShopSearch(e.target.value)}
                    className="w-full pl-12 pr-24 py-3 bg-black/40 border-2 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm text-white placeholder:text-white/40"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                    <kbd className="px-2 py-1 bg-black/50 rounded border border-white/20">Ctrl</kbd>
                    <span>+</span>
                    <kbd className="px-2 py-1 bg-black/50 rounded border border-white/20">K</kbd>
                  </div>
                </div>
              </div>

              <TabErrorBoundary 
                tabName="Shop"
                category={ErrorCategory.API}
                severity={ErrorSeverity.MEDIUM}
              >
                <ProductManagement viewMode={viewMode} searchTerm={debouncedShopSearchTerm} />
                
                <Suspense fallback={
                  <div className="space-y-4 mt-4">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                }>
                  <div className="mt-4 space-y-4">
                    <ProductPerformanceLive />
                    <ProductStockLive />
                  </div>
                </Suspense>
              </TabErrorBoundary>
            </Card>
          </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-black/40 backdrop-blur-sm border border-purple-500/30 shadow-2xl">
            <TabErrorBoundary 
              tabName="Brands"
              category={ErrorCategory.API}
              severity={ErrorSeverity.MEDIUM}
            >
              <BrandManagement
                onBrandSelect={(brandId) => {
                  setSelectedBrandIds([brandId]);
                  setActiveTab('products');
                }}
                onModelSelect={(modelId) => {
                  setSelectedModelId(modelId);
                  setActiveTab('products');
                }}
              />
            </TabErrorBoundary>
          </Card>
        </TabsContent>

        {/* Categories Tab - Enhanced */}
        <TabsContent value="categories" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-black/40 backdrop-blur-sm border border-green-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Package className="w-8 h-8 text-green-400" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    Kategorien
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Organisiere Shop-Produkte nach Kategorien und Hierarchien
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-green-400 border-green-400 bg-green-500/10 px-3 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {categoriesArray.length} Kategorien
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="border-white/20 hover:bg-white/10"
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <TabErrorBoundary 
              tabName="Kategorien"
              category={ErrorCategory.API}
              severity={ErrorSeverity.MEDIUM}
            >
              <CategoryManagement viewMode={viewMode} searchTerm={shopSearchTerm} />
              
              <Suspense fallback={
                <div className="space-y-4 mt-4">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              }>
                <div className="mt-4 space-y-4">
                  <CategoryOrganizer />
                  <CategoryAnalyticsLive />
                </div>
              </Suspense>
            </TabErrorBoundary>
          </Card>
        </TabsContent>

        {/* Hierarchy Tab - Enhanced */}
        <TabsContent value="hierarchy" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-black/40 backdrop-blur-sm border border-purple-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Layers className="w-8 h-8 text-purple-400" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    SNEAKER Hierarchie
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verwalte die 3-Level SNEAKER Hierarchie: Hauptkategorie → Marken → Modelle
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-500/10 px-3 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {hierarchyStats.completeness}% Vollständig
                </Badge>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSetupSneakerHierarchy}
                    disabled={isSettingUpSneaker}
                    className="border-purple-400/50 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSettingUpSneaker ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {sneakerSetupProgress ? (
                          <span>{sneakerSetupProgress.label}</span>
                        ) : (
                          <span>SNEAKER Setup läuft...</span>
                        )}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        SNEAKER Setup
                      </>
                    )}
                  </Button>
                  {/* Progress Bar */}
                  {isSettingUpSneaker && sneakerSetupProgress && sneakerSetupProgress.total > 0 && (
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(sneakerSetupProgress.current / sneakerSetupProgress.total) * 100}%` 
                        }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <TabErrorBoundary tabName="Hierarchie">
              <Suspense fallback={<SkeletonCard />}>
                <div className="space-y-6">
                  <CategoryHierarchyManager 
                    onCategorySelect={(categoryId) => {
                      handleTabChange('categories');
                    }}
                    onAddSubcategory={handleAddSubcategory}
                  />
                  <AutoProductGenerator 
                    onComplete={(products) => {
                      queryClient.invalidateQueries({ queryKey: ['products'] });
                      showToast({
                        type: 'success',
                        title: 'Produkte erstellt',
                        message: `${products.length} Produkt(e) erfolgreich erstellt`,
                        duration: 4000,
                      });
                    }}
                  />
                </div>
              </Suspense>
            </TabErrorBoundary>
          </Card>
        </TabsContent>
        
        {/* Shipping Tab - Enhanced */}
        <TabsContent value="shipping" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-indigo-900/30 via-blue-900/20 to-black/40 backdrop-blur-sm border border-indigo-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Truck className="w-8 h-8 text-indigo-400" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                    Versand-Konfiguration
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verwalte Versandoptionen, Preise und Regionen
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-indigo-400 border-indigo-400 bg-indigo-500/10 px-3 py-1">
                <CheckCircle className="w-3 h-3 mr-1" />
                Konfiguriert
              </Badge>
            </div>
            <TabErrorBoundary 
              tabName="Shipping"
              category={ErrorCategory.API}
              severity={ErrorSeverity.MEDIUM}
            >
              <ShopShippingConfigTab />
            </TabErrorBoundary>
          </Card>
        </TabsContent>

        {/* Analytics Tab - Enhanced */}
        <TabsContent value="analytics" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-pink-900/30 via-rose-900/20 to-black/40 backdrop-blur-sm border border-pink-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <BarChart3 className="w-8 h-8 text-pink-400" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                    Sales Analytics
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Umsatzanalyse, Bestseller und Performance-Metriken nach SNEAKER Hierarchie
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-pink-400 border-pink-400 bg-pink-500/10 px-3 py-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +18% Wachstum
              </Badge>
            </div>

            <TabErrorBoundary 
              tabName="Analytics"
              category={ErrorCategory.API}
              severity={ErrorSeverity.MEDIUM}
            >
              <Suspense fallback={
                <div className="space-y-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              }>
                <AnalyticsDashboard />
                <div className="mt-4 space-y-4">
                  <SalesAnalyticsLive />
                  <PredictiveAnalytics />
                  <CustomerInsightsLive />
                </div>
              </Suspense>
            </TabErrorBoundary>
          </Card>
        </TabsContent>

        {/* Inventory Tab - Enhanced */}
        <TabsContent value="inventory" className="mt-6">
          <Card className="p-6 bg-gradient-to-br from-orange-900/30 via-red-900/20 to-black/40 backdrop-blur-sm border border-orange-500/30 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Package className="w-8 h-8 text-orange-400" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    Lagerbestand
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verfolge Lagerbestände nach SNEAKER Marken/Modellen, Analytics und Low-Stock-Alerts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`${lowStockCount > 0 ? 'text-orange-400 border-orange-400 bg-orange-500/10' : 'text-green-400 border-green-400 bg-green-500/10'} px-3 py-1 animate-pulse`}>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {lowStockCount} Niedrig
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="border-white/20 hover:bg-white/10"
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <TabErrorBoundary 
              tabName="Lagerbestand"
              category={ErrorCategory.API}
              severity={ErrorSeverity.MEDIUM}
            >
              <InventoryManagement viewMode={viewMode} searchTerm={shopSearchTerm} />
              
              <Suspense fallback={
                <div className="space-y-4 mt-4">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              }>
                <div className="mt-4 space-y-4">
                  <InventoryDashboardLive />
                  <StockAutomation />
                  <MultiLocationInventory />
                </div>
              </Suspense>
            </TabErrorBoundary>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Editor Modal */}
      <CategoryEditor
        open={categoryEditorOpen}
        onClose={handleCloseCategoryEditor}
        category={categoryToEdit}
        parentId={categoryEditorParentId}
        mode={categoryEditorMode}
      />
    </div>
  );
});
ShopManagement.displayName = 'ShopManagement';
