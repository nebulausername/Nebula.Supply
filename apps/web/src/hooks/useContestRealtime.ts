// 🏆 CONTEST REALTIME HOOK - Echtzeit-Updates für Gewinnspiel!

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { REALTIME_CONFIG } from '../config/realtime';
import { ContestParticipant } from '../services/contestService';

export interface ContestRealtimeUpdate {
  type: 'leaderboard_update' | 'rank_change' | 'score_update' | 'participant_joined' | 'contest_finalized' | 'prize_available';
  contestId: string;
  data: any;
  timestamp: string;
}

interface UseContestRealtimeOptions {
  contestId: string;
  enabled?: boolean;
  onLeaderboardUpdate?: (participants: ContestParticipant[]) => void;
  onRankChange?: (newRank: number) => void;
  onScoreUpdate?: (newScore: number) => void;
  onParticipantJoined?: (participant: ContestParticipant) => void;
  onContestFinalized?: (winners: any[]) => void;
  onPrizeAvailable?: (prizes: any[]) => void;
}

export const useContestRealtime = ({
  contestId,
  enabled = true,
  onLeaderboardUpdate,
  onRankChange,
  onScoreUpdate,
  onParticipantJoined,
  onContestFinalized,
  onPrizeAvailable,
}: UseContestRealtimeOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [realtimeLeaderboard, setRealtimeLeaderboard] = useState<ContestParticipant[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const subscriptionRef = useRef(false);

  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'contest:update' && message.data?.contestId === contestId) {
      const update: ContestRealtimeUpdate = message.data;
      setLastUpdate(new Date().toISOString());

      switch (update.type) {
        case 'leaderboard_update':
          if (update.data.participants) {
            setRealtimeLeaderboard(update.data.participants);
            setPlayerRank(update.data.playerRank || null);
            onLeaderboardUpdate?.(update.data.participants);
          }
          break;

        case 'rank_change':
          if (update.data.rank !== undefined) {
            setPlayerRank(update.data.rank);
            onRankChange?.(update.data.rank);
          }
          break;

        case 'score_update':
          if (update.data.score !== undefined) {
            setLiveScore(update.data.score);
            onScoreUpdate?.(update.data.score);
          }
          break;

        case 'participant_joined':
          if (update.data.participant) {
            onParticipantJoined?.(update.data.participant);
            // Refresh leaderboard
            if (sendMessage) {
              sendMessage({
                type: 'contest:request_update',
                data: { contestId, component: 'leaderboard' }
              });
            }
          }
          break;

        case 'contest_finalized':
          if (update.data.winners) {
            onContestFinalized?.(update.data.winners);
          }
          break;

        case 'prize_available':
          if (update.data.prizes) {
            onPrizeAvailable?.(update.data.prizes);
          }
          break;
      }
    }
  }, [contestId, onLeaderboardUpdate, onRankChange, onScoreUpdate, onParticipantJoined, onContestFinalized, onPrizeAvailable]);

  // WebSocket connection
  const { isConnected: wsConnected, sendMessage } = useWebSocket({
    url: REALTIME_CONFIG.WEBSOCKET_URL,
    enabled: enabled && REALTIME_CONFIG.ENABLE_REALTIME,
    onMessage: handleWebSocketMessage,
    onConnect: useCallback(() => {
      setIsConnected(true);
      if (REALTIME_CONFIG.DEBUG) {
        console.log('[ContestRealtime] Connected to WebSocket');
      }
    }, []),
    onDisconnect: useCallback(() => {
      setIsConnected(false);
      subscriptionRef.current = false;
      if (REALTIME_CONFIG.DEBUG) {
        console.log('[ContestRealtime] Disconnected from WebSocket');
      }
    }, []),
  });

  // Subscribe to contest updates
  useEffect(() => {
    if (wsConnected && sendMessage && !subscriptionRef.current && enabled) {
      sendMessage({
        type: 'subscribe:contest',
        data: {
          contestId,
          components: ['leaderboard', 'rank', 'score', 'participants', 'prizes']
        }
      });
      subscriptionRef.current = true;

      // Request initial leaderboard
      sendMessage({
        type: 'contest:request_update',
        data: { contestId, component: 'leaderboard' }
      });

      if (REALTIME_CONFIG.DEBUG) {
        console.log('[ContestRealtime] Subscribed to contest:', contestId);
      }
    }
  }, [wsConnected, sendMessage, contestId, enabled]);

  // Unsubscribe on unmount
  useEffect(() => {
    return () => {
      if (sendMessage && subscriptionRef.current) {
        sendMessage({
          type: 'unsubscribe:contest',
          data: { contestId }
        });
        subscriptionRef.current = false;
      }
    };
  }, [sendMessage, contestId]);

  // Fallback polling if WebSocket not available
  useEffect(() => {
    if (!enabled || (REALTIME_CONFIG.ENABLE_REALTIME && wsConnected)) return;

    const pollInterval = setInterval(async () => {
      try {
        // Fallback: Use API polling
        const response = await fetch(`/api/contests/${contestId}/leaderboard`);
        if (response.ok) {
          const data = await response.json();
          if (data.participants) {
            setRealtimeLeaderboard(data.participants);
            setPlayerRank(data.playerRank || null);
            setLastUpdate(new Date().toISOString());
            onLeaderboardUpdate?.(data.participants);
          }
        }
      } catch (error) {
        if (REALTIME_CONFIG.DEBUG) {
          console.warn('[ContestRealtime] Polling failed:', error);
        }
      }
    }, REALTIME_CONFIG.AUTO_REFRESH_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [enabled, wsConnected, contestId, onLeaderboardUpdate]);

  return {
    isConnected: REALTIME_CONFIG.ENABLE_REALTIME ? wsConnected : false,
    leaderboard: realtimeLeaderboard,
    playerRank,
    liveScore,
    lastUpdate,
    subscribe: useCallback(() => {
      if (sendMessage) {
        sendMessage({
          type: 'subscribe:contest',
          data: { contestId }
        });
      }
    }, [sendMessage, contestId]),
    unsubscribe: useCallback(() => {
      if (sendMessage) {
        sendMessage({
          type: 'unsubscribe:contest',
          data: { contestId }
        });
      }
    }, [sendMessage, contestId]),
  };
};

