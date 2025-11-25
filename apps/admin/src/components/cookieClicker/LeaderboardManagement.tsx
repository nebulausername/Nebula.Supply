import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Trash2, AlertTriangle, Calendar, Gift, Shield, Plus, Settings } from 'lucide-react';
import { resetLeaderboard } from '../../lib/api/cookieClicker';
import { cn } from '../../utils/cn';
import { SeasonManagement } from './SeasonManagement';
import { CustomLeaderboards } from './CustomLeaderboards';
import { LeaderboardVisualizations } from './LeaderboardVisualizations';

type LeaderboardType = 'totalCookies' | 'cps' | 'timePlayed';

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface Reward {
  id: string;
  rank: number;
  type: 'coins' | 'prestige' | 'custom';
  amount: number;
  description: string;
}

export const LeaderboardManagement = () => {
  const [activeTab, setActiveTab] = useState<'reset' | 'seasons' | 'custom' | 'visualizations'>('reset');
  const [activeType, setActiveType] = useState<LeaderboardType>('totalCookies');
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetType, setResetType] = useState<LeaderboardType | 'all' | null>(null);

  const handleReset = async (type?: LeaderboardType | 'all') => {
    if (!confirm('Are you sure you want to reset the leaderboard? This action cannot be undone!')) {
      return;
    }

    setLoading(true);
    try {
      await resetLeaderboard(type === 'all' ? undefined : type);
      alert('Leaderboard reset successfully!');
    } catch (error) {
      console.error('Failed to reset leaderboard:', error);
      alert('Failed to reset leaderboard');
    } finally {
      setLoading(false);
      setShowResetConfirm(false);
    }
  };

  const types: Array<{ id: LeaderboardType | 'all'; label: string; icon: typeof Trophy }> = [
    { id: 'totalCookies', label: 'Total Cookies', icon: Trophy },
    { id: 'cps', label: 'Cookies Per Second', icon: Trophy },
    { id: 'timePlayed', label: 'Time Played', icon: Trophy },
    { id: 'all', label: 'All Categories', icon: Trophy }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Leaderboard Management</h2>
          <p className="text-gray-400">Manage and reset leaderboards</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('reset')}
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === 'reset'
              ? "bg-slate-800 text-orange-400 border-b-2 border-orange-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          Reset Leaderboards
        </button>
        <button
          onClick={() => setActiveTab('seasons')}
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === 'seasons'
              ? "bg-slate-800 text-orange-400 border-b-2 border-orange-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          Seasons
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === 'custom'
              ? "bg-slate-800 text-orange-400 border-b-2 border-orange-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          Custom Leaderboards
        </button>
        <button
          onClick={() => setActiveTab('visualizations')}
          className={cn(
            "px-4 py-2 rounded-t-lg transition-colors",
            activeTab === 'visualizations'
              ? "bg-slate-800 text-orange-400 border-b-2 border-orange-400"
              : "text-gray-400 hover:text-white"
          )}
        >
          Visualizations
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'reset' && (
        <>

      {/* Warning */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-yellow-400 font-medium mb-1">Warning</div>
          <div className="text-sm text-gray-300">
            Resetting the leaderboard will permanently reset all player statistics. This action cannot be undone.
          </div>
        </div>
      </div>

      {/* Reset Options */}
      <div className="grid grid-cols-2 gap-4">
        {types.map((type) => {
          const Icon = type.icon;
          return (
            <motion.div
              key={type.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{type.label}</h3>
                    <p className="text-sm text-gray-400">Reset this category</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleReset(type.id)}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Reset {type.label}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* 🚀 Season System */}
      <SeasonManagement />

      {/* 🚀 Rewards System */}
      <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            Rewards System
          </h3>
          <button
            onClick={() => setShowRewardsModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configure
          </button>
        </div>
        <div className="space-y-2">
          {rewards.map(reward => (
            <div
              key={reward.id}
              className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-white">
                  Rank #{reward.rank} - {reward.description}
                </div>
                <div className="text-sm text-gray-400">
                  {reward.type === 'coins' ? `${reward.amount} Coins` : reward.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🚀 Anti-Cheat Detection */}
      <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            Anti-Cheat Detection
          </h3>
        </div>
        {suspiciousPlayers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No suspicious activity detected
          </div>
        ) : (
          <div className="space-y-2">
            {suspiciousPlayers.map(player => (
              <div
                key={player.userId}
                className="p-4 bg-red-500/10 rounded-lg border border-red-500/30 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-white">{player.nickname}</div>
                  <div className="text-sm text-gray-400">{player.reason}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-red-400 font-medium">
                    Risk: {(player.score * 100).toFixed(0)}%
                  </div>
                  <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors">
                    Investigate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="text-blue-400 font-medium mb-2">Info</div>
        <div className="text-sm text-gray-300">
          Leaderboard rankings are calculated from player statistics. Resetting stats will automatically update the leaderboard.
          All leaderboard types (Total Cookies, CPS, Time Played) are derived from the same player statistics.
        </div>
      </div>
        </>
      )}

      {activeTab === 'seasons' && <SeasonManagement />}
      {activeTab === 'custom' && <CustomLeaderboards />}
      {activeTab === 'visualizations' && <LeaderboardVisualizations />}
    </div>
  );
};

