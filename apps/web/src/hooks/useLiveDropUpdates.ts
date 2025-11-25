import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { useDropsStore } from '../store/drops';

export interface LiveDropUpdate {
  dropId: string;
  dropName: string;
  stock: number;
  maxStock?: number;
  progress?: number;
  status: 'available' | 'coming_soon' | 'sold_out' | 'ended';
  releaseDate?: string;
  endDate?: string;
  timestamp: string;
}

export interface UseLiveDropUpdatesOptions {
  dropIds?: string[];
  enabled?: boolean;
  onStockChange?: (update: LiveDropUpdate) => void;
  onStatusChange?: (update: LiveDropUpdate) => void;
}

export const useLiveDropUpdates = (options: UseLiveDropUpdatesOptions = {}) => {
  const {
    dropIds = [],
    enabled = true,
    onStockChange,
    onStatusChange
  } = options;

  const [dropUpdates, setDropUpdates] = useState<Map<string, LiveDropUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const updatesRef = useRef<Map<string, LiveDropUpdate>>(new Map());

  const handleWebSocketMessage = useCallback((message: any) => {
    if (!message.type || !message.data) return;

    switch (message.type) {
      case 'homepage:drop_stock_changed':
      case 'homepage:drop_progress':
      case 'homepage:drop_new':
      case 'homepage:drop_status_changed': {
        const update: LiveDropUpdate = {
          dropId: message.data.dropId,
          dropName: message.data.dropName || 'Unknown Drop',
          stock: message.data.stock ?? 0,
          maxStock: message.data.maxStock,
          progress: message.data.progress,
          status: message.data.status || 'available',
          releaseDate: message.data.releaseDate,
          endDate: message.data.endDate,
          timestamp: message.data.timestamp || new Date().toISOString()
        };

        // Update local state
        updatesRef.current.set(update.dropId, update);
        setDropUpdates(new Map(updatesRef.current));

        // Update drops store
        // Note: Store update methods may vary - update only if methods exist
        try {
          const store = useDropsStore.getState();
          if (update.progress !== undefined && typeof store.applyProgress === 'function') {
            store.applyProgress(update.dropId, update.progress);
          }
          // Stock updates are handled via the local state map
        } catch (error) {
          console.warn('[LiveDropUpdates] Failed to update store:', error);
        }

        // Trigger callbacks
        if (message.type === 'homepage:drop_stock_changed' && onStockChange) {
          onStockChange(update);
        }

        if (message.type === 'homepage:drop_status_changed' && onStatusChange) {
          onStatusChange(update);
        }

        break;
      }
    }
  }, [onStockChange, onStatusChange]);

  const { isConnected: wsConnected, sendMessage } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: enabled,
    onMessage: handleWebSocketMessage,
    onConnect: useCallback(() => {
      console.log('[LiveDropUpdates] Connected to WebSocket');
      setIsConnected(true);
    }, []),
    onDisconnect: useCallback(() => {
      console.log('[LiveDropUpdates] Disconnected from WebSocket');
      setIsConnected(false);
    }, [])
  });

  // Subscribe to drop updates
  useEffect(() => {
    if (wsConnected && sendMessage && enabled) {
      sendMessage({
        type: 'subscribe:homepage',
        data: {
          components: ['drops'],
          dropIds: dropIds.length > 0 ? dropIds : undefined
        }
      });
    }
  }, [wsConnected, sendMessage, enabled, dropIds]);

  // Get update for specific drop
  const getDropUpdate = useCallback((dropId: string): LiveDropUpdate | null => {
    return updatesRef.current.get(dropId) || null;
  }, []);

  // Get all updates
  const getAllUpdates = useCallback((): LiveDropUpdate[] => {
    return Array.from(updatesRef.current.values());
  }, []);

  return {
    dropUpdates: Array.from(dropUpdates.values()),
    getDropUpdate,
    getAllUpdates,
    isConnected: wsConnected && isConnected
  };
};

