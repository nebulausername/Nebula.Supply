import { memo } from "react";
import { CreditCard, Minus, Plus, Share2, ShoppingCart, Star } from "lucide-react";
import type { ChangeEvent } from "react";

interface ProductActionsProps {
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  quickOptions: number[];
  accentColor: string;
  isInterested: boolean;
  shareFeedback: "idle" | "copied" | "shared" | "error";
  isMobile: boolean;
  onQuantityChange: (value: number) => void;
  onAddToCart: () => void;
  onDirectCheckout: () => void;
  onInterestToggle: () => void;
  onShare: () => void;
}

// 🎯 Optimierte Actions-Komponente
export const ProductActions = memo(({
  quantity,
  minQuantity,
  maxQuantity,
  quickOptions,
  accentColor,
  isInterested,
  shareFeedback,
  isMobile,
  onQuantityChange,
  onAddToCart,
  onDirectCheckout,
  onInterestToggle,
  onShare
}: ProductActionsProps) => {
  
  // 🎯 Quantity Input Handler
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === "") {
      onQuantityChange(minQuantity);
      return;
    }
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      return;
    }
    onQuantityChange(Math.min(Math.max(parsed, minQuantity), maxQuantity));
  };

  // 🎯 Quantity Adjust
  const adjust = (delta: number) => {
    onQuantityChange(Math.min(Math.max(quantity + delta, minQuantity), maxQuantity));
  };

  return (
    <div className="space-y-6">
      {/* 🎯 Quantity Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted font-medium">
          <span>Menge</span>
          <span>ab {minQuantity} Stück</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => adjust(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-text transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            disabled={quantity <= minQuantity}
            aria-label="Menge reduzieren"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={minQuantity}
            max={maxQuantity}
            value={quantity}
            onChange={handleInput}
            className="h-10 w-full rounded-xl border border-white/10 bg-black/50 text-center text-lg font-semibold text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            aria-label="Aktuelle Menge"
          />
          <button
            type="button"
            onClick={() => adjust(1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-text transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            disabled={quantity >= maxQuantity}
            aria-label="Menge erhöhen"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        {/* 🎯 Quick Options */}
        {quickOptions.length ? (
          <div className="flex flex-wrap gap-2">
            {quickOptions.map((option) => {
              const isActive = option === quantity;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onQuantityChange(option)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    isActive ? "bg-black/70 text-text" : "bg-black/40 text-muted hover:bg-black/50 hover:text-text"
                  }`}
                  style={{ borderColor: isActive ? accentColor : "rgba(255,255,255,0.12)" }}
                >
                  {option} Stück
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* 🎯 Action Buttons */}
      <div className="space-y-3">
        <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isMobile ? 'w-full' : 'flex-1'
            }`}
            onClick={onAddToCart}
          >
            <ShoppingCart className="h-4 w-4" /> In den Warenkorb
          </button>
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-xl border border-accent/60 px-5 py-3 text-sm font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isMobile ? 'w-full' : 'flex-1'
            }`}
            onClick={onDirectCheckout}
          >
            <CreditCard className="h-4 w-4" /> Direkt bezahlen
          </button>
        </div>
        
        {/* 🎯 Secondary Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isInterested
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-white/15 text-muted hover:border-accent hover:text-accent"
            }`}
            onClick={onInterestToggle}
            aria-label="Interessiert"
            aria-pressed={isInterested}
          >
            <Star className={`h-3.5 w-3.5 ${isInterested ? "fill-current" : ""}`} />
            {isInterested ? "Interessiert" : "Interesse"}
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-muted transition hover:border-accent hover:text-accent"
            onClick={onShare}
          >
            <Share2 className="h-3.5 w-3.5" />
            {shareFeedback === "copied"
              ? "Link kopiert"
              : shareFeedback === "shared"
              ? "Gesendet"
              : "Teilen"}
          </button>
        </div>
        
        {shareFeedback === "error" ? (
          <p className="text-center text-xs text-muted">Teilen momentan nicht möglich.</p>
        ) : null}
      </div>
    </div>
  );
});

ProductActions.displayName = 'ProductActions';
