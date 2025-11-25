import { useState, useMemo, useEffect, useRef } from "react";
import { Heart, Share2, Users, Clock, Star, Truck, Zap, Eye, ShoppingCart, ArrowRight, Crown, Flame, Sparkles, Minus, Plus, Loader2, MapPin } from "lucide-react";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";
import { ProductImage } from "./media/ProductImage";
import { InviteRequiredModal } from "./InviteRequiredModal";
import { DropCountdown } from "./drops/DropCountdown";
import { PreorderInfo } from "./drops/PreorderInfo";
import { getDynamicDeliveryTime, getPrimaryDeliveryOrigin, getSimplifiedOriginLabel } from "../utils/deliveryTimes";
import { useDropsStore } from "../store/drops";
import { useShopStore } from "../store/shop";
import { addDropItemToCart, useGlobalCartStore } from "../store/globalCart";
import { showToast } from "../store/toast";
import { formatCurrency } from "../utils/currency";
import { cn } from "../utils/cn";
import type { Drop, DropVariant } from "@nebula/shared";

// 🎯 Skeleton loading component
const DropCardSkeleton = () => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 animate-pulse">
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
    <div className="relative h-48 md:h-56 bg-white/5" />
    <div className="p-4 space-y-3">
      <div className="h-6 bg-white/10 rounded-lg w-3/4" />
      <div className="h-4 bg-white/5 rounded w-1/2" />
      <div className="h-4 bg-white/5 rounded w-2/3" />
      <div className="flex justify-between items-center">
        <div className="h-8 bg-white/10 rounded-lg w-20" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-white/5 rounded-full" />
          <div className="h-8 w-8 bg-white/5 rounded-full" />
        </div>
      </div>
      <div className="h-2 bg-white/5 rounded-full" />
      <div className="flex gap-2">
        <div className="h-10 bg-white/10 rounded-xl flex-1" />
        <div className="h-10 w-10 bg-white/5 rounded-xl" />
        <div className="h-10 w-10 bg-white/5 rounded-xl" />
      </div>
    </div>
  </div>
);

