// 🎮 CONTEST ADMIN PANEL - Highly Configurable Contest Management!

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Trophy,
  Users,
  Calendar,
  Coins,
  Award,
  Play,
  Pause,
  RefreshCw,
  Save,
  Trash2,
  Plus,
  Edit,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
// Simple cn utility for admin
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export interface ContestAdminConfig {
  contestId: string;
  type: 'monthly' | 'weekly' | 'daily' | 'seasonal';
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'finalized' | 'closed';
  participantCount: number;
  prizes: Array<{
    position: number;
    coins: number;
    premiumInvites?: number;
    exclusiveUpgrade?: string;
  }>;
  scoringWeights: {
    cookies: number;
    achievements: number;
    efficiency: number;
    activeTime: number;
  };
  rngSettings: {
    commitHash?: string;
    revealValue?: string;
    phase: 'commit' | 'reveal' | 'finalized';
  };
  autoFinalize: boolean;
  notifyWinners: boolean;
  allowLateJoin: boolean;
}

// 🎮 CONTEST ADMIN PANEL - MAXIMIERT & HIGHLY CONFIGURABLE!
export const ContestAdminPanel = () => {
  const [contests, setContests] = useState<ContestAdminConfig[]>([]);
  const [selectedContest, setSelectedContest] = useState<ContestAdminConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContest, setNewContest] = useState<Partial<ContestAdminConfig>>({
    type: 'monthly',
    status: 'draft',
    prizes: [],
    scoringWeights: {
      cookies: 0.6,
      achievements: 0.2,
      efficiency: 0.1,
      activeTime: 0.1,
    },
    autoFinalize: false,
    notifyWinners: true,
    allowLateJoin: false,
  });

  // Load contests on mount
  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      // TODO: Replace with real API call
      // const response = await fetch('/api/admin/contests');
      // const data = await response.json();
      // setContests(data);
      
      // Mock data for now
      const mockContests: ContestAdminConfig[] = [
        {
          contestId: 'monthly-2024-01',
          type: 'monthly',
          name: 'Monatliches Gewinnspiel Januar 2024',
          description: 'Das große monatliche Event!',
          startDate: new Date(2024, 0, 1).toISOString(),
          endDate: new Date(2024, 0, 31, 23, 59, 59).toISOString(),
          status: 'active',
          participantCount: 1250,
          prizes: [
            { position: 1, coins: 50000, premiumInvites: 10 },
            { position: 2, coins: 30000, premiumInvites: 5 },
            { position: 3, coins: 20000, premiumInvites: 3 },
          ],
          scoringWeights: {
            cookies: 0.6,
            achievements: 0.2,
            efficiency: 0.1,
            activeTime: 0.1,
          },
          rngSettings: {
            phase: 'commit',
          },
          autoFinalize: false,
          notifyWinners: true,
          allowLateJoin: false,
        },
      ];
      setContests(mockContests);
    } catch (error) {
      console.error('Failed to load contests:', error);
    }
  };

  const handleSaveContest = async (contest: ContestAdminConfig) => {
    setIsSaving(true);
    try {
      // TODO: Replace with real API call
      // await fetch(`/api/admin/contests/${contest.contestId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(contest),
      // });
      
      setContests(prev => prev.map(c => c.contestId === contest.contestId ? contest : c));
      setIsEditing(false);
      alert('Contest gespeichert!');
    } catch (error) {
      console.error('Failed to save contest:', error);
      alert('Fehler beim Speichern!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalizeContest = async (contestId: string) => {
    if (!confirm('Contest wirklich finalisieren? Gewinner werden ausgewählt.')) return;
    
    try {
      // TODO: Replace with real API call
      // await fetch(`/api/admin/contests/${contestId}/finalize`, { method: 'POST' });
      
      setContests(prev => prev.map(c => 
        c.contestId === contestId 
          ? { ...c, status: 'finalized' as const, rngSettings: { ...c.rngSettings, phase: 'finalized' } }
          : c
      ));
      alert('Contest wurde finalisiert!');
    } catch (error) {
      console.error('Failed to finalize contest:', error);
      alert('Fehler beim Finalisieren!');
    }
  };

  const handlePauseContest = async (contestId: string) => {
    try {
      // TODO: Replace with real API call
      setContests(prev => prev.map(c => 
        c.contestId === contestId 
          ? { ...c, status: c.status === 'active' ? 'paused' as const : 'active' as const }
          : c
      ));
    } catch (error) {
      console.error('Failed to pause contest:', error);
    }
  };

  const handleCreateContest = async () => {
    if (!newContest.name || !newContest.startDate || !newContest.endDate) {
      alert('Bitte alle Pflichtfelder ausfüllen!');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Replace with real API call
      const contest: ContestAdminConfig = {
        contestId: `contest-${Date.now()}`,
        type: newContest.type || 'monthly',
        name: newContest.name!,
        description: newContest.description || '',
        startDate: newContest.startDate!,
        endDate: newContest.endDate!,
        status: 'draft',
        participantCount: 0,
        prizes: newContest.prizes || [],
        scoringWeights: newContest.scoringWeights || {
          cookies: 0.6,
          achievements: 0.2,
          efficiency: 0.1,
          activeTime: 0.1,
        },
        rngSettings: { phase: 'commit' },
        autoFinalize: newContest.autoFinalize || false,
        notifyWinners: newContest.notifyWinners ?? true,
        allowLateJoin: newContest.allowLateJoin || false,
      };

      setContests(prev => [...prev, contest]);
      setShowCreateModal(false);
      setNewContest({});
      alert('Contest erstellt!');
    } catch (error) {
      console.error('Failed to create contest:', error);
      alert('Fehler beim Erstellen!');
    } finally {
      setIsSaving(false);
    }
  };

  const activeContests = useMemo(() => contests.filter(c => c.status === 'active'), [contests]);
  const pausedContests = useMemo(() => contests.filter(c => c.status === 'paused'), [contests]);
  const draftContests = useMemo(() => contests.filter(c => c.status === 'draft'), [contests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Contest Management
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Highly Configurable Contest Administration
          </p>
        </div>
        <motion.button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          Neuer Contest
        </motion.button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Play className="w-5 h-5" />
            <span className="text-sm font-medium">Aktiv</span>
          </div>
          <div className="text-3xl font-bold text-white">{activeContests.length}</div>
        </div>
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Pause className="w-5 h-5" />
            <span className="text-sm font-medium">Pausiert</span>
          </div>
          <div className="text-3xl font-bold text-white">{pausedContests.length}</div>
        </div>
        <div className="rounded-xl border border-gray-500/30 bg-gray-500/10 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Edit className="w-5 h-5" />
            <span className="text-sm font-medium">Draft</span>
          </div>
          <div className="text-3xl font-bold text-white">{draftContests.length}</div>
        </div>
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <div className="text-3xl font-bold text-white">{contests.length}</div>
        </div>
      </div>

      {/* Contest List */}
      <div className="space-y-4">
        {contests.map((contest) => (
          <motion.div
            key={contest.contestId}
            className={cn(
              "rounded-xl border-2 p-6 transition-all",
              contest.status === 'active' ? "border-green-500/50 bg-green-500/10" :
              contest.status === 'paused' ? "border-orange-500/50 bg-orange-500/10" :
              contest.status === 'finalized' ? "border-purple-500/50 bg-purple-500/10" :
              "border-white/10 bg-white/5"
            )}
            whileHover={{ scale: 1.01, y: -2 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{contest.name}</h3>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    contest.status === 'active' ? "bg-green-500/20 text-green-400" :
                    contest.status === 'paused' ? "bg-orange-500/20 text-orange-400" :
                    contest.status === 'finalized' ? "bg-purple-500/20 text-purple-400" :
                    "bg-gray-500/20 text-gray-400"
                  )}>
                    {contest.status.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                    {contest.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-white/60 text-sm mb-4">{contest.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-white/60 mb-1">Teilnehmer</div>
                    <div className="text-lg font-bold text-white">{contest.participantCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60 mb-1">Preise</div>
                    <div className="text-lg font-bold text-white">{contest.prizes.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60 mb-1">Start</div>
                    <div className="text-sm font-semibold text-white">
                      {new Date(contest.startDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/60 mb-1">Ende</div>
                    <div className="text-sm font-semibold text-white">
                      {new Date(contest.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <motion.button
                  onClick={() => {
                    setSelectedContest(contest);
                    setIsEditing(true);
                  }}
                  className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
                
                {contest.status === 'active' && (
                  <motion.button
                    onClick={() => handlePauseContest(contest.contestId)}
                    className="p-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Pause className="w-5 h-5" />
                  </motion.button>
                )}
                
                {contest.status === 'paused' && (
                  <motion.button
                    onClick={() => handlePauseContest(contest.contestId)}
                    className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Play className="w-5 h-5" />
                  </motion.button>
                )}
                
                {contest.status !== 'finalized' && (
                  <motion.button
                    onClick={() => handleFinalizeContest(contest.contestId)}
                    className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trophy className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && selectedContest && (
        <ContestEditModal
          contest={selectedContest}
          onSave={handleSaveContest}
          onClose={() => {
            setIsEditing(false);
            setSelectedContest(null);
          }}
          isSaving={isSaving}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <ContestCreateModal
          newContest={newContest}
          onChange={setNewContest}
          onSave={handleCreateContest}
          onClose={() => {
            setShowCreateModal(false);
            setNewContest({});
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

// Edit Modal Component
const ContestEditModal = ({
  contest,
  onSave,
  onClose,
  isSaving,
}: {
  contest: ContestAdminConfig;
  onSave: (contest: ContestAdminConfig) => void;
  onClose: () => void;
  isSaving: boolean;
}) => {
  const [editedContest, setEditedContest] = useState<ContestAdminConfig>(contest);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-8 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Contest konfigurieren</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Grundeinstellungen</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Name</label>
                <input
                  type="text"
                  value={editedContest.name}
                  onChange={(e) => setEditedContest({ ...editedContest, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Typ</label>
                <select
                  value={editedContest.type}
                  onChange={(e) => setEditedContest({ ...editedContest, type: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                  <option value="seasonal">Seasonal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scoring Weights */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Scoring Gewichtung</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">
                  Cookies: {(editedContest.scoringWeights.cookies * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={editedContest.scoringWeights.cookies}
                  onChange={(e) => setEditedContest({
                    ...editedContest,
                    scoringWeights: {
                      ...editedContest.scoringWeights,
                      cookies: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">
                  Achievements: {(editedContest.scoringWeights.achievements * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={editedContest.scoringWeights.achievements}
                  onChange={(e) => setEditedContest({
                    ...editedContest,
                    scoringWeights: {
                      ...editedContest.scoringWeights,
                      achievements: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Abbrechen
            </button>
            <motion.button
              onClick={() => onSave(editedContest)}
              disabled={isSaving}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Speichere...' : 'Speichern'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Create Modal Component
const ContestCreateModal = ({
  newContest,
  onChange,
  onSave,
  onClose,
  isSaving,
}: {
  newContest: Partial<ContestAdminConfig>;
  onChange: (contest: Partial<ContestAdminConfig>) => void;
  onSave: () => void;
  onClose: () => void;
  isSaving: boolean;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Neuen Contest erstellen</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-1 block">Name *</label>
            <input
              type="text"
              value={newContest.name || ''}
              onChange={(e) => onChange({ ...newContest, name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              placeholder="Contest Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 mb-1 block">Start Datum *</label>
              <input
                type="datetime-local"
                value={newContest.startDate ? newContest.startDate.slice(0, 16) : ''}
                onChange={(e) => onChange({ ...newContest, startDate: new Date(e.target.value).toISOString() })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Ende Datum *</label>
              <input
                type="datetime-local"
                value={newContest.endDate ? newContest.endDate.slice(0, 16) : ''}
                onChange={(e) => onChange({ ...newContest, endDate: new Date(e.target.value).toISOString() })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Abbrechen
            </button>
            <motion.button
              onClick={onSave}
              disabled={isSaving}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSaving ? 'Erstelle...' : 'Erstellen'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

