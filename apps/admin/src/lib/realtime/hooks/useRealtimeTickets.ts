import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime, UseRealtimeOptions } from '../RealtimeHooks';
import { logger } from '../../logger';
import { queryKeys } from '../../api/hooks';

export interface TicketEvent {
  type: 'ticket:created' | 'ticket:updated' | 'ticket:status_changed' | 'ticket:assigned' | 'ticket:message_added';
  ticketId: string;
  ticket?: any;
  changes?: any;
  oldStatus?: string;
  newStatus?: string;
  assignedTo?: string;
  message?: any;
  timestamp: string;
}

export interface UseRealtimeTicketsOptions extends UseRealtimeOptions {
  filters?: {
    status?: string;
    priority?: string;
    ticketIds?: string[];
  };
  onCreated?: (event: TicketEvent) => void;
  onUpdated?: (event: TicketEvent) => void;
  onStatusChanged?: (event: TicketEvent) => void;
  onAssigned?: (event: TicketEvent) => void;
  onMessageAdded?: (event: TicketEvent) => void;
}

export function useRealtimeTickets(options: UseRealtimeTicketsOptions = {}) {
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

  const handleEvent = useCallback((event: TicketEvent) => {
    logger.info('[useRealtimeTickets] Event received:', event.type);

    switch (event.type) {
      case 'ticket:created':
        // Optimistic update: Add ticket to list immediately
        if (event.ticket) {
          queryClient.setQueriesData(
            { queryKey: queryKeys.tickets?.list() || ['tickets'] },
            (old: any) => {
              if (!old?.data) return old;
              // Check if ticket already exists to avoid duplicates
              const exists = old.data.some((t: any) => t.id === event.ticketId);
              if (exists) return old;
              return {
                ...old,
                data: [event.ticket, ...old.data]
              };
            }
          );
        } else {
          // Fallback to invalidation if no ticket data
          queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.list() || ['tickets'] });
        }
        optionsRef.current.onCreated?.(event);
        break;
      case 'ticket:updated':
        // Optimistic update: Update ticket in cache immediately
        if (event.ticket) {
          // Update detail query
          queryClient.setQueryData(
            queryKeys.tickets?.detail(event.ticketId) || ['tickets', event.ticketId],
            event.ticket
          );
          // Update list query
          queryClient.setQueriesData(
            { queryKey: queryKeys.tickets?.list() || ['tickets'] },
            (old: any) => {
              if (!old?.data) return old;
              return {
                ...old,
                data: old.data.map((t: any) =>
                  t.id === event.ticketId ? { ...t, ...event.ticket } : t
                )
              };
            }
          );
        } else {
          // Fallback to invalidation
          queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.list() || ['tickets'] });
          if (event.ticketId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.detail(event.ticketId) || ['tickets', event.ticketId] });
          }
        }
        optionsRef.current.onUpdated?.(event);
        break;
      case 'ticket:status_changed':
        // Optimistic update: Update status immediately
        if (event.ticketId) {
          const detailKey = queryKeys.tickets?.detail(event.ticketId) || ['tickets', event.ticketId];
          queryClient.setQueryData(detailKey, (old: any) => {
            if (!old) return old;
            return {
              ...old,
              status: event.newStatus,
              updatedAt: event.timestamp
            };
          });
          // Update in list
          queryClient.setQueriesData(
            { queryKey: queryKeys.tickets?.list() || ['tickets'] },
            (old: any) => {
              if (!old?.data) return old;
              return {
                ...old,
                data: old.data.map((t: any) =>
                  t.id === event.ticketId
                    ? { ...t, status: event.newStatus, updatedAt: event.timestamp }
                    : t
                )
              };
            }
          );
        }
        optionsRef.current.onStatusChanged?.(event);
        break;
      case 'ticket:assigned':
        // Optimistic update: Update assignment immediately
        if (event.ticketId) {
          const detailKey = queryKeys.tickets?.detail(event.ticketId) || ['tickets', event.ticketId];
          queryClient.setQueryData(detailKey, (old: any) => {
            if (!old) return old;
            return {
              ...old,
              assignedAgent: event.assignedTo,
              updatedAt: event.timestamp
            };
          });
          // Update in list
          queryClient.setQueriesData(
            { queryKey: queryKeys.tickets?.list() || ['tickets'] },
            (old: any) => {
              if (!old?.data) return old;
              return {
                ...old,
                data: old.data.map((t: any) =>
                  t.id === event.ticketId
                    ? { ...t, assignedAgent: event.assignedTo, updatedAt: event.timestamp }
                    : t
                )
              };
            }
          );
        }
        optionsRef.current.onAssigned?.(event);
        break;
      case 'ticket:message_added':
        // Optimistic update: Add message to ticket immediately
        if (event.ticketId && event.message) {
          const detailKey = queryKeys.tickets?.detail(event.ticketId) || ['tickets', event.ticketId];
          queryClient.setQueryData(detailKey, (old: any) => {
            if (!old) return old;
            const messages = old.messages || [];
            // Check if message already exists
            const exists = messages.some((m: any) => m.id === event.message?.id);
            if (exists) return old;
            return {
              ...old,
              messages: [...messages, event.message],
              updatedAt: event.timestamp
            };
          });
        } else {
          // Fallback to invalidation
          if (event.ticketId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.detail(event.ticketId) || ['tickets', event.ticketId] });
          }
        }
        optionsRef.current.onMessageAdded?.(event);
        break;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConnected || !options.enabled) return;

    client.subscribeToTickets(options.filters);

    const unsubscribeCreated = subscribe('ticket:created', handleEvent);
    const unsubscribeUpdated = subscribe('ticket:updated', handleEvent);
    const unsubscribeStatusChanged = subscribe('ticket:status_changed', handleEvent);
    const unsubscribeAssigned = subscribe('ticket:assigned', handleEvent);
    const unsubscribeMessageAdded = subscribe('ticket:message_added', handleEvent);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeStatusChanged();
      unsubscribeAssigned();
      unsubscribeMessageAdded();
      client.unsubscribeFromTickets();
    };
  }, [isConnected, options.enabled, subscribe, unsubscribe, client, handleEvent, options.filters]);

  return {
    isConnected
  };
}

