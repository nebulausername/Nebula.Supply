import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Package, TrendingUp } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon?: string;
  productCount: number;
  avgPrice: number;
}

interface ShopTopCategoriesProps {
  categories: Category[];
  totalCategories: number;
  isLoading: boolean;
  onCategoryClick: (categoryId: string) => void;
}

export const ShopTopCategories = memo(({ 
  categories, 
  totalCategories, 
  isLoading, 
  onCategoryClick 
}: ShopTopCategoriesProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Top Kategorien</h2>
        </div>
        <Badge variant="outline" className="text-blue-400 border-blue-400">
          {totalCategories || 0} Kategorien
        </Badge>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-800/50 rounded animate-pulse" />
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="group flex items-center justify-between p-3 bg-black/25 rounded-lg border border-white/10 hover:border-blue-500/30 hover:bg-white/5 transition-all cursor-pointer"
              onClick={() => onCategoryClick(category.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {category.icon || '📦'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{category.productCount} Produkte</span>
                    {category.avgPrice > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-green-400">Ø €{category.avgPrice.toFixed(2)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-blue-400 border-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  #{index + 1}
                </Badge>
                <TrendingUp className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
          {totalCategories > categories.length && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-white">
                +{totalCategories - categories.length} weitere Kategorien anzeigen
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>Keine Kategorien verfügbar</p>
        </div>
      )}
    </Card>
  );
});

ShopTopCategories.displayName = 'ShopTopCategories';

