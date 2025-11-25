import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, ChevronDown, ChevronUp, Gamepad2, Zap, Award, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGamingDiscountStore, DISCOUNT_TIERS, formatCookies } from '../../store/gamingDiscounts';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { cn } from '../../utils/cn';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { CookieClickerConfirmationModal } from '../cookieClicker/CookieClickerConfirmationModal';

interface GamingRabattCTAProps {
  onDiscountSelect?: (discountId: string | null) => void;
  selectedDiscountId?: string | null;
  subtotal: number;
}

export const GamingRabattCTA = ({
  onDiscountSelect,
  selectedDiscountId,
  subtotal
}: GamingRabattCTAProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const availableDiscounts = useGamingDiscountStore(state => state.availableDiscounts);
  const getProgressToNextDiscount = useGamingDiscountStore(state => state.getProgressToNextDiscount);
  const setActiveDiscount = useGamingDiscountStore(state => state.setActiveDiscount);

  const hasAvailableDiscounts = availableDiscounts.length > 0;

  // Finde nächsten erreichbaren Tier
  const nextTier = DISCOUNT_TIERS.find(tier => {
    const progress = getProgressToNextDiscount(tier.tier);
    return !progress.canClaim && progress.percentage > 0;
  }) || DISCOUNT_TIERS[0];

  const nextProgress = getProgressToNextDiscount(nextTier.tier);

  const handleToggle = () => {
    triggerHaptic('light');
    setIsExpanded(!isExpanded);
  };

  const handleSelectDiscount = (discountId: string | null) => {
    triggerHaptic('medium');
    setActiveDiscount(discountId);
    onDiscountSelect?.(discountId);
  };

  const handleGoToGame = () => {
    setShowConfirmationModal(true);
  };

  return (
    <>
      {/* Confirmation Modal */}
      <CookieClickerConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={() => {
          setShowConfirmationModal(false);
          navigate('/cookie-clicker');
        }}
      />

      {/* Main Section */}
      <div className="rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 overflow-hidden">
        {/* Header - Klickbar */}
        <button
          onClick={handleToggle}
          className="w-full p-4 flex items-center justify-between hover:bg-orange-500/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isExpanded ? 0 : [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: isExpanded ? 0 : Infinity, repeatDelay: 2 }}
            >
              <Cookie className="w-6 h-6 text-orange-500" />
            </motion.div>
            <div className="text-left">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                Zocken gegen Rabatt? 🎮
                {hasAvailableDiscounts && (
                  <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-500">
                    {availableDiscounts.length} verfügbar
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted">
                {hasAvailableDiscounts 
                  ? "Du hast Gaming-Rabatte verfügbar!"
                  : `Noch ${formatCookies(nextProgress.missing)} Cookies bis zum nächsten Rabatt`
                }
              </p>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="w-5 h-5 text-muted group-hover:text-text transition-colors" />
          </motion.div>
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4 border-t border-orange-500/20">
                {/* Verfügbare Rabatte */}
                {hasAvailableDiscounts ? (
                  <div className="pt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-text">
                      <Award className="w-4 h-4 text-green-500" />
                      Verfügbare Gaming-Rabatte:
                    </div>
                    
                    {availableDiscounts.map(discount => {
                      const tierConfig = DISCOUNT_TIERS.find(t => t.tier === discount.tier);
                      if (!tierConfig) return null;

                      const isSelected = selectedDiscountId === discount.id;
                      const savings = Math.floor(subtotal * (discount.discountPercent / 100));

                      return (
                        <motion.button
                          key={discount.id}
                          onClick={() => handleSelectDiscount(isSelected ? null : discount.id)}
                          className={cn(
                            "w-full rounded-lg border p-3 transition-all duration-200 text-left",
                            isSelected
                              ? `bg-gradient-to-r ${tierConfig.color}/20 border-green-500/50 shadow-lg shadow-green-500/20`
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-orange-500/30"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{tierConfig.icon}</span>
                              <div>
                                <div className="font-semibold text-text flex items-center gap-2">
                                  {tierConfig.tier} Gaming-Rabatt
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                                    >
                                      <Zap className="w-3 h-3 text-white" />
                                    </motion.div>
                                  )}
                                </div>
                                <div className="text-xs text-muted">
                                  Ersparnis: €{savings.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-orange-500">
                                -{discount.discountPercent}%
                              </div>
                              <div className="text-[10px] text-muted">
                                Einmalig
                              </div>
                            </div>
                          </div>

                          {/* Warning wenn selected */}
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 pt-2 border-t border-white/10"
                            >
                              <div className="flex items-center gap-2 text-xs text-yellow-500">
                                <Zap className="w-3 h-3" />
                                <span>Wird nach dieser Bestellung entfernt</span>
                              </div>
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}

                    {/* Info */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2 text-xs">
                        <Award className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="text-muted">
                          <span className="font-medium text-green-500">Gaming-Rabatte</span> werden durch Cookie Clicker erspielt und sind einmalig verwendbar. Nach Verwendung wird der nächste Rabatt schwieriger zu erspielen.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Keine Rabatte → CTA zum Zocken */
                  <div className="pt-4 space-y-3">
                    {/* Progress zum nächsten Rabatt */}
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-muted">Nächster Rabatt:</span>
                        <span className="font-semibold flex items-center gap-1">
                          <span className="text-xl">{nextTier.icon}</span>
                          {nextTier.tier}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
                        <div 
                          className={cn("h-full bg-gradient-to-r transition-all duration-500", nextTier.color)}
                          style={{ width: `${Math.min(100, nextProgress.percentage)}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{formatCookies(nextProgress.currentCookies)} / {formatCookies(nextProgress.requiredCookies)}</span>
                        <span className="text-orange-500">{nextProgress.percentage.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={handleGoToGame}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 hover:brightness-110 font-semibold transition-all shadow-lg flex items-center justify-center gap-2 group"
                    >
                      <Gamepad2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Jetzt zocken & Rabatt verdienen!</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Info */}
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2 text-xs">
                        <Cookie className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div className="text-muted">
                          <span className="font-medium text-orange-500">Spiele Cookie Clicker</span> um echte Rabatte zu verdienen! Sammle Cookies, kaufe Upgrades und schalte Rabatte von 5% bis 20% frei.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};




