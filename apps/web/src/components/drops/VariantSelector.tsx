import { memo } from 'react';
import type { DropVariant } from '@nebula/shared';
import { cn } from '../../utils/cn';
import { Check, Crown, Flame, Sparkles } from 'lucide-react';

export type VariantSelectorMode = 'single' | 'multi' | 'gallery';

interface VariantSelectorProps {
  variants: DropVariant[];
  selectedIds: string | string[];
  onSelect: (variantId: string) => void;
  mode?: VariantSelectorMode;
  currency?: string;
  showPrice?: boolean;
  showStock?: boolean;
  className?: string;
}

/**
 * 🎨 Reusable Variant Selector Component
 * Supports single, multi, and gallery modes with animations
 */
export const VariantSelector = memo(({
  variants,
  selectedIds,
  onSelect,
  mode = 'single',
  currency = 'EUR',
  showPrice = true,
  showStock = true,
  className
}: VariantSelectorProps) => {
  const selectedIdsArray = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
  
  const isSelected = (variantId: string) => selectedIdsArray.includes(variantId);

  const getBadgeIcon = (badges?: string[]) => {
    if (!badges?.length) return null;
    
    if (badges.includes('VIP')) return <Crown className="h-3 w-3" />;
    if (badges.includes('Limited')) return <Flame className="h-3 w-3" />;
    if (badges.includes('Kostenlos')) return <Sparkles className="h-3 w-3" />;
    
    return null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency
    }).format(price);
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Ausverkauft', className: 'text-red-400 bg-red-400/10' };
    if (stock <= 5) return { label: `Nur ${stock} übrig`, className: 'text-amber-400 bg-amber-400/10' };
    return null;
  };

  if (mode === 'gallery') {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 gap-4', className)}>
        {variants.map((variant) => {
          const selected = isSelected(variant.id);
          const disabled = variant.stock <= 0;
          const stockStatus = getStockStatus(variant.stock);
          const badgeIcon = getBadgeIcon(variant.badges);

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => !disabled && onSelect(variant.id)}
              disabled={disabled}
              className={cn(
                'relative group rounded-xl border-2 p-4 transition-all duration-300',
                'hover:scale-[1.02] active:scale-[0.98]',
                selected
                  ? 'border-accent bg-accent/10 shadow-lg shadow-accent/25'
                  : 'border-white/20 hover:border-accent/50',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
              )}
            >
              {/* Image */}
              {variant.media?.[0] && (
                <div className="aspect-square mb-3 rounded-lg overflow-hidden">
                  <img
                    src={variant.media[0].url}
                    alt={variant.media[0].alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              )}

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-text">{variant.label}</h4>
                  {selected && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <Check className="h-3 w-3 text-black" />
                    </div>
                  )}
                </div>

                {variant.flavor && (
                  <p className="text-xs text-muted">{variant.flavor}</p>
                )}

                {showPrice && (
                  <p className="text-sm font-bold text-accent">
                    {formatPrice(variant.basePrice)}
                  </p>
                )}

                {/* Badges */}
                {badgeIcon && (
                  <div className="flex items-center gap-1">
                    {badgeIcon}
                    <span className="text-xs text-accent">{variant.badges?.[0]}</span>
                  </div>
                )}

                {/* Stock Status */}
                {showStock && stockStatus && (
                  <div className={cn('text-xs px-2 py-1 rounded-full', stockStatus.className)}>
                    {stockStatus.label}
                  </div>
                )}
              </div>

              {/* Selection Indicator */}
              {selected && (
                <div className="absolute inset-0 rounded-xl border-2 border-accent pointer-events-none animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // List Mode (single/multi)
  return (
    <div className={cn('space-y-3', className)}>
      {variants.map((variant) => {
        const selected = isSelected(variant.id);
        const disabled = variant.stock <= 0;
        const stockStatus = getStockStatus(variant.stock);
        const badgeIcon = getBadgeIcon(variant.badges);

        return (
          <button
            key={variant.id}
            type="button"
            onClick={() => !disabled && onSelect(variant.id)}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl border-2 p-4 text-left transition-all duration-300',
              'hover:scale-[1.01] active:scale-[0.99]',
              selected
                ? 'border-accent bg-accent/10 shadow-lg shadow-accent/25 variant-select'
                : 'border-white/20 hover:border-accent/50',
              disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Multi-select checkbox */}
              {mode === 'multi' && (
                <div className={cn(
                  'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  selected ? 'bg-accent border-accent' : 'border-white/30'
                )}>
                  {selected && <Check className="h-3 w-3 text-black" />}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-text flex items-center gap-2">
                      {variant.label}
                      {badgeIcon && (
                        <span className="text-accent">
                          {badgeIcon}
                        </span>
                      )}
                    </h4>
                    {variant.description && (
                      <p className="text-sm text-muted mt-1">{variant.description}</p>
                    )}
                  </div>

                  {showPrice && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-text">
                        {formatPrice(variant.basePrice)}
                      </p>
                      {variant.priceCompareAt && variant.priceCompareAt > variant.basePrice && (
                        <p className="text-xs text-muted line-through">
                          {formatPrice(variant.priceCompareAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {variant.flavor && (
                    <span className="px-2 py-1 rounded-full bg-white/5 text-muted">
                      {variant.flavor}
                    </span>
                  )}
                  
                  {showStock && (
                    <span className="px-2 py-1 rounded-full bg-white/5 text-muted">
                      {variant.stock} verfügbar
                    </span>
                  )}

                  {stockStatus && (
                    <span className={cn('px-2 py-1 rounded-full font-medium', stockStatus.className)}>
                      {stockStatus.label}
                    </span>
                  )}
                </div>

                {/* Badges */}
                {variant.badges?.length && (
                  <div className="flex flex-wrap gap-2">
                    {variant.badges.map((badge) => (
                      <span
                        key={badge}
                        className="px-2 py-1 rounded-full bg-accent/20 text-xs text-accent font-medium"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Single-select indicator */}
              {mode === 'single' && selected && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <Check className="h-4 w-4 text-black" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
});

VariantSelector.displayName = 'VariantSelector';





