import React, { useCallback, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { useDrops } from '../../lib/api/hooks';
import { useCategories } from '../../lib/api/shopHooks';
import { useProducts } from '../../lib/api/shopHooks';
import { useRealtimeShop, ShopRealtimeEvent } from '../../lib/websocket/useRealtimeShop';
import { shopSyncService } from '../../lib/services/shopSyncService';
import { cn } from '../../utils/cn';
import { GitMerge, Loader2, ShieldAlert } from 'lucide-react';

interface SyncRow {
  categoryId: string;
  categoryName: string;
  productCount: number;
  dropCount: number;
  syncStatus: 'aligned' | 'warning' | 'pending';
  suggestions?: string;
}

const statusConfig: Record<SyncRow['syncStatus'], { label: string; className: string }> = {
  aligned: { label: 'Aligned', className: 'border-green-400/40 text-green-200' },
  warning: { label: 'Mismatch', className: 'border-yellow-400/40 text-yellow-200' },
  pending: { label: 'Pending', className: 'border-blue-400/40 text-blue-200' }
};

const computeRows = (categories: any[], products: any[], drops: any[]): SyncRow[] => {
  return categories.map((category) => {
    const productMatches = products.filter((product) => product.categoryName?.toLowerCase() === category.name?.toLowerCase());
    const dropMatches = drops.filter((drop) => drop.badge?.toLowerCase() === category.name?.toLowerCase() || drop.name?.toLowerCase().includes(category.name?.toLowerCase()));
    const syncStatus: SyncRow['syncStatus'] = productMatches.length === dropMatches.length ? 'aligned' : productMatches.length > dropMatches.length ? 'warning' : 'pending';
    const suggestions = syncStatus !== 'aligned'
      ? `Zuordnung optimieren: ${Math.abs(productMatches.length - dropMatches.length)} Elemente`
      : undefined;
    return {
      categoryId: category.id,
      categoryName: category.name,
      productCount: productMatches.length,
      dropCount: dropMatches.length,
      syncStatus,
      suggestions
    };
  });
};

export const CategorySyncMatrix: React.FC = () => {
  const { data: categoriesResponse } = useCategories();
  const { data: productsResponse } = useProducts({ limit: 200 });
  const { data: dropsResponse } = useDrops({ limit: 200 });

  const categories: any[] = useMemo(() => {
    if (!categoriesResponse) return [];
    if (Array.isArray(categoriesResponse as any)) return categoriesResponse as any;
    if ((categoriesResponse as any).data) return (categoriesResponse as any).data;
    return [];
  }, [categoriesResponse]);

  const products: any[] = useMemo(() => {
    if (!productsResponse) return [];
    if (Array.isArray(productsResponse as any)) return productsResponse as any;
    if ((productsResponse as any).data) return (productsResponse as any).data;
    return [];
  }, [productsResponse]);

  const drops: any[] = useMemo(() => {
    if (!dropsResponse) return [];
    if ((dropsResponse as any).data?.data) return (dropsResponse as any).data.data;
    if ((dropsResponse as any).data) return (dropsResponse as any).data;
    return [];
  }, [dropsResponse]);

  const [rows, setRows] = useState<SyncRow[]>(() => computeRows(categories, products, drops));
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setRows(computeRows(categories, products, drops));
  }, [categories, products, drops]);

  const triggerSync = useCallback(async (row: SyncRow) => {
    setSyncingIds((prev) => ({ ...prev, [row.categoryId]: true }));
    try {
      await shopSyncService.bulkSync([
        {
          dropId: row.categoryId, // conceptual placeholder
          productId: row.categoryId,
          direction: 'bidirectional',
          options: { strategy: 'merge', includeInventory: true }
        }
      ]);
      setTimeout(() => {
        setRows((prev) => prev.map((item) => item.categoryId === row.categoryId ? { ...item, syncStatus: 'aligned', suggestions: undefined } : item));
        setSyncingIds((prev) => ({ ...prev, [row.categoryId]: false }));
      }, 1200);
    } catch (error) {
      setSyncingIds((prev) => ({ ...prev, [row.categoryId]: false }));
    }
  }, []);

  const handleSyncStatus = useCallback((event: ShopRealtimeEvent) => {
    const payload = event.payload ?? {};
    if (!payload.categoryId) return;
    setRows((prev) => prev.map((row) => row.categoryId === payload.categoryId ? { ...row, syncStatus: payload.state ?? 'aligned', suggestions: undefined } : row));
  }, []);

  useRealtimeShop({
    channels: ['sync'],
    onSyncStatus: handleSyncStatus
  });

  return (
    <Card className="p-6 border border-white/10 bg-black/25">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Category Sync Matrix</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Vergleiche Kategorien mit verknüpften Produkten & Drops. Erkenne Gaps und triggere Sync Jobs in Echtzeit.
          </p>
        </div>
        <Badge variant="outline" className="border-white/15 text-white/70">{rows.length} Kategorien</Badge>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/5">
              <TableHead>Kategorie</TableHead>
              <TableHead className="text-center">Produkte</TableHead>
              <TableHead className="text-center">Drops</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.categoryId}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-white">{row.categoryName}</span>
                    {row.suggestions && <span className="text-xs text-yellow-200">{row.suggestions}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-center text-white/80">{row.productCount}</TableCell>
                <TableCell className="text-center text-white/80">{row.dropCount}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={cn('text-[11px]', statusConfig[row.syncStatus].className)}>
                    {statusConfig[row.syncStatus].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-[11px]"
                      onClick={() => triggerSync(row)}
                      disabled={syncingIds[row.categoryId]}
                    >
                      {syncingIds[row.categoryId] ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <GitMerge className="w-3 h-3 mr-1" />}
                      Sync
                    </Button>
                    {row.syncStatus === 'warning' && (
                      <Badge variant="outline" className="border-yellow-400/40 text-yellow-200 text-[11px] flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Review
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Keine Kategorien geladen.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
