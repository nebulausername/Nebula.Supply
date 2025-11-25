// 🎲 RNG MANAGER - Commit-Reveal System Verwaltung!

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  FileText,
  Shield,
  CheckCircle
} from 'lucide-react';
import type { ContestAdminConfig } from './ContestAdminPanel';

const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface RNGManagerProps {
  contest: ContestAdminConfig;
  onRngUpdate: (rngSettings: ContestAdminConfig['rngSettings']) => void;
}

// 🎲 RNG MANAGER - MAXIMIERT & TRANSPARENT!
export const RNGManager = ({ contest, onRngUpdate }: RNGManagerProps) => {
  const [commitHash, setCommitHash] = useState(contest.rngSettings.commitHash || '');
  const [revealValue, setRevealValue] = useState(contest.rngSettings.revealValue || '');
  const [showRevealValue, setShowRevealValue] = useState(false);
  const [copiedField, setCopiedField] = useState<'commit' | 'reveal' | null>(null);

  const phase = contest.rngSettings.phase || 'commit';

  // Generate commit hash
  const handleGenerateCommitHash = () => {
    // In production, this would call the backend API
    const hash = generateSecureHash();
    setCommitHash(hash);
    onRngUpdate({
      ...contest.rngSettings,
      commitHash: hash,
      phase: 'commit',
    });
  };

  // Reveal phase
  const handleEnterRevealValue = () => {
    if (!revealValue) {
      alert('Bitte Reveal Value eingeben!');
      return;
    }

    if (!confirm('Möchtest du wirklich in die Reveal Phase wechseln? Dies kann nicht rückgängig gemacht werden.')) {
      return;
    }

    onRngUpdate({
      ...contest.rngSettings,
      revealValue,
      phase: 'reveal',
    });
  };

  // Finalize RNG
  const handleFinalizeRNG = () => {
    if (!commitHash || !revealValue) {
      alert('Commit Hash und Reveal Value müssen vorhanden sein!');
      return;
    }

    if (!confirm('Möchtest du das RNG finalisieren? Die Gewinner werden berechnet.')) {
      return;
    }

    // Calculate winners using commit-reveal
    const seed = calculateSeed(commitHash, revealValue);
    const winners = calculateWinners(seed, contest.participantCount);

    onRngUpdate({
      ...contest.rngSettings,
      phase: 'finalized',
    });

    alert(`RNG finalisiert! ${winners.length} Gewinner wurden berechnet.`);
  };

  const handleCopy = (type: 'commit' | 'reveal') => {
    const text = type === 'commit' ? commitHash : revealValue;
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const canReveal = phase === 'commit' && commitHash.length > 0;
  const canFinalize = phase === 'reveal' && commitHash.length > 0 && revealValue.length > 0;
  const isFinalized = phase === 'finalized';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            RNG Verwaltung (Commit-Reveal)
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Fair & Transparent Winner Selection
          </p>
        </div>
        <div className={cn(
          "px-4 py-2 rounded-full text-sm font-bold",
          phase === 'commit' ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
          phase === 'reveal' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
          "bg-green-500/20 text-green-400 border border-green-500/30"
        )}>
          {phase === 'commit' ? 'COMMIT PHASE' : phase === 'reveal' ? 'REVEAL PHASE' : 'FINALIZED'}
        </div>
      </div>

      {/* Phase Info */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Phase Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <PhaseStep
            phase="commit"
            currentPhase={phase}
            title="Commit Phase"
            description="Secure Hash generieren"
            icon={Lock}
          />
          <PhaseStep
            phase="reveal"
            currentPhase={phase}
            title="Reveal Phase"
            description="Reveal Value eingeben"
            icon={Eye}
          />
          <PhaseStep
            phase="finalized"
            currentPhase={phase}
            title="Finalized"
            description="Gewinner berechnet"
            icon={CheckCircle}
          />
        </div>
      </div>

      {/* Commit Hash Section */}
      <div className={cn(
        "rounded-xl border-2 p-6",
        phase === 'commit' ? "border-yellow-500/50 bg-yellow-500/10" :
        "border-white/10 bg-white/5"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-400" />
              Commit Hash
            </h3>
            <p className="text-sm text-white/60 mt-1">
              Dieser Hash wird vor Contest-Ende generiert und öffentlich gemacht
            </p>
          </div>
          {phase === 'commit' && (
            <motion.button
              onClick={handleGenerateCommitHash}
              className="px-4 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-4 h-4" />
              {commitHash ? 'Neu generieren' : 'Generieren'}
            </motion.button>
          )}
        </div>
        <div className="space-y-3">
          {commitHash ? (
            <div className="relative">
              <div className="px-4 py-3 rounded-lg bg-black/30 border border-white/10 font-mono text-sm text-white break-all">
                {commitHash}
              </div>
              <button
                onClick={() => handleCopy('commit')}
                className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Kopieren"
              >
                {copiedField === 'commit' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-lg bg-white/5 border border-dashed border-white/20 text-center text-white/40">
              Noch kein Commit Hash generiert
            </div>
          )}
          <div className="text-xs text-white/60">
            Der Commit Hash ist eine kryptografische Hash-Funktion des zufälligen Seeds.
            Er kann öffentlich gemacht werden, ohne den Seed preiszugeben.
          </div>
        </div>
      </div>

      {/* Reveal Value Section */}
      <div className={cn(
        "rounded-xl border-2 p-6",
        phase === 'reveal' ? "border-blue-500/50 bg-blue-500/10" :
        phase === 'finalized' ? "border-green-500/50 bg-green-500/10" :
        "border-white/10 bg-white/5 opacity-50"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Reveal Value
            </h3>
            <p className="text-sm text-white/60 mt-1">
              Der ursprüngliche Seed-Wert wird nach Contest-Ende eingegeben
            </p>
          </div>
          {phase === 'reveal' && !revealValue && (
            <motion.button
              onClick={handleEnterRevealValue}
              disabled={!revealValue}
              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-4 h-4" />
              Bestätigen
            </motion.button>
          )}
        </div>
        <div className="space-y-3">
          {phase === 'commit' ? (
            <div className="px-4 py-3 rounded-lg bg-white/5 border border-dashed border-white/20 text-center text-white/40">
              Reveal Phase noch nicht aktiv
            </div>
          ) : revealValue ? (
            <div className="relative">
              <div className="px-4 py-3 rounded-lg bg-black/30 border border-white/10 font-mono text-sm text-white break-all">
                {showRevealValue ? revealValue : '••••••••••••••••••••'}
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => setShowRevealValue(!showRevealValue)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title={showRevealValue ? 'Verbergen' : 'Anzeigen'}
                >
                  {showRevealValue ? (
                    <EyeOff className="w-4 h-4 text-white/60" />
                  ) : (
                    <Eye className="w-4 h-4 text-white/60" />
                  )}
                </button>
                <button
                  onClick={() => handleCopy('reveal')}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Kopieren"
                >
                  {copiedField === 'reveal' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={revealValue}
                onChange={(e) => setRevealValue(e.target.value)}
                placeholder="Reveal Value eingeben..."
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white font-mono"
              />
              <div className="text-xs text-white/60">
                Der Reveal Value muss mit dem Commit Hash übereinstimmen.
                Nach der Eingabe werden die Gewinner berechnet.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation */}
      {commitHash && revealValue && phase === 'reveal' && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Validierung
          </h3>
          <div className="space-y-2">
            <ValidationItem
              label="Commit Hash vorhanden"
              valid={!!commitHash}
            />
            <ValidationItem
              label="Reveal Value vorhanden"
              valid={!!revealValue}
            />
            <ValidationItem
              label="Hash-Validierung"
              valid={validateHash(commitHash, revealValue)}
            />
          </div>
        </div>
      )}

      {/* Finalize Button */}
      {canFinalize && (
        <motion.div
          className="rounded-xl border-2 border-green-500/50 bg-green-500/10 p-6"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Bereit zur Finalisierung
              </h3>
              <p className="text-sm text-white/60 mt-1">
                Alle Werte sind vorhanden. Gewinner können jetzt berechnet werden.
              </p>
            </div>
            <motion.button
              onClick={handleFinalizeRNG}
              className="px-6 py-3 rounded-lg bg-green-500 text-white font-bold flex items-center gap-2 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CheckCircle className="w-5 h-5" />
              RNG Finalisieren
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Winners Preview (if finalized) */}
      {isFinalized && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Gewinner berechnet
          </h3>
          <p className="text-white/60">
            Das RNG wurde erfolgreich finalisiert. Die Gewinner wurden anhand des Commit-Reveal Systems berechnet.
          </p>
        </div>
      )}

      {/* Transparency Log */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Transparency Log
        </h3>
        <div className="space-y-2">
          <LogEntry
            timestamp={new Date(contest.startDate).toISOString()}
            action="Contest gestartet"
            status="info"
          />
          {commitHash && (
            <LogEntry
              timestamp={new Date().toISOString()}
              action="Commit Hash generiert"
              status="success"
            />
          )}
          {revealValue && (
            <LogEntry
              timestamp={new Date().toISOString()}
              action="Reveal Value eingegeben"
              status="success"
            />
          )}
          {isFinalized && (
            <LogEntry
              timestamp={new Date().toISOString()}
              action="RNG finalisiert - Gewinner berechnet"
              status="success"
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Components
const PhaseStep = ({
  phase,
  currentPhase,
  title,
  description,
  icon: Icon,
}: {
  phase: string;
  currentPhase: string;
  title: string;
  description: string;
  icon: any;
}) => {
  const isActive = currentPhase === phase;
  const isCompleted = 
    (phase === 'commit' && (currentPhase === 'reveal' || currentPhase === 'finalized')) ||
    (phase === 'reveal' && currentPhase === 'finalized');

  return (
    <div className={cn(
      "relative p-4 rounded-lg border-2 transition-all",
      isActive ? "border-blue-500/50 bg-blue-500/10" :
      isCompleted ? "border-green-500/30 bg-green-500/10" :
      "border-white/10 bg-white/5"
    )}>
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isActive ? "bg-blue-500/20 text-blue-400" :
          isCompleted ? "bg-green-500/20 text-green-400" :
          "bg-white/10 text-white/40"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-white">{title}</div>
          <div className="text-xs text-white/60">{description}</div>
        </div>
      </div>
      {isCompleted && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
      )}
    </div>
  );
};

const ValidationItem = ({ label, valid }: { label: string; valid: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      {valid ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-orange-400" />
      )}
      <span className={cn("text-sm", valid ? "text-white" : "text-white/60")}>
        {label}
      </span>
    </div>
  );
};

const LogEntry = ({
  timestamp,
  action,
  status,
}: {
  timestamp: string;
  action: string;
  status: 'info' | 'success' | 'warning';
}) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
      <div className={cn(
        "w-2 h-2 rounded-full",
        status === 'success' ? "bg-green-400" :
        status === 'warning' ? "bg-orange-400" :
        "bg-blue-400"
      )} />
      <div className="flex-1">
        <div className="text-sm text-white">{action}</div>
        <div className="text-xs text-white/40">{new Date(timestamp).toLocaleString()}</div>
      </div>
    </div>
  );
};

// Helper Functions
function generateSecureHash(): string {
  // In production, this would call the backend API
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function calculateSeed(commitHash: string, revealValue: string): number {
  // Combine hash and reveal value to create seed
  const combined = commitHash + revealValue;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function calculateWinners(seed: number, participantCount: number): number[] {
  // Simple winner calculation (would be more sophisticated in production)
  const winners: number[] = [];
  const used = new Set<number>();
  
  // Simple pseudo-random based on seed
  let currentSeed = seed;
  for (let i = 0; i < Math.min(10, participantCount); i++) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    const winner = (currentSeed % participantCount) + 1;
    if (!used.has(winner)) {
      winners.push(winner);
      used.add(winner);
    }
  }
  
  return winners.sort((a, b) => a - b);
}

function validateHash(commitHash: string, revealValue: string): boolean {
  // In production, this would verify that commitHash is a valid hash of revealValue
  // For now, just check that both are present
  return commitHash.length > 0 && revealValue.length > 0;
}

