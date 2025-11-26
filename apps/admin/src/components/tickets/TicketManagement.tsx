import React, { useState, useCallback, useEffect, useMemo, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Calendar, Filter, X, Bell, RefreshCw, Menu, Ticket as TicketIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { lazy, Suspense } from 'react';
import { TicketListView } from './TicketListView';
import { TicketFilters } from './TicketFilters';
import { TicketLoadingSkeleton } from './TicketLoadingSkeleton';

// Lazy load heavy components for code splitting
const TicketKanbanBoard = lazy(() => 
  import('./TicketKanbanBoard').then(module => ({ default: module.TicketKanbanBoard }))
);
const TicketStats = lazy(() => 
  import('./TicketStats').then(module => ({ default: module.TicketStats }))
);
const TicketDetailModal = lazy(() => 
  import('./TicketDetailModal').then(module => ({ default: module.TicketDetailModal }))
);
import { BulkActionsBar } from './BulkActionsBar';
import { CreateTicketModal } from '../modals/CreateTicketModal';
import { MobileTicketSheet } from './MobileTicketSheet';
import { FilterChips } from './FilterChips';
import { QuickFilters } from './QuickFilters';
import { TicketNotificationCenter } from './TicketNotificationCenter';
import { TicketShortcutsHelp } from './TicketShortcutsHelp';
import { SavedFiltersMenu } from './SavedFiltersMenu';
import { useTicketNotifications } from '../../hooks/useTicketNotifications';
import { useTickets, useTicketStats, queryKeys } from '../../lib/api/hooks';
import { useRealtimeTickets } from '../../lib/realtime/hooks/useRealtimeTickets';
import { useLiveUpdates } from '../../lib/store/dashboard';
import { logger } from '../../lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { useMobile } from '../../hooks/useMobile';
import { useToast } from '../ui/Toast';
import type { TicketViewMode, TicketFilters as TicketFiltersType } from './types';
// Import Ticket type - fallback if @nebula/shared/types not available
type Ticket = {
  id: string;
  subject: string;
  summary?: string;
  status: 'open' | 'waiting' | 'in_progress' | 'escalated' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  tags?: string[];
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
  slaDueAt?: string;
  telegramUserHash?: string;
  userId?: string;
  telegramUserId?: string;
  channel?: string;
  messages?: any[];
  unreadCount?: number;
};
import { cn } from '../../utils/cn';

export const TicketManagement = memo(function TicketManagement() {
  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('TicketManagement');
  const { handleError } = useErrorHandler('TicketManagement');
  const { isMobile, isTablet } = useMobile();
  const toast = useToast();
  
  const [viewMode, setViewMode] = useState<TicketViewMode>('list');
  const [filters, setFilters] = useState<TicketFiltersType>({});
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [activePreset, setActivePreset] = useState<string>('all');
  const [newTicketNotification, setNewTicketNotification] = useState<{ ticketId: string; subject: string } | null>(null);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const createTicketModalRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll: clearAllNotifications,
  } = useTicketNotifications();
  const refetchDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (refetchDebounceTimeoutRef.current) {
        clearTimeout(refetchDebounceTimeoutRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const { liveUpdates } = useLiveUpdates();
  const queryClient = useQueryClient();

  // Fetch tickets with filters
  const { data: ticketsResponse, isLoading, error, refetch } = useTickets({
    status: filters.status?.join(','),
    priority: filters.priority?.join(','),
    assignedAgent: filters.assignedAgent?.join(','),
    limit: 100,
    offset: 0
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      handleError(error, { action: 'fetch_tickets', filters });
    }
  }, [error, handleError, filters]);

  // Handle different response formats - optimized and without console.logs
  const tickets = React.useMemo(() => {
    if (!ticketsResponse) {
      logger.debug('No ticketsResponse', { ticketsResponse });
      return [];
    }
    
    // Handle paginated response (most common)
    if (ticketsResponse.data && Array.isArray(ticketsResponse.data)) {
      return ticketsResponse.data;
    }
    
    // Handle direct array response
    if (Array.isArray(ticketsResponse)) {
      return ticketsResponse;
    }
    
    // Handle nested data structure
    if ('data' in ticketsResponse && ticketsResponse.data && typeof ticketsResponse.data === 'object' && 'data' in ticketsResponse.data) {
      const nestedData = (ticketsResponse.data as any).data;
      if (Array.isArray(nestedData)) {
        return nestedData;
      }
    }
    
    // Try to extract from success response
    if ('success' in ticketsResponse && ticketsResponse.success && 'data' in ticketsResponse && Array.isArray(ticketsResponse.data)) {
      return ticketsResponse.data;
    }
    
    logger.warn('Could not extract tickets from response', { ticketsResponse });
    return [];
  }, [ticketsResponse]);
  
  const { data: stats } = useTicketStats();

  // Real-time updates with new infrastructure
  const { isConnected } = useRealtimeTickets({
    enabled: liveUpdates,
    filters: {
      status: filters.status?.length ? filters.status.join(',') : undefined,
      priority: filters.priority?.length ? filters.priority.join(',') : undefined,
    },
    onCreated: (event) => {
      measureAsync('handle_ticket_created', async () => {
        logger.info('New ticket created', { ticketId: event.ticketId, hasTicket: !!event.ticket });
        
        // Show visual notification - always show, even if ticket data is incomplete
        const ticket = event.ticket || {};
        const subject = ticket.subject || ticket.summary || 'Neues Ticket';
        const isFromTelegram = !!ticket.telegramUserId;
        const isFromWeb = !ticket.telegramUserId && (!!ticket.userId || ticket.channel === 'web');
        
        // Clear existing notification timeout if any
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        
        setNewTicketNotification({
          ticketId: event.ticketId,
          subject: subject
        });
        
        // Determine notification title based on source
        let notificationTitle = 'New Ticket Created';
        if (isFromTelegram) {
          notificationTitle = '📱 New Ticket from Telegram';
        } else if (isFromWeb) {
          notificationTitle = '🌐 New Ticket from Web';
        }
        
        // Add to notification center
        addNotification({
          ticketId: event.ticketId,
          type: 'ticket_created',
          title: notificationTitle,
          message: subject,
          ticket: {
            id: event.ticketId,
            subject: subject,
            priority: ticket.priority || 'medium',
            status: ticket.status || 'open',
            category: ticket.category || 'other',
            telegramUserId: ticket.telegramUserId,
          },
        });
        
        // Show toast notification
        toast.info(
          notificationTitle,
          subject
        );
        
        // Auto-hide notification after 8 seconds
        notificationTimeoutRef.current = setTimeout(() => {
          setNewTicketNotification(null);
          notificationTimeoutRef.current = null;
        }, 8000);
        
        // Optimistic update: Add ticket to cache immediately
        if (event.ticket) {
          // Track pending updates to prevent duplicate processing
          if (pendingUpdatesRef.current.has(event.ticketId)) {
            logger.debug('Ticket update already pending, skipping', { ticketId: event.ticketId });
            return;
          }
          pendingUpdatesRef.current.add(event.ticketId);
          
          // Update all possible ticket query keys
          const queryKey = queryKeys.tickets?.list(filters) || ['tickets'];
          
          queryClient.setQueryData(queryKey, (old: any) => {
            // Handle different response formats
            if (!old) return old;
            
            // If old is an array directly
            if (Array.isArray(old)) {
              const exists = old.some((t: Ticket) => t.id === event.ticketId);
              if (exists) return old;
              return [event.ticket, ...old];
            }
            
            // If old has a data property (paginated response)
            if (old.data && Array.isArray(old.data)) {
              const exists = old.data.some((t: Ticket) => t.id === event.ticketId);
              if (exists) return old;
              return {
                ...old,
                data: [event.ticket, ...old.data],
                total: old.total ? old.total + 1 : undefined
              };
            }
            
            return old;
          });
          
          // Also update stats
          queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.stats || ['tickets', 'stats'] });
        }
        
        // Debounced refetch to prevent multiple rapid refetches
        if (refetchDebounceTimeoutRef.current) {
          clearTimeout(refetchDebounceTimeoutRef.current);
        }
        
        refetchDebounceTimeoutRef.current = setTimeout(async () => {
          try {
            await refetch();
            // Clear pending update after successful refetch
            if (event.ticket) {
              pendingUpdatesRef.current.delete(event.ticketId);
            }
            logger.debug('[TicketManagement] Debounced refetch completed', { ticketId: event.ticketId });
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error('[TicketManagement] Debounced refetch failed', {
              ticketId: event.ticketId,
              error: errorMessage
            });
            handleError(err, { action: 'debounced_refetch', ticketId: event.ticketId });
            // Still clear pending update on error to allow retry
            if (event.ticket) {
              pendingUpdatesRef.current.delete(event.ticketId);
            }
          } finally {
            refetchDebounceTimeoutRef.current = null;
          }
        }, 300); // 300ms debounce
      }).catch(err => handleError(err, { action: 'handle_ticket_created' }));
    },
    onUpdated: (event) => {
      measureAsync('handle_ticket_updated', async () => {
        logger.info('Ticket updated', { ticketId: event.ticketId });
        await refetch();
      }).catch(err => handleError(err, { action: 'handle_ticket_updated' }));
    },
    onStatusChanged: (event) => {
      measureAsync('handle_ticket_status_changed', async () => {
        logger.info('Ticket status changed', { ticketId: event.ticketId });
        await refetch();
      }).catch(err => handleError(err, { action: 'handle_ticket_status_changed' }));
    },
  });

  // Apply search filter client-side - Optimized with early returns and reduced logging
  const filteredTickets = useMemo(() => {
    // Early return if no filters and no search
    const hasActiveFilters = filters.search || 
                             (filters.category && filters.category.length > 0) ||
                             (filters.tags && filters.tags.length > 0) ||
                             filters.slaOverdue;
    
    if (!hasActiveFilters) {
      return tickets;
    }
    
    const searchLower = filters.search?.toLowerCase() || '';
    const filterCategories = filters.category?.map(c => c.toLowerCase()) || [];
    const filterTags = filters.tags || [];
    const now = Date.now();
    
    return tickets.filter((ticket: Ticket) => {
      // Search filter - optimized with early return
      if (searchLower) {
        const searchableText = [
          ticket.id,
          ticket.subject,
          ticket.summary,
          ticket.category,
          ticket.priority,
          ticket.status,
          ...(ticket.tags || [])
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Category filter - optimized
      if (filterCategories.length > 0) {
        const ticketCategory = ticket.category?.toLowerCase();
        if (!ticketCategory || !filterCategories.includes(ticketCategory)) {
          return false;
        }
      }

      // Tags filter - optimized
      if (filterTags.length > 0) {
        const ticketTags = ticket.tags || [];
        if (!filterTags.some(tag => ticketTags.includes(tag))) {
          return false;
        }
      }

      // SLA overdue filter
      if (filters.slaOverdue) {
        if (!ticket.slaDueAt || new Date(ticket.slaDueAt).getTime() >= now) {
          return false;
        }
      }

      return true;
    });
  }, [tickets, filters]);

  const handleTicketClick = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId);
    logger.logUserAction('ticket_opened', { ticketId });
  }, []);

  const handleTicketClose = useCallback(() => {
    setSelectedTicketId(null);
  }, []);

  const handleBulkSelect = useCallback((ticketId: string, selected: boolean) => {
    setSelectedTicketIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(ticketId);
      } else {
        next.delete(ticketId);
      }
      return next;
    });
  }, []);

  const handleBulkSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedTicketIds(new Set(filteredTickets.map((t: Ticket) => t.id)));
    } else {
      setSelectedTicketIds(new Set());
    }
  }, [filteredTickets]);

  const handleClearSelection = useCallback(() => {
    setSelectedTicketIds(new Set());
  }, []);

  const handleQuickFilter = useCallback((preset: string) => {
    setActivePreset(preset);
    switch (preset) {
      case 'all':
        setFilters({});
        break;
      case 'my-tickets':
        // TODO: Get current user and filter by assignedAgent
        setFilters({});
        break;
      case 'overdue':
        setFilters({ slaOverdue: true });
        break;
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFilters({
          dateRange: {
            from: today,
            to: tomorrow,
          },
        });
        break;
      case 'unassigned':
        setFilters({ assignedAgent: [] });
        break;
      case 'critical':
        setFilters({ priority: ['critical'] });
        break;
      case 'open':
        setFilters({ status: ['open'] });
        break;
      case 'in-progress':
        setFilters({ status: ['in_progress'] });
        break;
      default:
        setFilters({});
    }
  }, []);

  const handleRemoveFilter = useCallback((filterType: keyof TicketFiltersType, value?: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (filterType === 'search') {
        delete newFilters.search;
      } else if (filterType === 'slaOverdue') {
        delete newFilters.slaOverdue;
      } else if (value && Array.isArray(newFilters[filterType])) {
        const arr = newFilters[filterType] as any[];
        const filtered = arr.filter(item => item !== value);
        if (filtered.length === 0) {
          delete newFilters[filterType];
        } else {
          (newFilters[filterType] as any) = filtered;
        }
      } else {
        delete newFilters[filterType];
      }
      
      return newFilters;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setActivePreset('all');
  }, []);

  const handleLoadSavedFilter = useCallback((loadedFilters: TicketFiltersType) => {
    setFilters(loadedFilters);
    setActivePreset('custom');
  }, []);

  // Enhanced keyboard shortcuts with 'g' prefix support
  const [gKeyPressed, setGKeyPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (gKeyPressed) setGKeyPressed(false);
        return;
      }

      // Handle 'g' prefix for navigation
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.shiftKey && !gKeyPressed) {
        setGKeyPressed(true);
        setTimeout(() => setGKeyPressed(false), 1000);
        return;
      }

      // 'g' prefix commands
      if (gKeyPressed) {
        switch (e.key) {
          case 'a':
            handleQuickFilter('all');
            setGKeyPressed(false);
            e.preventDefault();
            return;
          case 'm':
            handleQuickFilter('my-tickets');
            setGKeyPressed(false);
            e.preventDefault();
            return;
          case 'o':
            handleQuickFilter('open');
            setGKeyPressed(false);
            e.preventDefault();
            return;
          case 'c':
            handleQuickFilter('critical');
            setGKeyPressed(false);
            e.preventDefault();
            return;
          case 'u':
            handleQuickFilter('unassigned');
            setGKeyPressed(false);
            e.preventDefault();
            return;
          default:
            setGKeyPressed(false);
        }
      }

      // Escape closes detail panel or filters
      if (e.key === 'Escape') {
        if (selectedTicketId) {
          handleTicketClose();
        } else if (showFilters) {
          setShowFilters(false);
        }
        if (gKeyPressed) setGKeyPressed(false);
        return;
      }

      // '/' focuses search
      if (e.key === '/' && !showFilters) {
        setShowFilters(true);
        e.preventDefault();
        return;
      }

      // 'n' - new ticket
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        setIsCreateTicketModalOpen(true);
        logger.info('Create ticket shortcut pressed - Opening modal');
        e.preventDefault();
        return;
      }

      // 'j' - next ticket
      if (e.key === 'j' && !e.metaKey && !e.ctrlKey && filteredTickets.length > 0) {
        const currentIndex = selectedTicketId
          ? filteredTickets.findIndex((t: Ticket) => t.id === selectedTicketId)
          : -1;
        const nextIndex = currentIndex < filteredTickets.length - 1 ? currentIndex + 1 : 0;
        handleTicketClick(filteredTickets[nextIndex]?.id || '');
        e.preventDefault();
        return;
      }

      // 'k' - previous ticket
      if (e.key === 'k' && !e.metaKey && !e.ctrlKey && filteredTickets.length > 0) {
        const currentIndex = selectedTicketId
          ? filteredTickets.findIndex((t: Ticket) => t.id === selectedTicketId)
          : -1;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredTickets.length - 1;
        handleTicketClick(filteredTickets[prevIndex]?.id || '');
        e.preventDefault();
        return;
      }

      // 'x' - select/deselect current ticket
      if (e.key === 'x' && !e.metaKey && !e.ctrlKey && selectedTicketId) {
        handleBulkSelect(selectedTicketId, !selectedTicketIds.has(selectedTicketId));
        e.preventDefault();
        return;
      }

      // '*' - select all visible
      if (e.key === '*' && !e.metaKey && !e.ctrlKey) {
        handleBulkSelectAll(true);
        e.preventDefault();
        return;
      }

      // 'c' or 'k' - create ticket (Cmd/Ctrl+C or Cmd/Ctrl+K)
      if ((e.key === 'c' || e.key === 'k') && (e.metaKey || e.ctrlKey)) {
        setIsCreateTicketModalOpen(true);
        logger.info('Create ticket shortcut pressed - Opening modal');
        e.preventDefault();
        return;
      }

      // 'f' - toggle filters
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        setShowFilters(!showFilters);
        e.preventDefault();
        return;
      }

      // '?' - show shortcuts help
      if (e.key === '?') {
        setShowShortcutsHelp(true);
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicketId, showFilters, handleTicketClose, filteredTickets, handleTicketClick, gKeyPressed, handleQuickFilter, handleBulkSelect, handleBulkSelectAll]);

  // Focus management for create ticket modal
  useEffect(() => {
    if (isCreateTicketModalOpen && createTicketModalRef.current) {
      // Focus will be handled by the Dialog component, but we can add additional focus management here if needed
      const firstInput = createTicketModalRef.current.querySelector('input, textarea') as HTMLElement;
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }, [isCreateTicketModalOpen]);

  // View mode shortcuts (Cmd/Ctrl + 1/2/3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cmd/Ctrl + 1/2/3 to switch view modes
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          setViewMode('list');
        } else if (e.key === '2') {
          e.preventDefault();
          setViewMode('kanban');
        } else if (e.key === '3') {
          e.preventDefault();
          setViewMode('calendar');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateTicketSuccess = useCallback((ticketId?: string) => {
    setIsCreateTicketModalOpen(false);
    
    // If we have a ticket ID, open it immediately
    if (ticketId) {
      // Wait a bit for the ticket to be available in the API
      setTimeout(() => {
        handleTicketClick(ticketId);
        toast.success('Ticket erstellt! 🎉', 'Das Ticket wurde erfolgreich erstellt und geöffnet');
        logger.info('Ticket created and opened', { ticketId });
      }, 500);
    } else {
      // Refetch tickets to show the new one
      refetch();
      toast.success('Ticket erstellt! 🎉', 'Das Ticket wurde erfolgreich erstellt');
      logger.info('Ticket created successfully');
    }
  }, [refetch, toast, handleTicketClick]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* New Ticket Notification */}
      <AnimatePresence>
        {newTicketNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'fixed z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-3',
              'top-4 right-4',
              'min-w-[280px] sm:min-w-[300px] max-w-[calc(100vw-2rem)] sm:max-w-[500px]'
            )}
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">Neues Ticket erstellt!</div>
              <div className="text-sm text-green-100 mt-1 truncate">
                {newTicketNotification.subject}
              </div>
              <div className="text-xs text-green-200 mt-1">
                ID: {newTicketNotification.ticketId}
              </div>
            </div>
            <button
              onClick={() => setNewTicketNotification(null)}
              className="text-white hover:text-green-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Responsive - Enhanced */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between',
          'flex-col sm:flex-row gap-3 sm:gap-0',
          'pb-2 sm:pb-0',
          'bg-gradient-to-r from-surface/40 via-surface/30 to-surface/20',
          'backdrop-blur-xl rounded-2xl p-4 border border-white/10',
          'shadow-xl shadow-black/20'
        )}
      >
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-text bg-gradient-to-r from-text to-text/80 bg-clip-text">
            Support Tickets
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 border-2 border-muted border-t-accent rounded-full animate-spin" />
                <span className="hidden sm:inline">Lade Tickets...</span>
                <span className="sm:hidden">Lade...</span>
              </span>
            ) : error ? (
              <span className="text-red-400">Fehler beim Laden</span>
            ) : (
              <>
                {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                {tickets.length !== filteredTickets.length && (
                  <span className="ml-2 text-xs text-muted hidden sm:inline">
                    (von {tickets.length} gefiltert)
                  </span>
                )}
                {isConnected && liveUpdates && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="hidden sm:inline">Live</span>
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <div className={cn(
          'flex items-center gap-2',
          'w-full sm:w-auto',
          'flex-wrap sm:flex-nowrap'
        )}>
          {/* View Mode Toggle - Responsive */}
          <div className={cn(
            'flex items-center gap-1',
            'bg-gradient-to-br from-surface/40 to-surface/20',
            'backdrop-blur-sm rounded-lg p-1 border border-white/10',
            'shadow-lg shadow-black/10',
            'flex-1 sm:flex-initial'
          )}>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                'h-8 sm:px-3',
                isMobile ? 'px-2 flex-1' : 'px-3'
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'h-8 sm:px-3',
                isMobile ? 'px-2 flex-1' : 'px-3'
              )}
              aria-label="Kanban view"
            >
              <LayoutGrid className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Kanban</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'h-8 sm:px-3',
                isMobile ? 'px-2 flex-1' : 'px-3'
              )}
              disabled
              title="Coming soon"
              aria-label="Calendar view"
            >
              <Calendar className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </div>

          {/* Saved Filters Menu */}
          <SavedFiltersMenu
            currentFilters={filters}
            onLoadFilter={handleLoadSavedFilter}
          />

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'h-8',
              isMobile ? 'px-2' : 'px-3'
            )}
            aria-label="Toggle filters"
          >
            <Filter className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Filters</span>
          </Button>

          {/* Stats Toggle */}
          <Button
            variant={showStats ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className={cn(
              'h-8',
              isMobile ? 'px-2' : 'px-3'
            )}
            aria-label="Toggle stats"
          >
            <span className="hidden sm:inline">Stats</span>
            <span className="sm:hidden">📊</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.list() });
              queryClient.invalidateQueries({ queryKey: queryKeys.tickets?.stats });
              refetch();
            }}
            disabled={isLoading}
            title="Tickets aktualisieren"
            className={cn(
              'h-8',
              isMobile ? 'px-2' : 'px-3'
            )}
            aria-label="Refresh tickets"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>

          {/* Notification Center */}
          <TicketNotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onNotificationClick={(notification) => {
              handleTicketClick(notification.ticketId);
            }}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAllNotifications}
          />
        </div>
      </motion.div>

      {/* Quick Filters */}
      <QuickFilters
        onFilterSelect={handleQuickFilter}
        activePreset={activePreset}
      />

      {/* Filter Chips */}
      <FilterChips
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Stats Bar - Enhanced */}
      <AnimatePresence mode="wait">
        {showStats && stats && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<TicketLoadingSkeleton count={1} variant="card" />}>
              <TicketStats stats={stats && typeof stats === 'object' && 'data' in stats ? (stats as any).data : (stats as any)} />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions */}
      {selectedTicketIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedTicketIds.size}
          ticketIds={Array.from(selectedTicketIds)}
          onClear={handleClearSelection}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-4 relative">
        {/* Filters - Desktop Sidebar / Mobile Bottom Sheet */}
        {isMobile ? (
          <MobileTicketSheet
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            title="Filters"
            snapPoints={[60, 85]}
            defaultSnapPoint={0}
          >
            <div className="p-4">
              <TicketFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          </MobileTicketSheet>
        ) : (
          <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 z-10 w-80"
            >
              <Card 
                variant="glassmorphic"
                className={cn(
                  'h-full p-4',
                  'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                  'backdrop-blur-xl border border-white/10',
                  'shadow-2xl shadow-black/30'
                )}
              >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Filters</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(false)}
                        aria-label="Close filters"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <TicketFilters
                      filters={filters}
                      onFiltersChange={setFilters}
                    />
                  </Card>
                </motion.div>
                {/* Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-[5]"
                  onClick={() => setShowFilters(false)}
                />
              </>
            )}
          </AnimatePresence>
        )}

        {/* Ticket List/Kanban */}
        <div className={cn(
          'flex-1 transition-all duration-300',
          !isMobile && showFilters && 'ml-80'
        )}>
          {viewMode === 'list' && (
            <TicketListView
              tickets={filteredTickets}
              isLoading={isLoading}
              error={error}
              selectedTicketId={selectedTicketId}
              selectedTicketIds={selectedTicketIds}
              onTicketClick={handleTicketClick}
              onBulkSelect={handleBulkSelect}
              onBulkSelectAll={handleBulkSelectAll}
              onCreateTicket={() => setIsCreateTicketModalOpen(true)}
              onClearFilters={handleClearAllFilters}
              hasFilters={Object.keys(filters).length > 0}
            />
          )}

          {viewMode === 'kanban' && (
            <Suspense fallback={<TicketLoadingSkeleton count={5} variant="card" />}>
              <TicketKanbanBoard
                tickets={filteredTickets}
                isLoading={isLoading}
                onTicketClick={handleTicketClick}
              />
            </Suspense>
          )}

          {viewMode === 'calendar' && (
            <Card className="p-8 text-center text-muted">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Calendar view coming soon</p>
            </Card>
          )}
        </div>

        {/* Create Ticket Modal */}
        <CreateTicketModal
          isOpen={isCreateTicketModalOpen}
          onClose={() => setIsCreateTicketModalOpen(false)}
          onSuccess={handleCreateTicketSuccess}
        />

        {/* Ticket Detail Modal */}
        <AnimatePresence>
          {selectedTicketId && (
            <Suspense fallback={null}>
              <TicketDetailModal
                ticketId={selectedTicketId}
                onClose={handleTicketClose}
              />
            </Suspense>
          )}
        </AnimatePresence>
      </div>

      {/* Shortcuts Help Modal */}
      <TicketShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
});

