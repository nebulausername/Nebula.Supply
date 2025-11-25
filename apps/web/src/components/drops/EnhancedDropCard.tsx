import { useState, useMemo, useRef } from 'react';
import type { Drop, DropVariant } from '@nebula/shared';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/currency';
import { 
  Minus, Plus, Star, ShoppingCart, AlertTriangle, Users, 
  Share2, Eye, Heart, Zap
} from 'lucide-react';

// Import new components
import { EnhancedProductImage } from './EnhancedProductImage';
import { VariantSelector } from './VariantSelector';
import { QuantityControl } from './QuantityControl';
import { PriceDisplay } from './PriceDisplay';
import { DropBadge } from './DropBadge';
import { ProgressBar } from '../ProgressBar';

// Import hooks
import { useDropInteractions } from '../../hooks/drops/useDropInteractions';
import { useVariantSelection } from '../../hooks/drops/useVariantSelection';
import { useDropGestures } from '../../hooks/drops/useDropGestures';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

interface EnhancedDropCardProps {
  drop: Drop;
  onOpen: (drop: Drop) => void;
  onQuickPreorder?: (drop: Drop, variant: DropVariant, quantity: number) => void;
  showQuickActions?: boolean;
  compact?: boolean;
  enableGestures?: boolean;
}

/**
 * 🎨 Enhanced Drop Card Component
 * Features: Glassmorphism, animated gradients, gestures, haptic feedback, smart interactions
 */