// 🎯 Progressive image loading with blur placeholder
const ProgressiveImage = ({
  src,
  alt,
  fallbackColor,
  className,
  onLoad
}: {
  src: string;
  alt: string;
  fallbackColor?: string;
  className?: string;
  onLoad?: () => void;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.onload = handleLoad;
      imgRef.current.onerror = handleError;
    }
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Blur placeholder */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 blur-sm scale-110"
          style={{
            backgroundColor: fallbackColor || '#0BF7BC',
            backgroundImage: `linear-gradient(45deg, ${fallbackColor || '#0BF7BC'} 25%, transparent 25%), linear-gradient(-45deg, ${fallbackColor || '#0BF7BC'} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${fallbackColor || '#0BF7BC'} 75%), linear-gradient(-45deg, transparent 75%, ${fallbackColor || '#0BF7BC'} 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        />
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        loading="lazy"
      />

      {/* Error fallback */}
      {hasError && (
        <div
          className="w-full h-full flex items-center justify-center text-white/50"
          style={{ backgroundColor: fallbackColor || '#0BF7BC' }}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-sm">Bild nicht verfügbar</div>
          </div>
        </div>
      )}
    </div>
  );
};

interface RevolutionaryDropCardProps {
  drop: Drop;
  onOpen: (drop: Drop) => void;
  onQuickPreorder?: (drop: Drop, variant: DropVariant, quantity: number) => void;
  showQuickActions?: boolean;
  compact?: boolean;
}

const getAccessIcon = (access: string) => {
  switch (access) {
    case 'vip': return <Crown className="h-3 w-3" />;
    case 'limited': return <Flame className="h-3 w-3" />;
    case 'free': return <Sparkles className="h-3 w-3" />;
    default: return <Star className="h-3 w-3" />;
  }
};

const getAccessColor = (access: string) => {
  switch (access) {
    case 'vip': return 'from-purple-500 to-pink-500';
    case 'limited': return 'from-orange-500 to-red-500';
    case 'free': return 'from-green-500 to-emerald-500';
    default: return 'from-blue-500 to-cyan-500';
  }
};

export const RevolutionaryDropCard = ({
  drop,
  onOpen,
  onQuickPreorder,
  showQuickActions = true,
  compact = false
}: RevolutionaryDropCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showVariantPreview, setShowVariantPreview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const { interests, toggleInterest, loadingStates } = useDropsStore();
  const { invite } = useShopStore();

  // 🎯 Temporary variables for invite system (TODO: implement proper invite system)
  const inviteRequired = false;
  const hasInviteAccess = invite?.hasInvite ?? false;

  // 🎯 Smart loading state management
  const isLoading = loadingStates[drop.id] === 'loading';
  const hasError = loadingStates[drop.id] === 'error';

  // 🎯 Retry mechanism for failed requests
  const retryLoad = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      // Simulate retry delay
      setTimeout(() => {
        // In real implementation, this would trigger a refetch
        console.log(`Retrying load for drop ${drop.id}, attempt ${retryCount + 1}`);
      }, 1000 * (retryCount + 1));
    }
  };

  const interestCount = typeof interests[drop.id] === 'number' ? interests[drop.id] : drop.interestCount;
  const interested = false; // Simplified for now
  
  // 🎯 isInterested bleibt initial false (uninteressiert), wird nur beim Klick getoggled
  // Keine automatische Synchronisation mit Store beim Mount

  // Category badge removed (rollback to original)

  // 🎯 Calculate progress as fraction (e.g., "5/10", "12/20")
  const progressFraction = useMemo(() => {
    const progressPercent = Math.round(drop.progress * 100);
    
    // If we have actual order data, use it
    if (drop.currentOrders !== undefined && drop.minimumOrders !== undefined) {
      return `${drop.currentOrders}/${drop.minimumOrders}`;
    }
    
    // Otherwise estimate based on percentage
    const commonMinimums = [10, 15, 20, 25, 30];
    const estimatedMinimum = commonMinimums.find(min => {
      const current = Math.round(progressPercent / 100 * min);
      const calcProgress = (current / min) * 100;
      return Math.abs(calcProgress - progressPercent) < 5;
    }) || 10;
    
    const estimatedCurrent = Math.round(progressPercent / 100 * estimatedMinimum);
    return `${estimatedCurrent}/${estimatedMinimum}`;
  }, [drop.progress, drop.currentOrders, drop.minimumOrders]);

  // 🎯 Smart Variant Selection Logic
  const defaultVariant = useMemo(() => {
    if (selectedVariantId) {
      return drop.variants.find(v => v.id === selectedVariantId) ?? drop.variants[0];
    }
    // Auto-select best variant based on availability and price
    const availableVariants = drop.variants.filter(v => v.stock > 0);
    if (availableVariants.length === 0) return drop.variants[0];
    
    // Prefer free variants, then cheapest, then most stock
    const freeVariants = availableVariants.filter(v => v.basePrice === 0);
    if (freeVariants.length > 0) {
      return freeVariants.reduce((best, current) => 
        current.stock > best.stock ? current : best
      );
    }
    
    return availableVariants.reduce((cheapest, current) => 
      current.basePrice < cheapest.basePrice ? current : cheapest
    );
  }, [drop.variants, selectedVariantId]);

  // 🎯 Auto-Quantity Logic based on variant
  const autoQuantity = useMemo(() => {
    if (!defaultVariant) return 1;
    
    // Smart quantity based on variant type and stock
    const minQty = defaultVariant.minQuantity ?? 1;
    const maxQty = Math.min(defaultVariant.maxQuantity ?? 10, defaultVariant.stock);
    
    // Auto-select optimal quantity
    if (defaultVariant.basePrice === 0) {
      // Free variants: max allowed
      return Math.min(maxQty, 3);
    } else if (defaultVariant.basePrice < 5) {
      // Cheap variants: 2-3 pieces
      return Math.min(maxQty, 3);
    } else {
      // Expensive variants: 1-2 pieces
      return Math.min(maxQty, 2);
    }
  }, [defaultVariant]);

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    const variant = drop.variants.find(v => v.id === variantId);
    if (variant) {
      // Auto-adjust quantity based on new variant
      const minQty = variant.minQuantity ?? 1;
      const maxQty = Math.min(variant.maxQuantity ?? 10, variant.stock);
      const newQuantity = Math.max(minQty, Math.min(autoQuantity, maxQty));
      setSelectedQuantity(newQuantity);
      
      // Show feedback
      console.log('Variant selected:', variant.label, 'Quantity:', newQuantity);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!defaultVariant) return;
    const minQty = defaultVariant.minQuantity ?? 1;
    const maxQty = Math.min(defaultVariant.maxQuantity ?? 10, defaultVariant.stock);
    setSelectedQuantity(Math.max(minQty, Math.min(newQuantity, maxQty)));
  };

  const handleQuickPreorder = async () => {
    if (isAddingToCart || !drop || !defaultVariant) return;
    
    try {
      setIsAddingToCart(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }

      // Check if invite is required and user has invite
      if (defaultVariant.inviteRequired && ((invite?.totalReferrals ?? 0) < 1)) {
        setShowInviteModal(true);
        return;
      }

      if (!canPreorder) {
        showToast.error("Nicht verfügbar", "Für diesen Drop benötigst du eine Einladung");
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]);
        }
        return;
      }

      // Add to cart
      const success = addDropItemToCart(drop, defaultVariant, selectedQuantity);

      if (success) {
        // Success feedback
        showToast.success(
          '🛒 Zum Warenkorb hinzugefügt!',
          `${selectedQuantity}x ${defaultVariant.label} wurde zum Warenkorb hinzugefügt`
        );
        
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10, 50, 10]);
        }

        // Auto-open cart on mobile
        if (window.innerWidth < 768) {
          setTimeout(() => {
            useGlobalCartStore.getState().openCart();
          }, 300);
        }
      } else {
        showToast.error(
          'Hinzufügen fehlgeschlagen',
          'Artikel konnte nicht hinzugefügt werden - Lager oder Mengenlimit erreicht'
        );
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (error) {
      console.error('Error in handleQuickPreorder:', error);
      showToast.error('Fehler', 'Ein unerwarteter Fehler ist aufgetreten');
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleInterest = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!drop) {
      showToast.warning('Fehler', 'Drop konnte nicht gefunden werden');
      return;
    }
    
    try {
      const newInterested = !isInterested;
      setIsInterested(newInterested);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(newInterested ? [10, 50, 10] : 10);
      }
      
      // Toggle in store
      toggleInterest(drop.id);
      
      // Show toast feedback
      if (newInterested) {
        showToast.success('⭐ Interesse gezeigt!', `${drop.name} wurde zu deinen Interessen hinzugefügt`);
      } else {
        showToast.info('Interesse entfernt', `${drop.name} wurde aus deinen Interessen entfernt`);
      }
    } catch (error) {
      console.error('Error toggling interest:', error);
      showToast.error('Fehler', 'Interesse konnte nicht aktualisiert werden');
    }
  };

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!drop) {
      showToast.warning('Fehler', 'Drop konnte nicht gefunden werden');
      return;
    }
    
    if (isSharing) return;
    
    const sharePayload = {
      title: drop.name || 'Premium Drop',
      text: `${drop.name} jetzt sichern bei Nebula Supply - ${defaultVariant?.label || 'Premium Drop'}`,
      url: typeof window !== "undefined" ? window.location.href : undefined
    };
    
    try {
      setIsSharing(true);
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }

      // Try Web Share API first
      if (navigator.share && navigator.canShare?.(sharePayload)) {
        await navigator.share(sharePayload);
        showToast.success('Erfolgreich geteilt!', `${drop.name} wurde geteilt`);
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
        return;
      }
      
      // Fallback to clipboard
      if (navigator.clipboard?.writeText && sharePayload.url) {
        await navigator.clipboard.writeText(sharePayload.url);
        showToast.success('Link kopiert!', 'Der Link wurde in die Zwischenablage kopiert');
        if ('vibrate' in navigator) {
          navigator.vibrate([10, 50, 10]);
        }
        return;
      }
      
      // If both fail
      showToast.warning('Teilen nicht möglich', 'Teilen wird auf diesem Gerät nicht unterstützt');
      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }
    } catch (error: any) {
      // User cancelled
      if (error?.name === 'AbortError') {
        return;
      }
      
      // Try clipboard as fallback
      if (sharePayload.url) {
        try {
          await navigator.clipboard.writeText(sharePayload.url);
          showToast.success('Link kopiert!', 'Der Link wurde in die Zwischenablage kopiert');
          if ('vibrate' in navigator) {
            navigator.vibrate([10, 50, 10]);
          }
          return;
        } catch (clipboardError) {
          console.error('Clipboard error:', clipboardError);
        }
      }
      
      console.error("Share failed:", error);
      showToast.error('Teilen fehlgeschlagen', 'Der Link konnte nicht geteilt werden');
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const canPreorder = !defaultVariant?.inviteRequired || ((invite?.totalReferrals ?? 0) >= 1);
  const isFree = defaultVariant?.basePrice === 0;
  const isLimited = drop.badge === 'Limitiert' || defaultVariant?.gate?.mode === 'waitlist';
  const isVip = drop.badge === 'VIP' || defaultVariant?.gate?.mode === 'vip';

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-500",
        "hover:scale-[1.02] hover:shadow-2xl hover:border-opacity-60",
        "md:hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
        compact ? "h-64" : "h-auto min-h-[500px] md:min-h-[600px]",
        isVip ? "border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20 hover:border-purple-500/60" :
        isLimited ? "border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-red-900/20 hover:border-orange-500/60" :
        isFree ? "border-green-500/30 bg-gradient-to-br from-green-900/20 to-emerald-900/20 hover:border-green-500/60" :
        "border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 hover:border-blue-500/60"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🎨 Background Gradient Overlay - Enhanced */}
      <div className={cn(
        "absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-30 pointer-events-none",
        isVip ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30" :
        isLimited ? "bg-gradient-to-br from-orange-500/30 to-red-500/30" :
        isFree ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30" :
        "bg-gradient-to-br from-blue-500/30 to-cyan-500/30"
      )} />
      
      {/* 🎨 Enhanced Shadow on Hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl",
        isVip ? "shadow-[0_0_60px_rgba(168,85,247,0.4)]" :
        isLimited ? "shadow-[0_0_60px_rgba(249,115,22,0.4)]" :
        isFree ? "shadow-[0_0_60px_rgba(34,197,94,0.4)]" :
        "shadow-[0_0_60px_rgba(59,130,246,0.4)]"
      )} />

      {/* 🎯 Top Badges - Enhanced with better transitions */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2 transition-all duration-300 group-hover:scale-105">
        <Badge variant={isVip ? "accent" : isLimited ? "accent" : isFree ? "accent" : "primary"}>
          {drop.badge}
        </Badge>
        {isFree && (
          <div className="flex items-center gap-1 bg-green-500/25 border border-green-400/30 text-green-300 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-green-500/20 transition-all duration-300 group-hover:bg-green-500/35 group-hover:shadow-green-500/40">
            <Sparkles className="h-3.5 w-3.5" />
            GRATIS
          </div>
        )}
        {isVip && (
          <div className="flex items-center gap-1 bg-purple-500/25 border border-purple-400/30 text-purple-300 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-purple-500/20 transition-all duration-300 group-hover:bg-purple-500/35 group-hover:shadow-purple-500/40">
            <Crown className="h-3.5 w-3.5" />
            VIP
          </div>
        )}
        {isLimited && (
          <div className="flex items-center gap-1 bg-orange-500/25 border border-orange-400/30 text-orange-300 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-orange-500/20 transition-all duration-300 group-hover:bg-orange-500/35 group-hover:shadow-orange-500/40">
            <Flame className="h-3.5 w-3.5" />
            LIMITED
          </div>
        )}
      </div>

      {/* 🎯 Interest Counter - Enhanced */}
      <div className="absolute top-3 right-3 z-10 transition-all duration-300 group-hover:scale-105">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 text-white text-sm shadow-lg transition-all duration-300 group-hover:bg-black/80 group-hover:border-white/20">
          <Users className="h-4 w-4 text-blue-300" />
          <span className="font-semibold">{interestCount}</span>
        </div>
      </div>

      {/* 🎯 Product Image with Progressive Loading - Improved Visibility */}
      <div className="relative h-48 md:h-56 overflow-hidden rounded-t-2xl">
        {isLoading ? (
          <div className="w-full h-full bg-white/5 animate-pulse" />
        ) : hasError && retryCount < 3 ? (
          <div className="w-full h-full bg-red-500/10 flex items-center justify-center">
            <button
              onClick={retryLoad}
              className="flex flex-col items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
            >
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Wiederholen</span>
            </button>
          </div>
        ) : defaultVariant?.media?.[0] ? (
          <div
            className="w-full h-full cursor-pointer group/image relative"
            onClick={() => onOpen(drop)}
          >
            <ProgressiveImage
              src={defaultVariant.media[0].url}
              alt={defaultVariant.media[0].alt}
              fallbackColor={defaultVariant.media[0].dominantColor ?? "#0BF7BC"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-110"
              onLoad={() => setImageLoading(false)}
            />
            {/* Overlay Label */}
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md rounded-full px-3 py-1.5 text-xs text-white font-semibold border border-white/20 z-10">
              {defaultVariant.label}
            </div>

            {/* 🎯 Quick Actions Overlay - Herz & Warenkorb */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-sm rounded-t-2xl z-20">
              <div className="flex gap-3">
                {/* Herz Button - Interesse */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleInterest(e);
                  }}
                  disabled={!drop}
                  className={cn(
                    "rounded-full p-3 transition-all duration-300 touch-target min-h-[44px] min-w-[44px]",
                    "hover:scale-110 active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                    isInterested
                      ? "bg-accent/20 text-accent shadow-lg shadow-accent/30"
                      : "bg-white/20 text-white hover:bg-white/30"
                  )}
                  aria-label={isInterested ? "Interesse entfernen" : "Interesse zeigen"}
                >
                  <Heart className={cn("h-5 w-5", isInterested && "fill-current")} />
                </button>

                {/* Warenkorb Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuickPreorder();
                  }}
                  disabled={!canPreorder || isAddingToCart || !drop || !defaultVariant}
                  className={cn(
                    "rounded-full p-3 transition-all duration-300 touch-target min-h-[44px] min-w-[44px]",
                    "hover:scale-110 active:scale-95 shadow-lg",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                    canPreorder && !isAddingToCart
                      ? "bg-gradient-to-r from-[#0BF7BC] to-cyan-400 hover:from-cyan-400 hover:to-[#0BF7BC] shadow-[#0BF7BC]/40 text-black"
                      : "bg-white/20 text-white/50"
                  )}
                  aria-label="Schnell zum Warenkorb hinzufügen"
                >
                  {isAddingToCart ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm">Kein Bild</div>
            </div>
          </div>
        )}

      </div>

      {/* 🎯 Content */}
      <div className="p-4 space-y-3">
        {/* 🎯 Title & Description */}
        <div>
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
            {drop.name}
          </h3>
          <p className="text-sm text-blue-200 line-clamp-2">
            {defaultVariant?.label} · {defaultVariant?.flavor}
          </p>
          
        </div>

        {/* 🎯 Variant Preview */}
        {showVariantPreview && drop.variants.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs text-blue-200 font-medium">Verfügbare Sorten:</p>
            <div className="flex flex-wrap gap-1">
              {drop.variants.slice(0, 3).map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => handleVariantSelect(variant.id)}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium transition-all duration-300",
                    selectedVariantId === variant.id
                      ? "bg-orange-500 text-white"
                      : "bg-white/10 text-blue-200 hover:bg-white/20"
                  )}
                >
                  {variant.label}
                </button>
              ))}
              {drop.variants.length > 3 && (
                <span className="px-2 py-1 rounded-full text-xs text-blue-200 bg-white/10">
                  +{drop.variants.length - 3} mehr
                </span>
              )}
            </div>
          </div>
        )}

        {/* 🎯 Price & Quantity - Improved Visibility */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white drop-shadow-lg">
                {formatCurrency(defaultVariant?.basePrice ?? 0, drop.currency ?? "EUR")}
              </span>
              {defaultVariant?.priceCompareAt && (
                <span className="text-base text-blue-300/80 line-through font-medium">
                  {formatCurrency(defaultVariant.priceCompareAt, drop.currency ?? "EUR")}
                </span>
              )}
            </div>
            {defaultVariant?.priceCompareAt && (
              <span className="text-xs text-green-400 font-semibold">
                {Math.round((1 - (defaultVariant.basePrice / defaultVariant.priceCompareAt)) * 100)}% Rabatt
              </span>
            )}
          </div>
          
          {showQuickActions && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleQuantityChange(selectedQuantity - 1)}
                disabled={selectedQuantity <= (defaultVariant?.minQuantity ?? 1)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 min-h-[44px] min-w-[44px]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-semibold text-white min-h-[44px] flex items-center justify-center">
                {selectedQuantity}
              </span>
              <button
                onClick={() => handleQuantityChange(selectedQuantity + 1)}
                disabled={selectedQuantity >= Math.min(defaultVariant?.maxQuantity ?? 10, defaultVariant?.stock ?? 0)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 min-h-[44px] min-w-[44px]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* 🎯 PREMIUM LIVE-COUNTDOWN - Optimiert für Mobile & Desktop */}
        {drop.deadlineAt && (
          <div className="relative overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-xl p-3 shadow-lg">
            {/* Animated Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-cyan-400/10 to-accent/10 opacity-50 animate-[gradient_8s_ease-in-out_infinite]" style={{ backgroundSize: '200% 200%' }} />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(11,247,188,0.8)]" />
                <span className="text-[10px] font-bold text-accent/90 uppercase tracking-widest">
                  ⏰ Drop endet in
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(11,247,188,0.8)]" />
              </div>
              
              {/* Countdown Component */}
              <div className="flex justify-center">
                <DropCountdown 
                  deadlineAt={drop.deadlineAt} 
                  countdownType={drop.countdownType}
                  variant="mobile"
                  className="shadow-xl"
                />
              </div>
            </div>
            
            {/* Subtle Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] animate-[shine_4s_ease-in-out_infinite] pointer-events-none" />
          </div>
        )}

        {/* 🎯 Preorder Info */}
        {drop.minimumOrders !== undefined && drop.preorderStatus && (
          <div className="space-y-2">
            <PreorderInfo
              minimumOrders={drop.minimumOrders}
              currentOrders={drop.currentOrders ?? 0}
              preorderStatus={drop.preorderStatus}
              preorderDeadline={drop.preorderDeadline}
            />
          </div>
        )}

        {/* 🎯 Delivery Info - Lieferzeit & Lieferort - Enhanced styling */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Lieferzeit - Dynamic based on origin */}
          {(() => {
            const dynamicDeliveryTime = getDynamicDeliveryTime(defaultVariant);
            return (
              <div className="flex items-center gap-2 bg-blue-500/25 border border-blue-400/40 rounded-lg px-3 py-2 shadow-md shadow-blue-500/10 transition-all duration-300 hover:bg-blue-500/35 hover:border-blue-400/60 hover:shadow-blue-500/20">
                <Clock className="h-4 w-4 text-blue-300" />
                <span className="text-blue-200 font-semibold">
                  Lieferzeit: {dynamicDeliveryTime}
                </span>
              </div>
            );
          })()}

          {/* Lieferort - Primary origin only */}
          {(() => {
            const primaryOrigin = getPrimaryDeliveryOrigin(defaultVariant);
            if (!primaryOrigin) return null;
            const simplifiedLabel = getSimplifiedOriginLabel(primaryOrigin);
            return (
              <div className="flex items-center gap-2 bg-green-500/25 border border-green-400/40 rounded-lg px-3 py-2 shadow-md shadow-green-500/10 transition-all duration-300 hover:bg-green-500/35 hover:border-green-400/60 hover:shadow-green-500/20">
                <MapPin className="h-4 w-4 text-green-300" />
                <span className="text-green-200 font-semibold">
                  Lieferort: {simplifiedLabel}
                </span>
              </div>
            );
          })()}
        </div>

        {/* 🎯 Live Counter - Owner Design */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
          <div className="relative space-y-3">
            {/* Counter Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-bold text-blue-300/90 uppercase tracking-wider">Live Fortschritt</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tighter drop-shadow-lg">
                  {progressFraction}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-accent/80 uppercase tracking-wider">Bestellungen</span>
                  <span className="text-xs font-bold text-white/60 tabular-nums">
                    {Math.round(drop.progress * 100)}%
                  </span>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="relative">
              <ProgressBar value={drop.progress} />
              {/* Pulse effect when near completion */}
              {drop.progress > 0.8 && (
                <div className="absolute inset-0 animate-pulse">
                  <div className="h-full bg-gradient-to-r from-accent/20 to-transparent rounded-full" style={{ width: `${Math.round(drop.progress * 100)}%` }} />
                </div>
              )}
            </div>

            {/* Status Text */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">
                {drop.progress >= 1 ? (
                  <span className="text-green-400 font-semibold flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                    Ziel erreicht!
                  </span>
                ) : drop.progress >= 0.8 ? (
                  <span className="text-accent font-semibold">Fast geschafft! 🔥</span>
                ) : drop.progress >= 0.5 ? (
                  <span className="text-blue-400">Über die Hälfte! 💪</span>
                ) : (
                  <span>Noch {Math.ceil((1 - drop.progress) * (drop.minimumOrders || 10))} fehlen</span>
                )}
              </span>
              <span className="text-white/40 tabular-nums">
                {drop.interestCount || 0} interessiert
              </span>
            </div>
          </div>
        </div>

        {/* 🎯 Action Buttons - Touch-friendly for mobile */}
        <div className="flex gap-2">
          <button
            onClick={(e) => handleInterest(e)}
            disabled={!drop}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 min-h-[44px] touch-target",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isInterested
                ? "bg-orange-500/20 text-orange-400 border border-orange-400/40 hover:bg-orange-500/30"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
            )}
            aria-label={isInterested ? "Interesse entfernen" : "Interesse zeigen"}
          >
            <Heart className={cn("h-4 w-4", isInterested && "fill-current")} />
            <span>{isInterested ? "Interessiert" : "Interesse"}</span>
          </button>
          
          <button
            onClick={(e) => handleShare(e)}
            disabled={!drop || isSharing}
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-xl text-white transition-all duration-300 min-h-[44px] min-w-[44px] touch-target",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isSharing 
                ? "bg-white/10 cursor-wait"
                : "bg-white/10 hover:bg-white/20 active:scale-95"
            )}
            aria-label="Teilen"
          >
            {isSharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
          
          {showQuickActions && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuickPreorder();
              }}
              disabled={!canPreorder || isAddingToCart || !drop || !defaultVariant}
              className={cn(
                "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 min-h-[44px] min-w-[44px] touch-target",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                canPreorder && !isAddingToCart
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105 active:scale-95"
                  : "bg-white/10 text-white/50"
              )}
              aria-label="Schnell zum Warenkorb hinzufügen"
            >
              {isAddingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 🎯 Invite Required Modal */}
      <InviteRequiredModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={() => {
          setShowInviteModal(false);
          // Optionally trigger a refresh or update
        }}
        dropName={drop.name}
      />
    </div>
  );
};
