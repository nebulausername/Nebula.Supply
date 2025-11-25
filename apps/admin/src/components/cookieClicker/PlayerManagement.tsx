import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Trash2, Edit, Settings, Download, User, Trophy, Zap, Clock, Filter, CheckSquare, Square, Award, Building2, TrendingUp, Crown, Calendar, Activity, BarChart3, X, Users, Hash, Ban, Unlock, Tag, Plus, Minus } from 'lucide-react';
import { getCookiePlayers, resetPlayerProgress, adjustPlayerStats, getCookiePlayer, getCookiePlayerHistory, getCookiePlayerAchievements, getCookiePlayerDetailedStats, bulkOperation, type CookiePlayer, type PlayerHistoryEntry, type PlayerAchievement, type PlayerDetailedStats } from '../../lib/api/cookieClicker';
import { PlayerComparison } from './PlayerComparison';
import { PlayerNotesTags } from './PlayerNotesTags';
import { BulkOperationsModal } from './BulkOperationsModal';
import { cn } from '../../utils/cn';

export const PlayerManagement = () => {
  const [players, setPlayers] = useState<CookiePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'totalCookies' | 'cookiesPerSecond' | 'timePlayed' | 'lastUpdated'>('totalCookies');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<CookiePlayer | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPlayers, setComparisonPlayers] = useState<CookiePlayer[]>([]);
  
  // 🚀 Bulk-Operations: Selected Players
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // 🚀 Advanced Search Filters
  const [filters, setFilters] = useState({
    minCookies: '',
    maxCookies: '',
    minCPS: '',
    maxCPS: '',
    minTimePlayed: '',
    maxTimePlayed: '',
    hasNickname: null as boolean | null,
    vipStatus: null as boolean | null,
    minPrestigeLevel: '',
    maxPrestigeLevel: '',
    minAchievements: '',
    maxAchievements: '',
    lastLoginDays: '',
    filterLogic: 'AND' as 'AND' | 'OR'
  });

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const result = await getCookiePlayers({
        page,
        limit: 50,
        search: searchTerm || undefined,
        sortBy,
        sortOrder,
        filters: Object.keys(filters).some(key => {
          const value = filters[key as keyof typeof filters];
          return value !== null && value !== '' && value !== undefined;
        }) ? filters : undefined
      });
      setPlayers(result.players);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, [page, searchTerm, sortBy, sortOrder, filters]);

  const handleResetPlayer = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this player\'s progress?')) return;
    
    try {
      await resetPlayerProgress(userId);
      loadPlayers();
    } catch (error) {
      console.error('Failed to reset player:', error);
    }
  };

  const handleViewPlayer = async (userId: string) => {
    try {
      const player = await getCookiePlayer(userId);
      setSelectedPlayer(player);
      setShowPlayerModal(true);
    } catch (error) {
      console.error('Failed to load player:', error);
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Player Management</h2>
          <p className="text-gray-400">Manage all Cookie Clicker players</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPlayers}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              // 🚀 Export to CSV
              const csv = [
                ['User ID', 'Nickname', 'Total Cookies', 'CPS', 'Time Played', 'Last Updated'].join(','),
                ...players.map(p => [
                  p.userId,
                  p.nickname || '',
                  p.totalCookies,
                  p.cookiesPerSecond,
                  p.timePlayed,
                  p.lastUpdated
                ].join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `cookie-players-${Date.now()}.csv`;
              a.click();
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => {
              // 🚀 Export to JSON
              const json = JSON.stringify(players, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `cookie-players-${Date.now()}.json`;
              a.click();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          {selectedPlayers.size >= 2 && (
            <button
              onClick={() => {
                const playersToCompare = players.filter(p => selectedPlayers.has(p.userId));
                setComparisonPlayers(playersToCompare);
                setShowComparison(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <Users className="w-4 h-4" />
              Compare ({selectedPlayers.size})
            </button>
          )}
        </div>
      </div>

      {/* 🚀 Bulk Operations Bar */}
      {selectedPlayers.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold">
                {selectedPlayers.size} player{selectedPlayers.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white flex items-center gap-2 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Bulk Actions
              </button>
              <button
                onClick={() => setSelectedPlayers(new Set())}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={async () => {
                if (!confirm(`Reset progress for ${selectedPlayers.size} players?`)) return;
                setBulkLoading(true);
                try {
                  const result = await bulkOperation('reset', Array.from(selectedPlayers));
                  alert(`Reset: ${result.success.length} successful, ${result.failed.length} failed`);
                  if (result.failed.length === 0) {
                    setSelectedPlayers(new Set());
                  }
                  loadPlayers();
                } catch (error) {
                  console.error('Bulk reset failed:', error);
                  alert('Bulk reset failed');
                } finally {
                  setBulkLoading(false);
                }
              }}
              disabled={bulkLoading}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={() => {
                const playersToCompare = players.filter(p => selectedPlayers.has(p.userId));
                setComparisonPlayers(playersToCompare);
                setShowComparison(true);
              }}
              disabled={selectedPlayers.size < 2}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
            >
              <Users className="w-4 h-4" />
              Compare
            </button>
            <button
              onClick={() => {
                const selectedPlayersData = players.filter(p => selectedPlayers.has(p.userId));
                const csv = [
                  ['User ID', 'Nickname', 'Total Cookies', 'CPS', 'Time Played', 'Last Updated'].join(','),
                  ...selectedPlayersData.map(p => [
                    p.userId,
                    p.nickname || '',
                    p.totalCookies,
                    p.cookiesPerSecond,
                    p.timePlayed,
                    p.lastUpdated
                  ].join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cookie-players-bulk-${Date.now()}.csv`;
                a.click();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Selected
            </button>
          </div>
        </motion.div>
      )}

      {/* Bulk Operations Modal */}
      {showBulkModal && (
        <BulkOperationsModal
          selectedCount={selectedPlayers.size}
          onClose={() => setShowBulkModal(false)}
          onExecute={async (action, data) => {
            setBulkLoading(true);
            try {
              const result = await bulkOperation(action, Array.from(selectedPlayers), data);
              alert(`${action}: ${result.success.length} successful, ${result.failed.length} failed`);
              if (result.failed.length === 0) {
                setSelectedPlayers(new Set());
                setShowBulkModal(false);
              }
              loadPlayers();
            } catch (error) {
              console.error('Bulk operation failed:', error);
              alert('Bulk operation failed');
            } finally {
              setBulkLoading(false);
            }
          }}
        />
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by nickname or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "px-4 py-2 rounded-lg flex items-center gap-2 transition-colors",
              showAdvancedFilters
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
            )}
          >
            <Filter className="w-4 h-4" />
            Advanced Filters
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
          >
            <option value="totalCookies">Total Cookies</option>
            <option value="cookiesPerSecond">Cookies Per Second</option>
            <option value="timePlayed">Time Played</option>
            <option value="lastUpdated">Last Updated</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* 🚀 Advanced Filters */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4"
          >
            {/* Filter Logic Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <span className="text-sm text-gray-400">Filter Logic:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilters({ ...filters, filterLogic: 'AND' })}
                  className={cn(
                    "px-3 py-1 rounded-lg text-sm transition-colors",
                    filters.filterLogic === 'AND'
                      ? "bg-orange-600 text-white"
                      : "bg-slate-700 text-gray-400 hover:bg-slate-600"
                  )}
                >
                  AND
                </button>
                <button
                  onClick={() => setFilters({ ...filters, filterLogic: 'OR' })}
                  className={cn(
                    "px-3 py-1 rounded-lg text-sm transition-colors",
                    filters.filterLogic === 'OR'
                      ? "bg-orange-600 text-white"
                      : "bg-slate-700 text-gray-400 hover:bg-slate-600"
                  )}
                >
                  OR
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Min Cookies</label>
                <input
                  type="number"
                  value={filters.minCookies}
                  onChange={(e) => setFilters({ ...filters, minCookies: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Max Cookies</label>
                <input
                  type="number"
                  value={filters.maxCookies}
                  onChange={(e) => setFilters({ ...filters, maxCookies: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="∞"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Min CPS</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.minCPS}
                  onChange={(e) => setFilters({ ...filters, minCPS: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Max CPS</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.maxCPS}
                  onChange={(e) => setFilters({ ...filters, maxCPS: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="∞"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Min Time Played (seconds)</label>
                <input
                  type="number"
                  value={filters.minTimePlayed}
                  onChange={(e) => setFilters({ ...filters, minTimePlayed: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Max Time Played (seconds)</label>
                <input
                  type="number"
                  value={filters.maxTimePlayed}
                  onChange={(e) => setFilters({ ...filters, maxTimePlayed: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="∞"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Has Nickname</label>
                <select
                  value={filters.hasNickname === null ? '' : filters.hasNickname ? 'yes' : 'no'}
                  onChange={(e) => setFilters({ ...filters, hasNickname: e.target.value === '' ? null : e.target.value === 'yes' })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">VIP Status</label>
                <select
                  value={filters.vipStatus === null ? '' : filters.vipStatus ? 'yes' : 'no'}
                  onChange={(e) => setFilters({ ...filters, vipStatus: e.target.value === '' ? null : e.target.value === 'yes' })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="">Any</option>
                  <option value="yes">VIP</option>
                  <option value="no">Non-VIP</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Min Prestige Level</label>
                <input
                  type="number"
                  value={filters.minPrestigeLevel}
                  onChange={(e) => setFilters({ ...filters, minPrestigeLevel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Max Prestige Level</label>
                <input
                  type="number"
                  value={filters.maxPrestigeLevel}
                  onChange={(e) => setFilters({ ...filters, maxPrestigeLevel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="∞"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Min Achievements</label>
                <input
                  type="number"
                  value={filters.minAchievements}
                  onChange={(e) => setFilters({ ...filters, minAchievements: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Max Achievements</label>
                <input
                  type="number"
                  value={filters.maxAchievements}
                  onChange={(e) => setFilters({ ...filters, maxAchievements: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="∞"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Last Login (days ago)</label>
                <input
                  type="number"
                  value={filters.lastLoginDays}
                  onChange={(e) => setFilters({ ...filters, lastLoginDays: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  placeholder="e.g. 7"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-700">
              <button
                onClick={() => setFilters({
                  minCookies: '',
                  maxCookies: '',
                  minCPS: '',
                  maxCPS: '',
                  minTimePlayed: '',
                  maxTimePlayed: '',
                  hasNickname: null,
                  vipStatus: null,
                  minPrestigeLevel: '',
                  maxPrestigeLevel: '',
                  minAchievements: '',
                  maxAchievements: '',
                  lastLoginDays: '',
                  filterLogic: 'AND'
                })}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="text-sm text-gray-400 mb-1">Total Players</div>
          <div className="text-2xl font-bold text-white">{total}</div>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="text-sm text-gray-400 mb-1">Page</div>
          <div className="text-2xl font-bold text-white">{page} / {totalPages}</div>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="text-sm text-gray-400 mb-1">Showing</div>
          <div className="text-2xl font-bold text-white">{players.length}</div>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="text-sm text-gray-400 mb-1">Results</div>
          <div className="text-2xl font-bold text-white">{total}</div>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading players...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No players found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400 w-12">
                    <button
                      onClick={() => {
                        if (selectedPlayers.size === players.length) {
                          setSelectedPlayers(new Set());
                        } else {
                          setSelectedPlayers(new Set(players.map(p => p.userId)));
                        }
                      }}
                      className="p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                      {selectedPlayers.size === players.length ? (
                        <CheckSquare className="w-4 h-4 text-orange-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Nickname</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Total Cookies</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">CPS</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Time Played</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Last Updated</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {players.map((player, index) => (
                  <motion.tr
                    key={player.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          const newSelected = new Set(selectedPlayers);
                          if (newSelected.has(player.userId)) {
                            newSelected.delete(player.userId);
                          } else {
                            newSelected.add(player.userId);
                          }
                          setSelectedPlayers(newSelected);
                        }}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                      >
                        {selectedPlayers.has(player.userId) ? (
                          <CheckSquare className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">{player.userId.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{player.nickname || '—'}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatNumber(player.totalCookies)}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatNumber(player.cookiesPerSecond)}</td>
                    <td className="px-4 py-3 text-sm text-white">{formatTime(player.timePlayed)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(player.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewPlayer(player.userId)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <User className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleResetPlayer(player.userId)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Reset Progress"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-white">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Player Detail Modal */}
      {showPlayerModal && selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => {
            setShowPlayerModal(false);
            setSelectedPlayer(null);
          }}
          onReset={handleResetPlayer}
          onAdjust={async (stats) => {
            await adjustPlayerStats(selectedPlayer.userId, stats);
            loadPlayers();
            setShowPlayerModal(false);
          }}
        />
      )}

      {/* Player Comparison Modal */}
      {showComparison && comparisonPlayers.length > 0 && (
        <PlayerComparison
          players={comparisonPlayers}
          onClose={() => {
            setShowComparison(false);
            setComparisonPlayers([]);
          }}
        />
      )}
    </div>
  );
};

interface PlayerDetailModalProps {
  player: CookiePlayer;
  onClose: () => void;
  onReset: (userId: string) => void;
  onAdjust: (stats: { totalCookies?: number; cookiesPerSecond?: number; timePlayed?: number }) => void;
}

const PlayerDetailModal = ({ player, onClose, onReset, onAdjust }: PlayerDetailModalProps) => {
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements' | 'buildings' | 'prestige' | 'sessions' | 'notes'>('overview');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PlayerHistoryEntry[]>([]);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [detailedStats, setDetailedStats] = useState<PlayerDetailedStats | null>(null);
  
  const [stats, setStats] = useState({
    totalCookies: player.totalCookies,
    cookiesPerSecond: player.cookiesPerSecond,
    timePlayed: player.timePlayed
  });

  useEffect(() => {
    loadDetailedData();
  }, [player.userId]);

  const loadDetailedData = async () => {
    setLoading(true);
    try {
      const [historyData, achievementsData, statsData] = await Promise.all([
        getCookiePlayerHistory(player.userId),
        getCookiePlayerAchievements(player.userId),
        getCookiePlayerDetailedStats(player.userId)
      ]);
      setHistory(historyData);
      setAchievements(achievementsData);
      setDetailedStats(statsData);
    } catch (error) {
      console.error('Failed to load detailed data:', error);
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

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: User },
    { id: 'history' as const, label: 'History', icon: Clock },
    { id: 'achievements' as const, label: 'Achievements', icon: Award },
    { id: 'buildings' as const, label: 'Buildings', icon: Building2 },
    { id: 'prestige' as const, label: 'Prestige', icon: Crown },
    { id: 'sessions' as const, label: 'Sessions', icon: Activity },
    { id: 'notes' as const, label: 'Notes & Tags', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            {player.avatarUrl && (
              <img src={player.avatarUrl} alt={player.nickname || 'Player'} className="w-12 h-12 rounded-full" />
            )}
            <div>
              <h3 className="text-2xl font-bold text-white">{player.nickname || 'Unnamed Player'}</h3>
              <p className="text-sm text-gray-400 font-mono">{player.userId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-700 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-slate-800 text-orange-400 border-b-2 border-orange-400"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-400">Loading player data...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="text-sm text-gray-400 mb-1">Total Cookies</div>
                      <div className="text-2xl font-bold text-white">{formatNumber(stats.totalCookies)}</div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="text-sm text-gray-400 mb-1">Cookies Per Second</div>
                      <div className="text-2xl font-bold text-white">{formatNumber(stats.cookiesPerSecond)}</div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="text-sm text-gray-400 mb-1">Time Played</div>
                      <div className="text-2xl font-bold text-white">{formatTime(stats.timePlayed)}</div>
                    </div>
                  </div>

                  {/* VIP Status */}
                  {detailedStats?.vip && (
                    <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Crown className="w-5 h-5 text-purple-400" />
                        <h4 className="text-lg font-bold text-white">VIP Status</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Tier:</span>
                          <span className="text-white ml-2">{detailedStats.vip.tier}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Passive Income:</span>
                          <span className="text-white ml-2">{formatNumber(detailedStats.vip.passiveIncome)}/s</span>
                        </div>
                        {detailedStats.vip.unlockedAt && (
                          <div className="col-span-2">
                            <span className="text-gray-400">Unlocked:</span>
                            <span className="text-white ml-2">{new Date(detailedStats.vip.unlockedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prestige Info */}
                  {detailedStats?.prestige && detailedStats.prestige.level > 0 && (
                    <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Crown className="w-5 h-5 text-yellow-400" />
                        <h4 className="text-lg font-bold text-white">Prestige</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Level:</span>
                          <span className="text-white ml-2">{detailedStats.prestige.level}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Points:</span>
                          <span className="text-white ml-2">{formatNumber(detailedStats.prestige.points)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-3">
                    {editing ? (
                      <>
                        <button
                          onClick={() => {
                            onAdjust(stats);
                            setEditing(false);
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false);
                            setStats({
                              totalCookies: player.totalCookies,
                              cookiesPerSecond: player.cookiesPerSecond,
                              timePlayed: player.timePlayed
                            });
                          }}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditing(true)}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Stats
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to reset this player?')) {
                              onReset(player.userId);
                              onClose();
                            }
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Reset Player
                        </button>
                      </>
                    )}
                  </div>

                  {editing && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">Total Cookies</label>
                        <input
                          type="number"
                          value={stats.totalCookies}
                          onChange={(e) => setStats({ ...stats, totalCookies: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">CPS</label>
                        <input
                          type="number"
                          step="0.01"
                          value={stats.cookiesPerSecond}
                          onChange={(e) => setStats({ ...stats, cookiesPerSecond: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-1 block">Time Played (seconds)</label>
                        <input
                          type="number"
                          value={stats.timePlayed}
                          onChange={(e) => setStats({ ...stats, timePlayed: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white mb-4">Game History Timeline</h4>
                  {history.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No history data available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.map((entry, index) => (
                        <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-white">{entry.event}</span>
                            <span className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                          {entry.data && (
                            <pre className="text-xs text-gray-400 overflow-x-auto">
                              {JSON.stringify(entry.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white mb-4">Achievements ({achievements.length})</h4>
                  {achievements.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No achievements unlocked</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {achievements.map((achievement) => (
                        <div key={achievement.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center gap-3 mb-2">
                            <Award className="w-5 h-5 text-yellow-400" />
                            <h5 className="font-semibold text-white">{achievement.name}</h5>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {achievement.progress} / {achievement.maxProgress}
                            </span>
                            {achievement.unlockedAt && (
                              <span className="text-gray-500">
                                {new Date(achievement.unlockedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'buildings' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white mb-4">Buildings & Upgrades</h4>
                  {detailedStats?.buildings && detailedStats.buildings.length > 0 ? (
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-md font-semibold text-white mb-3">Buildings</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {detailedStats.buildings.map((building) => (
                            <div key={building.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-white">{building.name}</span>
                                <span className="text-sm text-gray-400">x{building.owned}</span>
                              </div>
                              <div className="text-sm text-gray-400">
                                Total CPS: {formatNumber(building.totalCps)}/s
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {detailedStats.upgrades && detailedStats.upgrades.length > 0 && (
                        <div>
                          <h5 className="text-md font-semibold text-white mb-3">Upgrades</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {detailedStats.upgrades.filter(u => u.owned).map((upgrade) => (
                              <div key={upgrade.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-green-400" />
                                  <span className="font-semibold text-white">{upgrade.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No building data available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'prestige' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white mb-4">Prestige History</h4>
                  {detailedStats?.prestige && detailedStats.prestige.history.length > 0 ? (
                    <div className="space-y-2">
                      {detailedStats.prestige.history.map((entry, index) => (
                        <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-white">Level {entry.level}</span>
                              <span className="text-sm text-gray-400 ml-2">{formatNumber(entry.points)} points</span>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No prestige history available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white mb-4">Session Analysis</h4>
                  {detailedStats?.sessions && detailedStats.sessions.length > 0 ? (
                    <div className="space-y-4">
                      {detailedStats.sessions.map((session, index) => (
                        <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Start:</span>
                              <div className="text-white">{new Date(session.startTime).toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Duration:</span>
                              <div className="text-white">{formatTime(session.duration)}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Cookies Gained:</span>
                              <div className="text-white">{formatNumber(session.cookiesGained)}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Status:</span>
                              <div className="text-white">{session.endTime ? 'Completed' : 'Active'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No session data available</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <PlayerNotesTags userId={player.userId} />
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};










