export const EnhancedDropCard = ({
  drop,
  onOpen,
  onQuickPreorder,
  showQuickActions = true,
  compact = false,
  enableGestures = true
}: EnhancedDropCardProps) => {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showVariantPreview, setShowVariantPreview] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  const { triggerHaptic } = useEnhancedTouch();

  // 🎯 Use custom hooks
  const {
    handleAddToCart,
    handleToggleInterest,
    handleShare,
    handleQuickBuy,
    checkAccess,
    interestCount,
    isInterested,
    hasInviteAccess
  } = useDropInteractions(drop);

  const {
    selectedVariant,
    selectedVariantId,
    selectVariant,
    isVariantSelected
  } = useVariantSelection(drop, {
    mode: 'single',
    defaultVariantId: drop.defaultVariantId
  });

  // 🎯 Gesture handlers
  const gestures = useDropGestures({
    onSwipeRight: () => {
      // Next variant
      const currentIndex = drop.variants.findIndex(v => v.id === selectedVariantId);
      const nextIndex = (currentIndex + 1) % drop.variants.length;
      selectVariant(drop.variants[nextIndex].id);
    },
    onSwipeLeft: () => {
      // Previous variant
      const currentIndex = drop.variants.findIndex(v => v.id === selectedVariantId);
      const prevIndex = currentIndex === 0 ? drop.variants.length - 1 : currentIndex - 1;
      selectVariant(drop.variants[prevIndex].id);
    },
    onLongPress: () => {
      // Open details modal
      onOpen(drop);
    },
    onDoubleTap: () => {
      // Quick add to cart
      handleQuickBuy(selectedVariant as DropVariant, selectedQuantity);
    }
  });

  // 🎯 Computed values
  const variant = selectedVariant as DropVariant;
  const inviteRequired = variant?.inviteRequired ?? drop.inviteRequired;
  const canPreorder = checkAccess(variant);
  const flavorLabel = variant?.flavor ?? drop.flavorTag;
  const minQuantity = variant?.minQuantity ?? drop.minQuantity ?? 1;
  const maxQuantity = Math.min(variant?.maxQuantity ?? drop.maxPerUser ?? 10, variant?.stock ?? 10);
  const isLowStock = variant?.stock <= 10;
  const isOutOfStock = variant?.stock <= 0;

  // 🎯 Access-based gradient
  const getAccessGradient = useMemo(() => {
    switch (drop.access) {
      case 'vip':
        return 'from-purple-500/20 via-pink-500/10 to-transparent';
      case 'limited':
        return 'from-orange-500/20 via-red-500/10 to-transparent';
      case 'free':
        return 'from-green-500/20 via-emerald-500/10 to-transparent';
      default:
        return 'from-cyan-500/20 via-blue-500/10 to-transparent';
    }
  }, [drop.access]);

  // 🎯 Handlers
  const handleOpen = () => {
    triggerHaptic('light');
    onOpen(drop);
  };

  const handleAddToCartClick = () => {
    if (canPreorder) {
      handleAddToCart(variant, selectedQuantity);
    } else {
      handleToggleInterest();
    }
  };

  const actionLabel = !canPreorder
    ? 'Interesse zeigen'
    : drop.status === 'locked'
    ? 'Bald verfügbar'
    : variant?.basePrice === 0
    ? 'Gratis zum Warenkorb'
    : 'Zum Warenkorb';

  return (
    <article
      ref={cardRef}
      className={cn(
        'group relative overflow-hidden rounded-2xl transition-all duration-500',
        'border border-white/10 bg-gradient-to-br from-surface/80 via-surface/60 to-surface/40',
        'backdrop-blur-xl shadow-card hover-glow',
        'hover:border-accent/40 hover:scale-[1.02]',
        compact ? 'p-4' : 'p-6',
        'min-h-[500px] flex flex-col',
        'drop-card-enter gpu-accelerated'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(enableGestures ? gestures : {})}
    >
      {/* 🎨 Animated Background Gradient */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          'gradient-shift',
          getAccessGradient
        )}
        aria-hidden
      />

      {/* 🎨 Top Radial Glow */}
      <div 
        className="absolute inset-x-0 -top-32 h-48 bg-[radial-gradient(circle_at_top,rgba(11,247,188,0.35),transparent_70%)] group-hover:opacity-75 transition-opacity" 
        aria-hidden 
      />

      {/* Header with Badges */}
      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <DropBadge type={drop.badge} showGlow={isHovered} />
          <DropBadge type="Drop" label={drop.locale} variant="outline" showIcon={false} showGlow={false} />
          {!canPreorder && (
            <DropBadge type="Locked" label="Invite nötig" showGlow={false} />
          )}
          {isLowStock && !isOutOfStock && (
            <DropBadge type="Ending Soon" label={`${variant.stock} übrig`} showGlow />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Users className="h-3 w-3" />
          <span className="font-semibold">{interestCount}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative space-y-5 flex-1 flex flex-col">
        {/* Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold tracking-wide text-text group-hover:text-accent transition-colors">
              {drop.name}
            </h3>
            <button
              onClick={handleOpen}
              className="text-xs text-muted hover:text-accent transition flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Details
            </button>
          </div>
          <p className="text-sm text-muted">{variant?.label} · {flavorLabel}</p>
        </div>

        {/* Product Image */}
        {variant?.media?.[0] && (
          <div className="relative -mx-2">
            <EnhancedProductImage
              src={variant.media[0].url}
              alt={variant.media[0].alt}
              aspectRatio="4 / 3"
              fallbackColor={variant.media[0].dominantColor ?? '#0BF7BC'}
              overlayLabel={variant.label}
              enableZoom
              enableParallax={false}
              className="cursor-pointer"
              onLoad={() => {}}
            />
            
            {/* Hover Overlay with Quick Actions */}
            {isHovered && showQuickActions && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleInterest();
                    }}
                    className={cn(
                      'p-3 rounded-full backdrop-blur-md transition-all hover:scale-110',
                      isInterested 
                        ? 'bg-accent text-black' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    )}
                  >
                    <Heart className={cn('h-5 w-5', isInterested && 'fill-current')} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare();
                    }}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all hover:scale-110"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpen();
                    }}
                    className="p-3 rounded-full bg-accent backdrop-blur-md text-black hover:bg-accent/80 transition-all hover:scale-110"
                  >
                    <Zap className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variant Selector (compact) */}
        {showQuickActions && drop.variants.length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted font-semibold">
                Varianten ({drop.variants.length})
              </p>
              {drop.variants.length > 3 && (
                <button
                  onClick={() => setShowVariantPreview(!showVariantPreview)}
                  className="text-xs text-accent hover:text-accent/80 transition"
                >
                  {showVariantPreview ? 'Weniger' : 'Alle anzeigen'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(showVariantPreview ? drop.variants : drop.variants.slice(0, 3)).map((v) => {
                const isActive = v.id === selectedVariantId;
                const isDisabled = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => selectVariant(v.id)}
                    disabled={isDisabled}
                    className={cn(
                      'rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-all duration-300',
                      'hover:scale-105 active:scale-95',
                      isActive
                        ? 'border-accent bg-accent/15 text-accent variant-select'
                        : 'border-white/15 text-muted hover:border-accent/40 hover:text-accent',
                      isDisabled && 'opacity-50 cursor-not-allowed hover:scale-100'
                    )}
                  >
                    {v.label}
                    {v.badges?.includes('Limited') && ' 🔥'}
                    {v.badges?.includes('VIP') && ' 👑'}
                  </button>
                );
              })}
              {!showVariantPreview && drop.variants.length > 3 && (
                <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-muted">
                  +{drop.variants.length - 3} weitere
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quantity Control */}
        {showQuickActions && canPreorder && !isOutOfStock && (
          <QuantityControl
            value={selectedQuantity}
            min={minQuantity}
            max={maxQuantity}
            onChange={setSelectedQuantity}
            showPresets
            presets={[1, 3, 5, Math.min(10, maxQuantity)]}
            size="md"
          />
        )}

        {/* Price Display */}
        <PriceDisplay
          price={variant?.basePrice ?? drop.price}
          comparePrice={variant?.priceCompareAt}
          currency={drop.currency}
          quantity={selectedQuantity}
          showBreakdown={selectedQuantity > 1}
          showSavings
          animate
          size="lg"
        />

        {/* Actions */}
        <div className="space-y-3 mt-auto">
          <div className="flex gap-2">
            {/* Interest Button (if no access) */}
            {!canPreorder && (
              <button
                onClick={handleToggleInterest}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
                  'border hover:scale-[1.02] active:scale-[0.98]',
                  isInterested
                    ? 'border-accent bg-accent/20 text-accent'
                    : 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
                )}
              >
                <Star className={cn('h-4 w-4', isInterested && 'fill-current')} />
                {isInterested ? 'Interessiert' : 'Interesse'}
              </button>
            )}

            {/* Main Action Button */}
            <button
              className={cn(
                'flex-1 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300',
                'hover:scale-[1.02] active:scale-[0.98]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                'flex items-center justify-center gap-2',
                canPreorder && !isOutOfStock
                  ? 'bg-gradient-to-r from-accent to-cyan-400 text-black hover:shadow-lg hover:shadow-accent/50 price-glow'
                  : 'border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20',
                (drop.status === 'locked' || isOutOfStock) && 'cursor-not-allowed opacity-50 hover:scale-100'
              )}
              disabled={drop.status === 'locked' || isOutOfStock}
              onClick={handleAddToCartClick}
            >
              {canPreorder && <ShoppingCart className="h-4 w-4" />}
              {isOutOfStock ? 'Ausverkauft' : actionLabel}
            </button>
          </div>

          {/* Quick Share */}
          {showQuickActions && (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs text-muted transition hover:border-accent hover:text-accent"
              >
                <Share2 className="h-3 w-3" />
                Teilen
              </button>
              {!canPreorder && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Invite erforderlich</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Footer */}
      <footer className="relative mt-6 pt-6 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-semibold">Fortschritt</span>
          <span className="font-bold text-accent">{Math.round(drop.progress * 100)}%</span>
        </div>
        <div className="relative">
          <ProgressBar value={drop.progress} />
          <div className="absolute inset-0 progress-shimmer rounded-full" />
        </div>
        {drop.status === 'locked' && (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span>Drop ist gelockt - bald verfügbar</span>
          </div>
        )}
      </footer>

      {/* Swipe Indicator (Mobile) */}
      {enableGestures && drop.variants.length > 1 && (
        <div className="md:hidden absolute bottom-2 right-2 text-[10px] text-muted/50 flex items-center gap-1">
          <span>← Swipe →</span>
        </div>
      )}
    </article>
  );
};





