import { useState, useEffect, useCallback, memo } from 'react';
import { useCookieClickerStore, FAKE_LEADERBOARD_PLAYERS } from '../../store/cookieClicker';
import { 
  Trophy, 
  Crown, 
  Star, 
  Medal,
  Award,
  Target,
  TrendingUp,
  Users,
  Zap,
  Flame,
  Diamond,
  Gem
} from 'lucide-react';
import { cn } from '../../utils/cn';

// 🏅 LEADERBOARD PLAYER CARD - GEILE KARTEN!
const LeaderboardPlayerCard = memo(({ player, rank, isCurrentPlayer }: { 
  player: any; 
  rank: number;
  isCurrentPlayer: boolean;
}) => {
  // 🎯 RANK COLORS & ICONS
  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-300',
          icon: '👑',
          glow: 'shadow-yellow-500/30'
        };
      case 2:
        return {
          bg: 'bg-gray-400/20',
          border: 'border-gray-400/50',
          text: 'text-gray-300',
          icon: '🥈',
          glow: 'shadow-gray-400/30'
        };
      case 3:
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/50',
          text: 'text-orange-300',
          icon: '🥉',
          glow: 'shadow-orange-500/30'
        };
      default:
        return {
          bg: 'bg-white/5',
          border: 'border-white/10',
          text: 'text-text',
          icon: '🏅',
          glow: 'shadow-white/10'
        };
    }
  };

  const styles = getRankStyles(rank);

  // 🎯 FORMAT NUMBERS
  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}B`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}M`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all duration-300 hover:scale-105",
      styles.bg,
      styles.border,
      isCurrentPlayer && "ring-2 ring-accent/50 bg-accent/10",
      rank <= 3 && "shadow-lg",
      styles.glow
    )}>
      <div className="flex items-center gap-4">
        {/* 🎯 RANK */}
        <div className="flex items-center gap-2">
          <div className="text-2xl">{styles.icon}</div>
          <div className="text-2xl font-bold text-accent">#{rank}</div>
        </div>

        {/* 🎯 AVATAR & NAME */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">{player.avatar}</div>
          <div>
            <div className={cn(
              "font-bold text-lg",
              styles.text,
              isCurrentPlayer && "text-accent"
            )}>
              {player.name}
              {isCurrentPlayer && " (Du)"}
            </div>
            <div className="text-sm text-muted">
              Level {player.level} • Prestige {player.prestige}
            </div>
          </div>
        </div>

        {/* 🎯 COOKIES */}
        <div className="flex-1 text-right">
          <div className="text-xl font-bold text-text">
            {formatNumber(player.cookies)}
          </div>
          <div className="text-sm text-muted">Kekse</div>
        </div>

        {/* 🎯 BADGES */}
        <div className="flex items-center gap-1">
          {rank === 1 && <Crown className="h-5 w-5 text-yellow-400" />}
          {rank === 2 && <Medal className="h-5 w-5 text-gray-400" />}
          {rank === 3 && <Award className="h-5 w-5 text-orange-400" />}
          {player.prestige > 0 && <Star className="h-4 w-4 text-purple-400" />}
          {player.level >= 50 && <Zap className="h-4 w-4 text-blue-400" />}
        </div>
      </div>
    </div>
  );
});

