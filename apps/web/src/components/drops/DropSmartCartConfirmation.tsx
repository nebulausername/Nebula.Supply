import { memo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingBag, ArrowRight, Sparkles, Zap, Truck, Shield, ShoppingCart } from "lucide-react";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../MobileOptimizations";
import { formatCurrency } from "../../utils/currency";

interface AddedDropItem {
  variantLabel: string;
  quantity: number;
  price: number;
}

interface DropSmartCartConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueShopping: () => void;
  onGoToCart: () => void;
  onGoToCheckout?: () => void;
  addedItems: AddedDropItem[];
  totalAddedPrice: number;
  cartTotal: number;
  freeShippingThreshold: number;
  dropName: string;
  dropImage?: string;
}

export const DropSmartCartConfirmation = memo(({
  isOpen,
  onClose,
  onContinueShopping,
  onGoToCart,
  onGoToCheckout,
  addedItems,
  totalAddedPrice,
  cartTotal,
  freeShippingThreshold,
  dropName,
  dropImage
}: DropSmartCartConfirmationProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const { isMobile } = useMobileOptimizations();
  const [showParticles, setShowParticles] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'success' | 'choice'>('success');
  const [isFlyingToCart, setIsFlyingToCart] = useState(false);

  // 🎯 Success Animation Sequence
  useEffect(() => {
    if (!isOpen) {
      // Reset states when closed
      setAnimationPhase('success');
      setShowParticles(false);
      return;
    }

    setAnimationPhase('success');
    setShowParticles(true);
    triggerHaptic('success');

    const timer = setTimeout(() => {
      setAnimationPhase('choice');
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, triggerHaptic]);

  // 🎯 Calculate free shipping progress
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - cartTotal);
  const freeShippingProgress = Math.min(100, (cartTotal / freeShippingThreshold) * 100);
  const hasReachedFreeShipping = freeShippingRemaining === 0;

  // 🎯 MOBILE GESTURE HANDLERS
  const handleSwipeDown = useCallback(() => {
    if (isMobile) {
      triggerHaptic('light');
      onClose();
    }
  }, [isMobile, triggerHaptic, onClose]);

  // 🎯 ENHANCED MOBILE TOUCH HANDLERS
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isMobile) {
      const touch = e.touches[0];
      const startY = touch.clientY;
      const startTime = Date.now();
      
      const handleTouchMove = (moveEvent: TouchEvent) => {
        const currentY = moveEvent.touches[0].clientY;
        const deltaY = currentY - startY;
        const currentTime = Date.now();
        const deltaTime = currentTime - startTime;
        
        // Swipe down detection
        if (deltaY > 50 && deltaTime < 300) {
          triggerHaptic('light');
          onClose();
        }
      };
      
      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  }, [isMobile, triggerHaptic, onClose]);

  // 🎯 KEYBOARD NAVIGATION
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerHaptic('light');
        onClose();
      }
      if (e.key === 'Enter' && animationPhase === 'choice') {
        triggerHaptic('heavy');
        onGoToCart();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, animationPhase, triggerHaptic, onClose, onGoToCart]);

  if (!isOpen) return null;

  const totalQuantity = addedItems.reduce((sum, item) => sum + item.quantity, 0);

  console.log('🎯 DropSmartCartConfirmation rendering:', { 
    isOpen, 
    totalQuantity, 
    itemsCount: addedItems.length,
    zIndex: 99999,
    pointerEvents: 'auto'
  });

  // Render in a portal to ensure it's on top of everything
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ zIndex: 99999, pointerEvents: 'auto' }}
      onTouchStart={handleTouchStart}
      onClick={(e) => {
        // DON'T close on backdrop click - User muss Button wählen!
        // if (e.target === e.currentTarget && !isFlyingToCart) {
        //   triggerHaptic('light');
        //   onClose();
        // }
      }}
    >
      {/* 🎯 FLY TO CART ANIMATION - MEGA MAXIMIERT */}
      {isFlyingToCart && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100000]">
          {/* Background Flash */}
          <div className="absolute inset-0 bg-[#0BF7BC]/20 animate-pulse" />
          
          {/* Flying Items */}
          {addedItems.map((item, index) => (
            <div
              key={index}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                animation: 'flyToCartMega 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                animationDelay: `${index * 150}ms`,
                zIndex: 100001 + index
              }}
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-[#0BF7BC]/50 rounded-2xl blur-xl animate-pulse" />
                
                {/* Main Badge */}
                <div className="relative bg-gradient-to-br from-[#0BF7BC] via-cyan-300 to-emerald-400 rounded-2xl p-4 shadow-2xl shadow-[#0BF7BC]/70 flex items-center gap-3 border-2 border-white/30">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <ShoppingBag className="h-6 w-6 text-black animate-bounce" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-black text-lg whitespace-nowrap">
                      {item.quantity}x {item.variantLabel}
                    </span>
                    <span className="font-bold text-black/70 text-sm">
                      {formatCurrency(item.price * item.quantity, 'de-DE', 'EUR')}
                    </span>
                  </div>
                  <Sparkles className="h-5 w-5 text-yellow-300 animate-spin" />
                </div>
                
                {/* Trail Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0BF7BC]/30 to-transparent rounded-2xl" 
                     style={{ animation: 'trail 0.5s ease-out infinite' }} />
              </div>
            </div>
          ))}
          
          {/* Success Burst */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-gradient-to-br from-[#0BF7BC] to-yellow-400 rounded-full"
                style={{
                  animation: 'burst 0.8s ease-out forwards',
                  animationDelay: `${i * 40}ms`,
                  transform: `rotate(${i * 18}deg) translateX(0)`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 🎯 PARTICLE EXPLOSION ANIMATION */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#0BF7BC] rounded-full animate-ping"
              style={{
                left: `${50 + (Math.random() - 0.5) * 100}%`,
                top: `${50 + (Math.random() - 0.5) * 100}%`,
                animationDelay: `${i * 50}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes flyToCartMega {
          0% {
            transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
            opacity: 1;
            filter: brightness(1.5);
          }
          15% {
            transform: translate(-50%, -60%) scale(1.3) rotate(-5deg);
            opacity: 1;
            filter: brightness(1.8);
          }
          35% {
            transform: translate(calc(10vw - 50%), calc(-35vh - 50%)) scale(1.1) rotate(10deg);
            opacity: 1;
            filter: brightness(1.6);
          }
          60% {
            transform: translate(calc(30vw - 50%), calc(-45vh - 50%)) scale(0.8) rotate(25deg);
            opacity: 0.9;
            filter: brightness(1.4);
          }
          85% {
            transform: translate(calc(43vw - 50%), calc(-48vh - 50%)) scale(0.4) rotate(45deg);
            opacity: 0.6;
            filter: brightness(1.2);
          }
          100% {
            transform: translate(calc(45vw - 50%), calc(-49vh - 50%)) scale(0.1) rotate(60deg);
            opacity: 0;
            filter: brightness(1);
          }
        }
        
        @keyframes trail {
          0%, 100% {
            opacity: 0.3;
            transform: scaleX(1);
          }
          50% {
            opacity: 0.6;
            transform: scaleX(1.2);
          }
        }
        
        @keyframes burst {
          0% {
            transform: rotate(var(--rotation, 0deg)) translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation, 0deg)) translateX(150px) scale(0);
            opacity: 0;
          }
        }
      `}</style>

      <div 
        className="relative w-full max-w-lg bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl border-2 border-[#0BF7BC]/40 shadow-2xl shadow-[#0BF7BC]/30 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drop-cart-title"
        aria-describedby="drop-cart-description"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing
      >
        {/* 🎯 GLOW EFFECT */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#0BF7BC]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* 🎯 MOBILE SWIPE HANDLE */}
        {isMobile && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 bg-[#0BF7BC]/40 rounded-full mt-3 cursor-grab active:cursor-grabbing" />
        )}

        {/* 🎯 HEADER WITH SUCCESS ANIMATION */}
        <div className="relative p-6 border-b border-white/10">
          {/* REMOVED: Close button - User muss eine Aktion wählen! */}
          {/* <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="absolute top-4 right-4 rounded-full p-2 hover:bg-white/10 active:scale-95 transition-all duration-200 touch-target"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button> */}

          {animationPhase === 'success' && (
            <div className="text-center space-y-4 relative z-10">
              <div className="relative inline-block">
                <div className={`w-24 h-24 bg-gradient-to-br from-[#0BF7BC] via-cyan-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-2xl shadow-[#0BF7BC]/50 ${isMobile ? 'scale-110' : ''}`}>
                  <ShoppingBag className="h-12 w-12 text-black drop-shadow-lg" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center animate-bounce shadow-lg" style={{ animationDelay: '0.2s' }}>
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                {/* 🎯 SUCCESS RINGS */}
                <div className="absolute inset-0 w-24 h-24 border-2 border-[#0BF7BC]/40 rounded-full animate-ping" />
                <div className="absolute inset-0 w-24 h-24 border-2 border-[#0BF7BC]/30 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute inset-0 w-24 h-24 border border-[#0BF7BC]/20 rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
              </div>
              <div>
                <h2 id="drop-cart-title" className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0BF7BC] via-cyan-400 to-emerald-400 mb-2 ${isMobile ? 'text-4xl' : 'text-3xl'} drop-shadow-lg`}>
                  🎉 Hinzugefügt!
                </h2>
                <p className="text-slate-300 text-lg font-semibold">
                  {totalQuantity} {totalQuantity === 1 ? 'Sorte' : 'Sorten'} im Warenkorb
                </p>
              </div>
            </div>
          )}

          {animationPhase === 'choice' && (
            <div className="text-center space-y-4 relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0BF7BC]/30 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-[#0BF7BC]/40 shadow-lg shadow-[#0BF7BC]/20">
                <ShoppingCart className="h-10 w-10 text-[#0BF7BC] drop-shadow-lg" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Was möchtest du tun?</h2>
                <p className="text-slate-300 font-medium">
                  {dropName} wurde zum Warenkorb hinzugefügt
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 🎯 MAIN CONTENT - CHOICE PHASE */}
        <div className={`transition-all duration-700 ease-out ${
          animationPhase === 'choice' 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none absolute'
        }`}>
          {animationPhase === 'choice' && (
            <div className="p-6 space-y-6">
              {/* 🎯 ADDED ITEMS SUMMARY */}
              <div className="relative p-5 bg-gradient-to-br from-[#0BF7BC]/15 via-cyan-500/10 to-emerald-500/5 rounded-2xl border-2 border-[#0BF7BC]/30 shadow-lg shadow-[#0BF7BC]/10 overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0BF7BC]/5 to-transparent animate-shimmer" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#0BF7BC] to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-[#0BF7BC]/30">
                      <ShoppingBag className="h-5 w-5 text-black" />
                    </div>
                    <div className="font-black text-white text-lg">Hinzugefügt:</div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {addedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-[#0BF7BC]/20 backdrop-blur-sm group hover:border-[#0BF7BC]/40 transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#0BF7BC]/20 to-cyan-500/20 rounded-lg flex items-center justify-center border border-[#0BF7BC]/30">
                            <span className="text-[#0BF7BC] font-bold text-sm">{item.quantity}x</span>
                          </div>
                          <span className="font-medium text-white group-hover:text-[#0BF7BC] transition-colors">
                            {item.variantLabel}
                          </span>
                        </div>
                        <span className="text-[#0BF7BC] font-bold text-base">
                          {formatCurrency(item.price * item.quantity, 'de-DE', 'EUR')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-[#0BF7BC]/20 flex items-center justify-between">
                    <span className="text-slate-300 font-semibold">Gesamt hinzugefügt</span>
                    <span className="font-black text-[#0BF7BC] text-2xl drop-shadow-lg">
                      {formatCurrency(totalAddedPrice, 'de-DE', 'EUR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 🎯 FREE SHIPPING PROGRESS */}
              {!hasReachedFreeShipping && (
                <div className="p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Truck className="h-5 w-5 text-orange-500" />
                    <div>
                      <div className="font-semibold text-white">Kostenloser Versand</div>
                      <div className="text-sm text-slate-400">
                        Noch {formatCurrency(freeShippingRemaining, 'de-DE', 'EUR')} bis kostenloser Versand!
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 🎯 FREE SHIPPING REACHED */}
              {hasReachedFreeShipping && (
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">🎉 Kostenloser Versand!</div>
                      <div className="text-sm text-slate-400">
                        Du hast kostenlosen Versand freigeschaltet
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🎯 ACTION BUTTONS */}
              <div className="space-y-3">
                {/* 🛒 Zum Checkout Button (Primary) */}
                {onGoToCheckout && (
                  <button
                    onClick={() => {
                      console.log('✅ Zum Checkout clicked!');
                      triggerHaptic('heavy');
                      onGoToCheckout();
                    }}
                    disabled={isFlyingToCart}
                    className="group w-full flex items-center justify-center gap-3 py-5 px-6 bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-orange-500/50 hover:shadow-orange-500/70 touch-target min-h-[60px] relative overflow-hidden disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    
                    <Zap className="h-6 w-6 animate-pulse relative z-10" />
                    <span className="relative z-10">Zum Checkout ({formatCurrency(cartTotal, 'de-DE', 'EUR')})</span>
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform relative z-10" />
                  </button>
                )}

                {/* 🛒 Zum Warenkorb Button (Secondary wenn kein Checkout) */}
                {!onGoToCheckout && (
                  <button
                    onClick={() => {
                      console.log('🎯 Zum Warenkorb clicked!');
                      triggerHaptic('heavy');
                      
                      // Start fly animation immediately
                      setIsFlyingToCart(true);
                      
                      // After animation completes (1s + delays), go to cart
                      setTimeout(() => {
                        console.log('✅ Opening cart...');
                        onGoToCart();
                      }, 1200);
                    }}
                    disabled={isFlyingToCart}
                    className="group w-full flex items-center justify-center gap-3 py-5 px-6 bg-gradient-to-r from-[#0BF7BC] via-cyan-400 to-emerald-400 text-black rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-[#0BF7BC]/50 hover:shadow-[#0BF7BC]/70 touch-target min-h-[60px] relative overflow-hidden disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    
                    {isFlyingToCart ? (
                      <>
                        <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin relative z-10" />
                        <span className="relative z-10">Wird hinzugefügt...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-6 w-6 animate-pulse relative z-10" />
                        <span className="relative z-10">Zum Warenkorb ({formatCurrency(cartTotal, 'de-DE', 'EUR')})</span>
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform relative z-10" />
                      </>
                    )}
                  </button>
                )}

                {/* 🔄 Weiter einkaufen Button */}
                <button
                  onClick={() => {
                    console.log('🔄 Weiter einkaufen clicked!');
                    triggerHaptic('medium');
                    onContinueShopping();
                  }}
                  disabled={isFlyingToCart}
                  className="group w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-2xl font-bold text-lg hover:from-slate-700 hover:to-slate-600 active:scale-[0.98] transition-all duration-300 border-2 border-slate-600 hover:border-[#0BF7BC]/50 shadow-lg touch-target min-h-[56px] disabled:opacity-50"
                >
                  <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Weiter einkaufen</span>
                </button>
              </div>

              {/* 🎯 CART SUMMARY */}
              <div className="relative p-5 bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl border border-slate-700/50 shadow-lg overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0BF7BC]/5 rounded-full blur-2xl" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-300 font-semibold">Warenkorb Gesamt</span>
                    <span className="font-black text-white text-xl">{formatCurrency(cartTotal, 'de-DE', 'EUR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span>Sichere Bezahlung garantiert</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
});

DropSmartCartConfirmation.displayName = 'DropSmartCartConfirmation';

