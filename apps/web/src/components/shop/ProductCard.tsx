import { memo, useState, useRef, useMemo } from "react";
import type { Product, VariantType, VariantOption, ProductVariant } from "@nebula/shared";
import { useShopStore } from "../../store/shop";
import { useGlobalCartStore } from "../../store/globalCart";
import { ProductImage } from "../media/ProductImage";
import { formatCurrency } from "../../utils/currency";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../MobileOptimizations";
import { Heart, ShoppingCart, Eye, Zap } from "lucide-react";

interface ProductCardProps {
  product: Product;
  index?: number; // For priority loading
}

const getVariantSelection = (
  selections: ReturnType<typeof useShopStore.getState>["selections"],
  productId: string,
  variantType: VariantType
) => selections[productId]?.[variantType];

const firstVariantOption = (variant?: ProductVariant): VariantOption | undefined =>
  variant?.options?.[0];

export const ProductCard = memo(({ product, index = 999 }: ProductCardProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const { isMobile } = useMobileOptimizations();
  const [isPressed, setIsPressed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    selections,
    shippingSelections,
    selectVariant,
    selectShippingOption,
    openProduct,
    interests,
    interestedProducts,
    inventory,
    toggleInterest
  } = useShopStore((state: any) => ({
    selections: state.selections,
    shippingSelections: state.shippingSelections,
    selectVariant: state.selectVariant,
    selectShippingOption: state.selectShippingOption,
    openProduct: state.openProduct,
    interests: state.interests,
    interestedProducts: state.interestedProducts,
    inventory: state.inventory,
    toggleInterest: state.toggleInterest
  }));

  const { addItem } = useGlobalCartStore();

  const colorVariant = product.variants?.find((variant) => variant.type === "color");
  const sizeVariant = product.variants?.find((variant) => variant.type === "size");

  const selectedColorId =
    getVariantSelection(selections, product.id, "color") ?? firstVariantOption(colorVariant)?.id;
  const selectedSizeId =
    getVariantSelection(selections, product.id, "size") ?? firstVariantOption(sizeVariant)?.id;

  // 🎯 Verfügbare Lieferorte basierend auf Produkt-ID (wie im Modal)
  const getAvailableShippingLocations = useMemo(() => {
    // Deterministische Berechnung basierend auf Produkt-ID für verschiedene Kombinationen
    const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variation = seed % 3;
    
    if (variation === 0) {
      // Nur China
      return [
        { location: 'China', flag: '🇨🇳', days: '7-14 Werktage', color: 'text-red-400' }
      ];
    } else if (variation === 1) {
      // Nur Deutschland
      return [
        { location: 'Deutschland', flag: '🇩🇪', days: '1-5 Werktage', color: 'text-green-400' }
      ];
    } else {
      // Beide Länder
      return [
        { location: 'Deutschland', flag: '🇩🇪', days: '1-5 Werktage', color: 'text-green-400' },
        { location: 'China', flag: '🇨🇳', days: '7-14 Werktage', color: 'text-red-400' }
      ];
    }
  }, [product.id]);

  const availableLocations = getAvailableShippingLocations;
  const primaryLocation = availableLocations[0]; // Erster Ort als primär
  const deliveryTime = primaryLocation?.days ?? 'Auf Anfrage';
  const deliveryLocation = primaryLocation?.location ?? 'China';
  const deliveryFlag = primaryLocation?.flag ?? '🇨🇳';
  const deliveryColor = primaryLocation?.color ?? 'text-red-400';

  const shippingOptions = product.shippingOptions;
  const selectedShippingId = shippingSelections[product.id] ?? shippingOptions[0]?.id ?? null;
  const activeShippingOption =
    shippingOptions.find((option) => option.id === selectedShippingId) ?? shippingOptions[0];
  const shippingAdjustment = activeShippingOption?.priceAdjustment ?? 0;
  const shippingCurrency = activeShippingOption?.currency ?? product.currency;
  const shippingAdjustmentShort =
    shippingAdjustment === 0
      ? "Inklusive"
      : `${shippingAdjustment > 0 ? "+" : "-"} ${formatCurrency(Math.abs(shippingAdjustment), "de-DE", shippingCurrency)}`;
  const shippingTone =
    shippingAdjustment === 0 ? "text-muted" : shippingAdjustment > 0 ? "text-amber-400" : "text-accent";
  const shippingLeadTime = activeShippingOption?.leadTime ?? "Auf Anfrage";
  const shippingOptionLabel = activeShippingOption?.label ?? "Standard";

  const selectedColorOption = colorVariant?.options.find((option) => option.id === selectedColorId);
  const activeImage =
    product.media.find((media) => media.color === selectedColorOption?.value) ?? product.media[0];
  const fallbackColor = selectedColorOption?.swatch ?? "#0BF7BC";

  const interestCount = interests[product.id] ?? product.interest;
  // Always show products as available with some stock variation
  // Use useMemo to prevent recalculation on every render
  const { baseStock, stock } = useMemo(() => {
    const base = product.inventory || 50;
    // Use deterministic calculation based on product ID to avoid random changes on re-render
    const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variation = (seed % 20) - 10;
    const stockValue = Math.max(1, base + variation);
    return { baseStock: base, stock: stockValue };
  }, [product.id, product.inventory]);
  const isLowStock = stock > 0 && stock <= 5;
  const isOutOfStock = false; // Never show as out of stock

  // Enhanced touch handlers
  const handleTouchStart = () => {
    setIsPressed(true);
    triggerHaptic('light');
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const handleShippingCycle = () => {
    if (!shippingOptions.length) return;
    triggerHaptic('light');
    const options = shippingOptions;
    const currentId = selectedShippingId ?? options[0]?.id;
    if (!currentId) return;
    const currentIndex = options.findIndex((option) => option.id === currentId);
    const nextOption = options[(currentIndex + 1) % options.length];
    if (nextOption) {
      selectShippingOption(product.id, nextOption.id);
    }
  };

  const handleVariantSelect = (variantType: VariantType, option: VariantOption) => {
    triggerHaptic('light');
    selectVariant(product.id, variantType, option.id);
  };

  const handleQuickAdd = () => {
    triggerHaptic('medium');
    addItem({
      type: 'shop',
      name: product.name,
      variant: `${selectedColorOption?.label || 'Standard'} - ${sizeVariant?.options.find(opt => opt.id === selectedSizeId)?.label || 'One Size'}`,
      price: product.price + shippingAdjustment,
      quantity: 1,
      image: activeImage?.url,
      color: selectedColorOption?.value,
      maxQuantity: stock,
      stock: stock,
      inviteRequired: (product as any).inviteRequired || false
    });
  };

  const handleOpenProduct = () => {
    triggerHaptic('light');
    openProduct(product.id);
  };

  const handleInterestToggle = () => {
    triggerHaptic('light');
    toggleInterest(product.id);
  };

  return (
    <article
      ref={cardRef}
      className={`
        group relative rounded-2xl border border-white/10 bg-black/30 ${
          isMobile ? 'p-5' : 'p-4'
        } shadow-card transition-all duration-200
        hover:border-accent/40 hover:shadow-[0_24px_48px_rgba(11,247,188,0.18)]
        active:scale-[0.98] active:border-accent/60
        ${isPressed ? 'scale-[0.98] border-accent/60' : ''}
        ${isOutOfStock ? 'opacity-60' : ''}
        h-full flex flex-col
      `}
    >
      {/* Product Image with Touch-Optimized Overlay */}
      <div
        className="relative cursor-pointer touch-manipulation"
        onClick={handleOpenProduct}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <div className="relative overflow-hidden rounded-xl">
          <ProductImage
            src={activeImage?.url}
            alt={activeImage?.alt ?? product.name}
            fallbackColor={fallbackColor}
            overlayLabel={product.name}
            aspectRatio="4 / 3"
            className="pointer-events-none transition-transform duration-300 group-hover:scale-105"
            priority={index < 6} // Only first 6 images load eagerly
          />

          {/* Badges - Mobile Optimized (Neu, VIP, Limitierte Edi...) */}
          {(() => {
            const badgesToShow: Array<{ text: string; type: 'new' | 'vip' | 'limited' }> = [];
            
            // Check for "Neu" badge
            if (product.isNew || product.badges?.some(b => b.toLowerCase().includes('neu') || b.toLowerCase().includes('new'))) {
              badgesToShow.push({ text: 'Neu', type: 'new' });
            }
            
            // Check for "VIP" badge
            if (product.badges?.some(b => b.toLowerCase().includes('vip')) || 
                product.tags?.some(t => t.toLowerCase().includes('vip'))) {
              badgesToShow.push({ text: 'VIP', type: 'vip' });
            }
            
            // Check for "Limitierte Edition" badge
            if (product.limitedUntil || product.badges?.some(b => 
              b.toLowerCase().includes('limited') || 
              b.toLowerCase().includes('limitierte') ||
              b.toLowerCase().includes('limit') ||
              b.toLowerCase().includes('edition')
            )) {
              badgesToShow.push({ text: 'Limitierte Edi...', type: 'limited' });
            }
            
            // Fallback to custom badges if no standard badges found
            if (badgesToShow.length === 0 && product.badges?.length) {
              badgesToShow.push(...product.badges.slice(0, 2).map(badge => ({
                text: badge,
                type: 'new' as const
              })));
            }
            
            if (badgesToShow.length === 0) return null;
            
            return (
              <div className="absolute left-2 top-2 right-2 flex gap-1.5 overflow-hidden z-10">
                {badgesToShow.slice(0, 2).map((badge, index) => (
                  <span
                    key={`${badge.type}-${index}`}
                    className={`
                      inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold
                      ${badge.type === 'new' 
                        ? 'border-accent/50 bg-black/60 text-accent backdrop-blur-sm' 
                        : badge.type === 'vip'
                        ? 'border-purple-400/50 bg-black/60 text-purple-400 backdrop-blur-sm'
                        : 'border-accent/50 bg-black/60 text-accent backdrop-blur-sm'
                      }
                      truncate max-w-[100px]
                    `}
                  >
                    {badge.text}
                  </span>
                ))}
              </div>
            );
          })()}

          {/* Stock Indicator */}
          <div className="absolute right-2 bottom-2">
            {isOutOfStock ? (
              <span className="rounded-full bg-danger/20 px-2 py-1 text-[10px] text-danger font-medium">
                Ausverkauft
              </span>
            ) : isLowStock ? (
              <span className="rounded-full bg-warning/20 px-2 py-1 text-[10px] text-warning font-medium">
                Nur {stock} übrig
              </span>
            ) : null}
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/20 backdrop-blur-sm rounded-xl">
            <div className="flex gap-2">
              <button
                className={`rounded-full p-3 transition-colors touch-target ${
                  interestedProducts[product.id] 
                    ? 'bg-accent/20 text-accent' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleInterestToggle();
                }}
                aria-label="Zur Wunschliste hinzufügen"
              >
                <Heart className={`h-5 w-5 ${interestedProducts[product.id] ? 'fill-current' : ''}`} />
              </button>
              <button
                className="rounded-full bg-accent/90 p-3 text-black hover:bg-accent transition-colors touch-target"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAdd();
                }}
                aria-label="Schnell zum Warenkorb hinzufügen"
              >
                <ShoppingCart className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Info - Mobile Optimized */}
      <div className="mt-3 space-y-3 flex-1 flex flex-col">
        <header className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text truncate leading-tight">
              {product.name}
            </h3>
            <p className="text-xs text-muted line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>
          <div className="text-right flex-shrink-0 min-w-[90px]">
            <p className="text-base font-bold text-text">
              {product.price.toFixed(2)}€
            </p>
            <p className="text-[10px] text-muted">
              {stock > 0 ? `${stock} verfügbar` : "Ausverkauft"}
            </p>
          </div>
        </header>

        {/* Lieferzeit & Lieferort - Mobile Optimized */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg border border-white/10 bg-black/20">
          <div className="flex items-center gap-2">
            <span className="text-base">{deliveryFlag}</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted">Lieferort</span>
              <span className={`text-[11px] font-semibold ${deliveryColor}`}>{deliveryLocation}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted">Lieferzeit</span>
            <div className={`text-[11px] font-semibold ${deliveryColor}`}>{deliveryTime}</div>
          </div>
        </div>

        {/* Color Variants - Mobile Optimized */}
        {colorVariant && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {colorVariant.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleVariantSelect("color", option)}
                className={`
                  h-10 w-10 rounded-full border-2 transition-all touch-target flex-shrink-0
                  ${selectedColorId === option.id
                    ? "border-accent ring-2 ring-accent/40 scale-110"
                    : "border-transparent hover:border-white/20"
                  }
                `}
                style={{ backgroundColor: option.swatch ?? "#0F172A" }}
                aria-label={`Farbe ${option.label}`}
              />
            ))}
          </div>
        )}

        {/* Size Variants - Mobile Optimized */}
        {sizeVariant && (
          <div className="flex flex-wrap gap-1.5">
            {sizeVariant.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleVariantSelect("size", option)}
                className={`
                  rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all touch-target min-w-[50px] h-[36px] flex items-center justify-center
                  ${selectedSizeId === option.id
                    ? "border-accent/40 bg-accent/15 text-accent scale-105"
                    : "border-white/10 bg-white/5 text-muted hover:border-accent/30 hover:text-accent"
                  }
                `}
              >
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Interest & Actions - Mobile Optimized */}
        <footer className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-1 text-[10px] text-muted min-w-0 flex-1">
            <Eye className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{interestCount} Interessenten</span>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleOpenProduct}
              className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] transition hover:border-accent hover:text-accent touch-target whitespace-nowrap"
            >
              Details
            </button>
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`
                rounded-full px-3 py-1.5 text-[10px] font-semibold transition-all touch-target whitespace-nowrap
                ${isOutOfStock
                  ? "bg-muted/20 text-muted cursor-not-allowed"
                  : "bg-accent text-black hover:brightness-110 active:scale-95"
                }
              `}
            >
              {isOutOfStock ? "Ausverkauft" : "Hinzufügen"}
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
});