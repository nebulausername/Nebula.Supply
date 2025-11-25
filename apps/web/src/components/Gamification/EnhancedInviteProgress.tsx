import React, { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Users,
  Star,
  Zap,
  TrendingUp,
  Crown,
  Gift,
  Rocket,
  Sparkles,
  Target,
  Award,
  ChevronRight,
  Copy,
  Share2,
  CheckCircle,
  Coins,
  Trophy
} from "lucide-react";
import { cn } from "../../utils/cn";

interface InviteProgress {
  currentTier: string;
  tierProgress: number;
  totalInvites: number;
  totalReferrals: number;
  coinsEarned: number;
  nextTierInvites: number;
  tierBenefits: string[];
  recentRewards: Array<{
    type: 'coins' | 'drop' | 'vip' | 'title';
    amount?: number;
    description: string;
    timestamp: string;
  }>;
  activeMultipliers: Array<{
    type: string;
    multiplier: number;
    duration: string;
  }>;
}

interface EnhancedInviteProgressProps {
  inviteData: InviteProgress;
  className?: string;
  onShare?: () => void;
  onCopy?: () => void;
}

const tierGradients = {
  starter: 'from-slate-500 to-slate-700',
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-slate-300 to-slate-500',
  diamond: 'from-cyan-400 to-cyan-600',
  master: 'from-purple-400 to-purple-600',
  grandmaster: 'from-red-400 to-red-600',
  supernova: 'from-pink-400 via-purple-500 to-indigo-600'
};

const tierIcons = {
  starter: Users,
  bronze: Award,
  silver: Star,
  gold: Crown,
  platinum: Trophy,
  diamond: Sparkles,
  master: Zap,
  grandmaster: TrendingUp,
  supernova: Rocket
};

