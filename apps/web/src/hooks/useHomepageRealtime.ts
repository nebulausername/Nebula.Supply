import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { useDropsStore } from '../store/drops';
import { useShopStore } from '../store/shop';

export interface LiveStats {
  activeDrops: number;
  activeUsers: number;
  totalProducts: number;
  liveOrders: number;
  revenue: number;
  timestamp: string;
}

export interface LiveActivity {
  id: string;
  userId: string;
  userHandle: string;
  action: 'purchase' | 'interest' | 'invite' | 'achievement';
  resource: string;
  message: string;
  timestamp: string;
}

export interface DropUpdate {
  dropId: string;
  dropName: string;
  status: string;
  stock?: number;
  progress?: number;
  timestamp: string;
}

export interface HomepageRealtimeData {
  liveStats: LiveStats | null;
  recentActivity: LiveActivity[];
  dropUpdates: DropUpdate[];
  isConnected: boolean;
  lastUpdate: string | null;
}

export const useHomepageRealtime = () => {
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<LiveActivity[]>([]);
  const [dropUpdates, setDropUpdates] = useState<DropUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  const activityQueue = useRef<LiveActivity[]>([]);
  const maxActivityItems = 50;
  const maxDropUpdates = 20;

  // Define handlers first
  const handleStatsUpdate = useCallback((data: any) => {
    setLiveStats({
      activeDrops: data.activeDrops || 0,
      activeUsers: data.activeUsers || 0,
      totalProducts: data.totalProducts || 0,
      liveOrders: data.liveOrders || 0,
      revenue: data.revenue || 0,
      timestamp: data.timestamp || new Date().toISOString()
    });
  }, []);

  const handleActivityUpdate = useCallback((data: any) => {
    const newActivity: LiveActivity = {
      id: Math.random().toString(36).slice(2),
      userId: data.userId,
      userHandle: data.userHandle,
      action: data.action,
      resource: data.resource,
      message: data.message,
      timestamp: data.timestamp
    };

    // Add to queue
    activityQueue.current = [newActivity, ...activityQueue.current].slice(0, maxActivityItems);
    setRecentActivity([...activityQueue.current]);
  }, [maxActivityItems]);

  const handleDropUpdate = useCallback((message: any) => {
    const dropUpdate: DropUpdate = {
      dropId: message.data.dropId,
      dropName: message.data.dropName,
      status: message.data.status,
      stock: message.data.stock,
      progress: message.data.progress,
      timestamp: message.data.timestamp
    };

    setDropUpdates(prev => [dropUpdate, ...prev].slice(0, maxDropUpdates));

    // Update drops store if it's a progress update
    if (message.type === 'homepage:drop_progress' && message.data.progress !== undefined) {
      useDropsStore.getState().applyProgress(message.data.dropId, message.data.progress);
    }
  }, [maxDropUpdates]);

  const handleWebSocketMessage = useCallback((message: any) => {
    setLastUpdate(new Date().toISOString());

    switch (message.type) {
      case 'homepage:stats_update':
        handleStatsUpdate(message.data);
        break;
      
      case 'homepage:activity':
        handleActivityUpdate(message.data);
        break;
      
      case 'homepage:drop_new':
      case 'homepage:drop_stock_changed':
      case 'homepage:drop_progress':
        handleDropUpdate(message);
        break;
      
      case 'user:personal_invite_code_updated':
        // Trigger refresh of personal invite code
        if (message.data?.telegramId) {
          const { refreshPersonalInviteCode } = useShopStore.getState();
          refreshPersonalInviteCode(message.data.telegramId);
        }
        break;
      
      case 'homepage:verification_live':
        // Live verification updates are handled by VerifiedInvitesShowcase component
        // This is just for logging/debugging
        break;
      
      default:
        // Ignore unknown message types
        break;
    }
  }, [handleStatsUpdate, handleActivityUpdate, handleDropUpdate]);

  // WebSocket connection
  const { isConnected, lastMessage, sendMessage } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: true,
    onMessage: handleWebSocketMessage,
    onConnect: useCallback(() => {
      console.log('[HomepageRealtime] Connected to WebSocket');
    }, []),
    onDisconnect: useCallback(() => {
      console.log('[HomepageRealtime] Disconnected from WebSocket');
    }, [])
  });

  // Auto-cleanup old activities
  useEffect(() => {
    const cleanup = setInterval(() => {
      const cutoff = Date.now() - (5 * 60 * 1000); // 5 minutes
      activityQueue.current = activityQueue.current.filter(
        activity => new Date(activity.timestamp).getTime() > cutoff
      );
      setRecentActivity([...activityQueue.current]);
    }, 60000); // Cleanup every minute

    return () => clearInterval(cleanup);
  }, []);

  // Request initial data on connection
  useEffect(() => {
    if (isConnected && sendMessage) {
      sendMessage({
        type: 'subscribe:homepage',
        data: { components: ['stats', 'activity', 'drops'] }
      });
      
      // Subscribe to personal invite code updates
      const telegramId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('telegram_id') || '0', 10) : 0;
      if (telegramId) {
        sendMessage({
          type: 'subscribe',
          data: { room: `user:${telegramId}` }
        });
      }
    }
  }, [isConnected, sendMessage]);

  return {
    liveStats,
    recentActivity,
    dropUpdates,
    isConnected,
    lastUpdate
  };
};