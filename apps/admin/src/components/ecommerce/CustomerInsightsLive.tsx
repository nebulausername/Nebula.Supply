import React, { useCallback, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { useOrders } from '../../lib/api/hooks';
import { Users, HeartPulse, ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SegmentMetric {
  id: string;
  label: string;
  customers: number;
  trend: number;
  revenueShare: number;
}

interface InsightEvent {
  id: string;
  message: string;
  timestamp: string;
}

const generateSegments = (): SegmentMetric[] => [
  { id: 'loyal', label: 'Loyal Crew', customers: 1120, trend: +6.4, revenueShare: 52 },
  { id: 'newcomer', label: 'Newcomer', customers: 860, trend: +12.3, revenueShare: 21 },
  { id: 'atRisk', label: 'At Risk', customers: 310, trend: -4.2, revenueShare: 9 },
  { id: 'vip', label: 'VIP / Stammkunde', customers: 190, trend: +8.9, revenueShare: 18 }
];

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const CustomerInsightsLive: React.FC = () => {
  const { data: ordersResponse } = useOrders({ limit: 50 });
  const [segments, setSegments] = useState<SegmentMetric[]>(generateSegments);
  const [insights, setInsights] = useState<InsightEvent[]>([]);

  React.useEffect(() => {
    if (!ordersResponse?.data?.data) return;
    setSegments((prev) => prev.map((segment) => segment.id === 'newcomer'
      ? { ...segment, customers: segment.customers + Math.round(Math.random() * 12), trend: segment.trend + 0.4 }
      : segment
    ));
  }, [ordersResponse]);

  const pushInsight = useCallback((message: string) => {
    setInsights((prev) => [{ id: generateId(), message, timestamp: new Date().toISOString() }, ...prev].slice(0, 15));
  }, []);

  const handleCustomerEvent = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload ?? {};
    switch (event.type) {
      case 'order:created': {
        const segmentId = payload.customerSegment ?? (Math.random() > 0.6 ? 'loyal' : 'newcomer');
        setSegments((prev) => prev.map((segment) => segment.id === segmentId
          ? { ...segment, customers: segment.customers + 1, revenueShare: Number((segment.revenueShare + 0.2).toFixed(1)) }
          : segment
        ));
        pushInsight(`Neue Order aus Segment ${segmentId.toUpperCase()}`);
        break;
      }
      case 'analytics:updated':
        if (payload.metric === 'retention') {
          setSegments((prev) => prev.map((segment) => segment.id === 'atRisk'
            ? { ...segment, trend: Number((segment.trend + 0.6).toFixed(1)), customers: Math.max(0, segment.customers - 3) }
            : segment
          ));
          pushInsight('Retention Kampagne aktiv – At Risk Segment reduziert.');
        }
        break;
    }
  }, [pushInsight]);

  useRealtimeShop({
    channels: ['analytics', 'orders'],
    onOrderCreated: handleCustomerEvent,
    onAnalyticsUpdated: handleCustomerEvent
  });

  return (
    <Card className="p-6 border border-white/10 bg-black/25">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Customer Insights & Cohorts</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Live-Überblick über Segmente, Loyalität und Churn-Risiken. Perfekt für CRM & Growth Teams.
          </p>
        </div>
        <Badge variant="outline" className="border-white/15 text-white/70 flex items-center gap-1">
          <Users className="w-4 h-4" /> {segments.reduce((sum, segment) => sum + segment.customers, 0)} Customers
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {segments.map((segment) => (
          <div key={segment.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{segment.label}</p>
              <Badge variant="outline" className={cn('text-[11px]', segment.trend >= 0 ? 'border-green-400/40 text-green-200' : 'border-red-400/40 text-red-200')}>
                {segment.trend >= 0 ? '+' : ''}{segment.trend}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Customers: {segment.customers}</p>
            <p className="text-xs text-muted-foreground">Revenue Share: {segment.revenueShare}%</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <Card className="p-5 border border-white/10 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Segment Actions</h4>
              <p className="text-xs text-muted-foreground">Kontextuelle Aktionen je Kundensegment</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1 text-[11px]">
              <HeartPulse className="w-3 h-3" /> Launch Retention Flow
            </Button>
          </div>
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <span>VIP / Stammkunde</span>
              <Badge variant="outline" className="border-purple-400/40 text-purple-200 text-[11px]">Personalized Drop Access</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <span>Loyal Crew</span>
              <Badge variant="outline" className="border-green-400/40 text-green-200 text-[11px]">Double Coins Weekend</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <span>At Risk</span>
              <Badge variant="outline" className="border-red-400/40 text-red-200 text-[11px]">Reactivation Bundle</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-white/10 bg-black/15">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-4 h-4 text-green-300" />
            <div>
              <h4 className="text-lg font-semibold text-white">Live Insights</h4>
              <p className="text-xs text-muted-foreground">CRM-relevante Ereignisse</p>
            </div>
          </div>
          {insights.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">Noch keine Insights</div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
              {insights.map((insight) => (
                <div key={insight.id} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm text-white">{insight.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{new Date(insight.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Card>
  );
};
