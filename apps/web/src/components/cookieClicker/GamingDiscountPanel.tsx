import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Check, Zap, TrendingUp, Clock, Award } from 'lucide-react';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { useGamingDiscountStore, DISCOUNT_TIERS, formatCookies, formatCoins } from '../../store/gamingDiscounts';
import { cn } from '../../utils/cn';
import { useToastStore } from '../../store/toast';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

export const GamingDiscountPanel = () => {
  const { triggerHaptic } = useEnhancedTouch();
  const addToast = useToastStore(state => state.addToast);
  
  const currentCoins = useCookieClickerStore(state => state.coins); // ✅ AKTUELLE COINS!
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  
  const {
    claimDiscount,
    getProgressToNextDiscount,
    getRequiredCoins,
    availableDiscounts,
    usedDiscounts,
    redemptionHistory,
    getTotalSavings
  } = useGamingDiscountStore();

  const [claimingTier, setClaimingTier] = useState<string | null>(null);

  // Handle Rabatt Claim
  const handleClaimDiscount = useCallback(async (tier: '5%' | '10%' | '15%' | '20%') => {
    const tierConfig = DISCOUNT_TIERS.find(t => t.tier === tier);
    if (!tierConfig) return;

    const requiredCoins = getRequiredCoins(tier);
    
    // Confirmation
    const confirmed = window.confirm(
      `${tierConfig.tier} Rabatt für ${formatCoins(requiredCoins)} Coins sichern?\n\n` +
      `Dieser Rabatt ist einmalig verwendbar im nächsten Checkout.\n` +
      `Der nächste ${tier} Rabatt wird schwieriger zu erspielen sein.`
    );

    if (!confirmed) return;

    setClaimingTier(tier);
    triggerHaptic('medium');

    // Claim Discount
    const success = claimDiscount(tier);

    if (success) {
      addToast({
        type: 'success',
        title: `${tierConfig.icon} ${tier} Gaming-Rabatt gesichert!`,
        message: 'Löse ihn im Checkout ein!',
        duration: 5000
      });
      triggerHaptic('success');
    } else {
      addToast({
        type: 'error',
        title: 'Fehler',
        message: 'Nicht genug Coins oder Rabatt bereits vorhanden',
        duration: 3000
      });
      triggerHaptic('error');
    }

    setClaimingTier(null);
  }, [claimDiscount, getRequiredCoins, addToast, triggerHaptic]);

  const totalSavings = getTotalSavings();

  return (
    <div className="space-y-6">
      {/* 🎯 GEILER HEADER MIT INFOS */}
      <motion.div
        className="relative overflow-hidden rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-red-500/10 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(251,146,60,0.3)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background Animation */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-yellow-500/5 to-orange-500/5"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Trophy className="w-10 h-10 text-orange-400" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">🎮 Gaming-Rabatte</h2>
              <p className="text-white/70 text-sm">Erspiele dir exklusive Rabatte für den Shop!</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview - MODERN CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { 
            icon: Trophy, 
            label: 'Verfügbar', 
            value: availableDiscounts.length, 
            gradient: 'from-orange-500/20 to-yellow-500/10',
            borderColor: 'border-orange-500/40',
            iconColor: 'text-orange-400',
            textColor: 'text-orange-300',
            glowColor: 'hover:shadow-[0_0_25px_rgba(251,146,60,0.4)]'
          },
          { 
            icon: Check, 
            label: 'Verwendet', 
            value: usedDiscounts.length, 
            gradient: 'from-green-500/20 to-emerald-500/10',
            borderColor: 'border-green-500/40',
            iconColor: 'text-green-400',
            textColor: 'text-green-300',
            glowColor: 'hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]'
          },
          { 
            icon: Award, 
            label: 'Ersparnisse', 
            value: `€${totalSavings.toFixed(2)}`, 
            gradient: 'from-purple-500/20 to-pink-500/10',
            borderColor: 'border-purple-500/40',
            iconColor: 'text-purple-400',
            textColor: 'text-purple-300',
            glowColor: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]'
          },
          { 
            icon: TrendingUp, 
            label: 'Aktuelle Coins', 
            value: formatCoins(currentCoins), 
            gradient: 'from-cyan-500/20 to-blue-500/10',
            borderColor: 'border-cyan-500/40',
            iconColor: 'text-cyan-400',
            textColor: 'text-cyan-300',
            glowColor: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]'
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className={cn(
                "relative overflow-hidden rounded-xl border-2 backdrop-blur-sm p-4 transition-all duration-300",
                stat.gradient,
                stat.borderColor,
                stat.glowColor
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.05 }}
            >
              {/* Animated background */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-5 h-5", stat.iconColor)} />
                  <span className="text-xs text-white/60 font-medium">{stat.label}</span>
                </div>
                <div className={cn("text-2xl font-bold", stat.textColor)}>
                  {stat.value}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rabatt Tiers - PREMIUM CARDS */}
      <div>
        <motion.h3 
          className="text-xl font-bold mb-4 flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Zap className="w-6 h-6 text-yellow-400" />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Rabatte freischalten
          </span>
        </motion.h3>

        <div className="space-y-4">
          {DISCOUNT_TIERS.map((tier, index) => {
            const progress = getProgressToNextDiscount(tier.tier);
            const requiredCoins = getRequiredCoins(tier.tier);
            const hasAvailable = availableDiscounts.some(d => d.tier === tier.tier);
            const redemptions = redemptionHistory[tier.tier] || 0;
            
            // Note: ETA calculation removed for coins (coins are earned differently than cookies)

            // Dynamic colors based on tier
            const tierColors = {
              '5%': { 
                gradient: 'from-blue-500/20 to-cyan-500/10', 
                border: 'border-blue-500/50',
                glow: 'shadow-[0_0_30px_rgba(59,130,246,0.5)]',
                iconBg: 'bg-gradient-to-br from-blue-400 to-cyan-600',
                text: 'text-blue-200'
              },
              '10%': { 
                gradient: 'from-purple-500/20 to-pink-500/10', 
                border: 'border-purple-500/50',
                glow: 'shadow-[0_0_35px_rgba(168,85,247,0.6)]',
                iconBg: 'bg-gradient-to-br from-purple-400 to-pink-600',
                text: 'text-purple-200'
              },
              '15%': { 
                gradient: 'from-orange-500/20 to-yellow-500/10', 
                border: 'border-orange-500/50',
                glow: 'shadow-[0_0_40px_rgba(251,146,60,0.7)]',
                iconBg: 'bg-gradient-to-br from-orange-400 via-yellow-500 to-orange-600',
                text: 'text-orange-200'
              },
              '20%': { 
                gradient: 'from-red-500/25 to-pink-500/15', 
                border: 'border-red-500/60',
                glow: 'shadow-[0_0_50px_rgba(239,68,68,0.8)]',
                iconBg: 'bg-gradient-to-br from-red-400 via-pink-500 to-red-600',
                text: 'text-red-200'
              }
            };

            const colors = tierColors[tier.tier as keyof typeof tierColors] || tierColors['5%'];

            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={progress.canClaim || hasAvailable ? { y: -4, scale: 1.02 } : {}}
                className={cn(
                  "relative rounded-2xl border-2 backdrop-blur-sm p-6 transition-all duration-300 overflow-hidden",
                  progress.canClaim && !hasAvailable
                    ? cn("bg-gradient-to-br", colors.gradient, colors.border, colors.glow)
                    : hasAvailable
                    ? "bg-green-500/10 border-green-500/40 shadow-[0_0_25px_rgba(34,197,94,0.4)]"
                    : "bg-white/5 border-white/10 opacity-75"
                )}
              >
                {/* Animated Background Effect */}
                {(progress.canClaim || hasAvailable) && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                )}

                {/* Header */}
                <div className="relative z-10 flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    {/* Icon with animation */}
                    <motion.div 
                      className={cn(
                        "w-16 h-16 rounded-xl flex items-center justify-center text-4xl shadow-lg",
                        progress.canClaim && !hasAvailable ? colors.iconBg : hasAvailable ? "bg-gradient-to-br from-green-400 to-emerald-600" : "bg-slate-700/50"
                      )}
                      animate={progress.canClaim || hasAvailable ? { 
                        rotate: [0, 5, -5, 5, 0],
                        scale: [1, 1.05, 1, 1.05, 1],
                      } : {}}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {tier.icon}
                    </motion.div>

                    <div>
                      <h4 className={cn(
                        "text-2xl font-bold mb-1",
                        progress.canClaim && !hasAvailable ? colors.text : hasAvailable ? "text-green-200" : "text-white/60"
                      )}>
                        {tier.tier} Rabatt
                      </h4>
                      <p className={cn(
                        "text-sm",
                        progress.canClaim || hasAvailable ? "text-white/70" : "text-white/40"
                      )}>
                        {tier.description}
                      </p>
                    </div>
                  </div>
                  
                  {hasAvailable && (
                    <motion.div 
                      className="px-4 py-2 bg-green-500/30 border-2 border-green-400/50 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                      animate={{
                        boxShadow: [
                          "0 0 15px rgba(34,197,94,0.4)",
                          "0 0 25px rgba(34,197,94,0.6)",
                          "0 0 15px rgba(34,197,94,0.4)"
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-400" />
                        <span className="text-sm font-bold text-green-300">Verfügbar!</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Progress - MODERN STYLE */}
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60 font-medium">Fortschritt</span>
                    <span className="font-mono font-bold text-white">
                      {formatCoins(progress.currentCoins)} / {formatCoins(requiredCoins)}
                    </span>
                  </div>

                  {/* Progress Bar mit Glow */}
                  <div className="relative h-3 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, progress.percentage)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full relative",
                        progress.canClaim ? colors.iconBg : "bg-gradient-to-r from-slate-600 to-slate-500"
                      )}
                    >
                      {/* Animated shine effect */}
                      {progress.canClaim && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          animate={{
                            x: ['-100%', '200%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      )}
                    </motion.div>
                    
                    {/* Percentage Label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {Math.round(progress.percentage)}%
                      </span>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50 flex items-center gap-1.5">
                      {redemptions > 0 && (
                        <>
                          <Lock className="w-3 h-3" />
                          <span className="font-medium">{redemptions}x eingelöst <span className="text-orange-400">(+{(redemptions * tier.difficultyMultiplier * 100).toFixed(0)}% schwieriger)</span></span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Action Button - PREMIUM STYLE */}
                <motion.button
                  onClick={() => handleClaimDiscount(tier.tier)}
                  disabled={!progress.canClaim || hasAvailable || claimingTier === tier.tier}
                  whileHover={progress.canClaim && !hasAvailable ? { scale: 1.02 } : {}}
                  whileTap={progress.canClaim && !hasAvailable ? { scale: 0.98 } : {}}
                  className={cn(
                    "relative z-10 mt-5 w-full py-4 rounded-xl font-bold text-base transition-all duration-300 overflow-hidden",
                    progress.canClaim && !hasAvailable
                      ? cn(colors.iconBg, "text-white shadow-lg hover:shadow-xl")
                      : hasAvailable
                      ? "bg-green-500/20 border-2 border-green-400/40 text-green-300 cursor-not-allowed"
                      : "bg-white/5 text-white/40 cursor-not-allowed border-2 border-white/10"
                  )}
                >
                  {/* Shine effect on hover for claimable buttons */}
                  {progress.canClaim && !hasAvailable && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      whileHover={{
                        x: '100%',
                        transition: { duration: 0.6 }
                      }}
                    />
                  )}

                  {claimingTier === tier.tier ? (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Zap className="w-5 h-5" />
                      </motion.div>
                      Wird gesichert...
                    </span>
                  ) : hasAvailable ? (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Bereits verfügbar im Checkout!
                    </span>
                  ) : progress.canClaim ? (
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Rabatt sichern ({formatCoins(requiredCoins)} Coins)
                    </span>
                  ) : (
                    <span className="relative z-10">
                      Noch {formatCoins(progress.missing)} Coins benötigt
                    </span>
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Usage History - PREMIUM STYLE */}
      {usedDiscounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <motion.h3 
              className="text-xl font-bold flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Award className="w-6 h-6 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Verwendete Rabatte
              </span>
            </motion.h3>
            <div className="text-sm text-white/60 font-medium">
              Letzte {Math.min(5, usedDiscounts.length)} Rabatte
            </div>
          </div>
          <div className="space-y-3">
            {usedDiscounts.slice(-5).reverse().map((discount, index) => {
              const tierConfig = DISCOUNT_TIERS.find(t => t.tier === discount.tier);
              if (!tierConfig) return null;

              return (
                <motion.div
                  key={discount.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  className="relative overflow-hidden flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-pink-500/5 rounded-xl p-4 border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-all duration-300"
                >
                  {/* Subtle animated background */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                      delay: index * 0.3
                    }}
                  />

                  <div className="relative z-10 flex items-center gap-4">
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-2xl shadow-lg"
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      {tierConfig.icon}
                    </motion.div>
                    <div>
                      <div className="font-bold text-white">{tierConfig.tier} Rabatt</div>
                      <div className="text-xs text-white/60 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(discount.usedAt || 0).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 text-right">
                    <motion.div 
                      className="text-green-400 font-bold text-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20, delay: index * 0.1 + 0.2 }}
                    >
                      -€{(discount.savings || 0).toFixed(2)}
                    </motion.div>
                    <div className="text-xs text-white/50">
                      bei €{(discount.orderValue || 0).toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Total Savings Summary */}
          <motion.div 
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-white">Gesamt gespart</span>
              </div>
              <motion.div 
                className="text-2xl font-bold text-green-400"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                €{totalSavings.toFixed(2)}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// Default export for better compatibility with dynamic imports
export default GamingDiscountPanel;

