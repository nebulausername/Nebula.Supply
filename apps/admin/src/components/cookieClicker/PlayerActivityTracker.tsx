import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Clock, TrendingUp, AlertTriangle, Map, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useRealtime } from '../../lib/realtime/RealtimeHooks';

interface ActivePlayer {
  userId: string;
  nickname: string | null;
  lastActivity: string;
  sessionDuration: number;
  cookiesGained: number;
  cps: number;
}

interface ActivityData {
  hour: number;
  day: number; // 0-6 (Sunday-Saturday)
  count: number;
}

interface Anomaly {
  userId: string;
  nickname: string | null;
  type: 'suspicious_gain' | 'unusual_cps' | 'rapid_progress' | 'session_anomaly';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: string;
}

export const PlayerActivityTracker = () => {
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [activityHeatmap, setActivityHeatmap] = useState<ActivityData[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  const { isConnected, subscribe } = useRealtime({
    enabled: true
  });

  useEffect(() => {
    loadActivityData();
    const interval = setInterval(loadActivityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  useEffect(() => {
    if (!isConnected || !subscribe) return;

    const unsubscribeActivity = subscribe('cookie:player_activity', (data: any) => {
      if (data.type === 'player_active') {
        setActivePlayers(prev => {
          const existing = prev.find(p => p.userId === data.userId);
          if (existing) {
            return prev.map(p => p.userId === data.userId ? { ...p, ...data } : p);
          }
          return [...prev, data];
        });
      } else if (data.type === 'player_inactive') {
        setActivePlayers(prev => prev.filter(p => p.userId !== data.userId));
      }
    });

    return () => {
      unsubscribeActivity();
    };
  }, [isConnected, subscribe]);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to fetch activity data
      // For now, generate mock data
      const mockActivePlayers: ActivePlayer[] = Array.from({ length: 10 }, (_, i) => ({
        userId: `user-${i}`,
        nickname: `Player${i}`,
        lastActivity: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        sessionDuration: Math.floor(Math.random() * 3600),
        cookiesGained: Math.floor(Math.random() * 1000000),
        cps: Math.random() * 1000
      }));
      setActivePlayers(mockActivePlayers);

      // Generate heatmap data
      const heatmapData: ActivityData[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          heatmapData.push({
            day,
            hour,
            count: Math.floor(Math.random() * 50)
          });
        }
      }
      setActivityHeatmap(heatmapData);

      // Generate anomalies
      const mockAnomalies: Anomaly[] = [
        {
          userId: 'user-1',
          nickname: 'SuspiciousPlayer',
          type: 'suspicious_gain',
          severity: 'high',
          description: 'Unusual cookie gain rate detected',
          timestamp: new Date().toISOString()
        }
      ];
      setAnomalies(mockAnomalies);
    } catch (error) {
      console.error('Failed to load activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getHeatmapColor = (count: number, maxCount: number): string => {
    if (maxCount === 0) return 'bg-slate-800';
    const intensity = count / maxCount;
    if (intensity > 0.8) return 'bg-green-500';
    if (intensity > 0.6) return 'bg-green-400';
    if (intensity > 0.4) return 'bg-yellow-400';
    if (intensity > 0.2) return 'bg-orange-400';
    return 'bg-slate-700';
  };

  const maxHeatmapCount = useMemo(() => {
    return Math.max(...activityHeatmap.map(d => d.count), 1);
  }, [activityHeatmap]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Player Activity Tracker</h2>
          <p className="text-gray-400">Real-time monitoring of player activity and sessions</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            isConnected ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          )}>
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-400" : "bg-red-400")} />
            <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Active Players Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Active Players</span>
          </div>
          <div className="text-3xl font-bold text-white">{activePlayers.length}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Avg Session</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {activePlayers.length > 0
              ? formatTime(Math.floor(activePlayers.reduce((sum, p) => sum + p.sessionDuration, 0) / activePlayers.length))
              : '0m'}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-lg border border-orange-500/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-400">Total Cookies/Hour</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {formatNumber(activePlayers.reduce((sum, p) => sum + p.cookiesGained, 0))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-lg border border-red-500/20"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-400">Anomalies</span>
          </div>
          <div className="text-3xl font-bold text-white">{anomalies.length}</div>
        </motion.div>
      </div>

      {/* Active Players List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-400" />
          Currently Active Players
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Loading active players...</p>
            </div>
          </div>
        ) : activePlayers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No active players at the moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activePlayers.map((player, index) => (
              <motion.div
                key={player.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <div>
                    <div className="font-semibold text-white">{player.nickname || player.userId.slice(0, 8)}</div>
                    <div className="text-sm text-gray-400">
                      Session: {formatTime(player.sessionDuration)} • {formatNumber(player.cookiesGained)} cookies
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{formatNumber(player.cps)}/s</div>
                  <div className="text-xs text-gray-400">
                    {new Date(player.lastActivity).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Heatmap */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Map className="w-5 h-5 text-orange-400" />
          Activity Heatmap (Last 7 Days)
        </h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid grid-cols-25 gap-1">
              {/* Header: Days */}
              <div className="col-span-1" />
              {days.map(day => (
                <div key={day} className="text-xs text-gray-400 text-center py-2 font-medium">
                  {day}
                </div>
              ))}
              {/* Rows: Hours */}
              {hours.map(hour => (
                <React.Fragment key={hour}>
                  <div className="text-xs text-gray-400 py-1 pr-2 text-right">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {days.map((_, dayIndex) => {
                    const data = activityHeatmap.find(d => d.day === dayIndex && d.hour === hour);
                    const count = data?.count || 0;
                    return (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className={cn(
                          "w-full aspect-square rounded border border-slate-700/50 transition-all hover:scale-110 cursor-pointer",
                          getHeatmapColor(count, maxHeatmapCount)
                        )}
                        title={`${days[dayIndex]} ${hour}:00 - ${count} players`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-700 rounded" />
            <span>Less</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Detected Anomalies
          </h3>
          <div className="space-y-3">
            {anomalies.map((anomaly, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border",
                  anomaly.severity === 'high' ? "bg-red-500/10 border-red-500/30" :
                  anomaly.severity === 'medium' ? "bg-yellow-500/10 border-yellow-500/30" :
                  "bg-orange-500/10 border-orange-500/30"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-semibold",
                      anomaly.severity === 'high' ? "bg-red-500/20 text-red-400" :
                      anomaly.severity === 'medium' ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-orange-500/20 text-orange-400"
                    )}>
                      {anomaly.severity.toUpperCase()}
                    </span>
                    <span className="font-semibold text-white">{anomaly.nickname || anomaly.userId}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(anomaly.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{anomaly.description}</p>
                <p className="text-xs text-gray-500 mt-1">Type: {anomaly.type.replace(/_/g, ' ')}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

