import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Clock, Zap, Cookie, Crown, Star, RefreshCw, Users, Radio, Flame, TrendingUp, Sparkles, ArrowUp } from 'lucide-react';
import { useCookieLeaderboard } from '../../hooks/useCookieLeaderboard';
import { useAuthStore } from '../../store/auth';
import { useCookieLeaderboardStore } from '../../store/cookieLeaderboard';
import { formatNumber, formatTime } from '../../utils/cookieFormatters';
import { cn } from '../../utils/cn';
import type { LeaderboardType } from '../../store/cookieLeaderboard';
import { ActivityFeed } from './ActivityFeed';

export const CookieLeaderboard = () => {
  const [activeType, setActiveType] = useState<LeaderboardType>('totalCookies');
  const {
    leaderboards,
    isLoading,
    isConnected,
    currentLeaderboard,
    refresh
  } = useCookieLeaderboard();
  
  const user = useAuthStore((state) => state.user);
  const { onlinePlayerCount, totalPlayerCount, updatePlayerCounts } = useCookieLeaderboardStore();
  
  // Simulate player count updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly adjust online count (±2-5%)
      const change = Math.random() > 0.5 ? 
        generateRandomPlayerCount(15, 40) : 
        -generateRandomPlayerCount(15, 40);
      const newOnline = Math.max(500, Math.min(3000, onlinePlayerCount + change));
      
      // Slowly grow total count (±0.1-0.3%)
      const totalChange = Math.random() > 0.5 ?
        Math.floor(totalPlayerCount * 0.003) :
        -Math.floor(totalPlayerCount * 0.001);
      const newTotal = Math.max(15000, totalPlayerCount + totalChange);
      
      updatePlayerCounts(newOnline, newTotal);
    }, 3000 + Math.random() * 2000); // Every 3-5 seconds
    
    return () => clearInterval(interval);
  }, [onlinePlayerCount, totalPlayerCount, updatePlayerCounts]);
  
  // Helper function
  const generateRandomPlayerCount = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Get current user's rank
  const currentUserRank = useMemo(() => {
    if (!user || !currentLeaderboard) return null;
    return currentLeaderboard.findIndex(p => p.userId === user.id) + 1;
  }, [user, currentLeaderboard]);

  // Get medal icon for top 3
  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-400" />;
      default:
        return null;
    }
  };

  // Get display value for current type
  const getDisplayValue = (player: typeof currentLeaderboard[0]) => {
    switch (activeType) {
      case 'totalCookies':
        return formatNumber(player.totalCookies);
      case 'cps':
        return `${formatNumber(player.cookiesPerSecond)}/s`;
      case 'timePlayed':
        return formatTime(player.timePlayed);
      default:
        return '';
    }
  };

  // Get icon for type
  const getTypeIcon = (type: LeaderboardType) => {
    switch (type) {
      case 'totalCookies':
        return Cookie;
      case 'cps':
        return Zap;
      case 'timePlayed':
        return Clock;
    }
  };

  const tabs: Array<{ type: LeaderboardType; label: string; icon: typeof Cookie }> = [
    { type: 'totalCookies', label: 'Top Cookies', icon: Cookie },
    { type: 'cps', label: 'Top CPS', icon: Zap },
    { type: 'timePlayed', label: 'Top Zeit', icon: Clock }
  ];

  // Determine trending status for a player
  const getTrendingStatus = useCallback((player: typeof currentLeaderboard[0], rank: number, index: number) => {
    const statuses: Array<{ type: 'hot' | 'rising' | 'new' | 'fire'; label: string; icon: typeof Flame; color: string; bgColor: string }> = [];
    
    // "On Fire" - High CPS (top 5% of all players)
    if (player.cookiesPerSecond > 100 && index < currentLeaderboard.length * 0.05) {
      statuses.push({
        type: 'fire',
        label: 'On Fire',
        icon: Flame,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20 border-orange-500/30'
      });
    }
    
    // "Hot Right Now" - Recent activity (top 20 and high CPS)
    if (rank <= 20 && player.cookiesPerSecond > 50) {
      statuses.push({
        type: 'hot',
        label: 'Hot',
        icon: Sparkles,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20 border-yellow-500/30'
      });
    }
    
    // "Rising" - In top 10 but not top 3 (climbing)
    if (rank > 3 && rank <= 10) {
      statuses.push({
        type: 'rising',
        label: 'Rising',
        icon: TrendingUp,
        color: 'text-green-400',
        bgColor: 'bg-green-500/20 border-green-500/30'
      });
    }
    
    // "New Entry" - Entered top 10 recently (simulated - random chance)
    if (rank <= 10 && Math.random() > 0.7) {
      statuses.push({
        type: 'new',
        label: 'New',
        icon: Star,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20 border-blue-500/30'
      });
    }
    
    return statuses.slice(0, 2); // Max 2 badges
  }, [currentLeaderboard]);

  return (
    <>
      {/* Activity Feed - Fake Hype Notifications */}
      <ActivityFeed players={currentLeaderboard || []} />
      
      <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-white/10">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  {isConnected ? (
                    <motion.div
                      className="w-2 h-2 rounded-full bg-green-400"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  )}
                  <span className="text-sm text-white/60">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Aktualisieren
          </button>
        </div>
        
        {/* Live Player Count Indicators */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Radio className="w-4 h-4 text-green-400" />
                </motion.div>
                <span className="text-xs text-green-400/80 font-medium">Online Now</span>
              </div>
              <motion.div
                key={onlinePlayerCount}
                initial={{ scale: 1.2, color: "#22c55e" }}
                animate={{ scale: 1, color: "#ffffff" }}
                transition={{ duration: 0.5 }}
                className="text-xl font-bold text-white"
              >
                {onlinePlayerCount.toLocaleString('de-DE')}
              </motion.div>
            </div>
            {/* Subtle pulse effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-400/80 font-medium">Total Players</span>
              </div>
              <motion.div
                key={totalPlayerCount}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-xl font-bold text-white"
              >
                {totalPlayerCount.toLocaleString('de-DE')}
              </motion.div>
            </div>
            {/* Subtle pulse effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeType === tab.type;
            return (
              <motion.button
                key={tab.type}
                onClick={() => setActiveType(tab.type)}
                className={cn(
                  "relative flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                  isActive
                    ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 text-white"
                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                )}
                whileHover={!isActive ? { scale: 1.02 } : {}}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="bg-gradient-to-br from-black/50 via-[#0a0a0a]/50 to-black/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
        {isLoading && currentLeaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-white/60">Lade Leaderboard...</p>
          </div>
        ) : currentLeaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Noch keine Spieler im Leaderboard</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence mode="wait">
              {currentLeaderboard.slice(0, 100).map((player, index) => {
                const isCurrentUser = user && player.userId === user.id;
                const rank = index + 1;
                
                return (
                  <motion.div
                    key={`${player.userId}-${activeType}-${rank}`}
                    initial={{ opacity: 0, x: -50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.95 }}
                    transition={{ 
                      delay: index * 0.02,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className={cn(
                      "relative p-4 flex items-center gap-4 transition-all overflow-hidden",
                      isCurrentUser
                        ? "bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 border-l-4 border-purple-500"
                        : rank <= 10
                        ? "bg-gradient-to-r from-slate-800/50 to-slate-700/30 hover:from-slate-700/50 hover:to-slate-600/30"
                        : "hover:bg-white/5"
                    )}
                  >
                    {/* Gradient background for top 10 */}
                    {rank <= 10 && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: index * 0.1 }}
                      />
                    )}
                    
                    {/* Pulse effect for top 3 */}
                    {rank <= 3 && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 text-center">
                      {rank <= 3 ? (
                        <div className="flex items-center justify-center">
                          {getMedalIcon(rank)}
                        </div>
                      ) : (
                        <span className={cn(
                          "text-lg font-bold",
                          rank <= 10 ? "text-white" : "text-white/60"
                        )}>
                          #{rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0 relative">
                      <motion.div
                        className={cn(
                          "w-12 h-12 rounded-full border-2 overflow-hidden relative",
                          rank === 1 ? "border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)]" :
                          rank === 2 ? "border-gray-300 shadow-[0_0_15px_rgba(209,213,219,0.4)]" :
                          rank === 3 ? "border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.4)]" :
                          "border-white/20"
                        )}
                        animate={rank <= 3 ? {
                          scale: [1, 1.05, 1],
                        } : {}}
                        transition={rank <= 3 ? {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        } : {}}
                      >
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt={player.nickname || 'Player'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Cookie className="w-6 h-6 text-purple-400" />
                          </div>
                        )}
                        {/* Glow effect for top 3 */}
                        {rank <= 3 && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2"
                            style={{
                              borderColor: rank === 1 ? 'rgba(234, 179, 8, 0.5)' :
                                         rank === 2 ? 'rgba(209, 213, 219, 0.5)' :
                                         'rgba(251, 146, 60, 0.5)'
                            }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 0, 0.5]
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                        )}
                      </motion.div>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn(
                          "font-bold truncate",
                          isCurrentUser ? "text-purple-400" : "text-white"
                        )}>
                          {player.nickname || 'Unbekannt'}
                        </span>
                        {isCurrentUser && (
                          <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                            Du
                          </span>
                        )}
                        {/* Trending Badges */}
                        {getTrendingStatus(player, rank, index).map((status, idx) => {
                          const Icon = status.icon;
                          return (
                            <motion.span
                              key={`${status.type}-${idx}`}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: index * 0.02 + 0.2, type: "spring", stiffness: 200 }}
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full border flex items-center gap-1",
                                status.bgColor,
                                status.color
                              )}
                            >
                              <Icon className="w-3 h-3" />
                              <span className="font-medium">{status.label}</span>
                            </motion.span>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/60">
                        <span>{formatNumber(player.totalCookies)} Cookies</span>
                        <span>{formatNumber(player.cookiesPerSecond)}/s</span>
                        <span>{formatTime(player.timePlayed)}</span>
                      </div>
                    </div>

                    {/* Stat Value */}
                    <div className="flex-shrink-0 text-right relative z-10">
                      <motion.div
                        key={`${player.userId}-${activeType}-value`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.02 + 0.1 }}
                        className={cn(
                          "text-lg font-bold",
                          rank === 1 ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" :
                          rank === 2 ? "text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.4)]" :
                          rank === 3 ? "text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]" :
                          "text-white"
                        )}
                      >
                        {getDisplayValue(player)}
                      </motion.div>
                      {/* Rank change indicator (simulated) */}
                      {rank <= 10 && Math.random() > 0.8 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center justify-end gap-1 mt-1"
                        >
                          <ArrowUp className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-400 font-medium">
                            +{Math.floor(Math.random() * 5) + 1}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

        {/* Current User Rank Info */}
        {currentUserRank && currentUserRank > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-400" />
                <span className="text-white/80">Dein Rang:</span>
                <span className="font-bold text-purple-400">#{currentUserRank}</span>
              </div>
              <div className="text-sm text-white/60">
                {getDisplayValue(currentLeaderboard[currentUserRank - 1])}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

