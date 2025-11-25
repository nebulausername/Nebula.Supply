import React, { useCallback, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { useInventory, useConfigureAutoReorder } from '../../lib/api/shopHooks';
import { cn } from '../../utils/cn';
import { Loader2, Power, Truck } from 'lucide-react';

interface AutomationRule {
  productId: string;
  enabled: boolean;
  reorderPoint: number;
  reorderQuantity: number;
  supplier?: string;
}

export const StockAutomation: React.FC = () => {
  const { data: inventoryResponse } = useInventory();
  const configureAutoReorder = useConfigureAutoReorder();

  const items: any[] = useMemo(() => {
    if (!inventoryResponse) return [];
    if ((inventoryResponse as any).data?.items) return (inventoryResponse as any).data.items;
    if ((inventoryResponse as any).data) return (inventoryResponse as any).data;
    return [];
  }, [inventoryResponse]);

  const [rules, setRules] = useState<Record<string, AutomationRule>>(() => {
    const map: Record<string, AutomationRule> = {};
    items.forEach((item) => {
      map[item.productId] = {
        productId: item.productId,
        enabled: Math.random() > 0.4,
        reorderPoint: item.lowStockThreshold ?? 10,
        reorderQuantity: 50,
        supplier: 'Default Supplier'
      };
    });
    return map;
  });

  React.useEffect(() => {
    setRules((prev) => {
      const map = { ...prev };
      items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = {
            productId: item.productId,
            enabled: Math.random() > 0.4,
            reorderPoint: item.lowStockThreshold ?? 10,
            reorderQuantity: 50,
            supplier: 'Default Supplier'
          };
        }
      });
      return map;
    });
  }, [items]);

  const toggleAutomation = useCallback((productId: string) => {
    setRules((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const next = { ...prev, [productId]: { ...current, enabled: !current.enabled } };
      configureAutoReorder.mutate({
        productId,
        enabled: !current.enabled,
        reorderPoint: current.reorderPoint,
        reorderQuantity: current.reorderQuantity,
        supplier: current.supplier
      });
      return next;
    });
  }, [configureAutoReorder]);

  const adjustRule = useCallback((productId: string, field: keyof AutomationRule, value: number | string) => {
    setRules((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const nextValue = field === 'reorderPoint' || field === 'reorderQuantity'
        ? Math.max(1, Number(value))
        : value;
      const updatedRule = { ...current, [field]: nextValue } as AutomationRule;
      configureAutoReorder.mutate({
        productId,
        enabled: updatedRule.enabled,
        reorderPoint: updatedRule.reorderPoint,
        reorderQuantity: updatedRule.reorderQuantity,
        supplier: updatedRule.supplier
      });
      return { ...prev, [productId]: updatedRule };
    });
  }, [configureAutoReorder]);

  return (
    <Card className="p-6 border border-white/10 bg-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold text-white">Automated Stock Management</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            Definiere Regeln für automatische Nachbestellungen, Lieferanten & Reorder Points.
          </p>
        </div>
        <Badge variant="outline" className="border-white/15 text-white/70 flex items-center gap-1">
          <Truck className="w-4 h-4" /> Auto Reorder Active
        </Badge>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/5">
              <TableHead>Produkt</TableHead>
              <TableHead>Reorder Point</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-center">Automation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 12).map((item) => {
              const rule = rules[item.productId];
              if (!rule) return null;
              return (
                <TableRow key={item.productId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-white">{item.productName}</span>
                      <span className="text-xs text-muted-foreground">Stock: {item.currentStock}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-white/80">
                    <input
                      type="number"
                      value={rule.reorderPoint}
                      onChange={(e) => adjustRule(item.productId, 'reorderPoint', Number(e.target.value))}
                      className="w-20 rounded-md border border-white/20 bg-black/25 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-white/80">
                    <input
                      type="number"
                      value={rule.reorderQuantity}
                      onChange={(e) => adjustRule(item.productId, 'reorderQuantity', Number(e.target.value))}
                      className="w-24 rounded-md border border-white/20 bg-black/25 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-white/80">
                    <input
                      type="text"
                      value={rule.supplier ?? ''}
                      onChange={(e) => adjustRule(item.productId, 'supplier', e.target.value)}
                      className="w-32 rounded-md border border-white/20 bg-black/25 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      className={cn('inline-flex items-center gap-1 text-sm transition-colors', rule.enabled ? 'text-green-300' : 'text-white/60')}
                      onClick={() => toggleAutomation(item.productId)}
                    >
                      {rule.enabled ? (
                        <Power className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4 opacity-50" />
                      )}
                      {rule.enabled ? 'Active' : 'Disabled'}
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Keine Inventory Daten verfügbar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {configureAutoReorder.isPending && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving automation rule…
        </div>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        Änderungen werden sofort gespeichert und synchronisiert. Lieferanten kannst du später in Supply Chain Settings konfigurieren.
      </div>
    </Card>
  );
};
