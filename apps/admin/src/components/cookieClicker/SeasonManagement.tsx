import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Edit, Trash2, Trophy, Gift, Download, X, Save, Clock, Users } from 'lucide-react';
import { getSeasons, getSeason, createSeason, updateSeason, deleteSeason, snapshotSeasonLeaderboard, createSeasonReward, distributeSeasonRewards, type Season, type SeasonReward } from '../../lib/api/cookieClicker';
import { cn } from '../../utils/cn';

export const SeasonManagement = () => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<{ leaderboard: any[]; rewards: SeasonReward[] } | null>(null);
  const [editingSeason, setEditingSeason] = useState<Partial<Season> | null>(null);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      loadSeasonDetails(selectedSeason.id);
    }
  }, [selectedSeason]);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const data = await getSeasons();
      setSeasons(data);
    } catch (error) {
      console.error('Failed to load seasons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSeasonDetails = async (seasonId: number) => {
    try {
      const data = await getSeason(seasonId);
      setSeasonDetails({ leaderboard: data.leaderboard, rewards: data.rewards });
    } catch (error) {
      console.error('Failed to load season details:', error);
    }
  };

  const handleCreateSeason = async () => {
    if (!editingSeason?.name || !editingSeason?.startDate || !editingSeason?.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createSeason({
        name: editingSeason.name,
        description: editingSeason.description || undefined,
        startDate: editingSeason.startDate!,
        endDate: editingSeason.endDate!
      });
      setShowSeasonModal(false);
      setEditingSeason(null);
      loadSeasons();
    } catch (error) {
      console.error('Failed to create season:', error);
      alert('Failed to create season');
    }
  };

  const handleUpdateSeason = async (seasonId: number) => {
    if (!editingSeason) return;

    try {
      await updateSeason(seasonId, editingSeason);
      setEditingSeason(null);
      loadSeasons();
      if (selectedSeason?.id === seasonId) {
        loadSeasonDetails(seasonId);
      }
    } catch (error) {
      console.error('Failed to update season:', error);
      alert('Failed to update season');
    }
  };

  const handleDeleteSeason = async (seasonId: number) => {
    if (!confirm('Are you sure you want to delete this season?')) return;

    try {
      await deleteSeason(seasonId);
      if (selectedSeason?.id === seasonId) {
        setSelectedSeason(null);
        setSeasonDetails(null);
      }
      loadSeasons();
    } catch (error) {
      console.error('Failed to delete season:', error);
      alert('Failed to delete season');
    }
  };

  const handleSnapshot = async (seasonId: number) => {
    if (!confirm('Create a snapshot of the current leaderboard for this season?')) return;

    try {
      await snapshotSeasonLeaderboard(seasonId);
      alert('Season leaderboard snapshot created successfully');
      loadSeasonDetails(seasonId);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      alert('Failed to create snapshot');
    }
  };

  const handleDistributeRewards = async (seasonId: number) => {
    if (!confirm('Distribute rewards to eligible players for this season?')) return;

    try {
      const result = await distributeSeasonRewards(seasonId);
      alert(`Rewards distributed to ${result.distributedCount} players`);
      loadSeasonDetails(seasonId);
    } catch (error) {
      console.error('Failed to distribute rewards:', error);
      alert('Failed to distribute rewards');
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const isSeasonActive = (season: Season): boolean => {
    const now = new Date();
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    return now >= start && now <= end;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Season Management</h2>
          <p className="text-gray-400">Create and manage competitive seasons</p>
        </div>
        <button
          onClick={() => {
            setEditingSeason({
              name: '',
              description: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            setShowSeasonModal(true);
          }}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Season
        </button>
      </div>

      {/* Seasons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading seasons...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seasons.map((season) => (
            <motion.div
              key={season.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedSeason(season)}
              className={cn(
                "p-6 rounded-xl border cursor-pointer transition-all",
                selectedSeason?.id === season.id
                  ? "bg-orange-500/10 border-orange-500/30"
                  : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">{season.name}</h3>
                {isSeasonActive(season) && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                    Active
                  </span>
                )}
              </div>
              {season.description && (
                <p className="text-sm text-gray-400 mb-3">{season.description}</p>
              )}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Start: {new Date(season.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>End: {new Date(season.endDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSeason(season);
                    setShowSeasonModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSeason(season.id);
                  }}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Season Details */}
      {selectedSeason && seasonDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">{selectedSeason.name} - Details</h3>
            <button
              onClick={() => {
                setSelectedSeason(null);
                setSeasonDetails(null);
              }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leaderboard */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Season Leaderboard
                </h4>
                <button
                  onClick={() => handleSnapshot(selectedSeason.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Snapshot
                </button>
              </div>
              {seasonDetails.leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No leaderboard data yet</p>
                  <p className="text-xs mt-2">Create a snapshot to capture current rankings</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {seasonDetails.leaderboard.slice(0, 20).map((player, index) => (
                    <div
                      key={player.userId}
                      className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-orange-400 w-6">#{player.rank}</span>
                        <div>
                          <div className="text-sm font-semibold text-white">{player.nickname || player.userId.slice(0, 8)}</div>
                          <div className="text-xs text-gray-400">{formatNumber(player.totalCookies)} cookies</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rewards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-400" />
                  Season Rewards
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRewardsModal(true)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Add Reward
                  </button>
                  <button
                    onClick={() => handleDistributeRewards(selectedSeason.id)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                  >
                    <Gift className="w-3 h-3" />
                    Distribute
                  </button>
                </div>
              </div>
              {seasonDetails.rewards.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No rewards configured</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {seasonDetails.rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        reward.distributed
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-slate-900/50 border-slate-700"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            Rank {reward.rankMin}-{reward.rankMax}
                          </div>
                          <div className="text-xs text-gray-400">{reward.rewardDescription}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {reward.rewardAmount} {reward.rewardType}
                          </div>
                        </div>
                        {reward.distributed && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                            Distributed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Season Modal */}
      {showSeasonModal && (
        <SeasonModal
          season={editingSeason}
          onClose={() => {
            setShowSeasonModal(false);
            setEditingSeason(null);
          }}
          onSave={editingSeason?.id ? () => handleUpdateSeason(editingSeason.id!) : handleCreateSeason}
        />
      )}

      {/* Rewards Modal */}
      {showRewardsModal && selectedSeason && (
        <RewardsModal
          seasonId={selectedSeason.id}
          onClose={() => setShowRewardsModal(false)}
          onSave={async (rewardData) => {
            await createSeasonReward(selectedSeason.id, rewardData);
            setShowRewardsModal(false);
            loadSeasonDetails(selectedSeason.id);
          }}
        />
      )}
    </div>
  );
};

interface SeasonModalProps {
  season: Partial<Season> | null;
  onClose: () => void;
  onSave: () => void;
}

const SeasonModal = ({ season, onClose, onSave }: SeasonModalProps) => {
  const [formData, setFormData] = useState({
    name: season?.name || '',
    description: season?.description || '',
    startDate: season?.startDate || new Date().toISOString().split('T')[0],
    endDate: season?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: season?.isActive || false
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">
            {season?.id ? 'Edit Season' : 'Create Season'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Season Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              placeholder="e.g., Winter 2024"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 resize-none"
              placeholder="Season description..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          {season?.id && (
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                Active Season
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (season?.id) {
                updateSeason(season.id, formData).then(() => {
                  onSave();
                  onClose();
                });
              } else {
                createSeason({
                  name: formData.name,
                  description: formData.description || undefined,
                  startDate: formData.startDate,
                  endDate: formData.endDate
                }).then(() => {
                  onSave();
                  onClose();
                });
              }
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface RewardsModalProps {
  seasonId: number;
  onClose: () => void;
  onSave: (data: { rankMin: number; rankMax: number; rewardType: string; rewardAmount: number; rewardDescription?: string }) => void;
}

const RewardsModal = ({ seasonId, onClose, onSave }: RewardsModalProps) => {
  const [formData, setFormData] = useState({
    rankMin: 1,
    rankMax: 1,
    rewardType: 'coins',
    rewardAmount: 100,
    rewardDescription: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Add Season Reward</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Min Rank</label>
              <input
                type="number"
                min="1"
                value={formData.rankMin}
                onChange={(e) => setFormData({ ...formData, rankMin: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Max Rank</label>
              <input
                type="number"
                min="1"
                value={formData.rankMax}
                onChange={(e) => setFormData({ ...formData, rankMax: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Reward Type</label>
            <select
              value={formData.rewardType}
              onChange={(e) => setFormData({ ...formData, rewardType: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="coins">Coins</option>
              <option value="prestige">Prestige Points</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Reward Amount</label>
            <input
              type="number"
              min="0"
              value={formData.rewardAmount}
              onChange={(e) => setFormData({ ...formData, rewardAmount: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <input
              type="text"
              value={formData.rewardDescription}
              onChange={(e) => setFormData({ ...formData, rewardDescription: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              placeholder="e.g., Top Player Reward"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Add Reward
          </button>
        </div>
      </motion.div>
    </div>
  );
};

