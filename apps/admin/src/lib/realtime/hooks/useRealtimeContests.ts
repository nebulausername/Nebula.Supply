import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';

export interface ContestEvent {
  type: 'contest:created' | 'contest:status_changed' | 'contest:leaderboard_updated' | 'contest:ended';
  contestId: string;
  contest?: any;
  oldStatus?: string;
  newStatus?: string;
  leaderboard?: any;
  timestamp: string;
}

export interface UseRealtimeContestsOptions extends UseRealtimeOptions {
  filters?: {
    contestIds?: string[];
  };
  onCreated?: (event: ContestEvent) => void;
  onStatusChanged?: (event: ContestEvent) => void;
  onLeaderboardUpdated?: (event: ContestEvent) => void;
  onEnded?: (event: ContestEvent) => void;
}

export function useRealtimeContests(options: UseRealtimeContestsOptions = {}) {
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

  const handleEvent = useCallback((event: ContestEvent) => {
    logger.info('[useRealtimeContests] Event received:', event.type);

    switch (event.type) {
      case 'contest:created':
        queryClient.invalidateQueries({ queryKey: ['contests'] });
        optionsRef.current.onCreated?.(event);
        break;
      case 'contest:status_changed':
        queryClient.invalidateQueries({ queryKey: ['contests'] });
        if (event.contestId) {
          queryClient.invalidateQueries({ queryKey: ['contests', event.contestId] });
        }
        optionsRef.current.onStatusChanged?.(event);
        break;
      case 'contest:leaderboard_updated':
        if (event.contestId) {
          queryClient.invalidateQueries({ queryKey: ['contests', event.contestId, 'leaderboard'] });
        }
        optionsRef.current.onLeaderboardUpdated?.(event);
        break;
      case 'contest:ended':
        queryClient.invalidateQueries({ queryKey: ['contests'] });
        if (event.contestId) {
          queryClient.invalidateQueries({ queryKey: ['contests', event.contestId] });
        }
        optionsRef.current.onEnded?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToContests(options.filters);

    const unsubscribeCreated = subscribe('contest:created', handleEvent);
    const unsubscribeStatusChanged = subscribe('contest:status_changed', handleEvent);
    const unsubscribeLeaderboardUpdated = subscribe('contest:leaderboard_updated', handleEvent);
    const unsubscribeEnded = subscribe('contest:ended', handleEvent);

    return () => {
      unsubscribeCreated();
      unsubscribeStatusChanged();
      unsubscribeLeaderboardUpdated();
      unsubscribeEnded();
      client.unsubscribeFromContests();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

