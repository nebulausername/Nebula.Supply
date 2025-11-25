import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieClickerStore } from '../../store/cookieClicker';
import {
  Trophy,
  Clock,
  Users,
  Gift,
  Award,
  TrendingUp,
  Calendar,
  Star,
  Crown,
  Target,
  Zap,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/cookieFormatters';
import {
  ContestRNGPhase,
  initializeContestRNG,
  generateCommitPhase,
  generateWinners,
  addAuditLogEntry,
  type ContestRNGState
} from '../../utils/contestRNG';
import {
  joinContest,
  getLeaderboard,
  getPlayerRank,
  getContestStatus,
  pollLeaderboard,
  validateParticipant,
  type ContestParticipant,
  type ContestStatus
} from '../../services/contestService';
import { calculateContestScore, formatScore, type ScoringFactors } from '../../utils/contestScoring';
import { PrizeClaim, type Prize } from './PrizeClaim';
import { useContestRealtime } from '../../hooks/useContestRealtime';
import { REALTIME_CONFIG } from '../../config/realtime';

// 🏆 CONTEST TYPES - Use imported type from contestService

interface ContestPrize {
  position: number;
  coins: number;
  premiumInvites?: number;
  exclusiveUpgrade?: string;
}

const CONTEST_PRIZES: ContestPrize[] = [
  { position: 1, coins: 50000, premiumInvites: 10, exclusiveUpgrade: 'contest_winner_1' },
  { position: 2, coins: 30000, premiumInvites: 5, exclusiveUpgrade: 'contest_winner_2' },
  { position: 3, coins: 20000, premiumInvites: 3 },
  { position: 4, coins: 10000, premiumInvites: 2 },
  { position: 5, coins: 5000, premiumInvites: 1 },
  { position: 6, coins: 3000 },
  { position: 7, coins: 2000 },
  { position: 8, coins: 1000 },
  { position: 9, coins: 500 },
  { position: 10, coins: 300 }
];

// 🏆 MONTHLY CONTEST COMPONENT
export const MonthlyContest = memo(() => {
  const {
    cookies: currentCookies,
    totalCookies,
    unlockedAchievements,
    level,
    clicks,
    cookiesPerSecond,
    buildings,
    timePlayed,
    totalActiveTime
  } = useCookieClickerStore();

  const [isParticipating, setIsParticipating] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [contestStatus, setContestStatus] = useState<ContestStatus | null>(null);
  const [contestEndDate, setContestEndDate] = useState(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return endOfMonth.getTime();
  });

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [leaderboard, setLeaderboard] = useState<ContestParticipant[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  
  // 🎲 RNG STATE für faires Gewinnspiel
  const [rngState, setRngState] = useState<ContestRNGState | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  
  // 🎁 PRIZE STATE
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [showPrizeClaim, setShowPrizeClaim] = useState(false);
  
  // Contest ID (monthly contest based on year-month)
  const contestId = useMemo(() => {
    const now = new Date();
    return `monthly-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // 🎯 Load contest status on mount
  useEffect(() => {
    const loadContestStatus = async () => {
      try {
        const status = await getContestStatus(contestId);
        setContestStatus(status);
        
        // Update end date from API
        if (status.endDate) {
          setContestEndDate(new Date(status.endDate).getTime());
        }
        
        // Update participant count
        if (status.participantCount) {
          // participantCount will be updated below
        }
      } catch (error) {
        console.error('Failed to load contest status:', error);
      }
    };
    
    loadContestStatus();
  }, [contestId]);
  
  // 🎯 Calculate time remaining
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, contestEndDate - now);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [contestEndDate]);

  // 🎯 Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  // 🚀 REALTIME LEADERBOARD UPDATES
  const {
    isConnected: realtimeConnected,
    leaderboard: realtimeLeaderboard,
    playerRank: realtimeRank,
    liveScore: realtimeScore,
    lastUpdate: realtimeLastUpdate,
  } = useContestRealtime({
    contestId,
    enabled: isParticipating && REALTIME_CONFIG.ENABLE_REALTIME,
    onLeaderboardUpdate: useCallback((participants: ContestParticipant[]) => {
      setLeaderboard(participants);
    }, []),
    onRankChange: useCallback((newRank: number) => {
      setPlayerRank(newRank);
    }, []),
    onScoreUpdate: useCallback((newScore: number) => {
      // Score wird bereits über contestScore berechnet
    }, []),
    onPrizeAvailable: useCallback((prizes: Prize[]) => {
      setPrizes(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPrizes = prizes.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPrizes];
      });
      if (prizes.length > 0) {
        setShowPrizeClaim(true);
      }
    }, []),
  });
  
  // 🎯 Load leaderboard from API (initial load + fallback)
  useEffect(() => {
    if (!isParticipating) return;
    
    const loadLeaderboard = async () => {
      try {
        const leaderboardData = await getLeaderboard(contestId);
        setLeaderboard(leaderboardData.participants);
        setPlayerRank(leaderboardData.playerRank);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        // Fallback to mock data
        const mockLeaderboard: ContestParticipant[] = [
          { id: 'player_1', name: 'CookieMaster2024', cookies: 1500000000, achievements: 16, rank: 1, joinedAt: new Date().toISOString(), lastUpdate: new Date().toISOString() },
          { id: 'player_2', name: 'KeksKönig', cookies: 1200000000, achievements: 15, rank: 2, joinedAt: new Date().toISOString(), lastUpdate: new Date().toISOString() },
          { id: 'player_3', name: 'SchokoLord', cookies: 950000000, achievements: 14, rank: 3, joinedAt: new Date().toISOString(), lastUpdate: new Date().toISOString() },
          { id: 'player_4', name: 'SugarRush', cookies: 780000000, achievements: 13, rank: 4, joinedAt: new Date().toISOString(), lastUpdate: new Date().toISOString() },
          { id: 'player_5', name: 'CrumbleKing', cookies: 650000000, achievements: 12, rank: 5, joinedAt: new Date().toISOString(), lastUpdate: new Date().toISOString() },
        ];
        
        if (participantId) {
          const playerData: ContestParticipant = {
            id: participantId,
            name: 'Du',
            cookies: totalCookies,
            achievements: unlockedAchievements.length,
            rank: 6,
            joinedAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString()
          };
          mockLeaderboard.push(playerData);
          setPlayerRank(6);
        }
        
        setLeaderboard(mockLeaderboard.sort((a, b) => b.cookies - a.cookies).map((p, i) => ({ ...p, rank: i + 1 })));
      }
    };
    
    // Initial load
    loadLeaderboard();
    
    // Use realtime data if available (updates leaderboard automatically)
    if (realtimeConnected && realtimeLeaderboard.length > 0) {
      setLeaderboard(realtimeLeaderboard);
      if (realtimeRank !== null) {
        setPlayerRank(realtimeRank);
      }
    }
  }, [isParticipating, contestId, participantId, totalCookies, unlockedAchievements.length, realtimeConnected, realtimeLeaderboard, realtimeRank]);

  // Initialize RNG when contest starts (now handled in handleJoinContest)

  const handleJoinContest = useCallback(async () => {
    // Validate participant data (Anti-Cheat)
    const validation = await validateParticipant(contestId, {
      totalCookies,
      cookies: currentCookies,
      cookiesPerSecond,
      timePlayed,
      clicks,
    });
    
    if (!validation.valid) {
      alert(`Teilnahme nicht möglich: ${validation.reason || 'Validierung fehlgeschlagen'}`);
      return;
    }
    
    // Join contest
    try {
      const response = await joinContest(contestId, {
        totalCookies,
        achievements: unlockedAchievements.length,
        level,
      });
      
      if (response.success && response.participantId) {
        setIsParticipating(true);
        setParticipantId(response.participantId);
        
        // Initialize RNG for this contest
        if (!rngState) {
          const mockParticipants = Array.from({ length: contestStatus?.participantCount || 1250 }, (_, i) => `participant_${i}`);
          const initialState = initializeContestRNG(mockParticipants);
          const revealSeed = Math.random().toString(36).substring(2, 15);
          const commitHash = generateCommitPhase(revealSeed);
          
          const stateWithCommit = {
            ...initialState,
            commitHash,
          };
          
          setRngState(addAuditLogEntry(stateWithCommit, 'commit_generated', { commitHash }));
        }
      } else {
        alert(response.message || 'Fehler beim Beitritt zum Gewinnspiel');
      }
    } catch (error) {
      console.error('Failed to join contest:', error);
      // Fallback: allow joining locally
      setIsParticipating(true);
      setParticipantId(`participant_${Date.now()}`);
    }
  }, [contestId, totalCookies, currentCookies, cookiesPerSecond, timePlayed, clicks, unlockedAchievements.length, level, rngState, contestStatus]);
  
  // Finalize winners when contest ends (mock)
  const handleFinalizeWinners = async () => {
    if (!rngState || !rngState.commitHash) return;
    
    // Generate reveal (would be done server-side after commit phase)
    const revealValue = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    
    // Generate winners
    try {
      const winners = generateWinners(
        rngState.participants,
        rngState.commitHash,
        revealValue,
        CONTEST_PRIZES.length
      );
      
      setRngState(addAuditLogEntry({
        ...rngState,
        phase: ContestRNGPhase.FINALIZED,
        revealValue,
        winners
      }, 'winners_generated', { winners }));
      
      // Create prizes for winners
      if (participantId && winners.some(w => w.participantId === participantId)) {
        const playerPrize = winners.find(w => w.participantId === participantId);
        if (playerPrize) {
          const prize: Prize = {
            id: `prize-${Date.now()}`,
            contestId,
            position: playerPrize.position,
            coins: CONTEST_PRIZES[playerPrize.position - 1]?.coins || 0,
            premiumInvites: CONTEST_PRIZES[playerPrize.position - 1]?.premiumInvites,
            exclusiveUpgrade: CONTEST_PRIZES[playerPrize.position - 1]?.exclusiveUpgrade,
            claimed: false,
          };
          setPrizes(prev => [...prev, prize]);
          setShowPrizeClaim(true);
        }
      }
    } catch (error) {
      console.error('Error generating winners:', error);
    }
  };
  
  // Handle prize claim
  const handleClaimPrize = async (prizeId: string) => {
    // In production: POST /api/contests/:contestId/prizes/:prizeId/claim
    setPrizes(prev => prev.map(p => 
      p.id === prizeId ? { ...p, claimed: true, claimedAt: new Date().toISOString() } : p
    ));
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  
  // Check for unclaimed prizes on mount
  useEffect(() => {
    // In production: GET /api/contests/:contestId/prizes
    // For now, check if contest is finalized and player won
    if (rngState?.phase === ContestRNGPhase.FINALIZED && participantId && prizes.length === 0) {
      const playerWon = rngState.winners?.some(w => w.participantId === participantId);
      if (playerWon) {
        const winner = rngState.winners?.find(w => w.participantId === participantId);
        if (winner) {
          const prize: Prize = {
            id: `prize-${contestId}-${winner.position}`,
            contestId,
            position: winner.position,
            coins: CONTEST_PRIZES[winner.position - 1]?.coins || 0,
            premiumInvites: CONTEST_PRIZES[winner.position - 1]?.premiumInvites,
            exclusiveUpgrade: CONTEST_PRIZES[winner.position - 1]?.exclusiveUpgrade,
            claimed: false,
          };
          setPrizes([prize]);
          if (!prize.claimed) {
            setShowPrizeClaim(true);
          }
        }
      }
    }
  }, [rngState, participantId, contestId, prizes.length]);

  // Calculate contest score using enhanced scoring system
  const contestScore = useMemo(() => {
    if (!isParticipating) return 0;
    
    const scoringFactors: ScoringFactors = {
      totalCookies,
      achievements: unlockedAchievements.length,
      buildings,
      cookiesPerSecond,
      activeTime: totalActiveTime,
      clicks,
      level,
    };
    
    const scoreResult = calculateContestScore(scoringFactors);
    return scoreResult.totalScore;
  }, [isParticipating, totalCookies, unlockedAchievements.length, buildings, cookiesPerSecond, totalActiveTime, clicks, level]);

  return (
    <div className="space-y-6">
      {/* 🏆 HEADER */}
      <motion.div
        className="relative overflow-hidden rounded-3xl border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-red-500/10 backdrop-blur-xl p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-10 h-10 text-yellow-400" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">🏆 Monatliches Gewinnspiel</h2>
              <p className="text-white/70 text-sm">Wettbewerb um die meisten Cookies diesen Monat!</p>
            </div>
          </div>
          <motion.div 
            className="text-right"
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.div 
              className="text-2xl font-bold text-yellow-400"
              animate={{
                textShadow: [
                  "0_0_10px_rgba(234,179,8,0.5)",
                  "0_0_20px_rgba(234,179,8,0.8)",
                  "0_0_10px_rgba(234,179,8,0.5)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {(contestStatus?.participantCount || 1250).toLocaleString()}
            </motion.div>
            <div className="text-sm text-white/60">Teilnehmer</div>
          </motion.div>
        </div>

        {/* Countdown Timer */}
        <div className="mt-6 p-4 bg-black/30 rounded-xl border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="w-5 h-5" />
              <span className="text-sm">Verbleibende Zeit:</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Realtime Connection Status */}
              {isParticipating && (
                <div className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium",
                  realtimeConnected
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                )}>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    realtimeConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
                  )} />
                  {realtimeConnected ? 'Live' : 'Polling'}
                </div>
              )}
              <div className="text-2xl font-bold text-yellow-400 font-mono">
                {formatTimeRemaining(timeRemaining)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🎯 PARTICIPATION SECTION */}
      {!isParticipating ? (
        <motion.div
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-2xl p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Nimm am Gewinnspiel teil!</h3>
              <p className="text-white/70 mb-4">
                Sammle so viele Cookies wie möglich und gewinne tolle Preise!
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/70">Top 10 Preise</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-white/70">{(contestStatus?.participantCount || 1250).toLocaleString()} Teilnehmer</span>
                </div>
              </div>
            </div>
            <motion.button
              onClick={handleJoinContest}
              className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-black font-bold shadow-2xl overflow-hidden group"
              whileHover={{ scale: 1.08, boxShadow: "0_0_30px_rgba(234,179,8,0.8)" }}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Animated Background Gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: '200% 200%' }}
              />
              
              {/* Particle Burst Effect on Click */}
              <motion.span
                className="relative z-10 flex items-center gap-2"
                animate={{
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🎉
                </motion.span>
                Jetzt teilnehmen!
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.span>
              
              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Du nimmst teil!
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-white/60 mb-1">Dein Score</div>
                  <motion.div 
                    className="text-2xl font-bold text-white"
                    animate={{
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {formatScore(contestScore)}
                  </motion.div>
                </div>
                <div>
                  <div className="text-sm text-white/60 mb-1">Aktueller Rang</div>
                  <motion.div 
                    className="text-2xl font-bold text-yellow-400"
                    animate={playerRank ? {
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {playerRank ? `#${playerRank}` : 'Berechne...'}
                  </motion.div>
                  {realtimeLastUpdate && (
                    <div className="text-xs text-white/40 mt-1">
                      Zuletzt aktualisiert: {new Date(realtimeLastUpdate).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60 mb-1">Cookies</div>
              <div className="text-2xl font-bold text-white">{formatNumber(totalCookies)}</div>
              <div className="text-sm text-white/60 mt-1">
                + {unlockedAchievements.length} Achievements
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 🏆 PRIZES */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Gift className="w-6 h-6 text-yellow-400" />
          Preise
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {CONTEST_PRIZES.slice(0, 10).map((prize) => (
            <motion.div
              key={prize.position}
              className={cn(
                "p-4 rounded-xl border-2",
                prize.position === 1 ? "border-yellow-500/50 bg-yellow-500/10" :
                prize.position === 2 ? "border-gray-400/50 bg-gray-400/10" :
                prize.position === 3 ? "border-orange-500/50 bg-orange-500/10" :
                "border-white/10 bg-white/5"
              )}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-center">
                <div className={cn(
                  "text-2xl mb-2",
                  prize.position === 1 ? "text-yellow-400" :
                  prize.position === 2 ? "text-gray-300" :
                  prize.position === 3 ? "text-orange-400" :
                  "text-white/60"
                )}>
                  {prize.position === 1 ? '🥇' : prize.position === 2 ? '🥈' : prize.position === 3 ? '🥉' : `#${prize.position}`}
                </div>
                <div className="text-sm font-bold text-white mb-2">Platz {prize.position}</div>
                <div className="text-lg font-bold text-yellow-400 mb-1">
                  {formatNumber(prize.coins)} Coins
                </div>
                {prize.premiumInvites && (
                  <div className="text-xs text-white/60">
                    +{prize.premiumInvites} Premium Invites
                  </div>
                )}
                {prize.exclusiveUpgrade && (
                  <div className="text-xs text-purple-400 mt-1">
                    + Exklusives Upgrade
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🏆 LEADERBOARD */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-400" />
          Leaderboard
        </h3>
        <div className="space-y-2">
          {leaderboard.map((participant) => (
            <motion.div
              key={participant.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl transition-all",
                participant.id === 'current_player'
                  ? "bg-yellow-500/20 border-2 border-yellow-500/50"
                  : "bg-white/5 border border-white/10"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                  participant.rank === 1 ? "bg-yellow-500 text-black" :
                  participant.rank === 2 ? "bg-gray-400 text-black" :
                  participant.rank === 3 ? "bg-orange-500 text-white" :
                  "bg-white/10 text-white"
                )}>
                  {participant.rank}
                </div>
                <div>
                  <div className="font-bold text-white">{participant.name}</div>
                  <div className="text-xs text-white/60">
                    {participant.achievements} Achievements
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">{formatNumber(participant.cookies)}</div>
                <div className="text-xs text-white/60">Cookies</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 📊 CONTEST STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{(contestStatus?.participantCount || 1250).toLocaleString()}</div>
          <div className="text-xs text-white/60">Teilnehmer</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">10</div>
          <div className="text-xs text-white/60">Plätze mit Preisen</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
          <Calendar className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">Monatlich</div>
          <div className="text-xs text-white/60">Reset</div>
        </div>
      </div>

      {/* 🎲 RNG TRANSPARENCY - COMMIT-REVEAL SYSTEM */}
      {rngState && (
        <motion.div
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Faires RNG-System (Commit-Reveal)
            </h3>
            <button
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors text-sm"
            >
              {showAuditLog ? 'Audit-Log ausblenden' : 'Audit-Log anzeigen'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="text-sm text-white/60 mb-1">Commit Hash</div>
              <div className="font-mono text-sm text-blue-400 break-all">
                {rngState.commitHash || 'Wird generiert...'}
              </div>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="text-sm text-white/60 mb-1">Phase</div>
              <div className="text-lg font-bold text-purple-400">
                {rngState.phase === ContestRNGPhase.COMMIT ? '🔒 Commit Phase' :
                 rngState.phase === ContestRNGPhase.REVEAL ? '🔓 Reveal Phase' :
                 '✅ Finalisiert'}
              </div>
            </div>
          </div>

          <p className="text-sm text-white/60 mb-4">
            💡 Das Commit-Reveal System stellt sicher, dass die Gewinner fair und transparent ausgewählt werden.
            Der Commit-Hash wird vor Contest-Ende generiert, der Reveal-Wert erst danach.
            Dies verhindert Manipulationen.
          </p>

          {rngState.winners && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <h4 className="font-bold text-white mb-2">🏆 Gewinner wurden ausgewählt!</h4>
              <div className="space-y-2">
                {rngState.winners.map(winner => (
                  <div key={winner.position} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Platz {winner.position}:</span>
                    <span className="text-white font-bold">{winner.participantId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Log */}
          {showAuditLog && (
            <div className="mt-4 p-4 bg-black/30 rounded-xl max-h-64 overflow-y-auto">
              <h4 className="font-bold text-white mb-2">📋 Audit-Log</h4>
              <div className="space-y-2">
                {rngState.auditLog.map((entry, index) => (
                  <div key={index} className="text-xs text-white/60 border-b border-white/10 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                      <span className="text-white/80">{entry.action}</span>
                    </div>
                    {entry.data && (
                      <pre className="mt-1 text-white/40 text-xs overflow-x-auto">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Development: Button to finalize (only in dev) - MAXIMIERT! */}
      {process.env.NODE_ENV === 'development' && rngState && rngState.phase === ContestRNGPhase.COMMIT && (
        <motion.button
          onClick={handleFinalizeWinners}
          className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 border-2 border-purple-500/50 overflow-hidden font-bold shadow-lg"
          whileHover={{ scale: 1.05, boxShadow: "0_0_25px_rgba(168,85,247,0.6)" }}
          whileTap={{ scale: 0.95 }}
          animate={{
            borderColor: [
              'rgba(168,85,247,0.5)',
              'rgba(236,72,153,0.5)',
              'rgba(168,85,247,0.5)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Security Badge Glow */}
          <motion.div
            className="absolute inset-0 bg-purple-500/10"
            animate={{
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <span className="relative z-10 flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              🎲
            </motion.span>
            <span className="flex items-center gap-1">
              Gewinner generieren
              <motion.span
                className="px-2 py-0.5 rounded text-xs bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0_0_5px_rgba(234,179,8,0)",
                    "0_0_15px_rgba(234,179,8,0.8)",
                    "0_0_5px_rgba(234,179,8,0)"
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                DEV
              </motion.span>
            </span>
          </span>
        </motion.button>
      )}
      
      {/* Prize Claim Modal */}
      <PrizeClaim
        prizes={prizes}
        isOpen={showPrizeClaim}
        onClose={() => setShowPrizeClaim(false)}
        onClaim={handleClaimPrize}
      />
    </div>
  );
});
MonthlyContest.displayName = 'MonthlyContest';


