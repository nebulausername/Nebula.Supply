import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AlertCircle, Package, CheckCircle } from 'lucide-react';

interface LowStockItem {
  id: string;
  productId?: string;
  name?: string;
  productName?: string;
  stock?: number;
  inventory?: number;
  sku?: string;
}

interface ShopLowStockAlertsProps {
  items: LowStockItem[];
  count: number;
  isLoading: boolean;
  onItemClick: (itemId: string) => void;
}

export const ShopLowStockAlerts = memo(({ 
  items, 
  count, 
  isLoading, 
  onItemClick 
}: ShopLowStockAlertsProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-semibold text-white">Low Stock Alerts</h2>
        </div>
        <Badge variant="outline" className={`${count > 0 ? 'text-orange-400 border-orange-400' : 'text-green-400 border-green-400'}`}>
          {count} {count === 1 ? 'Produkt' : 'Produkte'}
        </Badge>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-800/50 rounded animate-pulse" />
          ))}
        </div>
      ) : count > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.slice(0, 10).map((item) => {
            const stock = item.stock || item.inventory || 0;
            const isCritical = stock <= 3;
            return (
              <div
                key={item.id || item.productId}
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  isCritical 
                    ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50' 
                    : 'bg-black/25 border-orange-500/20 hover:border-orange-500/40'
                }`}
                onClick={() => onItemClick(item.id || item.productId || '')}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Package className={`w-5 h-5 flex-shrink-0 ${isCritical ? 'text-red-400' : 'text-orange-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate group-hover:text-orange-400 transition-colors">
                      {item.name || item.productName || 'Unbekannt'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Lagerbestand: <span className={`font-semibold ${isCritical ? 'text-red-400' : 'text-orange-400'}`}>{stock}</span>
                      </span>
                      {item.sku && (
                        <>
                          <span>•</span>
                          <span className="text-xs">SKU: {item.sku}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${isCritical ? 'text-red-400 border-red-400 bg-red-500/20' : 'text-orange-400 border-orange-400'} animate-pulse group-hover:animate-none transition-all`}
                >
                  {isCritical ? 'Kritisch' : 'Niedrig'}
                </Badge>
              </div>
            );
          })}
          {items.length > 10 && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-orange-400">
                +{items.length - 10} weitere Low Stock Produkte
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400 opacity-50" />
          <p className="text-green-400">Alle Produkte haben ausreichend Lagerbestand</p>
        </div>
      )}
    </Card>
  );
});

ShopLowStockAlerts.displayName = 'ShopLowStockAlerts';

