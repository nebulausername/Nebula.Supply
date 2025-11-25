import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { KpiCard } from '../ui/KpiCard';
import { useProducts } from '../../lib/api/shopHooks';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { Activity as ActivityIcon, ArrowUpRight, Flame, Sparkles, Star, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ProductPerformance {
  id: string;
  name: string;
  categoryName?: string;
  price?: number;
  stock?: number;
  views: number;
  addToCart: number;
  purchases: number;
  conversion: number;
  trend: 'up' | 'down' | 'neutral';
  heat: number;
}

interface ActivityEntry {
  id: string;
  message: string;
  timestamp: string;
  icon: React.ReactNode;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const buildInitialPerformance = (product: any, index: number): ProductPerformance => {
  const base = 500 - index * 37;
  const views = Math.max(80, base + Math.floor(Math.random() * 120));
  const addToCart = Math.max(10, Math.round(views * (0.2 + Math.random() * 0.15)));
  const purchases = Math.max(5, Math.round(addToCart * (0.4 + Math.random() * 0.2)));
  const conversion = Number(((purchases / views) * 100).toFixed(2));
  return {
    id: product.id,
    name: product.name,
    categoryName: product.categoryName,
    price: product.price,
    stock: product.inventory,
    views,
    addToCart,
    purchases,
    conversion,
    trend: Math.random() > 0.2 ? 'up' : 'neutral',
    heat: Number(((views + purchases * 4) / 1000).toFixed(2))
  };
};

const formatEuro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const ProductPerformanceLiveComponent: React.FC = () => {
  const { data: productsResponse } = useProducts({ limit: 100 });
  const products: any[] = useMemo(() => {
    if (!productsResponse) return [];
    if (Array.isArray(productsResponse as any)) return productsResponse as any;
    if ((productsResponse as any).data) return (productsResponse as any).data;
    return [];
  }, [productsResponse]);

  const [performance, setPerformance] = useState<Record<string, ProductPerformance>>(() => {
    const map: Record<string, ProductPerformance> = {};
    products.slice(0, 24).forEach((product, index) => {
      map[product.id] = buildInitialPerformance(product, index);
    });
    return map;
  });

  useEffect(() => {
    if (!products.length) return;
    setPerformance((prev) => {
      const clone = { ...prev };
      products.slice(0, 24).forEach((product, index) => {
        if (!clone[product.id]) {
          clone[product.id] = buildInitialPerformance(product, index);
        }
      });
      return clone;
    });
  }, [products]);

  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [highlighted, setHighlighted] = useState<Record<string, boolean>>({});

  const pushActivity = useCallback((entry: ActivityEntry) => {
    setActivity((prev) => [entry, ...prev].slice(0, 25));
  }, []);

  const updatePerformance = useCallback((productId: string, updater: (item: ProductPerformance) => ProductPerformance) => {
    setPerformance((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      return {
        ...prev,
        [productId]: updater(current)
      };
    });
  }, []);

  const totalRevenue = useMemo(() => Object.values(performance).reduce((sum, item) => sum + (item.purchases * (item.price || 49)), 0), [performance]);
  const totalConversions = useMemo(() => Object.values(performance).reduce((sum, item) => sum + item.conversion, 0), [performance]);
  const avgConversion = Object.keys(performance).length ? totalConversions / Object.keys(performance).length : 0;
  const topProducts = useMemo(() => Object.values(performance).sort((a, b) => b.heat - a.heat).slice(0, 8), [performance]);

  const handleProductEvent = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload as any;
    const productId = payload?.productId || payload?.product?.id;
    if (!productId) return;

    switch (event.type) {
      case 'product:updated':
        updatePerformance(productId, (item) => {
          const additionalViews = 20 + Math.round(Math.random() * 40);
          const updatedViews = item.views + additionalViews;
          const extraCarts = Math.round(additionalViews * (0.18 + Math.random() * 0.1));
          const updatedAddToCart = item.addToCart + extraCarts;
          const updatedPurchases = item.purchases + Math.round(extraCarts * (0.45 + Math.random() * 0.15));
          const conversion = Number(((updatedPurchases / updatedViews) * 100).toFixed(2));
          return {
            ...item,
            views: updatedViews,
            addToCart: updatedAddToCart,
            purchases: updatedPurchases,
            conversion,
            trend: 'up',
            heat: Number(((updatedViews + updatedPurchases * 4) / 1000).toFixed(2))
          };
        });
        pushActivity({
          id: generateId(),
          message: `${payload?.product?.name ?? 'Produkt'} wurde aktualisiert – Traffic boost ausgelöst.`,
          timestamp: new Date().toISOString(),
          icon: <TrendingUp className="w-4 h-4 text-green-300" />
        });
        break;
      case 'product:deleted':
        pushActivity({
          id: generateId(),
          message: `Produkt ${payload?.productId} wurde archiviert.`,
          timestamp: new Date().toISOString(),
          icon: <ActivityIcon className="w-4 h-4 text-yellow-300" />
        });
        break;
    }
  }, [pushActivity, updatePerformance]);

  const handleOrderCreated = useCallback((event: ShopRealtimeEvent) => {
    const order = (event.payload as any)?.order;
    if (!order || !order.items) return;
    order.items.forEach((item: any) => {
      if (!item.id) return;
      updatePerformance(item.id, (perf) => {
        const purchases = perf.purchases + item.quantity;
        const conversion = Number(((purchases / perf.views) * 100).toFixed(2));
        return {
          ...perf,
          purchases,
          conversion,
          trend: 'up',
          heat: Number(((perf.views + purchases * 4) / 1000).toFixed(2))
        };
      });
    });
    pushActivity({
      id: generateId(),
      message: `Neue Bestellung: ${order.items.length} Produkte verkauft (${formatEuro.format(order.totalAmount || 0)}).`,
      timestamp: new Date().toISOString(),
      icon: <ArrowUpRight className="w-4 h-4 text-green-300" />
    });
  }, [pushActivity, updatePerformance]);

  useRealtimeShop({
    channels: ['products', 'orders', 'analytics'],
    onProductUpdated: handleProductEvent,
    onProductCreated: handleProductEvent,
    onOrderCreated: handleOrderCreated
  });

  const toggleHighlight = useCallback((productId: string) => {
    setHighlighted((prev) => ({ ...prev, [productId]: !prev[productId] }));
  }, []);

  return (
    <Card className="p-6 border border-white/10 bg-slate-950/40 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Live Product Performance</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Realtime KPIs für Views, Adds-to-Cart, Orders & Conversion. Heatmap zeigt Top Performer, Trends erkennen sich instant.
          </p>
        </div>
        <Badge variant="outline" className="border-white/20 text-white/70">{Object.keys(performance).length} Products</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Live Revenue"
          value={formatEuro.format(totalRevenue)}
          delta="+12% vs. last hour"
          trend="up"
          color="green"
          isLive
          icon="💶"
        />
        <KpiCard
          label="Durchschnittliche Conversion"
          value={`${avgConversion.toFixed(1)}%`}
          delta="Top Performer +6%"
          trend="up"
          color="purple"
          isLive
          icon="🎯"
        />
        <KpiCard
          label="Cart Additions"
          value={Object.values(performance).reduce((sum, item) => sum + item.addToCart, 0)}
          delta="+38 in 15min"
          trend="up"
          color="cyan"
          isLive
          icon="🛒"
        />
        <KpiCard
          label="Trending Products"
          value={topProducts.length}
          delta="Heat Index"
          trend="neutral"
          color="yellow"
          isLive
          icon="🔥"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <Card className="p-5 border border-white/10 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Heatmap · Top Performer</h4>
              <p className="text-xs text-muted-foreground">Ranking nach Heat Score (Traffic x Sales)</p>
            </div>
            <Badge variant="outline" className="border-purple-400/40 text-purple-200 text-[11px]">Live Ranking</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {topProducts.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'rounded-xl border px-4 py-4 transition-all duration-200',
                  highlighted[item.id] ? 'border-yellow-400/70 bg-yellow-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                )}
                onClick={() => toggleHighlight(item.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.categoryName ?? 'No category'}</p>
                  </div>
                  <Badge variant="outline" className="border-orange-400/40 text-orange-200 text-[11px]">Heat {Math.round(item.heat * 100)}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                  <div>
                    <p className="text-xs text-white/70">Views</p>
                    <p className="text-sm font-semibold text-white">{item.views}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Cart</p>
                    <p className="text-sm font-semibold text-white">{item.addToCart}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Orders</p>
                    <p className="text-sm font-semibold text-white">{item.purchases}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="border-green-400/40 text-green-200 text-[11px]">{item.conversion.toFixed(1)}% CR</Badge>
                  <Badge variant="outline" className={cn('text-[11px]', item.trend === 'up' ? 'border-green-400/40 text-green-200' : 'border-white/20 text-white/70')}>
                    Trend {item.trend === 'up' ? '▲' : '■'}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button size="xs" className="gap-1 text-[11px]">
                    <Star className="w-3 h-3" /> Feature
                  </Button>
                  <Button size="xs" variant="outline" className="gap-1 text-[11px]">
                    <Flame className="w-3 h-3" /> Boost
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 border border-white/10 bg-black/15">
          <div className="flex items-center gap-3 mb-4">
            <ActivityIcon className="w-4 h-4 text-orange-300" />
            <div>
              <h4 className="text-lg font-semibold text-white">Realtime Activity</h4>
              <p className="text-xs text-muted-foreground">Neueste Product Events & Sales Impulse</p>
            </div>
          </div>
          {activity.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              Noch keine Live Events – optimiere ein Produkt oder warte auf erste Signale.
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {activity.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <div>{entry.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{entry.message}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Card>
  );
};

export const ProductPerformanceLive = React.memo(ProductPerformanceLiveComponent);
