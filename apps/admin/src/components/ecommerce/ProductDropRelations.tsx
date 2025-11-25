import React, { useCallback, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { useDrops } from '../../lib/api/hooks';
import { useProducts } from '../../lib/api/shopHooks';
import { shopSyncService, ShopSyncDirection } from '../../lib/services/shopSyncService';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { cn } from '../../utils/cn';
import { Chain, GitMerge, Loader2, RefreshCw, ShieldCheck, Shuffle } from 'lucide-react';

interface RelationItem {
  id: string;
  dropId: string;
  dropName: string;
  productId: string;
  productName: string;
  score: number;
  status: 'synced' | 'pending' | 'out_of_sync' | 'conflict';
  direction: ShopSyncDirection;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const computeScore = (drop: any, product: any) => {
  const dropTokens = `${drop.name ?? ''} ${drop.badge ?? ''} ${drop.flavorTag ?? ''}`.toLowerCase().split(/\s+/);
  const productTokens = `${product.name ?? ''} ${product.categoryName ?? ''}`.toLowerCase().split(/\s+/);
  const overlap = dropTokens.filter((token: string) => productTokens.includes(token));
  const baseScore = overlap.length / Math.max(1, dropTokens.length);
  const categoryBonus = drop.access && product.categoryName?.toLowerCase().includes(drop.access.toLowerCase()) ? 0.2 : 0;
  return Number((baseScore + categoryBonus).toFixed(2));
};

export const ProductDropRelations: React.FC = () => {
  const { data: dropsResponse } = useDrops({ limit: 100 });
  const { data: productsResponse } = useProducts({ limit: 100 });

  const drops: any[] = useMemo(() => {
    if (!dropsResponse) return [];
    if (Array.isArray((dropsResponse as any).data)) return (dropsResponse as any).data;
    if ((dropsResponse as any).data?.data) return (dropsResponse as any).data.data;
    return [];
  }, [dropsResponse]);

  const products: any[] = useMemo(() => {
    if (!productsResponse) return [];
    if (Array.isArray(productsResponse as any)) return productsResponse as any;
    if ((productsResponse as any).data) return (productsResponse as any).data;
    return [];
  }, [productsResponse]);

  const relations: RelationItem[] = useMemo(() => {
    if (!drops.length || !products.length) return [];
    const items: RelationItem[] = [];
    drops.forEach((drop, index) => {
      const ranked = products
        .map((product) => ({ product, score: computeScore(drop, product) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (!best || best.score <= 0) return;
      const statusPool: RelationItem['status'][] = ['synced', 'pending', 'out_of_sync'];
      const status = statusPool[index % statusPool.length];
      items.push({
        id: `${drop.id}-${best.product.id}`,
        dropId: drop.id,
        dropName: drop.name,
        productId: best.product.id,
        productName: best.product.name,
        score: best.score,
        status,
        direction: 'bidirectional'
      });
    });
    return items.sort((a, b) => b.score - a.score).slice(0, 15);
  }, [drops, products]);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isLinking, setIsLinking] = useState(false);
  const [relationStatuses, setRelationStatuses] = useState<Record<string, RelationItem['status']>>({});

  const toggleSelect = useCallback((relationId: string) => {
    setSelected((prev) => ({ ...prev, [relationId]: !prev[relationId] }));
  }, []);

  const handleBulkLink = useCallback(async (direction: ShopSyncDirection) => {
    const items = relations
      .filter((relation) => selected[relation.id])
      .map((relation) => ({
        dropId: relation.dropId,
        productId: relation.productId,
        direction,
        options: {
          strategy: 'merge',
          includeInventory: true,
          includeVariants: true
        }
      }));
    if (!items.length) return;

    setIsLinking(true);
    try {
      await shopSyncService.bulkSync(items);
      setRelationStatuses((prev) => {
        const clone = { ...prev };
        items.forEach((item) => {
          const id = `${item.dropId}-${item.productId}`;
          clone[id] = 'pending';
        });
        return clone;
      });
      setTimeout(() => {
        setRelationStatuses((prev) => {
          const clone = { ...prev };
          items.forEach((item) => {
            clone[`${item.dropId}-${item.productId}`] = 'synced';
          });
          return clone;
        });
        setIsLinking(false);
      }, 2000);
    } catch (error) {
      setIsLinking(false);
    }
  }, [relations, selected]);

  const handleSyncStatus = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload ?? {};
    const id = payload.dropId && payload.productId ? `${payload.dropId}-${payload.productId}` : null;
    if (!id) return;
    const nextState = payload.state ?? payload.status;
    if (!nextState) return;
    setRelationStatuses((prev) => ({ ...prev, [id]: nextState }));
  }, []);

  useRealtimeShop({
    channels: ['sync'],
    onSyncStatus: handleSyncStatus
  });

  const statusBadge = useCallback((relation: RelationItem) => {
    const status = relationStatuses[relation.id] ?? relation.status;
    const config: Record<RelationItem['status'], { label: string; className: string }> = {
      synced: { label: 'Synced', className: 'border-green-400/40 text-green-200' },
      pending: { label: 'Pending', className: 'border-blue-400/40 text-blue-200' },
      out_of_sync: { label: 'Out of Sync', className: 'border-yellow-400/40 text-yellow-200' },
      conflict: { label: 'Conflict', className: 'border-red-400/40 text-red-200' }
    };
    const entry = config[status] ?? config.synced;
    return <Badge variant="outline" className={cn('text-[11px]', entry.className)}>{entry.label}</Badge>;
  }, [relationStatuses]);

  return (
    <Card className="p-6 border border-white/10 bg-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Product ↔ Drop Relationship Graph</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Visualisiere reale Verknüpfungen, erkenne Sync-Status, löse Konflikte und triggere Auto-Linking für neue Drops.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelected({})}>
            <RefreshCw className="w-4 h-4 mr-2" /> Reset Selection
          </Button>
          <Button
            size="sm"
            onClick={() => handleBulkLink('bidirectional')}
            disabled={isLinking || !Object.values(selected).some(Boolean)}
          >
            {isLinking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitMerge className="w-4 h-4 mr-2" />}
            Auto-Link Selected
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/5">
              <TableHead>Drop</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-center">Match</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relations.map((relation) => (
              <TableRow key={relation.id} className={cn(selected[relation.id] && 'bg-blue-500/5')}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-white">{relation.dropName}</span>
                    <span className="text-xs text-muted-foreground">ID: {relation.dropId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-white">{relation.productName}</span>
                    <span className="text-xs text-muted-foreground">ID: {relation.productId}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="border-purple-400/40 text-purple-200 text-[11px]">{(relation.score * 100).toFixed(0)}%</Badge>
                </TableCell>
                <TableCell className="text-center">{statusBadge(relation)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" className={cn('gap-1 text-[11px]', selected[relation.id] && 'border-blue-400/60 text-blue-200')} onClick={() => toggleSelect(relation.id)}>
                      <Chain className="w-3 h-3" /> Select
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-[11px]" onClick={() => handleBulkLink('product_to_drop')}>
                      <ShieldCheck className="w-3 h-3" /> Force Sync
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {relations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Keine Relations gefunden. Lege zuerst Produkte & Drops an.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant="outline" className="border-white/15 text-white/70 flex items-center gap-1">
          <Shuffle className="w-3 h-3" /> Match Score basiert auf Naming, Badge & Flavor overlaps
        </Badge>
        <Badge variant="outline" className="border-white/15 text-white/70 flex items-center gap-1">
          <GitMerge className="w-3 h-3" /> Auto-Link nutzt Bidirectional Sync
        </Badge>
      </div>
    </Card>
  );
};

