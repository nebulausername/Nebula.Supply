import { useState, useMemo } from "react";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";
import { ProductImage } from "./media/ProductImage";
import type { Drop, DropAccess, DropVariant } from "@nebula/shared";
import { cn } from "../utils/cn";
import { formatCurrency } from "../utils/currency";
import { useDropsStore } from "../store/drops";
import { useShopStore } from "../store/shop";
import { addDropItemToCart, useGlobalCartStore } from "../store/globalCart";
import { hasDropAccess } from "../utils/inviteAccess";
import { showToast } from "../store/toast";
import { Minus, Plus, Star, ShoppingCart, AlertTriangle, Users } from "lucide-react";

interface DropCardProps {
  drop: Drop;
  onOpen: (drop: Drop) => void;
  onQuickPreorder?: (drop: Drop, variant: DropVariant, quantity: number) => void;
  showQuickActions?: boolean;
  compact?: boolean;
}

const badgeVariant = (badge: Drop["badge"]) => {
  switch (badge) {
    case "Kostenlos":
      return "primary" as const;
    case "VIP":
      return "accent" as const;
    default:
      return "secondary" as const;
  }
};

const accessMeta: Record<DropAccess, { headline: string; detail: string }> = {
  free: {
    headline: "Kostenloser Zugang",
    detail: "Invite noetig - 0,00 Euro pro Stueck, VIP-Rang ist nicht erforderlich."
  },
  limited: {
    headline: "Limitierter Batch",
    detail: "Begrenzte Menge, Timer laeuft - sichere dir deinen Slot rechtzeitig."
  },
  vip: {
    headline: "VIP Exklusiv",
    detail: "Nur fuer VIP-Raenge (Comet+). Invite und Rang werden beim Checkout geprueft."
  },
  standard: {
    headline: "Standard Drop",
    detail: "Ohne Invite bestellbar - regulaere Preise, sofort verfuegbar."
  }
};

const resolveShippingHighlight = (drop: Drop, variant?: DropVariant) => {
  if (!drop.shippingOptions.length) return null;
  if (!variant) return drop.shippingOptions[0];
  const highlightId = variant.defaultShippingOptionId ?? variant.shippingOptionIds?.[0];
  if (!highlightId) return drop.shippingOptions[0];
  return drop.shippingOptions.find((option) => option.id === highlightId) ?? drop.shippingOptions[0];
};

const formatPrice = (value: number, currency: string) => formatCurrency(value, "de-DE", currency);