export const EnhancedInviteProgress: React.FC<EnhancedInviteProgressProps> = ({
  inviteData,
  className,
  onShare,
  onCopy
}) => {
  const reducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTier = inviteData.currentTier as keyof typeof tierGradients;
  const TierIcon = tierIcons[currentTier] || Users;
  const gradientClass = tierGradients[currentTier] || tierGradients.starter;

  // Generate floating particles
  useEffect(() => {
    if (!isHovered || reducedMotion) return;

    const generateParticles = () => {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      }));
      setParticles(newParticles);

      // Clear particles after animation
      setTimeout(() => setParticles([]), 3000);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 2000);
    return () => clearInterval(interval);
  }, [isHovered, reducedMotion]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Gerade eben';
    if (diffMinutes < 60) return `vor ${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `vor ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `vor ${diffDays}d`;
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <motion.div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/40 via-black/60 to-black/80 backdrop-blur-xl",
          `shadow-2xl shadow-${currentTier === 'supernova' ? 'pink' : currentTier === 'diamond' ? 'cyan' : 'purple'}-500/20`
        )}
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        whileHover={reducedMotion ? {} : {
          scale: 1.02,
          rotateX: 2,
          rotateY: 1
        }}
        style={{ transformStyle: 'preserve-3d' }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Animated Background Gradient */}
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-20",
            gradientClass
          )}
          animate={isHovered ? {
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Particle System */}
        <AnimatePresence>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className={cn(
                "absolute w-1 h-1 rounded-full",
                currentTier === 'supernova' ? 'bg-pink-400' :
                currentTier === 'diamond' ? 'bg-cyan-400' :
                'bg-purple-400'
              )}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              initial={{
                opacity: 0,
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: [0, (Math.random() - 0.5) * 100],
                y: [0, (Math.random() - 0.5) * 100]
              }}
              transition={{
                duration: 2,
                delay: particle.delay,
                ease: "easeOut"
              }}
            />
          ))}
        </AnimatePresence>

        {/* Glow Effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500",
            currentTier === 'supernova' ? 'shadow-pink-500/30' :
            currentTier === 'diamond' ? 'shadow-cyan-500/30' :
            'shadow-purple-500/30'
          )}
          animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
        />

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                className={cn(
                  "relative p-4 rounded-2xl bg-gradient-to-br",
                  gradientClass
                )}
                animate={isHovered ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                } : {}}
                transition={{ duration: 0.8 }}
              >
                <TierIcon className="h-8 w-8 text-white" />

                {/* Pulsing glow */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-2xl opacity-50",
                    gradientClass
                  )}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <div>
                <motion.h3
                  className="text-2xl font-bold text-text mb-1"
                  animate={isHovered ? { x: [0, 2, -2, 0] } : {}}
                  transition={{ duration: 0.6 }}
                >
                  {inviteData.currentTier.charAt(0).toUpperCase() + inviteData.currentTier.slice(1)}
                </motion.h3>
                <p className="text-sm text-muted">
                  {inviteData.totalInvites} Invites • {inviteData.totalReferrals} Referrals
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="text-right">
              <motion.div
                className="text-3xl font-bold text-accent mb-1"
                animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {inviteData.coinsEarned.toLocaleString()}
              </motion.div>
              <p className="text-sm text-muted">Coins verdient</p>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted mb-3">
              <span>Fortschritt zum nächsten Tier</span>
              <span>{inviteData.nextTierInvites - inviteData.totalInvites} Invites verbleibend</span>
            </div>

            <div className="h-4 w-full rounded-full bg-white/10 overflow-hidden relative">
              <motion.div
                className={cn(
                  "h-4 rounded-full bg-gradient-to-r relative",
                  gradientClass
                )}
                initial={{ width: 0 }}
                animate={{ width: `${inviteData.tierProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                {/* Animated shine */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }}
                />

                {/* Progress particles */}
                {inviteData.tierProgress > 80 && (
                  <motion.div
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }}
                  >
                    <Sparkles className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            <div className="mt-2 text-xs text-muted text-center">
              {Math.round(inviteData.tierProgress)}% abgeschlossen
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {inviteData.tierBenefits.slice(0, 4).map((benefit, index) => (
              <motion.div
                key={benefit}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10"
                initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-xs text-muted">{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* Active Multipliers */}
          {inviteData.activeMultipliers.length > 0 && (
            <motion.div
              className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">Aktive Multiplier</span>
              </div>
              <div className="space-y-1">
                {inviteData.activeMultipliers.map((multiplier, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{multiplier.type}</span>
                    <span className="text-purple-400 font-medium">
                      {multiplier.multiplier}x • {multiplier.duration}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Rewards */}
          {inviteData.recentRewards.length > 0 && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h4 className="text-sm font-medium text-text mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-400" />
                Letzte Belohnungen
              </h4>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {inviteData.recentRewards.slice(0, 3).map((reward, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5 text-xs"
                    initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      reward.type === 'coins' ? 'bg-yellow-400' :
                      reward.type === 'drop' ? 'bg-blue-400' :
                      reward.type === 'vip' ? 'bg-purple-400' : 'bg-green-400'
                    )} />
                    <span className="flex-1 text-muted">{reward.description}</span>
                    <span className="text-muted">{formatTimeAgo(reward.timestamp)}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-black font-medium hover:bg-accent/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="h-4 w-4" />
              <span>Teilen</span>
            </motion.button>

            <motion.button
              onClick={onCopy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-text font-medium hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Copy className="h-4 w-4" />
              <span>Code kopieren</span>
            </motion.button>
          </div>
        </div>

        {/* Corner Badge */}
        <motion.div
          className="absolute top-4 right-4"
          animate={isHovered ? { rotate: [0, 5, -5, 0] } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold",
            currentTier === 'supernova' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
            currentTier === 'diamond' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
            'bg-purple-500/20 text-purple-400 border border-purple-500/30'
          )}>
            {currentTier === 'supernova' ? 'SUPERNOVA' :
             currentTier === 'diamond' ? 'DIAMOND' :
             currentTier.toUpperCase()}
          </span>
        </motion.div>
      </motion.div>

      {/* Floating Reward Notification */}
      <AnimatePresence>
        {showRewardPopup && (
          <motion.div
            className="absolute -top-16 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="bg-green-500/90 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span>+150 Coins erhalten!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

