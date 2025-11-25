import React, { useState, useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Crown,
  Star,
  Zap,
  Gift,
  Trophy,
  Diamond,
  Sparkles,
  TrendingUp,
  Award,
  Target,
  Rocket,
  Users,
  ShoppingBag,
  Timer,
  CheckCircle,
  Lock,
  Unlock
} from "lucide-react";
import { cn } from "../../utils/cn";

interface RewardType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  category: 'coins' | 'vip' | 'drop' | 'title' | 'multiplier' | 'access';
  value: number;
  requirements?: {
    invites?: number;
    coins?: number;
    tier?: string;
    timeLimit?: string;
  };
  isUnlocked: boolean;
  isNew?: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AdvancedRewardSystemProps {
  rewards: RewardType[];
  userTier: string;
  userCoins: number;
  userInvites: number;
  className?: string;
  onClaimReward?: (rewardId: string) => void;
}

const rarityColors = {
  common: {
    bg: 'from-slate-500/20 to-slate-600/20',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    glow: 'shadow-slate-500/20'
  },
  rare: {
    bg: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  epic: {
    bg: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20'
  },
  legendary: {
    bg: 'from-yellow-400/20 to-orange-500/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-400/20'
  },
  mythic: {
    bg: 'from-red-400/20 via-pink-500/20 to-purple-600/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'shadow-red-500/20'
  }
};

const rarityIcons = {
  common: Gift,
  rare: Star,
  epic: Crown,
  legendary: Trophy,
  mythic: Diamond
};

export const AdvancedRewardSystem: React.FC<AdvancedRewardSystemProps> = ({
  rewards,
  userTier,
  userCoins,
  userInvites,
  className,
  onClaimReward
}) => {
  const reducedMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRewardModal, setShowRewardModal] = useState<string | null>(null);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Alle', icon: Gift },
    { id: 'coins', label: 'Coins', icon: Coins },
    { id: 'vip', label: 'VIP', icon: Crown },
    { id: 'drop', label: 'Drops', icon: Rocket },
    { id: 'title', label: 'Titel', icon: Award },
    { id: 'multiplier', label: 'Booster', icon: Zap }
  ];

  const filteredRewards = selectedCategory === 'all'
    ? rewards
    : rewards.filter(reward => reward.category === selectedCategory);

  const handleClaimReward = async (rewardId: string) => {
    if (!onClaimReward) return;

    setClaimingReward(rewardId);
    await onClaimReward(rewardId);
    setClaimingReward(null);
    setShowRewardModal(null);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
            animate={reducedMotion ? {} : {
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Trophy className="h-6 w-6 text-yellow-400" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold text-text">Belohnungssystem</h3>
            <p className="text-sm text-muted">
              Verdiene Coins, VIP-Punkte und exklusive Belohnungen
            </p>
          </div>
        </div>

        {/* User Stats */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-accent">{userCoins.toLocaleString()}</div>
            <div className="text-xs text-muted">Coins</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{userInvites}</div>
            <div className="text-xs text-muted">Invites</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              selectedCategory === category.id
                ? "bg-accent text-black shadow-lg"
                : "bg-white/5 text-muted hover:bg-white/10 hover:text-text"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <category.icon className="h-4 w-4" />
            <span>{category.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredRewards.map((reward, index) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              userTier={userTier}
              userCoins={userCoins}
              userInvites={userInvites}
              index={index}
              reducedMotion={reducedMotion ?? false}
              isClaiming={claimingReward === reward.id}
              onClaim={() => setShowRewardModal(reward.id)}
              onConfirmClaim={() => handleClaimReward(reward.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Reward Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <RewardModal
            reward={rewards.find(r => r.id === showRewardModal)!}
            isOpen={!!showRewardModal}
            onClose={() => setShowRewardModal(null)}
            onClaim={() => handleClaimReward(showRewardModal)}
            isClaiming={claimingReward === showRewardModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface RewardCardProps {
  reward: RewardType;
  userTier: string;
  userCoins: number;
  userInvites: number;
  index: number;
  reducedMotion?: boolean;
  isClaiming?: boolean;
  onClaim: () => void;
  onConfirmClaim: () => void;
}

const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  userTier,
  userCoins,
  userInvites,
  index,
  reducedMotion,
  isClaiming,
  onClaim
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const rarityColor = rarityColors[reward.rarity];
  const RarityIcon = rarityIcons[reward.rarity];

  const canClaim = reward.isUnlocked && (
    !reward.requirements?.coins || userCoins >= reward.requirements.coins
  ) && (
    !reward.requirements?.invites || userInvites >= reward.requirements.invites
  );

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300 group cursor-pointer",
        rarityColor.border,
        reward.isUnlocked && canClaim
          ? "hover:scale-105"
          : "opacity-75"
      )}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={reducedMotion ? {} : { y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={canClaim ? onClaim : undefined}
    >
      {/* Animated Background */}
      <motion.div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          rarityColor.bg
        )}
        animate={{ opacity: isHovered ? 0.1 : 0 }}
      />

      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Glow Effect for high rarity */}
      {reward.rarity === 'legendary' || reward.rarity === 'mythic' ? (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
            rarityColor.glow
          )}
          animate={isHovered ? { opacity: 0.3 } : { opacity: 0 }}
        />
      ) : null}

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className={cn(
                "p-3 rounded-xl relative",
                rarityColor.bg
              )}
              animate={isHovered && !reducedMotion ? {
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className={cn("text-2xl", rarityColor.text)}>
                {reward.icon}
              </div>

              {/* Pulsing effect for epic+ */}
              {(reward.rarity === 'epic' || reward.rarity === 'legendary' || reward.rarity === 'mythic') && (
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-xl opacity-50",
                    rarityColor.bg
                  )}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn("font-bold text-lg", rarityColor.text)}>
                  {reward.name}
                </h4>
                <RarityIcon className={cn("h-4 w-4", rarityColor.text)} />
              </div>
              <p className="text-sm text-muted">{reward.description}</p>
            </div>
          </div>

          {/* New Badge */}
          {reward.isNew && (
            <motion.span
              className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 animate-pulse"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              NEU
            </motion.span>
          )}
        </div>

        {/* Value Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">Wert:</span>
            <div className="flex items-center gap-1">
              {reward.category === 'coins' && <Coins className="h-4 w-4 text-yellow-400" />}
              {reward.category === 'vip' && <Crown className="h-4 w-4 text-purple-400" />}
              {reward.category === 'drop' && <Rocket className="h-4 w-4 text-blue-400" />}
              {reward.category === 'multiplier' && <Zap className="h-4 w-4 text-orange-400" />}
              <span className={cn("font-bold", rarityColor.text)}>
                {reward.value.toLocaleString()}
                {reward.category === 'coins' ? ' Coins' :
                 reward.category === 'vip' ? ' VIP-Punkte' :
                 reward.category === 'multiplier' ? 'x Multiplier' : ''}
              </span>
            </div>
          </div>

          {/* Progress Bar for requirements */}
          {reward.requirements && reward.progress !== undefined && reward.maxProgress && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted mb-2">
                <span>Fortschritt</span>
                <span>{reward.progress} / {reward.maxProgress}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className={cn(
                    "h-2 rounded-full bg-gradient-to-r",
                    rarityColor.bg
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${(reward.progress / reward.maxProgress) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Requirements */}
        {reward.requirements && (
          <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs font-medium text-muted mb-2">Voraussetzungen:</p>
            <div className="space-y-1 text-xs">
              {reward.requirements.invites && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Invites:</span>
                  <span className={userInvites >= reward.requirements.invites!
                    ? "text-green-400" : "text-red-400"}>
                    {userInvites} / {reward.requirements.invites}
                  </span>
                </div>
              )}
              {reward.requirements.coins && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Coins:</span>
                  <span className={userCoins >= reward.requirements.coins!
                    ? "text-green-400" : "text-red-400"}>
                    {userCoins.toLocaleString()} / {reward.requirements.coins.toLocaleString()}
                  </span>
                </div>
              )}
              {reward.requirements.tier && (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Tier:</span>
                  <span className={userTier === reward.requirements.tier
                    ? "text-green-400" : "text-red-400"}>
                    {userTier} / {reward.requirements.tier}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            if (canClaim) onClaim();
          }}
          disabled={!canClaim || isClaiming}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
            canClaim
              ? "bg-accent text-black hover:bg-accent/90"
              : "bg-white/5 text-muted cursor-not-allowed"
          )}
          whileHover={canClaim ? { scale: 1.05 } : {}}
          whileTap={canClaim ? { scale: 0.95 } : {}}
        >
          {isClaiming ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <span>Beanspruche...</span>
            </>
          ) : canClaim ? (
            <>
              <Unlock className="h-4 w-4" />
              <span>Beanspruchen</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              <span>Nicht verfügbar</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Rarity Badge */}
      <div className="absolute top-3 right-3">
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-bold uppercase",
          rarityColor.bg,
          rarityColor.text
        )}>
          {reward.rarity}
        </span>
      </div>
    </motion.div>
  );
};

interface RewardModalProps {
  reward: RewardType;
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => void;
  isClaiming?: boolean;
}

const RewardModal: React.FC<RewardModalProps> = ({
  reward,
  isOpen,
  onClose,
  onClaim,
  isClaiming
}) => {
  const rarityColor = rarityColors[reward.rarity];
  const RarityIcon = rarityIcons[reward.rarity];

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={cn(
          "relative max-w-md w-full rounded-3xl border overflow-hidden",
          rarityColor.border,
          rarityColor.bg
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Background */}
        <motion.div
          className={cn(
            "absolute inset-0 opacity-20",
            rarityColor.bg
          )}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              className={cn(
                "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center",
                rarityColor.bg
              )}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className={cn("text-3xl", rarityColor.text)}>
                {reward.icon}
              </div>
            </motion.div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className={cn("text-2xl font-bold", rarityColor.text)}>
                {reward.name}
              </h3>
              <RarityIcon className={cn("h-6 w-6", rarityColor.text)} />
            </div>

            <p className="text-muted">{reward.description}</p>
          </div>

          {/* Value */}
          <div className="text-center mb-6">
            <div className={cn("text-4xl font-bold mb-2", rarityColor.text)}>
              {reward.value.toLocaleString()}
            </div>
            <p className="text-muted">
              {reward.category === 'coins' ? 'Coins' :
               reward.category === 'vip' ? 'VIP-Punkte' :
               reward.category === 'multiplier' ? 'x Multiplier' : 'Wert'}
            </p>
          </div>

          {/* Requirements */}
          {reward.requirements && (
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="font-medium text-text mb-3">Voraussetzungen:</h4>
              <div className="space-y-2 text-sm">
                {reward.requirements.invites && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Invites:</span>
                    <span className="text-green-400">{reward.requirements.invites}</span>
                  </div>
                )}
                {reward.requirements.coins && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Coins:</span>
                    <span className="text-green-400">{reward.requirements.coins.toLocaleString()}</span>
                  </div>
                )}
                {reward.requirements.tier && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Mindest-Tier:</span>
                    <span className="text-green-400">{reward.requirements.tier}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-text font-medium hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Abbrechen
            </motion.button>

            <motion.button
              onClick={onClaim}
              disabled={isClaiming}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
                "bg-accent text-black hover:bg-accent/90"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isClaiming ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>Beanspruche...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Beanspruchen</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

