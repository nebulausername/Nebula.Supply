import { memo, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { TrendingDown, Tag } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface PriceDisplayProps {
  price: number;
  comparePrice?: number;
  currency?: string;
  quantity?: number;
  showBreakdown?: boolean;
  showSavings?: boolean;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 🎨 Animated Price Display Component
 * Features: Price breakdown, savings calculator, pulsing animation
 */
export const PriceDisplay = memo(({
  price,
  comparePrice,
  currency = 'EUR',
  quantity = 1,
  showBreakdown = false,
  showSavings = true,
  animate = true,
  size = 'md',
  className
}: PriceDisplayProps) => {
  const [displayPrice, setDisplayPrice] = useState(price);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalPrice = price * quantity;
  const totalComparePrice = comparePrice ? comparePrice * quantity : null;
  const savings = totalComparePrice ? totalComparePrice - totalPrice : 0;
  const savingsPercent = totalComparePrice ? Math.round((savings / totalComparePrice) * 100) : 0;

  const formatPrice = (value: number) => formatCurrency(value, 'de-DE', currency);

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  const subTextClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Animate price changes
  useEffect(() => {
    if (!animate) {
      setDisplayPrice(totalPrice);
      return;
    }

    setIsAnimating(true);
    
    const duration = 300;
    const steps = 20;
    const stepValue = (totalPrice - displayPrice) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayPrice(totalPrice);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        setDisplayPrice(prev => prev + stepValue);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalPrice, animate]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Main Price */}
      <div className="space-y-1">
        <div className={cn(
          'font-bold text-text',
          sizeClasses[size],
          isAnimating && animate && 'price-pulse'
        )}>
          {formatPrice(displayPrice)}
        </div>

        {/* Compare Price */}
        {comparePrice && comparePrice > price && (
          <div className={cn('flex items-center gap-2', subTextClasses[size])}>
            <span className="text-muted line-through">
              {formatPrice(totalComparePrice!)}
            </span>
            {showSavings && savingsPercent > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-semibold">
                <TrendingDown className="h-3 w-3" />
                {savingsPercent}% sparen
              </span>
            )}
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      {showBreakdown && quantity > 1 && (
        <div className={cn(
          'space-y-1 p-3 rounded-lg bg-white/5 border border-white/10',
          subTextClasses[size]
        )}>
          <div className="flex justify-between text-muted">
            <span>Einzelpreis:</span>
            <span className="font-semibold">{formatPrice(price)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Menge:</span>
            <span className="font-semibold">{quantity}x</span>
          </div>
          <div className="h-px bg-white/10 my-2" />
          <div className="flex justify-between text-text font-semibold">
            <span>Gesamt:</span>
            <span className="text-accent">{formatPrice(totalPrice)}</span>
          </div>
          
          {/* Savings Breakdown */}
          {showSavings && savings > 0 && (
            <>
              <div className="h-px bg-white/10 my-2" />
              <div className="flex justify-between text-green-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Du sparst:
                </span>
                <span>{formatPrice(savings)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Multi-Quantity Info */}
      {quantity > 1 && !showBreakdown && (
        <div className={cn('text-accent font-medium', subTextClasses[size])}>
          {quantity}x = {formatPrice(totalPrice)}
        </div>
      )}

      {/* Savings Badge (compact) */}
      {!showBreakdown && showSavings && savings > 0 && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30">
          <Tag className="h-4 w-4 text-green-400" />
          <span className={cn('text-green-400 font-semibold', subTextClasses[size])}>
            {formatPrice(savings)} sparen ({savingsPercent}%)
          </span>
        </div>
      )}
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';





