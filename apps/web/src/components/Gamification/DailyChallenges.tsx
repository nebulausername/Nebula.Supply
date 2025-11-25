import React, { useState, useEffect } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Target,
  Clock,
  CheckCircle,
  Zap,
  Flame,
  Gift,
  Star,
  Trophy,
  Timer,
  Award,
  TrendingUp
} from "lucide-react";
import { cn } from "../../utils/cn";

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'daily' | 'weekly' | 'special';
  progress: number;
  target: number;
  reward: {
    coins: number;
    bonus?: string;
    xp?: number;
  };
  category: 'social' | 'shopping' | 'engagement' | 'achievement';
  isCompleted: boolean;
  timeLeft?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface DailyChallengesProps {
  challenges: DailyChallenge[];
  className?: string;
  maxVisible?: number;
}

const challengeIcons = {
  social: Target,
  shopping: Gift,
  engagement: Flame,
  achievement: Trophy
};

const difficultyColors = {
  easy: 'border-green-500/30 bg-green-500/10 text-green-400',
  medium: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  hard: 'border-red-500/30 bg-red-500/10 text-red-400'
};

export const DailyChallenges: React.FC<DailyChallengesProps> = ({
  challenges,
  className,
  maxVisible = 4
}) => {
  const reducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const visibleChallenges = expanded ? challenges : challenges.slice(0, maxVisible);
  const hasMore = challenges.length > maxVisible;

  useEffect(() => {
    setCompletedCount(challenges.filter(c => c.isCompleted).length);
  }, [challenges]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20"
            animate={reducedMotion ? {} : {
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Target className="h-6 w-6 text-orange-400" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-text">Tägliche Challenges</h3>
            <p className="text-sm text-muted">
              {completedCount} von {challenges.length} abgeschlossen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.div
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              completedCount === challenges.length
                ? "bg-green-500/20 text-green-400"
                : "bg-orange-500/20 text-orange-400"
            )}
            animate={reducedMotion ? {} : {
              scale: [1, 1.02, 1]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {completedCount}/{challenges.length}
          </motion.div>

          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-accent hover:text-accent/80 transition-colors"
            >
              {expanded ? 'Weniger' : `+${challenges.length - maxVisible} mehr`}
            </button>
          )}
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visibleChallenges.map((challenge, index) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              index={index}
              reducedMotion={reducedMotion ?? false}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Daily Streak Bonus */}
      {completedCount > 0 && (
        <motion.div
          className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/20">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="font-medium text-text">Streak Bonus aktiv!</p>
                <p className="text-sm text-muted">Je mehr Challenges, desto höher der Bonus</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-orange-400">
                +{Math.floor(completedCount * 0.5)}%
              </p>
              <p className="text-xs text-muted">Extra XP</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

interface ChallengeCardProps {
  challenge: DailyChallenge;
  index: number;
  reducedMotion?: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  index,
  reducedMotion
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const progressPercentage = Math.min((challenge.progress / challenge.target) * 100, 100);
  const IconComponent = challengeIcons[challenge.category];

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300 group cursor-pointer",
        challenge.isCompleted
          ? "border-green-500/30 bg-green-500/10 hover:bg-green-500/20"
          : "border-white/10 bg-black/30 hover:bg-white/5 hover:border-white/20",
        difficultyColors[challenge.difficulty]
      )}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={reducedMotion ? {} : { y: -2, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Animated Background */}
      <motion.div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          challenge.isCompleted
            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
            : "bg-gradient-to-br from-white/5 to-white/10"
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

      <div className="relative p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className={cn(
              "p-2 rounded-xl flex-shrink-0",
              challenge.isCompleted
                ? "bg-green-500/20"
                : "bg-white/10"
            )}
            animate={challenge.isCompleted && !reducedMotion ? {
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            } : {}}
            transition={{ duration: 0.6 }}
          >
            {challenge.isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <IconComponent className={cn(
                "h-5 w-5",
                challenge.isCompleted ? "text-green-400" : "text-muted"
              )} />
            )}
          </motion.div>

          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-semibold text-sm truncate",
              challenge.isCompleted ? "text-green-400" : "text-text"
            )}>
              {challenge.title}
            </h4>
            <p className="text-xs text-muted truncate">
              {challenge.description}
            </p>
          </div>

          {/* Difficulty Badge */}
          <span className={cn(
            "text-xs px-2 py-1 rounded-full font-medium",
            difficultyColors[challenge.difficulty]
          )}>
            {challenge.difficulty === 'easy' ? 'Einfach' :
             challenge.difficulty === 'medium' ? 'Mittel' : 'Schwer'}
          </span>
        </div>

        {/* Progress */}
        {!challenge.isCompleted && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span>Fortschritt</span>
              <span>{challenge.progress} / {challenge.target}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className={cn(
                  "h-2 rounded-full bg-gradient-to-r",
                  challenge.difficulty === 'easy' ? 'from-green-400 to-green-600' :
                  challenge.difficulty === 'medium' ? 'from-yellow-400 to-yellow-600' :
                  'from-red-400 to-red-600'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400">
                +{challenge.reward.coins}
              </span>
            </div>
            {challenge.reward.xp && (
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">
                  +{challenge.reward.xp} XP
                </span>
              </div>
            )}
            {challenge.reward.bonus && (
              <div className="flex items-center gap-1">
                <Award className="h-3 w-3 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">
                  {challenge.reward.bonus}
                </span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {challenge.timeLeft && (
              <div className="flex items-center gap-1 text-xs text-muted">
                <Timer className="h-3 w-3" />
                <span>{challenge.timeLeft}</span>
              </div>
            )}
            {challenge.isCompleted && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CheckCircle className="h-4 w-4 text-green-400" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-2 right-2">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            challenge.type === 'daily' ? 'bg-blue-500/20 text-blue-400' :
            challenge.type === 'weekly' ? 'bg-purple-500/20 text-purple-400' :
            'bg-orange-500/20 text-orange-400'
          )}>
            {challenge.type === 'daily' ? 'Täglich' :
             challenge.type === 'weekly' ? 'Wöchentlich' : 'Spezial'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

