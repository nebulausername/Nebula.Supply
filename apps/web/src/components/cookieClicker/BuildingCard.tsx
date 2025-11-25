import { memo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCookieClickerStore, BUILDINGS } from '../../store/cookieClicker';
import { formatNumber } from '../../utils/cookieFormatters';
import { cn } from '../../utils/cn';
import { ArrowRight } from 'lucide-react';

// 🏗️ BUILDING CARD - MAXIMIERT & GEIL MIT PREMIUM ANIMATIONEN!
export const BuildingCard = memo(({ building, owned, cost, canAfford }: {
  building: typeof BUILDINGS[0];
  owned: number;
  cost: number;
  canAfford: boolean;
}) => {
  const buyBuilding = useCookieClickerStore(state => state.buyBuilding);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const [ownedCount, setOwnedCount] = useState(owned);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Count-Up Animation für owned count
  useEffect(() => {
    if (owned !== ownedCount) {
      const diff = owned - ownedCount;
      const duration = 500;
      const steps = Math.min(20, Math.abs(diff));
      const increment = diff / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setOwnedCount(prev => {
          const newVal = prev + increment;
          if (currentStep >= steps) return owned;
          return Math.round(newVal);
        });
        if (currentStep >= steps) {
          clearInterval(timer);
          setOwnedCount(owned);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [owned, ownedCount]);
  
  const handlePurchase = (e: React.MouseEvent) => {
    if (canAfford && !isClicked) {
      setIsClicked(true);
      
      // Ripple Effect Position
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setRipplePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
        
        setTimeout(() => setRipplePosition(null), 600);
      }
      
      buyBuilding(building.id);
      
      setTimeout(() => setIsClicked(false), 200);
    }
  };
  
  // Price tier für Farbverlauf
  const getPriceTier = (price: number) => {
    if (price < 1000) return 'low';
    if (price < 100000) return 'medium';
    if (price < 10000000) return 'high';
    return 'epic';
  };
  
  const priceTier = getPriceTier(cost);
  const tierColors = {
    low: 'from-green-500 to-emerald-500',
    medium: 'from-blue-500 to-cyan-500',
    high: 'from-purple-500 to-pink-500',
    epic: 'from-yellow-500 to-orange-500'
  };
  
  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-3 md:p-4 transition-all duration-300",
        canAfford 
          ? `${tierColors[priceTier]}/40 border-${priceTier === 'low' ? 'emerald' : priceTier === 'medium' ? 'blue' : priceTier === 'high' ? 'purple' : 'yellow'}-500/40 bg-gradient-to-br ${tierColors[priceTier]}/5 hover:${tierColors[priceTier]}/10 cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.4)]` 
          : "border-white/10 bg-white/5 cursor-not-allowed opacity-60 blur-[0.5px]"
      )}
      whileHover={canAfford ? { scale: 1.02, y: -2 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handlePurchase}
      animate={canAfford && !isHovered ? {
        boxShadow: [
          "0_0_20px_rgba(16,185,129,0.3)",
          "0_0_30px_rgba(16,185,129,0.5)",
          "0_0_20px_rgba(16,185,129,0.3)"
        ]
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Pulse Glow bei Kaufmöglichkeit */}
      {canAfford && (
        <motion.div
          className={cn("absolute inset-0 rounded-xl", `bg-gradient-to-br ${tierColors[priceTier]}/20`)}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Ripple Effect on Click */}
      {ripplePosition && (
        <motion.div
          className="absolute rounded-full bg-white/40 pointer-events-none"
          style={{
            left: ripplePosition.x,
            top: ripplePosition.y,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: 400, height: 400, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      {/* Animated Background on Hover */}
      {canAfford && isHovered && (
        <motion.div
          className={cn("absolute inset-0 bg-gradient-to-br", tierColors[priceTier] + "/20")}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <motion.div
              className="text-2xl md:text-3xl flex-shrink-0"
              animate={canAfford && isHovered ? {
                rotate: [0, -10, 10, -5, 5, 0],
                scale: [1, 1.2, 1.1, 1.15, 1]
              } : canAfford ? {
                rotate: [0, 2, -2, 0],
                scale: [1, 1.05, 1]
              } : {}}
              transition={{ duration: canAfford && isHovered ? 0.8 : 3, repeat: canAfford ? Infinity : 0 }}
            >
              {building.icon}
            </motion.div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-text text-base md:text-lg truncate">{building.name}</h3>
              <p className="text-xs text-muted line-clamp-1">{building.description}</p>
            </div>
          </div>
          <motion.div 
            className="text-right flex-shrink-0 ml-2"
            animate={owned !== ownedCount ? {
              scale: [1, 1.2, 1]
            } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="text-lg md:text-xl font-bold text-accent">{ownedCount}</div>
            <div className="text-xs text-muted">besessen</div>
          </motion.div>
        </div>
        
        {/* CPS Preview */}
        {isHovered && canAfford && (
          <motion.div
            className={cn("mb-2 p-2 rounded-lg border", `bg-gradient-to-r ${tierColors[priceTier]}/10 border-${priceTier === 'low' ? 'emerald' : priceTier === 'medium' ? 'blue' : priceTier === 'high' ? 'purple' : 'yellow'}-500/30`)}
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="text-xs text-white/70 mb-1">Wenn gekauft:</div>
            <div className="text-sm font-bold text-emerald-400">
              +{formatNumber(building.baseCps)} Cookies/Sek
            </div>
          </motion.div>
        )}
        
        {/* Cost & Buy Button - Compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-2 border-t border-white/10">
          <div className="min-w-0">
            <motion.div 
              className="text-base md:text-lg font-bold text-accent"
              animate={canAfford ? {
                scale: [1, 1.05, 1]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {formatNumber(cost)}
            </motion.div>
            <div className="text-xs text-white/50">Cookies</div>
          </div>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handlePurchase(e);
            }}
            disabled={!canAfford}
            className={cn(
              "w-full sm:w-auto px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1 md:gap-2 relative overflow-hidden",
              canAfford
                ? `bg-gradient-to-r ${tierColors[priceTier]} text-white shadow-lg shadow-${priceTier === 'low' ? 'emerald' : priceTier === 'medium' ? 'blue' : priceTier === 'high' ? 'purple' : 'yellow'}-500/50`
                : "bg-white/10 text-white/40 cursor-not-allowed"
            )}
            whileHover={canAfford ? { scale: 1.08, boxShadow: "0_0_20px_rgba(16,185,129,0.6)" } : {}}
            whileTap={canAfford ? { scale: 0.92 } : {}}
          >
            {canAfford && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
            <span className="relative z-10">Kaufen</span>
            {canAfford && (
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="relative z-10"
              >
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

BuildingCard.displayName = 'BuildingCard';

