import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Package } from 'lucide-react';

interface StockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  drop: any;
  onSave: (variants: any[]) => void;
}

export function StockUpdateModal({ isOpen, onClose, drop, onSave }: StockUpdateModalProps) {
  const [variantStocks, setVariantStocks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (drop && Array.isArray(drop.variants)) {
      const stocks: Record<string, number> = {};
      drop.variants.forEach((variant: any) => {
        stocks[variant.id || variant.label] = variant.stock || 0;
      });
      setVariantStocks(stocks);
    }
  }, [drop]);

  const handleVariantStockChange = (variantId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setVariantStocks(prev => ({
      ...prev,
      [variantId]: numValue
    }));
  };

  const handleSave = () => {
    if (!drop || !Array.isArray(drop.variants)) return;

    const updatedVariants = drop.variants.map((variant: any) => ({
      ...variant,
      stock: variantStocks[variant.id || variant.label] || 0
    }));

    onSave(updatedVariants);
    onClose();
  };

  const handleSetAll = (value: number) => {
    if (!drop || !Array.isArray(drop.variants)) return;
    
    const stocks: Record<string, number> = {};
    drop.variants.forEach((variant: any) => {
      stocks[variant.id || variant.label] = value;
    });
    setVariantStocks(stocks);
  };

  if (!drop) return null;

  const totalStock = Object.values(variantStocks).reduce((sum, stock) => sum + stock, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="w-6 h-6 text-purple-400" />
            Bestand aktualisieren: {drop.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Actions */}
          <Card className="p-4 bg-purple-900/20 border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Schnellaktionen:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSetAll(0)}
              >
                Alle auf 0 setzen
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSetAll(100)}
              >
                Alle auf 100 setzen
              </Button>
            </div>
          </Card>

          {/* Variants */}
          {Array.isArray(drop.variants) && drop.variants.length > 0 ? (
            <div className="space-y-3">
              {drop.variants.map((variant: any, index: number) => {
                const variantId = variant.id || variant.label;
                return (
                  <Card key={variantId || index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{variant.label}</span>
                        {variant.basePrice && (
                          <span className="text-sm text-muted-foreground ml-2">
                            (€{variant.basePrice.toLocaleString()})
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Aktuell: {variant.stock || 0}
                      </span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      value={variantStocks[variantId] || 0}
                      onChange={(e) => handleVariantStockChange(variantId, e.target.value)}
                      placeholder="Neuer Bestand"
                      className="mt-2"
                    />
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Keine Varianten vorhanden
            </p>
          )}

          {/* Total Summary */}
          <Card className="p-4 bg-green-900/20 border-green-500/30">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Gesamtbestand:</span>
              <span className="text-2xl font-bold text-green-400">{totalStock}</span>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            <Package className="w-4 h-4 mr-2" />
            Bestand speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

