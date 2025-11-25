import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { KpiCard } from '../ui/KpiCard';
import { LineChart } from '../ui/charts/LineChart';
import { useDrops } from '../../lib/api/hooks';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { cn } from '../../utils/cn';
import {
  Activity as ActivityIcon,
  AlertTriangle,
  Bolt,
  Radio,
  Flame,
  Radar,
  Repeat,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { ActivityStream, AnimatedCounter, LiveBadge, ProgressIndicator } from '../ui/animations';
import { SkeletonKpiCard } from '../ui/Skeleton';

interface LiveMetrics {
  totalDrops: number;
  activeDrops: number;
  liveRevenue: number;
  conversionRate: number;
  interestCount: number;
  lastUpdate: string;
}

interface ActivityEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: 'success' | 'warning' | 'info';
  icon: React.ReactNode;
}

interface StockAlertItem {
  dropId: string;
  dropName: string;
  variantId: string;
  variantLabel: string;
  stock: number;
  threshold: number;
}

const CHANNELS = ['drops', 'analytics', 'orders'] as const;
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const DropManagementLiveComponent: React.FC = () => {
  const { data: dropsResponse, isLoading } = useDrops({ limit: 100 });
  const dropList: any[] = useMemo(() => {
    if (!dropsResponse) return [];
    if (Array.isArray((dropsResponse as any).data)) {
      return (dropsResponse as any).data;
    }
    if ((dropsResponse as any).data?.data) {
      return (dropsResponse as any).data.data;
    }
    return [];
  }, [dropsResponse]);

  const formatCurrency = useMemo(() => new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }), []);

  const computeMetrics = useCallback((drops: any[]): LiveMetrics => {
    if (!drops.length) {
      return {
        totalDrops: 0,
        activeDrops: 0,
        liveRevenue: 0,
        conversionRate: 0,
        interestCount: 0,
        lastUpdate: new Date().toISOString()
      };
    }

    const totalDrops = drops.length;
    const activeDrops = drops.filter((drop) => drop.status === 'active' || drop.status === 'running').length;
    const liveRevenue = drops.reduce((acc, drop) => {
      const progressFactor = typeof drop.progress === 'number' ? drop.progress : 0;
      const estimatedOrders = drop.currentOrders ?? Math.round(progressFactor * 120);
      return acc + (drop.price || 0) * (estimatedOrders || 0);
    }, 0);
    const averageConversion = drops.reduce((acc, drop) => acc + (drop.progress || 0), 0) / drops.length;
    const interestCount = drops.reduce((acc, drop) => acc + (drop.interestCount || Math.round((drop.progress || 0) * 140)), 0);

    return {
      totalDrops,
      activeDrops,
      liveRevenue,
      conversionRate: Number((averageConversion * 100).toFixed(2)),
      interestCount,
      lastUpdate: new Date().toISOString()
    };
  }, []);

  const computeStockAlerts = useCallback((drops: any[]): StockAlertItem[] => {
    const alerts: StockAlertItem[] = [];
    drops.forEach((drop) => {
      drop?.variants?.forEach((variant: any) => {
        if (typeof variant.stock === 'number' && variant.stock <= 10) {
          alerts.push({
            dropId: drop.id,
            dropName: drop.name,
            variantId: variant.id,
            variantLabel: variant.label,
            stock: variant.stock,
            threshold: 10
          });
        }
      });
    });
    return alerts.slice(0, 10);
  }, []);

  const [metrics, setMetrics] = useState<LiveMetrics>(() => computeMetrics(dropList));
  const [stockAlerts, setStockAlerts] = useState<StockAlertItem[]>(() => computeStockAlerts(dropList));
  const [activityFeed, setActivityFeed] = useState<ActivityEntry[]>([]);
  const [trendData, setTrendData] = useState<Array<{ time: string; revenue: number; interest: number }>>(() => {
    const initialMetrics = computeMetrics(dropList);
    return [{
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      revenue: initialMetrics.liveRevenue,
      interest: initialMetrics.interestCount
    }];
  });

  // Memoize metrics and alerts to avoid unnecessary recalculations
  const computedMetrics = useMemo(() => computeMetrics(dropList), [dropList]);
  const computedStockAlerts = useMemo(() => computeStockAlerts(dropList), [dropList, computeStockAlerts]);

  useEffect(() => {
    if (!dropList.length) return;
    setMetrics(computedMetrics);
    setStockAlerts(computedStockAlerts);
  }, [dropList.length, computedMetrics, computedStockAlerts]);

  const pushActivity = useCallback((entry: ActivityEntry) => {
    setActivityFeed((prev) => [entry, ...prev].slice(0, 25));
  }, []);

  const updateTrendLine = useCallback((nextMetrics: LiveMetrics) => {
    setTrendData((prev) => {
      const nextPoint = {
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        revenue: nextMetrics.liveRevenue,
        interest: nextMetrics.interestCount
      };
      const updated = [...prev, nextPoint];
      return updated.slice(-20);
    });
  }, []);

  const handleDropEvent = useCallback((event: ShopRealtimeEvent) => {
    setMetrics((prev) => {
      const next = { ...prev, lastUpdate: new Date().toISOString() };
      const drop = (event.payload as any)?.drop ?? event.payload;

      switch (event.type) {
        case 'drop:created': {
          next.totalDrops += 1;
          if (drop?.status === 'active' || drop?.status === 'running') {
            next.activeDrops += 1;
          }
          pushActivity({
            id: event.payload?.dropId || generateId(),
            title: 'Neuer Drop gestartet',
            description: `${drop?.name ?? 'Unbekannter Drop'} wurde soeben live geschaltet.`,
            timestamp: new Date().toISOString(),
            tone: 'success',
            icon: <Sparkles className="w-4 h-4 text-purple-300" />
          });
          break;
        }
        case 'drop:deleted': {
          next.totalDrops = Math.max(0, next.totalDrops - 1);
          pushActivity({
            id: event.payload?.dropId || generateId(),
            title: 'Drop entfernt',
            description: `${drop?.name ?? 'Ein Drop'} wurde archiviert.`,
            timestamp: new Date().toISOString(),
            tone: 'warning',
            icon: <Repeat className="w-4 h-4 text-yellow-300" />
          });
          break;
        }
        case 'drop:updated': {
          if (drop?.status) {
            const isActive = drop.status === 'active' || drop.status === 'running';
            const wasActive = drop.previousStatus === 'active' || drop.previousStatus === 'running';
            if (isActive && !wasActive) {
              next.activeDrops += 1;
            } else if (!isActive && wasActive) {
              next.activeDrops = Math.max(0, next.activeDrops - 1);
            }
          }
          pushActivity({
            id: `${event.payload?.dropId}-update-${Date.now()}`,
            title: 'Drop aktualisiert',
            description: `${drop?.name ?? 'Ein Drop'} wurde optimiert.`,
            timestamp: new Date().toISOString(),
            tone: 'info',
            icon: <Bolt className="w-4 h-4 text-cyan-300" />
          });
          break;
        }
        case 'drop:stock_changed': {
          const { dropId, variantId, newStock } = event.payload as any;
          setStockAlerts((prevAlerts) => {
            const withoutVariant = prevAlerts.filter((alert) => !(alert.dropId === dropId && alert.variantId === variantId));
            if (typeof newStock === 'number' && newStock <= 10) {
              const variantName = drop?.variants?.find((v: any) => v.id === variantId)?.label || 'Variante';
              const nextAlert: StockAlertItem = {
                dropId,
                dropName: drop?.name ?? 'Unbekannter Drop',
                variantId,
                variantLabel: variantName,
                stock: newStock,
                threshold: 10
              };
              return [nextAlert, ...withoutVariant].slice(0, 10);
            }
            return withoutVariant;
          });
          pushActivity({
            id: `${event.payload?.dropId}-stock-${Date.now()}`,
            title: 'Lagerbestand angepasst',
            description: `${drop?.name ?? 'Ein Drop'} -> Variante ${event.payload?.variantId} hat jetzt ${event.payload?.newStock} Einheiten.`,
            timestamp: new Date().toISOString(),
            tone: 'info',
            icon: <Radar className="w-4 h-4 text-blue-300" />
          });
          break;
        }
      }

      updateTrendLine(next);
      return next;
    });
  }, [pushActivity, updateTrendLine]);

  const handleAnalyticsUpdate = useCallback((event: ShopRealtimeEvent) => {
    const analytics = (event.payload as any) || {};
    setMetrics((prev) => {
      const next = {
        ...prev,
        liveRevenue: analytics.revenue ?? prev.liveRevenue,
        conversionRate: analytics.conversionRate ?? prev.conversionRate,
        interestCount: analytics.interestCount ?? prev.interestCount,
        lastUpdate: new Date().toISOString()
      };
      updateTrendLine(next);
      return next;
    });
  }, [updateTrendLine]);

  const handleOrderCreated = useCallback((event: ShopRealtimeEvent) => {
    const order = (event.payload as any)?.order;
    if (!order) return;
    setMetrics((prev) => {
      const next = {
        ...prev,
        liveRevenue: prev.liveRevenue + (order.totalAmount || 0),
        lastUpdate: new Date().toISOString()
      };
      updateTrendLine(next);
      return next;
    });
    pushActivity({
      id: `order-${order.orderId || Date.now()}`,
      title: 'Neue Bestellung',
      description: `Order ${order.orderId || ''} hat ${formatCurrency.format(order.totalAmount || 0)} generiert.`,
      timestamp: new Date().toISOString(),
      tone: 'success',
      icon: <TrendingUp className="w-4 h-4 text-green-300" />
    });
  }, [pushActivity, updateTrendLine, formatCurrency]);

  const realtime = useRealtimeShop({
    channels: CHANNELS as any,
    onDropEvent: handleDropEvent,
    onAnalyticsUpdated: handleAnalyticsUpdate,
    onOrderCreated: handleOrderCreated,
  });

  const connectionHealthy = realtime.connectionStatus.connected && !realtime.connectionStatus.error;
  const activityItems = useMemo(() => activityFeed.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    timestamp: new Date(entry.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    tone: entry.tone
  })), [activityFeed]);

  return (
    <div className="space-y-6">
      <Card className="p-6 border border-white/10 bg-slate-950/40 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-semibold text-white">Drops Live Dashboard</h2>
              <LiveBadge label={connectionHealthy ? 'Live' : 'Offline'} color={connectionHealthy ? 'green' : 'red'} />
            </div>
            <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
              Echtzeit KPIs für alle aktiven Drops: Conversion, Engagement und Stock-Level aktualisieren sich live.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setMetrics(computeMetrics(dropList))}>
              <Repeat className="w-4 h-4 mr-2" /> Refresh Metrics
            </Button>
            <Button size="sm">
              <Sparkles className="w-4 h-4 mr-2" /> Launch Drop
            </Button>
          </div>
          <ProgressIndicator
            label="Activation Ratio"
            value={metrics.totalDrops ? (metrics.activeDrops / Math.max(metrics.totalDrops, 1)) * 100 : 0}
            className="mt-4"
            color="linear-gradient(90deg,#38bdf8,#6366f1)"
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Drops"
          value={<AnimatedCounter value={metrics.totalDrops} />}
          delta={`+${dropList.filter((drop) => drop.status === 'coming_soon').length} waiting`}
          trend="up"
          color="purple"
          isLive
          icon="🚀"
        />
        <KpiCard
          label="Aktive Drops"
          value={<AnimatedCounter value={metrics.activeDrops} />}
          delta={`${metrics.totalDrops ? Math.round((metrics.activeDrops / Math.max(metrics.totalDrops, 1)) * 100) : 0}% aktiv`}
          trend="up"
          color="cyan"
          isLive
          icon="⚡"
        />
        <KpiCard
          label="Live Revenue"
          value={<AnimatedCounter value={metrics.liveRevenue} format={(val) => formatCurrency.format(val)} />}
          delta={`+${formatCurrency.format(Math.max(0, metrics.liveRevenue - (trendData.at(-2)?.revenue ?? 0)))}`}
          trend="up"
          color="green"
          isLive
          icon="💸"
        />
        <KpiCard
          label="Conversion Rate"
          value={<AnimatedCounter value={metrics.conversionRate} format={(val) => `${val.toFixed(1)}%`} />}
          delta={`${metrics.interestCount} Leads`}
          trend="up"
          color="yellow"
          isLive
          icon="📈"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <LineChart
          data={trendData}
          xKey="time"
          lines={[
            { dataKey: 'revenue', name: 'Revenue', color: '#f97316', strokeWidth: 3 },
            { dataKey: 'interest', name: 'Interessenten', color: '#38bdf8', strokeWidth: 2 }
          ]}
          title="Realtime Performance"
          description="Revenue und Interessent:innen entwickeln sich live basierend auf Orders und Drop Events."
          showArea
          height={360}
          formatValue={(value) => formatCurrency.format(value)}
        />

        <Card className="p-6 border border-white/10 bg-slate-950/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Low Stock Radar</h3>
              <p className="text-xs text-muted-foreground mt-1">Automatische Alerts bei Bestand &lt;= 10</p>
            </div>
            <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">
              <AlertTriangle className="w-3 h-3 mr-1" /> {stockAlerts.length} Alerts
            </Badge>
          </div>

          {stockAlerts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              Aktuell keine kritischen Stock-Level. Alles stabil! 💪
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
              {stockAlerts.map((alert) => (
                <div
                  key={`${alert.dropId}-${alert.variantId}`}
                  className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-yellow-200">{alert.dropName}</p>
                    <p className="text-xs text-yellow-200/70 mt-0.5">Variante: {alert.variantLabel}</p>
                  </div>
                  <Badge variant="outline" className="border-yellow-400/60 text-yellow-200">
                    {alert.stock} / {alert.threshold}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <Card className="p-6 border border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4">
            <ActivityIcon className="w-4 h-4 text-orange-300" />
            <div>
              <h3 className="text-lg font-semibold text-white">Live Activity Feed</h3>
              <p className="text-xs text-muted-foreground">24/7 Insights zu allen Drop Events</p>
            </div>
          </div>

          {activityItems.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              Noch keine Live Events – warte auf erste Signale oder triggere ein Drop-Event.
            </div>
          ) : (
            <ActivityStream items={activityItems} className="max-h-[360px] overflow-y-auto pr-1 custom-scrollbar" />
          )}
        </Card>

        <Card className="p-6 border border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-4">
            <Radio className="w-4 h-4 text-cyan-300" />
            <div>
              <h3 className="text-lg font-semibold text-white">Realtime Insights</h3>
              <p className="text-xs text-muted-foreground">Letzte Aktualisierung: {new Date(metrics.lastUpdate).toLocaleTimeString('de-DE')}</p>
            </div>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Connection</span>
              <Badge variant="outline" className={cn('border-white/20', connectionHealthy ? 'text-green-300 border-green-500/30' : 'text-red-300 border-red-500/30')}>
                {connectionHealthy ? 'Stable' : 'Reconnecting'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Realtime Queue</span>
              <span className="text-white">{activityFeed.length} events</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg. Conversion</span>
              <span className="text-white">{metrics.conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Interest Funnel</span>
              <span className="text-white">{metrics.interestCount.toLocaleString('de-DE')}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <Button variant="outline" size="sm" className="justify-start gap-2">
              <Flame className="w-4 h-4 text-orange-300" />
              Launch Flash Drop
            </Button>
            <Button variant="outline" size="sm" className="justify-start gap-2">
              <Zap className="w-4 h-4 text-yellow-300" />
              Boost Engagement
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const DropManagementLive = React.memo(DropManagementLiveComponent);
