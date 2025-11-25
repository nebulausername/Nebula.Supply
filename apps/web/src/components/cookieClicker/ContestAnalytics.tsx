// 📊 CONTEST ANALYTICS - Charts & Statistics Dashboard!

import { useState, useEffect, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useCookieClickerStore } from '../../store/cookieClicker';
import {
  TrendingUp,
  Users,
  Trophy,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/cookieFormatters';
import { formatScore } from '../../utils/contestScoring';
import { calculateContestScore, type ScoringFactors } from '../../utils/contestScoring';

interface AnalyticsData {
  playerPerformance: {
    currentScore: number;
    rank: number;
    scoreHistory: Array<{ date: string; score: number }>;
    rankHistory: Array<{ date: string; rank: number }>;
  };
  participationTrends: {
    dailyActive: number[];
    hourlyActive: number[];
    peakHours: number[];
  };
  prizeStatistics: {
    totalPrizesAwarded: number;
    averagePrizeValue: number;
    topPrizeWinners: Array<{ name: string; prize: number }>;
  };
  historicalData: {
    previousContests: Array<{
      contestId: string;
      participants: number;
      winner: string;
      topScore: number;
    }>;
  };
}

// 📊 CONTEST ANALYTICS COMPONENT - MAXIMIERT & GEIL!
export const ContestAnalytics = memo(() => {
  const {
    totalCookies,
    unlockedAchievements,
    buildings,
    cookiesPerSecond,
    totalActiveTime,
    clicks,
    level,
    coins
  } = useCookieClickerStore();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week');
  
  // Calculate current player performance
  const playerPerformance = useMemo(() => {
    const scoringFactors: ScoringFactors = {
      totalCookies,
      achievements: unlockedAchievements.length,
      buildings,
      cookiesPerSecond,
      activeTime: totalActiveTime,
      clicks,
      level,
    };
    
    const scoreResult = calculateContestScore(scoringFactors);
    
    return {
      currentScore: scoreResult.totalScore,
      baseScore: scoreResult.baseScore,
      bonuses: scoreResult.bonuses,
      breakdown: scoreResult.breakdown,
      rank: 0, // Would come from API
    };
  }, [totalCookies, unlockedAchievements.length, buildings, cookiesPerSecond, totalActiveTime, clicks, level]);
  
  // Mock analytics data (in production, would come from API)
  useEffect(() => {
    const mockData: AnalyticsData = {
      playerPerformance: {
        currentScore: playerPerformance.currentScore,
        rank: 125,
        scoreHistory: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
          score: playerPerformance.currentScore * (0.7 + Math.random() * 0.3),
        })),
        rankHistory: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
          rank: 125 - i * 5 + Math.floor(Math.random() * 10),
        })),
      },
      participationTrends: {
        dailyActive: Array.from({ length: 7 }, () => Math.floor(Math.random() * 500) + 200),
        hourlyActive: Array.from({ length: 24 }, () => Math.floor(Math.random() * 100) + 50),
        peakHours: [12, 13, 14, 18, 19, 20],
      },
      prizeStatistics: {
        totalPrizesAwarded: 45,
        averagePrizeValue: 8500,
        topPrizeWinners: [
          { name: 'CookieMaster2024', prize: 50000 },
          { name: 'KeksKönig', prize: 30000 },
          { name: 'SchokoLord', prize: 20000 },
        ],
      },
      historicalData: {
        previousContests: [
          {
            contestId: 'monthly-2024-01',
            participants: 1245,
            winner: 'CookieMaster2024',
            topScore: 15234567890,
          },
          {
            contestId: 'monthly-2024-02',
            participants: 1389,
            winner: 'KeksKönig',
            topScore: 18902345678,
          },
        ],
      },
    };
    
    setAnalyticsData(mockData);
  }, [playerPerformance.currentScore]);
  
  if (!analyticsData) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="animate-pulse text-white/60">Lade Analytics...</div>
      </div>
    );
  }
  
  const maxScore = Math.max(...analyticsData.playerPerformance.scoreHistory.map(h => h.score), playerPerformance.currentScore);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">📊 Contest Analytics</h2>
            <p className="text-white/60 text-sm">Detaillierte Statistiken und Trends</p>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map((timeframe) => (
            <motion.button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                selectedTimeframe === timeframe
                  ? "bg-blue-500 text-white"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {timeframe === 'day' ? 'Tag' : timeframe === 'week' ? 'Woche' : 'Monat'}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Score */}
        <motion.div
          className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium">Aktueller Score</span>
            </div>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Trophy className="w-5 h-5 text-yellow-400" />
            </motion.div>
          </div>
          <motion.div
            className="text-3xl font-bold text-white mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {formatScore(playerPerformance.currentScore)}
          </motion.div>
          <div className="text-xs text-white/60">
            Rank: #{analyticsData.playerPerformance.rank}
          </div>
        </motion.div>
        
        {/* Score Breakdown */}
        <motion.div
          className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-purple-400">
              <PieChart className="w-5 h-5" />
              <span className="text-sm font-medium">Score Breakdown</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Cookies:</span>
              <span className="text-white font-semibold">{formatScore(playerPerformance.breakdown.cookies)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Achievements:</span>
              <span className="text-white font-semibold">{formatScore(playerPerformance.breakdown.achievements)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Efficiency:</span>
              <span className="text-white font-semibold">{formatScore(playerPerformance.breakdown.efficiency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Bonuses:</span>
              <span className="text-yellow-400 font-semibold">+{formatScore(playerPerformance.breakdown.bonuses)}</span>
            </div>
          </div>
        </motion.div>
        
        {/* Active Players */}
        <motion.div
          className="rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-green-400">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Aktive Spieler</span>
            </div>
          </div>
          <motion.div
            className="text-3xl font-bold text-white mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {analyticsData.participationTrends.dailyActive.reduce((a, b) => a + b, 0).toLocaleString()}
          </motion.div>
          <div className="text-xs text-white/60">
            Letzte 7 Tage
          </div>
        </motion.div>
      </div>
      
      {/* Score History Chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          Score Verlauf
        </h3>
        <div className="h-48 flex items-end gap-2">
          {analyticsData.playerPerformance.scoreHistory.map((entry, index) => {
            const height = (entry.score / maxScore) * 100;
            return (
              <motion.div
                key={index}
                className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="text-xs text-white/60 text-center mt-2">
                  {new Date(entry.date).getDate()}.{new Date(entry.date).getMonth() + 1}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Prize Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Preis Statistiken
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/60">Vergebene Preise:</span>
              <span className="text-white font-semibold">{analyticsData.prizeStatistics.totalPrizesAwarded}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Durchschnittlicher Wert:</span>
              <span className="text-yellow-400 font-semibold">{formatNumber(analyticsData.prizeStatistics.averagePrizeValue)} Coins</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Peak Hours
          </h3>
          <div className="space-y-2">
            {analyticsData.participationTrends.peakHours.map((hour) => (
              <div key={hour} className="flex items-center gap-2">
                <div className="w-16 text-white/60 text-sm">{hour}:00</div>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(analyticsData.participationTrends.hourlyActive[hour] / 100) * 100}%` }}
                    transition={{ delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Historical Data */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Vorherige Contests
        </h3>
        <div className="space-y-3">
          {analyticsData.historicalData.previousContests.map((contest, index) => (
            <motion.div
              key={contest.contestId}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div>
                <div className="font-semibold text-white">{contest.contestId}</div>
                <div className="text-sm text-white/60">
                  Gewinner: {contest.winner} • {contest.participants} Teilnehmer
                </div>
              </div>
              <div className="text-right">
                <div className="text-yellow-400 font-bold">{formatScore(contest.topScore)}</div>
                <div className="text-xs text-white/60">Top Score</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

ContestAnalytics.displayName = 'ContestAnalytics';

