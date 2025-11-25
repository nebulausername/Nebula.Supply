import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Edit, Trash2, Filter, Settings, BarChart3, Users, Calendar, X, Save } from 'lucide-react';
import { cn } from '../../utils/cn';
import { 
  getCustomLeaderboards, 
  createCustomLeaderboard, 
  updateCustomLeaderboard, 
  deleteCustomLeaderboard,
  getCustomLeaderboardRankings,
  type CustomLeaderboard as CustomLeaderboardType
} from '../../lib/api/cookieClicker';

interface CustomLeaderboard {
  id: number;
  name: string;
  description: string | null;
  metric: string;
  filter?: {
    vipOnly?: boolean;
    minPrestige?: number | null;
    minAchievements?: number | null;
  };
  isPublic: boolean;
  isTemporary: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

export const CustomLeaderboards = () => {
  const [leaderboards, setLeaderboards] = useState<CustomLeaderboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLeaderboard, setEditingLeaderboard] = useState<Partial<CustomLeaderboard> | null>(null);

  const loadLeaderboards = async () => {
    setLoading(true);
    try {
      const data = await getCustomLeaderboards();
      setLeaderboards(data.map(lb => ({
        id: lb.id,
        name: lb.name,
        description: lb.description || '',
        metric: lb.metric,
        filter: {
          vipOnly: lb.filter.vipOnly,
          minPrestige: lb.filter.minPrestige || undefined,
          minAchievements: lb.filter.minAchievements || undefined
        },
        isPublic: lb.isPublic,
        isTemporary: lb.isTemporary,
        startDate: lb.startDate || undefined,
        endDate: lb.endDate || undefined,
        createdAt: lb.createdAt
      })));
    } catch (error) {
      console.error('Failed to load custom leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const metrics = [
    { id: 'totalCookies', label: 'Total Cookies', icon: Trophy },
    { id: 'cps', label: 'Cookies Per Second', icon: BarChart3 },
    { id: 'timePlayed', label: 'Time Played', icon: Calendar },
    { id: 'cookiesLast24h', label: 'Cookies (Last 24h)', icon: Trophy },
    { id: 'cookiesLast7d', label: 'Cookies (Last 7d)', icon: Trophy },
    { id: 'efficiency', label: 'Efficiency (Cookies/Second)', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Custom Leaderboards</h2>
          <p className="text-gray-400">Create and manage custom leaderboards with specific metrics and filters</p>
        </div>
        <button
          onClick={() => {
            setEditingLeaderboard({
              name: '',
              description: '',
              metric: 'totalCookies',
              isPublic: true,
              isTemporary: false
            });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Leaderboard
        </button>
      </div>

      {/* Leaderboards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading custom leaderboards...</p>
          </div>
        </div>
      ) : leaderboards.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No custom leaderboards yet</p>
          <p className="text-sm mt-2">Create your first custom leaderboard to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaderboards.map((leaderboard) => (
            <motion.div
              key={leaderboard.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{leaderboard.name}</h3>
                <div className="flex items-center gap-2">
                  {leaderboard.isPublic && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                      Public
                    </span>
                  )}
                  {leaderboard.isTemporary && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                      Temporary
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4">{leaderboard.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>Metric: {metrics.find(m => m.id === leaderboard.metric)?.label || leaderboard.metric}</span>
                </div>
                {leaderboard.filter && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Filter className="w-4 h-4" />
                    <span>
                      {leaderboard.filter.vipOnly && 'VIP Only'}
                      {leaderboard.filter.minPrestige && ` Min Prestige: ${leaderboard.filter.minPrestige}`}
                      {leaderboard.filter.minAchievements && ` Min Achievements: ${leaderboard.filter.minAchievements}`}
                    </span>
                  </div>
                )}
                {leaderboard.isTemporary && leaderboard.startDate && leaderboard.endDate && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(leaderboard.startDate).toLocaleDateString()} - {new Date(leaderboard.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setEditingLeaderboard(leaderboard);
                    setShowCreateModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={async () => {
                    try {
                      const rankings = await getCustomLeaderboardRankings(leaderboard.id);
                      alert(`Top 10:\n${rankings.slice(0, 10).map((r, i) => `${i + 1}. ${r.nickname || r.userId}: ${r.metricValue.toLocaleString()}`).join('\n')}`);
                    } catch (error) {
                      console.error('Failed to load rankings:', error);
                      alert('Failed to load leaderboard rankings');
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
                >
                  <Trophy className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Delete this custom leaderboard?')) {
                      try {
                        await deleteCustomLeaderboard(leaderboard.id);
                        await loadLeaderboards();
                      } catch (error) {
                        console.error('Failed to delete leaderboard:', error);
                        alert('Failed to delete leaderboard');
                      }
                    }
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

      {/* Create/Edit Modal */}
      {showCreateModal && editingLeaderboard && (
        <CustomLeaderboardModal
          leaderboard={editingLeaderboard}
          onClose={() => {
            setShowCreateModal(false);
            setEditingLeaderboard(null);
          }}
          onSave={async (data) => {
            try {
              if (editingLeaderboard.id) {
                await updateCustomLeaderboard(editingLeaderboard.id, data);
              } else {
                await createCustomLeaderboard(data);
              }
              await loadLeaderboards();
              setShowCreateModal(false);
              setEditingLeaderboard(null);
            } catch (error) {
              console.error('Failed to save leaderboard:', error);
              alert('Failed to save leaderboard');
            }
          }}
        />
      )}
    </div>
  );
};

interface CustomLeaderboardModalProps {
  leaderboard: Partial<CustomLeaderboard>;
  onClose: () => void;
  onSave: (data: Partial<CustomLeaderboard>) => void;
}

const CustomLeaderboardModal = ({ leaderboard, onClose, onSave }: CustomLeaderboardModalProps) => {
  const [formData, setFormData] = useState({
    name: leaderboard.name || '',
    description: leaderboard.description || '',
    metric: leaderboard.metric || 'totalCookies',
    filter: {
      vipOnly: leaderboard.filter?.vipOnly || false,
      minPrestige: leaderboard.filter?.minPrestige || '',
      minAchievements: leaderboard.filter?.minAchievements || ''
    },
    isPublic: leaderboard.isPublic ?? true,
    isTemporary: leaderboard.isTemporary || false,
    startDate: leaderboard.startDate || '',
    endDate: leaderboard.endDate || ''
  });

  const metrics = [
    { id: 'totalCookies', label: 'Total Cookies' },
    { id: 'cps', label: 'Cookies Per Second' },
    { id: 'timePlayed', label: 'Time Played' },
    { id: 'cookiesLast24h', label: 'Cookies (Last 24h)' },
    { id: 'cookiesLast7d', label: 'Cookies (Last 7d)' },
    { id: 'efficiency', label: 'Efficiency (Cookies/Second)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">
            {leaderboard.id ? 'Edit Leaderboard' : 'Create Custom Leaderboard'}
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
            <label className="text-sm text-gray-400 mb-1 block">Leaderboard Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              placeholder="e.g., VIP Leaderboard"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500 resize-none"
              placeholder="Leaderboard description..."
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Metric *</label>
            <select
              value={formData.metric}
              onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              {metrics.map(metric => (
                <option key={metric.id} value={metric.id}>{metric.label}</option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters (Optional)
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.filter.vipOnly}
                  onChange={(e) => setFormData({
                    ...formData,
                    filter: { ...formData.filter, vipOnly: e.target.checked }
                  })}
                  className="w-4 h-4"
                />
                VIP Players Only
              </label>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Min Prestige Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.filter.minPrestige}
                  onChange={(e) => setFormData({
                    ...formData,
                    filter: { ...formData.filter, minPrestige: e.target.value ? parseInt(e.target.value) : undefined }
                  })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="Leave empty for no limit"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Min Achievements</label>
                <input
                  type="number"
                  min="0"
                  value={formData.filter.minAchievements}
                  onChange={(e) => setFormData({
                    ...formData,
                    filter: { ...formData.filter, minAchievements: e.target.value ? parseInt(e.target.value) : undefined }
                  })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  placeholder="Leave empty for no limit"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4"
              />
              Public Leaderboard (visible to all players)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={formData.isTemporary}
                onChange={(e) => setFormData({ ...formData, isTemporary: e.target.checked })}
                className="w-4 h-4"
              />
              Temporary Leaderboard (event-based)
            </label>
          </div>

          {formData.isTemporary && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>
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
              if (!formData.name) {
                alert('Please enter a leaderboard name');
                return;
              }
              onSave({
                ...formData,
                filter: Object.keys(formData.filter).some(key => {
                  const value = formData.filter[key as keyof typeof formData.filter];
                  return value !== false && value !== '' && value !== undefined;
                }) ? formData.filter : undefined
              });
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

