import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { KpiCard } from '../ui/KpiCard';
import { useInventory } from '../../lib/api/shopHooks';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { Activity as ActivityIcon, AlertTriangle, ArrowDownRight, ArrowUpRight, Plane } from 'lucide-react';
import { cn } from '../../utils/cn';

interface InventoryItem {
  productId: string;
  productName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  lastUpdated: string;
}

interface MovementEntry {
  id: string;
  productId: string;
  productName: string;
  change: number;
  reason: string;
  timestamp: string;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const ProductStockLive: React.FC = () => {
  const { data: inventoryResponse } = useInventory();
  const inventory: InventoryItem[] = useMemo(() => {
    if (!inventoryResponse) return [];
    if (Array.isArray((inventoryResponse as any).data)) return (inventoryResponse as any).data;
    if ((inventoryResponse as any).data?.items) return (inventoryResponse as any).data.items;
    return inventoryResponse as any;
  }, [inventoryResponse]);

  const [stockState, setStockState] = useState<Record<string, InventoryItem>>(() => {
    const map: Record<string, InventoryItem> = {};
    inventory.forEach((item) => {
      map[item.productId] = item;
    });
    return map;
  });

  useEffect(() => {
    if (!inventory.length) return;
    setStockState(() => {
      const map: Record<string, InventoryItem> = {};
      inventory.forEach((item) => {
        map[item.productId] = item;
      });
      return map;
    });
  }, [inventory]);

  const [movements, setMovements] = useState<MovementEntry[]>([]);
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const updateStock = useCallback((productId: string, delta: number, reason: string) => {
    setStockState((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const updatedStock = Math.max(0, current.currentStock + delta);
      const updatedAvailable = Math.max(0, updatedStock - current.reservedStock);
      return {
        ...prev,
        [productId]: {
          ...current,
          currentStock: updatedStock,
          availableStock: updatedAvailable,
          lastUpdated: new Date().toISOString()
        }
      };
    });
    setMovements((prev) => [
      {
        id: generateId(),
        productId,
        productName: stockState[productId]?.productName ?? productId,
        change: delta,
        reason,
        timestamp: new Date().toISOString()
      },
      ...prev
    ].slice(0, 25));
  }, [stockState]);

  const handleInventoryEvent = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload as any;
    const productId = payload?.productId;
    if (!productId) return;
    switch (event.type) {
      case 'inventory:stock_adjusted':
        updateStock(productId, payload.newStock - payload.previousStock, payload.reason ?? 'Adjustment');
        break;
      case 'inventory:stock_reserved':
        updateStock(productId, -payload.quantity, 'Reserved');
        break;
      case 'inventory:stock_released':
        updateStock(productId, payload.quantity, 'Released');
        break;
      case 'inventory:low_stock_alert':
        setMovements((prev) => [
          {
            id: generateId(),
            productId,
            productName: stockState[productId]?.productName ?? productId,
            change: 0,
            reason: `Low stock alert (${payload.currentStock})`,
            timestamp: new Date().toISOString()
          },
          ...prev
        ]);
        break;
    }
  }, [updateStock, stockState]);

  useRealtimeShop({
    channels: ['inventory'],
    onInventoryEvent: handleInventoryEvent
  });

  const items = useMemo(() => Object.values(stockState), [stockState]);
  const filteredItems = useMemo(() => {
    if (!lowStockFilter) return items;
    return items.filter((item) => item.currentStock <= item.lowStockThreshold);
  }, [items, lowStockFilter]);

  const totalStock = items.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockCount = items.filter((item) => item.currentStock <= item.lowStockThreshold).length;
  const reservedTotals = items.reduce((sum, item) => sum + item.reservedStock, 0);

  const topAlerts = items
    .filter((item) => item.currentStock <= item.lowStockThreshold)
    .sort((a, b) => (a.currentStock / a.lowStockThreshold) - (b.currentStock / b.lowStockThreshold))
    .slice(0, 6);

  return (
    <Card className="p-6 border border-white/10 bg-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Realtime Stock Monitor</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Live Overview für Inventory Levels, Reservierungen und kritische Alerts. Perfekt für Ops & Logistics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setLowStockFilter((prev) => !prev)}>
            {lowStockFilter ? 'Show All' : 'Only Low Stock'}
          </Button>
          <Badge variant="outline" className="border-white/15 text-white/70">{items.length} Produkte</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Stock"
          value={totalStock}
          delta={`${reservedTotals} reserved`}
          trend="up"
          color="cyan"
          isLive
          icon="📦"
        />
        <KpiCard
          label="Reserved"
          value={reservedTotals}
          delta={`${items.length ? Math.round((reservedTotals / Math.max(1, totalStock + reservedTotals)) * 100) : 0}%`}
          trend="neutral"
          color="purple"
          isLive
          icon="🛡️"
        />
        <KpiCard
          label="Low Stock Items"
          value={lowStockCount}
          delta="Threshold ≤ 10"
          trend={lowStockCount > 0 ? 'down' : 'neutral'}
          color="yellow"
          isLive
          icon="⚠️"
        />
        <KpiCard
          label="Movements (24h)"
          value={movements.length}
          delta="Autorefresh"
          trend="up"
          color="green"
          isLive
          icon="📈"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <Card className="p-5 border border-white/10 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Live Inventory Table</h4>
              <p className="text-xs text-muted-foreground">Auto-Updating bei Stock Movements</p>
            </div>
            <Badge variant="outline" className="border-white/15 text-white/70">{filteredItems.length} anzeigen</Badge>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 px-3 text-left">Produkt</th>
                  <th className="py-2 px-3 text-right">Stock</th>
                  <th className="py-2 px-3 text-right">Reserved</th>
                  <th className="py-2 px-3 text-right">Available</th>
                  <th className="py-2 px-3 text-right">Threshold</th>
                  <th className="py-2 px-3 text-right">Reorder</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.slice(0, 12).map((item) => {
                  const isLow = item.currentStock <= item.lowStockThreshold;
                  const delta = item.currentStock - item.lowStockThreshold;
                  return (
                    <tr key={item.productId} className="border-t border-white/5">
                      <td className="py-2 px-3 text-white">{item.productName}</td>
                      <td className={cn('py-2 px-3 text-right', isLow && 'text-yellow-300 font-semibold')}>{item.currentStock}</td>
                      <td className="py-2 px-3 text-right text-white/70">{item.reservedStock}</td>
                      <td className="py-2 px-3 text-right text-white/80">{item.availableStock}</td>
                      <td className="py-2 px-3 text-right text-white/60">{item.lowStockThreshold}</td>
                      <td className="py-2 px-3 text-right">
                        <Badge variant="outline" className={cn('text-[11px]', isLow ? 'border-red-400/40 text-red-200' : 'border-green-400/40 text-green-200')}>
                          {isLow ? `- ${Math.abs(delta)}` : `+ ${delta}`}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {!filteredItems.length && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Keine Inventory Daten verfügbar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 border border-white/10 bg-black/15">
          <div className="flex items-center gap-3 mb-4">
            <ActivityIcon className="w-4 h-4 text-orange-300" />
            <div>
              <h4 className="text-lg font-semibold text-white">Stock Movements</h4>
              <p className="text-xs text-muted-foreground">Log der letzten Anpassungen</p>
            </div>
          </div>
          {movements.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              Noch keine Bewegungen im Log.
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <div className={cn('flex items-center justify-center rounded-full p-2', movement.change >= 0 ? 'bg-green-500/10' : 'bg-red-500/10')}>
                    {movement.change >= 0 ? <ArrowUpRight className="w-4 h-4 text-green-300" /> : <ArrowDownRight className="w-4 h-4 text-red-300" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{movement.productName}</p>
                    <p className="text-xs text-muted-foreground">{movement.reason}</p>
                  </div>
                  <div className="text-sm font-semibold text-white">{movement.change >= 0 ? '+' : ''}{movement.change}</div>
                  <div className="text-[11px] text-muted-foreground">{new Date(movement.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-4 border border-white/10 bg-black/30">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-300" /> Kritische Low-Stock Alerts
          </h4>
          <div className="space-y-2">
            {topAlerts.length === 0 && (
              <p className="text-xs text-muted-foreground">Keine kritischen Stocks – Inventory stabil.</p>
            )}
            {topAlerts.map((item) => (
              <div key={item.productId} className="flex items-center justify-between rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-3 py-2">
                <div>
                  <p className="text-sm text-yellow-100">{item.productName}</p>
                  <p className="text-[11px] text-yellow-100/70">{item.currentStock} / {item.lowStockThreshold}</p>
                </div>
                <Button size="xs" variant="outline" className="text-[11px] border-yellow-300/60 text-yellow-100">
                  Restock Now
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 border border-white/10 bg-black/30">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-300" /> Multi-Location Snapshot
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[11px] uppercase text-white/60">Berlin Hub</p>
              <p className="text-sm text-white font-semibold">{Math.round(totalStock * 0.35)} pcs</p>
              <p className="text-[11px] text-white/60">19 SKUs</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[11px] uppercase text-white/60">Frankfurt 3PL</p>
              <p className="text-sm text-white font-semibold">{Math.round(totalStock * 0.45)} pcs</p>
              <p className="text-[11px] text-white/60">24 SKUs</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[11px] uppercase text-white/60">EU Fulfillment</p>
              <p className="text-sm text-white font-semibold">{Math.round(totalStock * 0.2)} pcs</p>
              <p className="text-[11px] text-white/60">15 SKUs</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[11px] uppercase text-white/60">Coming Soon</p>
              <p className="text-sm text-white font-semibold">Capacity unlocked</p>
              <p className="text-[11px] text-white/60">Plan ahead</p>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
};

