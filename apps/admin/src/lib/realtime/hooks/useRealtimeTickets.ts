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
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.list() || ['tickets'] });
        optionsRef.current.onCreated?.(event);
        break;
      case 'ticket:updated':
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.list() || ['tickets'] });
        if (event.ticketId) {
          queryClient.invalidateQueries({ queryKey: ['tickets', event.ticketId] });
        }
        optionsRef.current.onUpdated?.(event);
        break;
      case 'ticket:status_changed':
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.list() || ['tickets'] });
        if (event.ticketId) {
          queryClient.invalidateQueries({ queryKey: ['tickets', event.ticketId] });
        }
        optionsRef.current.onStatusChanged?.(event);
        break;
      case 'ticket:assigned':
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.list() || ['tickets'] });
        if (event.ticketId) {
          queryClient.invalidateQueries({ queryKey: ['tickets', event.ticketId] });
        }
        optionsRef.current.onAssigned?.(event);
        break;
      case 'ticket:message_added':
        if (event.ticketId) {
          queryClient.invalidateQueries({ queryKey: ['tickets', event.ticketId, 'messages'] });
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

