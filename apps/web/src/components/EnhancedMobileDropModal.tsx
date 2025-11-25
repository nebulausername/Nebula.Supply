import { useEffect, useMemo, useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDropsStore, useSelectedDrop } from '../store/drops';
import { useShopStore } from '../store/shop';
import { formatCurrency } from '../utils/currency';
import { cn } from '../utils/cn';

// Import new components
import { EnhancedProductImage } from './drops/EnhancedProductImage';
import { VariantSelector } from './drops/VariantSelector';
import { QuantityControl } from './drops/QuantityControl';
import { PriceDisplay } from './drops/PriceDisplay';
import { DropBadge } from './drops/DropBadge';
import { InviteRequiredModal } from './InviteRequiredModal';
import { DropSmartCartConfirmation } from './drops/DropSmartCartConfirmation';
import { DropCountdown } from './drops/DropCountdown';

// Import hooks
import { useDropInteractions } from '../hooks/drops/useDropInteractions';
import { useVariantSelection } from '../hooks/drops/useVariantSelection';
import { useDropGestures } from '../hooks/drops/useDropGestures';
import { useEnhancedTouch } from '../hooks/useEnhancedTouch';
import { usePullToRefresh } from '../hooks/useEnhancedTouch';

// Import cart functions
import { useGlobalCartStore } from '../store/globalCart';
import { checkoutDrop } from '../utils/checkoutDrop';
import { showToast } from '../store/toast';

/**
 * 🎨 Enhanced Mobile-Optimized Drop Modal
 * Features: Hero parallax, variant gallery, gesture controls, haptic feedback
 */
