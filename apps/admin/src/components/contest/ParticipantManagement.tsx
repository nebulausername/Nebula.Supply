// 👥 PARTICIPANT MANAGEMENT - Umfassende Teilnehmer-Verwaltung!

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Ban,
  AlertTriangle,
  RefreshCw,
  User,
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Shield,
  Eye,
  X,
  Check,
  Trophy
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
  totalPlayTime?: number;
  clickCount?: number;
}

interface ParticipantManagementProps {
  contest: ContestAdminConfig;
  participants?: Participant[];
}

type FilterStatus = 'all' | 'active' | 'banned' | 'warned';
type FilterFlag = 'all' | 'suspicious_activity' | 'high_score' | 'rapid_growth';

// 👥 PARTICIPANT MANAGEMENT - MAXIMIERT & PREMIUM!
export const ParticipantManagement = ({ contest, participants: initialParticipants }: ParticipantManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterFlag, setFilterFlag] = useState<FilterFlag>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);

  // Mock participants if not provided
  const mockParticipants: Participant[] = useMemo(() => {
    return Array.from({ length: Math.min(contest.participantCount || 100, 100) }, (_, i) => ({
      id: `participant_${i + 1}`,
      name: `Player${i + 1}`,
      rank: i + 1,
      score: 1000000 - (i * 20000) + Math.random() * 5000,
      cookies: 50000000 - (i * 1000000) + Math.random() * 500000,
      achievements: 18 - Math.floor(i / 3),
      status: i % 20 === 0 ? 'warned' : i % 50 === 0 ? 'banned' : 'active',
      joinedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdate: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
      flags: i % 15 === 0 ? ['suspicious_activity'] : i % 25 === 0 ? ['high_score'] : [],
      totalPlayTime: Math.random() * 100 * 60 * 60, // seconds
      clickCount: Math.floor(Math.random() * 100000),
    }));
  }, [contest.participantCount]);

  const participants = initialParticipants || mockParticipants;

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      
      const matchesFlag = filterFlag === 'all' || 
        (filterFlag === 'suspicious_activity' && p.flags?.includes('suspicious_activity')) ||
        (filterFlag === 'high_score' && p.flags?.includes('high_score')) ||
        (filterFlag === 'rapid_growth' && p.flags?.includes('rapid_growth'));

      return matchesSearch && matchesStatus && matchesFlag;
    });
  }, [participants, searchTerm, filterStatus, filterFlag]);

  const stats = useMemo(() => {
    const active = participants.filter(p => p.status === 'active').length;
    const banned = participants.filter(p => p.status === 'banned').length;
    const warned = participants.filter(p => p.status === 'warned').length;
    const flagged = participants.filter(p => p.flags && p.flags.length > 0).length;

    return { active, banned, warned, flagged, total: participants.length };
  }, [participants]);

  const handleBan = (participant: Participant) => {
    // TODO: API call
    alert(`Teilnehmer ${participant.name} wurde ${participant.status === 'banned' ? 'entbannt' : 'gebannt'}.`);
  };

  const handleWarning = (participant: Participant) => {
    // TODO: API call
    alert(`Warnung an ${participant.name} gesendet.`);
  };

  const handleResetScore = (participant: Participant) => {
    if (!confirm(`Möchtest du wirklich den Score von ${participant.name} zurücksetzen?`)) return;
    // TODO: API call
    alert(`Score von ${participant.name} wurde zurückgesetzt.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Teilnehmer-Verwaltung
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {filteredParticipants.length} von {participants.length} Teilnehmern
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
          <div className="text-sm text-green-400 mb-1">Aktiv</div>
          <div className="text-2xl font-bold text-white">{stats.active}</div>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="text-sm text-red-400 mb-1">Gebannt</div>
          <div className="text-2xl font-bold text-white">{stats.banned}</div>
        </div>
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
          <div className="text-sm text-orange-400 mb-1">Verwarnt</div>
          <div className="text-2xl font-bold text-white">{stats.warned}</div>
        </div>
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="text-sm text-yellow-400 mb-1">Geflaggt</div>
          <div className="text-2xl font-bold text-white">{stats.flagged}</div>
        </div>
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="text-sm text-blue-400 mb-1">Gesamt</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nach Name oder ID suchen..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="banned">Gebannt</option>
          <option value="warned">Verwarnt</option>
        </select>
        <select
          value={filterFlag}
          onChange={(e) => setFilterFlag(e.target.value as FilterFlag)}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          <option value="all">Alle Flags</option>
          <option value="suspicious_activity">Verdächtige Aktivität</option>
          <option value="high_score">Hoher Score</option>
          <option value="rapid_growth">Schnelles Wachstum</option>
        </select>
      </div>

      {/* Participants List */}
      <div className="space-y-2">
        {filteredParticipants.map((participant, i) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            index={i}
            onView={() => {
              setSelectedParticipant(participant);
              setShowParticipantModal(true);
            }}
            onBan={() => handleBan(participant)}
            onWarning={() => handleWarning(participant)}
            onResetScore={() => handleResetScore(participant)}
          />
        ))}
      </div>

      {/* Participant Detail Modal */}
      {showParticipantModal && selectedParticipant && (
        <ParticipantDetailModal
          participant={selectedParticipant}
          onClose={() => {
            setShowParticipantModal(false);
            setSelectedParticipant(null);
          }}
          onBan={() => {
            handleBan(selectedParticipant);
            setShowParticipantModal(false);
          }}
          onWarning={() => {
            handleWarning(selectedParticipant);
            setShowParticipantModal(false);
          }}
          onResetScore={() => {
            handleResetScore(selectedParticipant);
            setShowParticipantModal(false);
          }}
        />
      )}
    </div>
  );
};

// Participant Card
const ParticipantCard = ({
  participant,
  index,
  onView,
  onBan,
  onWarning,
  onResetScore,
}: {
  participant: Participant;
  index: number;
  onView: () => void;
  onBan: () => void;
  onWarning: () => void;
  onResetScore: () => void;
}) => {
  return (
    <motion.div
      className={cn(
        "rounded-xl border p-4 hover:bg-white/5 transition-colors",
        participant.status === 'banned' ? "border-red-500/30 bg-red-500/5" :
        participant.status === 'warned' ? "border-orange-500/30 bg-orange-500/5" :
        "border-white/10 bg-white/5"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg",
            participant.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
            participant.rank === 2 ? "bg-gray-400/20 text-gray-400" :
            participant.rank === 3 ? "bg-orange-500/20 text-orange-400" :
            "bg-white/10 text-white/60"
          )}>
            {participant.rank}
          </div>
          <div className="flex-1">
            <button
              onClick={onView}
              className="text-left hover:text-blue-400 transition-colors"
            >
              <div className="font-semibold text-white flex items-center gap-2">
                {participant.name}
                {participant.flags && participant.flags.length > 0 && (
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <div className="text-sm text-white/60">
                Score: {participant.score.toLocaleString()} · Cookies: {participant.cookies.toLocaleString()}
              </div>
            </button>
          </div>
          <div className="text-right">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-bold",
              participant.status === 'active' ? "bg-green-500/20 text-green-400" :
              participant.status === 'banned' ? "bg-red-500/20 text-red-400" :
              "bg-orange-500/20 text-orange-400"
            )}>
              {participant.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <motion.button
            onClick={onView}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Details"
          >
            <Eye className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onWarning}
            className="p-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Warnung"
          >
            <AlertTriangle className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={onBan}
            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={participant.status === 'banned' ? "Entbannen" : "Bannen"}
          >
            <Ban className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Participant Detail Modal
const ParticipantDetailModal = ({
  participant,
  onClose,
  onBan,
  onWarning,
  onResetScore,
}: {
  participant: Participant;
  onClose: () => void;
  onBan: () => void;
  onWarning: () => void;
  onResetScore: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-8 max-h-[90vh] overflow-y-auto"
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

        <div className="space-y-6">
          {/* Basic Info */}
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

          {/* Stats */}
          {participant.totalPlayTime && (
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Statistiken</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-white/60 mb-1">Gesamte Spielzeit</div>
                  <div className="text-white">
                    {Math.floor(participant.totalPlayTime / 3600)}h {Math.floor((participant.totalPlayTime % 3600) / 60)}m
                  </div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">Klicks</div>
                  <div className="text-white">{participant.clickCount?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Flags */}
          {participant.flags && participant.flags.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Flags</h3>
              <div className="flex gap-2">
                {participant.flags.map((flag, i) => (
                  <span key={i} className="px-3 py-1 rounded bg-orange-500/20 text-orange-400 text-sm">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Aktionen</h3>
            <div className="flex gap-2">
              <motion.button
                onClick={onWarning}
                className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AlertTriangle className="w-4 h-4" />
                Warnung senden
              </motion.button>
              <motion.button
                onClick={onResetScore}
                className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4" />
                Score zurücksetzen
              </motion.button>
              <motion.button
                onClick={onBan}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Ban className="w-4 h-4" />
                {participant.status === 'banned' ? 'Entbannen' : 'Bannen'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

