import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import {
  Package,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { useAdjustStock } from '../../lib/api/shopHooks';
import { springConfigs } from '../../utils/springConfigs';

interface StockAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentStock: number;
  sku: string;
}

type AdjustmentType = 'add' | 'remove' | 'set';

const adjustmentTypes = [
  { value: 'add', label: 'Add Stock', icon: Plus, color: 'text-green-400' },
  { value: 'remove', label: 'Remove Stock', icon: Minus, color: 'text-red-400' },
  { value: 'set', label: 'Set Exact', icon: Edit3, color: 'text-blue-400' },
] as const;

const commonReasons = [
  'Restocking from supplier',
  'Damaged goods removal',
  'Inventory correction',
  'Return received',
  'Manual adjustment',
  'Found additional stock',
  'Loss/Theft',
  'Quality control issue',
];

export function StockAdjustmentModal({
  open,
  onClose,
  productId,
  productName,
  currentStock,
  sku,
}: StockAdjustmentModalProps) {
  // Validate and sanitize inputs
  const safeProductId = productId || '';
  const safeProductName = productName || 'Unknown Product';
  const safeSku = sku || 'N/A';
  const safeCurrentStock = typeof currentStock === 'number' && !isNaN(currentStock) ? currentStock : 0;
  
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('add');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');

  const adjustStockMutation = useAdjustStock();

  const newStock = useMemo(() => {
    const safeQuantity = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 0;
    
    switch (adjustmentType) {
      case 'add':
        return safeCurrentStock + safeQuantity;
      case 'remove':
        return Math.max(0, safeCurrentStock - safeQuantity);
      case 'set':
        return safeQuantity;
      default:
        return safeCurrentStock;
    }
  }, [adjustmentType, quantity, safeCurrentStock]);

  const adjustment = useMemo(() => {
    const safeQuantity = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 0;
    
    switch (adjustmentType) {
      case 'add':
        return safeQuantity;
      case 'remove':
        return -safeQuantity;
      case 'set':
        return safeQuantity - safeCurrentStock;
      default:
        return 0;
    }
  }, [adjustmentType, quantity, safeCurrentStock]);

  const handleSubmit = async () => {
    // Validate inputs
    const safeQuantity = typeof quantity === 'number' && !isNaN(quantity) ? quantity : 0;
    
    if (safeQuantity <= 0 && adjustmentType !== 'set') {
      alert('Bitte geben Sie eine gültige Menge ein');
      return;
    }
    
    if (adjustmentType === 'set' && safeQuantity < 0) {
      alert('Der Lagerbestand kann nicht negativ sein');
      return;
    }
    
    if (!safeProductId) {
      alert('Produkt-ID fehlt. Bitte versuchen Sie es erneut.');
      return;
    }

    try {
      await adjustStockMutation.mutateAsync({
        productId: safeProductId,
        adjustment,
        reason: reason.trim() || undefined,
        location: location.trim() || undefined,
      });

      onClose();
      
      // Reset form
      setQuantity(0);
      setReason('');
      setLocation('');
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Anpassen des Lagerbestands';
      alert(errorMessage);
    }
  };

  const handleQuickAdjust = (value: number) => {
    setQuantity(Math.abs(value));
    setAdjustmentType(value > 0 ? 'add' : 'remove');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-400" />
            Adjust Stock Level
          </DialogTitle>
          <DialogDescription>
            Update inventory for {safeProductName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-white/10">
            <div>
              <p className="font-medium text-white">{safeProductName}</p>
              <p className="text-sm text-muted-foreground">SKU: {safeSku}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold text-white">{safeCurrentStock}</p>
            </div>
          </div>

          {/* Adjustment Type Selector */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">
              Adjustment Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {adjustmentTypes.map((type) => {
                const Icon = type.icon;
                const isActive = adjustmentType === type.value;
                
                return (
                  <motion.button
                    key={type.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAdjustmentType(type.value as AdjustmentType)}
                    className={`p-4 rounded-lg border transition-all ${
                      isActive
                        ? 'border-blue-500/50 bg-blue-500/10'
                        : 'border-white/10 bg-gray-800/30 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? 'text-blue-400' : type.color}`} />
                    <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
                      {type.label}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Quick Adjustments */}
          <div>
            <label className="text-sm font-medium text-white mb-3 block">
              Quick Adjustments
            </label>
            <div className="grid grid-cols-6 gap-2">
              {[5, 10, 20, 50, 100, 200].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(value)}
                  className="hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400"
                >
                  +{value}
                </Button>
              ))}
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label htmlFor="quantity" className="text-sm font-medium text-white mb-2 block">
              {adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
            </label>
            <Input
              id="quantity"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Enter quantity"
              className="text-lg font-semibold"
            />
          </div>

          {/* Stock Preview */}
          <AnimatePresence mode="wait">
            {quantity > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {adjustment > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">New Stock Level</p>
                      <p className="text-2xl font-bold text-white">{newStock}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Change</p>
                    <p className={`text-lg font-bold ${
                      adjustment > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {adjustment > 0 ? '+' : ''}{adjustment}
                    </p>
                  </div>
                </div>

                {/* Warning for low stock */}
                {newStock < 10 && (
                  <div className="flex items-center gap-2 mt-3 text-orange-400">
                    <AlertTriangle className="w-4 h-4" />
                    <p className="text-sm">Warning: Stock will be below threshold</p>
                  </div>
                )}
                
                {/* Success for good stock */}
                {newStock >= 10 && currentStock < 10 && (
                  <div className="flex items-center gap-2 mt-3 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <p className="text-sm">Stock will return to healthy levels</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="text-sm font-medium text-white mb-2 block">
              Reason (Optional)
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for adjustment..."
              rows={3}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {commonReasons.map((commonReason) => (
                <Button
                  key={commonReason}
                  variant="ghost"
                  size="sm"
                  onClick={() => setReason(commonReason)}
                  className="text-xs hover:bg-blue-500/10 hover:text-blue-400"
                >
                  {commonReason}
                </Button>
              ))}
            </div>
          </div>

          {/* Location (Optional) */}
          <div>
            <label htmlFor="location" className="text-sm font-medium text-white mb-2 block">
              Location (Optional)
            </label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Warehouse A, Store #1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={adjustStockMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={
              (quantity <= 0 && adjustmentType !== 'set') || 
              (adjustmentType === 'set' && quantity < 0) ||
              adjustStockMutation.isPending
            }
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {adjustStockMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Adjustment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

