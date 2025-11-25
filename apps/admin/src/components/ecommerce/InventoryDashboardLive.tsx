import React, { useCallback, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { KpiCard } from '../ui/KpiCard';
import { LineChart } from '../ui/charts/LineChart';
import { useInventory } from '../../lib/api/shopHooks';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { Package, Search, PlaneTakeoff, Warehouse } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MovementPoint {
  period: string;
  inbound: number;
  outbound: number;
  net: number;
}

interface SupplyEvent {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'inbound' | 'outbound' | 'alert';
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildMovementSeed = () => {
  const now = new Date();
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
    const inbound = 800 + Math.round(Math.random() * 200);
    const outbound = 650 + Math.round(Math.random() * 250);
    return {
      period: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      inbound,
      outbound,
      net: inbound - outbound
    };
  });
};

const InventoryDashboardLiveComponent: React.FC = () => {
  const { data: inventoryResponse } = useInventory();
  const items: any[] = useMemo(() => {
    if (!inventoryResponse) return [];
    if ((inventoryResponse as any).data?.items) return (inventoryResponse as any).data.items;
    if ((inventoryResponse as any).data) return (inventoryResponse as any).data;
    return [];
  }, [inventoryResponse]);

  const [movementData, setMovementData] = useState<MovementPoint[]>(buildMovementSeed);
  const [supplyEvents, setSupplyEvents] = useState<SupplyEvent[]>([]);
  const [fulfillmentRate, setFulfillmentRate] = useState(96);
  const [openTransfers, setOpenTransfers] = useState(12);
  const [reorderAlerts, setReorderAlerts] = useState(5);

  const totalUnits = items.reduce((sum, item) => sum + (item.currentStock ?? 0), 0);

  const pushEvent = useCallback((event: SupplyEvent) => {
    setSupplyEvents((prev) => [event, ...prev].slice(0, 20));
  }, []);

  const handleInventoryEvent = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload ?? {};
    switch (event.type) {
      case 'inventory:stock_adjusted': {
        setMovementData((prev) => {
          const clone = [...prev];
          clone[clone.length - 1] = {
            ...clone[clone.length - 1],
            inbound: clone[clone.length - 1].inbound + (payload.adjustment > 0 ? payload.adjustment : 0),
            outbound: clone[clone.length - 1].outbound + (payload.adjustment < 0 ? Math.abs(payload.adjustment) : 0),
          };
          clone[clone.length - 1].net = clone[clone.length - 1].inbound - clone[clone.length - 1].outbound;
          return clone;
        });
        pushEvent({
          id: generateId(),
          title: 'Stock Adjusted',
          message: `Product ${payload.productId} changed by ${payload.adjustment}`,
          timestamp: new Date().toISOString(),
          type: payload.adjustment >= 0 ? 'inbound' : 'outbound'
        });
        break;
      }
      case 'inventory:low_stock_alert':
        setReorderAlerts((prev) => prev + 1);
        pushEvent({
          id: generateId(),
          title: 'Low Stock Alert',
          message: `Product ${payload.productId} under threshold`,
          timestamp: new Date().toISOString(),
          type: 'alert'
        });
        break;
      case 'inventory:stock_reserved':
        setFulfillmentRate((prev) => Math.max(80, Math.min(100, prev - 0.2)));
        setOpenTransfers((prev) => prev + 1);
        pushEvent({
          id: generateId(),
          title: 'Stock Reserved',
          message: `${payload.quantity} units reserved for order ${payload.orderId}`,
          timestamp: new Date().toISOString(),
          type: 'outbound'
        });
        break;
    }
  }, [pushEvent]);

  useRealtimeShop({
    channels: ['inventory'],
    onInventoryEvent: handleInventoryEvent
  });

  return (
    <Card className="p-6 border border-white/10 bg-black/25">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Inventory Control Center</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Überblick über Bestände, Fulfillment und Supply Chain – komplett in Echtzeit.
          </p>
        </div>
        <Badge variant="outline" className="border-white/15 text-white/70">{items.length} SKUs monitoriert</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Units"
          value={totalUnits}
          delta="Across all locations"
          trend="up"
          color="blue"
          isLive
          icon="📦"
        />
        <KpiCard
          label="Open Transfers"
          value={openTransfers}
          delta="Awaiting fulfillment"
          trend="neutral"
          color="yellow"
          isLive
          icon="🚚"
        />
        <KpiCard
          label="Reorder Alerts"
          value={reorderAlerts}
          delta="Supply attention"
          trend={reorderAlerts > 5 ? 'down' : 'neutral'}
          color="red"
          isLive
          icon="⚠️"
        />
        <KpiCard
          label="Fulfillment Rate"
          value={`${fulfillmentRate.toFixed(1)}%`}
          delta="SLA 96%+"
          trend="up"
          color="green"
          isLive
          icon="✅"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <LineChart
          data={movementData}
          xKey="period"
          lines={[
            { dataKey: 'inbound', name: 'Inbound', color: '#22d3ee', strokeWidth: 3 },
            { dataKey: 'outbound', name: 'Outbound', color: '#f97316', strokeWidth: 3 },
            { dataKey: 'net', name: 'Net', color: '#a855f7', strokeWidth: 2 }
          ]}
          title="Stock Movements (7 Tage)"
          description="Vergleich von Inbound/Outbound Shipments"
          height={360}
          showLegend
        />

        <Card className="p-5 border border-white/10 bg-black/15">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-cyan-300" />
            <div>
              <h4 className="text-lg font-semibold text-white">Supply Chain Activity</h4>
              <p className="text-xs text-muted-foreground">Live Feed zu Bewegungen & Alerts</p>
            </div>
          </div>
          {supplyEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">Noch keine Events erfasst.</div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
              {supplyEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <div className={cn('mt-1 h-2 w-2 rounded-full', event.type === 'alert' ? 'bg-red-400' : event.type === 'inbound' ? 'bg-cyan-300' : 'bg-orange-300')} />
                  <div>
                    <p className="text-sm text-white">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(event.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="p-4 border border-white/10 bg-black/30">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-blue-300" /> Fulfillment Hubs
          </h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Berlin Central</span>
              <span className="text-white font-medium">45% capacity</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Frankfurt 3PL</span>
              <span className="text-white font-medium">30% capacity</span>
            </div>
            <div className="flex items-center justify-between">
              <span>EU Fulfillment</span>
              <span className="text-white font-medium">25% capacity</span>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-white/10 bg-black/30">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <PlaneTakeoff className="w-4 h-4 text-emerald-300" /> Incoming Shipments
          </h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>CN → EU (Sea)</span>
              <span className="text-white font-medium">ETA 6d</span>
            </div>
            <div className="flex items-center justify-between">
              <span>PL → DE (Truck)</span>
              <span className="text-white font-medium">ETA 2d</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Local Supplier</span>
              <span className="text-white font-medium">ETA 12h</span>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-white/10 bg-black/30">
          <h4 className="text-sm font-semibold text-white mb-3">Next Steps</h4>
          <div className="flex flex-col gap-2 text-xs">
            <Button size="sm" variant="outline" className="justify-start gap-2 text-[11px]">
              🚀 Trigger Cross-Dock Sync
            </Button>
            <Button size="sm" variant="outline" className="justify-start gap-2 text-[11px]">
              📦 Reserve Stock for Drop
            </Button>
            <Button size="sm" variant="outline" className="justify-start gap-2 text-[11px]">
              🔄 Reconcile 3PL Reports
            </Button>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export const InventoryDashboardLive = React.memo(InventoryDashboardLiveComponent);
