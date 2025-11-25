import { memo, useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { X, ShoppingBag, ArrowRight, Sparkles, Gift, Zap, Star, Truck, Shield, Plus, Loader2 } from "lucide-react";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../MobileOptimizations";
import { formatCurrency } from "../../utils/currency";
import { motion } from "framer-motion";
import { useGlobalCartStore } from "../../store/globalCart";
import { useShopStore } from "../../store/shop";
import { showToast } from "../../store/toast";

interface SmartCartConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueShopping: () => void;
  onGoToCheckout: () => void;
  onAddRecommendedProduct: (productId: string) => void;
  productName: string;
  productPrice: number;
  productImage?: string;
  cartTotal: number;
  freeShippingThreshold: number;
  recommendedProducts?: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
    badge?: string;
  }>;
}

export const SmartCartConfirmation = memo(({
  isOpen,
  onClose,
  onContinueShopping,
  onGoToCheckout,
  onAddRecommendedProduct,
  productName,
  productPrice,
  productImage,
  cartTotal,
  freeShippingThreshold,
  recommendedProducts = []
}: SmartCartConfirmationProps) => {
  // Direct navigation - use useNavigate hook
  const navigate = useNavigate();
  const { openCart, items, totalItems } = useGlobalCartStore();
  const { closeProduct } = useShopStore();
  const { triggerHaptic } = useEnhancedTouch();
  const { isMobile } = useMobileOptimizations();
  
  // Direct navigation function - optimized and reliable (with explicit state sync and verification)
  const navigateToCheckout = useCallback(async () => {
    console.log('🎯 navigateToCheckout called', { itemsCount: items.length, totalItems });
    
    // Set navigating state immediately
    setIsNavigating(true);
    triggerHaptic('heavy');
    
    try {
      // Show loading feedback
      showToast.info('Zur Kasse weitergeleitet...', 'Warenkorb wird verarbeitet');
      
      // Get current cart state and ensure totals are updated
      const cartState = useGlobalCartStore.getState();
      cartState.updateTotals(); // Ensure totals are current
      
      // Wait a moment for Zustand persist to sync
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Re-check cart state after sync
      const verifiedCartState = useGlobalCartStore.getState();
      
      console.log('📊 Cart state before navigation:', {
        itemsCount: verifiedCartState.items.length,
        totalItems: verifiedCartState.totalItems,
        totalPrice: verifiedCartState.totalPrice,
        items: verifiedCartState.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity }))
      });
      
      // Verify cart has items - if not, show error and return
      if (verifiedCartState.items.length === 0 && verifiedCartState.totalItems === 0) {
        console.warn('⚠️ Cart is empty after verification, cannot navigate to checkout');
        showToast.error('Warenkorb leer', 'Bitte füge Artikel zum Warenkorb hinzu');
        setIsNavigating(false);
        return;
      }
      
      // Explicitly save cart state to localStorage in Zustand persist format
      try {
        // Zustand persist format: { state: {...}, version: 0 }
        const persistData = {
          state: {
            items: verifiedCartState.items,
            totalItems: verifiedCartState.totalItems,
            totalPrice: verifiedCartState.totalPrice
          },
          version: 0
        };
        localStorage.setItem('nebula-global-cart', JSON.stringify(persistData));
        console.log('💾 Cart state explicitly saved to localStorage (Zustand format)');
        
        // Verify it was saved
        const savedData = localStorage.getItem('nebula-global-cart');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          const savedItems = parsed?.state?.items || [];
          console.log('✅ Verified localStorage save:', savedItems.length, 'items');
        }
      } catch (storageError) {
        console.error('❌ Failed to save cart to localStorage:', storageError);
        // Continue anyway - Zustand persist should handle it
      }
      
      // Close all modals FIRST
      closeProduct(); // Close product modal
      if (onClose) {
        onClose(); // Close confirmation modal
      }
      
      // Also call callback for state management
      try {
        if (onGoToCheckout) {
          onGoToCheckout();
        }
      } catch (error) {
        console.error('❌ Error in onGoToCheckout callback:', error);
      }
      
      // Wait a bit more to ensure all state is persisted
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Final verification before navigation
      const finalCartState = useGlobalCartStore.getState();
      console.log('🔍 Final cart state verification:', {
        itemsCount: finalCartState.items.length,
        totalItems: finalCartState.totalItems
      });
      
      if (finalCartState.items.length === 0) {
        console.error('❌ Cart is empty in final check - this should not happen!');
        showToast.error('Fehler', 'Warenkorb konnte nicht synchronisiert werden');
        setIsNavigating(false);
        return;
      }
      
      // Navigate to checkout page
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setTimeout(() => {
          console.log('📍 Navigating to /checkout (with verified state)', { 
            itemsCount: finalCartState.items.length, 
            totalItems: finalCartState.totalItems,
            totalPrice: finalCartState.totalPrice,
            pathname: window.location.pathname 
          });
          
          // Force navigation using window.location.href (most reliable for mobile)
          if (window.location.pathname !== '/checkout') {
            window.location.href = '/checkout';
          } else {
            console.log('✅ Already on checkout page');
          }
        }, 500); // Reduced delay since we already waited
      });
    } catch (error) {
      console.error('Error during checkout navigation:', error);
      showToast.error('Checkout-Fehler', 'Ein Fehler ist beim Weiterleiten aufgetreten');
      setIsNavigating(false);
    }
  }, [navigate, onClose, onGoToCheckout, triggerHaptic, closeProduct, items.length, totalItems]);
  const [showParticles, setShowParticles] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'success' | 'choice' | 'recommendations'>('success');
  const [addedRecommendations, setAddedRecommendations] = useState<Set<string>>(new Set());
  const [isAddingRecommendation, setIsAddingRecommendation] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Memoize free shipping calculation for performance
  const freeShippingRemaining = useMemo(() => Math.max(0, freeShippingThreshold - cartTotal), [freeShippingThreshold, cartTotal]);
  const freeShippingProgress = useMemo(() => Math.min(100, (cartTotal / freeShippingThreshold) * 100), [cartTotal, freeShippingThreshold]);
  
  // Memoize recommended products list for performance
  const displayedRecommendations = useMemo(() => recommendedProducts.slice(0, 2), [recommendedProducts]);

  // 🎯 Success Animation Sequence - OPTIMIZED for Performance
  useEffect(() => {
    if (!isOpen) {
      // Reset states when closed
      setAnimationPhase('success');
      setShowParticles(false);
      setAddedRecommendations(new Set());
      setIsAddingRecommendation(null);
      setIsNavigating(false);
      return;
    }

    setAnimationPhase('success');
    setShowParticles(true);
    triggerHaptic('success');

    // Optimized timings for faster UX
    const timer1 = setTimeout(() => {
      setAnimationPhase('choice');
    }, 800); // Reduced from 1200ms

    const timer2 = setTimeout(() => {
      setAnimationPhase('recommendations');
    }, 1800); // Reduced from 2500ms

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, triggerHaptic]); // Removed recommendedProducts.length dependency

  // Free shipping calculation moved to useMemo above for performance

  // 🎯 MOBILE GESTURE HANDLERS
  const handleSwipeDown = useCallback(() => {
    if (isMobile) {
      triggerHaptic('light');
      onClose();
    }
  }, [isMobile, triggerHaptic, onClose]);

  // 🎯 ENHANCED MOBILE TOUCH HANDLERS - Improved Swipe Detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isOpen) return;
    
    // Only handle swipe on backdrop (not on modal content)
    if ((e.target as HTMLElement).closest('[role="dialog"]')) {
      return;
    }
    
    const touch = e.touches[0];
    const startY = touch.clientY;
    const startTime = Date.now();
    let hasMoved = false;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length === 0) return;
      
      const currentY = moveEvent.touches[0].clientY;
      const deltaY = currentY - startY;
      const currentTime = Date.now();
      const deltaTime = currentTime - startTime;
      
      // Prevent scrolling if swiping down
      if (deltaY > 10) {
        hasMoved = true;
        moveEvent.preventDefault();
      }
      
      // Swipe down detection - improved threshold
      if (deltaY > 80 && deltaTime < 400 && hasMoved) {
        triggerHaptic('light');
        onClose();
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [isMobile, triggerHaptic, onClose, isOpen]);

  // 🎯 KEYBOARD NAVIGATION - ENHANCED
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerHaptic('light');
        setIsNavigating(false);
        onClose();
      }
      if (e.key === 'Enter' && animationPhase === 'choice' && !isNavigating) {
        setIsNavigating(true);
        triggerHaptic('heavy');
        onGoToCheckout();
      }
      // 'C' key for continue shopping
      if ((e.key === 'c' || e.key === 'C') && animationPhase === 'recommendations' && !isNavigating && !e.ctrlKey && !e.metaKey) {
        setIsNavigating(true);
        triggerHaptic('medium');
        onContinueShopping();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, animationPhase, isNavigating, triggerHaptic, onClose, onGoToCheckout, onContinueShopping]);

  const handleRecommendationAdd = useCallback(async (productId: string) => {
    if (isAddingRecommendation) return;
    
    setIsAddingRecommendation(productId);
    triggerHaptic('medium');
    
    try {
      await onAddRecommendedProduct(productId);
      setAddedRecommendations(prev => new Set([...prev, productId]));
      triggerHaptic('success');
    } catch (error) {
      console.error('Error adding recommendation:', error);
    } finally {
      setIsAddingRecommendation(null);
    }
  }, [isAddingRecommendation, onAddRecommendedProduct, triggerHaptic]);

  if (!isOpen) return null;

  const modalContent = (
      <div 
        className={`fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center ${
          isMobile ? 'p-0 items-end' : 'p-4'
        }`}
        onTouchStart={handleTouchStart}
        style={{
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : undefined,
          // Prevent body scroll on mobile when modal is open
          ...(isMobile && { position: 'fixed', overflow: 'hidden', width: '100%', height: '100%' }),
          // Ensure modal doesn't block navigation when navigating
          pointerEvents: isNavigating ? 'none' : 'auto',
        }}
        onClick={(e) => {
          // Close on backdrop click (mobile-friendly)
          if (e.target === e.currentTarget && isMobile) {
            triggerHaptic('light');
            onClose();
          }
        }}
      >
      {/* 🎯 PARTICLE EXPLOSION ANIMATION - Optimized */}
      {showParticles && animationPhase === 'success' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-accent rounded-full animate-ping"
              style={{
                left: `${50 + (Math.random() - 0.5) * 100}%`,
                top: `${50 + (Math.random() - 0.5) * 100}%`,
                animationDelay: `${i * 50}ms`,
                animationDuration: '0.8s'
              }}
            />
          ))}
        </div>
      )}

      <motion.div 
        className={`relative w-full ${
          isMobile 
            ? 'max-w-none h-[95vh] max-h-[95vh] rounded-t-3xl rounded-b-none' 
            : 'max-w-md rounded-3xl'
        } bg-gradient-to-br from-black via-[#0a0a0a] to-[#050505] border border-white/10 shadow-2xl overflow-hidden flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="smart-cart-title"
        aria-describedby="smart-cart-description"
        initial={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.9, opacity: 0 }}
        animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* 🎯 MOBILE SWIPE HANDLE - Enhanced */}
        {isMobile && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-white/30 rounded-full mt-3 cursor-grab active:cursor-grabbing z-50 touch-none" />
        )}
        {/* 🎯 HEADER WITH SUCCESS ANIMATION - Mobile Optimized */}
        <div className={`relative ${isMobile ? 'p-4 pb-6 pt-8' : 'p-6'} border-b border-white/10 flex-shrink-0`}>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className={`absolute ${isMobile ? 'top-3 right-3' : 'top-4 right-4'} rounded-full p-2.5 hover:bg-white/10 active:scale-95 transition-all duration-200 touch-target ${
              isMobile ? 'min-w-[44px] min-h-[44px] flex items-center justify-center' : ''
            }`}
            aria-label="Modal schließen"
          >
            <X className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
          </button>

          {animationPhase === 'success' && (
            <div className="text-center space-y-4">
              <div className="relative">
                <div className={`w-20 h-20 bg-gradient-to-br from-accent to-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce ${isMobile ? 'scale-110' : ''}`}>
                  <ShoppingBag className="h-10 w-10 text-black" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="h-4 w-4 text-black" />
                </div>
                {/* 🎯 MOBILE SUCCESS RINGS */}
                {isMobile && (
                  <>
                    <div className="absolute inset-0 w-20 h-20 border-2 border-accent/30 rounded-full animate-ping" />
                    <div className="absolute inset-0 w-20 h-20 border border-accent/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                  </>
                )}
              </div>
              <div>
                <h2 id="smart-cart-title" className={`font-bold text-text mb-2 ${isMobile ? 'text-3xl' : 'text-2xl'}`}>🎉 Erfolgreich hinzugefügt!</h2>
                <p id="smart-cart-description" className="text-muted">{isMobile ? 'Artikel im Warenkorb' : 'Dein Artikel ist im Warenkorb'}</p>
              </div>
            </div>
          )}

          {animationPhase === 'choice' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text mb-2">Was möchtest du tun?</h2>
                <p className="text-muted">Du hast {productName} zum Warenkorb hinzugefügt</p>
              </div>
            </div>
          )}

          {animationPhase === 'recommendations' && (
            <div className="relative">
              {/* Green Icon Circle - wie im Screenshot */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-accent to-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0 ring-2 ring-emerald-400/20">
                  <Gift className="h-6 w-6 text-black" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">Perfekt ergänzen</h2>
                  <p className="text-sm text-muted/80">Diese Artikel passen zu deiner Auswahl</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🎯 SMART CHOICE SECTION - Scrollable on Mobile */}
        <div className={`transition-all duration-700 ease-out flex-1 overflow-y-auto ${
          animationPhase === 'choice' 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none absolute'
        } ${isMobile ? 'overscroll-contain' : ''}`}>
          {animationPhase === 'choice' && (
            <div className={`${isMobile ? 'p-4 pb-6' : 'p-6'} space-y-6`}>
            {/* 🎯 FREE SHIPPING PROGRESS - Upgraded */}
            {freeShippingRemaining > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-accent/10 to-emerald-400/10 rounded-xl border border-accent/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Truck className="h-5 w-5 text-accent" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="font-semibold text-text">Kostenloser Versand</div>
                    <div className="text-sm text-muted">
                      Noch {formatCurrency(freeShippingRemaining, 'de-DE', 'EUR')} für kostenlosen Versand!
                    </div>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent via-emerald-400 to-green-400 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShippingProgress}%` }}
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

            {/* 🎯 ACTION BUTTONS - MAXIMIERT GEIL */}
            <div className="space-y-4">
              {/* 🎯 ZUM WARENKORB BUTTON - GEIL */}
              <motion.button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  triggerHaptic('medium');
                  
                  // Close all modals FIRST
                  closeProduct(); // Close product modal
                  if (onClose) {
                    onClose(); // Close confirmation modal
                  }
                  
                  // Then open cart after a short delay
                  setTimeout(() => {
                    openCart();
                  }, 200);
                }}
                className={`group relative w-full flex items-center justify-center gap-4 ${
                  isMobile ? 'py-6 px-6 text-lg min-h-[72px]' : 'py-5 px-6 min-h-[64px]'
                } bg-gradient-to-r from-[#4ade80] via-[#45d178] to-[#4ade80] bg-[length:200%_100%] text-black rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-[#4ade80]/40 touch-target overflow-hidden`}
                style={{
                  backgroundPosition: '0% 50%',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  zIndex: 1000,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundPosition = '100% 50%';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = '0% 50%';
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Icon with animation */}
                <motion.div
                  className="relative"
                >
                  <motion.div whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                    <ShoppingBag className="h-6 w-6" strokeWidth={2.5} />
                  </motion.div>
                </motion.div>
                
                {/* Text */}
                <span className="text-lg font-bold">
                  {`Zum Warenkorb (${formatCurrency(cartTotal, 'de-DE', 'EUR')})`}
                </span>
                
                {/* Arrow animation */}
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-6 w-6" strokeWidth={2.5} />
                </motion.div>
                
                {/* Shimmer Effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                />
                
                {/* Pulse glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-[#4ade80]/20"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>

              {/* 🎯 ZUR KASSE BUTTON - GEIL */}
              <motion.button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (isNavigating) return;
                  
                  // Navigate using optimized function
                  navigateToCheckout();
                }}
                disabled={isNavigating}
                className={`group relative w-full flex items-center justify-center gap-4 ${
                  isMobile ? 'py-6 px-6 text-lg min-h-[72px]' : 'py-5 px-6 min-h-[64px]'
                } bg-gradient-to-r from-accent via-emerald-400 to-accent bg-[length:200%_100%] text-black rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-accent/40 touch-target overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed`}
                style={{
                  backgroundPosition: '0% 50%',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  zIndex: 1000,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundPosition = '100% 50%';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = '0% 50%';
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={isNavigating ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  {isNavigating ? (
                    <Loader2 className="h-6 w-6" />
                  ) : (
                    <motion.div whileHover={{ scale: 1.2, rotate: 15 }}>
                      <Zap className="h-6 w-6" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </motion.div>
                <span className="text-lg font-bold">
                  {isNavigating ? 'Wird weitergeleitet...' : `Zur Kasse (${formatCurrency(cartTotal, 'de-DE', 'EUR')})`}
                </span>
                <motion.div
                  animate={isNavigating ? {} : { x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-6 w-6" strokeWidth={2.5} />
                </motion.div>
                {/* Shimmer Effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: isNavigating ? '0%' : '200%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                />
              </motion.button>

              {/* 🎯 WEITER SHOPPEN BUTTON - GEIL */}
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  triggerHaptic('medium');
                  // Only close confirmation modal, stay on shop page
                  onContinueShopping();
                }}
                className={`group relative w-full flex items-center justify-center gap-4 ${
                  isMobile ? 'py-5 px-6 text-base min-h-[64px]' : 'py-4 px-6 min-h-[56px]'
                } bg-gradient-to-r from-white/10 via-white/15 to-white/10 bg-[length:200%_100%] text-white rounded-xl font-semibold hover:from-white/20 hover:via-white/25 hover:to-white/20 active:scale-95 transition-all duration-300 touch-target border-2 border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
                style={{
                  backgroundPosition: '0% 50%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundPosition = '100% 50%';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = '0% 50%';
                }}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Plus className="h-5 w-5" />
                </motion.div>
                <span className="text-base font-semibold">{isNavigating ? 'Weiterleiten...' : 'Weiter shoppen'}</span>
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </motion.button>
            </div>

            {/* 🎯 CART SUMMARY */}
            <div className="p-4 bg-black/30 rounded-xl border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-muted">Warenkorb</span>
                <span className="font-bold text-text">{formatCurrency(cartTotal, 'de-DE', 'EUR')}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted">
                <Shield className="h-4 w-4" />
                <span>Sichere Bezahlung</span>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* 🎯 SMART RECOMMENDATIONS - Scrollable on Mobile */}
        <div className={`transition-all duration-700 ease-out flex-1 overflow-y-auto ${
          animationPhase === 'recommendations'
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none absolute'
        } ${isMobile ? 'overscroll-contain' : ''}`}>
          {animationPhase === 'recommendations' && (
            <div className={`${isMobile ? 'p-4 pb-6' : 'p-6'} space-y-6`}>
            <div className="space-y-3">
              {displayedRecommendations.length > 0 ? (
                displayedRecommendations.map((product) => {
                  const isAdded = addedRecommendations.has(product.id);
                  const isAdding = isAddingRecommendation === product.id;
                  return (
                  <div key={product.id} className={`flex items-center gap-4 ${
                    isMobile ? 'p-5' : 'p-4'
                  } bg-gradient-to-r from-black/40 via-black/30 to-black/40 rounded-xl border border-white/10 hover:border-emerald-400/30 transition-all duration-300 backdrop-blur-sm touch-target`}>
                    <div className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} bg-white/5 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/10`}>
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-accent/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-white text-sm truncate">{product.name}</h3>
                        {product.badge && (
                          <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500/30 to-accent/30 text-emerald-400 text-xs rounded-full border border-emerald-500/30 flex-shrink-0">
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-400 font-bold text-base">{formatCurrency(product.price, 'de-DE', 'EUR')}</p>
                    </div>
                    <button
                      onClick={() => handleRecommendationAdd(product.id)}
                      disabled={isAdding || isAdded}
                      className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} rounded-full flex items-center justify-center transition-all duration-300 touch-target flex-shrink-0 ${
                        isAdded
                          ? 'bg-green-500/30 text-green-400 border-2 border-green-500/50'
                          : isAdding
                          ? 'bg-emerald-400/30 text-emerald-400 border-2 border-emerald-400/50 animate-pulse'
                          : 'bg-emerald-400/20 text-emerald-400 border-2 border-emerald-400/30 hover:bg-emerald-400/30 hover:scale-110 active:scale-95 hover:border-emerald-400/50'
                      }`}
                      aria-label={`${product.name} zum Warenkorb hinzufügen`}
                    >
                      {isAdded ? (
                        <div className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} bg-green-400 rounded-full flex items-center justify-center`}>
                          <div className={`${isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'} bg-black rounded-full`} />
                        </div>
                      ) : isAdding ? (
                        <div className={`${isMobile ? 'w-6 h-6 border-[2.5px]' : 'w-5 h-5 border-2'} border-emerald-400 border-t-transparent rounded-full animate-spin`} />
                      ) : (
                        <Plus className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
                      )}
                    </button>
                  </div>
                  );
                })
              ) : (
                // Fallback when no recommendations are available
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-8 w-8 text-accent" />
                  </div>
                  <p className="text-muted mb-4">Keine Empfehlungen verfügbar</p>
                  <p className="text-sm text-muted">Entdecke mehr Produkte in unserem Shop!</p>
                </div>
              )}
            </div>

            {/* 🎯 FINAL ACTION BUTTONS - MAXIMIERT GEIL */}
            <div className="space-y-4">
              {/* 🎯 ZUM WARENKORB BUTTON - GEIL */}
              <motion.button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  triggerHaptic('medium');
                  
                  // Close all modals FIRST
                  closeProduct(); // Close product modal
                  if (onClose) {
                    onClose(); // Close confirmation modal
                  }
                  
                  // Then open cart after a short delay
                  setTimeout(() => {
                    openCart();
                  }, 200);
                }}
                className={`group relative w-full flex items-center justify-center gap-4 ${
                  isMobile ? 'py-6 px-6 text-lg min-h-[72px]' : 'py-5 px-6 min-h-[64px]'
                } bg-gradient-to-r from-[#4ade80] via-[#45d178] to-[#4ade80] bg-[length:200%_100%] text-black rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-[#4ade80]/40 touch-target overflow-hidden`}
                style={{
                  backgroundPosition: '0% 50%',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  zIndex: 1000,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundPosition = '100% 50%';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = '0% 50%';
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={isNavigating ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  {isNavigating ? (
                    <Loader2 className="h-6 w-6" />
                  ) : (
                    <motion.div whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                      <ShoppingBag className="h-6 w-6" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </motion.div>
                <span className="text-lg font-bold">
                  {isNavigating ? 'Wird geöffnet...' : `Zum Warenkorb (${formatCurrency(cartTotal, 'de-DE', 'EUR')})`}
                </span>
                <motion.div
                  animate={isNavigating ? {} : { x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-6 w-6" strokeWidth={2.5} />
                </motion.div>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: isNavigating ? '0%' : '200%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                />
                {!isNavigating && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-[#4ade80]/20"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>

              {/* 🎯 ZUR KASSE BUTTON - GEIL */}
              <motion.button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (isNavigating) return;
                  
                  // Navigate using optimized function
                  navigateToCheckout();
                }}
                disabled={isNavigating}
                className={`group relative w-full flex items-center justify-center gap-4 ${
                  isMobile ? 'py-6 px-6 text-lg min-h-[72px]' : 'py-5 px-6 min-h-[64px]'
                } bg-gradient-to-r from-accent via-emerald-400 to-accent bg-[length:200%_100%] text-black rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-accent/40 touch-target overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed`}
                style={{
                  backgroundPosition: '0% 50%',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  zIndex: 1000,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundPosition = '100% 50%';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = '0% 50%';
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={isNavigating ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  {isNavigating ? (
                    <Loader2 className="h-6 w-6" />
                  ) : (
                    <motion.div whileHover={{ scale: 1.2, rotate: 15 }}>
                      <Zap className="h-6 w-6" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </motion.div>
                <span className="text-lg font-bold">
                  {isNavigating ? 'Wird weitergeleitet...' : `Zur Kasse (${formatCurrency(cartTotal, 'de-DE', 'EUR')})`}
                </span>
                <motion.div
                  animate={isNavigating ? {} : { x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-6 w-6" strokeWidth={2.5} />
                </motion.div>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: isNavigating ? '0%' : '200%' }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                />
              </motion.button>

              {/* 🎯 WEITER SHOPPEN BUTTON - GEIL */}
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  triggerHaptic('medium');
                  // Only close confirmation modal, stay on shop page
                  onContinueShopping();
                }}
                className={`group relative w-full flex items-center justify-center gap-4 ${
                  isMobile ? 'py-5 px-6 text-base min-h-[64px]' : 'py-4 px-6 min-h-[56px]'
                } bg-gradient-to-r from-white/10 via-white/15 to-white/10 bg-[length:200%_100%] text-white rounded-xl font-semibold hover:from-white/20 hover:via-white/25 hover:to-white/20 active:scale-95 transition-all duration-300 touch-target border-2 border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden`}
                style={{
                  backgroundPosition: '0% 50%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundPosition = '100% 50%';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundPosition = '0% 50%';
                }}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Plus className="h-5 w-5" />
                </motion.div>
                <span className="text-base font-semibold">{isNavigating ? 'Weiterleiten...' : 'Weiter shoppen'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </motion.button>
            </div>
          </div>
        )}
        </div>
      </motion.div>
    </div>
  );

  // Use portal to ensure it's always on top, especially on mobile
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
});
