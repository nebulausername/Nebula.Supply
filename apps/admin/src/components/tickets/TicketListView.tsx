import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, ArrowUpDown, Clock, User, Tag, Ticket as TicketIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { TicketCard } from './TicketCard';
import { TicketLoadingSkeleton } from './TicketLoadingSkeleton';
import { TicketEmptyState } from './TicketEmptyState';
import { VirtualizedTicketList } from './VirtualizedTicketList';
import { useMobile } from '../../hooks/useMobile';
import type { Ticket, TicketStatus, TicketPriority } from '@nebula/shared/types';
import type { TicketSortOptions } from './types';
import { cn } from '../../utils/cn';

interface TicketListViewProps {
  tickets: Ticket[];
  isLoading: boolean;
  error: any;
  selectedTicketId: string | null;
  selectedTicketIds: Set<string>;
  onTicketClick: (ticketId: string) => void;
  onBulkSelect: (ticketId: string, selected: boolean) => void;
  onBulkSelectAll: (selected: boolean) => void;
  onCreateTicket?: () => void;
  onClearFilters?: () => void;
  hasFilters?: boolean;
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

export const TicketListView = memo(function TicketListView({
  tickets,
  isLoading,
  error,
  selectedTicketId,
  selectedTicketIds,
  onTicketClick,
  onBulkSelect,
  onBulkSelectAll,
  onCreateTicket,
  onClearFilters,
  hasFilters = false,
}: TicketListViewProps) {
  // Memoize callbacks to prevent unnecessary re-renders
  const handleTicketClickMemo = useCallback((ticketId: string) => {
    onTicketClick(ticketId);
  }, [onTicketClick]);

  const handleBulkSelectMemo = useCallback((ticketId: string, selected: boolean) => {
    onBulkSelect(ticketId, selected);
  }, [onBulkSelect]);
  const { isMobile } = useMobile();
  const [sort, setSort] = useState<TicketSortOptions>({
    field: 'updatedAt',
    order: 'desc',
  });

  const sortedTickets = useMemo(() => {
    const sorted = [...tickets];
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sort.field) {
        case 'createdAt':
        case 'updatedAt':
          aVal = new Date(a[sort.field]).getTime();
          bVal = new Date(b[sort.field]).getTime();
          break;
        case 'priority':
          const priorityOrder: Record<TicketPriority, number> = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
          };
          aVal = priorityOrder[a.priority];
          bVal = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder: Record<TicketStatus, number> = {
            escalated: 4,
            waiting: 3,
            in_progress: 2,
            open: 1,
            done: 0,
          };
          aVal = statusOrder[a.status];
          bVal = statusOrder[b.status];
          break;
        case 'subject':
          aVal = a.subject.toLowerCase();
          bVal = b.subject.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sort.order === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.order === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [tickets, sort]);

  const handleSort = (field: TicketSortOptions['field']) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Keyboard navigation for list view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Enter or 'o' opens selected ticket
      if ((e.key === 'Enter' || e.key === 'o') && selectedTicketId) {
        onTicketClick(selectedTicketId);
        e.preventDefault();
        return;
      }

      // Arrow keys navigate tickets
      if (e.key === 'ArrowDown' && sortedTickets.length > 0) {
        const currentIndex = selectedTicketId
          ? sortedTickets.findIndex(t => t.id === selectedTicketId)
          : -1;
        const nextIndex = currentIndex < sortedTickets.length - 1 ? currentIndex + 1 : 0;
        onTicketClick(sortedTickets[nextIndex].id);
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowUp' && sortedTickets.length > 0) {
        const currentIndex = selectedTicketId
          ? sortedTickets.findIndex(t => t.id === selectedTicketId)
          : -1;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : sortedTickets.length - 1;
        onTicketClick(sortedTickets[prevIndex].id);
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicketId, sortedTickets, onTicketClick]);

  const allSelected = tickets.length > 0 && selectedTicketIds.size === tickets.length;
  const someSelected = selectedTicketIds.size > 0 && selectedTicketIds.size < tickets.length;

  if (isLoading) {
    return <TicketLoadingSkeleton count={5} variant={isMobile ? 'card' : 'list'} />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error instanceof Error ? error : new Error(error?.message || error?.error || 'Unbekannter Fehler beim Laden der Tickets')}
        title="Fehler beim Laden"
        onRetry={() => window.location.reload()}
        variant="card"
      />
    );
  }

  if (tickets.length === 0) {
    return (
      <TicketEmptyState
        hasFilters={hasFilters}
        onCreateTicket={onCreateTicket}
        onClearFilters={onClearFilters}
      />
    );
  }

  // Use virtual scrolling for large lists (>50 tickets)
  const useVirtualScrolling = sortedTickets.length > 50 && !isMobile;

  // Mobile: Card-based layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {sortedTickets.map((ticket) => {
          const isSelected = selectedTicketIds.has(ticket.id);
          const isActive = selectedTicketId === ticket.id;

          return (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isSelected={isSelected}
              isActive={isActive}
              onClick={() => handleTicketClickMemo(ticket.id)}
              onSelect={(selected) => handleBulkSelectMemo(ticket.id, selected)}
            />
          );
        })}
      </div>
    );
  }

  // Virtual scrolling for desktop with many tickets
  if (useVirtualScrolling) {
    return (
      <Card 
        variant="glassmorphic"
        className={cn(
          'overflow-hidden',
          'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
          'backdrop-blur-xl border border-white/10',
          'shadow-xl shadow-black/20'
        )}
      >
        <div className="h-[600px]">
          <VirtualizedTicketList
            tickets={sortedTickets}
            selectedTicketId={selectedTicketId}
            selectedTicketIds={selectedTicketIds}
            onTicketClick={handleTicketClickMemo}
            onBulkSelect={handleBulkSelectMemo}
            height={600}
          />
        </div>
      </Card>
    );
  }

  // Desktop: Table layout with enhanced styling
  return (
    <Card 
      variant="glassmorphic"
      className={cn(
        'overflow-hidden',
        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
        'backdrop-blur-xl border border-white/10',
        'shadow-xl shadow-black/20',
        'transition-all duration-300'
      )}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead className={cn(
            'bg-gradient-to-r from-surface/60 via-surface/50 to-surface/40',
            'border-b border-white/10',
            'backdrop-blur-sm',
            'sticky top-0 z-10'
          )}>
            <tr>
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBulkSelectAll(!allSelected)}
                  className="h-6 w-6 p-0"
                >
                  <Check
                    className={cn(
                      'h-4 w-4',
                      allSelected ? 'opacity-100' : someSelected ? 'opacity-50' : 'opacity-0'
                    )}
                  />
                </Button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('subject')}
                  className="flex items-center gap-1"
                >
                  Subject
                  {sort.field === 'subject' && (
                    sort.order === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1"
                >
                  Status
                  {sort.field === 'status' && (
                    sort.order === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('priority')}
                  className="flex items-center gap-1"
                >
                  Priority
                  {sort.field === 'priority' && (
                    sort.order === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('updatedAt')}
                  className="flex items-center gap-1"
                >
                  Updated
                  {sort.field === 'updatedAt' && (
                    sort.order === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">
                Agent
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">
                SLA
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedTickets.map((ticket, index) => {
              const isSelected = selectedTicketIds.has(ticket.id);
              const isActive = selectedTicketId === ticket.id;
              const isOverdue = ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date();

              return (
                <motion.tr
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    'cursor-pointer transition-all duration-200 group',
                    'hover:bg-gradient-to-r hover:from-surface/50 hover:to-surface/30',
                    'hover:shadow-lg hover:shadow-accent/10',
                    'hover:scale-[1.01]',
                    'border-b border-white/5',
                    'active:scale-[0.99]',
                    isActive && 'bg-gradient-to-r from-primary/20 to-primary/10 shadow-lg shadow-primary/20 border-l-4 border-l-accent',
                    isSelected && 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 border-l-4 border-l-blue-500'
                  )}
                  onClick={() => handleTicketClickMemo(ticket.id)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkSelectMemo(ticket.id, !isSelected)}
                      className="h-5 w-5 p-0"
                    >
                      <Check className={cn('h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">{ticket.id}</span>
                      <span className="text-sm text-text/80 line-clamp-1">{ticket.subject}</span>
                      {ticket.unreadCount > 0 && (
                        <Badge variant="default" className="bg-blue-500 text-white text-xs">
                          {ticket.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn('text-xs', statusColors[ticket.status])}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-sm font-medium', priorityColors[ticket.priority])}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-muted capitalize">{ticket.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-muted">
                      <Clock className="h-3 w-3" />
                      {new Date(ticket.updatedAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {ticket.assignedAgent ? (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3 text-muted" />
                        <span className="text-text">{ticket.assignedAgent}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {ticket.slaDueAt ? (
                      <div className={cn(
                        'text-xs',
                        isOverdue ? 'text-red-400' : 'text-muted'
                      )}>
                        {isOverdue ? 'Overdue' : new Date(ticket.slaDueAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
});

