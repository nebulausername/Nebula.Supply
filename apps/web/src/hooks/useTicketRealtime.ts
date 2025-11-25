import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import type { TicketData, Message } from '../components/support/types';

export interface TicketRealtimeUpdate {
  ticketId: string;
  ticket?: TicketData;
  message?: Message;
  status?: TicketData['status'];
  priority?: TicketData['priority'];
  changes?: Partial<TicketData>;
  timestamp: string;
}

export interface UseTicketRealtimeOptions {
  userId?: string;
  enabled?: boolean;
  onTicketUpdate?: (update: TicketRealtimeUpdate) => void;
  onNewMessage?: (ticketId: string, message: Message) => void;
  onStatusChange?: (ticketId: string, oldStatus: TicketData['status'], newStatus: TicketData['status']) => void;
  onTyping?: (ticketId: string, isTyping: boolean) => void;
}

export const useTicketRealtime = (options: UseTicketRealtimeOptions = {}) => {
  const {
    userId,
    enabled = true,
    onTicketUpdate,
    onNewMessage,
    onStatusChange,
    onTyping
  } = options;

  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typingTickets, setTypingTickets] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const previousStatusRef = useRef<Map<string, TicketData['status']>>(new Map());

  // Handle ticket message added
  const handleMessageAdded = useCallback((data: any) => {
    try {
      const { ticketId, message, ticket } = data;
      
      if (!ticketId || !message) {
        console.warn('[TicketRealtime] Invalid message_added event:', data);
        return;
      }

      const update: TicketRealtimeUpdate = {
        ticketId,
        message: {
          id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: message.text || message.message,
          from: message.from || 'agent',
          timestamp: message.timestamp || new Date().toISOString(),
          senderName: message.senderName
        },
        ticket: ticket ? {
          ...ticket,
          messages: ticket.messages || []
        } : undefined,
        timestamp: new Date().toISOString()
      };

      // Optimistic update: Add message to query cache immediately
      queryClient.setQueryData<TicketData[]>(['profileTickets', userId], (prev = []) => {
        return prev.map((t) => {
          if (t.id === ticketId) {
            const existingMessage = t.messages?.find(m => m.id === update.message!.id);
            if (existingMessage) {
              return t; // Message already exists, don't duplicate
            }
            return {
              ...t,
              messages: [...(t.messages || []), update.message!],
              updatedAt: update.timestamp,
              unreadCount: update.message!.from === 'agent' ? (t.unreadCount || 0) + 1 : t.unreadCount
            };
          }
          return t;
        });
      });

      // Update single ticket query if it exists
      queryClient.setQueryData<TicketData>(['ticket', ticketId], (prev) => {
        if (!prev) return prev;
        const existingMessage = prev.messages?.find(m => m.id === update.message!.id);
        if (existingMessage) {
          return prev;
        }
        return {
          ...prev,
          messages: [...(prev.messages || []), update.message!],
          updatedAt: update.timestamp
        };
      });

      onNewMessage?.(ticketId, update.message!);
      onTicketUpdate?.(update);
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      console.error('[TicketRealtime] Error handling message_added:', err);
      setError('Fehler beim Verarbeiten der Nachricht');
    }
  }, [queryClient, userId, onNewMessage, onTicketUpdate]);

  // Handle ticket updated
  const handleTicketUpdated = useCallback((data: any) => {
    try {
      const { ticketId, ticket, changes } = data;
      
      if (!ticketId || !ticket) {
        console.warn('[TicketRealtime] Invalid ticket_updated event:', data);
        return;
      }

      const update: TicketRealtimeUpdate = {
        ticketId,
        ticket: ticket as TicketData,
        changes,
        status: ticket.status,
        priority: ticket.priority,
        timestamp: new Date().toISOString()
      };

      // Check for status change
      const previousStatus = previousStatusRef.current.get(ticketId);
      if (previousStatus && previousStatus !== ticket.status) {
        onStatusChange?.(ticketId, previousStatus, ticket.status);
      }
      previousStatusRef.current.set(ticketId, ticket.status);

      // Update query cache
      queryClient.setQueryData<TicketData[]>(['profileTickets', userId], (prev = []) => {
        return prev.map((t) => {
          if (t.id === ticketId) {
            return { ...t, ...ticket, updatedAt: ticket.updatedAt || new Date().toISOString() };
          }
          return t;
        });
      });

      // Update single ticket query
      queryClient.setQueryData<TicketData>(['ticket', ticketId], ticket);

      onTicketUpdate?.(update);
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      console.error('[TicketRealtime] Error handling ticket_updated:', err);
      setError('Fehler beim Aktualisieren des Tickets');
    }
  }, [queryClient, userId, onStatusChange, onTicketUpdate]);

  // Handle ticket created
  const handleTicketCreated = useCallback((data: any) => {
    try {
      const { ticket } = data;
      
      if (!ticket || !ticket.id) {
        console.warn('[TicketRealtime] Invalid ticket_created event:', data);
        return;
      }

      const update: TicketRealtimeUpdate = {
        ticketId: ticket.id,
        ticket: ticket as TicketData,
        timestamp: new Date().toISOString()
      };

      // Add new ticket to query cache
      queryClient.setQueryData<TicketData[]>(['profileTickets', userId], (prev = []) => {
        // Check if ticket already exists
        const exists = prev.some(t => t.id === ticket.id);
        if (exists) {
          return prev;
        }
        return [ticket, ...prev];
      });

      previousStatusRef.current.set(ticket.id, ticket.status);
      onTicketUpdate?.(update);
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      console.error('[TicketRealtime] Error handling ticket_created:', err);
      setError('Fehler beim Erstellen des Tickets');
    }
  }, [queryClient, userId, onTicketUpdate]);

  // Handle ticket status changed
  const handleStatusChanged = useCallback((data: any) => {
    try {
      const { ticketId, oldStatus, newStatus, ticket } = data;
      
      if (!ticketId || !oldStatus || !newStatus) {
        console.warn('[TicketRealtime] Invalid status_changed event:', data);
        return;
      }

      const update: TicketRealtimeUpdate = {
        ticketId,
        ticket: ticket as TicketData,
        status: newStatus,
        timestamp: new Date().toISOString()
      };

      // Update query cache
      queryClient.setQueryData<TicketData[]>(['profileTickets', userId], (prev = []) => {
        return prev.map((t) => {
          if (t.id === ticketId) {
            return { ...t, status: newStatus, updatedAt: new Date().toISOString() };
          }
          return t;
        });
      });

      queryClient.setQueryData<TicketData>(['ticket', ticketId], (prev) => {
        if (!prev) return prev;
        return { ...prev, status: newStatus, updatedAt: new Date().toISOString() };
      });

      previousStatusRef.current.set(ticketId, newStatus);
      onStatusChange?.(ticketId, oldStatus, newStatus);
      onTicketUpdate?.(update);
      setLastUpdate(new Date().toISOString());
    } catch (err) {
      console.error('[TicketRealtime] Error handling status_changed:', err);
      setError('Fehler beim Ändern des Status');
    }
  }, [queryClient, userId, onStatusChange, onTicketUpdate]);

  // Handle typing indicator
  const handleTyping = useCallback((data: any) => {
    try {
      const { ticketId, isTyping } = data;
      
      if (!ticketId) return;

      if (isTyping) {
        setTypingTickets(prev => new Set(prev).add(ticketId));
        
        // Clear typing indicator after 3 seconds
        const existingTimeout = typingTimeoutRef.current.get(ticketId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        const timeout = setTimeout(() => {
          setTypingTickets(prev => {
            const next = new Set(prev);
            next.delete(ticketId);
            return next;
          });
          typingTimeoutRef.current.delete(ticketId);
        }, 3000);
        
        typingTimeoutRef.current.set(ticketId, timeout);
      } else {
        setTypingTickets(prev => {
          const next = new Set(prev);
          next.delete(ticketId);
          return next;
        });
        
        const timeout = typingTimeoutRef.current.get(ticketId);
        if (timeout) {
          clearTimeout(timeout);
          typingTimeoutRef.current.delete(ticketId);
        }
      }

      onTyping?.(ticketId, isTyping);
    } catch (err) {
      console.error('[TicketRealtime] Error handling typing:', err);
    }
  }, [onTyping]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: any) => {
    setLastUpdate(new Date().toISOString());
    setError(null);

    // Handle different message types
    switch (message.type) {
      case 'ticket:message_added':
        handleMessageAdded(message.data || message);
        break;
      
      case 'ticket:updated':
        handleTicketUpdated(message.data || message);
        break;
      
      case 'ticket:created':
        handleTicketCreated(message.data || message);
        break;
      
      case 'ticket:status_changed':
        handleStatusChanged(message.data || message);
        break;
      
      case 'ticket:typing':
        handleTyping(message.data || message);
        break;
      
      default:
        // Ignore unknown message types
        break;
    }
  }, [handleMessageAdded, handleTicketUpdated, handleTicketCreated, handleStatusChanged, handleTyping]);

  // Track previous connection state to detect disconnections
  const wasConnectedRef = useRef(false);
  
  // WebSocket connection
  const { isConnected: wsConnected, sendMessage } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: enabled && !!userId,
    onMessage: handleWebSocketMessage,
    onConnect: useCallback(() => {
      if (import.meta.env.DEV) {
        console.log('[TicketRealtime] Connected to WebSocket');
      }
      setIsConnected(true);
      wasConnectedRef.current = true;
      setError(null);
    }, []),
    onDisconnect: useCallback(() => {
      if (import.meta.env.DEV) {
        console.log('[TicketRealtime] Disconnected from WebSocket');
      }
      setIsConnected(false);
      // Only show error if we were previously connected
      if (wasConnectedRef.current) {
        setError('Verbindung getrennt. Versuche neu zu verbinden...');
      }
      wasConnectedRef.current = false;
    }, []),
    onError: useCallback((error: Event) => {
      if (import.meta.env.DEV) {
        console.error('[TicketRealtime] WebSocket error:', error);
      }
      setError('WebSocket-Verbindungsfehler');
    }, [])
  });

  // Subscribe to ticket updates on connection
  useEffect(() => {
    if (wsConnected && sendMessage && userId) {
      sendMessage({
        type: 'subscribe:tickets',
        data: { 
          userId,
          events: ['message_added', 'updated', 'created', 'status_changed', 'typing']
        }
      });
    }
  }, [wsConnected, sendMessage, userId]);

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, []);

  return {
    isConnected: wsConnected,
    lastUpdate,
    error,
    typingTickets: Array.from(typingTickets),
    isTyping: (ticketId: string) => typingTickets.has(ticketId),
    clearError: useCallback(() => {
      setError(null);
    }, []),
    sendTyping: useCallback((ticketId: string, isTyping: boolean) => {
      if (sendMessage) {
        sendMessage({
          type: 'ticket:typing',
          data: { ticketId, isTyping, userId }
        });
      }
    }, [sendMessage, userId])
  };
};

