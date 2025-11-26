import { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Trophy,
  Coins,
  Award,
  Users,
  Target,
  Zap,
  Activity,
  PieChart,
  LineChart,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useProfileStats, ProfileStats, TimeRangeStats } from '../../hooks/useProfileStats';
import { useMobileOptimizations } from '../MobileOptimizations';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { springConfigs } from '../../utils/springConfigs';

type TimeRange = '7d' | '30d' | 'all';
type ChartType = 'line' | 'bar' | 'pie';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  format?: (value: number) => string;
}

const StatCard = memo(({ title, value, change, icon, color, format }: StatCardProps) => {
  const formattedValue = typeof value === 'number' && format ? format(value) : value;
  const isPositive = change !== undefined && change >= 0;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10",
        "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
        "p-4 sm:p-5"
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={springConfigs.gentle}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2 rounded-xl", color)}>
            {icon}
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-green-400" : "text-red-400"
            )}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
        <p className={cn(
          "text-2xl sm:text-3xl font-bold",
          "text-white"
        )}>
          {formattedValue}
        </p>
      </div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

export const StatsDashboard = memo(() => {
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const { stats, timeRangeStats, isLoading } = useProfileStats(timeRange);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    triggerHaptic('light');
    setTimeRange(range);
  }, [triggerHaptic]);

  const handleExport = useCallback(() => {
    triggerHaptic('light');
    // TODO: Implement export functionality
    console.log('Exporting stats...', { stats, timeRangeStats });
  }, [stats, timeRangeStats, triggerHaptic]);

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }, []);

  const formatPercentage = useCallback((num: number) => {
    return `${num.toFixed(1)}%`;
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            Statistiken
          </h2>
          <p className="text-sm text-gray-400">
            Detaillierte Einblicke in deine Aktivität
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className={cn(
            "flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 p-1",
            "backdrop-blur-xl"
          )}>
            {(['7d', '30d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  "touch-target",
                  timeRange === range
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {range === '7d' ? '7 Tage' : range === '30d' ? '30 Tage' : 'Gesamt'}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <motion.button
            onClick={handleExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "p-2 rounded-xl bg-white/5 border border-white/10",
              "hover:bg-white/10 transition-colors",
              "touch-target"
            )}
            aria-label="Statistiken exportieren"
          >
            <Download className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Gewinnrate"
          value={formatPercentage(stats.winRate)}
          change={5.2}
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          color="bg-yellow-500/20"
        />
        <StatCard
          title="Coins Gesamt"
          value={formatNumber(stats.totalCoins)}
          change={12.5}
          icon={<Coins className="w-5 h-5 text-accent" />}
          color="bg-accent/20"
        />
        <StatCard
          title="Achievements"
          value={`${stats.unlockedAchievements}/${stats.totalAchievements}`}
          change={8.3}
          icon={<Award className="w-5 h-5 text-purple-400" />}
          color="bg-purple-500/20"
        />
        <StatCard
          title="Referrals"
          value={stats.totalReferrals}
          change={15.0}
          icon={<Users className="w-5 h-5 text-blue-400" />}
          color="bg-blue-500/20"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coins Chart */}
        <motion.div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-6"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfigs.smooth}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Coins Verlauf</h3>
                <p className="text-sm text-gray-400">Einnahmen & Ausgaben</p>
              </div>
              <Coins className="w-8 h-8 text-accent" />
            </div>
            <div className="h-64 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
              <div className="text-center">
                <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chart wird geladen...</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(stats.coinsEarned)} verdient • {formatNumber(stats.coinsSpent)} ausgegeben
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Drops Chart */}
        <motion.div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-6"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.smooth, delay: 0.1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Drop Performance</h3>
                <p className="text-sm text-gray-400">Gewinne & Teilnahmen</p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
            <div className="h-64 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chart wird geladen...</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.wonDrops} gewonnen von {stats.totalDrops} Drops
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-4 sm:p-5"
          )}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Level</h3>
          <p className="text-2xl font-bold text-white mb-2">{stats.level}</p>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(stats.xp / 1000) * 100}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {stats.xp} / 1000 XP ({stats.xpToNextLevel} bis Level {stats.level + 1})
          </p>
        </motion.div>

        <motion.div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-4 sm:p-5"
          )}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-orange-500/20">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Streak</h3>
          <p className="text-2xl font-bold text-white">{stats.streak} Tage</p>
          <p className="text-xs text-gray-400 mt-2">Tägliche Logins in Folge</p>
        </motion.div>

        <motion.div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl",
            "p-4 sm:p-5"
          )}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-cyan-500/20">
              <Trophy className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <h3 className="text-sm text-gray-400 mb-1">Rang</h3>
          <p className="text-2xl font-bold text-white">#{stats.rank || 'N/A'}</p>
          <p className="text-xs text-gray-400 mt-2">Deine Position im Leaderboard</p>
        </motion.div>
      </div>
    </div>
  );
});

StatsDashboard.displayName = 'StatsDashboard';

