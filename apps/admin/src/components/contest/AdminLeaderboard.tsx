// 🏆 ADMIN LEADERBOARD - Interaktiver Leaderboard mit Admin-Features!

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  Ban,
  AlertTriangle,
  Edit,
  User,
  Trophy,
  MoreVertical,
  FileText,
  FileJson
} from 'lucide-react';
import type { ContestAdminConfig } from './ContestAdminPanel';

const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface Participant {
  id: string;
  name: string;
  rank: number;
  score: number;
  cookies: number;
  achievements: number;
  status: 'active' | 'banned' | 'warned';
  joinedAt: string;
  lastUpdate: string;
  flags?: string[];
}

interface AdminLeaderboardProps {
  contest: ContestAdminConfig;
  participants?: Participant[];
}

type SortField = 'rank' | 'name' | 'score' | 'cookies' | 'achievements';
type SortDirection = 'asc' | 'desc';

// 🏆 ADMIN LEADERBOARD - MAXIMIERT & PREMIUM!
export const AdminLeaderboard = ({ contest, participants: initialParticipants }: AdminLeaderboardProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showEditScoreModal, setShowEditScoreModal] = useState(false);

  // Mock participants if not provided
  const mockParticipants: Participant[] = useMemo(() => {
    return Array.from({ length: contest.participantCount || 50 }, (_, i) => ({
      id: `participant_${i + 1}`,
      name: `Player${i + 1}`,
      rank: i + 1,
      score: 1000000 - (i * 20000) + Math.random() * 5000,
      cookies: 50000000 - (i * 1000000) + Math.random() * 500000,
      achievements: 18 - Math.floor(i / 3),
      status: i % 20 === 0 ? 'warned' : i % 50 === 0 ? 'banned' : 'active',
      joinedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdate: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
      flags: i % 15 === 0 ? ['suspicious_activity'] : [],
    }));
  }, [contest.participantCount]);

  const participants = initialParticipants || mockParticipants;

  // Filtered and sorted participants
  const filteredParticipants = useMemo(() => {
    let filtered = participants.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      const aRaw = a[sortField as keyof Participant];
      const bRaw = b[sortField as keyof Participant];
      
      // Handle array types (like flags)
      if (Array.isArray(aRaw) || Array.isArray(bRaw)) return 0;
      
      const aVal: number | string | undefined = aRaw as number | string | undefined;
      const bVal: number | string | undefined = bRaw as number | string | undefined;
      
      if (aVal === undefined || bVal === undefined) return 0;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return filtered;
  }, [participants, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBan = (participant: Participant) => {
    setSelectedParticipant(participant);
    setShowBanModal(true);
  };

  const handleWarning = (participant: Participant) => {
    setSelectedParticipant(participant);
    setShowWarningModal(true);
  };

  const handleEditScore = (participant: Participant) => {
    setSelectedParticipant(participant);
    setShowEditScoreModal(true);
  };

  const handleExportCSV = () => {
    const csv = [
      ['Rank', 'Name', 'Score', 'Cookies', 'Achievements', 'Status', 'Joined At'].join(','),
      ...filteredParticipants.map(p =>
        [
          p.rank,
          `"${p.name}"`,
          p.score,
          p.cookies,
          p.achievements,
          p.status,
          p.joinedAt
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contest-${contest.contestId}-leaderboard.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      contestId: contest.contestId,
      exportDate: new Date().toISOString(),
      participants: filteredParticipants
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contest-${contest.contestId}-leaderboard.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Leaderboard Management
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {filteredParticipants.length} von {participants.length} Teilnehmern
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText className="w-4 h-4" />
            CSV
          </motion.button>
          <motion.button
            onClick={handleExportJSON}
            className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileJson className="w-4 h-4" />
            JSON
          </motion.button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nach Name oder ID suchen..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('rank')}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    Rang
                    <SortIcon field="rank" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    Name
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('score')}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    Score
                    <SortIcon field="score" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('cookies')}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    Cookies
                    <SortIcon field="cookies" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('achievements')}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    Achievements
                    <SortIcon field="achievements" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-white/60">Status</th>
                <th className="px-4 py-3 text-right text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant, i) => (
                <motion.tr
                  key={participant.id}
                  className={cn(
                    "border-t border-white/5 hover:bg-white/5 transition-colors",
                    participant.status === 'banned' && "opacity-50",
                    participant.rank <= 3 && "bg-yellow-500/5"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {participant.rank <= 3 && (
                        <Trophy className={cn(
                          "w-4 h-4",
                          participant.rank === 1 ? "text-yellow-400" :
                          participant.rank === 2 ? "text-gray-400" :
                          "text-orange-400"
                        )} />
                      )}
                      <span className={cn(
                        "font-bold",
                        participant.rank === 1 ? "text-yellow-400" :
                        participant.rank === 2 ? "text-gray-400" :
                        participant.rank === 3 ? "text-orange-400" :
                        "text-white"
                      )}>
                        #{participant.rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedParticipant(participant)}
                      className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {participant.name}
                      {participant.flags && participant.flags.length > 0 && (
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold">
                    {participant.score.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white/80">
                    {participant.cookies.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white/80">
                    {participant.achievements}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold",
                      participant.status === 'active' ? "bg-green-500/20 text-green-400" :
                      participant.status === 'banned' ? "bg-red-500/20 text-red-400" :
                      "bg-orange-500/20 text-orange-400"
                    )}>
                      {participant.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        onClick={() => handleEditScore(participant)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Score bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleWarning(participant)}
                        className="p-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Warnung senden"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleBan(participant)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={participant.status === 'banned' ? "Entbannen" : "Bannen"}
                      >
                        <Ban className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Participant Details Modal */}
      {selectedParticipant && !showBanModal && !showWarningModal && !showEditScoreModal && (
        <ParticipantDetailsModal
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}

      {/* Ban Modal */}
      {showBanModal && selectedParticipant && (
        <BanModal
          participant={selectedParticipant}
          onConfirm={() => {
            // TODO: API call
            setShowBanModal(false);
            setSelectedParticipant(null);
          }}
          onClose={() => {
            setShowBanModal(false);
            setSelectedParticipant(null);
          }}
        />
      )}

      {/* Warning Modal */}
      {showWarningModal && selectedParticipant && (
        <WarningModal
          participant={selectedParticipant}
          onConfirm={() => {
            // TODO: API call
            setShowWarningModal(false);
            setSelectedParticipant(null);
          }}
          onClose={() => {
            setShowWarningModal(false);
            setSelectedParticipant(null);
          }}
        />
      )}

      {/* Edit Score Modal */}
      {showEditScoreModal && selectedParticipant && (
        <EditScoreModal
          participant={selectedParticipant}
          onConfirm={(newScore) => {
            // TODO: API call
            setShowEditScoreModal(false);
            setSelectedParticipant(null);
          }}
          onClose={() => {
            setShowEditScoreModal(false);
            setSelectedParticipant(null);
          }}
        />
      )}
    </div>
  );
};

// Participant Details Modal
const ParticipantDetailsModal = ({
  participant,
  onClose,
}: {
  participant: Participant;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6" />
            Teilnehmer-Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-white/60 mb-1">Name</div>
              <div className="text-lg font-bold text-white">{participant.name}</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Rank</div>
              <div className="text-lg font-bold text-yellow-400">#{participant.rank}</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Score</div>
              <div className="text-lg font-bold text-white">{participant.score.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Cookies</div>
              <div className="text-lg font-bold text-white">{participant.cookies.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Achievements</div>
              <div className="text-lg font-bold text-white">{participant.achievements}</div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">Status</div>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-bold",
                participant.status === 'active' ? "bg-green-500/20 text-green-400" :
                participant.status === 'banned' ? "bg-red-500/20 text-red-400" :
                "bg-orange-500/20 text-orange-400"
              )}>
                {participant.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="pt-4 border-t border-white/10">
            <div className="text-sm text-white/60 mb-2">Joined At</div>
            <div className="text-white">{new Date(participant.joinedAt).toLocaleString()}</div>
          </div>
          <div className="pt-4 border-t border-white/10">
            <div className="text-sm text-white/60 mb-2">Last Update</div>
            <div className="text-white">{new Date(participant.lastUpdate).toLocaleString()}</div>
          </div>
          {participant.flags && participant.flags.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <div className="text-sm text-white/60 mb-2">Flags</div>
              <div className="flex gap-2">
                {participant.flags.map((flag, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-orange-500/20 text-orange-400 text-xs">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Ban Modal
const BanModal = ({
  participant,
  onConfirm,
  onClose,
}: {
  participant: Participant;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-red-500/30 bg-gradient-to-br from-gray-900 to-black p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
          <Ban className="w-6 h-6" />
          {participant.status === 'banned' ? 'Teilnehmer entbannen?' : 'Teilnehmer bannen?'}
        </h2>
        <p className="text-white/60 mb-4">
          {participant.status === 'banned'
            ? `Möchtest du ${participant.name} wirklich entbannen?`
            : `Möchtest du ${participant.name} wirklich bannen?`}
        </p>
        {participant.status !== 'banned' && (
          <div className="mb-4">
            <label className="text-sm text-white/60 mb-1 block">Grund</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              placeholder="Grund für den Ban..."
              rows={3}
            />
          </div>
        )}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Abbrechen
          </button>
          <motion.button
            onClick={onConfirm}
            className={cn(
              "px-6 py-3 rounded-lg text-white font-bold",
              participant.status === 'banned' ? "bg-green-500" : "bg-red-500"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {participant.status === 'banned' ? 'Entbannen' : 'Bannen'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// Warning Modal
const WarningModal = ({
  participant,
  onConfirm,
  onClose,
}: {
  participant: Participant;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  const [message, setMessage] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-orange-500/30 bg-gradient-to-br from-gray-900 to-black p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Warnung senden
        </h2>
        <p className="text-white/60 mb-4">
          Sende eine Warnung an {participant.name}
        </p>
        <div className="mb-4">
          <label className="text-sm text-white/60 mb-1 block">Nachricht</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            placeholder="Warnung-Nachricht..."
            rows={4}
          />
        </div>
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Abbrechen
          </button>
          <motion.button
            onClick={onConfirm}
            className="px-6 py-3 rounded-lg bg-orange-500 text-white font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Senden
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// Edit Score Modal
const EditScoreModal = ({
  participant,
  onConfirm,
  onClose,
}: {
  participant: Participant;
  onConfirm: (newScore: number) => void;
  onClose: () => void;
}) => {
  const [newScore, setNewScore] = useState(participant.score.toString());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-blue-500/30 bg-gradient-to-br from-gray-900 to-black p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
          <Edit className="w-6 h-6" />
          Score bearbeiten
        </h2>
        <p className="text-white/60 mb-4">
          Aktueller Score: {participant.score.toLocaleString()}
        </p>
        <div className="mb-4">
          <label className="text-sm text-white/60 mb-1 block">Neuer Score</label>
          <input
            type="number"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
            placeholder="Neuer Score..."
          />
        </div>
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Abbrechen
          </button>
          <motion.button
            onClick={() => onConfirm(parseInt(newScore))}
            className="px-6 py-3 rounded-lg bg-blue-500 text-white font-bold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Speichern
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

