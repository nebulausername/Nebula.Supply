import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGlobalCartStore } from "../../store/globalCart";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../MobileOptimizations";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Zap
} from "lucide-react";
import { formatCurrency } from "../../utils/currency";

interface OptimizedMobileCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OptimizedMobileCart = ({ isOpen, onClose }: OptimizedMobileCartProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const { isMobile } = useMobileOptimizations();
  const [isVisible, setIsVisible] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const cartRef = useRef<HTMLDivElement>(null);

  const {
    items,
    totalItems,
    totalPrice,
    removeItem,
    updateQuantity,
    clearCart
  } = useGlobalCartStore();

  // Animation effect when cart opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      triggerHaptic('medium');
    } else {
      setSwipeOffset(0);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen, triggerHaptic]);

  // Touch handlers for swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaY = touch.clientY - (touch.target as any).getBoundingClientRect().top;
    if (deltaY > 0) {
      setSwipeOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 100) {
      onClose();
    } else {
      setSwipeOffset(0);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    triggerHaptic('light');
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    triggerHaptic('medium');
    removeItem(itemId);
  };

  const handleClearCart = () => {
    triggerHaptic('heavy');
    clearCart();
  };

  const handleCheckout = () => {
    triggerHaptic('success');
    onClose();
    // Navigate to checkout
    window.location.href = '/checkout';
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-end transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Cart Content - Optimized Design */}
      <div
        ref={cartRef}
        className={`
          relative w-full max-h-[85vh] bg-gradient-to-b from-black via-[#0a0a0a] to-[#050505]
          border-t border-white/10 rounded-t-3xl shadow-2xl
          transform transition-all duration-300 ease-out
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ transform: `translateY(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">Warenkorb</h2>
              <p className="text-sm text-muted">{totalItems} Artikel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10 transition-colors touch-target"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Warenkorb ist leer</h3>
              <p className="text-muted text-center mb-6">
                Füge Produkte hinzu, um sie hier zu sehen
              </p>
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/shop';
                }}
                className="px-6 py-3 bg-accent text-black rounded-xl font-semibold hover:bg-accent/90 transition-colors"
              >
                Zum Shop
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/10"
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-accent/20 rounded" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text truncate">{item.name}</h3>
                    <p className="text-sm text-muted truncate">{item.variant}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-accent">
                        {formatCurrency(item.price, 'de-DE', 'EUR')}
                      </span>
                      <span className="text-sm text-muted">
                        {formatCurrency(item.price * item.quantity, 'de-DE', 'EUR')}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors touch-target disabled:opacity-50 flex items-center justify-center"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium text-text">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={item.quantity >= (item.maxQuantity || 10)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors touch-target disabled:opacity-50 flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors touch-target"
                    aria-label="Entfernen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Only show if items exist */}
        {items.length > 0 && (
          <div className="border-t border-white/10 p-4 space-y-4">
            
            {/* Free Shipping Progress - Upgraded */}
            {totalPrice < 25 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 p-3 rounded-xl bg-gradient-to-r from-accent/10 to-emerald-400/10 border border-accent/20"
              >
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text font-medium">Kostenloser Versand ab 25€</span>
                  <span className="text-accent font-semibold">
                    Noch {formatCurrency(25 - totalPrice, 'de-DE', 'EUR')}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent via-emerald-400 to-green-400 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((totalPrice / 25) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
            {totalPrice >= 25 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-400/20 border border-green-500/30"
              >
                <motion.svg
                  className="h-5 w-5 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </motion.svg>
                <span className="text-sm text-green-400 font-semibold">Kostenloser Versand freigeschaltet! 🎉</span>
              </motion.div>
            )}
            
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-text">Gesamt</span>
              <span className="text-2xl font-bold text-accent">
                {formatCurrency(totalPrice, 'de-DE', 'EUR')}
              </span>
            </div>

            {/* Shipping Info */}
            <div className="text-center text-sm text-muted">
              Kostenloser Versand ab 25€ • Sichere Bezahlung
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClearCart}
                className="flex-1 py-3 px-4 bg-white/5 text-muted hover:bg-white/10 rounded-xl font-semibold transition-colors touch-target"
              >
                Leeren
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-accent text-black rounded-xl font-bold hover:bg-accent/90 transition-colors touch-target"
              >
                <Zap className="h-4 w-4" />
                Checkout
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};




