import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Ban, Unlock, Edit, Tag, Plus, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BulkOperationsModalProps {
  selectedCount: number;
  onClose: () => void;
  onExecute: (action: 'reset' | 'ban' | 'unban' | 'adjust_stats' | 'add_tag' | 'remove_tag', data?: any) => Promise<void>;
}

export const BulkOperationsModal = ({ selectedCount, onClose, onExecute }: BulkOperationsModalProps) => {
  const [activeAction, setActiveAction] = useState<'reset' | 'ban' | 'unban' | 'adjust_stats' | 'add_tag' | 'remove_tag' | null>(null);
  const [banReason, setBanReason] = useState('');
  const [adjustStats, setAdjustStats] = useState({
    totalCookies: '',
    cookiesPerSecond: '',
    timePlayed: ''
  });
  const [tagName, setTagName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!activeAction) return;

    let data: any = undefined;
    if (activeAction === 'ban') {
      data = { reason: banReason || 'Bulk ban' };
    } else if (activeAction === 'adjust_stats') {
      data = {
        stats: {
          totalCookies: adjustStats.totalCookies ? parseInt(adjustStats.totalCookies) : undefined,
          cookiesPerSecond: adjustStats.cookiesPerSecond ? parseFloat(adjustStats.cookiesPerSecond) : undefined,
          timePlayed: adjustStats.timePlayed ? parseInt(adjustStats.timePlayed) : undefined
        }
      };
      // Remove undefined values
      data.stats = Object.fromEntries(Object.entries(data.stats).filter(([_, v]) => v !== undefined));
      if (Object.keys(data.stats).length === 0) {
        alert('Please provide at least one stat to adjust');
        return;
      }
    } else if (activeAction === 'add_tag' || activeAction === 'remove_tag') {
      if (!tagName.trim()) {
        alert('Please enter a tag name');
        return;
      }
      data = { tag: tagName.trim() };
    }

    // Confirmation
    const actionNames: Record<string, string> = {
      reset: 'reset progress',
      ban: 'ban',
      unban: 'unban',
      adjust_stats: 'adjust stats',
      add_tag: 'add tag',
      remove_tag: 'remove tag'
    };
    if (!confirm(`Are you sure you want to ${actionNames[activeAction]} for ${selectedCount} players?`)) {
      return;
    }

    setLoading(true);
    try {
      await onExecute(activeAction, data);
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { id: 'reset' as const, label: 'Reset Progress', icon: Trash2, color: 'red', description: 'Reset all stats for selected players' },
    { id: 'ban' as const, label: 'Ban Players', icon: Ban, color: 'red', description: 'Ban selected players' },
    { id: 'unban' as const, label: 'Unban Players', icon: Unlock, color: 'green', description: 'Unban selected players' },
    { id: 'adjust_stats' as const, label: 'Adjust Stats', icon: Edit, color: 'orange', description: 'Adjust stats for selected players' },
    { id: 'add_tag' as const, label: 'Add Tag', icon: Tag, color: 'blue', description: 'Add a tag to selected players' },
    { id: 'remove_tag' as const, label: 'Remove Tag', icon: Minus, color: 'purple', description: 'Remove a tag from selected players' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h3 className="text-2xl font-bold text-white">Bulk Operations</h3>
            <p className="text-sm text-gray-400 mt-1">{selectedCount} player{selectedCount !== 1 ? 's' : ''} selected</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Actions List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((action) => {
              const Icon = action.icon;
              const isActive = activeAction === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => setActiveAction(action.id)}
                  className={cn(
                    "p-4 rounded-lg border transition-all text-left",
                    isActive
                      ? `bg-${action.color}-500/10 border-${action.color}-500/30`
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={cn("w-5 h-5", isActive ? `text-${action.color}-400` : "text-gray-400")} />
                    <span className={cn("font-semibold", isActive ? "text-white" : "text-gray-300")}>
                      {action.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{action.description}</p>
                </button>
              );
            })}
          </div>

          {/* Action-Specific Forms */}
          {activeAction === 'ban' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <label className="text-sm text-gray-400 mb-2 block">Ban Reason</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter ban reason..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 resize-none"
              />
            </motion.div>
          )}

          {activeAction === 'adjust_stats' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-4"
            >
              <h4 className="text-sm font-semibold text-white mb-3">Adjust Stats (leave empty to keep unchanged)</h4>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Total Cookies</label>
                <input
                  type="number"
                  value={adjustStats.totalCookies}
                  onChange={(e) => setAdjustStats({ ...adjustStats, totalCookies: e.target.value })}
                  placeholder="Leave empty to keep unchanged"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Cookies Per Second</label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustStats.cookiesPerSecond}
                  onChange={(e) => setAdjustStats({ ...adjustStats, cookiesPerSecond: e.target.value })}
                  placeholder="Leave empty to keep unchanged"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Time Played (seconds)</label>
                <input
                  type="number"
                  value={adjustStats.timePlayed}
                  onChange={(e) => setAdjustStats({ ...adjustStats, timePlayed: e.target.value })}
                  placeholder="Leave empty to keep unchanged"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </motion.div>
          )}

          {(activeAction === 'add_tag' || activeAction === 'remove_tag') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <label className="text-sm text-gray-400 mb-2 block">Tag Name</label>
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Enter tag name..."
                maxLength={50}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
          >
            Cancel
          </button>
          {activeAction && (
            <button
              onClick={handleExecute}
              disabled={loading || (activeAction === 'adjust_stats' && !adjustStats.totalCookies && !adjustStats.cookiesPerSecond && !adjustStats.timePlayed)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  Execute
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

