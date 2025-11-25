import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Star, Zap, TrendingUp, Award } from "lucide-react";
import { cn } from "../../utils/cn";

interface UserLevel {
  current: number;
  experience: number;
  experienceToNext: number;
  totalExperience: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';
  benefits: string[];
  nextTierAt: number;
}

interface UserLevelProgressProps {
  userLevel: UserLevel;
  className?: string;
  showDetails?: boolean;
}

const tierColors = {
  Bronze: { bg: 'from-amber-600 to-amber-800', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  Silver: { bg: 'from-slate-400 to-slate-600', text: 'text-slate-300', glow: 'shadow-slate-400/20' },
  Gold: { bg: 'from-yellow-400 to-yellow-600', text: 'text-yellow-300', glow: 'shadow-yellow-400/20' },
  Platinum: { bg: 'from-slate-300 to-slate-500', text: 'text-slate-200', glow: 'shadow-slate-300/20' },
  Diamond: { bg: 'from-cyan-400 to-cyan-600', text: 'text-cyan-300', glow: 'shadow-cyan-400/20' },
  Master: { bg: 'from-purple-400 to-purple-600', text: 'text-purple-300', glow: 'shadow-purple-400/20' },
  Grandmaster: { bg: 'from-red-400 to-red-600', text: 'text-red-300', glow: 'shadow-red-400/20' }
};

const tierIcons = {
  Bronze: Award,
  Silver: Award,
  Gold: Crown,
  Platinum: Crown,
  Diamond: Star,
  Master: Zap,
  Grandmaster: TrendingUp
};

export const UserLevelProgress: React.FC<UserLevelProgressProps> = ({
  userLevel,
  className,
  showDetails = true
}) => {
  const reducedMotion = useReducedMotion();
  const [animatedExp, setAnimatedExp] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const progressPercentage = (userLevel.experience / userLevel.experienceToNext) * 100;
  const TierIcon = tierIcons[userLevel.tier];
  const tierColor = tierColors[userLevel.tier];

  useEffect(() => {
    if (reducedMotion) {
      setAnimatedExp(userLevel.experience);
    } else {
      const timer = setTimeout(() => {
        setAnimatedExp(userLevel.experience);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [userLevel.experience, reducedMotion]);

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/40 to-black/60 p-6 backdrop-blur-sm",
        tierColor.glow,
        className
      )}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={reducedMotion ? {} : { y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Animated Background */}
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-10",
          tierColor.bg
        )}
        animate={isHovered ? {
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.02, 1]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Glow Effect */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300",
          tierColor.glow
        )}
        animate={isHovered ? { opacity: 0.3 } : { opacity: 0 }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "p-3 rounded-2xl bg-gradient-to-br",
                tierColor.bg
              )}
              animate={isHovered ? {
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <TierIcon className={cn("h-6 w-6", tierColor.text)} />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-text">
                Level {userLevel.current}
              </h3>
              <p className={cn("text-sm font-medium", tierColor.text)}>
                {userLevel.tier}
              </p>
            </div>
          </div>

          {/* Experience Points */}
          <div className="text-right">
            <motion.div
              className="text-2xl font-bold text-accent"
              key={animatedExp}
              initial={reducedMotion ? {} : { scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {animatedExp.toLocaleString()}
            </motion.div>
            <p className="text-xs text-muted">XP</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-muted mb-2">
            <span>Fortschritt zum nächsten Level</span>
            <span>{userLevel.experience.toLocaleString()} / {userLevel.experienceToNext.toLocaleString()} XP</span>
          </div>

          <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className={cn(
                "h-3 rounded-full bg-gradient-to-r relative",
                tierColor.bg
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          </div>
        </div>

        {/* Benefits Preview */}
        {showDetails && userLevel.benefits.length > 0 && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm font-medium text-text">Tier-Benefits:</p>
            <div className="flex flex-wrap gap-2">
              {userLevel.benefits.slice(0, 3).map((benefit, index) => (
                <motion.span
                  key={benefit}
                  className={cn(
                    "text-xs px-2 py-1 rounded-full bg-white/10 text-muted border border-white/10",
                    "hover:bg-white/20 hover:text-text transition-colors"
                  )}
                  initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                >
                  {benefit}
                </motion.span>
              ))}
              {userLevel.benefits.length > 3 && (
                <motion.span
                  className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent border border-accent/30"
                  whileHover={{ scale: 1.05 }}
                >
                  +{userLevel.benefits.length - 3} mehr
                </motion.span>
              )}
            </div>
          </motion.div>
        )}

        {/* Next Tier Preview */}
        {userLevel.nextTierAt && (
          <motion.div
            className="mt-4 pt-4 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs text-muted">
              Nächster Tier bei Level {userLevel.nextTierAt}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

