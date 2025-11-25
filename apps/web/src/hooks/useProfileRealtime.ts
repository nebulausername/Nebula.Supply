import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { useShopStore } from '../store/shop';

export interface ProfileRealtimeData {
  coins: number;
  inviteCount: number;
  inviteStatus: 'active' | 'pending' | 'claimed';
  recentActivity: RecentActivity[];
  achievements: AchievementUpdate[];
  stats: {
    totalDrops: number;
    wonDrops: number;
    rank: number;
    streak: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'coins' | 'invite' | 'drop' | 'purchase' | 'achievement';
  message: string;
  amount?: number;
  timestamp: string;
}

export interface AchievementUpdate {
  id: string;
  name: string;
  unlocked: boolean;
  progress: number;
  timestamp: string;
}

export interface UseProfileRealtimeOptions {
  userId?: string;
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useProfileRealtime = (options: UseProfileRealtimeOptions = {}) => {
  const {
    userId = 'default-user',
    enabled = true,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const [liveCoins, setLiveCoins] = useState<number | null>(null);
  const [liveInviteCount, setLiveInviteCount] = useState<number>(0);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [achievements, setAchievements] = useState<AchievementUpdate[]>([]);
  const [stats, setStats] = useState<ProfileRealtimeData['stats'] | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled ? true : false);

  const activityQueue = useRef<RecentActivity[]>([]);
  const maxActivityItems = 20;
  const reconnectAttemptsRef = useRef<number>(0);

  // Get coin balance from store
  const storeCoins = useShopStore((state) => state.coinsBalance);
  const addCoins = useShopStore((state) => state.addCoins);

  // WebSocket message handlers
  const handleCoinsUpdate = useCallback((data: any) => {
    try {
      console.log('[ProfileRealtime] Coins updated:', data);
      const newCoins = data.amount || data.balance;
      setLiveCoins(newCoins);
      setError(null);
      
      // Update store
      if (data.delta) {
        addCoins(data.delta);
      }

      // Add to activity feed
      if (data.delta && data.delta > 0) {
        const activity: RecentActivity = {
          id: Math.random().toString(36).slice(2),
          type: 'coins',
          message: `+${data.delta} Coins erhalten`,
          amount: data.delta,
          timestamp: new Date().toISOString()
        };
        activityQueue.current = [activity, ...activityQueue.current].slice(0, maxActivityItems);
        setRecentActivity([...activityQueue.current]);
      }
    } catch (err) {
      console.error('[ProfileRealtime] Error handling coins update:', err);
      setError('Fehler beim Aktualisieren der Coins');
    }
  }, [addCoins, maxActivityItems]);

  const handleInviteUpdate = useCallback((data: any) => {
    console.log('[ProfileRealtime] Invite updated:', data);
    setLiveInviteCount(data.count || data.totalInvites || 0);

    if (data.newInvite) {
      const activity: RecentActivity = {
        id: Math.random().toString(36).slice(2),
        type: 'invite',
        message: `Neuer Invite aktiviert: ${data.inviteName || 'Unbekannt'}`,
        timestamp: new Date().toISOString()
      };
      activityQueue.current = [activity, ...activityQueue.current].slice(0, maxActivityItems);
      setRecentActivity([...activityQueue.current]);
    }
  }, [maxActivityItems]);

  const handleAchievementUnlock = useCallback((data: any) => {
    console.log('[ProfileRealtime] Achievement unlocked:', data);
    const achievement: AchievementUpdate = {
      id: data.achievementId,
      name: data.name,
      unlocked: true,
      progress: 100,
      timestamp: new Date().toISOString()
    };
    
    setAchievements(prev => [achievement, ...prev].slice(0, 10));

    const activity: RecentActivity = {
      id: Math.random().toString(36).slice(2),
      type: 'achievement',
      message: `Achievement freigeschaltet: ${data.name}`,
      timestamp: new Date().toISOString()
    };
    activityQueue.current = [activity, ...activityQueue.current].slice(0, maxActivityItems);
    setRecentActivity([...activityQueue.current]);
  }, [maxActivityItems]);

  const handleStatsUpdate = useCallback((data: any) => {
    console.log('[ProfileRealtime] Stats updated:', data);
    setStats({
      totalDrops: data.totalDrops || 0,
      wonDrops: data.wonDrops || 0,
      rank: data.rank || 0,
      streak: data.streak || 0
    });
  }, []);

  const handleWebSocketMessage = useCallback((message: any) => {
    setLastUpdate(new Date().toISOString());

    switch (message.type) {
      case 'profile:coins_updated':
        handleCoinsUpdate(message.data);
        break;
      
      case 'profile:invite_activated':
        handleInviteUpdate(message.data);
        break;
      
      case 'profile:achievement_unlocked':
        handleAchievementUnlock(message.data);
        break;
      
      case 'profile:stats_update':
        handleStatsUpdate(message.data);
        break;
      
      default:
        // Ignore unknown message types
        break;
    }
  }, [handleCoinsUpdate, handleInviteUpdate, handleAchievementUnlock, handleStatsUpdate]);

  // WebSocket connection
  const { isConnected, sendMessage, reconnectAttempts } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: enabled,
    maxReconnectAttempts: 10, // More attempts for profile data
    reconnectInterval: 3000,
    useExponentialBackoff: true,
    onMessage: handleWebSocketMessage,
    onConnect: useCallback(() => {
      console.log('[ProfileRealtime] Connected to WebSocket');
      setError(null);
      setIsLoading(false);
      reconnectAttemptsRef.current = 0;
    }, []),
    onDisconnect: useCallback(() => {
      console.log('[ProfileRealtime] Disconnected from WebSocket');
      reconnectAttemptsRef.current += 1;
      if (reconnectAttemptsRef.current < 10) {
        setError('Verbindung getrennt. Versuche neu zu verbinden...');
      } else {
        setError('Verbindung fehlgeschlagen. Bitte Seite neu laden.');
      }
    }, []),
    onError: useCallback((error: Event) => {
      console.error('[ProfileRealtime] WebSocket error:', error);
      // Don't set error here as onDisconnect will handle it
      // This prevents duplicate error messages
    }, [])
  });

