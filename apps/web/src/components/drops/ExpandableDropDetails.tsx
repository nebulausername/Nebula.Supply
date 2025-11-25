import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, MapPin } from "lucide-react";
import { cn } from "../../utils/cn";
import { getDynamicDeliveryTime, getPrimaryDeliveryOrigin, getSimplifiedOriginLabel } from "../../utils/deliveryTimes";
import type { Drop, DropVariant } from "@nebula/shared";

interface ExpandableDropDetailsProps {
  drop: Drop;
  defaultVariant?: DropVariant;
  className?: string;
}

export const ExpandableDropDetails = ({
  drop,
  defaultVariant,
  className
}: ExpandableDropDetailsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(10);
          }
          setIsExpanded(!isExpanded);
        }}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-white/10 bg-black/20 hover:bg-black/30 transition-all duration-300 min-h-[44px] touch-target active:scale-[0.98]"
        aria-label={isExpanded ? "Details ausblenden" : "Details anzeigen"}
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-semibold text-white">
          Details {isExpanded ? "ausblenden" : "anzeigen"}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-white transition-transform duration-300" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white transition-transform duration-300" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3 p-3 md:p-4 rounded-lg border border-white/10 bg-black/20 animate-in slide-in-from-top-2 duration-300">
          {/* Description */}
          {drop.shortDescription && (
            <div className="space-y-1.5 pb-3 border-b border-white/5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-300/90">
                💬 Beschreibung
              </h4>
              <p className="text-sm text-white/80 leading-relaxed">
                {drop.shortDescription}
              </p>
            </div>
          )}

          {/* Highlight Message */}
          {drop.highlightMessage && (
            <div className="space-y-1.5 pb-3 border-b border-white/5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-orange-300/90">
                ✨ Highlight
              </h4>
              <p className="text-sm text-white/80 leading-relaxed">
                {drop.highlightMessage}
              </p>
            </div>
          )}

          {/* Variants - Kompakt */}
          {drop.variants.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-300/90">
                🎨 Varianten ({drop.variants.length})
              </h4>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {drop.variants.slice(0, 4).map((variant) => (
                  <div
                    key={variant.id}
                    className={cn(
                      "p-2.5 rounded-lg border transition-all relative overflow-hidden",
                      variant.id === defaultVariant?.id
                        ? "border-accent/50 bg-accent/10 ring-1 ring-accent/20"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    {variant.id === defaultVariant?.id && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {variant.label}
                        </p>
                        {variant.flavor && (
                          <p className="text-[11px] text-blue-200/70 truncate">
                            {variant.flavor}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white tabular-nums">
                          {variant.basePrice.toFixed(2)}€
                        </p>
                        {variant.stock !== undefined && (
                          <p className={cn(
                            "text-[10px] font-medium tabular-nums",
                            variant.stock > 0 ? "text-green-400" : "text-red-400"
                          )}>
                            {variant.stock > 0 ? `${variant.stock}x` : "Aus"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {drop.variants.length > 4 && (
                  <div className="col-span-full text-center py-1">
                    <span className="text-xs text-white/50">
                      +{drop.variants.length - 4} weitere
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Options - Kompakt */}
          {drop.shippingOptions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-green-300/90">
                🚚 Versand
              </h4>
              <div className="space-y-1.5">
                {drop.shippingOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {option.label}
                      </p>
                      {option.leadTime && (
                        <p className="text-[11px] text-blue-200/70">
                          {option.leadTime}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-bold text-white tabular-nums">
                        {option.price.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

