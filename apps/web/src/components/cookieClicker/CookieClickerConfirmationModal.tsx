import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, Gamepad2, TrendingUp, Award, Zap } from 'lucide-react';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { useGamingDiscountStore, DISCOUNT_TIERS, formatCookies } from '../../store/gamingDiscounts';
import { cn } from '../../utils/cn';
import { useMobileOptimizations } from '../MobileOptimizations';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { trackEvent } from '../../utils/analytics';

interface CookieClickerConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CookieClickerConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm
}: CookieClickerConfirmationModalProps) => {
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const [cookieRotation, setCookieRotation] = useState(0);
  
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const getProgressToNextDiscount = useGamingDiscountStore(state => state.getProgressToNextDiscount);
  const hasAvailableDiscounts = useGamingDiscountStore(state => state.hasAvailableDiscounts());
  const availableDiscounts = useGamingDiscountStore(state => state.availableDiscounts);

  // Animiere Cookie Rotation
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCookieRotation(prev => (prev + 2) % 360);
    }, 50);
    
    return () => clearInterval(interval);
  }, [isOpen]);

  // Track Modal Open
  useEffect(() => {
    if (isOpen) {
      trackEvent('gaming_discount_modal_opened', {
        total_cookies: totalCookies,
        has_available: hasAvailableDiscounts
      });
    }
  }, [isOpen, totalCookies, hasAvailableDiscounts]);

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  const handleConfirm = () => {
    triggerHaptic('medium');
    onConfirm();
  };

  // Berechne Progress für alle Tiers
  const allProgress = DISCOUNT_TIERS.map(tier => ({
    tier: tier.tier,
    config: tier,
    progress: getProgressToNextDiscount(tier.tier)
  }));

  // Finde nächsten erreichbaren Tier
  const nextTier = allProgress.find(p => !p.progress.canClaim && p.progress.percentage > 0) || allProgress[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className={cn(
            "relative w-full max-w-lg bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden",
            isMobile && "max-h-[90vh] overflow-y-auto"
          )}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-b border-white/10 p-6">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: cookieRotation }}
                className="flex-shrink-0"
              >
                <Cookie className="w-12 h-12 text-orange-500" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold gradient-text">Zocken gegen Rabatte</h2>
                <p className="text-sm text-muted mt-1">Verdiene echte Shop-Rabatte durch Cookie Clicker!</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Wie funktioniert's */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-cyan-500" />
                Wie funktioniert's?
              </h3>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Klicke Cookies und kaufe Upgrades & Gebäude</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Sammle genug Cookies um Rabatte freizuschalten</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>Löse Rabatte im Checkout ein (einmalig verwendbar)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span className="text-yellow-500 font-medium">Jeder weitere Rabatt wird schwieriger zu erspielen!</span>
                </li>
              </ul>
            </div>

            {/* Dein Fortschritt */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Dein Fortschritt
              </h3>
              
              <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-4 border border-orange-500/20 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted">Total Cookies</span>
                  <span className="text-lg font-bold text-orange-500">{formatCookies(totalCookies)}</span>
                </div>
                
                {/* Nächster Rabatt Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <span className="text-xl">{nextTier.config.icon}</span>
                      {nextTier.config.tier} Rabatt
                    </span>
                    <span className="text-sm text-muted">
                      {formatCookies(nextTier.progress.currentCookies)} / {formatCookies(nextTier.progress.requiredCookies)}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${nextTier.progress.percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        nextTier.config.color
                      )}
                    />
                  </div>
                  
                  <p className="text-xs text-muted mt-2">
                    {nextTier.progress.canClaim ? (
                      <span className="text-green-500 font-medium">✓ Bereit zum Einlösen!</span>
                    ) : (
                      <>Noch {formatCookies(nextTier.progress.missing)} Cookies bis {nextTier.config.tier} Rabatt</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Verfügbare Rabatte */}
            {hasAvailableDiscounts && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Verfügbare Rabatte
                </h3>
                <div className="space-y-2">
                  {availableDiscounts.map(discount => {
                    const tierConfig = DISCOUNT_TIERS.find(t => t.tier === discount.tier);
                    if (!tierConfig) return null;
                    
                    return (
                      <motion.div
                        key={discount.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{tierConfig.icon}</span>
                          <div>
                            <div className="font-semibold text-text">{tierConfig.tier} Rabatt</div>
                            <div className="text-xs text-green-500">Bereit zum Einlösen!</div>
                          </div>
                        </div>
                        <Zap className="w-5 h-5 text-green-500" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alle Rabatt-Tiers */}
            <div>
              <h3 className="text-sm font-semibold text-muted mb-2">Alle Rabatt-Stufen:</h3>
              <div className="grid grid-cols-2 gap-2">
                {DISCOUNT_TIERS.map(tier => {
                  const progress = getProgressToNextDiscount(tier.tier);
                  return (
                    <div
                      key={tier.tier}
                      className={cn(
                        "p-2 rounded-lg border text-center",
                        progress.canClaim
                          ? "bg-green-500/10 border-green-500/30"
                          : progress.percentage > 0
                          ? "bg-white/5 border-white/10"
                          : "bg-black/20 border-white/5 opacity-50"
                      )}
                    >
                      <div className="text-lg mb-1">{tier.icon}</div>
                      <div className="text-xs font-medium">{tier.tier}</div>
                      <div className="text-[10px] text-muted mt-1">
                        {formatCookies(progress.requiredCookies)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 hover:brightness-110 font-semibold transition-all shadow-lg shadow-orange-500/25"
            >
              Jetzt zocken! 🎮
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};



