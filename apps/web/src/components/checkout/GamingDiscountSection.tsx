import { motion } from 'framer-motion';
import { Cookie, Lock, Zap, Check, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGamingDiscountStore, DISCOUNT_TIERS, formatCookies } from '../../store/gamingDiscounts';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { cn } from '../../utils/cn';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

interface GamingDiscountSectionProps {
  subtotal: number;
  onDiscountSelect?: (discountId: string | null) => void;
  selectedDiscountId?: string | null;
}

export const GamingDiscountSection = ({
  subtotal,
  onDiscountSelect,
  selectedDiscountId
}: GamingDiscountSectionProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const navigate = useNavigate();
  
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const availableDiscounts = useGamingDiscountStore(state => state.availableDiscounts);
  const getProgressToNextDiscount = useGamingDiscountStore(state => state.getProgressToNextDiscount);
  const setActiveDiscount = useGamingDiscountStore(state => state.setActiveDiscount);

  const handleSelectDiscount = (discountId: string | null) => {
    triggerHaptic('light');
    setActiveDiscount(discountId);
    onDiscountSelect?.(discountId);
  };

  const handleGoToCookieClicker = () => {
    triggerHaptic('medium');
    navigate('/cookie-clicker');
  };

  const selectedDiscount = selectedDiscountId 
    ? availableDiscounts.find(d => d.id === selectedDiscountId) || null
    : null;

  // Berechne Savings
  const savings = selectedDiscount 
    ? Math.floor(subtotal * (selectedDiscount.discountPercent / 100))
    : 0;

  // Finde nächsten verfügbaren Rabatt
  const nextTier = DISCOUNT_TIERS.find(tier => {
    const progress = getProgressToNextDiscount(tier.tier);
    return !progress.canClaim && progress.percentage > 0;
  });

  return (
    <div className="rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-yellow-500/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cookie className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Gaming-Rabatte</h3>
        </div>
        <div className="px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-full text-xs font-semibold text-orange-500">
          {availableDiscounts.length} verfügbar
        </div>
      </div>

      {availableDiscounts.length > 0 ? (
        <>
          <p className="text-sm text-muted mb-4">
            Löse deine erspielten Gaming-Rabatte ein!
          </p>

          <div className="space-y-2 mb-4">
            {availableDiscounts.map((discount) => {
              const tierConfig = DISCOUNT_TIERS.find(t => t.tier === discount.tier);
              if (!tierConfig) return null;

              const isSelected = selectedDiscountId === discount.id;
              const potentialSavings = Math.floor(subtotal * (discount.discountPercent / 100));

              return (
                <motion.button
                  key={discount.id}
                  onClick={() => handleSelectDiscount(isSelected ? null : discount.id)}
                  className={cn(
                    "w-full rounded-lg border p-4 transition-all duration-200 text-left",
                    isSelected
                      ? `bg-gradient-to-r ${tierConfig.color}/20 border-${tierConfig.color.split('-')[1]}-500/50 shadow-lg`
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{tierConfig.icon}</span>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {tierConfig.tier} Gaming-Rabatt
                          {isSelected && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          Ersparnis: €{potentialSavings.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-semibold text-orange-500">
                        -{discount.discountPercent}%
                      </div>
                      <div className="text-[10px] text-muted">
                        Einmalig
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-white/10"
                    >
                      <div className="flex items-center gap-2 text-xs text-yellow-500">
                        <Zap className="w-3 h-3" />
                        <span>Dieser Rabatt wird nach der Bestellung entfernt</span>
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {selectedDiscount && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Ersparnis mit Gaming-Rabatt:</span>
                <span className="font-bold text-green-500">-€{savings.toFixed(2)}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-muted mb-4">
            Verdiene Gaming-Rabatte durch Cookie Clicker!
          </p>

          {nextTier && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-muted">Nächster Rabatt:</span>
                <span className="font-semibold">{nextTier.icon} {nextTier.tier}</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full bg-gradient-to-r", nextTier.color)}
                  style={{ width: `${Math.min(100, getProgressToNextDiscount(nextTier.tier).percentage)}%` }}
                />
              </div>
              <div className="text-xs text-muted mt-2">
                {formatCookies(getProgressToNextDiscount(nextTier.tier).missing)} Cookies fehlen noch
              </div>
            </div>
          )}

          <button
            onClick={handleGoToCookieClicker}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 hover:brightness-110 font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Cookie className="w-4 h-4" />
            Jetzt zocken!
          </button>
        </>
      )}

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-start gap-2 text-xs text-muted">
          <Award className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-text mb-1">Wie funktioniert's?</p>
            <ul className="space-y-1">
              <li>• Sammle Cookies im Cookie Clicker</li>
              <li>• Löse Rabatte ein (wird schwieriger beim nächsten Mal)</li>
              <li>• Verwende sie einmalig bei deiner Bestellung</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};



