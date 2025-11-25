import { memo, useState } from "react";
import { CreditCard, Minus, Plus, Share2, ShoppingCart, Star, Heart } from "lucide-react";
import type { ChangeEvent } from "react";

interface MobileProductActionsProps {
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  quickOptions: number[];
  accentColor: string;
  isInterested: boolean;
  shareFeedback: "idle" | "copied" | "shared" | "error";
  onQuantityChange: (value: number) => void;
  onAddToCart: () => void;
  onDirectCheckout: () => void;
  onInterestToggle: () => void;
  onShare: () => void;
}

// 🎯 Mobile-optimierte Actions-Komponente
export const MobileProductActions = memo(({
  quantity,
  minQuantity,
  maxQuantity,
  quickOptions,
  accentColor,
  isInterested,
  shareFeedback,
  onQuantityChange,
  onAddToCart,
  onDirectCheckout,
  onInterestToggle,
  onShare
}: MobileProductActionsProps) => {
  
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

  // 🎯 Quantity Adjust mit Haptic Feedback und Loading State
  const [isAdjusting, setIsAdjusting] = useState(false);
  
  const adjust = (delta: number) => {
    const newQuantity = Math.min(Math.max(quantity + delta, minQuantity), maxQuantity);
    if (newQuantity !== quantity) {
      setIsAdjusting(true);
      // Haptic Feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onQuantityChange(newQuantity);
      // Reset loading state after animation
      setTimeout(() => setIsAdjusting(false), 200);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🎯 Quantity Selector - Mobile Optimized */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm font-medium text-muted">
          <span>Menge</span>
          <span>ab {minQuantity} Stück</span>
        </div>
        
        {/* 🎯 Large Touch-Friendly Quantity Controls */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => adjust(-1)}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white/20 bg-black/30 text-text transition hover:border-accent/40 hover:text-accent hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
              isAdjusting ? 'animate-pulse' : ''
            }`}
            disabled={quantity <= minQuantity || isAdjusting}
            aria-label="Menge reduzieren"
          >
            <Minus className="h-6 w-6" />
          </button>
          
          <input
            type="number"
            min={minQuantity}
            max={maxQuantity}
            value={quantity}
            onChange={handleInput}
            className="h-12 w-24 rounded-xl border-2 border-white/20 bg-black/50 text-center text-xl font-bold text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            aria-label="Aktuelle Menge"
          />
          
          <button
            type="button"
            onClick={() => adjust(1)}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white/20 bg-black/30 text-text transition hover:border-accent/40 hover:text-accent hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
              isAdjusting ? 'animate-pulse' : ''
            }`}
            disabled={quantity >= maxQuantity || isAdjusting}
            aria-label="Menge erhöhen"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
        
        {/* 🎯 Quick Options - Mobile Optimized */}
        {quickOptions.length ? (
          <div className="flex flex-wrap gap-3">
            {quickOptions.map((option) => {
              const isActive = option === quantity;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onQuantityChange(option)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                    isActive 
                      ? "bg-accent text-black border-accent shadow-lg scale-105" 
                      : "bg-black/40 text-muted border-white/20 hover:bg-black/50 hover:text-text hover:border-accent/40 hover:scale-102"
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

      {/* 🎯 Main Action Buttons - Mobile Optimized */}
      <div className="space-y-4">
        {/* 🎯 Primary Action - nur ein Button für Mobile */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-accent px-6 py-4 text-lg font-bold text-black transition-all duration-200 hover:brightness-110 active:scale-95 shadow-lg shadow-accent/20 hover:shadow-accent/30"
          onClick={() => {
            // Haptic Feedback
            if ('vibrate' in navigator) {
              navigator.vibrate(20);
            }
            onAddToCart();
          }}
        >
          <ShoppingCart className="h-6 w-6" /> 
          In den Warenkorb
        </button>
        
        {/* 🎯 Secondary Action - kleiner */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-accent/60 px-4 py-3 text-base font-semibold text-accent transition hover:bg-accent/10 active:scale-95"
          onClick={onDirectCheckout}
        >
          <CreditCard className="h-5 w-5" /> 
          Direkt bezahlen
        </button>
        
        {/* 🎯 Secondary Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            className={`flex-1 flex items-center justify-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition active:scale-95 min-h-[44px] ${
              isInterested
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-white/20 text-muted hover:border-accent hover:text-accent hover:bg-accent/5"
            }`}
            onClick={onInterestToggle}
            aria-label="Interessiert"
            aria-pressed={isInterested}
          >
            <Heart className={`h-5 w-5 ${isInterested ? "fill-current" : ""}`} />
            {isInterested ? "Interessiert" : "Interesse"}
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-3 rounded-xl border-2 border-white/20 px-4 py-3 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent hover:bg-accent/5 active:scale-95 min-h-[44px]"
            onClick={onShare}
          >
            <Share2 className="h-5 w-5" />
            {shareFeedback === "copied"
              ? "Link kopiert"
              : shareFeedback === "shared"
              ? "Gesendet"
              : "Teilen"}
          </button>
        </div>
        
        {shareFeedback === "error" ? (
          <p className="text-center text-sm text-muted">Teilen momentan nicht möglich.</p>
        ) : null}
      </div>
    </div>
  );
});

MobileProductActions.displayName = 'MobileProductActions';
