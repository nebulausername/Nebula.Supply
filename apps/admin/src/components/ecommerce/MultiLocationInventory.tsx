import React, { useCallback, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { useInventory } from '../../lib/api/shopHooks';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { cn } from '../../utils/cn';
import { ArrowLeftRight, Globe, MapPin } from 'lucide-react';

interface LocationSummary {
  id: string;
  name: string;
  stock: number;
  capacity: number;
  utilization: number;
  lowStockItems: number;
  eta?: string;
}

interface TransferItem {
  id: string;
  from: string;
  to: string;
  product: string;
  quantity: number;
  status: 'scheduled' | 'in_transit' | 'completed';
  eta: string;
}

const locationsSeed = [
  { id: 'berlin', name: 'Berlin Hub', capacity: 12000 },
  { id: 'frankfurt', name: 'Frankfurt 3PL', capacity: 9000 },
  { id: 'warsaw', name: 'Warsaw Fulfillment', capacity: 7500 },
  { id: 'rotterdam', name: 'Rotterdam Port', capacity: 10000 },
];

const generateTransfers = (): TransferItem[] => {
  const now = Date.now();
  return [
    {
      id: 'transfer-1',
      from: 'Berlin Hub',
      to: 'Frankfurt 3PL',
      product: 'Crew Drop #41',
      quantity: 420,
      status: 'in_transit',
      eta: new Date(now + 6 * 60 * 60 * 1000).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'transfer-2',
      from: 'Warsaw Fulfillment',
      to: 'Berlin Hub',
      product: 'VIP Capsule',
      quantity: 160,
      status: 'scheduled',
      eta: new Date(now + 12 * 60 * 60 * 1000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    }
  ];
};

export const MultiLocationInventory: React.FC = () => {
  const { data: inventoryResponse } = useInventory();

  const items: any[] = useMemo(() => {
    if (!inventoryResponse) return [];
    if ((inventoryResponse as any).data?.items) return (inventoryResponse as any).data.items;
    if ((inventoryResponse as any).data) return (inventoryResponse as any).data;
    return [];
  }, [inventoryResponse]);

  const [transfers, setTransfers] = useState<TransferItem[]>(generateTransfers);

  const locations: LocationSummary[] = useMemo(() => {
    if (!items.length) return locationsSeed.map((location) => ({
      ...location,
      stock: 0,
      utilization: 0,
      lowStockItems: 0,
      eta: 'N/A'
    }));

    return locationsSeed.map((location, index) => {
      const assignedItems = items.filter((_, itemIndex) => itemIndex % locationsSeed.length === index);
      const stock = assignedItems.reduce((sum, item) => sum + (item.currentStock ?? 0), 0);
      const lowStockItems = assignedItems.filter((item) => item.currentStock <= (item.lowStockThreshold ?? 10)).length;
      const utilization = Math.min(100, Number(((stock / location.capacity) * 100).toFixed(1)));
      return {
        ...location,
        stock,
        lowStockItems,
        utilization,
        eta: utilization > 90 ? 'Needs expansion' : 'Optimized'
      };
    });
  }, [items]);

  const handleInventoryEvent = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload ?? {};
    if (event.type === 'inventory:stock_reserved') {
      setTransfers((prev) => [
        {
          id: `transfer-${Date.now()}`,
          from: 'Berlin Hub',
          to: 'Frankfurt 3PL',
          product: `Order ${payload.orderId}`,
          quantity: payload.quantity,
          status: 'scheduled',
          eta: new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ].slice(0, 10));
    }
  }, []);

  useRealtimeShop({
    channels: ['inventory'],
    onInventoryEvent: handleInventoryEvent
  });

  return (
    <Card className="p-6 border border-white/10 bg-black/25">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Multi-Location Inventory</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Verteilung der Bestände über alle Fulfillment Hubs, inklusive Transfer Pipeline & Kapazitätsauslastung.
          </p>
        </div>
        <Badge variant="outline" className="border-white/15 text-white/70 flex items-center gap-1">
          <Globe className="w-4 h-4" /> 4 Locations
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {locations.map((location) => (
          <div key={location.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{location.name}</p>
              <Badge variant="outline" className={cn('text-[11px]', location.utilization > 90 ? 'border-red-400/40 text-red-200' : 'border-green-400/40 text-green-200')}>
                {location.utilization}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stock: {location.stock} pcs</p>
            <p className="text-xs text-muted-foreground">Capacity: {location.capacity}</p>
            <p className="text-xs text-muted-foreground">Low Stock Items: <span className="text-white/80">{location.lowStockItems}</span></p>
            <p className="text-[11px] text-muted-foreground mt-2">Status: {location.eta}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Card className="p-5 border border-white/10 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Transfer Queue</h4>
              <p className="text-xs text-muted-foreground">Interne Umlagerungen & Nachschub</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1 text-[11px]">
              <ArrowLeftRight className="w-3 h-3" /> Plan Transfer
            </Button>
          </div>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/5 text-xs uppercase text-muted-foreground">
                  <TableHead>Route</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-white">{transfer.from}</span>
                        <span className="text-xs text-muted-foreground">→ {transfer.to}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-white/80">{transfer.product}</TableCell>
                    <TableCell className="text-sm text-white/70">{transfer.quantity}</TableCell>
                    <TableCell className="text-sm text-white/70">
                      <Badge variant="outline" className={cn('text-[11px]', transfer.status === 'completed' ? 'border-green-400/40 text-green-200' : transfer.status === 'in_transit' ? 'border-blue-400/40 text-blue-200' : 'border-yellow-400/40 text-yellow-200')}>
                        {transfer.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-white/60">{transfer.eta}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Transfers werden automatisch aktualisiert, wenn Reservierungen oder Stock Adjustments auftreten.
      </div>
    </Card>
  );
};

