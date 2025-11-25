import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, BarChart3, Activity, Calendar, Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface RankHistory {
  userId: string;
  nickname: string | null;
  history: Array<{
    date: string;
    rank: number;
    value: number;
  }>;
}

interface Top10History {
  date: string;
  top10: Array<{
    userId: string;
    nickname: string | null;
    rank: number;
    value: number;
  }>;
}

interface RankDistribution {
  rankRange: string;
  playerCount: number;
  percentage: number;
}

interface CompetitiveHeatmapData {
  userId: string;
  nickname: string | null;
  rank: number;
  change: number;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

export const LeaderboardVisualizations = () => {
  const [activeTab, setActiveTab] = useState<'rank-history' | 'top10-history' | 'distribution' | 'heatmap'>('rank-history');
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Mock data - in production, fetch from API
  const [rankHistory, setRankHistory] = useState<RankHistory[]>([]);
  const [top10History, setTop10History] = useState<Top10History[]>([]);
  const [rankDistribution, setRankDistribution] = useState<RankDistribution[]>([]);
  const [heatmapData, setHeatmapData] = useState<CompetitiveHeatmapData[]>([]);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: Implement API calls
      // Mock data for demonstration
      setRankHistory([
        {
          userId: '1',
          nickname: 'Player1',
          history: [
            { date: '2024-01-01', rank: 10, value: 1000 },
            { date: '2024-01-08', rank: 8, value: 1500 },
            { date: '2024-01-15', rank: 5, value: 2000 },
            { date: '2024-01-22', rank: 3, value: 2500 },
            { date: '2024-01-29', rank: 2, value: 3000 }
          ]
        },
        {
          userId: '2',
          nickname: 'Player2',
          history: [
            { date: '2024-01-01', rank: 5, value: 2000 },
            { date: '2024-01-08', rank: 3, value: 2500 },
            { date: '2024-01-15', rank: 1, value: 3000 },
            { date: '2024-01-22', rank: 1, value: 3500 },
            { date: '2024-01-29', rank: 1, value: 4000 }
          ]
        }
      ]);

      setTop10History([
        {
          date: '2024-01-01',
          top10: Array.from({ length: 10 }, (_, i) => ({
            userId: `${i + 1}`,
            nickname: `Player${i + 1}`,
            rank: i + 1,
            value: 1000 - i * 50
          }))
        },
        {
          date: '2024-01-15',
          top10: Array.from({ length: 10 }, (_, i) => ({
            userId: `${i + 1}`,
            nickname: `Player${i + 1}`,
            rank: i + 1,
            value: 2000 - i * 100
          }))
        },
        {
          date: '2024-01-29',
          top10: Array.from({ length: 10 }, (_, i) => ({
            userId: `${i + 1}`,
            nickname: `Player${i + 1}`,
            rank: i + 1,
            value: 3000 - i * 150
          }))
        }
      ]);

      setRankDistribution([
        { rankRange: '1-10', playerCount: 10, percentage: 5 },
        { rankRange: '11-50', playerCount: 40, percentage: 20 },
        { rankRange: '51-100', playerCount: 50, percentage: 25 },
        { rankRange: '101-500', playerCount: 400, percentage: 20 },
        { rankRange: '501-1000', playerCount: 500, percentage: 25 },
        { rankRange: '1000+', playerCount: 1000, percentage: 5 }
      ]);

      setHeatmapData([
        { userId: '1', nickname: 'Player1', rank: 1, change: 2, value: 4000, trend: 'up' },
        { userId: '2', nickname: 'Player2', rank: 2, change: -1, value: 3500, trend: 'down' },
        { userId: '3', nickname: 'Player3', rank: 3, change: 0, value: 3000, trend: 'stable' },
        { userId: '4', nickname: 'Player4', rank: 4, change: 3, value: 2800, trend: 'up' },
        { userId: '5', nickname: 'Player5', rank: 5, change: -2, value: 2500, trend: 'down' }
      ]);
    } catch (error) {
      console.error('Failed to load visualization data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Leaderboard Visualizations</h2>
          <p className="text-gray-400">Visualize leaderboard trends, distributions, and competitive dynamics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('rank-history')}
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === 'rank-history'
              ? "bg-slate-800 text-orange-400 border-b-2 border-orange-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Rank History
        </button>
        <button
          onClick={() => setActiveTab('top10-history')}
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === 'top10-history'
              ? "bg-slate-800 text-orange-400 border-b-2 border-orange-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Top 10 History
        </button>
        <button
          onClick={() => setActiveTab('distribution')}
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === 'distribution'
              ? "bg-slate-800 text-orange-400 border-b-2 border-orange-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Rank Distribution
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === 'heatmap'
              ? "bg-slate-800 text-orange-400 border-b-2 border-orange-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          <Activity className="w-4 h-4 inline mr-2" />
          Competitive Heatmap
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading visualization data...</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'rank-history' && <RankHistoryView data={rankHistory} selectedPlayer={selectedPlayer} onSelectPlayer={setSelectedPlayer} />}
          {activeTab === 'top10-history' && <Top10HistoryView data={top10History} />}
          {activeTab === 'distribution' && <RankDistributionView data={rankDistribution} />}
          {activeTab === 'heatmap' && <CompetitiveHeatmapView data={heatmapData} />}
        </>
      )}
    </div>
  );
};

