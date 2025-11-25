import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Crown } from 'lucide-react';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  rarity: AchievementRarity;
}

interface AchievementToastProps {
  achievement: Achievement;
}

const rarityConfig = {
  common: {
    gradient: 'from-gray-500 to-gray-600',
    glow: 'rgba(156, 163, 175, 0.5)',
    borderColor: 'border-gray-400/30'
  },
  rare: {
    gradient: 'from-blue-500 to-cyan-600',
    glow: 'rgba(59, 130, 246, 0.5)',
    borderColor: 'border-blue-400/30'
  },
  epic: {
    gradient: 'from-purple-500 to-pink-600',
    glow: 'rgba(168, 85, 247, 0.5)',
    borderColor: 'border-purple-400/30'
  },
  legendary: {
    gradient: 'from-yellow-500 via-orange-500 to-orange-600',
    glow: 'rgba(251, 191, 36, 0.5)',
    borderColor: 'border-yellow-400/30'
  }
};

const getDefaultIcon = (rarity: AchievementRarity) => {
  switch (rarity) {
    case 'legendary':
      return <Crown className="h-6 w-6 text-white" />;
    case 'epic':
      return <Zap className="h-6 w-6 text-white" />;
    case 'rare':
      return <Star className="h-6 w-6 text-white" />;
    default:
      return <Trophy className="h-6 w-6 text-white" />;
  }
};

export const AchievementToast = ({ achievement }: AchievementToastProps) => {
  const config = rarityConfig[achievement.rarity];

  return (
    <motion.div
      initial={{ x: 400, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 400, opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`relative bg-gradient-to-r ${config.gradient} rounded-2xl p-4 shadow-2xl border-2 ${config.borderColor} min-w-[300px] max-w-md`}
      style={{
        boxShadow: `0 8px 32px ${config.glow}, 0 0 0 1px rgba(255,255,255,0.1)`
      }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'linear'
        }}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          pointerEvents: 'none'
        }}
      />

      <div className="relative z-10 flex items-center gap-3">
        {/* Icon */}
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 0.6,
            times: [0, 0.2, 0.4, 0.6, 0.8, 1]
          }}
          className="flex-shrink-0"
        >
          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
            {achievement.icon || getDefaultIcon(achievement.rarity)}
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-white text-sm">
              {achievement.title}
            </p>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              {achievement.rarity}
            </span>
          </div>
          <p className="text-sm text-white/90 leading-tight">
            {achievement.description}
          </p>
        </div>

        {/* Particles */}
        {achievement.rarity === 'legendary' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{
                  x: '50%',
                  y: '50%',
                  scale: 0,
                  opacity: 1
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.05,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};



