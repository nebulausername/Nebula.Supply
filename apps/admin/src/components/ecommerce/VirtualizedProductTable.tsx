import React, { memo, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { Product } from '../../lib/api/ecommerce';
import { TableRow, TableCell } from '../ui/Table';
import { InlineEdit } from '../ui/InlineEdit';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { GripVertical, Edit, Package, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';

interface VirtualizedProductTableProps {
  products: Product[];
  selectedProducts: Set<string>;
  onSelect: (productId: string, checked: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onUpdate: (productId: string, field: string, value: any) => void;
  draggedProductId: string | null;
  dragOverIndex: number | null;
  isReordering: boolean;
  onDragStart: (e: React.DragEvent, productId: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  containerHeight: number;
  processedProducts: Product[];
}

const ROW_HEIGHT = 80; // Approximate row height

export const VirtualizedProductTable = memo(({
  products,
  selectedProducts,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onAdjustStock,
  onUpdate,
  draggedProductId,
  dragOverIndex,
  isReordering,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  containerHeight,
  processedProducts,
}: VirtualizedProductTableProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const lastScrollTop = useRef(0);

  const totalHeight = products.length * ROW_HEIGHT;

  // Optimized scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    
    if (Math.abs(currentScrollTop - lastScrollTop.current) < 5) {
      return;
    }
    
    lastScrollTop.current = currentScrollTop;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(currentScrollTop);
    });
  }, []);

  // Calculate visible range with overscan
  const overscan = 5;
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
    const endIndex = Math.min(
      products.length - 1,
      Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, products.length]);

  // Get visible products
  const visibleProducts = useMemo(() => {
    return products.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [products, visibleRange]);

  // Calculate offset for positioning
  const offsetY = visibleRange.startIndex * ROW_HEIGHT;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto w-full"
      style={{ 
        height: containerHeight,
        willChange: 'scroll-position',
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            willChange: 'transform',
          }}
        >
          {visibleProducts.map((product, relativeIndex) => {
            const absoluteIndex = visibleRange.startIndex + relativeIndex;
            return (
              <TableRow
                key={product.id}
                className={cn(
                  "hover:bg-white/5 transition-colors",
                  draggedProductId === product.id && "opacity-50 cursor-grabbing",
                  dragOverIndex === absoluteIndex && "bg-blue-500/20 border-blue-500",
                  isReordering && "opacity-60"
                )}
                style={{ height: ROW_HEIGHT }}
                draggable={!isReordering}
                onDragStart={(e) => onDragStart(e, product.id)}
                onDragOver={(e) => onDragOver(e, absoluteIndex)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, absoluteIndex)}
                onDragEnd={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.opacity = '';
                  }
                  if (!isReordering) {
                    // Reset handled by parent
                  }
                }}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "cursor-move text-muted-foreground hover:text-white transition-colors",
                        isReordering && "cursor-not-allowed opacity-50"
                      )}
                      draggable={!isReordering}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        if (!isReordering) {
                          onDragStart(e, product.id);
                        }
                      }}
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={(e) => onSelect(product.id, e.target.checked)}
                      className="rounded border-white/20 bg-black/25"
                      onClick={(e) => e.stopPropagation()}
                      disabled={isReordering}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{product.categoryIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium mb-1">
                        <InlineEdit
                          value={product.name}
                          onSave={(newName) => onUpdate(product.id, 'name', newName)}
                          type="text"
                          className="font-medium"
                          validate={(val) => val.length < 2 ? 'Name muss mindestens 2 Zeichen lang sein' : null}
                          autoComplete={Array.isArray(processedProducts) ? processedProducts.filter(p => p && p.name).slice(0, 10).map(p => p.name) : []}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        <InlineEdit
                          value={product.description || ''}
                          onSave={(newDesc) => onUpdate(product.id, 'description', newDesc)}
                          type="textarea"
                          rows={2}
                          className="text-sm text-muted-foreground"
                          placeholder="Beschreibung hinzufügen..."
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        SKU: <InlineEdit
                          value={product.sku || ''}
                          onSave={(newSku) => onUpdate(product.id, 'sku', newSku)}
                          type="text"
                          className="text-xs"
                          placeholder="SKU eingeben..."
                          validate={(val) => val.length > 0 && val.length < 3 ? 'SKU muss mindestens 3 Zeichen lang sein' : null}
                        />
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{product.categoryIcon}</span>
                    <span className="text-sm">{product.categoryName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <InlineEdit
                    value={product.price}
                    onSave={(newPrice) => onUpdate(product.id, 'price', newPrice)}
                    type="number"
                    className="font-bold text-neon"
                    step="0.01"
                    min={0}
                    format={(v) => `€${Number(v).toFixed(2)}`}
                    parse={(v) => parseFloat(String(v).replace('€', '').replace(',', '.'))}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <InlineEdit
                      value={product.inventory || 0}
                      onSave={(newStock) => onUpdate(product.id, 'inventory', newStock)}
                      type="number"
                      className="font-medium"
                    />
                    <span className="text-xs text-muted-foreground">
                      / {product.totalStock} total
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <InlineEdit
                    value={product.status || 'draft'}
                    onSave={(newStatus) => onUpdate(product.id, 'status', newStatus)}
                    type="select"
                    options={[
                      { value: 'active', label: 'Aktiv' },
                      { value: 'inactive', label: 'Inaktiv' },
                      { value: 'draft', label: 'Entwurf' },
                      { value: 'archived', label: 'Archiviert' }
                    ]}
                    className="min-w-[100px]"
                  />
                </TableCell>
                <TableCell>
                  <InlineEdit
                    value={product.access || 'standard'}
                    onSave={(newAccess) => onUpdate(product.id, 'access', newAccess)}
                    type="select"
                    options={[
                      { value: 'free', label: 'Kostenlos' },
                      { value: 'limited', label: 'Limitiert' },
                      { value: 'vip', label: 'VIP' },
                      { value: 'standard', label: 'Standard' }
                    ]}
                    className="min-w-[100px]"
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Produkt bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAdjustStock(product)}>
                        <Package className="w-4 h-4 mr-2" />
                        Lagerbestand anpassen
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(product)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplizieren
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400" onClick={() => onDelete(product)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </div>
      </div>
    </div>
  );
});
VirtualizedProductTable.displayName = 'VirtualizedProductTable';




















