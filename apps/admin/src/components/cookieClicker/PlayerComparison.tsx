import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, X, Download, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getCookiePlayer, type CookiePlayer } from '../../lib/api/cookieClicker';
import { cn } from '../../utils/cn';

interface PlayerComparisonProps {
  players: CookiePlayer[];
  onClose: () => void;
}

export const PlayerComparison = ({ players: initialPlayers, onClose }: PlayerComparisonProps) => {
  const [selectedPlayers, setSelectedPlayers] = useState<CookiePlayer[]>(initialPlayers);
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<Array<{
    player: CookiePlayer;
    metrics: {
      totalCookies: number;
      cookiesPerSecond: number;
      timePlayed: number;
      efficiency: number; // cookies per second of playtime
    };
  }>>([]);

  useEffect(() => {
    if (selectedPlayers.length > 0) {
      loadComparisonData();
    }
  }, [selectedPlayers]);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const data = await Promise.all(
        selectedPlayers.map(async (player) => {
          const fullPlayer = await getCookiePlayer(player.userId);
          const efficiency = fullPlayer.timePlayed > 0 
            ? fullPlayer.totalCookies / fullPlayer.timePlayed 
            : 0;
          
          return {
            player: fullPlayer,
            metrics: {
              totalCookies: fullPlayer.totalCookies,
              cookiesPerSecond: fullPlayer.cookiesPerSecond,
              timePlayed: fullPlayer.timePlayed,
              efficiency
            }
          };
        })
      );
      setComparisonData(data);
    } catch (error) {
      console.error('Failed to load comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const removePlayer = (userId: string) => {
    setSelectedPlayers(prev => prev.filter(p => p.userId !== userId));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getMaxValue = (key: keyof typeof comparisonData[0]['metrics']) => {
    if (comparisonData.length === 0) return 0;
    return Math.max(...comparisonData.map(d => d.metrics[key]));
  };

  const getWinner = (key: keyof typeof comparisonData[0]['metrics']) => {
    if (comparisonData.length === 0) return null;
    const maxValue = getMaxValue(key);
    return comparisonData.find(d => d.metrics[key] === maxValue);
  };

  const exportComparison = () => {
    const csv = [
      ['Metric', ...selectedPlayers.map(p => p.nickname || p.userId)].join(','),
      ['Total Cookies', ...comparisonData.map(d => d.metrics.totalCookies)].join(','),
      ['Cookies Per Second', ...comparisonData.map(d => d.metrics.cookiesPerSecond)].join(','),
      ['Time Played (seconds)', ...comparisonData.map(d => d.metrics.timePlayed)].join(','),
      ['Efficiency (cookies/second)', ...comparisonData.map(d => d.metrics.efficiency.toFixed(2))].join(',')
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `player-comparison-${Date.now()}.csv`;
    a.click();
  };

  if (selectedPlayers.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-orange-400" />
            <h3 className="text-2xl font-bold text-white">Player Comparison</h3>
            <span className="text-sm text-gray-400">({selectedPlayers.length} players)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportComparison}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Player Tags */}
        <div className="px-6 pt-4 flex flex-wrap gap-2">
          {selectedPlayers.map((player) => (
            <div
              key={player.userId}
              className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700"
            >
              <span className="text-sm text-white">{player.nickname || player.userId.slice(0, 8)}</span>
              {selectedPlayers.length > 1 && (
                <button
                  onClick={() => removePlayer(player.userId)}
                  className="p-0.5 hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-400">Loading comparison data...</p>
              </div>
            </div>
          ) : comparisonData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No comparison data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Comparison Table */}
              <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Metric</th>
                      {comparisonData.map((data, index) => (
                        <th key={data.player.userId} className="px-4 py-3 text-center text-sm font-medium text-gray-400">
                          {data.player.nickname || `Player ${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-300">Total Cookies</td>
                      {comparisonData.map((data) => {
                        const isWinner = getWinner('totalCookies')?.player.userId === data.player.userId;
                        return (
                          <td key={data.player.userId} className={cn(
                            "px-4 py-3 text-center text-sm",
                            isWinner ? "text-green-400 font-semibold" : "text-white"
                          )}>
                            <div className="flex items-center justify-center gap-2">
                              {formatNumber(data.metrics.totalCookies)}
                              {isWinner && <TrendingUp className="w-4 h-4" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-300">Cookies Per Second</td>
                      {comparisonData.map((data) => {
                        const isWinner = getWinner('cookiesPerSecond')?.player.userId === data.player.userId;
                        return (
                          <td key={data.player.userId} className={cn(
                            "px-4 py-3 text-center text-sm",
                            isWinner ? "text-green-400 font-semibold" : "text-white"
                          )}>
                            <div className="flex items-center justify-center gap-2">
                              {formatNumber(data.metrics.cookiesPerSecond)}
                              {isWinner && <TrendingUp className="w-4 h-4" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-300">Time Played</td>
                      {comparisonData.map((data) => {
                        const isWinner = getWinner('timePlayed')?.player.userId === data.player.userId;
                        return (
                          <td key={data.player.userId} className={cn(
                            "px-4 py-3 text-center text-sm",
                            isWinner ? "text-green-400 font-semibold" : "text-white"
                          )}>
                            <div className="flex items-center justify-center gap-2">
                              {formatTime(data.metrics.timePlayed)}
                              {isWinner && <TrendingUp className="w-4 h-4" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-300">Efficiency (Cookies/Second of Playtime)</td>
                      {comparisonData.map((data) => {
                        const isWinner = getWinner('efficiency')?.player.userId === data.player.userId;
                        return (
                          <td key={data.player.userId} className={cn(
                            "px-4 py-3 text-center text-sm",
                            isWinner ? "text-green-400 font-semibold" : "text-white"
                          )}>
                            <div className="flex items-center justify-center gap-2">
                              {formatNumber(data.metrics.efficiency)}
                              {isWinner && <TrendingUp className="w-4 h-4" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Visual Comparison Bars */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white">Visual Comparison</h4>
                
                {/* Total Cookies Comparison */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Total Cookies</span>
                    <span className="text-xs text-gray-500">Max: {formatNumber(getMaxValue('totalCookies'))}</span>
                  </div>
                  <div className="space-y-2">
                    {comparisonData.map((data) => {
                      const maxValue = getMaxValue('totalCookies');
                      const percentage = maxValue > 0 ? (data.metrics.totalCookies / maxValue) * 100 : 0;
                      return (
                        <div key={data.player.userId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">{data.player.nickname || data.player.userId.slice(0, 8)}</span>
                            <span className="text-gray-400">{formatNumber(data.metrics.totalCookies)}</span>
                          </div>
                          <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CPS Comparison */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Cookies Per Second</span>
                    <span className="text-xs text-gray-500">Max: {formatNumber(getMaxValue('cookiesPerSecond'))}</span>
                  </div>
                  <div className="space-y-2">
                    {comparisonData.map((data) => {
                      const maxValue = getMaxValue('cookiesPerSecond');
                      const percentage = maxValue > 0 ? (data.metrics.cookiesPerSecond / maxValue) * 100 : 0;
                      return (
                        <div key={data.player.userId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-300">{data.player.nickname || data.player.userId.slice(0, 8)}</span>
                            <span className="text-gray-400">{formatNumber(data.metrics.cookiesPerSecond)}</span>
                          </div>
                          <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