export const DropCard = ({ 
  drop, 
  onOpen, 
  onQuickPreorder,
  showQuickActions = true,
  compact = false 
}: DropCardProps) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(drop.defaultVariantId);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [showVariantPreview, setShowVariantPreview] = useState(false);
  
  const { interests, toggleInterest } = useDropsStore();
  const { invite } = useShopStore();
  const { addItem } = useGlobalCartStore();
  
  const selectedVariant = useMemo(() => 
    drop.variants.find(v => v.id === selectedVariantId) ?? drop.variants[0], 
    [drop.variants, selectedVariantId]
  );
  
  const inviteRequired = selectedVariant?.inviteRequired ?? drop.inviteRequired;
  const canPreorder = hasDropAccess(invite as any, !!inviteRequired);
  
  const inviteLabel = inviteRequired ? "Invite noetig" : "Offen fuer alle";
  const flavorLabel = selectedVariant?.flavor ?? drop.flavorTag;
  const minQuantity = selectedVariant?.minQuantity ?? drop.minQuantity;
  const maxQuantity = selectedVariant?.maxQuantity ?? drop.maxPerUser ?? 10;
  const unitPrice = selectedVariant?.basePrice ?? drop.price;
  const priceLabel = formatPrice(unitPrice, drop.currency);
  const compareLabel = selectedVariant?.priceCompareAt
    ? formatPrice(selectedVariant.priceCompareAt, drop.currency)
    : null;
  const shippingHighlight = resolveShippingHighlight(drop, selectedVariant);
  
  const totalPrice = unitPrice * selectedQuantity;
  const totalPriceLabel = formatPrice(totalPrice, drop.currency);
  
  const actionLabel = !canPreorder
    ? "Interesse zeigen"
    : drop.status === "locked"
    ? "Bald verfuegbar"
    : unitPrice === 0
    ? "Gratis zum Warenkorb"
    : "Zum Warenkorb";

  const variantPreview = drop.variants.slice(0, 3);
  const remainingVariants = drop.variants.length - variantPreview.length;
  const interestCount = interests[drop.id] ?? drop.interestCount;

  const handleOpen = () => onOpen(drop);
  const handleKey = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  const handleAddToCart = () => {
    console.log('🚀 DropCard handleAddToCart aufgerufen', {
      drop: drop.name,
      variant: selectedVariant?.label,
      quantity: selectedQuantity,
      canPreorder,
      selectedVariant
    });

    if (!canPreorder) {
      console.log('❌ Cannot preorder - showing error toast');
      showToast.error("Nicht verfügbar", "Für diesen Drop benötigst du eine Einladung");
      return;
    }

    if (!selectedVariant) {
      console.log('❌ No selected variant');
      showToast.error("Fehler", "Bitte wähle eine Variante aus");
      return;
    }

    console.log('✅ Adding to cart...', { drop, selectedVariant, selectedQuantity });
    const success = addDropItemToCart(drop, selectedVariant, selectedQuantity);

    console.log('📊 Add to cart result:', success);

    if (success) {
      showToast.success(
        'Zum Warenkorb hinzugefügt!',
        `${selectedQuantity}x ${selectedVariant.label} wurde zum Warenkorb hinzugefügt`
      );
    } else {
      showToast.error("Fehler", "Konnte nicht zum Warenkorb hinzugefügt werden");
    }
  };
  
  const handleVariantSelect = (variantId: string) => {
    setSelectedVariantId(variantId);
    const variant = drop.variants.find(v => v.id === variantId);
    if (variant) {
      setSelectedQuantity(Math.max(variant.minQuantity, 1));
    }
  };
  
  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.min(Math.max(selectedQuantity + delta, minQuantity), maxQuantity);
    setSelectedQuantity(newQuantity);
  };
  
  const handleQuickPreorder = () => {
    if (onQuickPreorder && canPreorder) {
      onQuickPreorder(drop, selectedVariant, selectedQuantity);
    } else if (!canPreorder) {
      toggleInterest(drop.id);
    }
  };
  
  const handleInterest = () => {
    toggleInterest(drop.id);
  };

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-card transition hover:border-accent/40 hover:shadow-[0_24px_48px_rgba(11,247,188,0.18)]",
        compact ? "p-4" : "p-6",
        "min-h-[400px] flex flex-col" // Ensure full height display
      )}
    >
      <div className="absolute inset-x-0 -top-32 h-48 bg-[radial-gradient(circle_at_top,rgba(11,247,188,0.35),transparent_70%)]" aria-hidden />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <Badge variant={badgeVariant(drop.badge)}>{drop.badge}</Badge>
          <Badge variant="ghost">{drop.locale}</Badge>
          {!canPreorder && (
            <Badge variant="accent">Invite nötig</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Users className="h-3 w-3" />
          <span>{interestCount}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative mt-6 space-y-5 flex-1 flex flex-col">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-bold tracking-[0.35rem] text-text">{drop.name}</h3>
            <button
              onClick={handleOpen}
              className="text-xs text-muted hover:text-accent transition"
            >
              Details →
            </button>
          </div>
          <p className="text-sm text-muted">{accessMeta[drop.access].headline}</p>
          <p className="text-xs text-muted/80">{accessMeta[drop.access].detail}</p>
        </div>

        {/* Variant Preview */}
        {showQuickActions && drop.variants.length > 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted">Varianten</p>
              <button
                onClick={() => setShowVariantPreview(!showVariantPreview)}
                className="text-xs text-accent hover:text-accent/80 transition"
              >
                {showVariantPreview ? "Weniger" : "Alle anzeigen"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(showVariantPreview ? drop.variants : variantPreview).map((variant) => {
                const isActive = variant.id === selectedVariantId;
                const isDisabled = variant.stock <= 0;
                return (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant.id)}
                    disabled={isDisabled}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                      isActive
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-white/15 text-muted hover:border-accent/40 hover:text-accent",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {variant.label}
                    {variant.badges?.includes("Limited") && " 🔥"}
                    {variant.badges?.includes("VIP") && " 👑"}
                  </button>
                );
              })}
              {!showVariantPreview && remainingVariants > 0 && (
                <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-muted">
                  +{remainingVariants} weitere
                </span>
              )}
            </div>
          </div>
        )}

        {/* Product Image Preview */}
        {selectedVariant.media?.[0] && (
          <div className="relative">
            <div onClick={handleOpen} className="cursor-pointer">
              <ProductImage
                src={selectedVariant.media[0].url}
                alt={selectedVariant.media[0].alt}
                aspectRatio="4 / 3"
                fallbackColor={selectedVariant.media[0].dominantColor ?? "#0BF7BC"}
                overlayLabel={selectedVariant.label}
              />
            </div>
            {selectedVariant.badges?.length && (
              <div className="absolute left-3 top-3 flex gap-2">
                {selectedVariant.badges.map((badge) => (
                  <span key={badge} className="rounded-full bg-accent/20 px-2 py-1 text-xs text-accent">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Info Tags */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span className="rounded-full bg-black/40 px-3 py-1">Flavor: {flavorLabel}</span>
          <span className="rounded-full bg-black/40 px-3 py-1">Min {minQuantity}</span>
          <span className="rounded-full bg-black/40 px-3 py-1">{inviteLabel}</span>
          {shippingHighlight ? (
            <span className="rounded-full bg-black/40 px-3 py-1">
              Versand: {shippingHighlight.label} | {formatPrice(shippingHighlight.price, drop.currency)}
            </span>
          ) : null}
        </div>

        {/* Quick Quantity Selector */}
        {showQuickActions && canPreorder && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
              <span>Menge</span>
              <span>Min {minQuantity} · Max {maxQuantity}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={selectedQuantity <= minQuantity}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-text transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="number"
                min={minQuantity}
                max={maxQuantity}
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Math.min(Math.max(Number(e.target.value), minQuantity), maxQuantity))}
                className="h-8 w-16 rounded-lg border border-white/10 bg-black/50 text-center text-sm font-semibold text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={selectedQuantity >= maxQuantity}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-text transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Pricing & Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-semibold text-text">{priceLabel}</p>
              {compareLabel ? <p className="text-xs text-muted line-through">{compareLabel}</p> : null}
              {showQuickActions && selectedQuantity > 1 && (
                <p className="text-sm text-accent">
                  {selectedQuantity}x = {totalPriceLabel}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {!canPreorder && (
                <button
                  onClick={handleInterest}
                  className="flex items-center gap-1 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-accent/20"
                >
                  <Star className="h-3 w-3" />
                  Interesse
                </button>
              )}
              <button
                className={cn(
                  "rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  canPreorder
                    ? "bg-accent text-black hover:brightness-110"
                    : "border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20",
                  drop.status === "locked" && "cursor-not-allowed bg-surface/40 text-muted hover:brightness-100"
                )}
                disabled={drop.status === "locked"}
                onClick={(event) => {
                  event.stopPropagation();
                  if (canPreorder) {
                    handleAddToCart();
                  } else {
                    handleInterest();
                  }
                }}
              >
                {actionLabel}
              </button>
            </div>
          </div>

          {/* Quick Actions Row */}
          {showQuickActions && (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleOpen}
                className="flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs text-muted transition hover:border-accent hover:text-accent"
              >
                <ShoppingCart className="h-3 w-3" />
                Details
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
      <footer className="relative mt-auto pt-6 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Progress</span>
          <span>{Math.round(drop.progress * 100)}%</span>
        </div>
        <ProgressBar value={drop.progress} />
        {drop.status === "locked" && (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span>Drop ist gelockt - bald verfügbar</span>
          </div>
        )}
      </footer>
    </article>
  );
};