export const EnhancedMobileDropModal = () => {
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🎯 Smart Cart Confirmation State
  const [showDropSmartCartConfirmation, setShowDropSmartCartConfirmation] = useState(false);
  const [addedItems, setAddedItems] = useState<Array<{ variantLabel: string; quantity: number; price: number }>>([]);
  const [totalAddedPrice, setTotalAddedPrice] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useEnhancedTouch();

  const selected = useSelectedDrop();
  const drop = selected?.drop;
  const { closeDrop } = useDropsStore();
  const { invite } = useShopStore();

  // 🎯 Create fallback drop object with minimal structure
  const fallbackDrop: any = {
    id: '',
    name: '',
    variants: [],
    defaultVariantId: '',
    progress: 0,
    badge: '',
    currency: 'EUR',
    interestCount: 0
  };

  const safeDrop = drop ?? fallbackDrop;

  // 🎯 Custom hooks - Must be called before early return
  const {
    handleAddToCart,
    handleToggleInterest,
    handleShare,
    checkAccess,
    interestCount,
    isInterested
  } = useDropInteractions(safeDrop);

  const {
    selectedVariant,
    selectedVariantId,
    selectVariant,
    selectedVariantIds,
    toggleVariant,
    variantQuantities,
    setVariantQuantity,
    totalPrice,
    totalQuantity,
    hasSelection
  } = useVariantSelection(safeDrop, {
    mode: 'multi',
    defaultVariantId: safeDrop.defaultVariantId
  });

  // 🎯 Scroll Progress Tracking
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 🎯 Pull to Refresh
  const { onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh(async () => {
    setIsRefreshing(true);
    triggerHaptic('medium');
    
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsRefreshing(false);
    triggerHaptic('success');
  });

  // 🎯 Gesture handlers for variant navigation
  const variantGestures = useDropGestures({
    onSwipeLeft: () => {
      if (drop && activeVariantIndex < drop.variants.length - 1) {
        setActiveVariantIndex(activeVariantIndex + 1);
        selectVariant(drop.variants[activeVariantIndex + 1].id);
      }
    },
    onSwipeRight: () => {
      if (drop && activeVariantIndex > 0) {
        setActiveVariantIndex(activeVariantIndex - 1);
        selectVariant(drop.variants[activeVariantIndex - 1].id);
      }
    },
    onDoubleTap: () => {
      if (drop && selectedVariant) {
        const variant = Array.isArray(selectedVariant) ? selectedVariant[0] : selectedVariant;
        toggleVariant(variant.id);
      }
    }
  });

  // 🎯 Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!drop) return;

      switch (e.key) {
        case 'Escape':
          closeDrop();
          break;
        case 'ArrowLeft':
          if (activeVariantIndex > 0) {
            setActiveVariantIndex(activeVariantIndex - 1);
            selectVariant(drop.variants[activeVariantIndex - 1].id);
          }
          break;
        case 'ArrowRight':
          if (activeVariantIndex < drop.variants.length - 1) {
            setActiveVariantIndex(activeVariantIndex + 1);
            selectVariant(drop.variants[activeVariantIndex + 1].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drop, activeVariantIndex, closeDrop, selectVariant]);

  const handleCheckout = async () => {
    if (!drop) return;

    const variants = Array.isArray(selectedVariant) ? selectedVariant : [selectedVariant];
    
    // Check if any variant requires invite
    const requiresInvite = variants.some(v => v?.inviteRequired ?? drop.inviteRequired);
    
    if (requiresInvite && !invite?.hasInvite) {
      setShowInviteModal(true);
      return;
    }

    // Build checkout lines from selected variants
    const lines = variants
      .filter((v): v is NonNullable<typeof v> => !!v)
      .map(variant => ({
        variant,
        quantity: variantQuantities[variant.id] ?? 1
      }));

    // Use unified checkout
    const result = await checkoutDrop({
      drop,
      lines,
      invite,
      openCart: false // We'll handle cart open via confirmation
    });

    // 🎯 Show Smart Cart Confirmation
    if (result.ok) {
      triggerHaptic('success');
      setAddedItems(result.itemsAdded);
      setTotalAddedPrice(result.totalPrice);
      setShowDropSmartCartConfirmation(true);
      // Ensure cart opens even if user does nothing
      setTimeout(() => {
        closeDrop();
        useGlobalCartStore.getState().openCart();
      }, 1200);
    } else {
      triggerHaptic('error');
    }
  };

  // 🎯 Reset states when modal closes
  useEffect(() => {
    if (!drop) {
      // Reset all confirmation states when drop modal is closed
      setShowDropSmartCartConfirmation(false);
      setAddedItems([]);
      setTotalAddedPrice(0);
    }
  }, [drop]);
  
  // 🎯 Don't render if no drop - MUST be after ALL hooks
  if (!drop) return null;

  // 🎯 REMOVED: Auto-close timeout - User soll selbst entscheiden!
  // Kein automatisches Schließen mehr - Modal bleibt offen bis User interagiert

  const activeVariant = drop.variants[activeVariantIndex];
  const canProceed = hasSelection && totalQuantity > 0;

  return (
    <>
      <Dialog.Root open={!!drop} onOpenChange={() => closeDrop()}>
        <Dialog.Portal>
          <Dialog.Overlay 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md transition-opacity duration-300"
            style={{ 
              opacity: showDropSmartCartConfirmation ? 0 : 1,
              pointerEvents: showDropSmartCartConfirmation ? 'none' : 'auto'
            }}
          />
          
          <Dialog.Content 
            className="fixed inset-0 z-50 flex flex-col md:inset-4 md:m-auto md:max-w-5xl md:max-h-[90vh] md:rounded-3xl overflow-hidden bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505] border-2 border-white/20 shadow-2xl"
            style={{
              pointerEvents: showDropSmartCartConfirmation ? 'none' : 'auto',
              boxShadow: '0 0 60px rgba(11, 247, 188, 0.15), 0 0 120px rgba(11, 247, 188, 0.05), 0 20px 80px rgba(0, 0, 0, 0.9)'
            }}
          >
            {/* ✨ Premium Animated Background Gradient */}
            <div className="absolute inset-0 opacity-20 animate-[gradient_8s_ease-in-out_infinite] pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0BF7BC]/20 via-transparent to-orange-500/20" />
            </div>

            {/* 🎯 Progress Indicator mit Glow */}
            <div 
              className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-accent via-cyan-400 to-accent transition-all duration-300 z-50 shadow-[0_0_20px_rgba(11,247,188,0.8)]"
              style={{ 
                width: `${scrollProgress}%`,
                boxShadow: '0 0 20px rgba(11, 247, 188, 0.8), 0 0 40px rgba(11, 247, 188, 0.4)'
              }}
            />

            {/* 🎯 Refreshing Indicator */}
            {isRefreshing && (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent to-cyan-400 animate-pulse z-50 shadow-[0_0_30px_rgba(11,247,188,1)]" />
            )}

            {/* 🎯 Header mit Premium Glassmorphism */}
            <div className="relative flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-black/60 via-black/40 to-black/60 backdrop-blur-2xl z-40">
              {/* Subtle Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shine_3s_ease-in-out_infinite]" />
              <div className="flex items-center gap-3 relative z-10">
                <DropBadge type={drop.badge} size="sm" showGlow={false} />
                <div>
                  <h2 className="text-lg font-bold text-text">{drop.name}</h2>
                  <p className="text-xs text-muted">
                    {selectedVariantIds.length > 0 
                      ? `${selectedVariantIds.length} ausgewählt` 
                      : 'Keine Auswahl'}
                  </p>
                </div>
              </div>
              <Dialog.Close className="relative z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-text transition hover:scale-110 active:scale-95">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            {/* 🎯 Scrollable Content */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto scroll-smooth"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* 🎨 Hero Section with Premium Parallax */}
              <div className="relative min-h-[60vh] p-6 flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Dynamic Background Gradient mit Pulse */}
                <div 
                  className="absolute inset-0 opacity-30 animate-[gradient_8s_ease-in-out_infinite]"
                  style={{
                    background: `radial-gradient(circle at center, ${activeVariant?.media?.[0]?.dominantColor ?? '#0BF7BC'} 0%, transparent 70%)`
                  }}
                />
                
                {/* Animated Orbs */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-accent/10 blur-3xl animate-[float_6s_ease-in-out_infinite]" />
                <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-cyan-400/10 blur-3xl animate-[float_8s_ease-in-out_infinite_1s]" />

                {/* Product Image with Gesture Support */}
                <div 
                  className="relative z-10 mb-6 w-full max-w-md"
                  {...variantGestures}
                >
                  <EnhancedProductImage
                    src={activeVariant?.media?.[0]?.url}
                    alt={activeVariant?.media?.[0]?.alt ?? activeVariant?.label}
                    fallbackColor={activeVariant?.media?.[0]?.dominantColor ?? '#0BF7BC'}
                    overlayLabel={activeVariant?.label}
                    aspectRatio="1 / 1"
                    enableZoom
                    enableParallax
                    priority
                  />

                  {/* 💎 Premium Navigation Arrows */}
                  {drop.variants.length > 1 && (
                    <>
                      {activeVariantIndex > 0 && (
                        <button
                          onClick={() => {
                            setActiveVariantIndex(activeVariantIndex - 1);
                            selectVariant(drop.variants[activeVariantIndex - 1].id);
                            triggerHaptic('light');
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gradient-to-br from-accent/20 to-cyan-400/20 backdrop-blur-xl border border-white/20 text-white hover:from-accent/30 hover:to-cyan-400/30 hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(11,247,188,0.3)]"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                      )}
                      {activeVariantIndex < drop.variants.length - 1 && (
                        <button
                          onClick={() => {
                            setActiveVariantIndex(activeVariantIndex + 1);
                            selectVariant(drop.variants[activeVariantIndex + 1].id);
                            triggerHaptic('light');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gradient-to-br from-accent/20 to-cyan-400/20 backdrop-blur-xl border border-white/20 text-white hover:from-accent/30 hover:to-cyan-400/30 hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(11,247,188,0.3)]"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      )}
                    </>
                  )}

                  {/* 💎 Premium Variant Indicator Dots */}
                  {drop.variants.length > 1 && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                      {drop.variants.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveVariantIndex(idx);
                            selectVariant(drop.variants[idx].id);
                            triggerHaptic('light');
                          }}
                          className={cn(
                            'rounded-full transition-all duration-300',
                            idx === activeVariantIndex
                              ? 'w-6 h-2 bg-gradient-to-r from-accent to-cyan-400 shadow-[0_0_15px_rgba(11,247,188,0.6)]'
                              : 'w-2 h-2 bg-white/30 hover:bg-white/50 hover:scale-125'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ✨ Premium Title mit Glow */}
                <div className="relative z-10 mt-8">
                  <h1 className="text-4xl md:text-5xl font-black text-text mb-2 tracking-tight drop-shadow-[0_0_30px_rgba(11,247,188,0.3)]">
                    {activeVariant?.label}
                  </h1>
                  <p className="text-lg text-accent font-medium drop-shadow-[0_0_20px_rgba(11,247,188,0.5)]">
                    {activeVariant?.flavor}
                  </p>
                  {/* Subtitle Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent blur-2xl opacity-50 pointer-events-none" />
                </div>

                {/* Swipe Hint */}
                {drop.variants.length > 1 && (
                  <p className="text-xs text-muted/50 mt-4">
                    ← Swipe für mehr Varianten →
                  </p>
                )}
              </div>

              {/* 🕐 PREMIUM LIVE-COUNTDOWN - Optimiert nach Produktbild */}
              {drop.deadlineAt && (
                <div className="px-6 pb-4">
                  <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-2xl p-4 shadow-2xl">
                    {/* Dynamic Animated Background */}
                    <div 
                      className="absolute inset-0 opacity-40 animate-[gradient_8s_ease-in-out_infinite]"
                      style={{
                        background: `radial-gradient(circle at center, ${activeVariant?.media?.[0]?.dominantColor ?? '#0BF7BC'} 0%, transparent 70%)`,
                        backgroundSize: '200% 200%'
                      }}
                    />
                    
                    {/* Pulse Ring Effect */}
                    <div className="absolute inset-0 border-2 border-accent/20 rounded-2xl animate-pulse" />
                    
                    <div className="relative z-10">
                      {/* Premium Header */}
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_12px_rgba(11,247,188,0.8)]" />
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse animation-delay-150 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse animation-delay-300 shadow-[0_0_12px_rgba(11,247,188,0.8)]" />
                        </div>
                        <span className="text-xs font-black text-accent/90 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(11,247,188,0.5)]">
                          ⏰ Drop endet in
                        </span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse animation-delay-300 shadow-[0_0_12px_rgba(11,247,188,0.8)]" />
                          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse animation-delay-150 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_12px_rgba(11,247,188,0.8)]" />
                        </div>
                      </div>
                      
                      {/* Countdown Component - Größer für bessere Lesbarkeit */}
                      <div className="flex justify-center transform scale-110">
                        <DropCountdown 
                          deadlineAt={drop.deadlineAt} 
                          variant="mobile"
                          className="shadow-2xl"
                        />
                      </div>
                      
                      {/* Urgency Message */}
                      {(() => {
                        const now = Date.now();
                        const deadline = new Date(drop.deadlineAt).getTime();
                        const hoursLeft = (deadline - now) / (1000 * 60 * 60);
                        
                        if (hoursLeft < 1) {
                          return (
                            <p className="text-center text-red-400 text-xs font-bold mt-3 animate-pulse">
                              🔥 Letzte Chance! Drop endet bald!
                            </p>
                          );
                        } else if (hoursLeft < 24) {
                          return (
                            <p className="text-center text-orange-400 text-xs font-semibold mt-3">
                              ⚡ Nur noch wenige Stunden!
                            </p>
                          );
                        } else if (hoursLeft < 72) {
                          return (
                            <p className="text-center text-accent text-xs font-medium mt-3">
                              ⏰ Beeile dich - Drop läuft bald ab!
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    {/* Multi-Layer Shine Effects */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] animate-[shine_5s_ease-in-out_infinite] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-accent/10 to-transparent translate-x-[200%] animate-[shine_7s_ease-in-out_infinite_1s] pointer-events-none" />
                  </div>
                </div>
              )}

              {/* 🎨 Variant Gallery (Glassmorphic) */}
              <div className="p-6 space-y-4 bg-gradient-to-b from-transparent to-black/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-text">Varianten wählen</h3>
                  <span className="text-sm text-muted">
                    {selectedVariantIds.length} / {drop.variants.length}
                  </span>
                </div>

                <VariantSelector
                  variants={drop.variants}
                  selectedIds={selectedVariantIds}
                  onSelect={toggleVariant}
                  mode="gallery"
                  currency={drop.currency}
                  showPrice
                  showStock
                />
              </div>

              {/* 🎨 Individual Quantity Controls (if multi-select) */}
              {selectedVariantIds.length > 0 && (
                <div className="p-6 space-y-4 bg-black/20 backdrop-blur-sm border-t border-white/10">
                  <h3 className="text-xl font-bold text-text">Mengen anpassen</h3>
                  {selectedVariantIds.map(variantId => {
                    const variant = drop.variants.find(v => v.id === variantId);
                    if (!variant) return null;

                    return (
                      <div key={variantId} className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-text">{variant.label}</span>
                          <span className="text-sm text-accent font-bold">
                            {formatCurrency(variant.basePrice * (variantQuantities[variantId] ?? 1), 'de-DE', drop.currency)}
                          </span>
                        </div>
                        <QuantityControl
                          value={variantQuantities[variantId] ?? 1}
                          min={variant.minQuantity ?? 1}
                          max={Math.min(variant.maxQuantity ?? 10, variant.stock)}
                          onChange={(qty) => setVariantQuantity(variantId, qty)}
                          showSlider
                          size="sm"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 🎨 Price Summary (Floating Mini-Cart) */}
              {hasSelection && (
                <div className="p-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/20 via-cyan-500/10 to-transparent border border-accent/30 backdrop-blur-xl">
                    <PriceDisplay
                      price={totalPrice / totalQuantity}
                      currency={drop.currency}
                      quantity={totalQuantity}
                      showBreakdown
                      showSavings
                      animate
                      size="lg"
                    />
                  </div>
                </div>
              )}

              {/* Spacer for bottom action bar */}
              <div className="h-32" />
            </div>

            {/* 💎 PREMIUM BOTTOM ACTION BAR (Sticky) */}
            <div className="relative sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-2xl border-t border-white/20 z-40 overflow-hidden">
              {/* ✨ Animated Premium Glow Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-cyan-400/10 to-accent/10 animate-[shimmer_3s_ease-in-out_infinite] opacity-50" />
              
              <div className="relative z-10 flex gap-3">
                <button
                  onClick={handleCheckout}
                  disabled={!canProceed}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 relative overflow-hidden',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black',
                    canProceed
                      ? 'bg-gradient-to-r from-accent via-cyan-400 to-accent text-black hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(11,247,188,0.8)] active:scale-[0.98] shadow-[0_0_30px_rgba(11,247,188,0.6)]'
                      : 'bg-white/10 text-muted cursor-not-allowed opacity-50'
                  )}
                  style={canProceed ? {
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s ease-in-out infinite'
                  } : {}}
                >
                  {/* Shine Effect */}
                  {canProceed && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] animate-[shine_3s_ease-in-out_infinite]" />
                  )}
                  
                  <ShoppingCart className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">
                    {canProceed 
                      ? `${formatCurrency(totalPrice, 'de-DE', drop.currency)} bestellen` 
                      : 'Wähle Varianten'}
                  </span>
                </button>
              </div>

              {/* 💫 Premium Quick Actions */}
              <div className="relative z-10 flex justify-center gap-4 mt-3">
                <button
                  onClick={handleToggleInterest}
                  className="text-sm text-muted hover:text-accent transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  {isInterested ? '★ Interessiert' : '☆ Interesse'}
                </button>
                <button
                  onClick={handleShare}
                  className="text-sm text-muted hover:text-accent transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  Teilen
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 🎯 Drop Smart Cart Confirmation - OUTSIDE DIALOG SYSTEM */}
      {showDropSmartCartConfirmation && (
        <DropSmartCartConfirmation
          isOpen={showDropSmartCartConfirmation}
          onClose={() => {
            console.log('❌ Close clicked');
            setShowDropSmartCartConfirmation(false);
          }}
          onContinueShopping={() => {
            console.log('🔄 Continue shopping - closing everything and going back to drops');
            setShowDropSmartCartConfirmation(false);
            closeDrop(); // Close the drop modal, goes back to drops page
            
            // Show confirmation toast
            showToast.success(
              '✅ Im Warenkorb!',
              `${addedItems.length} ${addedItems.length === 1 ? 'Sorte ist' : 'Sorten sind'} jetzt in deinem Warenkorb`
            );
          }}
          onGoToCart={() => {
            console.log('🛒 Going to cart');
            setShowDropSmartCartConfirmation(false);
            closeDrop(); // Close drop modal first
            
            // Show success toast
            showToast.success(
              '🎉 Erfolgreich hinzugefügt!',
              `${addedItems.length} ${addedItems.length === 1 ? 'Sorte wurde' : 'Sorten wurden'} zum Warenkorb hinzugefügt`
            );
            
            setTimeout(() => {
              console.log('📦 Opening cart now');
              useGlobalCartStore.getState().openCart();
            }, 500);
          }}
          onGoToCheckout={() => {
            console.log('✅ Going to checkout');
            setShowDropSmartCartConfirmation(false);
            closeDrop(); // Close drop modal first
            
            // Show success toast
            showToast.success(
              '🎉 Erfolgreich hinzugefügt!',
              `${addedItems.length} ${addedItems.length === 1 ? 'Sorte wurde' : 'Sorten wurden'} zum Warenkorb hinzugefügt`
            );
            
            // Navigate to checkout - DO NOT open cart modal!
            setTimeout(() => {
              console.log('🛒 Navigating to checkout');
              window.location.href = '/checkout';
            }, 300);
          }}
          addedItems={addedItems}
          totalAddedPrice={totalAddedPrice}
          cartTotal={useGlobalCartStore.getState().totalPrice}
          freeShippingThreshold={50}
          dropName={drop?.name ?? ''}
          dropImage={drop?.media?.[0]?.url}
        />
      )}

      {/* Invite Required Modal */}
      <InviteRequiredModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={() => setShowInviteModal(false)}
        dropName={drop?.name}
      />
    </>
  );
};

