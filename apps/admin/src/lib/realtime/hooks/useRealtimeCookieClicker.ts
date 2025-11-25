import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';

export interface CookieClickerEvent {
  type: 'cookie:player_updated' | 'cookie:leaderboard_changed' | 'cookie:achievement_unlocked' | 'cookie:suspicious_activity';
  playerId?: string;
  player?: any;
  leaderboard?: any;
  achievement?: any;
  activity?: any;
  timestamp: string;
}

export interface UseRealtimeCookieClickerOptions extends UseRealtimeOptions {
  filters?: {
    playerIds?: string[];
  };
  onPlayerUpdated?: (event: CookieClickerEvent) => void;
  onLeaderboardChanged?: (event: CookieClickerEvent) => void;
  onAchievementUnlocked?: (event: CookieClickerEvent) => void;
  onSuspiciousActivity?: (event: CookieClickerEvent) => void;
}

export function useRealtimeCookieClicker(options: UseRealtimeCookieClickerOptions = {}) {
  const queryClient = useQueryClient();
  const { subscribe, unsubscribe, isConnected, client } = useRealtime({
    enabled: options.enabled,
    onConnect: options.onConnect,
    onDisconnect: options.onDisconnect,
    onError: options.onError
  });

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleEvent = useCallback((event: CookieClickerEvent) => {
    logger.info('[useRealtimeCookieClicker] Event received:', event.type);

    switch (event.type) {
      case 'cookie:player_updated':
        queryClient.invalidateQueries({ queryKey: ['cookieClicker', 'players'] });
        if (event.playerId) {
          queryClient.invalidateQueries({ queryKey: ['cookieClicker', 'players', event.playerId] });
        }
        optionsRef.current.onPlayerUpdated?.(event);
        break;
      case 'cookie:leaderboard_changed':
        queryClient.invalidateQueries({ queryKey: ['cookieClicker', 'leaderboard'] });
        optionsRef.current.onLeaderboardChanged?.(event);
        break;
      case 'cookie:achievement_unlocked':
        queryClient.invalidateQueries({ queryKey: ['cookieClicker', 'achievements'] });
        optionsRef.current.onAchievementUnlocked?.(event);
        break;
      case 'cookie:suspicious_activity':
        queryClient.invalidateQueries({ queryKey: ['cookieClicker', 'activity'] });
        optionsRef.current.onSuspiciousActivity?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToCookieClicker(options.filters);

    const unsubscribePlayerUpdated = subscribe('cookie:player_updated', handleEvent);
    const unsubscribeLeaderboardChanged = subscribe('cookie:leaderboard_changed', handleEvent);
    const unsubscribeAchievementUnlocked = subscribe('cookie:achievement_unlocked', handleEvent);
    const unsubscribeSuspiciousActivity = subscribe('cookie:suspicious_activity', handleEvent);

    return () => {
      unsubscribePlayerUpdated();
      unsubscribeLeaderboardChanged();
      unsubscribeAchievementUnlocked();
      unsubscribeSuspiciousActivity();
      client.unsubscribeFromCookieClicker();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

