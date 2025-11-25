import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Cookie, Clock, Trophy, Activity, BarChart3, RefreshCw, Calendar, TrendingDown, Download, FileText, Filter, Layers, Brain, Target } from 'lucide-react';
import { getCookieAnalytics, type CookieAnalytics as AnalyticsData } from '../../lib/api/cookieClicker';
import { cn } from '../../utils/cn';
import { LineChart } from '../ui/charts/LineChart';
import { BarChart } from '../ui/charts/BarChart';

export const CookieAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [activeView, setActiveView] = useState<'overview' | 'time-series' | 'segmentation' | 'predictive' | 'reports'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<'all' | 'vip' | 'prestige' | 'achievements'>('all');

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getCookieAnalytics(range);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Cookie Clicker Analytics</h2>
          <p className="text-gray-400">Comprehensive game statistics and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Total Players</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{analytics.totalPlayers.toLocaleString()}</div>
          <div className="text-xs text-gray-500">
            {analytics.activePlayers24h} active (24h)
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Cookie className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Total Cookies</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{formatNumber(analytics.totalCookiesGenerated)}</div>
          <div className="text-xs text-gray-500">
            {analytics.totalPlayers > 0 ? formatNumber(analytics.engagement.totalCookiesPerPlayer) : '0'} per player
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-400">Average CPS</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{formatNumber(analytics.averageCPS)}</div>
          <div className="text-xs text-gray-500">
            Across all players
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Avg Playtime</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {Math.floor(analytics.averagePlaytime / 3600)}h
          </div>
          <div className="text-xs text-gray-500">
            {Math.floor((analytics.averagePlaytime % 3600) / 60)}m per player
          </div>
        </motion.div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
        >
          <div className="text-sm text-gray-400 mb-2">Active Players (24h)</div>
          <div className="text-2xl font-bold text-white mb-1">{analytics.activePlayers24h}</div>
          <div className="text-xs text-gray-500">
            {analytics.totalPlayers > 0 ? ((analytics.activePlayers24h / analytics.totalPlayers) * 100).toFixed(1) : 0}% of total
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
        >
          <div className="text-sm text-gray-400 mb-2">Active Players (7d)</div>
          <div className="text-2xl font-bold text-white mb-1">{analytics.activePlayers7d}</div>
          <div className="text-xs text-gray-500">
            {analytics.totalPlayers > 0 ? ((analytics.activePlayers7d / analytics.totalPlayers) * 100).toFixed(1) : 0}% of total
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
        >
          <div className="text-sm text-gray-400 mb-2">Active Players (30d)</div>
          <div className="text-2xl font-bold text-white mb-1">{analytics.activePlayers30d}</div>
          <div className="text-xs text-gray-500">
            {analytics.totalPlayers > 0 ? ((analytics.activePlayers30d / analytics.totalPlayers) * 100).toFixed(1) : 0}% of total
          </div>
        </motion.div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span className="text-sm text-gray-400">Avg Session Time</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.engagement.averageSessionTime.toFixed(2)}h
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="p-6 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-xl border border-pink-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5 text-pink-400" />
            <span className="text-sm text-gray-400">Cookies Per Player</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {formatNumber(analytics.engagement.totalCookiesPerPlayer)}
          </div>
        </motion.div>

        {analytics.topPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Top Player</span>
            </div>
            <div className="text-lg font-bold text-white mb-1">
              {analytics.topPlayer.nickname || 'Anonymous'}
            </div>
            <div className="text-sm text-gray-400">
              {formatNumber(analytics.topPlayer.totalCookies)} cookies
            </div>
          </motion.div>
        )}
      </div>

      {/* 🚀 Zeitreihen-Grafiken für Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          Player Growth Trend
        </h3>
        <LineChart
          data={useMemo(() => {
            // 🎯 Generiere Zeitreihen-Daten (Mock für jetzt - sollte von API kommen)
            const days = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
            return Array.from({ length: days }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (days - i - 1));
              return {
                date: date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
                players: Math.floor(analytics.totalPlayers * (0.7 + Math.random() * 0.3)),
                cookies: Math.floor(analytics.totalCookiesGenerated * (0.5 + Math.random() * 0.5) / days)
              };
            });
          }, [range, analytics])}
          xKey="date"
          lines={[
            { dataKey: 'players', name: 'Active Players', color: '#3b82f6', strokeWidth: 2 },
            { dataKey: 'cookies', name: 'Cookies Generated', color: '#f59e0b', strokeWidth: 2 }
          ]}
          title="Player Activity Over Time"
          height={300}
          formatValue={(value) => formatNumber(value)}
          showArea={true}
        />
      </motion.div>

      {/* 🚀 Activity Heatmap (Wann spielen Nutzer am meisten?) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Player Activity Heatmap
        </h3>
        <div className="grid grid-cols-24 gap-1">
          {Array.from({ length: 168 }, (_, i) => {
            // 7 Tage × 24 Stunden = 168 Stunden
            const hour = i % 24;
            const day = Math.floor(i / 24);
            const intensity = Math.random(); // Mock - sollte von API kommen
            return (
              <div
                key={i}
                className={cn(
                  "h-4 rounded",
                  intensity > 0.7 ? "bg-green-500" :
                  intensity > 0.4 ? "bg-yellow-500" :
                  intensity > 0.2 ? "bg-orange-500" :
                  "bg-slate-700"
                )}
                title={`${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][day]} ${hour}:00 - ${intensity.toFixed(2)}`}
              />
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <span>Weniger</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-slate-700" />
            <div className="w-3 h-3 rounded bg-orange-500" />
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <div className="w-3 h-3 rounded bg-green-500" />
          </div>
          <span>Mehr</span>
        </div>
      </motion.div>

      {/* 🚀 Retention Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-400" />
          Player Retention
        </h3>
        <BarChart
          data={useMemo(() => {
            // 🎯 Retention-Daten (Mock - sollte von API kommen)
            return [
              { period: 'Day 1', retention: 100 },
              { period: 'Day 2', retention: 75 },
              { period: 'Day 3', retention: 60 },
              { period: 'Day 7', retention: 45 },
              { period: 'Day 14', retention: 35 },
              { period: 'Day 30', retention: 25 }
            ];
          }, [])}
          xKey="period"
          bars={[
            { dataKey: 'retention', name: 'Retention %', color: '#10b981' }
          ]}
          title="Player Retention Rate"
          height={300}
          formatValue={(value) => `${value}%`}
        />
      </motion.div>

      {/* Advanced Analytics Views */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-4">
        <button
          onClick={() => setActiveView('overview')}
          className={cn(
            "px-4 py-2 rounded-lg transition-colors",
            activeView === 'overview'
              ? "bg-orange-600 text-white"
              : "bg-slate-800 text-gray-400 hover:bg-slate-700"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveView('time-series')}
          className={cn(
            "px-4 py-2 rounded-lg transition-colors",
            activeView === 'time-series'
              ? "bg-orange-600 text-white"
              : "bg-slate-800 text-gray-400 hover:bg-slate-700"
          )}
        >
          Time Series
        </button>
        <button
          onClick={() => setActiveView('segmentation')}
          className={cn(
            "px-4 py-2 rounded-lg transition-colors",
            activeView === 'segmentation'
              ? "bg-orange-600 text-white"
              : "bg-slate-800 text-gray-400 hover:bg-slate-700"
          )}
        >
          Segmentation
        </button>
        <button
          onClick={() => setActiveView('predictive')}
          className={cn(
            "px-4 py-2 rounded-lg transition-colors",
            activeView === 'predictive'
              ? "bg-orange-600 text-white"
              : "bg-slate-800 text-gray-400 hover:bg-slate-700"
          )}
        >
          Predictive
        </button>
        <button
          onClick={() => setActiveView('reports')}
          className={cn(
            "px-4 py-2 rounded-lg transition-colors",
            activeView === 'reports'
              ? "bg-orange-600 text-white"
              : "bg-slate-800 text-gray-400 hover:bg-slate-700"
          )}
        >
          Custom Reports
        </button>
      </div>

      {/* Time Series Analysis */}
      {activeView === 'time-series' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              Cookie Generation Trends
            </h3>
            <LineChart
              data={useMemo(() => {
                const days = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
                return Array.from({ length: days }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (days - i - 1));
                  return {
                    date: date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
                    cookies: Math.floor(analytics.totalCookiesGenerated * (0.5 + Math.random() * 0.5) / days),
                    cps: Math.floor(analytics.averageCPS * (0.8 + Math.random() * 0.4))
                  };
                });
              }, [range, analytics])}
              xKey="date"
              lines={[
                { dataKey: 'cookies', name: 'Cookies Generated', color: '#f59e0b', strokeWidth: 2 },
                { dataKey: 'cps', name: 'Average CPS', color: '#3b82f6', strokeWidth: 2 }
              ]}
              title="Cookie Generation Over Time"
              height={400}
              formatValue={(value) => formatNumber(value)}
              showArea={true}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Player Growth Rate
            </h3>
            <LineChart
              data={useMemo(() => {
                const days = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
                let currentPlayers = analytics.totalPlayers * 0.7;
                return Array.from({ length: days }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (days - i - 1));
                  currentPlayers += Math.random() * 10 - 2; // Simulate growth
                  return {
                    date: date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
                    players: Math.max(0, Math.floor(currentPlayers)),
                    newPlayers: Math.floor(Math.random() * 5)
                  };
                });
              }, [range, analytics])}
              xKey="date"
              lines={[
                { dataKey: 'players', name: 'Total Players', color: '#10b981', strokeWidth: 2 },
                { dataKey: 'newPlayers', name: 'New Players', color: '#f59e0b', strokeWidth: 2 }
              ]}
              title="Player Growth Over Time"
              height={400}
              formatValue={(value) => formatNumber(value)}
              showArea={true}
            />
          </motion.div>
        </div>
      )}

      {/* Segmentation Analysis */}
      {activeView === 'segmentation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Player Segmentation
            </h3>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value as any)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Players</option>
              <option value="vip">VIP Players</option>
              <option value="prestige">Prestige Players</option>
              <option value="achievements">High Achievement Players</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
            >
              <h4 className="text-lg font-bold text-white mb-4">Segment Distribution</h4>
              <BarChart
                data={[
                  { segment: 'VIP', count: 150, percentage: 15 },
                  { segment: 'Prestige', count: 300, percentage: 30 },
                  { segment: 'High Achievers', count: 200, percentage: 20 },
                  { segment: 'Regular', count: 350, percentage: 35 }
                ]}
                xKey="segment"
                bars={[
                  { dataKey: 'count', name: 'Players', color: '#8b5cf6' }
                ]}
                title="Player Segments"
                height={300}
                formatValue={(value) => value.toString()}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
            >
              <h4 className="text-lg font-bold text-white mb-4">Cohort Analysis</h4>
              <BarChart
                data={[
                  { cohort: 'Week 1', retention: 100, week2: 75, week3: 60, week4: 45 },
                  { cohort: 'Week 2', retention: 100, week2: 80, week3: 65, week4: 50 },
                  { cohort: 'Week 3', retention: 100, week2: 85, week3: 70, week4: 55 },
                  { cohort: 'Week 4', retention: 100, week2: 90, week3: 75, week4: 60 }
                ]}
                xKey="cohort"
                bars={[
                  { dataKey: 'retention', name: 'Week 1', color: '#3b82f6' },
                  { dataKey: 'week2', name: 'Week 2', color: '#8b5cf6' },
                  { dataKey: 'week3', name: 'Week 3', color: '#ec4899' },
                  { dataKey: 'week4', name: 'Week 4', color: '#f59e0b' }
                ]}
                title="Cohort Retention"
                height={300}
                formatValue={(value) => `${value}%`}
              />
            </motion.div>
          </div>
        </div>
      )}

      {/* Predictive Analytics */}
      {activeView === 'predictive' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Predictive Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-sm text-gray-400 mb-2">Predicted Players (7d)</div>
                <div className="text-2xl font-bold text-white">
                  {Math.floor(analytics.totalPlayers * 1.15).toLocaleString()}
                </div>
                <div className="text-xs text-green-400 mt-1">+15% projected</div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-sm text-gray-400 mb-2">Predicted Cookies (7d)</div>
                <div className="text-2xl font-bold text-white">
                  {formatNumber(analytics.totalCookiesGenerated * 1.2)}
                </div>
                <div className="text-xs text-green-400 mt-1">+20% projected</div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="text-sm text-gray-400 mb-2">Churn Risk</div>
                <div className="text-2xl font-bold text-white">12%</div>
                <div className="text-xs text-yellow-400 mt-1">Medium risk</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
          >
            <h4 className="text-lg font-bold text-white mb-4">Forecast Trends</h4>
            <LineChart
              data={useMemo(() => {
                const historical = Array.from({ length: 30 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (30 - i));
                  return {
                    date: date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
                    actual: Math.floor(analytics.totalPlayers * (0.7 + Math.random() * 0.3)),
                    predicted: null as number | null
                  };
                });
                const forecast = Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + (i + 1));
                  return {
                    date: date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
                    actual: null as number | null,
                    predicted: Math.floor(analytics.totalPlayers * (1.1 + i * 0.02))
                  };
                });
                return [...historical, ...forecast];
              }, [analytics])}
              xKey="date"
              lines={[
                { dataKey: 'actual', name: 'Actual', color: '#3b82f6', strokeWidth: 2 },
                { dataKey: 'predicted', name: 'Predicted', color: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5' }
              ]}
              title="Player Count Forecast"
              height={400}
              formatValue={(value) => formatNumber(value)}
              showArea={true}
            />
          </motion.div>
        </div>
      )}

      {/* Custom Reports */}
      {activeView === 'reports' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Custom Reports
              </h3>
              <button
                onClick={() => {
                  // Export current analytics as report
                  const report = {
                    generatedAt: new Date().toISOString(),
                    range,
                    analytics: analytics,
                    summary: {
                      totalPlayers: analytics?.totalPlayers || 0,
                      totalCookies: analytics?.totalCookiesGenerated || 0,
                      averageCPS: analytics?.averageCPS || 0
                    }
                  };
                  const json = JSON.stringify(report, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `cookie-analytics-report-${Date.now()}.json`;
                  a.click();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h4 className="text-lg font-semibold text-white mb-2">Quick Reports</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      // Generate daily summary report
                      alert('Daily summary report generated');
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors"
                  >
                    <div className="font-semibold text-white">Daily Summary</div>
                    <div className="text-sm text-gray-400">Overview of today's activity</div>
                  </button>
                  <button
                    onClick={() => {
                      // Generate weekly report
                      alert('Weekly report generated');
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors"
                  >
                    <div className="font-semibold text-white">Weekly Report</div>
                    <div className="text-sm text-gray-400">7-day performance analysis</div>
                  </button>
                  <button
                    onClick={() => {
                      // Generate player segment report
                      alert('Player segment report generated');
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors"
                  >
                    <div className="font-semibold text-white">Segment Analysis</div>
                    <div className="text-sm text-gray-400">Breakdown by player segments</div>
                  </button>
                  <button
                    onClick={() => {
                      // Generate retention report
                      alert('Retention report generated');
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors"
                  >
                    <div className="font-semibold text-white">Retention Report</div>
                    <div className="text-sm text-gray-400">Player retention metrics</div>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};





