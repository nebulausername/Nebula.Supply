import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Trophy,
  Heart,
  TrendingUp,
  Coins,
  Award,
  Activity,
  Target,
  Zap,
  Flame,
  TrendingDown,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useProfileStats } from '../../hooks/useProfileStats';
import { useProfileRealtime } from '../../hooks/useProfileRealtime';
import { useShopStore } from '../../store/shop';
import { useDropsStore } from '../../store/drops';
import { useAchievementStore } from '../../store/achievementStore';
import { useMobileOptimizations } from '../MobileOptimizations';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { springConfigs } from '../../utils/springConfigs';
import { memo } from 'react';

interface Insight {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  trend?: number;
}

interface RecentActivity {
  action: string;
  item: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

export const OverviewDashboard = memo(() => {
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const { stats } = useProfileStats();
  const { recentActivity } = useProfileRealtime({ enabled: true });
  const coinsBalance = useShopStore((state) => state.coinsBalance);
  const drops = useDropsStore((state: any) => state.drops);
  const achievements = useAchievementStore((state: any) => state.achievements);

  const insights = useMemo<Insight[]>(() => {
    const winRate = stats.winRate;
    const avgCoinsPerDay = stats.coinsEarned / 30; // Estimate
    const activityCount = recentActivity.length || 184; // Fallback

    return [
      {
        id: 'win-rate',
        title: 'Drop Master',
        description: `Deine Gewinnrate liegt bei ${winRate.toFixed(1)}% - ${winRate > 25 ? 'über dem Durchschnitt!' : 'gut gemacht!'}`,
        icon: <Trophy className="w-6 h-6 text-green-400" />,
        gradient: 'from-green-500/20 to-emerald-500/20',
        borderColor: 'border-green-500/30',
        trend: winRate > 25 ? 5.2 : -2.1,
      },
      {
        id: 'daily-earnings',
        title: 'Täglicher Durchschnitt',
        description: `Du verdienst ca. ${Math.round(avgCoinsPerDay)} Coins pro Tag`,
        icon: <Star className="w-6 h-6 text-blue-400" />,
        gradient: 'from-blue-500/20 to-cyan-500/20',
        borderColor: 'border-blue-500/30',
        trend: 12.5,
      },
      {
        id: 'community',
        title: 'Insider Star',
        description: `${activityCount} Interaktionen in den letzten 30 Tagen`,
        icon: <Heart className="w-6 h-6 text-pink-400" />,
        gradient: 'from-pink-500/20 to-rose-500/20',
        borderColor: 'border-pink-500/30',
        trend: 8.3,
      },
    ];
  }, [stats, recentActivity]);

  const recentActivities = useMemo<RecentActivity[]>(() => {
    // Transform realtime activity or use mock data
    if (recentActivity.length > 0) {
      return recentActivity.slice(0, 5).map((activity) => ({
        action: activity.message,
        item: activity.amount ? `+${activity.amount} Coins` : '',
        time: formatTimeAgo(new Date(activity.timestamp)),
        type: activity.type === 'coins' ? 'success' : 'info',
      }));
    }

    // Fallback mock data
    return [
      { action: 'Drop gewonnen', item: 'Nebula Vape Pro', time: '2h ago', type: 'success' as const },
      { action: 'Coins verdient', item: '+50 Coins', time: '5h ago', type: 'success' as const },
      { action: 'Achievement freigeschaltet', item: 'Drop Master', time: '1d ago', type: 'info' as const },
    ];
  }, [recentActivity]);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min`;
    if (hours < 24) return `vor ${hours} Std`;
    if (days < 7) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="space-y-6">
      {/* Insights Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-accent" />
          Deine Insights
        </h3>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-2xl border",
                  insight.gradient,
                  insight.borderColor
                )}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-start gap-3">
                  {insight.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-white">{insight.title}</h4>
                      {insight.trend !== undefined && (
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-medium flex-shrink-0",
                          insight.trend > 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {insight.trend > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{Math.abs(insight.trend)}%</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-4 text-center"
          )}
          whileHover={{ scale: 1.05, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
          <div className="relative z-10">
            <Coins className="w-6 h-6 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">{coinsBalance}</div>
            <div className="text-xs text-gray-400">Coins</div>
          </div>
        </motion.div>

        <motion.div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-4 text-center"
          )}
          whileHover={{ scale: 1.05, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <div className="relative z-10">
            <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">{drops?.length || 0}</div>
            <div className="text-xs text-gray-400">Drops</div>
          </div>
        </motion.div>

        <motion.div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-4 text-center"
          )}
          whileHover={{ scale: 1.05, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <div className="relative z-10">
            <Award className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">{achievements?.length || 0}</div>
            <div className="text-xs text-gray-400">Achievements</div>
          </div>
        </motion.div>

        <motion.div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-4 text-center"
          )}
          whileHover={{ scale: 1.05, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
          <div className="relative z-10">
            <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">{stats.streak}</div>
            <div className="text-xs text-gray-400">Streak</div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Letzte Aktivität
          </h3>
          <button
            onClick={() => triggerHaptic('light')}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Alle anzeigen
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border border-white/10",
                  "bg-white/5 hover:bg-white/10 transition-colors"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  activity.type === 'success' ? "bg-green-400" :
                  activity.type === 'warning' ? "bg-yellow-400" :
                  "bg-accent"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{activity.action}</p>
                  {activity.item && (
                    <p className="text-xs text-gray-400 truncate">{activity.item}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Achievement Progress */}
      {stats.totalAchievements > 0 && (
        <div className={cn(
          "relative overflow-hidden rounded-2xl border border-white/10",
          "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
          "p-4 sm:p-5"
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-400" />
                Achievement Fortschritt
              </h3>
              <span className="text-sm text-gray-400">
                {stats.unlockedAchievements} / {stats.totalAchievements}
              </span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${stats.achievementProgress}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {stats.achievementProgress.toFixed(1)}% abgeschlossen
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

OverviewDashboard.displayName = 'OverviewDashboard';

