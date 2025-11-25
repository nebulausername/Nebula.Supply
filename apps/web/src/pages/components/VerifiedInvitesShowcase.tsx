import { memo, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Zap, Gift, Trophy, TrendingUp } from "lucide-react";
import { CircularProgress } from "../../components/CircularProgress";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAuthStore } from "../../store/auth";
import { Confetti } from "../../components/effects/Confetti";

interface LiveVerification {
  id: string;
  telegramId: number;
  userName: string;
  method: 'telegram' | 'selfie';
  timeAgo: string;
  reward: number;
  timestamp: string;
}

// Helper: Format time ago
const formatTimeAgo = (timestamp: string): string => {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes} Min`;
  if (hours < 24) return `vor ${hours} Std`;
  return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
};

// Helper: Anonymize user name
const anonymizeUserName = (name: string, telegramId: number): string => {
  if (!name) return `Nutzer ${telegramId.toString().slice(-4)}`;
  
  // If it's just a first name, use it
  if (name.split(' ').length === 1) {
    return name;
  }
  
  // If it has multiple parts, use first name + initial
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1][0]}.`;
  }
  
  return name;
};

export const VerifiedInvitesShowcase = memo(({
  verifiedCount: initialVerifiedCount,
  pendingCount,
  recentVerifications: initialRecentVerifications,
  reducedMotion
}: {
  verifiedCount: number;
  pendingCount: number;
  recentVerifications: any[];
  reducedMotion: boolean;
}) => {
  const [verifiedCount, setVerifiedCount] = useState(initialVerifiedCount);
  const [liveVerifications, setLiveVerifications] = useState<LiveVerification[]>(
    initialRecentVerifications.map((v, i) => ({
      id: v.id || `initial-${i}`,
      telegramId: v.telegramId || 0,
      userName: v.userName || 'Nutzer',
      method: v.method || 'telegram',
      timeAgo: v.timeAgo || '1 Std',
      reward: v.reward || 150,
      timestamp: v.timestamp || new Date(Date.now() - 3600000).toISOString()
    }))
  );
  const [isLive, setIsLive] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [recentRewards, setRecentRewards] = useState<Array<{ id: string; amount: number; timestamp: string }>>([]);
  const [teamLevel, setTeamLevel] = useState(1);
  const [teamProgress, setTeamProgress] = useState(0);
  
  // Get current user telegram ID
  const currentUserTelegramId = useMemo(() => {
    try {
      const telegramIdStr = typeof window !== 'undefined' ? localStorage.getItem('telegram_id') : null;
      if (telegramIdStr) {
        return parseInt(telegramIdStr, 10);
      }
      // Fallback: try to get from auth store
      const { user } = useAuthStore.getState();
      if (user?.id) {
        const idStr = user.id.replace('tg:', '');
        return parseInt(idStr, 10) || 0;
      }
    } catch (error) {
      console.warn('[VerifiedInvites] Failed to get telegram ID:', error);
    }
    return 0;
  }, []);

  // Handle live verification updates
  const handleLiveVerification = useCallback((data: { telegramId: number, userName: string, inviterTelegramId?: number, timestamp: string }) => {
    // Only show if it's for the current user or general homepage
    if (data.inviterTelegramId && data.inviterTelegramId !== currentUserTelegramId) {
      return; // Not for this user
    }

    const anonymizedName = anonymizeUserName(data.userName, data.telegramId);
    const timeAgo = formatTimeAgo(data.timestamp);
    
    const newVerification: LiveVerification = {
      id: `live-${data.telegramId}-${Date.now()}`,
      telegramId: data.telegramId,
      userName: anonymizedName,
      method: 'telegram',
      timeAgo,
      reward: 150, // Default reward
      timestamp: data.timestamp
    };

    setIsLive(true);
    setLiveVerifications(prev => [newVerification, ...prev].slice(0, 5));
    setVerifiedCount(prev => prev + 1);
    
    // Show confetti and reward notification
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Add reward notification
    const rewardAmount = 150; // Default reward
    setRecentRewards(prev => [{
      id: `reward-${Date.now()}`,
      amount: rewardAmount,
      timestamp: data.timestamp
    }, ...prev].slice(0, 3));
    
    // Update team level progress
    const newCount = verifiedCount + 1;
    const newLevel = Math.floor(newCount / 5) + 1;
    const newProgress = (newCount % 5) / 5 * 100;
    setTeamLevel(newLevel);
    setTeamProgress(newProgress);
    
    // Reset live indicator after 3 seconds
    setTimeout(() => setIsLive(false), 3000);
  }, [currentUserTelegramId, verifiedCount]);

  // WebSocket connection for live updates
  const { isConnected, sendMessage } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: true,
    onMessage: useCallback((message: any) => {
      // Handle both direct event format and wrapped format
      if (message.type === 'homepage:verification_live') {
        handleLiveVerification(message.data || message);
      } else if (message.event === 'homepage:verification_live') {
        handleLiveVerification(message.data || message);
      }
    }, [handleLiveVerification]),
    onConnect: useCallback(() => {
      console.log('[VerifiedInvites] Connected to WebSocket');
    }, []),
    onDisconnect: useCallback(() => {
      console.log('[VerifiedInvites] Disconnected from WebSocket');
    }, [])
  });

  // Subscribe to homepage events on connection
  useEffect(() => {
    if (isConnected && sendMessage) {
      // Small delay to ensure WebSocket is fully ready
      const timeoutId = setTimeout(() => {
        if (sendMessage && isConnected) {
          sendMessage({
            type: 'subscribe',
            data: { room: 'homepage' }
          });
          if (currentUserTelegramId) {
            sendMessage({
              type: 'subscribe',
              data: { room: `user:${currentUserTelegramId}` }
            });
          }
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, sendMessage, currentUserTelegramId]);

  // Update time ago for all verifications
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVerifications(prev => prev.map(v => ({
        ...v,
        timeAgo: formatTimeAgo(v.timestamp)
      })));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={isLive ? { scale: [1, 1.2, 1], rotate: [0, 360] } : {}}
            transition={{ duration: 0.6 }}
            className="p-3 rounded-xl bg-green-500/20"
          >
            <CheckCircle className="h-6 w-6 text-green-400" />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-green-400">Verifizierte Invites</h3>
            <p className="text-sm text-muted">Die einzigen die zählen! ✅</p>
          </div>
        </div>
        <div className="text-right">
          <motion.div
            animate={isLive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <p className="text-3xl font-bold text-green-400">{verifiedCount}</p>
            {isLive && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1"
              >
                <Zap className="h-3 w-3 text-green-400 animate-pulse" />
              </motion.div>
            )}
          </motion.div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <p className="text-sm text-muted">Bestätigt</p>
            {isConnected && (
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" title="Live Updates aktiv" />
            )}
          </div>
        </div>
      </div>

      {/* Confetti Effect */}
      <Confetti trigger={showConfetti} count={30} />
      
      {/* Team Level Progress */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-semibold text-text">Team Level {teamLevel}</span>
          </div>
          <span className="text-xs text-muted">{verifiedCount} Verifizierungen</span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-black/30">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${teamProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-center text-muted">
          {5 - (verifiedCount % 5)} bis Level {teamLevel + 1}
        </p>
      </div>

      {/* Progress Ring */}
      <div className="mb-6">
        <CircularProgress
          value={verifiedCount}
          max={verifiedCount + pendingCount}
          label="Verifiziert"
          size="lg"
          color="#10b981"
          className="mx-auto"
        />
        <p className="text-center text-sm text-muted mt-2">
          {Math.round((verifiedCount / (verifiedCount + pendingCount)) * 100)}% Erfolgsrate
        </p>
      </div>
      
      {/* Recent Rewards */}
      {recentRewards.length > 0 && (
        <div className="mb-6 space-y-2">
          <h4 className="text-sm font-semibold text-text flex items-center gap-2">
            <Gift className="h-4 w-4 text-accent" />
            Kürzliche Belohnungen
          </h4>
          <AnimatePresence>
            {recentRewards.map((reward) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between p-2 rounded-lg bg-accent/10 border border-accent/20"
              >
                <span className="text-xs text-muted">+{reward.amount} Coins</span>
                <span className="text-xs text-muted">{formatTimeAgo(reward.timestamp)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Recent Verifications - Live Updates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-text">🕐 Kürzliche Verifizierungen</h4>
          {isLive && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1"
            >
              <Zap className="h-3 w-3 text-green-400 animate-pulse" />
              <span className="text-xs font-medium text-green-400">Live</span>
            </motion.div>
          )}
        </div>
        <AnimatePresence mode="popLayout">
          {liveVerifications.length > 0 ? (
            liveVerifications.slice(0, 3).map((verification, index) => (
              <motion.div
                key={verification.id}
                initial={{ opacity: 0, x: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                transition={{ 
                  delay: index === 0 && isLive ? 0 : index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <motion.div
                  animate={index === 0 && isLive ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.6, repeat: index === 0 && isLive ? Infinity : 0 }}
                  className={`w-2 h-2 rounded-full ${
                    verification.method === 'telegram' ? 'bg-blue-400' : 'bg-purple-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text truncate">{verification.userName}</p>
                  <p className="text-xs text-muted">
                    {verification.method === 'telegram' ? '📱 Telegram Bot' : '🤳 Selfie Check'} • {verification.timeAgo}
                  </p>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-400 text-sm font-bold"
                >
                  +{verification.reward}
                </motion.div>
              </motion.div>
            ))
          ) : (
            <div className="p-4 text-center text-muted text-sm">
              Noch keine Verifizierungen
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
