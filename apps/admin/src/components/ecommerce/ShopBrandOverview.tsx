import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tag, TrendingUp, Package, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import { getBrandColor, type Brand } from '../../lib/utils/brandUtils';

interface BrandStats {
  totalRevenue: number;
  totalProducts: number;
  averagePrice: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface ShopBrandOverviewProps {
  brands: Brand[];
  brandStatsMap: Map<string, BrandStats>;
  topBrandsByRevenue: Array<{ brand: Brand; stats: BrandStats }>;
  topBrandsByProducts: Array<{ brand: Brand; stats: BrandStats }>;
  selectedBrandIds: string[];
  onBrandSelect: (brandId: string) => void;
  onBrandFilterChange: (brandIds: string[]) => void;
}

export const ShopBrandOverview = memo(({
  brands,
  brandStatsMap,
  topBrandsByRevenue,
  topBrandsByProducts,
  selectedBrandIds,
  onBrandSelect,
  onBrandFilterChange,
}: ShopBrandOverviewProps) => {
  if (brands.length === 0) return null;

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Brand Overview</h2>
          </div>
          <Badge variant="outline" className="text-purple-400 border-purple-400">
            {brands.length} Brands
          </Badge>
        </div>
        
        {/* Brand Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {brands.slice(0, 6).map((brand) => {
            const stats = brandStatsMap.get(brand.id);
            const colors = getBrandColor(brand.name);
            
            return (
              <Card
                key={brand.id}
                className={`p-4 bg-gradient-to-br ${colors.primary} border ${colors.secondary} hover:border-${colors.accent}/50 transition-all cursor-pointer`}
                interactive
                onClick={() => onBrandSelect(brand.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`text-lg font-bold ${colors.accent} mb-1`}>{brand.name}</h3>
                    <p className="text-xs text-muted-foreground">{brand.models.length} Modelle</p>
                  </div>
                  <Badge variant="outline" className={colors.badge}>
                    {brand.productCount} Produkte
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-xs text-muted-foreground">Umsatz</p>
                    <p className={`text-sm font-bold ${colors.accent}`}>
                      €{stats?.totalRevenue.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="bg-black/20 rounded p-2">
                    <p className="text-xs text-muted-foreground">Ø Preis</p>
                    <p className={`text-sm font-bold ${colors.accent}`}>
                      €{stats?.averagePrice.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className={`w-4 h-4 ${colors.accent}`} />
                    <span className="text-xs text-muted-foreground">Lager:</span>
                    <span className={`text-xs font-semibold ${colors.accent}`}>
                      {stats?.totalStock || 0}
                    </span>
                  </div>
                  {stats && (stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
                    <AlertCircle className={`w-4 h-4 ${colors.accent}`} />
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Brand Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Brands by Revenue */}
          <Card className="p-4 bg-black/25 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Top Brands nach Umsatz</h3>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <div className="space-y-2">
              {topBrandsByRevenue.slice(0, 5).map(({ brand, stats }, index) => {
                const colors = getBrandColor(brand.name);
                return (
                  <div
                    key={brand.id}
                    className="flex items-center justify-between p-2 bg-black/20 rounded hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => onBrandSelect(brand.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${colors.badge}`}>
                        #{index + 1}
                      </Badge>
                      <span className="text-sm font-medium text-white">{brand.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${colors.accent}`}>
                      €{stats?.totalRevenue.toLocaleString() || '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Brands by Products */}
          <Card className="p-4 bg-black/25 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Top Brands nach Produkten</h3>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div className="space-y-2">
              {topBrandsByProducts.slice(0, 5).map(({ brand, stats }, index) => {
                const colors = getBrandColor(brand.name);
                return (
                  <div
                    key={brand.id}
                    className="flex items-center justify-between p-2 bg-black/20 rounded hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => onBrandSelect(brand.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${colors.badge}`}>
                        #{index + 1}
                      </Badge>
                      <span className="text-sm font-medium text-white">{brand.name}</span>
                    </div>
                    <span className={`text-sm font-bold ${colors.accent}`}>
                      {stats?.totalProducts || 0} Produkte
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Card>

      {/* Brand Filter Section */}
      <Card className="p-4 bg-gradient-to-r from-gray-900/50 to-black/50 border border-white/10">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <label className="text-sm font-medium text-white">Brand Filter:</label>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={selectedBrandIds.length === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onBrandFilterChange([])}
            >
              Alle Brands
            </Button>
            {brands.slice(0, 6).map(brand => {
              const colors = getBrandColor(brand.name);
              const isSelected = selectedBrandIds.includes(brand.id);
              return (
                <Button
                  key={brand.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (isSelected) {
                      onBrandFilterChange(selectedBrandIds.filter(id => id !== brand.id));
                    } else {
                      onBrandFilterChange([...selectedBrandIds, brand.id]);
                    }
                  }}
                  className={isSelected ? `bg-gradient-to-r ${colors.primary} border ${colors.secondary}` : ''}
                >
                  {brand.name}
                  {isSelected && <CheckCircle className="w-3 h-3 ml-2" />}
                </Button>
              );
            })}
          </div>
          {selectedBrandIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBrandFilterChange([])}
              className="ml-auto"
            >
              Filter zurücksetzen
            </Button>
          )}
        </div>
      </Card>
    </>
  );
});

ShopBrandOverview.displayName = 'ShopBrandOverview';

