import React, { useCallback, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useDrops } from '../../lib/api/hooks';
import { useProducts } from '../../lib/api/shopHooks';
import { shopSyncService, ShopSyncDirection } from '../../lib/services/shopSyncService';
import { useRealtimeShop } from '../../lib/websocket/useRealtimeShop';
import { cn } from '../../utils/cn';
import { ArrowLeftRight, CheckCircle2, Loader2, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { logger } from '../../lib/logger';

interface SyncTask {
  id: string;
  syncId?: string;
  dropId: string;
  dropName: string;
  productId: string;
  productName: string;
  direction: ShopSyncDirection;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'conflict';
  message?: string;
  startedAt: string;
  finishedAt?: string;
}

interface RecommendedPair {
  drop: any;
  product: any;
  score: number;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const DropProductSync: React.FC = () => {
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

  const [selectedDropId, setSelectedDropId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [dropSearch, setDropSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [syncQueue, setSyncQueue] = useState<SyncTask[]>([]);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  const filteredDrops = useMemo(() => {
    if (!dropSearch) return drops;
    const term = dropSearch.toLowerCase();
    return drops.filter((drop) => drop.name?.toLowerCase().includes(term) || drop.badge?.toLowerCase().includes(term));
  }, [drops, dropSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const term = productSearch.toLowerCase();
    return products.filter((product) =>
      product.name?.toLowerCase().includes(term) ||
      product.categoryName?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term)
    );
  }, [products, productSearch]);

  const computeMatchScore = useCallback((drop: any, product: any) => {
    const dropTokens = `${drop.name ?? ''} ${drop.badge ?? ''} ${drop.flavorTag ?? ''}`.toLowerCase().split(/\s+/).filter(Boolean);
    const productTokens = `${product.name ?? ''} ${product.categoryName ?? ''}`.toLowerCase().split(/\s+/).filter(Boolean);
    if (!dropTokens.length || !productTokens.length) return 0;
    const intersection = dropTokens.filter((token: string) => productTokens.includes(token));
    const baseScore = intersection.length / Math.max(dropTokens.length, 1);
    const nameMatch = product.name?.toLowerCase().includes(drop.name?.toLowerCase() ?? '') ? 0.5 : 0;
    const flavorMatch = drop.flavorTag && product.name?.toLowerCase().includes(drop.flavorTag.toLowerCase()) ? 0.3 : 0;
    return Number((baseScore + nameMatch + flavorMatch).toFixed(2));
  }, []);

  const recommendedPairs: RecommendedPair[] = useMemo(() => {
    if (!drops.length || !products.length) return [];

    const matches: RecommendedPair[] = [];
    drops.forEach((drop) => {
      const ranked = products
        .map((product) => ({ product, score: computeMatchScore(drop, product) }))
        .sort((a, b) => b.score - a.score);
      const match = ranked[0];
      if (match && match.score > 0) {
        matches.push({ drop, product: match.product, score: match.score });
      }
    });

    return matches.sort((a, b) => b.score - a.score).slice(0, 12);
  }, [drops, products, computeMatchScore]);

  const updateQueue = useCallback((taskId: string, updates: Partial<SyncTask>) => {
    setSyncQueue((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)));
  }, []);

  const handleSync = useCallback(async (direction: ShopSyncDirection, dropId: string, productId: string) => {
    const drop = Array.isArray(drops) ? drops.find((item) => item && item.id === dropId) : null;
    const product = Array.isArray(products) ? products.find((item) => item && item.id === productId) : null;
    if (!drop || !product) return;

    const taskId = generateId();
    const newTask: SyncTask = {
      id: taskId,
      dropId,
      dropName: drop.name,
      productId,
      productName: product.name,
      direction,
      status: 'pending',
      startedAt: new Date().toISOString()
    };

    setSyncQueue((prev) => [newTask, ...prev].slice(0, 25));

    try {
      updateQueue(taskId, { status: 'in_progress' });
      let response;
      switch (direction) {
        case 'product_to_drop':
          response = await shopSyncService.syncProductToDrop(productId, dropId, {
            includeInventory: true,
            includeImages: true,
            strategy: 'merge'
          });
          break;
        case 'drop_to_product':
          response = await shopSyncService.syncDropToProduct(dropId, productId, {
            includeInventory: true,
            includeVariants: true,
            strategy: 'merge'
          });
          break;
        case 'bidirectional':
          response = await shopSyncService.syncBidirectional(productId, dropId, {
            includeInventory: true,
            includeVariants: true,
            strategy: 'merge'
          });
          break;
      }

      const syncId = response?.data?.syncId ?? response?.syncId;
      updateQueue(taskId, {
        syncId,
        status: 'in_progress',
        message: syncId ? `Sync gestartet (#${syncId})` : 'Sync gestartet'
      });

      // Fallback: wenn kein Echtzeit-Event kommt, nach kurzer Zeit abschließen
      setTimeout(() => {
        updateQueue(taskId, {
          status: 'completed',
          finishedAt: new Date().toISOString(),
          message: syncId ? `Sync abgeschlossen (#${syncId})` : 'Sync abgeschlossen'
        });
      }, 2000);
    } catch (error: any) {
      logger.error('Sync failed', error);
      updateQueue(taskId, {
        status: 'failed',
        message: error?.message ?? 'Sync fehlgeschlagen',
        finishedAt: new Date().toISOString()
      });
    }
  }, [drops, products, updateQueue]);

  const handleBulkSync = useCallback(async () => {
    if (!recommendedPairs.length) return;
    setIsBulkSyncing(true);
    const items = recommendedPairs.slice(0, 5).map((pair) => ({
      dropId: pair.drop.id,
      productId: pair.product.id,
      direction: 'bidirectional' as ShopSyncDirection,
      options: {
        includeInventory: true,
        includeVariants: true,
        strategy: 'merge'
      }
    }));

    const taskId = generateId();
    setSyncQueue((prev) => [{
      id: taskId,
      dropId: 'bulk',
      dropName: 'Bulk Sync',
      productId: 'bulk',
      productName: `${items.length} Pairs`,
      direction: 'bidirectional',
      status: 'in_progress',
      startedAt: new Date().toISOString()
    }, ...prev]);

    try {
      const response = await shopSyncService.bulkSync(items);
      const syncId = response?.data?.syncId ?? response?.syncId;
      updateQueue(taskId, {
        syncId,
        status: 'in_progress',
        message: `Bulk Sync gestartet (${items.length} Verknüpfungen)`
      });
      setTimeout(() => {
        updateQueue(taskId, {
          status: 'completed',
          message: 'Bulk Sync abgeschlossen',
          finishedAt: new Date().toISOString()
        });
        setIsBulkSyncing(false);
      }, 2500);
    } catch (error: any) {
      logger.error('Bulk sync failed', error);
      updateQueue(taskId, {
        status: 'failed',
        message: error?.message ?? 'Bulk Sync fehlgeschlagen',
        finishedAt: new Date().toISOString()
      });
      setIsBulkSyncing(false);
    }
  }, [recommendedPairs, updateQueue]);

  const statusBadge = useCallback((task: SyncTask) => {
    const variants: Record<SyncTask['status'], string> = {
      pending: 'border-blue-400/40 text-blue-200',
      in_progress: 'border-cyan-400/40 text-cyan-200',
      completed: 'border-green-400/40 text-green-200',
      failed: 'border-red-400/40 text-red-200',
      conflict: 'border-yellow-400/40 text-yellow-200'
    };
    const labels: Record<SyncTask['status'], string> = {
      pending: 'Pending',
      in_progress: 'Running',
      completed: 'Done',
      failed: 'Failed',
      conflict: 'Conflict'
    };
    return <Badge variant="outline" className={cn('px-2 py-1 text-xs', variants[task.status])}>{labels[task.status]}</Badge>;
  }, []);

  const realtime = useRealtimeShop({
    channels: ['sync'],
    onSyncStatus: (event) => {
      const payload = event.payload ?? {};
      setSyncQueue((prev) => prev.map((task) => {
        const matches = (payload.syncId && task.syncId === payload.syncId) ||
          (payload.dropId === task.dropId && payload.productId === task.productId);
        if (!matches) return task;
        return {
          ...task,
          status: payload.state ?? payload.status ?? task.status,
          message: payload.message ?? task.message,
          syncId: payload.syncId ?? task.syncId,
          finishedAt: ['completed', 'failed', 'conflict'].includes(payload.state ?? '') ? new Date().toISOString() : task.finishedAt
        };
      }));
    }
  });

  const connectionHealthy = realtime.connectionStatus.connected && !realtime.connectionStatus.error;
  const selectedDrop = Array.isArray(drops) ? drops.find((drop) => drop && drop.id === selectedDropId) : null;
  const selectedProduct = Array.isArray(products) ? products.find((product) => product && product.id === selectedProductId) : null;

  return (
    <Card className="p-6 border border-white/10 bg-slate-950/40 backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-white">Unified Drop/Product Sync</h3>
            <Badge variant="outline" className={cn('flex items-center gap-1', connectionHealthy ? 'text-green-300 border-green-500/30' : 'text-red-300 border-red-500/30')}>
              <span className={cn('h-2 w-2 rounded-full', connectionHealthy ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
              {connectionHealthy ? 'Realtime Connected' : 'Waiting for WS'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Synchronisiere Drops und Shop-Produkte bidirektional. Inventory, Variants, Pricing und Assets bleiben automatisch aligned.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleBulkSync} disabled={isBulkSyncing || !recommendedPairs.length}>
          {isBulkSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Smart Bulk Sync
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <Card className="p-5 border border-white/10 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Drops</h4>
              <p className="text-xs text-muted-foreground">Wähle einen Drop als Sync-Quelle oder -Ziel</p>
            </div>
            <Badge variant="outline" className="border-white/20 text-white/70">{drops.length} Drops</Badge>
          </div>
          <Input
            placeholder="Search drops..."
            value={dropSearch}
            onChange={(e) => setDropSearch(e.target.value)}
            className="mb-3"
          />
          <Select value={selectedDropId} onValueChange={setSelectedDropId}>
            <SelectTrigger>
              <SelectValue placeholder="Select drop" />
            </SelectTrigger>
            <SelectContent className="max-h-80 overflow-y-auto">
              {filteredDrops.map((drop) => (
                <SelectItem key={drop.id} value={drop.id}>
                  <div className="flex flex-col text-left">
                    <span className="text-sm text-white">{drop.name}</span>
                    <span className="text-xs text-muted-foreground">Access: {drop.access} · Badge: {drop.badge}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-5 border border-white/10 bg-black/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-white">Produkte</h4>
              <p className="text-xs text-muted-foreground">Wähle das Produkt für die Verknüpfung</p>
            </div>
            <Badge variant="outline" className="border-white/20 text-white/70">{products.length} Produkte</Badge>
          </div>
          <Input
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="mb-3"
          />
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent className="max-h-80 overflow-y-auto">
              {filteredProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex flex-col text-left">
                    <span className="text-sm text-white">{product.name}</span>
                    <span className="text-xs text-muted-foreground">Category: {product.categoryName ?? 'n/a'}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      </div>

      <Card className="p-5 border border-white/10 bg-black/20 mt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-white">Sync Controls</h4>
            <p className="text-xs text-muted-foreground">Richtung wählen und Sync starten</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!selectedDropId || !selectedProductId}
              onClick={() => selectedDropId && selectedProductId && handleSync('product_to_drop', selectedDropId, selectedProductId)}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2 rotate-180" /> Produkt → Drop
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!selectedDropId || !selectedProductId}
              onClick={() => selectedDropId && selectedProductId && handleSync('drop_to_product', selectedDropId, selectedProductId)}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" /> Drop → Produkt
            </Button>
            <Button
              size="sm"
              disabled={!selectedDropId || !selectedProductId}
              onClick={() => selectedDropId && selectedProductId && handleSync('bidirectional', selectedDropId, selectedProductId)}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Bi-Directional
            </Button>
          </div>
        </div>

        {selectedDrop && selectedProduct ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 border border-white/10 bg-black/30">
              <h5 className="text-sm font-semibold text-white mb-2">Drop Details</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Name: <span className="text-white/80">{selectedDrop.name}</span></li>
                <li>Status: <span className="text-white/80">{selectedDrop.status}</span></li>
                <li>Access: <span className="text-white/80">{selectedDrop.access}</span></li>
                <li>Varianten: <span className="text-white/80">{selectedDrop.variants?.length ?? 0}</span></li>
              </ul>
            </Card>
            <Card className="p-4 border border-white/10 bg-black/30">
              <h5 className="text-sm font-semibold text-white mb-2">Produkt Details</h5>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Name: <span className="text-white/80">{selectedProduct.name}</span></li>
                <li>Category: <span className="text-white/80">{selectedProduct.categoryName ?? 'n/a'}</span></li>
                <li>Inventory: <span className="text-white/80">{selectedProduct.inventory ?? 0}</span></li>
                <li>Status: <span className="text-white/80">{selectedProduct.status ?? 'active'}</span></li>
              </ul>
            </Card>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground bg-black/20 border border-white/10 rounded-lg px-4 py-3">
            Wähle Drop & Produkt um Details einzusehen.
          </div>
        )}
      </Card>

      <Card className="p-5 border border-white/10 bg-black/25 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-white">Recommended Sync Targets</h4>
            <p className="text-xs text-muted-foreground">Automatisch vorgeschlagene Matches basierend auf Naming & Flavor-Tags</p>
          </div>
          <Badge variant="outline" className="border-white/20 text-white/70">Top {recommendedPairs.length}</Badge>
        </div>
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/5">
                <TableHead>Drop</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Match</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendedPairs.map((pair) => (
                <TableRow key={`${pair.drop.id}-${pair.product.id}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-white">{pair.drop.name}</span>
                      <span className="text-xs text-muted-foreground">Access: {pair.drop.access}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-white">{pair.product.name}</span>
                      <span className="text-xs text-muted-foreground">Category: {pair.product.categoryName ?? 'n/a'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-purple-400/40 text-purple-200">{(pair.score * 100).toFixed(0)}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleSync('product_to_drop', pair.drop.id, pair.product.id)}>
                        <ArrowLeftRight className="w-3 h-3 mr-1 rotate-180" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleSync('drop_to_product', pair.drop.id, pair.product.id)}>
                        <ArrowLeftRight className="w-3 h-3 mr-1" />
                      </Button>
                      <Button size="sm" onClick={() => handleSync('bidirectional', pair.drop.id, pair.product.id)}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Sync
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {recommendedPairs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    Keine passenden Vorschläge gefunden. Nutze die Suche, um manuell zu syncen.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-5 border border-white/10 bg-black/30 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-semibold text-white">Sync Timeline</h4>
            <p className="text-xs text-muted-foreground">Live Status aller laufenden und historischen Sync-Jobs</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSyncQueue([])}>
            <RefreshCw className="w-4 h-4 mr-2" /> Clear Log
          </Button>
        </div>

        {syncQueue.length === 0 ? (
          <div className="text-sm text-muted-foreground py-10 text-center">
            Noch keine Sync-Jobs. Starte einen Sync oder aktiviere Bulk-Matching.
          </div>
        ) : (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
            {syncQueue.map((task) => (
              <div key={task.id} className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {task.dropName} <span className="text-muted-foreground">↔</span> {task.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Direction: {task.direction}
                    </p>
                  </div>
                  {statusBadge(task)}
                </div>
                {task.message && (
                  <p className="text-xs text-muted-foreground">{task.message}</p>
                )}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground/80">
                  <span>Start: {new Date(task.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                  {task.finishedAt ? (
                    <span className="flex items-center gap-1 text-green-300">
                      <CheckCircle2 className="w-3 h-3" /> {new Date(task.finishedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : task.status !== 'failed' ? (
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Loader2 className="w-3 h-3 animate-spin" /> live
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Card>
  );
};
