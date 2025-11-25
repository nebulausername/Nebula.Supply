// 📊 CONTEST ANALYTICS VIEW - Detaillierte Metriken & Charts!

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Trophy,
  BarChart3,
  Activity,
  Clock,
  Award,
  Target,
  Zap
} from 'lucide-react';
import type { ContestAdminConfig } from './ContestAdminPanel';

// Simple cn utility
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface AnalyticsData {
  participantGrowth: Array<{ date: string; count: number }>;
  scoreDistribution: Array<{ range: string; count: number }>;
  topParticipants: Array<{
    rank: number;
    name: string;
    score: number;
    cookies: number;
    achievements: number;
  }>;
  averageScore: number;
  medianScore: number;
  standardDeviation: number;
  activityHeatmap: Array<{ hour: number; day: string; participants: number }>;
  retentionRate: number;
  peakHours: Array<{ hour: number; participants: number }>;
}

interface ContestAnalyticsViewProps {
  contest: ContestAdminConfig;
}

// 📊 CONTEST ANALYTICS VIEW - MAXIMIERT & PREMIUM!
export const ContestAnalyticsView = ({ contest }: ContestAnalyticsViewProps) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | 'all'>('all');

  // Mock analytics data - wird später durch API ersetzt
  const analyticsData: AnalyticsData = useMemo(() => {
    // Generate mock participant growth data
    const growth = [];
    const startDate = new Date(contest.startDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= Math.min(daysDiff, 30); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      growth.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(contest.participantCount * (i / Math.max(daysDiff, 1)) * (0.7 + Math.random() * 0.3))
      });
    }

    // Score distribution
    const distribution = [
      { range: '0-100K', count: Math.floor(contest.participantCount * 0.35) },
      { range: '100K-500K', count: Math.floor(contest.participantCount * 0.30) },
      { range: '500K-1M', count: Math.floor(contest.participantCount * 0.20) },
      { range: '1M-5M', count: Math.floor(contest.participantCount * 0.10) },
      { range: '5M+', count: Math.floor(contest.participantCount * 0.05) },
    ];

    // Top participants
    const topParticipants = Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      name: `Player${i + 1}`,
      score: 1000000 - (i * 50000) + Math.random() * 10000,
      cookies: 50000000 - (i * 2500000),
      achievements: 18 - i,
    }));

    // Activity heatmap (mock)
    const heatmap = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let hour = 0; hour < 24; hour++) {
      for (const day of days) {
        heatmap.push({
          hour,
          day,
          participants: Math.floor(Math.random() * 100 + (hour >= 18 && hour <= 22 ? 50 : 0))
        });
      }
    }

    // Peak hours
    const peakHours = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      participants: Math.floor(Math.random() * 150 + (hour >= 18 && hour <= 22 ? 80 : 0))
    })).sort((a, b) => b.participants - a.participants).slice(0, 5);

    return {
      participantGrowth: growth,
      scoreDistribution: distribution,
      topParticipants,
      averageScore: 750000,
      medianScore: 450000,
      standardDeviation: 325000,
      activityHeatmap: heatmap,
      retentionRate: 0.68,
      peakHours,
    };
  }, [contest]);

  // Simple Bar Chart Component (CSS-based)
  const SimpleBarChart = ({ data, height = 200 }: { data: Array<{ label: string; value: number }>; height?: number }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 flex items-end gap-2">
          {data.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full relative">
                <motion.div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
              </div>
              <span className="text-xs text-white/60">{item.value.toLocaleString()}</span>
              <span className="text-xs text-white/40 text-center">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simple Line Chart Component
  const SimpleLineChart = ({ data, height = 200 }: { data: Array<{ date: string; count: number }>; height?: number }) => {
    const maxValue = Math.max(...data.map(d => d.count));
    const points = data.map((item, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 100 - (item.count / maxValue) * 100,
      value: item.count
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d={`${pathD} L 100 100 L 0 100 Z`}
            fill="url(#lineGradient)"
            className="stroke-blue-400 stroke-2"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="0.5"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="0.8"
              fill="#60a5fa"
            />
          ))}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-white/40 px-2">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  // Heatmap Component
  const Heatmap = ({ data }: { data: Array<{ hour: number; day: string; participants: number }> }) => {
    const maxValue = Math.max(...data.map(d => d.participants));
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, dayIdx) => (
          <div key={day} className="flex flex-col gap-1">
            <div className="text-xs text-white/40 text-center mb-1">{day}</div>
            {Array.from({ length: 24 }, (_, hour) => {
              const item = data.find(d => d.day === day && d.hour === hour);
              const intensity = item ? item.participants / maxValue : 0;
              
              return (
                <div
                  key={hour}
                  className="w-4 h-4 rounded"
                  style={{
                    backgroundColor: `rgba(59, 130, 246, ${Math.max(0.1, intensity)})`,
                  }}
                  title={`${day} ${hour}:00 - ${item?.participants || 0} participants`}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Contest Analytics
          </h2>
          <p className="text-white/60 text-sm mt-1">{contest.name}</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                selectedTimeRange === range
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              {range === '7d' ? '7 Tage' : range === '30d' ? '30 Tage' : 'Alle'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{contest.participantCount.toLocaleString()}</div>
          <div className="text-xs text-white/60">Teilnehmer</div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            <Target className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analyticsData.averageScore.toLocaleString()}
          </div>
          <div className="text-xs text-white/60">Durchschnitts-Score</div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-green-500/30 bg-green-500/10 p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-green-400" />
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(analyticsData.retentionRate * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-white/60">Retention Rate</div>
        </motion.div>

        <motion.div
          className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analyticsData.peakHours[0]?.hour || 0}:00
          </div>
          <div className="text-xs text-white/60">Peak Hour</div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participant Growth Chart */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Teilnehmer-Wachstum
          </h3>
          <SimpleLineChart data={analyticsData.participantGrowth} height={200} />
        </div>

        {/* Score Distribution */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Score-Verteilung
          </h3>
          <SimpleBarChart
            data={analyticsData.scoreDistribution.map(d => ({
              label: d.range,
              value: d.count
            }))}
            height={200}
          />
        </div>
      </div>

      {/* Top Participants & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Participants */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            Top 10 Teilnehmer
          </h3>
          <div className="space-y-2">
            {analyticsData.topParticipants.map((participant, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    i === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    i === 1 ? "bg-gray-400/20 text-gray-400" :
                    i === 2 ? "bg-orange-500/20 text-orange-400" :
                    "bg-white/10 text-white/60"
                  )}>
                    {participant.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{participant.name}</div>
                    <div className="text-xs text-white/60">
                      {participant.cookies.toLocaleString()} Cookies · {participant.achievements} Achievements
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-400">
                  {participant.score.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Statistics & Activity Heatmap */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Statistiken
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Durchschnitts-Score</span>
                <span className="font-bold text-white">{analyticsData.averageScore.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Median Score</span>
                <span className="font-bold text-white">{analyticsData.medianScore.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Standardabweichung</span>
                <span className="font-bold text-white">{analyticsData.standardDeviation.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Retention Rate</span>
                <span className="font-bold text-green-400">{(analyticsData.retentionRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Aktivitäts-Heatmap
            </h3>
            <div className="flex items-center gap-4">
              <Heatmap data={analyticsData.activityHeatmap} />
              <div className="flex flex-col gap-2">
                <div className="text-xs text-white/60">Legende</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500/10" />
                    <span className="text-xs text-white/60">Wenig</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500/50" />
                    <span className="text-xs text-white/60">Mittel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500" />
                    <span className="text-xs text-white/60">Hoch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Peak Hours */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-400" />
          Peak Hours
        </h3>
        <div className="flex items-center gap-4">
          {analyticsData.peakHours.map((peak, i) => (
            <div key={i} className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60 text-sm">{peak.hour}:00</span>
                <span className="font-bold text-white">{peak.participants}</span>
              </div>
              <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(peak.participants / analyticsData.peakHours[0].participants) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

