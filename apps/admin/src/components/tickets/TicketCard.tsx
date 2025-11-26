import { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, User, Tag, ChevronRight, AlertCircle, Zap, Flame } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchTicket } from '../../lib/api/hooks';
import type { Ticket, TicketStatus, TicketPriority } from '@nebula/shared/types';
import { cn } from '../../utils/cn';

interface TicketCardProps {
  ticket: Ticket;
  isSelected: boolean;
  isActive: boolean;
  onClick: () => void;
  onSelect: (selected: boolean) => void;
}

const statusColors: Record<TicketStatus, string> = {
  open: 'bg-green-500/10 text-green-400 border-green-500/20',
  waiting: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  escalated: 'bg-red-500/10 text-red-400 border-red-500/20',
  done: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const priorityColors: Record<TicketPriority, string> = {
  low: 'text-gray-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

const priorityIcons: Record<TicketPriority, typeof AlertCircle> = {
  low: AlertCircle,
  medium: AlertCircle,
  high: Zap,
  critical: Flame,
};

const priorityGlows: Record<TicketPriority, string> = {
  low: '',
  medium: 'shadow-yellow-500/20',
  high: 'shadow-orange-500/30',
  critical: 'shadow-red-500/40 animate-pulse',
};

export const TicketCard = memo(function TicketCard({ ticket, isSelected, isActive, onClick, onSelect }: TicketCardProps) {
  const queryClient = useQueryClient();
  const isOverdue = useMemo(
    () => ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date(),
    [ticket.slaDueAt]
  );
  const PriorityIcon = priorityIcons[ticket.priority];
  
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Prefetch ticket details on hover for faster loading
  const handleMouseEnter = useCallback(() => {
    // Clear any existing timeout
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
    
    // Debounce prefetch to avoid too many requests
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchTicket(ticket.id, queryClient).catch(() => {
        // Silently fail - prefetch is optional
      });
    }, 300); // Wait 300ms before prefetching
  }, [ticket.id, queryClient]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);
  
  // Memoize formatted dates
  const formattedCreatedDate = useMemo(
    () => new Date(ticket.createdAt).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    [ticket.createdAt]
  );
  
  const formattedUpdatedDate = useMemo(
    () => new Date(ticket.updatedAt).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    [ticket.updatedAt]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        variant="glassmorphic"
        interactive
        className={cn(
          'p-4 cursor-pointer transition-all duration-300',
          'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
          'backdrop-blur-xl border border-white/10',
          'hover:border-accent/40 hover:shadow-xl hover:shadow-accent/15',
          'hover:scale-[1.02] hover:-translate-y-0.5',
          'active:scale-[0.98]',
          'group',
          isActive && 'border-accent/60 bg-gradient-to-br from-primary/20 to-primary/10 shadow-xl shadow-primary/25',
          isSelected && 'border-blue-500/50 bg-gradient-to-br from-blue-500/15 to-blue-500/5 shadow-lg',
          isOverdue && 'border-red-500/40 bg-gradient-to-br from-red-500/10 to-red-500/5',
          priorityGlows[ticket.priority]
        )}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-surface text-accent focus:ring-2 focus:ring-accent"
            aria-label={`Select ticket ${ticket.id}`}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted truncate">{ticket.id}</span>
                  {ticket.unreadCount > 0 && (
                    <Badge variant="default" className="bg-blue-500 text-white text-xs h-5 px-1.5">
                      {ticket.unreadCount}
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-text line-clamp-2 mb-2">
                  {ticket.subject}
                </h3>
              </div>
              <ChevronRight className="h-4 w-4 text-muted flex-shrink-0 mt-1" />
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Badge 
                className={cn(
                  'text-xs font-semibold px-2.5 py-1',
                  'backdrop-blur-sm border',
                  statusColors[ticket.status]
                )}
              >
                {ticket.status.replace('_', ' ')}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-semibold px-2.5 py-1',
                  'flex items-center gap-1.5',
                  'transition-all duration-200',
                  priorityColors[ticket.priority],
                  'border-current/30',
                  ticket.priority === 'critical' && 'animate-pulse border-red-500/60',
                  ticket.priority === 'high' && 'group-hover:border-orange-500/60',
                  'backdrop-blur-sm'
                )}
              >
                <PriorityIcon className={cn(
                  'h-3 w-3',
                  ticket.priority === 'critical' && 'animate-pulse',
                  ticket.priority === 'high' && 'text-orange-400'
                )} />
                {ticket.priority}
              </Badge>
              {ticket.category && (
                <Badge
                  variant="outline"
                  className="text-xs text-muted capitalize px-2 py-1 border-white/10"
                >
                  {ticket.category}
                </Badge>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
              {ticket.assignedAgent ? (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="truncate">{ticket.assignedAgent}</span>
                </div>
              ) : (
                <span className="text-muted/70">Unassigned</span>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formattedUpdatedDate}
                </span>
              </div>
              {isOverdue && (
                <span className="text-red-400 font-medium">SLA Overdue</span>
              )}
            </div>

            {/* Tags */}
            {ticket.tags && ticket.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-2 flex-wrap">
                {ticket.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {ticket.tags.length > 3 && (
                  <span className="text-xs text-muted">+{ticket.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

