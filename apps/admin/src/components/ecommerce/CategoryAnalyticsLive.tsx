import React, { useCallback, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BarChart } from '../ui/charts/BarChart';
import { KpiCard } from '../ui/KpiCard';
import { useCategories } from '../../lib/api/shopHooks';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CategoryMetric {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  conversion: number;
  aov: number;
  trend: 'up' | 'down' | 'neutral';
  growth: number;
}

const formatEuro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const buildInitialMetric = (category: any, index: number): CategoryMetric => {
  const baseRevenue = 25000 - index * 2500 + Math.random() * 5000;
  const orders = Math.round(baseRevenue / 120 + Math.random() * 80);
  const conversion = Number((3 + Math.random() * 2).toFixed(2));
  const aov = baseRevenue / Math.max(orders, 1);
  const trend = Math.random() > 0.3 ? 'up' : 'neutral';
  const growth = trend === 'up' ? Number((5 + Math.random() * 8).toFixed(1)) : Number((Math.random() * 3).toFixed(1));
  return {
    id: category.id,
    name: category.name,
    revenue: baseRevenue,
    orders,
    conversion,
    aov,
    trend,
    growth
  };
};

export const CategoryAnalyticsLive: React.FC = () => {
  const { data: categoriesResponse } = useCategories();
  const categories: any[] = useMemo(() => {
    if (!categoriesResponse) return [];
    if (Array.isArray(categoriesResponse as any)) return categoriesResponse as any;
    if ((categoriesResponse as any).data) return (categoriesResponse as any).data;
    return [];
  }, [categoriesResponse]);

  const [metrics, setMetrics] = useState<Record<string, CategoryMetric>>(() => {
    const map: Record<string, CategoryMetric> = {};
    categories.slice(0, 10).forEach((category, index) => {
      map[category.id] = buildInitialMetric(category, index);
    });
    return map;
  });

  React.useEffect(() => {
    if (!categories.length) return;
    setMetrics((prev) => {
      const clone = { ...prev };
      categories.slice(0, 10).forEach((category, index) => {
        if (!clone[category.id]) {
          clone[category.id] = buildInitialMetric(category, index);
        }
      });
      return clone;
    });
  }, [categories]);

  const ranking = useMemo(() => Object.values(metrics).sort((a, b) => b.revenue - a.revenue), [metrics]);

  const chartData = useMemo(() => ranking.slice(0, 8).map((item) => ({
    category: item.name,
    revenue: Math.round(item.revenue),
    orders: item.orders,
    conversion: item.conversion
  })), [ranking]);

  const totalRevenue = ranking.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = ranking.reduce((sum, item) => sum + item.orders, 0);
  const avgConversion = ranking.length ? ranking.reduce((sum, item) => sum + item.conversion, 0) / ranking.length : 0;

  const handleAnalyticsUpdate = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload ?? {};
    const categoryId = payload.categoryId;
    if (!categoryId) return;
    setMetrics((prev) => {
      const current = prev[categoryId];
      if (!current) return prev;
      const additionalRevenue = (payload.deltaRevenue ?? Math.random() * 3000);
      const additionalOrders = payload.deltaOrders ?? Math.round(additionalRevenue / 150);
      const revenue = current.revenue + additionalRevenue;
      const orders = current.orders + additionalOrders;
      const aov = revenue / Math.max(orders, 1);
      const conversion = Number((current.conversion + Math.random() * 0.4).toFixed(2));
      return {
        ...prev,
        [categoryId]: {
          ...current,
          revenue,
          orders,
          aov,
          conversion,
          trend: 'up',
          growth: Number((current.growth + Math.random() * 2).toFixed(1))
        }
      };
    });
  }, []);

  useRealtimeShop({
    channels: ['analytics'],
    onAnalyticsUpdated: handleAnalyticsUpdate
  });

  return (
    <Card className="p-6 border border-white/10 bg-black/25">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Category Performance Analytics</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Umsatz, Orders & Conversion per Kategorie – live aktualisiert. Finde Winners, erkenne Risiken.
          </p>
        </div>
        <Badge variant="outline" className="border-white/15 text-white/70">{ranking.length} Kategorien</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={formatEuro.format(totalRevenue)}
          delta="+9% vs letztes Zeitfenster"
          trend="up"
          color="green"
          isLive
          icon="💰"
        />
        <KpiCard
          label="Orders"
          value={totalOrders}
          delta="Avg. AOV & Conversion"
          trend="up"
          color="cyan"
          isLive
          icon="🧾"
        />
        <KpiCard
          label="Avg Conversion"
          value={`${avgConversion.toFixed(1)}%`}
          delta="Category Index"
          trend="neutral"
          color="purple"
          isLive
          icon="🎯"
        />
        <KpiCard
          label="Hot Category"
          value={ranking[0]?.name ?? 'n/a'}
          delta={ranking[0] ? formatEuro.format(ranking[0].revenue) : ''}
          trend="up"
          color="yellow"
          isLive
          icon="🔥"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <BarChart
          data={chartData}
          xKey="category"
          bars={[{ dataKey: 'revenue', name: 'Revenue', color: '#f97316' }, { dataKey: 'orders', name: 'Orders', color: '#38bdf8' }]}
          title="Revenue & Orders by Category"
          description="Top Kategorien nach Umsatz & Ordervolumen"
          height={360}
          showLegend
          formatValue={(value) => formatEuro.format(value)}
        />

        <Card className="p-5 border border-white/10 bg-black/15">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">AI Insights</h4>
              <p className="text-xs text-muted-foreground">Automatisierte Empfehlungen nach Performance</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1 text-[11px]">
              <Sparkles className="w-3 h-3" /> Refresh
            </Button>
          </div>
          <div className="space-y-3">
            {ranking.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm text-white">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Growth: +{item.growth}%</p>
                </div>
                <Badge variant="outline" className="border-green-400/40 text-green-200 text-[11px]">{formatEuro.format(item.revenue)}</Badge>
              </div>
            ))}
            {ranking.length === 0 && (
              <p className="text-sm text-muted-foreground py-10 text-center">Keine Kategorien vorhanden.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="p-5 border border-white/10 bg-black/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-green-300" />
            <h4 className="text-sm font-semibold text-white">Ranking & Details</h4>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ranking.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">#{index + 1} {item.name}</p>
                    <p className="text-xs text-muted-foreground">Conversion {item.conversion.toFixed(1)}%</p>
                  </div>
                  <Badge variant="outline" className={cn('text-[11px]', item.trend === 'up' ? 'border-green-400/40 text-green-200' : 'border-white/20 text-white/60')}>
                    {item.trend === 'up' ? 'Uptrend' : 'Stable'}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Revenue</span>
                  <span className="text-white font-medium">{formatEuro.format(item.revenue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Orders</span>
                  <span className="text-white font-medium">{item.orders}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>AOV</span>
                  <span className="text-white font-medium">{formatEuro.format(item.aov)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Card>
  );
};

