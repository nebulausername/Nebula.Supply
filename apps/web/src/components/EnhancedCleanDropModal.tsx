import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { 
  X, Heart, Share2, CheckCircle, Truck, 
  ChevronLeft, ChevronRight, Maximize2, Info
} from 'lucide-react';
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
import { ProgressBar } from './ProgressBar';
import { DropSmartCartConfirmation } from './drops/DropSmartCartConfirmation';
import { DropCountdown } from './drops/DropCountdown';
import { useGlobalCartStore } from '../store/globalCart';
import { checkoutSingleVariant } from '../utils/checkoutDrop';
import { showToast } from '../store/toast';

// Import hooks
import { useDropInteractions } from '../hooks/drops/useDropInteractions';
import { useVariantSelection } from '../hooks/drops/useVariantSelection';

/**
 * 🎨 Enhanced Clean Drop Modal (Desktop-Optimized)
 * Features: Advanced image gallery, zoom, keyboard navigation, tooltips
 */
export const EnhancedCleanDropModal = () => {
  const navigate = useNavigate();
  const [showReservationToast, setShowReservationToast] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showDropSmartCartConfirmation, setShowDropSmartCartConfirmation] = useState(false);
  const [addedItems, setAddedItems] = useState<Array<{ variantLabel: string; quantity: number; price: number }>>([]);
  const [totalAddedPrice, setTotalAddedPrice] = useState(0);

  const selected = useSelectedDrop();
  const drop = selected?.drop;
  const { closeDrop } = useDropsStore();
  const { invite } = useShopStore();

  // 🎯 Custom hooks
  const {
    handleAddToCart,
    handleToggleInterest,
    handleShare,
    checkAccess,
    interestCount,
    isInterested
  } = useDropInteractions(drop!);

  const {
    selectedVariant,
    selectedVariantId,
    selectVariant,
    isVariantSelected
  } = useVariantSelection(drop!, {
    mode: 'single',
    defaultVariantId: drop?.defaultVariantId
  });

  const [quantity, setQuantity] = useState(1);

  const variant = selectedVariant as any;
  const canPreorder = checkAccess(variant);
  const minQuantity = variant?.minQuantity ?? 1;
  const maxQuantity = Math.min(variant?.maxQuantity ?? 10, variant?.stock ?? 10);
  
  // Get all images from variant
  const allImages = useMemo(() => {
    if (!variant?.media) return [];
    return variant.media;
  }, [variant]);

  // 🎯 Keyboard Navigation
  useEffect(() => {
    if (!drop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close modal
      if (e.key === 'Escape') {
        closeDrop();
        return;
      }

      // Image navigation
      if (e.key === 'ArrowLeft' && activeImageIndex > 0) {
        setActiveImageIndex(activeImageIndex - 1);
        return;
      }
      if (e.key === 'ArrowRight' && activeImageIndex < allImages.length - 1) {
        setActiveImageIndex(activeImageIndex + 1);
        return;
      }

      // Variant selection (1-9 keys)
      const num = parseInt(e.key);
      if (num >= 1 && num <= Math.min(9, drop.variants.length)) {
        selectVariant(drop.variants[num - 1].id);
        return;
      }

      // Quantity shortcuts
      if (e.key === '+' || e.key === '=') {
        setQuantity(Math.min(quantity + 1, maxQuantity));
        return;
      }
      if (e.key === '-' || e.key === '_') {
        setQuantity(Math.max(quantity - 1, minQuantity));
        return;
      }

      // Add to cart (Enter)
      if (e.key === 'Enter' && canPreorder) {
        handleCheckout();
        return;
      }

      // Toggle interest (i)
      if (e.key === 'i') {
        handleToggleInterest();
        return;
      }

      // Share (s)
      if (e.key === 's') {
        handleShare();
        return;
      }

      // Fullscreen (f)
      if (e.key === 'f') {
        setIsFullscreen(!isFullscreen);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drop, activeImageIndex, allImages.length, quantity, minQuantity, maxQuantity, canPreorder, isFullscreen]);

  const handleCheckout = async () => {
    if (!drop || !variant) return;
    
    const result = await checkoutSingleVariant({
      drop,
      variant: variant as any,
      quantity,
      invite,
      openCart: false // We'll handle cart open via confirmation
    });
    
    if (result.ok) {
      setAddedItems(result.itemsAdded);
      setTotalAddedPrice(result.totalPrice);
      setShowDropSmartCartConfirmation(true);
    }
  };

  if (!drop) return null;

  // Reset on close
  useEffect(() => {
    if (!drop) {
      setShowDropSmartCartConfirmation(false);
      setAddedItems([]);
      setTotalAddedPrice(0);
    }
  }, [drop]);

  // 🎯 REMOVED: Auto-close timeout - User soll selbst entscheiden!
  // Kein automatisches Schließen mehr - Modal bleibt offen bis User interagiert

  const activeImage = allImages[activeImageIndex];

  return (
    <Dialog.Root open={!!drop} onOpenChange={() => closeDrop()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        
        <Dialog.Content className={cn(
          "fixed z-50 flex overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 shadow-2xl focus:outline-none border border-blue-500/20",
          isFullscreen 
            ? "inset-0" 
            : "inset-4 md:inset-[5vh] md:left-1/2 md:-translate-x-1/2 md:max-w-6xl md:rounded-3xl"
        )}>
          {/* 🎯 Scroll Progress */}
          <div 
            className="absolute top-0 left-0 h-1 bg-accent z-50 transition-all"
            style={{ width: `${scrollProgress}%` }}
          />

          <div className="flex flex-1 flex-col md:flex-row">
            {/* 🎨 Left Column - Image Gallery */}
            <div className="flex-1 flex flex-col bg-black/40 overflow-hidden">
              {/* Main Image */}
              <div className="flex-1 relative">
                <EnhancedProductImage
                  src={activeImage?.url}
                  alt={activeImage?.alt ?? variant?.label}
                  fallbackColor={activeImage?.dominantColor ?? '#0BF7BC'}
                  overlayLabel={variant?.label}
                  aspectRatio="auto"
                  enableZoom
                  priority
                  className="h-full"
                />

                {/* Image Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    {activeImageIndex > 0 && (
                      <button
                        onClick={() => setActiveImageIndex(activeImageIndex - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-all hover:scale-110"
                        onMouseEnter={() => setShowTooltip('Previous Image (←)')}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                    )}
                    {activeImageIndex < allImages.length - 1 && (
                      <button
                        onClick={() => setActiveImageIndex(activeImageIndex + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-all hover:scale-110"
                        onMouseEnter={() => setShowTooltip('Next Image (→)')}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    )}
                  </>
                )}

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="absolute top-4 right-4 p-3 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-all hover:scale-110"
                  onMouseEnter={() => setShowTooltip('Fullscreen (F)')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Maximize2 className="h-5 w-5" />
                </button>

                {/* Image Counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                    {activeImageIndex + 1} / {allImages.length}
                  </div>
                )}

                {/* Tooltip */}
                {showTooltip && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-sm text-white text-sm whitespace-nowrap">
                    {showTooltip}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-4 bg-black/60 backdrop-blur-sm overflow-x-auto">
                  {allImages.map((img: { url: string; alt?: string }, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                        idx === activeImageIndex
                          ? "border-accent scale-110 shadow-lg shadow-accent/50"
                          : "border-white/20 hover:border-accent/50 opacity-60 hover:opacity-100"
                      )}
                    >
                      <img
                        src={img.url}
                        alt={img.alt || ''}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 🎨 Right Column - Product Details & Actions */}
            <div className="w-full md:w-[480px] flex flex-col bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-sm overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <DropBadge type={drop.badge} showGlow />
                      {variant?.badges?.map((badge: string) => (
                        <DropBadge key={badge} type={badge as any} variant="outline" showIcon={false} />
                      ))}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{drop.name}</h1>
                    <p className="text-lg text-blue-200">{variant?.label} · {variant?.flavor}</p>
                  </div>
                </div>

                {/* 🕐 PREMIUM LIVE-COUNTDOWN - Desktop Version */}
                {drop.deadlineAt && (
                  <div className="mb-4">
                    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-2xl p-4 shadow-2xl">
                      {/* Dynamic Animated Background */}
                      <div 
                        className="absolute inset-0 opacity-40 animate-[gradient_8s_ease-in-out_infinite]"
                        style={{
                          background: `radial-gradient(circle at center, ${activeImage?.dominantColor ?? '#0BF7BC'} 0%, transparent 70%)`,
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
                        
                        {/* Countdown Component - Desktop Variante */}
                        <div className="flex justify-center">
                          <DropCountdown 
                            deadlineAt={drop.deadlineAt} 
                            variant="desktop"
                            className="shadow-2xl scale-110"
                          />
                        </div>
                        
                        {/* Urgency Message */}
                        {(() => {
                          const now = Date.now();
                          const deadline = new Date(drop.deadlineAt).getTime();
                          const hoursLeft = (deadline - now) / (1000 * 60 * 60);
                          
                          if (hoursLeft < 1) {
                            return (
                              <p className="text-center text-red-400 text-sm font-bold mt-3 animate-pulse">
                                🔥 Letzte Chance! Drop endet bald!
                              </p>
                            );
                          } else if (hoursLeft < 24) {
                            return (
                              <p className="text-center text-orange-400 text-sm font-semibold mt-3">
                                ⚡ Nur noch wenige Stunden!
                              </p>
                            );
                          } else if (hoursLeft < 72) {
                            return (
                              <p className="text-center text-accent text-sm font-medium mt-3">
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

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleInterest}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105",
                      isInterested
                        ? "bg-accent/20 text-accent border border-accent/40"
                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    )}
                    onMouseEnter={() => setShowTooltip('Toggle Interest (I)')}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <Heart className={cn("h-4 w-4", isInterested && "fill-current")} />
                    <span className="text-sm font-medium">
                      {isInterested ? 'Interessiert' : 'Interesse'}
                    </span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all hover:scale-105"
                    onMouseEnter={() => setShowTooltip('Share (S)')}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Teilen</span>
                  </button>
                </div>
              </div>

              {/* Variants */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Varianten</h3>
                  <span className="text-sm text-muted">Nutze Tasten 1-9</span>
                </div>
                <VariantSelector
                  variants={drop.variants}
                  selectedIds={selectedVariantId}
                  onSelect={selectVariant}
                  mode="single"
                  currency={drop.currency}
                  showPrice
                  showStock
                />
              </div>

              {/* Quantity */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Menge</h3>
                  <span className="text-sm text-muted">+/- Tasten</span>
                </div>
                <QuantityControl
                  value={quantity}
                  min={minQuantity}
                  max={maxQuantity}
                  onChange={setQuantity}
                  showSlider
                  showPresets
                  presets={[1, 3, 5, Math.min(10, maxQuantity)]}
                  size="lg"
                />
              </div>

              {/* Price & Checkout */}
              <div className="flex-1 p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Preis</h3>
                  <PriceDisplay
                    price={variant?.basePrice ?? 0}
                    comparePrice={variant?.priceCompareAt}
                    currency={drop.currency}
                    quantity={quantity}
                    showBreakdown
                    showSavings
                    animate
                    size="lg"
                  />
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Fortschritt</span>
                    <span className="text-accent font-bold">{Math.round(drop.progress * 100)}%</span>
                  </div>
                  <div className="relative">
                    <ProgressBar value={drop.progress} />
                    <div className="absolute inset-0 progress-shimmer rounded-full" />
                  </div>
                </div>

                {/* Interest Count */}
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Info className="h-4 w-4" />
                  <span>{interestCount} Personen sind interessiert</span>
                </div>
              </div>

              {/* Sticky Checkout Button */}
              <div className="sticky bottom-0 p-6 bg-gradient-to-t from-slate-900 to-transparent border-t border-white/10">
                <button
                  onClick={handleCheckout}
                  disabled={!canPreorder || variant?.stock <= 0}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-900",
                    canPreorder && variant?.stock > 0
                      ? "bg-gradient-to-r from-accent to-cyan-400 text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/50"
                      : "bg-white/10 text-muted cursor-not-allowed opacity-50"
                  )}
                  onMouseEnter={() => setShowTooltip('Add to Cart (Enter)')}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  {variant?.stock <= 0 ? (
                    <>Ausverkauft</>
                  ) : canPreorder ? (
                    <>
                      <CheckCircle className="h-6 w-6" />
                      <span>{formatCurrency(variant?.basePrice * quantity, 'de-DE', drop.currency)} bestellen</span>
                    </>
                  ) : (
                    <>
                      <Truck className="h-6 w-6" />
                      <span>Invite erforderlich</span>
                    </>
                  )}
                </button>

                {/* Keyboard Shortcuts Hint */}
                <p className="text-xs text-center text-muted mt-3">
                  Tastenkürzel: Enter (Bestellen) · Esc (Schließen) · F (Vollbild)
                </p>
              </div>
            </div>
          </div>

          {/* Close Button (Desktop) */}
          <Dialog.Close className="hidden md:block absolute right-4 top-4 rounded-full border border-white/20 p-2 text-white hover:text-accent transition-colors z-50">
            <X className="h-6 w-6" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    
    {/* 🎯 Drop Smart Cart Confirmation (Desktop enhanced) */}
    {showDropSmartCartConfirmation && (
      <DropSmartCartConfirmation
        isOpen={showDropSmartCartConfirmation}
        onClose={() => setShowDropSmartCartConfirmation(false)}
        onContinueShopping={() => {
          setShowDropSmartCartConfirmation(false);
          closeDrop();
          showToast.success('✅ Im Warenkorb!', `${addedItems.length} ${addedItems.length === 1 ? 'Sorte ist' : 'Sorten sind'} jetzt in deinem Warenkorb`);
        }}
        onGoToCart={() => {
          setShowDropSmartCartConfirmation(false);
          closeDrop();
          showToast.success('🎉 Erfolgreich hinzugefügt!', `${addedItems.length} ${addedItems.length === 1 ? 'Sorte wurde' : 'Sorten wurden'} zum Warenkorb hinzugefügt`);
          setTimeout(() => useGlobalCartStore.getState().openCart(), 500);
        }}
        onGoToCheckout={() => {
          setShowDropSmartCartConfirmation(false);
          closeDrop();
          showToast.success('🎉 Erfolgreich hinzugefügt!', `${addedItems.length} ${addedItems.length === 1 ? 'Sorte wurde' : 'Sorten wurden'} zum Warenkorb hinzugefügt`);
          setTimeout(() => {
            navigate('/checkout');
          }, 300);
        }}
        addedItems={addedItems}
        totalAddedPrice={totalAddedPrice}
        cartTotal={useGlobalCartStore.getState().totalPrice}
        freeShippingThreshold={50}
        dropName={drop?.name ?? ''}
      />
    )}
    </>
  );
};