// Rank History Component
const RankHistoryView = ({ 
  data, 
  selectedPlayer, 
  onSelectPlayer 
}: { 
  data: RankHistory[]; 
  selectedPlayer: string | null; 
  onSelectPlayer: (id: string | null) => void;
}) => {
  const maxRank = Math.max(...data.flatMap(d => d.history.map(h => h.rank)));
  const minRank = Math.min(...data.flatMap(d => d.history.map(h => h.rank)));

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Player Rank Evolution</h3>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => onSelectPlayer(null)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              selectedPlayer === null
                ? "bg-orange-600 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            )}
          >
            All Players
          </button>
          {data.map(player => (
            <button
              key={player.userId}
              onClick={() => onSelectPlayer(player.userId)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                selectedPlayer === player.userId
                  ? "bg-orange-600 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              )}
            >
              {player.nickname || player.userId}
            </button>
          ))}
        </div>
        <div className="h-64 relative">
          {/* Simple line chart visualization */}
          <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
            {data
              .filter(p => !selectedPlayer || p.userId === selectedPlayer)
              .map((player, idx) => (
                <div key={player.userId} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    {player.history.map((point, i) => {
                      const height = ((maxRank - point.rank + 1) / (maxRank - minRank + 1)) * 100;
                      return (
                        <div
                          key={i}
                          className="w-full bg-orange-500/30 rounded-t transition-all"
                          style={{ height: `${height}%` }}
                          title={`Rank ${point.rank} on ${point.date}`}
                        />
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    {player.nickname || player.userId}
                  </div>
                </div>
              ))}
          </div>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between py-4 text-xs text-gray-400">
            <span>Rank {minRank}</span>
            <span>Rank {maxRank}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Top 10 History Component
const Top10HistoryView = ({ data }: { data: Top10History[] }) => {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Top 10 Evolution Over Time</h3>
        <div className="space-y-4">
          {data.map((snapshot, idx) => (
            <div key={idx} className="space-y-2">
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(snapshot.date).toLocaleDateString()}
              </div>
              <div className="grid grid-cols-10 gap-2">
                {snapshot.top10.map((player) => (
                  <div
                    key={player.userId}
                    className="p-3 bg-slate-900 rounded-lg border border-slate-700 text-center"
                  >
                    <div className="text-lg font-bold text-orange-400 mb-1">#{player.rank}</div>
                    <div className="text-xs text-gray-300 truncate">{player.nickname || player.userId}</div>
                    <div className="text-xs text-gray-400 mt-1">{player.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Rank Distribution Component
const RankDistributionView = ({ data }: { data: RankDistribution[] }) => {
  const maxCount = Math.max(...data.map(d => d.playerCount));

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Player Rank Distribution</h3>
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.rankRange} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Rank {item.rankRange}</span>
                <span className="text-gray-400">{item.playerCount} players ({item.percentage}%)</span>
              </div>
              <div className="h-6 bg-slate-900 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg transition-all"
                  style={{ width: `${(item.playerCount / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Competitive Heatmap Component
const CompetitiveHeatmapView = ({ data }: { data: CompetitiveHeatmapData[] }) => {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-400" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'bg-green-500/20 border-green-500/50';
      case 'down':
        return 'bg-red-500/20 border-red-500/50';
      case 'stable':
        return 'bg-gray-500/20 border-gray-500/50';
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Competitive Heatmap</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((player) => (
            <motion.div
              key={player.userId}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-4 rounded-lg border-2 transition-all",
                getTrendColor(player.trend)
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-orange-400">#{player.rank}</div>
                  <div>
                    <div className="text-sm font-semibold text-white">{player.nickname || player.userId}</div>
                    <div className="text-xs text-gray-400">{player.value.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(player.trend)}
                  <span className={cn(
                    "text-xs font-semibold",
                    player.change > 0 ? "text-green-400" : player.change < 0 ? "text-red-400" : "text-gray-400"
                  )}>
                    {player.change > 0 ? '+' : ''}{player.change}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

