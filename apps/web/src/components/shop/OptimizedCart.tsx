import React, { useState, useMemo, useCallback } from 'react';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  Package,
  Zap,
  Heart,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  ShoppingBag
} from 'lucide-react';
import { useGlobalCartStore } from '../../store/globalCart';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useLoyaltyStore } from '../../store/loyalty';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../utils/cn';

interface OptimizedCartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const OptimizedCart: React.FC<OptimizedCartProps> = ({
  isOpen,
  onClose,
  onCheckout
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTier, getTierInfo } = useLoyaltyStore();
  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    clearCart,
    isOpen: cartIsOpen
  } = useGlobalCartStore();

  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Memoized calculations
  const cartStats = useMemo(() => {
    const shopItems = items.filter(item => item.type === 'shop');
    const dropItems = items.filter(item => item.type === 'drop');

    const loyaltyDiscount = getTierInfo().tier !== 'bronze' ?
      totalPrice * (0.1 + (['silver', 'gold', 'platinum', 'diamond'].indexOf(getTierInfo().tier) * 0.05)) : 0;

    const finalTotal = Math.max(0, totalPrice - loyaltyDiscount);

    return {
      shopItems,
      dropItems,
      loyaltyDiscount,
      finalTotal,
      savings: loyaltyDiscount
    };
  }, [items, totalPrice, getTierInfo]);

  // Optimized handlers
  const handleQuantityChange = useCallback(async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(itemId));

    try {
      updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [updateQuantity]);

  const handleRemoveItem = useCallback(async (itemId: string) => {
    setRemovingItems(prev => new Set(prev).add(itemId));

    try {
      removeItem(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [removeItem]);

  const handleClearCart = useCallback(() => {
    clearCart();
  }, [clearCart]);

  // Render item card
  const renderItemCard = (item: any, index: number) => {
    const isUpdating = updatingItems.has(item.id);
    const isRemoving = removingItems.has(item.id);

    return (
      <div
        key={item.id}
        className={cn(
          "flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 transition-all duration-200",
          isRemoving && "opacity-50 scale-95"
        )}
      >
        {/* Item Image */}
        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-purple-600 rounded" />
          )}
        </div>

        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white truncate">{item.name}</h4>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              item.type === 'drop'
                ? "bg-purple-500/20 text-purple-400"
                : "bg-blue-500/20 text-blue-400"
            )}>
              {item.type === 'drop' ? 'Drop' : 'Shop'}
            </span>
          </div>

          <p className="text-sm text-slate-400 truncate mb-1">{item.variant}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Quantity Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  disabled={isUpdating || item.quantity <= 1}
                  className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Minus className="h-3 w-3" />
                </button>

                <span className="w-8 text-center text-sm text-white">
                  {isUpdating ? (
                    <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                  ) : (
                    item.quantity
                  )}
                </span>

                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  disabled={isUpdating || item.quantity >= (item.maxQuantity || 10)}
                  className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <span className="text-sm text-slate-400">×</span>
              <span className="text-sm font-medium text-white">
                {formatCurrency(item.price, 'EUR')}
              </span>
            </div>

            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {formatCurrency(item.price * item.quantity, 'EUR')}
              </div>
              {item.inviteRequired && (
                <div className="text-xs text-yellow-400">Invite Required</div>
              )}
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => handleRemoveItem(item.id)}
          disabled={isRemoving}
          className="p-2 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-orange-400" />
            <h2 className="text-lg font-semibold text-white">Warenkorb</h2>
            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
              {totalItems}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <ShoppingBag className="h-16 w-16 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Warenkorb ist leer</h3>
                  <p className="text-slate-400">Füge Produkte hinzu, um zu beginnen</p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Weiter einkaufen
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.map(renderItemCard)}
              </div>

              {/* Cart Summary */}
              <div className="border-t border-slate-700 p-4 space-y-4">
                {/* Loyalty Discount */}
                {cartStats.loyaltyDiscount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-purple-400">
                        {getTierInfo().name} Rabatt
                      </span>
                    </div>
                    <span className="font-medium text-purple-400">
                      -{formatCurrency(cartStats.loyaltyDiscount, 'EUR')}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Zwischensumme</span>
                    <span className="text-white">{formatCurrency(totalPrice, 'EUR')}</span>
                  </div>

                  {cartStats.loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-400">Loyalty Rabatt</span>
                      <span className="text-purple-400">
                        -{formatCurrency(cartStats.loyaltyDiscount, 'EUR')}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-white">Gesamt</span>
                      <span className="text-xl font-bold text-orange-400">
                        {formatCurrency(cartStats.finalTotal, 'EUR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/checkout');
                    }}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="h-5 w-5" />
                    Zur Kasse (€{cartStats.finalTotal.toFixed(2)})
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleClearCart}
                      className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                    >
                      Alles löschen
                    </button>

                    <button
                      onClick={onClose}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Weiter einkaufen
                    </button>
                  </div>
                </div>

                {/* Loyalty Info */}
                {user && (
                  <div className="text-center text-sm text-slate-400">
                    Verdiene <span className="text-orange-400 font-medium">
                      {Math.floor(cartStats.finalTotal / 10)} Punkte
                    </span> mit diesem Einkauf
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


