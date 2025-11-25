import React, { useMemo, memo, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';
import { useCategories, useProducts } from '../../lib/api/shopHooks';
import { extractBrands, calculateBrandStats, getBrandColor, type Brand, type BrandStats } from '../../lib/utils/brandUtils';
import { cn } from '../../utils/cn';

interface BrandAnalyticsProps {
  selectedBrandId?: string | null;
  dateRange?: { start: Date; end: Date };
}

export const BrandAnalytics = memo(({ selectedBrandId, dateRange }: BrandAnalyticsProps) => {
  // Data fetching
  const { data: categoriesResponse } = useCategories({
    type: 'shop',
    limit: 1000
  });
  const { data: productsResponse } = useProducts({
    type: ['shop'],
    limit: 1000
  });

  const categories = categoriesResponse?.data || [];
  const products = productsResponse?.data || [];

  // Extract brands
  const brands = useMemo(() => {
    if (!categories.length) return [];
    return extractBrands(categories, products);
  }, [categories, products]);

  // Calculate brand stats
  const brandStatsMap = useMemo(() => {
    const statsMap = new Map<string, BrandStats>();
    brands.forEach(brand => {
      statsMap.set(brand.id, calculateBrandStats(brand, products));
    });
    return statsMap;
  }, [brands, products]);

  // Filter by selected brand
  const displayBrands = useMemo(() => {
    if (selectedBrandId) {
      return brands.filter(b => b.id === selectedBrandId);
    }
    return brands;
  }, [brands, selectedBrandId]);

  // Top brands by revenue
  const topBrandsByRevenue = useMemo(() => {
    return [...brands]
      .map(brand => ({
        brand,
        stats: brandStatsMap.get(brand.id)
      }))
      .filter(item => item.stats)
      .sort((a, b) => (b.stats?.totalRevenue || 0) - (a.stats?.totalRevenue || 0))
      .slice(0, 10);
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
      .slice(0, 10);
  }, [brands, brandStatsMap]);

  // Total revenue across all brands
  const totalRevenue = useMemo(() => {
    return topBrandsByRevenue.reduce((sum, item) => sum + (item.stats?.totalRevenue || 0), 0);
  }, [topBrandsByRevenue]);

  // Average revenue per brand
  const averageRevenue = useMemo(() => {
    return brands.length > 0 ? totalRevenue / brands.length : 0;
  }, [totalRevenue, brands.length]);

  // Export function
  const handleExport = useCallback(() => {
    const data = {
      generatedAt: new Date().toISOString(),
      dateRange: dateRange ? {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      } : null,
      summary: {
        totalBrands: brands.length,
        totalRevenue,
        averageRevenue,
        totalProducts: brands.reduce((sum, b) => sum + b.productCount, 0)
      },
      brands: brands.map(brand => {
        const stats = brandStatsMap.get(brand.id);
        return {
          name: brand.name,
          productCount: brand.productCount,
          totalRevenue: stats?.totalRevenue || 0,
          averagePrice: stats?.averagePrice || 0,
          totalStock: stats?.totalStock || 0,
          lowStockCount: stats?.lowStockCount || 0,
          outOfStockCount: stats?.outOfStockCount || 0,
          topModels: stats?.topModels.map(tm => ({
            name: tm.model.name,
            productCount: tm.productCount
          })) || []
        };
      })
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brand-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [brands, brandStatsMap, totalRevenue, averageRevenue, dateRange]);

  if (brands.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Keine Brand-Daten verfügbar</h3>
        <p className="text-muted-foreground">
          Erstelle zuerst Brands in der Kategorien-Hierarchie
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Brand Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Performance-Analysen und Statistiken für alle Brands
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportieren
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamtumsatz</p>
              <p className="text-2xl font-bold text-blue-400">€{totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400 opacity-60" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ø Umsatz pro Brand</p>
              <p className="text-2xl font-bold text-green-400">€{averageRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400 opacity-60" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Anzahl Brands</p>
              <p className="text-2xl font-bold text-purple-400">{brands.length}</p>
            </div>
            <Package className="w-8 h-8 text-purple-400 opacity-60" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamtprodukte</p>
              <p className="text-2xl font-bold text-orange-400">
                {brands.reduce((sum, b) => sum + b.productCount, 0)}
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-400 opacity-60" />
          </div>
        </Card>
      </div>

      {/* Top Brands by Revenue */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Top Brands nach Umsatz</h3>
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            Top 10
          </Badge>
        </div>
        <div className="space-y-3">
          {topBrandsByRevenue.map(({ brand, stats }, index) => {
            const colors = getBrandColor(brand.name);
            const percentage = totalRevenue > 0 ? ((stats?.totalRevenue || 0) / totalRevenue) * 100 : 0;
            
            return (
              <div key={brand.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs ${colors.badge}`}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium text-white">{brand.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {stats?.totalProducts || 0} Produkte
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${colors.accent}`}>
                      €{stats?.totalRevenue.toLocaleString() || '0'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-black/25 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', colors.primary)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top Brands by Products */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Top Brands nach Produkten</h3>
          <Badge variant="outline" className="text-green-400 border-green-400">
            Top 10
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topBrandsByProducts.map(({ brand, stats }, index) => {
            const colors = getBrandColor(brand.name);
            
            return (
              <div
                key={brand.id}
                className={`p-4 bg-gradient-to-br ${colors.primary} border ${colors.secondary} rounded-lg`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${colors.badge}`}>
                      #{index + 1}
                    </Badge>
                    <span className={`font-semibold ${colors.accent}`}>{brand.name}</span>
                  </div>
                  <span className={`text-lg font-bold ${colors.accent}`}>
                    {stats?.totalProducts || 0}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Umsatz: €{stats?.totalRevenue.toLocaleString() || '0'}</div>
                  <div>Ø Preis: €{stats?.averagePrice.toFixed(2) || '0.00'}</div>
                  <div>Lagerbestand: {stats?.totalStock || 0}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Brand Performance Comparison */}
      {displayBrands.length > 1 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Brand Performance Vergleich</h3>
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {displayBrands.map(brand => {
              const stats = brandStatsMap.get(brand.id);
              const colors = getBrandColor(brand.name);
              
              return (
                <div
                  key={brand.id}
                  className={`p-4 bg-gradient-to-br ${colors.primary} border ${colors.secondary} rounded-lg`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className={`text-lg font-bold ${colors.accent}`}>{brand.name}</h4>
                    <Badge variant="outline" className={colors.badge}>
                      {brand.models.length} Modelle
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Umsatz</p>
                      <p className={`text-lg font-bold ${colors.accent}`}>
                        €{stats?.totalRevenue.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Produkte</p>
                      <p className={`text-lg font-bold ${colors.accent}`}>
                        {stats?.totalProducts || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ø Preis</p>
                      <p className={`text-lg font-bold ${colors.accent}`}>
                        €{stats?.averagePrice.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Lagerbestand</p>
                      <p className={`text-lg font-bold ${colors.accent}`}>
                        {stats?.totalStock || 0}
                      </p>
                    </div>
                  </div>
                  {stats && (stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-4 text-xs">
                        {stats.lowStockCount > 0 && (
                          <span className="text-orange-400">
                            {stats.lowStockCount} niedrig
                          </span>
                        )}
                        {stats.outOfStockCount > 0 && (
                          <span className="text-red-400">
                            {stats.outOfStockCount} ausverkauft
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
});

BrandAnalytics.displayName = 'BrandAnalytics';

