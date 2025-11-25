import { motion } from 'framer-motion';
import { Cookie, TrendingUp, Award } from 'lucide-react';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { useGamingDiscountStore, DISCOUNT_TIERS, formatCookies, formatCoins, getNextAvailableTier } from '../../store/gamingDiscounts';
import { cn } from '../../utils/cn';

interface DiscountProgressTrackerProps {
  variant?: 'compact' | 'full';
  className?: string;
  onClick?: () => void;
}

export const DiscountProgressTracker = ({
  variant = 'full',
  className,
  onClick
}: DiscountProgressTrackerProps) => {
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const availableDiscounts = useGamingDiscountStore(state => state.availableDiscounts);
  const getProgressToNextDiscount = useGamingDiscountStore(state => state.getProgressToNextDiscount);

  // Finde nächsten erreichbaren Tier
  const nextTier = getNextAvailableTier();
  if (!nextTier) return null;

  const progress = getProgressToNextDiscount(nextTier.tier);
  const hasAvailable = availableDiscounts.length > 0;

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className={cn(
          "relative group",
          className
        )}
      >
        {/* Badge/Indicator */}
        <div className="relative">
          <Cookie className={cn(
            "w-6 h-6 transition-all duration-300",
            hasAvailable
              ? "text-green-500 animate-pulse"
              : progress.percentage >= 90
              ? "text-yellow-500"
              : "text-orange-500"
          )} />
          
          {hasAvailable && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
          )}
        </div>

        {/* Tooltip */}
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="text-xs space-y-2">
            {hasAvailable ? (
              <div className="text-green-500 font-semibold">
                {availableDiscounts.length} Rabatt{availableDiscounts.length > 1 ? 'e' : ''} verfügbar!
              </div>
            ) : (
              <>
                <div className="text-muted">Nächster Rabatt:</div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{nextTier.icon} {nextTier.tier}</span>
                  <span className="text-orange-500">{progress.percentage.toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full bg-gradient-to-r", nextTier.color)}
                    style={{ width: `${Math.min(100, progress.percentage)}%` }}
                  />
                </div>
                <div className="text-muted text-[10px]">
                  Noch {formatCoins(progress.missing)} Coins
                </div>
              </>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20 p-4",
        onClick && "cursor-pointer hover:bg-orange-500/15 transition-all",
        className
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cookie className="w-5 h-5 text-orange-500" />
          <span className="font-semibold text-sm">Gaming-Rabatte</span>
        </div>
        {hasAvailable && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
            <Award className="w-3 h-3 text-green-500" />
            <span className="text-xs font-semibold text-green-500">
              {availableDiscounts.length} verfügbar
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      {hasAvailable ? (
        <div className="space-y-2">
          <p className="text-sm text-green-500 font-medium">
            Rabatt{availableDiscounts.length > 1 ? 'e' : ''} bereit zum Einlösen!
          </p>
          <div className="flex flex-wrap gap-2">
            {availableDiscounts.map(discount => {
              const tierConfig = DISCOUNT_TIERS.find(t => t.tier === discount.tier);
              return tierConfig ? (
                <div
                  key={discount.id}
                  className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-xs font-medium"
                >
                  {tierConfig.icon} {tierConfig.tier}
                </div>
              ) : null;
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Nächster Rabatt: {nextTier.icon} {nextTier.tier}</span>
            <span className="font-mono text-orange-500">{progress.percentage.toFixed(0)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress.percentage)}%` }}
              transition={{ duration: 0.5 }}
              className={cn(
                "h-full rounded-full bg-gradient-to-r",
                nextTier.color
              )}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              {formatCoins(progress.currentCoins)} / {formatCoins(progress.requiredCoins)}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {formatCookies(cookiesPerSecond)}/s
            </span>
          </div>

          {progress.percentage >= 90 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-yellow-500 font-medium text-center mt-2"
            >
              Fast geschafft! Noch {formatCoins(progress.missing)} Coins!
            </motion.p>
          )}
        </div>
      )}

      {onClick && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-center text-muted hover:text-text transition-colors">
            Klicke um zum Cookie Clicker zu gehen →
          </div>
        </div>
      )}
    </motion.div>
  );
};



