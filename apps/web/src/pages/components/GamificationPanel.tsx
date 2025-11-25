import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Award, Flame, TrendingUp, Star, Zap, Calendar, Users } from "lucide-react";
import { ScrollReveal } from "../../components/ScrollReveal";
import { cn } from "../../utils/cn";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface Streak {
  current: number;
  longest: number;
  lastLogin: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
}

interface GamificationPanelProps {
  achievements?: Achievement[];
  streak?: Streak;
  leaderboard?: LeaderboardEntry[];
  reducedMotion?: boolean;
}

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Erste Schritte',
    description: 'Melde dich zum ersten Mal an',
    icon: Star,
    unlocked: true,
    unlockedAt: Date.now() - 86400000,
    rarity: 'common'
  },
  {
    id: '2',
    title: 'Invite Master',
    description: 'Lade 10 Freunde ein',
    icon: Users,
    unlocked: false,
    progress: 7,
    maxProgress: 10,
    rarity: 'rare'
  },
  {
    id: '3',
    title: 'Shopping Spree',
    description: 'Kaufe 5 Produkte',
    icon: Trophy,
    unlocked: false,
    progress: 3,
    maxProgress: 5,
    rarity: 'epic'
  },
  {
    id: '4',
    title: 'VIP Status',
    description: 'Erreiche VIP Rang',
    icon: Award,
    unlocked: true,
    unlockedAt: Date.now() - 172800000,
    rarity: 'legendary'
  }
];

const mockStreak: Streak = {
  current: 7,
  longest: 12,
  lastLogin: Date.now()
};

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'Max M.', score: 2340 },
  { rank: 2, name: 'Anna K.', score: 1890 },
  { rank: 3, name: 'Tom S.', score: 1560 }
];

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600'
};

export const GamificationPanel = memo(({
  achievements = mockAchievements,
  streak = mockStreak,
  leaderboard = mockLeaderboard,
  reducedMotion = false
}: GamificationPanelProps) => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'streak' | 'leaderboard'>('achievements');

  return (
    <ScrollReveal direction="up" delay={0.3} reducedMotion={reducedMotion}>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Gamification
            </h2>
            <p className="text-sm text-muted mt-1">Achievements, Streaks & Leaderboard</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {[
            { id: 'achievements' as const, label: 'Achievements', icon: Award },
            { id: 'streak' as const, label: 'Streak', icon: Flame },
            { id: 'leaderboard' as const, label: 'Leaderboard', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-text"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                const progress = achievement.progress && achievement.maxProgress
                  ? (achievement.progress / achievement.maxProgress) * 100
                  : achievement.unlocked ? 100 : 0;

                return (
                  <motion.div
                    key={achievement.id}
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    whileHover={reducedMotion ? {} : { scale: 1.02, y: -2 }}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border p-4",
                      achievement.unlocked
                        ? `border-white/20 bg-gradient-to-br ${rarityColors[achievement.rarity]} bg-opacity-20`
                        : "border-white/10 bg-black/30"
                    )}
                  >
                    {achievement.unlocked && (
                      <motion.div
                        className="absolute top-2 right-2"
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      >
                        <Zap className="h-5 w-5 text-yellow-400" />
                      </motion.div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-3 rounded-xl",
                        achievement.unlocked
                          ? `bg-gradient-to-br ${rarityColors[achievement.rarity]}`
                          : "bg-white/5"
                      )}>
                        <Icon className={cn(
                          "h-6 w-6",
                          achievement.unlocked ? "text-white" : "text-muted"
                        )} />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-semibold mb-1",
                          achievement.unlocked ? "text-white" : "text-text"
                        )}>
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-muted mb-2">{achievement.description}</p>
                        
                        {!achievement.unlocked && achievement.progress !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted">Fortschritt</span>
                              <span className="text-accent font-semibold">
                                {achievement.progress} / {achievement.maxProgress}
                              </span>
                            </div>
                            <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                              <motion.div
                                className={cn("h-full rounded-full bg-gradient-to-r", rarityColors[achievement.rarity])}
                                initial={{ width: 0 }}
                                whileInView={{ width: `${progress}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                              />
                            </div>
                          </div>
                        )}

                        {achievement.unlocked && achievement.unlockedAt && (
                          <div className="text-xs text-muted mt-2">
                            Freigeschaltet {new Date(achievement.unlockedAt).toLocaleDateString('de-DE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'streak' && (
            <motion.div
              key="streak"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Flame className="h-6 w-6 text-orange-400" />
                    <h3 className="text-lg font-semibold text-text">Aktueller Streak</h3>
                  </div>
                  <div className="text-4xl font-bold text-orange-400 mb-2">{streak.current}</div>
                  <p className="text-sm text-muted">Tage in Folge</p>
                </motion.div>

                <motion.div
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="h-6 w-6 text-purple-400" />
                    <h3 className="text-lg font-semibold text-text">Bester Streak</h3>
                  </div>
                  <div className="text-4xl font-bold text-purple-400 mb-2">{streak.longest}</div>
                  <p className="text-sm text-muted">Tage Rekord</p>
                </motion.div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-accent" />
                  <h3 className="text-lg font-semibold text-text">Nächster Login</h3>
                </div>
                <p className="text-sm text-muted">
                  Melde dich täglich an, um deinen Streak zu erhalten!
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.rank}
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={reducedMotion ? {} : { x: 4, scale: 1.02 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                    entry.rank === 1
                      ? "border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"
                      : "border-white/10 bg-black/30 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                      entry.rank === 1 && "bg-gradient-to-br from-yellow-400 to-orange-500 text-black",
                      entry.rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-400 text-black",
                      entry.rank === 3 && "bg-gradient-to-br from-orange-600 to-orange-700 text-white",
                      entry.rank > 3 && "bg-white/10 text-text"
                    )}>
                      {entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </div>
                    <div>
                      <div className="font-semibold text-text">{entry.name}</div>
                      <div className="text-xs text-muted">Rang #{entry.rank}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-lg font-bold text-accent">{entry.score.toLocaleString()}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </ScrollReveal>
  );
});

GamificationPanel.displayName = 'GamificationPanel';

