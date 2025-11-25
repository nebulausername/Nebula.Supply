import { useEffect, useCallback, useRef } from 'react';
import { useCookieLeaderboardStore } from '../store/cookieLeaderboard';
import { useWebSocket } from './useWebSocket';
import { fetchLeaderboard } from '../api/cookieClicker';
import type { LeaderboardType } from '../store/cookieLeaderboard';

export const useCookieLeaderboard = (enabled: boolean = true) => {
  const {
    leaderboards,
    activeType,
    isLoading,
    setActiveType,
    updateLeaderboard,
    setLoading
  } = useCookieLeaderboardStore();

  // Fetch leaderboard from API
  const fetchLeaderboardData = useCallback(async (type: LeaderboardType) => {
    try {
      setLoading(true);
      const data = await fetchLeaderboard(type);
      updateLeaderboard(type, data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
    }
  }, [setLoading, updateLeaderboard]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchLeaderboardData('totalCookies');
      fetchLeaderboardData('cps');
      fetchLeaderboardData('timePlayed');
    }
  }, [enabled, fetchLeaderboardData]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'cookie:leaderboard_update') {
      const { type, leaderboard } = message.data;
      if (type && leaderboard && ['totalCookies', 'cps', 'timePlayed'].includes(type)) {
        updateLeaderboard(type as LeaderboardType, leaderboard);
      }
    }
  }, [updateLeaderboard]);

  // WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: enabled,
    onMessage: handleWebSocketMessage,
    onConnect: useCallback(() => {
      console.log('[CookieLeaderboard] Connected to WebSocket');
    }, []),
    onDisconnect: useCallback(() => {
      console.log('[CookieLeaderboard] Disconnected from WebSocket');
    }, [])
  });

  // Ref to track if we've already subscribed
  const hasSubscribedRef = useRef(false);

  // Subscribe to WebSocket on connection
  useEffect(() => {
    if (!isConnected || !sendMessage || hasSubscribedRef.current) return;
    
    // Small delay to ensure WebSocket is fully ready
    const timeoutId = setTimeout(() => {
      if (sendMessage && isConnected) {
        sendMessage({
          type: 'subscribe:cookie_leaderboard',
          data: { types: ['totalCookies', 'cps', 'timePlayed'] }
        });
        hasSubscribedRef.current = true;
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (!isConnected) {
        hasSubscribedRef.current = false;
      }
    };
  }, [isConnected, sendMessage]);

  // Polling fallback if WebSocket is not available
  useEffect(() => {
    if (!enabled || isConnected) return;

    const interval = setInterval(() => {
      fetchLeaderboardData(activeType);
    }, 10000); // Poll every 10 seconds if WebSocket unavailable

    return () => clearInterval(interval);
  }, [enabled, isConnected, activeType, fetchLeaderboardData]);

  return {
    leaderboards,
    activeType,
    isLoading,
    isConnected,
    setActiveType,
    refresh: () => {
      fetchLeaderboardData('totalCookies');
      fetchLeaderboardData('cps');
      fetchLeaderboardData('timePlayed');
    },
    currentLeaderboard: leaderboards[activeType]
  };
};

