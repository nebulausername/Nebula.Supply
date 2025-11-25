import React, { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import {
  Package,
  TrendingUp,
  DollarSign,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Layers,
  Tag,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';
import { useCategories, useProducts } from '../../lib/api/shopHooks';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { useToast } from '../ui/Toast';
import {
  extractBrands,
  calculateBrandStats,
  getBrandColor,
  searchBrands,
  sortBrands,
  type Brand,
  type BrandStats,
  type Model
} from '../../lib/utils/brandUtils';
import { cn } from '../../utils/cn';
import { SkeletonCard } from '../ui/Skeleton';

interface BrandManagementProps {
  onBrandSelect?: (brandId: string) => void;
  onModelSelect?: (modelId: string) => void;
}

export const BrandManagement = memo(({ onBrandSelect, onModelSelect }: BrandManagementProps) => {
  const { measureAsync } = usePerformanceMonitor('BrandManagement');
  const { handleError } = useErrorHandler('BrandManagement');
  const { showToast } = useToast();

  // State
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'products' | 'revenue' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');

  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  // Data fetching
  const { data: categoriesResponse, isLoading: categoriesLoading } = useCategories({
    type: 'shop',
    limit: 1000
  });
  const { data: productsResponse, isLoading: productsLoading } = useProducts({
    type: ['shop'],
    limit: 1000
  });

  const categories = categoriesResponse?.data || [];
  const products = productsResponse?.data || [];

  // Extract brands
  const brands = useMemo(() => {
    if (categoriesLoading || !categories.length) return [];
    return extractBrands(categories, products);
  }, [categories, products, categoriesLoading]);

  // Filter and sort brands
  const filteredBrands = useMemo(() => {
    let filtered = searchBrands(brands, debouncedSearchTerm);
    filtered = sortBrands(filtered, sortBy, sortOrder);
    return filtered;
  }, [brands, debouncedSearchTerm, sortBy, sortOrder]);

  // Calculate brand stats
  const brandStatsMap = useMemo(() => {
    const statsMap = new Map<string, BrandStats>();
    brands.forEach(brand => {
      statsMap.set(brand.id, calculateBrandStats(brand, products));
    });
    return statsMap;
  }, [brands, products]);

  // Selected brand
  const selectedBrand = useMemo(() => {
    if (!selectedBrandId) return null;
    return brands.find(b => b.id === selectedBrandId) || null;
  }, [brands, selectedBrandId]);

  const selectedBrandStats = useMemo(() => {
    if (!selectedBrandId) return null;
    return brandStatsMap.get(selectedBrandId) || null;
  }, [selectedBrandId, brandStatsMap]);

  // Handlers
  const handleBrandClick = useCallback((brand: Brand) => {
    setSelectedBrandId(brand.id);
    setViewMode('detail');
    onBrandSelect?.(brand.id);
  }, [onBrandSelect]);

  const handleBackToOverview = useCallback(() => {
    setSelectedBrandId(null);
    setViewMode('overview');
  }, []);

  const handleModelClick = useCallback((model: Model) => {
    onModelSelect?.(model.id);
  }, [onModelSelect]);

  const handleExportBrandStats = useCallback(async (brand: Brand) => {
    await measureAsync('export_brand_stats', async () => {
      const stats = brandStatsMap.get(brand.id);
      if (!stats) return;

      const data = {
        brand: brand.name,
        totalProducts: stats.totalProducts,
        totalRevenue: stats.totalRevenue,
        averagePrice: stats.averagePrice,
        totalStock: stats.totalStock,
        lowStockCount: stats.lowStockCount,
        outOfStockCount: stats.outOfStockCount,
        topModels: stats.topModels.map(tm => ({
          name: tm.model.name,
          productCount: tm.productCount
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${brand.name}-stats.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'Statistiken exportiert',
        message: `Brand-Statistiken für ${brand.name} wurden exportiert.`
      });
    });
  }, [brandStatsMap, measureAsync, showToast]);

  // Loading state
  if (categoriesLoading || productsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Detail view
  if (viewMode === 'detail' && selectedBrand && selectedBrandStats) {
    const colors = getBrandColor(selectedBrand.name);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToOverview}
              className="hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück zur Übersicht
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedBrand.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedBrand.category.description || 'Brand Details'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportBrandStats(selectedBrand)}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportieren
            </Button>
          </div>
        </div>

        {/* Brand Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`p-4 bg-gradient-to-br ${colors.primary} border ${colors.secondary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produkte</p>
                <p className={`text-2xl font-bold ${colors.accent}`}>{selectedBrandStats.totalProducts}</p>
              </div>
              <Package className={`w-8 h-8 ${colors.accent} opacity-60`} />
            </div>
          </Card>

          <Card className={`p-4 bg-gradient-to-br ${colors.primary} border ${colors.secondary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gesamtumsatz</p>
                <p className={`text-2xl font-bold ${colors.accent}`}>€{selectedBrandStats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className={`w-8 h-8 ${colors.accent} opacity-60`} />
            </div>
          </Card>

          <Card className={`p-4 bg-gradient-to-br ${colors.primary} border ${colors.secondary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Durchschnittspreis</p>
                <p className={`text-2xl font-bold ${colors.accent}`}>€{selectedBrandStats.averagePrice.toFixed(2)}</p>
              </div>
              <TrendingUp className={`w-8 h-8 ${colors.accent} opacity-60`} />
            </div>
          </Card>

          <Card className={`p-4 bg-gradient-to-br ${colors.primary} border ${colors.secondary}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lagerbestand</p>
                <p className={`text-2xl font-bold ${colors.accent}`}>{selectedBrandStats.totalStock}</p>
              </div>
              <BarChart3 className={`w-8 h-8 ${colors.accent} opacity-60`} />
            </div>
          </Card>
        </div>

        {/* Stock Alerts */}
        {(selectedBrandStats.lowStockCount > 0 || selectedBrandStats.outOfStockCount > 0) && (
          <Card className="p-4 bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-sm font-semibold text-white">Lagerbestand-Warnungen</p>
                <p className="text-xs text-muted-foreground">
                  {selectedBrandStats.lowStockCount > 0 && `${selectedBrandStats.lowStockCount} Produkte mit niedrigem Bestand`}
                  {selectedBrandStats.lowStockCount > 0 && selectedBrandStats.outOfStockCount > 0 && ' • '}
                  {selectedBrandStats.outOfStockCount > 0 && `${selectedBrandStats.outOfStockCount} Produkte ausverkauft`}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Top Models */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Top Modelle</h3>
            <Badge variant="outline" className={colors.badge}>
              {selectedBrand.models.length} Modelle
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedBrandStats.topModels.map(({ model, productCount }) => (
              <Card
                key={model.id}
                className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                interactive
                onClick={() => handleModelClick(model)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white">{model.name}</h4>
                  <Tag className={`w-4 h-4 ${colors.accent}`} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Produkte:</span>
                    <span className="font-semibold text-white">{productCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Durchschnittspreis:</span>
                    <span className="font-semibold text-white">€{model.averagePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lagerbestand:</span>
                    <span className="font-semibold text-white">{model.totalStock}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* All Models */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Alle Modelle</h3>
            <Badge variant="outline" className={colors.badge}>
              {selectedBrand.models.length} Gesamt
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {selectedBrand.models.map(model => (
              <Card
                key={model.id}
                className="p-3 hover:bg-white/5 transition-colors cursor-pointer"
                interactive
                onClick={() => handleModelClick(model)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-white">{model.name}</p>
                    <p className="text-xs text-muted-foreground">{model.productCount} Produkte</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // Overview view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Brand Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Verwalte alle Brands, Modelle und Statistiken
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Brands durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-white">Sortieren nach:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm text-white"
            >
              <option value="name">Name</option>
              <option value="products">Produkte</option>
              <option value="revenue">Umsatz</option>
              <option value="stock">Lagerbestand</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Brand Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredBrands.map((brand) => {
            const stats = brandStatsMap.get(brand.id);
            const colors = getBrandColor(brand.name);

            return (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`p-6 bg-gradient-to-br ${colors.primary} border ${colors.secondary} hover:border-${colors.accent}/50 transition-all cursor-pointer`}
                  interactive
                  onClick={() => handleBrandClick(brand)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className={`text-xl font-bold ${colors.accent} mb-1`}>{brand.name}</h3>
                      <p className="text-xs text-muted-foreground">{brand.models.length} Modelle</p>
                    </div>
                    <Badge variant="outline" className={colors.badge}>
                      {brand.productCount} Produkte
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Umsatz</p>
                        <p className={`text-lg font-bold ${colors.accent}`}>
                          €{stats?.totalRevenue.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Ø Preis</p>
                        <p className={`text-lg font-bold ${colors.accent}`}>
                          €{stats?.averagePrice.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Package className={`w-4 h-4 ${colors.accent}`} />
                        <span className="text-sm text-muted-foreground">Lagerbestand:</span>
                        <span className={`text-sm font-semibold ${colors.accent}`}>
                          {stats?.totalStock || 0}
                        </span>
                      </div>
                      {stats && (stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
                        <AlertCircle className={`w-4 h-4 ${colors.accent}`} />
                      )}
                    </div>

                    {stats && stats.topModels.length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <p className="text-xs text-muted-foreground mb-2">Top Modelle:</p>
                        <div className="flex flex-wrap gap-1">
                          {stats.topModels.slice(0, 3).map(({ model }) => (
                            <Badge
                              key={model.id}
                              variant="outline"
                              className={`text-xs ${colors.badge}`}
                            >
                              {model.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`w-full ${colors.secondary} hover:${colors.primary}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrandClick(brand);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details anzeigen
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredBrands.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Keine Brands gefunden</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Versuche einen anderen Suchbegriff' : 'Es wurden noch keine Brands erstellt'}
          </p>
        </Card>
      )}
    </div>
  );
});

BrandManagement.displayName = 'BrandManagement';

