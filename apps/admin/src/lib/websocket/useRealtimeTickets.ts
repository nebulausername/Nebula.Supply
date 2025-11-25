import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getWebSocketClient } from './client';
import { logger } from '../logger';
import { queryKeys } from '../api/hooks';

export interface TicketEvent {
  type: 'ticket:created' | 'ticket:updated' | 'ticket:status_changed' | 'ticket:assigned' | 'ticket:escalated' | 'ticket:resolved' | 'ticket:replied' | 'ticket:message_added';
  ticketId: string;
  ticket?: any;
  changes?: any;
  oldStatus?: string;
  newStatus?: string;
  assignedTo?: string;
  reply?: any;
  message?: any;
  timestamp: string;
}

export interface UseRealtimeTicketsOptions {
  enabled?: boolean;
  filters?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
  };
  onCreated?: (event: TicketEvent) => void;
  onUpdated?: (event: TicketEvent) => void;
  onStatusChanged?: (event: TicketEvent) => void;
  onAssigned?: (event: TicketEvent) => void;
  onEscalated?: (event: TicketEvent) => void;
  onResolved?: (event: TicketEvent) => void;
}

export const useRealtimeTickets = (options: UseRealtimeTicketsOptions = {}) => {
  const queryClient = useQueryClient();
  const wsClient = getWebSocketClient();
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const handleTicketEvent = useCallback((event: TicketEvent | { type: string; ticketId: string; ticket?: any; message?: any; timestamp: string }) => {
    logger.info('Received ticket event', { type: event.type, ticketId: event.ticketId });

    switch (event.type) {
      case 'ticket:created': {
        // Invalidate tickets list to include new ticket
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.stats });
        optionsRef.current.onCreated?.(event);
        break;
      }
      case 'ticket:updated': {
        // Update ticket detail if present in cache
        if (event.ticket) {
          queryClient.setQueryData(queryKeys.tickets.detail(event.ticketId), event.ticket);
        }
        // Invalidate list for consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
        optionsRef.current.onUpdated?.(event);
        break;
      }
      case 'ticket:status_changed': {
        // Patch ticket status in caches
        queryClient.setQueryData(queryKeys.tickets.detail(event.ticketId), (old: any) => {
          if (!old) return old;
          return { ...old, status: event.newStatus, updatedAt: event.timestamp };
        });
        
        // Update list cache if ticket exists there
        queryClient.setQueriesData(
          { queryKey: queryKeys.tickets.list() },
          (old: any) => {
            if (!old?.data) return old;
            return {
              ...old,
              data: old.data.map((ticket: any) =>
                ticket.id === event.ticketId
                  ? { ...ticket, status: event.newStatus, updatedAt: event.timestamp }
                  : ticket
              ),
            };
          }
        );
        
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.stats });
        optionsRef.current.onStatusChanged?.(event);
        break;
      }
      case 'ticket:assigned': {
        queryClient.setQueryData(queryKeys.tickets.detail(event.ticketId), (old: any) => {
          if (!old) return old;
          return { ...old, assignedTo: event.assignedTo, updatedAt: event.timestamp };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
        optionsRef.current.onAssigned?.(event);
        break;
      }
      case 'ticket:escalated': {
        queryClient.setQueryData(queryKeys.tickets.detail(event.ticketId), (old: any) => {
          if (!old) return old;
          return { ...old, status: 'escalated', updatedAt: event.timestamp };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.stats });
        optionsRef.current.onEscalated?.(event);
        break;
      }
      case 'ticket:resolved': {
        queryClient.setQueryData(queryKeys.tickets.detail(event.ticketId), (old: any) => {
          if (!old) return old;
          return { ...old, status: 'done', updatedAt: event.timestamp };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.stats });
        optionsRef.current.onResolved?.(event);
        break;
      }
      case 'ticket:replied': {
        // Update ticket with new reply
        queryClient.setQueryData(queryKeys.tickets.detail(event.ticketId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            lastMessageAt: event.timestamp,
            unreadCount: event.reply?.from === 'customer' ? (old.unreadCount || 0) + 1 : old.unreadCount,
            updatedAt: event.timestamp,
          };
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
        break;
      }
      case 'ticket:message_added': {
        // Update ticket with new message
        const eventData = event as any;
        if (eventData.ticket) {
          queryClient.setQueryData(queryKeys.tickets.detail(event.ticketId), eventData.ticket);
        } else {
          queryClient.setQueryData(queryKeys.tickets.detail(event.ticketId), (old: any) => {
            if (!old) return old;
            const messages = old.messages || [];
            const message = eventData.message || eventData.data?.message;
            // Check if message already exists to prevent duplicates
            const messageExists = message && messages.some((m: any) => m.id === message.id);
            if (messageExists) return old;
            
            const newMessages = message ? [...messages, message] : messages;
            return {
              ...old,
              messages: newMessages,
              lastMessageAt: event.timestamp,
              unreadCount: message?.from === 'user' ? (old.unreadCount || 0) + 1 : old.unreadCount,
              updatedAt: event.timestamp,
            };
          });
          
          // Also update list cache
          queryClient.setQueriesData(
            { queryKey: queryKeys.tickets.list() },
            (old: any) => {
              if (!old?.data) return old;
              return {
                ...old,
                data: old.data.map((ticket: any) => {
                  if (ticket.id === event.ticketId) {
                    const messages = ticket.messages || [];
                    const message = eventData.message || eventData.data?.message;
                    const messageExists = message && messages.some((m: any) => m.id === message.id);
                    if (messageExists) return ticket;
                    
                    return {
                      ...ticket,
                      messages: message ? [...messages, message] : messages,
                      updatedAt: event.timestamp,
                    };
                  }
                  return ticket;
                }),
              };
            }
          );
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
        optionsRef.current.onUpdated?.(event);
        break;
      }
    }
  }, [queryClient]);

  useEffect(() => {
    if (options.enabled === false) return;

    const wsClientInstance = wsClient;

    // Subscribe to ticket events
    wsClientInstance.on('ticket:created', handleTicketEvent);
    wsClientInstance.on('ticket:updated', handleTicketEvent);
    wsClientInstance.on('ticket:status_changed', handleTicketEvent);
    wsClientInstance.on('ticket:assigned', handleTicketEvent);
    wsClientInstance.on('ticket:escalated', handleTicketEvent);
    wsClientInstance.on('ticket:resolved', handleTicketEvent);
    wsClientInstance.on('ticket:replied', handleTicketEvent);
    wsClientInstance.on('ticket:message_added', handleTicketEvent);

    // Subscribe to tickets stream via WebSocket
    const subscribeIfConnected = () => {
      if (wsClientInstance.isConnected) {
        wsClientInstance.subscribeToTickets(options.filters);
      }
    };

    // Subscribe immediately if already connected
    subscribeIfConnected();

    // Subscribe when connection is established
    const handleConnect = () => {
      subscribeIfConnected();
    };

    wsClientInstance.on('status', (status: any) => {
      if (status.connected) {
        subscribeIfConnected();
      }
    });

    return () => {
      wsClientInstance.off('ticket:created', handleTicketEvent);
      wsClientInstance.off('ticket:updated', handleTicketEvent);
      wsClientInstance.off('ticket:status_changed', handleTicketEvent);
      wsClientInstance.off('ticket:assigned', handleTicketEvent);
      wsClientInstance.off('ticket:escalated', handleTicketEvent);
      wsClientInstance.off('ticket:resolved', handleTicketEvent);
      wsClientInstance.off('ticket:replied', handleTicketEvent);
      wsClientInstance.off('ticket:message_added', handleTicketEvent);
      wsClientInstance.off('status', handleConnect);
    };
  }, [options.enabled, options.filters, handleTicketEvent, wsClient]);

  return {
    isConnected: wsClient.isConnected,
    connectionStatus: wsClient.connectionStatus,
    forceReconnect: wsClient.forceReconnect.bind(wsClient)
  };
};

