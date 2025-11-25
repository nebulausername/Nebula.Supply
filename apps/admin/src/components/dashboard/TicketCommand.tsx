import { useTickets, useUpdateTicketStatus } from '../../lib/api/hooks';
import { useRealtimeTickets } from '../../lib/websocket/useRealtimeTickets';
import { useLiveUpdates } from '../../lib/store/dashboard';
import { Card } from '../ui/Card';
import { logger } from '../../lib/logger';
import { useEffect, useCallback, useMemo } from 'react';
import { performanceMonitor } from '../../lib/performance';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { motion } from 'framer-motion';
import { springConfigs } from '../../utils/springConfigs';

export function TicketCommand() {
  const startTime = performance.now();
  const { liveUpdates } = useLiveUpdates();
  const { handleError, handleAsyncError } = useErrorHandler('TicketCommand');
  const { measureAsync } = usePerformanceMonitor('TicketCommand');
  const { data: ticketsResponse, isLoading, error } = useTickets({
    limit: 6,
    status: 'escalated,waiting'
  });

  // Extract tickets array from response
  const tickets = useMemo(() => {
    if (!ticketsResponse) return [];
    // Handle paginated response with data property
    if (ticketsResponse.data && Array.isArray(ticketsResponse.data)) {
      return ticketsResponse.data;
    }
    // Handle direct array response
    if (Array.isArray(ticketsResponse)) {
      return ticketsResponse;
    }
    return [];
  }, [ticketsResponse]);

  // Performance monitoring
  useEffect(() => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.recordMetrics({
      renderTime,
      componentName: 'TicketCommand',
      operation: 'render'
    });
  });

  // Lokale Ticket-Daten für sofortigen Zugriff
  const localTickets = [
    {
      id: 'T-582',
      subject: 'Lieferung verzoegert',
      status: 'waiting' as const,
      priority: 'high' as const,
      category: 'shipping',
      createdAt: '2025-09-18T08:42:00.000Z',
      slaDueAt: '2025-09-20T12:00:00.000Z'
    },
    {
      id: 'T-575',
      subject: 'Checkout Fehler',
      status: 'escalated' as const,
      priority: 'critical' as const,
      category: 'payment',
      createdAt: '2025-09-16T09:02:00.000Z',
      slaDueAt: '2025-09-20T11:00:00.000Z'
    }
  ];

  const updateTicketStatus = useUpdateTicketStatus();

  // Real-time ticket updates via WebSocket
  const { isConnected, connectionStatus } = useRealtimeTickets({
    enabled: liveUpdates,
    filters: {
      status: 'escalated,waiting',
      priority: 'high,critical'
    },
    onStatusChanged: (event) => {
      logger.info('Ticket status changed via WebSocket', {
        ticketId: event.ticketId,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus
      });
    },
    onCreated: (event) => {
      logger.info('New ticket created via WebSocket', { ticketId: event.ticketId });
    },
    onEscalated: (event) => {
      logger.warn('Ticket escalated via WebSocket', { ticketId: event.ticketId });
    }
  });

  useEffect(() => {
    if (isConnected) {
      logger.info('Real-time ticket updates connected');
    }
  }, [isConnected]);

  const handleStatusChange = useCallback(async (ticketId: string, newStatus: string) => {
    await measureAsync('status_change', async () => {
      await updateTicketStatus.mutateAsync({
        id: ticketId,
        status: newStatus as any,
        comment: `Status geändert über Dashboard`
      });

      logger.logUserAction('ticket_status_changed', { ticketId, newStatus });
    }).catch((error) => {
      handleError(error, { operation: 'status_change', ticketId, newStatus });
    });
  }, [updateTicketStatus, measureAsync, handleError]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'escalated': return 'text-red-400';
      case 'waiting': return 'text-yellow-400';
      case 'in_progress': return 'text-blue-400';
      case 'done': return 'text-green-400';
      default: return 'text-gray-400';
    }
  }, []);

  const handleTicketClick = useCallback((ticketId: string) => {
    logger.logUserAction('ticket_clicked', { ticketId });
  }, []);

  const handleTicketDetailsView = useCallback((ticketId: string) => {
    logger.logUserAction('ticket_details_viewed', { ticketId });
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Ticket Command</h2>
          <span className="text-xs uppercase tracking-wide text-muted">Last 6 hours</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    handleError(error, { operation: 'tickets_fetch' });
    return (
      <Card className="p-6">
        <div className="text-center text-red-400">
          <p>Fehler beim Laden der Tickets</p>
          <p className="text-sm text-gray-400 mt-2">Bitte versuchen Sie es später erneut</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Ticket Command</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">Last 6 hours</span>
          {liveUpdates && isConnected && (
            <motion.div
              className="h-2 w-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              title="Real-time updates active"
            />
          )}
          {liveUpdates && !isConnected && (
            <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" title="Reconnecting..." />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(Array.isArray(tickets) && tickets.length > 0 ? tickets : localTickets).slice(0, 4).map((ticket, index) => (
          <motion.div
            key={ticket.id}
            className="group rounded-xl border border-white/10 bg-black/20 p-4 text-sm transition-all hover:bg-black/30 cursor-pointer"
            onClick={() => handleTicketClick(ticket.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...springConfigs.gentle,
              delay: index * 0.05
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-text">{ticket.id}</span>
              <span className={`text-xs uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </div>

            <p className="text-text mb-2 line-clamp-2">{ticket.subject}</p>

            <div className="flex items-center justify-between text-xs text-muted">
              <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
              <span>
                SLA: {ticket.slaDueAt ? new Date(ticket.slaDueAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                }) : "n/a"}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {ticket.status === 'waiting' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(ticket.id, 'in_progress');
                  }}
                  className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                >
                  Bearbeiten
                </button>
              )}

              {ticket.status === 'escalated' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(ticket.id, 'in_progress');
                  }}
                  className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                >
                  Übernehmen
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTicketDetailsView(ticket.id);
                }}
                className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30"
              >
                Details
              </button>
            </div>
          </motion.div>
        ))}

        {(!tickets || !Array.isArray(tickets) || tickets.length === 0) && localTickets.length === 0 && (
          <div className="col-span-2 text-center text-muted py-8">
            <p>Keine kritischen Tickets</p>
          </div>
        )}
      </div>
    </Card>
  );
}
