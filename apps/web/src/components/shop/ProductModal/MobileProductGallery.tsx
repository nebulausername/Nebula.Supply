import { memo, useState, useCallback } from "react";
import type { Product, ProductMedia, VariantType } from "@nebula/shared";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { LazyProductImage } from "./LazyProductImage";
import { ProductVariants } from "./ProductVariants";
import { MobileProductActions } from "./MobileProductActions";

interface MobileProductGalleryProps {
  product: Product;
  activeMedia: ProductMedia | null;
  fallbackColor: string;
  onThumbnailClick: (mediaId: string, colorValue?: string) => void;
  // Additional props for variants and actions
  selection?: Partial<Record<VariantType, string>>;
  accentColor?: string;
  onVariantSelect?: (variantType: VariantType, optionId: string) => void;
  // Action props
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  quickOptions?: number[];
  isInterested?: boolean;
  shareFeedback?: "idle" | "copied" | "shared" | "error";
  onQuantityChange?: (value: number) => void;
  onAddToCart?: () => void;
  onDirectCheckout?: () => void;
  onInterestToggle?: () => void;
  onShare?: () => void;
}

// 🎯 Mobile-optimierte Gallery mit Swipe-Funktionalität
export const MobileProductGallery = memo(({ 
  product, 
  activeMedia, 
  fallbackColor, 
  onThumbnailClick,
  // Additional props
  selection,
  accentColor,
  onVariantSelect,
  quantity = 1,
  minQuantity = 1,
  maxQuantity = 25,
  quickOptions = [1, 3, 5, 10],
  isInterested = false,
  shareFeedback = "idle",
  onQuantityChange,
  onAddToCart,
  onDirectCheckout,
  onInterestToggle,
  onShare
}: MobileProductGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  // 🎯 Navigation zwischen Bildern
  const goToNext = useCallback(() => {
    if (product.media.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.media.length);
    }
  }, [product.media.length]);

  const goToPrevious = useCallback(() => {
    if (product.media.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.media.length) % product.media.length);
    }
  }, [product.media.length]);

  // 🎯 Touch Navigation mit Debouncing und Performance
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    setIsSwiping(true);
    
    // 🎯 Swipe-Direction für bessere UX
    if (touchStart && e.targetTouches[0].clientX) {
      const distance = touchStart - e.targetTouches[0].clientX;
      if (distance > 20) {
        setSwipeDirection('left');
      } else if (distance < -20) {
        setSwipeDirection('right');
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || !isSwiping) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
    
    setIsSwiping(false);
    setSwipeDirection(null);
  };

  const currentMedia = product.media[currentImageIndex] || activeMedia;

  return (
    <section id="overview" className="min-h-[60vh] p-4">
      <div className="max-w-full mx-auto">
        {/* 🎯 Complete Overview Section - Gallery, Variants, and CTA Actions */}
        {/* 🎯 Hauptbild mit Touch-Navigation */}
        {currentMedia && (
          <div className="space-y-4">
            <div 
              className="relative rounded-2xl overflow-hidden border-2 border-white/20 bg-black/30 shadow-2xl"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <LazyProductImage
                media={currentMedia}
                fallbackColor={fallbackColor}
                overlayLabel={product.name}
                aspectRatio="1 / 1"
                priority
                className={`w-full h-auto transition-transform duration-300 ${
                  isSwiping 
                    ? swipeDirection === 'left' 
                      ? 'scale-95 translate-x-2' 
                      : swipeDirection === 'right' 
                        ? 'scale-95 -translate-x-2' 
                        : ''
                    : ''
                }`}
              />
              
              {/* 🎯 Navigation Arrows */}
              {product.media.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200 hover:scale-110 shadow-lg"
                    aria-label="Vorheriges Bild"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200 hover:scale-110 shadow-lg"
                    aria-label="Nächstes Bild"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* 🎯 Zoom Button */}
              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="absolute top-4 right-4 w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200 hover:scale-110 shadow-lg"
                aria-label="Zoom"
              >
                <ZoomIn className="w-6 h-6" />
              </button>
              
              {/* 🎯 Overlay mit Produktname */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg">{product.name}</h3>
                <p className="text-white/90 text-sm drop-shadow-md">
                  {currentImageIndex + 1} von {product.media.length}
                </p>
              </div>
              
              {/* 🎯 Top Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-accent text-black px-3 py-1 rounded-full text-sm font-bold">
                  {product.badges?.[0] || "Neu"}
                </span>
              </div>
            </div>
            
              {/* 🎯 Bild-Indikatoren */}
              {product.media.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {product.media.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 hover:scale-110 ${
                        index === currentImageIndex
                          ? 'bg-accent w-8 shadow-lg shadow-accent/30 scale-110'
                          : 'bg-white/30 hover:bg-white/50 w-2'
                      }`}
                      aria-label={`Bild ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            
            {/* 🎯 Thumbnail Gallery (Horizontal Scroll) */}
            {product.media.length > 1 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-text flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  Weitere Ansichten
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                  {product.media.map((media, index) => {
                    const isActive = index === currentImageIndex;
                    return (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => {
                          setCurrentImageIndex(index);
                          onThumbnailClick(media.id, media.color);
                        }}
                        className={`group rounded-xl border-2 p-1 transition-all duration-300 hover:scale-105 flex-shrink-0 snap-center ${
                          isActive
                            ? "border-accent shadow-lg shadow-accent/20 bg-accent/10 scale-105"
                            : "border-white/20 hover:border-accent/40 bg-white/5 hover:shadow-md"
                        }`}
                        aria-label={`Ansicht ${media.alt}`}
                      >
                        <LazyProductImage
                          media={media}
                          fallbackColor={fallbackColor}
                          overlayLabel={media.color ?? product.name}
                          aspectRatio="1 / 1"
                          className="h-16 w-16 rounded-lg transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🎯 Product Variants - Now part of overview section */}
            {selection && accentColor && onVariantSelect && (
              <div className="space-y-4">
                <ProductVariants
                  product={product}
                  selection={selection}
                  accentColor={accentColor}
                  onVariantSelect={onVariantSelect}
                />
              </div>
            )}

            {/* 🎯 CTA Actions - Now part of overview section */}
            {onAddToCart && onDirectCheckout && onQuantityChange && onInterestToggle && onShare && (
              <div className="space-y-4 border-t border-white/10 pt-4">
                <MobileProductActions
                  quantity={quantity}
                  minQuantity={minQuantity}
                  maxQuantity={maxQuantity}
                  quickOptions={quickOptions}
                  accentColor={accentColor || "#3b82f6"}
                  isInterested={isInterested}
                  shareFeedback={shareFeedback}
                  onQuantityChange={onQuantityChange}
                  onAddToCart={onAddToCart}
                  onDirectCheckout={onDirectCheckout}
                  onInterestToggle={onInterestToggle}
                  onShare={onShare}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
});

MobileProductGallery.displayName = 'MobileProductGallery';
