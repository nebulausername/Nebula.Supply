import { useEffect, useState } from "react";
import { useVipStore } from "../../store/vip";
import type { VipTier } from "../../types/vip";

interface VipStatusCardProps {
  currentTier: VipTier;
  progressToNext: number;
  nextTierRequirements: {
    invitesNeeded: number;
    purchasesNeeded: number;
    communityPoints: number;
  };
  vipScore: number;
  rankBenefits: string[];
}

const tierColors: Record<VipTier, { bg: string; border: string; glow: string }> = {
  Comet: {
    bg: "from-blue-900/20 to-cyan-900/20",
    border: "border-blue-400/30",
    glow: "shadow-blue-500/20"
  },
  Nova: {
    bg: "from-purple-900/20 to-pink-900/20",
    border: "border-purple-400/30",
    glow: "shadow-purple-500/20"
  },
  Supernova: {
    bg: "from-orange-900/20 to-red-900/20",
    border: "border-orange-400/30",
    glow: "shadow-orange-500/20"
  },
  Galaxy: {
    bg: "from-yellow-900/20 to-amber-900/20",
    border: "border-yellow-400/30",
    glow: "shadow-yellow-500/20"
  }
};

const tierIcons: Record<VipTier, string> = {
  Comet: "🌟",
  Nova: "💫",
  Supernova: "✨",
  Galaxy: "🌌"
};

export const VipStatusCard = ({
  currentTier,
  progressToNext,
  nextTierRequirements,
  vipScore,
  rankBenefits
}: VipStatusCardProps) => {
  const { tierProgress, updateVipScore } = useVipStore();
  const [isAnimating, setIsAnimating] = useState(false);

  const colors = tierColors[currentTier];
  const nextTier = currentTier === 'Galaxy' ? 'Galaxy' : (
    currentTier === 'Comet' ? 'Nova' :
    currentTier === 'Nova' ? 'Supernova' : 'Galaxy'
  );

  // Animation trigger when component mounts or tier changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [currentTier]);

  const handleScoreIncrease = () => {
    // Demo: simulate score increase
    updateVipScore(vipScore + 100);
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 ${colors.border} ${colors.bg}
      bg-gradient-to-br p-4 sm:p-6 md:p-8 backdrop-blur-xl transition-all duration-500
      ${isAnimating ? `scale-105 ${colors.glow}` : 'scale-100'}
      hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10
    `}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl" />
        <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-lg" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="text-3xl sm:text-4xl animate-pulse">{tierIcons[currentTier]}</div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight">
              {currentTier} VIP
            </h2>
            <p className="text-purple-300 text-xs sm:text-sm">
              Status seit {new Date().toLocaleDateString('de-DE')}
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="text-xl sm:text-2xl font-bold text-white">
            {vipScore.toLocaleString('de-DE')}
          </div>
          <div className="text-purple-300 text-xs sm:text-sm">VIP Points</div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="relative z-10 mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-semibold text-sm sm:text-base">
            Fortschritt zu {nextTier}
          </span>
          <span className="text-purple-300 text-xs sm:text-sm">
            {Math.round(progressToNext * 100)}%
          </span>
        </div>

        <div className="w-full bg-black/30 rounded-full h-2.5 sm:h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressToNext * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4 text-center">
          <div className="text-xs">
            <div className="text-purple-300 text-[10px] sm:text-xs">Invites</div>
            <div className="text-white font-semibold text-sm sm:text-base">
              {nextTierRequirements.invitesNeeded}
            </div>
          </div>
          <div className="text-xs">
            <div className="text-purple-300 text-[10px] sm:text-xs">Käufe</div>
            <div className="text-white font-semibold text-sm sm:text-base">
              {nextTierRequirements.purchasesNeeded}
            </div>
          </div>
          <div className="text-xs">
            <div className="text-purple-300 text-[10px] sm:text-xs">Punkte</div>
            <div className="text-white font-semibold text-sm sm:text-base">
              {nextTierRequirements.communityPoints}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="relative z-10">
        <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Deine VIP-Vorteile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {rankBenefits.map((benefit, index) => (
            <div key={index} className="flex items-start sm:items-center space-x-2 text-xs sm:text-sm">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full flex-shrink-0 mt-1.5 sm:mt-0" />
              <span className="text-purple-200 leading-relaxed">{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Demo button for score increase */}
      <div className="relative z-10 mt-4 sm:mt-6">
        <button
          onClick={handleScoreIncrease}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-semibold py-3 px-4 sm:px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-purple-500/25 min-h-[44px] touch-target text-sm sm:text-base"
        >
          +100 VIP Points (Demo)
        </button>
      </div>

      {/* Floating particles animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/40 rounded-full animate-pulse"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 2) * 70}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.5}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};




