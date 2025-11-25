import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { REALTIME_CONFIG } from '../config/realtime';

export interface TicketMessage {
  id: string;
  text: string;
  from: 'user' | 'agent' | 'bot' | 'system';
  timestamp: string;
  attachments?: any[];
}

export interface TicketData {
  id: string;
  userId?: string;
  telegramUserId?: string;
  subject: string;
  summary?: string;
  description?: string;
  status: 'open' | 'in_progress' | 'waiting' | 'escalated' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export interface UseRealtimeTicketsOptions {
  ticketId?: string;
  userId?: string;
  telegramUserId?: string;
  enabled?: boolean;
  onTicketCreated?: (ticket: TicketData) => void;
  onTicketUpdated?: (ticket: TicketData) => void;
  onTicketStatusChanged?: (ticketId: string, oldStatus: string, newStatus: string) => void;
  onMessageAdded?: (ticketId: string, message: TicketMessage) => void;
}

export const useRealtimeTickets = (options: UseRealtimeTicketsOptions = {}) => {
  const {
    ticketId,
    userId,
    telegramUserId,
    enabled = REALTIME_CONFIG.ENABLE_REALTIME,
    onTicketCreated,
    onTicketUpdated,
    onTicketStatusChanged,
    onMessageAdded
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const subscriptionRef = useRef(false);
  const callbacksRef = useRef({
    onTicketCreated,
    onTicketUpdated,
    onTicketStatusChanged,
    onMessageAdded
  });
  
  // Exponential backoff for reconnection
  const getReconnectDelay = (attempts: number): number => {
    return Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
  };

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onTicketCreated,
      onTicketUpdated,
      onTicketStatusChanged,
      onMessageAdded
    };
  }, [onTicketCreated, onTicketUpdated, onTicketStatusChanged, onMessageAdded]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    if (!message || typeof message !== 'object') return;

    // Handle both direct event format and wrapped format
    let type: string;
    let data: any;

    if (message.type) {
      // Direct event format: { type: 'ticket:created', data: {...} }
      type = message.type;
      data = message.data || message;
    } else if (message.event) {
      // Wrapped format: { event: 'ticket:created', data: {...} }
      type = message.event;
      data = message.data || message;
    } else {
      // Try to infer from message structure
      type = message.type || Object.keys(message)[0];
      data = message.data || message;
    }

    if (REALTIME_CONFIG.DEBUG) {
      console.log('[RealtimeTickets] Received message:', type, data);
    }

    try {
      switch (type) {
        case 'ticket:created': {
          const ticket = data?.ticket || data;
          if (ticket && ticket.id) {
            // Only handle if it's for this user or no filter
            if (!userId && !telegramUserId) {
              callbacksRef.current.onTicketCreated?.(ticket);
              setLastUpdate(new Date().toISOString());
            } else if (
              (userId && ticket.userId === userId) ||
              (telegramUserId && ticket.telegramUserId === telegramUserId)
            ) {
              callbacksRef.current.onTicketCreated?.(ticket);
              setLastUpdate(new Date().toISOString());
            }
          }
          break;
        }

        case 'ticket:updated': {
          const ticket = data?.ticket || data;
          if (ticket && ticket.id) {
            // Only handle if it's the selected ticket or for this user
            if (ticketId && ticket.id === ticketId) {
              callbacksRef.current.onTicketUpdated?.(ticket);
              setLastUpdate(new Date().toISOString());
            } else if (!ticketId) {
              // No specific ticket filter, handle all updates
              if (!userId && !telegramUserId) {
                callbacksRef.current.onTicketUpdated?.(ticket);
                setLastUpdate(new Date().toISOString());
              } else if (
                (userId && ticket.userId === userId) ||
                (telegramUserId && ticket.telegramUserId === telegramUserId)
              ) {
                callbacksRef.current.onTicketUpdated?.(ticket);
                setLastUpdate(new Date().toISOString());
              }
            }
          }
          break;
        }

        case 'ticket:status_changed': {
          const changedTicketId = data?.ticketId || data?.id;
          const oldStatus = data?.oldStatus;
          const newStatus = data?.newStatus;
          if (changedTicketId) {
            // Only handle if it's the selected ticket or for this user
            if (ticketId && changedTicketId === ticketId) {
              callbacksRef.current.onTicketStatusChanged?.(changedTicketId, oldStatus, newStatus);
              setLastUpdate(new Date().toISOString());
            } else if (!ticketId) {
              callbacksRef.current.onTicketStatusChanged?.(changedTicketId, oldStatus, newStatus);
              setLastUpdate(new Date().toISOString());
            }
          }
          break;
        }

        case 'ticket:message_added': {
          const messageTicketId = data?.ticketId || data?.id;
          const messageData = data?.message;
          const ticket = data?.ticket;
          if (messageTicketId && messageData) {
            // Only handle if it's the selected ticket
            if (ticketId && messageTicketId === ticketId) {
              callbacksRef.current.onMessageAdded?.(messageTicketId, messageData);
              if (ticket) {
                callbacksRef.current.onTicketUpdated?.(ticket);
              }
              setLastUpdate(new Date().toISOString());
            } else if (!ticketId) {
              // No specific ticket filter, handle all messages
              callbacksRef.current.onMessageAdded?.(messageTicketId, messageData);
              if (ticket) {
                callbacksRef.current.onTicketUpdated?.(ticket);
              }
              setLastUpdate(new Date().toISOString());
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error('[RealtimeTickets] Error handling message:', err);
      setError('Fehler beim Verarbeiten der Nachricht');
    }
  }, [ticketId, userId, telegramUserId]);

  // WebSocket connection
  const { isConnected: wsConnected, sendMessage } = useWebSocket({
    url: REALTIME_CONFIG.WEBSOCKET_URL,
    enabled: enabled && REALTIME_CONFIG.ENABLE_REALTIME,
    onMessage: handleWebSocketMessage,
    onConnect: useCallback(() => {
      setIsConnected(true);
      setError(null);
      if (REALTIME_CONFIG.DEBUG) {
        console.log('[RealtimeTickets] Connected to WebSocket');
      }
    }, []),
    onDisconnect: useCallback(() => {
      setIsConnected(false);
      subscriptionRef.current = false;
      if (REALTIME_CONFIG.DEBUG) {
        console.log('[RealtimeTickets] Disconnected from WebSocket');
      }
    }, []),
  });

  // Subscribe to ticket updates
  useEffect(() => {
    if (wsConnected && sendMessage && !subscriptionRef.current && enabled) {
      const subscriptionData: any = {};
      
      if (ticketId) {
        subscriptionData.ticketIds = [ticketId];
      }
      
      if (userId) {
        subscriptionData.filters = { ...subscriptionData.filters, userId };
      }
      
      if (telegramUserId) {
        subscriptionData.filters = { ...subscriptionData.filters, telegramUserId };
      }

      sendMessage({
        type: 'subscribe:tickets',
        data: subscriptionData
      });
      
      subscriptionRef.current = true;

      if (REALTIME_CONFIG.DEBUG) {
        console.log('[RealtimeTickets] Subscribed to tickets:', subscriptionData);
      }
    }
  }, [wsConnected, sendMessage, ticketId, userId, telegramUserId, enabled]);

  // Unsubscribe on unmount or when filters change
  useEffect(() => {
    return () => {
      if (sendMessage && subscriptionRef.current) {
        sendMessage({
          type: 'unsubscribe:tickets',
          data: {}
        });
        subscriptionRef.current = false;
      }
    };
  }, [sendMessage, ticketId, userId, telegramUserId]);

  return {
    isConnected,
    lastUpdate,
    error
  };
};

