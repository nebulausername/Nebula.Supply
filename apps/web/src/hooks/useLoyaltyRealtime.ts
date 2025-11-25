import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { useLoyaltyStore, LoyaltyTier } from '../store/loyalty';
import { useToastStore } from '../store/toast';

export interface LoyaltyRealtimeUpdate {
  userId: string;
  points?: number;
  newTotalPoints?: number;
  oldTier?: LoyaltyTier;
  newTier?: LoyaltyTier;
  reason?: string;
  orderId?: string;
  timestamp: string;
}

export interface UseLoyaltyRealtimeOptions {
  userId?: string;
  enabled?: boolean;
  onPointsEarned?: (update: LoyaltyRealtimeUpdate) => void;
  onTierUpgraded?: (update: LoyaltyRealtimeUpdate) => void;
  onPointsAdjusted?: (update: LoyaltyRealtimeUpdate) => void;
}

export const useLoyaltyRealtime = (options: UseLoyaltyRealtimeOptions = {}) => {
  const {
    userId,
    enabled = true,
    onPointsEarned,
    onTierUpgraded,
    onPointsAdjusted
  } = options;

  const loyaltyStore = useLoyaltyStore();
  const addToast = useToastStore((state) => state.addToast);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previousTierRef = useRef<LoyaltyTier | null>(null);

  // Initialize previous tier
  useEffect(() => {
    if (loyaltyStore.currentTier) {
      previousTierRef.current = loyaltyStore.currentTier;
    }
  }, []);

  // Handle points earned
  const handlePointsEarned = useCallback((data: any) => {
    try {
      const { userId: updateUserId, points, newTotalPoints, newTier, orderId, reason } = data;
      
      if (!updateUserId || updateUserId !== userId) {
        return; // Not for this user
      }

      if (!points || points <= 0) {
        return;
      }

      const update: LoyaltyRealtimeUpdate = {
        userId: updateUserId,
        points,
        newTotalPoints,
        newTier,
        oldTier: previousTierRef.current || loyaltyStore.currentTier,
        reason,
        orderId,
        timestamp: new Date().toISOString()
      };

      // Update store
      loyaltyStore.addPoints(points, reason || 'Punkte erhalten', orderId);

      // Check for tier upgrade
      if (newTier && newTier !== previousTierRef.current && previousTierRef.current) {
        const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
        const currentIndex = tierOrder.indexOf(newTier);
        const previousIndex = tierOrder.indexOf(previousTierRef.current);
        
        if (currentIndex > previousIndex) {
          // Tier upgraded!
          onTierUpgraded?.(update);
          
          // Show tier upgrade toast
          addToast({
            type: 'success',
            title: '🎉 Tier-Upgrade!',
            message: `Du bist jetzt ${newTier.toUpperCase()}!`,
            duration: 6000
          });
        }
      }

      if (newTier) {
        previousTierRef.current = newTier;
      }

      // Show points earned toast
      addToast({
        type: 'success',
        title: `+${points} Punkte erhalten`,
        message: reason || 'Punkte für Bestellung erhalten',
        duration: 4000
      });

      onPointsEarned?.(update);
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      console.error('[LoyaltyRealtime] Error handling points_earned:', err);
      setError('Fehler beim Verarbeiten der Punkte');
    }
  }, [userId, loyaltyStore, addToast, onPointsEarned, onTierUpgraded]);

  // Handle points adjusted (admin)
  const handlePointsAdjusted = useCallback((data: any) => {
    try {
      const { userId: updateUserId, points, reason, orderId } = data;
      
      if (!updateUserId || updateUserId !== userId) {
        return; // Not for this user
      }

      const update: LoyaltyRealtimeUpdate = {
        userId: updateUserId,
        points,
        reason,
        orderId,
        timestamp: new Date().toISOString()
      };

      // Update store
      if (points > 0) {
        loyaltyStore.addPoints(points, reason || 'Punkte angepasst', orderId);
      } else if (points < 0) {
        loyaltyStore.redeemPoints(Math.abs(points), reason || 'Punkte angepasst');
      }

      // Show adjustment toast
      addToast({
        type: 'info',
        title: points > 0 ? `+${points} Punkte` : `${points} Punkte`,
        message: reason || 'Punkte wurden angepasst',
        duration: 4000
      });

      onPointsAdjusted?.(update);
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      console.error('[LoyaltyRealtime] Error handling points_adjusted:', err);
      setError('Fehler beim Anpassen der Punkte');
    }
  }, [userId, loyaltyStore, addToast, onPointsAdjusted]);

  // Handle tier upgraded
  const handleTierUpgraded = useCallback((data: any) => {
    try {
      const { userId: updateUserId, newTier, oldTier } = data;
      
      if (!updateUserId || updateUserId !== userId) {
        return; // Not for this user
      }

      if (!newTier || newTier === previousTierRef.current) {
        return; // No change
      }

      const update: LoyaltyRealtimeUpdate = {
        userId: updateUserId,
        newTier,
        oldTier: oldTier || previousTierRef.current || 'bronze',
        timestamp: new Date().toISOString()
      };

      previousTierRef.current = newTier;

      // Show tier upgrade toast
      addToast({
        type: 'success',
        title: '🎉 Tier-Upgrade!',
        message: `Du bist jetzt ${newTier.toUpperCase()}!`,
        duration: 6000
      });

      onTierUpgraded?.(update);
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      console.error('[LoyaltyRealtime] Error handling tier_upgraded:', err);
      setError('Fehler beim Tier-Upgrade');
    }
  }, [userId, addToast, onTierUpgraded]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: any) => {
    setLastUpdate(new Date().toISOString());
    setError(null);

    // Handle different message types
    switch (message.type) {
      case 'loyalty:points_earned':
        handlePointsEarned(message.data || message);
        break;
      
      case 'loyalty:points_adjusted':
        handlePointsAdjusted(message.data || message);
        break;
      
      case 'loyalty:tier_upgraded':
        handleTierUpgraded(message.data || message);
        break;
      
      default:
        // Ignore unknown message types
        break;
    }
  }, [handlePointsEarned, handlePointsAdjusted, handleTierUpgraded]);

  // WebSocket connection
  const { isConnected: wsConnected, sendMessage } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: enabled && !!userId,
    onMessage: handleWebSocketMessage,
    onConnect: useCallback(() => {
      console.log('[LoyaltyRealtime] Connected to WebSocket');
      setIsConnected(true);
      setError(null);
    }, []),
    onDisconnect: useCallback(() => {
      console.log('[LoyaltyRealtime] Disconnected from WebSocket');
      setIsConnected(false);
      setError('Verbindung getrennt. Versuche neu zu verbinden...');
    }, []),
    onError: useCallback((error: Event) => {
      console.error('[LoyaltyRealtime] WebSocket error:', error);
      setError('WebSocket-Verbindungsfehler');
    }, [])
  });

  // Subscribe to loyalty updates on connection
  useEffect(() => {
    if (wsConnected && sendMessage && userId) {
      sendMessage({
        type: 'subscribe:loyalty',
        data: { 
          userId,
          events: ['points_earned', 'points_adjusted', 'tier_upgraded']
        }
      });
    }
  }, [wsConnected, sendMessage, userId]);

  return {
    isConnected: wsConnected,
    lastUpdate,
    error,
    clearError: useCallback(() => {
      setError(null);
    }, [])
  };
};