  // Subscribe to profile updates on connection
  useEffect(() => {
    if (isConnected && sendMessage) {
      // Small delay to ensure connection is fully established
      const timeoutId = setTimeout(() => {
        if (sendMessage) {
          sendMessage({
            type: 'subscribe:profile',
            data: { 
              userId, 
              components: ['coins', 'invites', 'achievements', 'activity', 'stats'] 
            }
          });
          console.log('[ProfileRealtime] Subscribed to profile updates for user:', userId);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, sendMessage, userId]);

  // Auto-refresh fallback (polling) - only if connected
  useEffect(() => {
    if (!autoRefresh || !enabled || !isConnected) return;

    const interval = setInterval(() => {
      // Trigger a refresh by sending a request
      if (sendMessage && isConnected) {
        sendMessage({
          type: 'profile:request_update',
          data: { userId }
        });
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, enabled, refreshInterval, sendMessage, userId, isConnected]);

  // Auto-cleanup old activities
  useEffect(() => {
    const cleanup = setInterval(() => {
      const cutoff = Date.now() - (10 * 60 * 1000); // 10 minutes
      activityQueue.current = activityQueue.current.filter(
        activity => new Date(activity.timestamp).getTime() > cutoff
      );
      setRecentActivity([...activityQueue.current]);
    }, 60000); // Cleanup every minute

    return () => clearInterval(cleanup);
  }, []);

  // Use live coins if available, otherwise fall back to store
  const displayCoins = liveCoins !== null ? liveCoins : storeCoins;

  return {
    coins: displayCoins,
    inviteCount: liveInviteCount,
    recentActivity,
    achievements,
    stats,
    isConnected,
    lastUpdate,
    error,
    isLoading,
    // Helper methods
    requestUpdate: useCallback(() => {
      if (sendMessage) {
        sendMessage({
          type: 'profile:request_update',
          data: { userId }
        });
      }
    }, [sendMessage, userId]),
    clearError: useCallback(() => {
      setError(null);
    }, [])
  };
};

