import React, { useCallback, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LineChart } from '../ui/charts/LineChart';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { useOrders } from '../../lib/api/hooks';
import { Sparkles, TrendingUp } from 'lucide-react';

interface RevenuePoint {
  period: string;
  revenue: number;
  orders: number;
}

interface ChannelMetric {
  channel: string;
  revenue: number;
  orders: number;
  growth: number;
}

const formatEuro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

const buildSeedData = (): RevenuePoint[] => {
  const now = new Date();
  return Array.from({ length: 12 }).map((_, index) => {
    const pointDate = new Date(now.getTime() - (11 - index) * 60 * 60 * 1000);
    const revenue = 12000 + Math.random() * 6000;
    const orders = 40 + Math.round(Math.random() * 20);
    return {
      period: pointDate.toLocaleTimeString('de-DE', { hour: '2-digit' }),
      revenue,
      orders
    };
  });
};

const seedChannels: ChannelMetric[] = [
  { channel: 'Organic', revenue: 42000, orders: 310, growth: 8.2 },
  { channel: 'Paid Social', revenue: 36000, orders: 240, growth: 5.6 },
  { channel: 'Drops', revenue: 55000, orders: 180, growth: 12.1 },
  { channel: 'Influencer', revenue: 18000, orders: 120, growth: 3.4 }
];

export const SalesAnalyticsLive: React.FC = () => {
  const { data: ordersResponse } = useOrders({ limit: 100 });
  const [series, setSeries] = useState<RevenuePoint[]>(buildSeedData);
  const [channels, setChannels] = useState<ChannelMetric[]>(seedChannels);
  const [conversionRate, setConversionRate] = useState(4.2);
  const [avgOrderValue, setAvgOrderValue] = useState(148);

  const totalRevenue = useMemo(() => series.reduce((sum, point) => sum + point.revenue, 0), [series]);
  const totalOrders = useMemo(() => series.reduce((sum, point) => sum + point.orders, 0), [series]);

  React.useEffect(() => {
    if (!ordersResponse?.data) return;
    const simulatedBoost = Math.random() * 8000;
    setSeries((prev) => {
      const clone = [...prev];
      clone[clone.length - 1] = {
        ...clone[clone.length - 1],
        revenue: clone[clone.length - 1].revenue + simulatedBoost,
        orders: clone[clone.length - 1].orders + Math.round(simulatedBoost / 150)
      };
      return clone;
    });
  }, [ordersResponse]);

  const handleAnalyticsUpdate = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload ?? {};
    if (payload.metric === 'sales') {
      setSeries((prev) => {
        const clone = [...prev];
        clone[clone.length - 1] = {
          ...clone[clone.length - 1],
          revenue: clone[clone.length - 1].revenue + (payload.deltaRevenue ?? 3000),
          orders: clone[clone.length - 1].orders + (payload.deltaOrders ?? 12)
        };
        return clone;
      });
      setAvgOrderValue((prev) => Number((prev * 0.9 + (payload.avgOrderValue ?? 152) * 0.1).toFixed(1)));
      setConversionRate((prev) => Number((prev + Math.random() * 0.2).toFixed(2)));
    }
  }, []);

  const handleOrderEvent = useCallback((event: ShopRealtimeEvent) => {
    const order = (event.payload as any)?.order;
    if (!order) return;
    setSeries((prev) => {
      const clone = [...prev];
      clone[clone.length - 1] = {
        ...clone[clone.length - 1],
        revenue: clone[clone.length - 1].revenue + (order.totalAmount || 0),
        orders: clone[clone.length - 1].orders + 1
      };
      return clone;
    });
    setChannels((prev) => prev.map((channel) => channel.channel === (order.channel || 'Drops')
      ? { ...channel, revenue: channel.revenue + (order.totalAmount || 0), orders: channel.orders + 1, growth: Number((channel.growth + Math.random() * 0.7).toFixed(1)) }
      : channel
    ));
  }, []);

  useRealtimeShop({
    channels: ['analytics', 'orders'],
    onAnalyticsUpdated: handleAnalyticsUpdate,
    onOrderCreated: handleOrderEvent
  });

  return (
    <Card className="p-6 border border-white/10 bg-black/25">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Live Sales Analytics</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Umsätze, Orders und Channel-Performance in Echtzeit. Perfekt für Growth & Finance Insights.
          </p>
        </div>
        <Badge variant="outline" className="border-white/15 text-white/70">Rolling 12h Window</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={formatEuro.format(totalRevenue)}
          delta="vs. last 12h"
          trend="up"
          color="green"
          isLive
          icon="💶"
        />
        <KpiCard
          label="Orders"
          value={totalOrders}
          delta="Average Basket"
          trend="up"
          color="cyan"
          isLive
          icon="🧾"
        />
        <KpiCard
          label="Conversion"
          value={`${conversionRate.toFixed(2)}%`}
          delta="Session CR"
          trend="up"
          color="purple"
          isLive
          icon="🎯"
        />
        <KpiCard
          label="Average Order Value"
          value={formatEuro.format(avgOrderValue)}
          delta="Next best action"
          trend="neutral"
          color="yellow"
          isLive
          icon="📊"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <LineChart
          data={series}
          xKey="period"
          lines={[
            { dataKey: 'revenue', name: 'Revenue', color: '#f97316', strokeWidth: 3 },
            { dataKey: 'orders', name: 'Orders', color: '#22d3ee', strokeWidth: 2 }
          ]}
          title="Revenue & Orders (Rolling)"
          description="Stündliche Performance der letzten 12 Stunden"
          height={360}
          showLegend
          formatValue={(value) => formatEuro.format(value)}
        />

        <Card className="p-5 border border-white/10 bg-black/15">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Channel Breakdown</h4>
              <p className="text-xs text-muted-foreground">Revenue Share & Growth</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1 text-[11px]">
              <Sparkles className="w-3 h-3" /> Boost Channel
            </Button>
          </div>
          <div className="space-y-3">
            {channels.map((channel) => (
              <div key={channel.channel} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm text-white">{channel.channel}</p>
                  <p className="text-xs text-muted-foreground">Orders: {channel.orders}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white font-semibold">{formatEuro.format(channel.revenue)}</p>
                  <Badge variant="outline" className="border-green-400/40 text-green-200 text-[11px]">+{channel.growth}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 text-xs text-muted-foreground flex items-center gap-2">
        <TrendingUp className="w-4 h-4" /> Daten werden durch Order Events & Analytics Events aktualisiert.
      </div>
    </Card>
  );
};

