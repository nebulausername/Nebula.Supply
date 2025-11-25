import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Diamond, Clock, TrendingUp, Target, CheckCircle, Lock } from 'lucide-react';
import { useCookieClickerStore, Achievement, ACHIEVEMENTS } from '../../store/cookieClicker';

// Import MILESTONE_RARITY_CONFIG from AchievementSystem
const MILESTONE_RARITY_CONFIG = {
  common: {
    label: 'Gewöhnlich',
    gradient: 'from-gray-500/40 via-gray-400/30 to-gray-500/40',
    borderColor: 'border-gray-400/50',
    textColor: 'text-gray-200',
    iconColor: 'text-gray-300',
    glowColor: 'rgba(156, 163, 175, 0.5)',
    bgColor: 'bg-gray-500/10',
    shadow: 'shadow-[0_0_30px_rgba(156,163,175,0.4)]'
  },
  uncommon: {
    label: 'Ungewöhnlich',
    gradient: 'from-green-500/40 via-emerald-400/30 to-green-500/40',
    borderColor: 'border-green-400/50',
    textColor: 'text-green-200',
    iconColor: 'text-green-300',
    glowColor: 'rgba(34, 197, 94, 0.6)',
    bgColor: 'bg-green-500/10',
    shadow: 'shadow-[0_0_35px_rgba(34,197,94,0.5)]'
  },
  rare: {
    label: 'Selten',
    gradient: 'from-blue-500/40 via-cyan-400/30 to-blue-500/40',
    borderColor: 'border-blue-400/50',
    textColor: 'text-blue-200',
    iconColor: 'text-blue-300',
    glowColor: 'rgba(59, 130, 246, 0.7)',
    bgColor: 'bg-blue-500/10',
    shadow: 'shadow-[0_0_40px_rgba(59,130,246,0.6)]'
  },
  epic: {
    label: 'Episch',
    gradient: 'from-purple-500/40 via-pink-400/30 to-purple-500/40',
    borderColor: 'border-purple-400/50',
    textColor: 'text-purple-200',
    iconColor: 'text-purple-300',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    bgColor: 'bg-purple-500/10',
    shadow: 'shadow-[0_0_50px_rgba(168,85,247,0.7)]'
  },
  legendary: {
    label: 'Legendär',
    gradient: 'from-orange-500/40 via-yellow-400/30 to-orange-500/40',
    borderColor: 'border-orange-400/50',
    textColor: 'text-orange-200',
    iconColor: 'text-orange-300',
    glowColor: 'rgba(251, 146, 60, 0.9)',
    bgColor: 'bg-orange-500/10',
    shadow: 'shadow-[0_0_60px_rgba(251,146,60,0.8)]'
  },
  nebula: {
    label: 'Nebula',
    gradient: 'from-indigo-500/40 via-purple-500/30 via-pink-500/30 to-rose-500/40',
    borderColor: 'border-indigo-400/60',
    textColor: 'text-indigo-200',
    iconColor: 'text-indigo-300',
    glowColor: 'rgba(99, 102, 241, 1.0)',
    bgColor: 'bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20',
    shadow: 'shadow-[0_0_80px_rgba(99,102,241,0.9),0_0_120px_rgba(168,85,247,0.6)]'
  }
} as const;
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/cookieFormatters';
import { ProgressRing } from './ProgressRing';

interface AchievementDetailModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  isUnlocked: boolean;
}

// 🏆 Achievement Detail Modal
export const AchievementDetailModal = memo(({
  achievement,
  isOpen,
  onClose,
  progress,
  isUnlocked
}: AchievementDetailModalProps) => {
  if (!achievement) return null;

  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const progressPercentage = Math.min(100, (progress / achievement.requirement) * 100);
  const remaining = Math.max(0, achievement.requirement - progress);
  const rarity = achievement.rarity;
  const config = MILESTONE_RARITY_CONFIG[rarity];

  // Calculate ETA
  const calculateETA = () => {
    if (isUnlocked || cookiesPerSecond === 0) return null;
    if (achievement.id.includes('cookie') || achievement.id.includes('cookies')) {
      const seconds = remaining / cookiesPerSecond;
      if (seconds > 86400) return `${Math.floor(seconds / 86400)} Tage`;
      if (seconds > 3600) return `${Math.floor(seconds / 3600)} Stunden`;
      if (seconds > 60) return `${Math.floor(seconds / 60)} Minuten`;
      return `${Math.floor(seconds)} Sekunden`;
    }
    return null;
  };

  const eta = calculateETA();

  // Find similar achievements
  const similarAchievements = ACHIEVEMENTS.filter(a => 
    a.rarity === rarity && a.id !== achievement.id
  ).slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={cn(
              "fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
              "md:max-w-2xl w-full max-h-[90vh] overflow-y-auto",
              "rounded-3xl border-2 backdrop-blur-xl z-50",
              config.borderColor,
              config.bgColor
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-6 md:p-8">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <motion.div
                  className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center text-5xl backdrop-blur-md border-2",
                    config.borderColor,
                    config.bgColor
                  )}
                  animate={isUnlocked ? {
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {achievement.icon}
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className={cn("text-2xl font-bold", config.textColor)}>
                      {achievement.name}
                    </h2>
                    {isUnlocked ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Lock className="w-6 h-6 text-white/40" />
                    )}
                  </div>
                  <p className="text-white/70 mb-3">{achievement.description}</p>
                  <div className={cn(
                    "inline-block px-3 py-1 rounded-lg text-xs font-bold",
                    config.bgColor,
                    config.textColor,
                    config.borderColor,
                    "border"
                  )}>
                    {config.label}
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Fortschritt
                  </h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {Math.round(progressPercentage)}%
                    </div>
                    <div className="text-xs text-white/60">
                      {formatNumber(Math.round(progress))} / {formatNumber(achievement.requirement)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <ProgressRing
                    progress={progressPercentage}
                    size={100}
                    strokeWidth={8}
                    color={config.glowColor}
                    animated={true}
                    showLabel={true}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", config.bgColor)}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    {!isUnlocked && remaining > 0 && (
                      <div className="text-sm text-white/60">
                        Noch {formatNumber(remaining)} benötigt
                        {eta && (
                          <span className="ml-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{eta}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reward Section */}
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <Diamond className="w-6 h-6 text-yellow-400" />
                  <div>
                    <div className="text-sm text-white/70">Belohnung</div>
                    <div className="text-xl font-bold text-yellow-400">
                      {formatNumber(achievement.reward)} Coins
                    </div>
                  </div>
                </div>
              </div>

              {/* Similar Achievements */}
              {similarAchievements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Ähnliche Achievements
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {similarAchievements.map((similar) => (
                      <div
                        key={similar.id}
                        className={cn(
                          "p-3 rounded-xl border text-center",
                          config.bgColor,
                          config.borderColor
                        )}
                      >
                        <div className="text-2xl mb-1">{similar.icon}</div>
                        <div className="text-xs text-white/70 line-clamp-2">
                          {similar.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/60 mb-1">Anforderung</div>
                  <div className="text-lg font-bold text-white">
                    {formatNumber(achievement.requirement)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-xs text-white/60 mb-1">Status</div>
                  <div className={cn(
                    "text-lg font-bold",
                    isUnlocked ? "text-green-400" : "text-white/60"
                  )}>
                    {isUnlocked ? 'Erreicht' : 'Gesperrt'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

AchievementDetailModal.displayName = 'AchievementDetailModal';

