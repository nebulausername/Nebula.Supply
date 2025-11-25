import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X } from "lucide-react";
import { useAchievementStore } from "../../store/achievementStore";
import { cn } from "../../utils/cn";

interface AchievementPopupProps {
  achievementId: string | null;
  onClose: () => void;
}

export const AchievementPopup = ({ achievementId, onClose }: AchievementPopupProps) => {
  const achievement = useAchievementStore(state =>
    achievementId ? state.getAchievementById(achievementId) : null
  );

  useEffect(() => {
    if (achievementId) {
      // Auto-close nach 5 Sekunden
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievementId, onClose]);

  if (!achievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 right-4 z-50 w-80"
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="relative overflow-hidden rounded-xl border-2 border-yellow-400 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-orange-400/5 animate-pulse" />

          {/* Content */}
          <div className="relative p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl">
                <Trophy className="h-6 w-6 text-black" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Achievement freigeschaltet!</h3>
                <p className="text-sm text-yellow-200">Neuer Meilenstein erreicht</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Achievement Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-lg">
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{achievement.name}</h4>
                  <p className="text-sm text-slate-300">{achievement.description}</p>
                </div>
              </div>

              {/* Progress Bar (if not fully unlocked) */}
              {!achievement.unlocked && achievement.currentProgress !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Fortschritt</span>
                    <span>
                      {achievement.currentProgress.toLocaleString()} / {achievement.requirement.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min((achievement.currentProgress / achievement.requirement) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Category Badge */}
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  achievement.category === 'building' && "bg-blue-500/20 text-blue-400",
                  achievement.category === 'milestone' && "bg-green-500/20 text-green-400",
                  achievement.category === 'special' && "bg-purple-500/20 text-purple-400"
                )}>
                  {achievement.category === 'building' ? 'Gebäude' :
                   achievement.category === 'milestone' ? 'Meilenstein' : 'Spezial'}
                </span>

                {achievement.unlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-yellow-400"
                  >
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-semibold">Freigeschaltet!</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-400 rounded-full animate-pulse" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
