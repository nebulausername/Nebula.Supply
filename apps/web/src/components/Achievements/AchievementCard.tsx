import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle, Lock, Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";
import { useEffect, useState } from "react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'building' | 'milestone' | 'speed' | 'special';
  requirement: number;
  unlocked: boolean;
  hidden?: boolean;
  currentProgress?: number;
}

interface AchievementCardProps {
  achievement: Achievement;
  showProgress?: boolean;
  className?: string;
}

export const AchievementCard = ({
  achievement,
  showProgress = false,
  className
}: AchievementCardProps) => {
  const progress = achievement.currentProgress ?? 0;
  const progressPercentage = Math.min((progress / achievement.requirement) * 100, 100);
  const reducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    return () => setIsLoaded(false);
  }, []);

  if (achievement.hidden && !achievement.unlocked) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300 glass-card group",
        achievement.unlocked 
          ? "border border-yellow-400/30 hover:border-yellow-400/50" 
          : "border border-slate-700/50 hover:border-slate-600/70",
        className
      )}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={isLoaded ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reducedMotion ? {} : { y: -4, boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2)' }}
      whileTap={reducedMotion ? {} : { scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Animated Background Glow */}
      {achievement.unlocked && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-orange-400/3 to-purple-400/5"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0.7,
            backgroundPosition: isHovered ? '0% 0%' : '100% 100%'
          }}
          transition={{ 
            opacity: { duration: 0.3 },
            backgroundPosition: { 
              duration: 15, 
              repeat: Infinity, 
              repeatType: 'reverse',
              ease: 'linear'
            }
          }}
        />
      )}
      
      {/* Shine Effect on Hover */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.div 
          className={cn(
            "relative w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden",
            achievement.unlocked
              ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black"
              : "bg-slate-700/80 text-slate-400 backdrop-blur-sm"
          )}
          animate={achievement.unlocked && isHovered ? { 
            rotate: [0, 5, -5, 5, 0],
            scale: [1, 1.1, 1.1, 1.1, 1],
          } : {}}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {achievement.unlocked ? (
            <>
              <span className="relative z-10">{achievement.icon}</span>
              <Sparkles 
                className="absolute inset-0 w-full h-full text-yellow-200/30"
                style={{
                  filter: 'blur(4px)',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              />
            </>
          ) : (
            <Lock className="h-6 w-6" />
          )}
        </motion.div>

          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-bold text-sm truncate",
              achievement.unlocked ? "text-white" : "text-slate-400"
            )}>
              {achievement.name}
            </h3>
            <p className={cn(
              "text-xs truncate",
              achievement.unlocked ? "text-slate-300" : "text-slate-500"
            )}>
              {achievement.description}
            </p>
          </div>

          {/* Unlock Indicator */}
          {achievement.unlocked && (
            <CheckCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && !achievement.unlocked && (
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Fortschritt</span>
              <span className="font-mono text-slate-400">
                {progress.toLocaleString()}<span className="text-slate-500"> / {achievement.requirement.toLocaleString()}</span>
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-700/80 overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 rounded-full relative"
                initial={reducedMotion ? { width: `${progressPercentage}%` } : { width: 0 }}
                animate={{ 
                  width: `${progressPercentage}%`,
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ 
                  width: { duration: 1.5, ease: 'easeOut' },
                  opacity: { 
                    duration: 2, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }
                }}
              >
                {progressPercentage > 0 && progressPercentage < 100 && (
                  <motion.div 
                    className="absolute right-0 top-0 h-full w-2 bg-white/70"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0, 0.8, 0],
                      x: ['-100%', '0%']
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: 'easeInOut'
                    }}
                  />
                )}
              </motion.div>
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
            <span className="text-xs text-yellow-400 font-semibold">
              Freigeschaltet!
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
