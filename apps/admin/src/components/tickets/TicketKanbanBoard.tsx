import { useState, useMemo, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, User, Tag } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useMobile } from '../../hooks/useMobile';
import type { Ticket, TicketStatus, TicketPriority } from '@nebula/shared/types';
import { cn } from '../../utils/cn';
import { logger } from '../../lib/logger';

interface TicketKanbanBoardProps {
  tickets: Ticket[];
  isLoading: boolean;
  onTicketClick: (ticketId: string) => void;
}

const columns: { status: TicketStatus; label: string; color: string }[] = [
  { status: 'open', label: 'Open', color: 'bg-green-500/10 border-green-500/20' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-500/10 border-blue-500/20' },
  { status: 'waiting', label: 'Waiting', color: 'bg-yellow-500/10 border-yellow-500/20' },
  { status: 'escalated', label: 'Escalated', color: 'bg-red-500/10 border-red-500/20' },
  { status: 'done', label: 'Done', color: 'bg-gray-500/10 border-gray-500/20' },
];

const priorityColors: Record<TicketPriority, string> = {
  low: 'text-gray-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

export const TicketKanbanBoard = memo(function TicketKanbanBoard({ tickets, isLoading, onTicketClick }: TicketKanbanBoardProps) {
  const { isMobile, isTablet } = useMobile();
  const [draggedTicket, setDraggedTicket] = useState<string | null>(null);

  // Memoize click handler
  const handleTicketClick = useCallback((ticketId: string) => {
    onTicketClick(ticketId);
  }, [onTicketClick]);

  const ticketsByStatus = useMemo(() => {
    const grouped: Record<TicketStatus, Ticket[]> = {
      open: [],
      waiting: [],
      in_progress: [],
      escalated: [],
      done: [],
    };

    tickets.forEach(ticket => {
      grouped[ticket.status].push(ticket);
    });

    // Sort by priority (critical first) and then by updatedAt
    Object.keys(grouped).forEach(status => {
      grouped[status as TicketStatus].sort((a, b) => {
        const priorityOrder: Record<TicketPriority, number> = {
          critical: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    });

    return grouped;
  }, [tickets]);

  const handleDragStart = (e: React.DragEvent, ticketId: string) => {
    setDraggedTicket(ticketId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticketId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TicketStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('text/plain');
    if (ticketId && draggedTicket) {
      // In production, this would call the API to update status
      // For now, we'll just log it
      logger.info(`Move ticket ${ticketId} to ${targetStatus}`);
    }
    setDraggedTicket(null);
  };

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  return (
    <div className={cn(
      'flex gap-4 overflow-x-auto pb-4',
      'scroll-smooth snap-x snap-mandatory',
      isMobile && 'gap-2'
    )}>
      {columns.map((column, columnIndex) => {
        const columnTickets = ticketsByStatus[column.status];
        const isOverdue = columnTickets.filter(t => 
          t.slaDueAt && new Date(t.slaDueAt) < new Date()
        ).length;

        return (
          <motion.div
            key={column.status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: columnIndex * 0.1 }}
            className={cn(
              'flex-shrink-0 snap-start',
              isMobile ? 'w-[85vw]' : isTablet ? 'w-72' : 'w-80'
            )}
          >
            <Card className={cn('p-4 h-full flex flex-col', column.color)}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text">{column.label}</h3>
                  <Badge variant="outline" className="text-xs">
                    {columnTickets.length}
                  </Badge>
                  {isOverdue > 0 && (
                    <Badge variant="error" className="text-xs">
                      {isOverdue} overdue
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tickets */}
              <div
                className={cn(
                  'flex-1 space-y-2',
                  isMobile ? 'min-h-[150px]' : 'min-h-[200px]'
                )}
                onDragOver={!isMobile ? handleDragOver : undefined}
                onDrop={!isMobile ? (e) => handleDrop(e, column.status) : undefined}
              >
                {columnTickets.map((ticket, index) => {
                  const isOverdue = ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date();
                  const isDragging = draggedTicket === ticket.id;

                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      draggable={!isMobile}
                      onDragStart={(e) => !isMobile && handleDragStart(e, ticket.id)}
                      onClick={() => handleTicketClick(ticket.id)}
                      className={cn(
                        'bg-surface/70 border border-white/10 rounded-lg p-3 transition-all duration-200',
                        !isMobile && 'cursor-move hover:border-white/20 hover:shadow-md',
                        isMobile && 'cursor-pointer active:scale-[0.98]',
                        isOverdue && 'border-red-500/50 bg-red-500/5',
                        isDragging && 'opacity-50'
                      )}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-text">{ticket.id}</span>
                            {ticket.unreadCount > 0 && (
                              <Badge variant="default" className="bg-blue-500 text-white text-xs h-4 px-1.5">
                                {ticket.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-text line-clamp-2">
                            {ticket.subject}
                          </h4>
                        </div>
                        <span className={cn('text-xs font-medium', priorityColors[ticket.priority])}>
                          {ticket.priority}
                        </span>
                      </div>

                      {/* Ticket Meta */}
                      <div className="flex items-center gap-3 text-xs text-muted mt-2">
                        {ticket.assignedAgent && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{ticket.assignedAgent}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(ticket.updatedAt).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      {ticket.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {ticket.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {ticket.tags.length > 2 && (
                            <span className="text-xs text-muted">+{ticket.tags.length - 2}</span>
                          )}
                        </div>
                      )}

                      {/* SLA Warning */}
                      {isOverdue && (
                        <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          SLA Overdue
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {columnTickets.length === 0 && (
                  <div className="text-center text-muted text-sm py-8">
                    No tickets
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
});