// 🏅 GEILE LEADERBOARD SYSTEM - DEUTSCH & SÜCHTIG!
export const LeaderboardSystem = memo(() => {
  const {
    totalCookies,
    level,
    prestigeLevel,
    playerName,
    playerRank,
    updatePlayerRank
  } = useCookieClickerStore();

  const [timeFilter, setTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [sortBy, setSortBy] = useState<'cookies' | 'level' | 'prestige'>('cookies');

  // 🎯 UPDATE PLAYER RANK
  useEffect(() => {
    updatePlayerRank();
  }, [totalCookies, level, prestigeLevel, updatePlayerRank]);

  // 🎯 CREATE LEADERBOARD
  const createLeaderboard = useCallback(() => {
    const currentPlayer = {
      id: 'current_player',
      name: playerName,
      cookies: totalCookies,
      level: level,
      prestige: prestigeLevel,
      rank: 0,
      avatar: '🍪',
      isReal: true
    };

    const allPlayers = [...FAKE_LEADERBOARD_PLAYERS, currentPlayer];
    
    // Sort by selected criteria
    allPlayers.sort((a, b) => {
      switch (sortBy) {
        case 'level':
          return b.level - a.level;
        case 'prestige':
          return b.prestige - a.prestige;
        default:
          return b.cookies - a.cookies;
      }
    });

    // Assign ranks
    allPlayers.forEach((player, index) => {
      player.rank = index + 1;
    });

    return allPlayers;
  }, [playerName, totalCookies, level, prestigeLevel, sortBy]);

  const leaderboard = createLeaderboard();
  const currentPlayer = leaderboard.find(p => p.id === 'current_player');

  // 🎯 FORMAT NUMBERS
  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}B`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}M`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  return (
    <div className="space-y-6">
      {/* 🎯 HEADER */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text mb-2">🏆 Leaderboard</h2>
        <p className="text-muted">Die besten Cookie Clicker Spieler!</p>
      </div>

      {/* 🎯 CURRENT PLAYER STATS */}
      {currentPlayer && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🍪</div>
              <div>
                <div className="text-lg font-bold text-accent">
                  {currentPlayer.name} (Du)
                </div>
                <div className="text-sm text-muted">
                  Level {currentPlayer.level} • Prestige {currentPlayer.prestige}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent">
                #{currentPlayer.rank}
              </div>
              <div className="text-sm text-muted">Platz</div>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 FILTERS */}
      <div className="flex gap-2">
        <button
          onClick={() => setTimeFilter('all')}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            timeFilter === 'all' 
              ? "bg-accent text-black" 
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Alle Zeit
        </button>
        <button
          onClick={() => setTimeFilter('daily')}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            timeFilter === 'daily' 
              ? "bg-accent text-black" 
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Heute
        </button>
        <button
          onClick={() => setTimeFilter('weekly')}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            timeFilter === 'weekly' 
              ? "bg-accent text-black" 
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Diese Woche
        </button>
        <button
          onClick={() => setTimeFilter('monthly')}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            timeFilter === 'monthly' 
              ? "bg-accent text-black" 
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Dieser Monat
        </button>
      </div>

      {/* 🎯 SORT OPTIONS */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('cookies')}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            sortBy === 'cookies' 
              ? "bg-accent text-black" 
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Nach Keksen
        </button>
        <button
          onClick={() => setSortBy('level')}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            sortBy === 'level' 
              ? "bg-accent text-black" 
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Nach Level
        </button>
        <button
          onClick={() => setSortBy('prestige')}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            sortBy === 'prestige' 
              ? "bg-accent text-black" 
              : "bg-white/10 text-muted hover:bg-white/20"
          )}
        >
          Nach Prestige
        </button>
      </div>

      {/* 🎯 LEADERBOARD */}
      <div className="space-y-3">
        {leaderboard.slice(0, 10).map((player, index) => (
          <LeaderboardPlayerCard
            key={player.id}
            player={player}
            rank={player.rank}
            isCurrentPlayer={player.id === 'current_player'}
          />
        ))}
      </div>

      {/* 🎯 STATS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-lg font-bold text-text">{leaderboard.length}</div>
          <div className="text-sm text-muted">Spieler</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-2xl mb-2">🍪</div>
          <div className="text-lg font-bold text-text">
            {formatNumber(leaderboard[0]?.cookies || 0)}
          </div>
          <div className="text-sm text-muted">Beste Kekse</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-2xl mb-2">⭐</div>
          <div className="text-lg font-bold text-text">
            {Math.max(...leaderboard.map(p => p.level))}
          </div>
          <div className="text-sm text-muted">Höchstes Level</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-2xl mb-2">👑</div>
          <div className="text-lg font-bold text-text">
            {Math.max(...leaderboard.map(p => p.prestige))}
          </div>
          <div className="text-sm text-muted">Höchster Prestige</div>
        </div>
      </div>
    </div>
  );
});

LeaderboardSystem.displayName = 'LeaderboardSystem';