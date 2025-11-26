import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { logger } from '../../lib/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Clock, Tag, MessageSquare, Send, UserPlus, AlertTriangle, 
  FileText, History, Check, ShoppingBag, TrendingUp, Zap, RefreshCw,
  Download, Share2, Printer, Search, ExternalLink, Copy, CheckCircle2,
  Wifi, WifiOff
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { TicketReplyBox } from './TicketReplyBox';
import { TicketAssignmentModal } from './TicketAssignmentModal';
import { TicketMessageThread } from './TicketMessageThread';
import { TicketPrioritySelector } from './TicketPrioritySelector';
import { TicketTagsEditor } from './TicketTagsEditor';
import { TicketNotes } from './TicketNotes';
import { TicketActivityLog } from './TicketActivityLog';
import { QuickActionsPanel } from './QuickActionsPanel';
import { useTicket, useUpdateTicketStatus, useTicketAssign, useUpdateTicketPriority, useTicketTags } from '../../lib/api/hooks';
import { useMobile } from '../../hooks/useMobile';
import { useToast } from '../ui/Toast';
import { useRealtimeTickets } from '../../lib/realtime/hooks/useRealtimeTickets';
import type { TicketStatus, TicketPriority } from '@nebula/shared/types';
import { cn } from '../../utils/cn';

interface TicketDetailModalProps {
  ticketId: string;
  onClose: () => void;
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

// Skeleton Loading Component
const TicketModalSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 bg-surface/30 rounded-lg w-3/4" />
    <div className="h-4 bg-surface/30 rounded-lg w-1/2" />
    <div className="h-64 bg-surface/30 rounded-lg" />
  </div>
);

// Error State Component with Fallback UI
const TicketNotFoundFallback = ({ 
  ticketId, 
  onRetry, 
  onClose, 
  onSearch 
}: { 
  ticketId: string; 
  onRetry: () => void; 
  onClose: () => void;
  onSearch: (query: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border-2 border-red-500/30">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-text">Ticket nicht gefunden</h3>
        <p className="text-sm text-muted">
          Das Ticket mit der ID <span className="font-mono text-accent">{ticketId}</span> konnte nicht geladen werden.
        </p>
      </div>
      
      <div className="w-full max-w-md space-y-4">
        {/* Search for similar tickets */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                onSearch(searchQuery.trim());
              }
            }}
            placeholder="Nach ähnlichen Tickets suchen..."
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'bg-surface/50 border border-white/10',
              'text-text placeholder:text-muted',
              'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50'
            )}
          />
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Erneut versuchen
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Schließen
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted space-y-1">
        <p>Mögliche Gründe:</p>
        <ul className="list-disc list-inside space-y-1 text-left max-w-md">
          <li>Das Ticket wurde gelöscht</li>
          <li>Du hast keine Berechtigung, dieses Ticket zu sehen</li>
          <li>Die Ticket-ID ist ungültig</li>
          <li>Netzwerkfehler beim Laden</li>
        </ul>
      </div>
    </div>
  );
};

export function TicketDetailModal({ ticketId, onClose }: TicketDetailModalProps) {
  const { isMobile } = useMobile();
  const toast = useToast();
  const [showAssignment, setShowAssignment] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'activity' | 'notes'>('messages');
  const [retryCount, setRetryCount] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { 
    data: ticketResponse, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useTicket(ticketId);
  
  const updateStatus = useUpdateTicketStatus();
  const assignMutation = useTicketAssign();
  const updatePriority = useUpdateTicketPriority();
  const updateTags = useTicketTags();

  // Handle different response formats - MUST be defined before useRealtimeTickets
  const ticket = useMemo(() => {
    if (!ticketResponse) return null;
    
    // Handle direct ticket object
    if (ticketResponse && typeof ticketResponse === 'object' && 'id' in ticketResponse) {
      return ticketResponse as any;
    }
    
    // Handle nested data structure
    if (ticketResponse?.data) {
      if (typeof ticketResponse.data === 'object' && 'id' in ticketResponse.data) {
        return ticketResponse.data;
      }
      if (ticketResponse.data?.data && typeof ticketResponse.data.data === 'object' && 'id' in ticketResponse.data.data) {
        return ticketResponse.data.data;
      }
    }
    
    // Try to extract from success response
    if (ticketResponse?.success && ticketResponse?.data) {
      return ticketResponse.data;
    }
    
    return null;
  }, [ticketResponse]);

  // Real-time updates for ticket messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef<number>(0);
  
  const { isConnected: realtimeConnected } = useRealtimeTickets({
    enabled: !!ticketId && !!ticket,
    filters: {
      ticketIds: ticketId ? [ticketId] : []
    },
    onMessageAdded: useCallback((event) => {
      if (event.ticketId === ticketId && event.message) {
        logger.info('[TicketDetailModal] New message received via WebSocket', { 
          ticketId: event.ticketId, 
          messageId: event.message.id 
        });
        
        // Trigger refetch to get updated ticket data
        refetch();
        
        // Auto-scroll to new message after a short delay
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 100);
      }
    }, [ticketId, refetch]),
    onUpdated: useCallback((event) => {
      if (event.ticketId === ticketId && event.ticket) {
        logger.info('[TicketDetailModal] Ticket updated via WebSocket', { ticketId: event.ticketId });
        refetch();
      }
    }, [ticketId, refetch])
  });

  // Intelligent retry logic with exponential backoff
  useEffect(() => {
    if (!ticket && !isLoading && error && ticketId && retryCount < 3) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
      const retryTimeout = setTimeout(() => {
        logger.info('Retrying ticket fetch', { ticketId, attempt: retryCount + 1 });
        setRetryCount(prev => prev + 1);
        refetch();
      }, delay);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [ticket, isLoading, error, ticketId, refetch, retryCount]);

  // Reset retry count when ticket is found
  useEffect(() => {
    if (ticket) {
      setRetryCount(0);
    }
  }, [ticket]);

  // Define handleStatusChange before it's used in keyboard shortcuts
  const handleStatusChange = useCallback(async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      await updateStatus.mutateAsync({
        id: ticket.id,
        status: newStatus,
        comment: `Status changed to ${newStatus}`,
      });
      logger.logUserAction('ticket_status_changed', { ticketId: ticket.id, newStatus });
      toast.success('Status aktualisiert', `Ticket-Status geändert zu ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Status';
      logger.error('Failed to update ticket status', error);
      toast.error('Status-Update fehlgeschlagen', errorMessage);
    }
  }, [ticket, updateStatus, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape to close
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (!ticket) return;

      // Cmd/Ctrl + 1/2/3/4 to switch tabs
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('details');
          return;
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('messages');
          return;
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('activity');
          return;
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('notes');
          return;
        }
      }

      // 'a' - Assign ticket
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowAssignment(true);
        return;
      }

      // 'r' - Reply (focus reply box)
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setActiveTab('messages');
        setTimeout(() => {
          const replyBox = document.querySelector('textarea[placeholder*="Antwort"]') as HTMLTextAreaElement;
          replyBox?.focus();
        }, 100);
        return;
      }

      // 'e' - Escalate
      if (e.key === 'e' && !e.metaKey && !e.ctrlKey && ticket.status !== 'escalated') {
        e.preventDefault();
        handleStatusChange('escalated');
        return;
      }

      // 'd' - Mark Done
      if (e.key === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleStatusChange('done');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ticket, onClose, handleStatusChange]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEscalate = useCallback(async () => {
    if (!ticket) return;
    await handleStatusChange('escalated');
  }, [ticket, handleStatusChange]);

  const handlePriorityChange = useCallback(async (newPriority: TicketPriority) => {
    if (!ticket) return;
    try {
      await updatePriority.mutateAsync({
        ticketId: ticket.id,
        priority: newPriority,
      });
      logger.logUserAction('ticket_priority_changed', { ticketId: ticket.id, newPriority });
      toast.success('Priorität aktualisiert', `Priorität geändert zu ${newPriority}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Ändern der Priorität';
      logger.error('Failed to update ticket priority', error);
      toast.error('Prioritäts-Update fehlgeschlagen', errorMessage);
    }
  }, [ticket, updatePriority, toast]);

  const handleTagsChange = useCallback(async (newTags: string[]) => {
    if (!ticket) return;
    try {
      await updateTags.mutateAsync({
        ticketId: ticket.id,
        tags: newTags,
      });
      logger.logUserAction('ticket_tags_changed', { ticketId: ticket.id, tags: newTags });
      toast.success('Tags aktualisiert', `${newTags.length} Tag(s) gespeichert`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Tags';
      logger.error('Failed to update ticket tags', error);
      toast.error('Tags-Update fehlgeschlagen', errorMessage);
    }
  }, [ticket, updateTags, toast]);

  const handleShare = useCallback(() => {
    if (!ticket) return;
    const url = `${window.location.origin}/admin/tickets/${ticket.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link kopiert', 'Ticket-Link wurde in die Zwischenablage kopiert');
    }).catch(() => {
      toast.error('Fehler', 'Link konnte nicht kopiert werden');
    });
  }, [ticket, toast]);

  const handleExport = useCallback(() => {
    if (!ticket) return;
    // TODO: Implement PDF export
    toast.success('Export gestartet', 'Ticket wird als PDF exportiert...');
  }, [ticket, toast]);

  const handlePrint = useCallback(() => {
    if (!ticket) return;
    window.print();
  }, [ticket]);

  const handleSearchSimilar = useCallback((query: string) => {
    // TODO: Implement search for similar tickets
    toast.info('Suche', `Suche nach ähnlichen Tickets: ${query}`);
  }, [toast]);

  const handleRetry = useCallback(() => {
    setRetryCount(0);
    refetch();
  }, [refetch]);

  // Generate activity log from ticket data
  const activities = useMemo(() => {
    if (!ticket) return [];
    
    const acts: Array<{
      id: string;
      type: 'status_changed' | 'priority_changed' | 'assigned' | 'replied' | 'created' | 'tag_added' | 'note_added';
      timestamp: string;
      user?: string;
      description: string;
      changes?: { field: string; from: string; to: string }[];
    }> = [];

    // Ticket created
    acts.push({
      id: `created-${ticket.id}`,
      type: 'created',
      timestamp: ticket.createdAt,
      description: `Ticket ${ticket.id} was created`,
    });

    // Status changes
    if (ticket.status) {
      acts.push({
        id: `status-${ticket.id}`,
        type: 'status_changed',
        timestamp: ticket.updatedAt,
        description: `Status set to ${ticket.status}`,
        user: ticket.assignedAgent || 'System',
        changes: [{
          field: 'status',
          from: 'open',
          to: ticket.status,
        }],
      });
    }

    // Assignment
    if (ticket.assignedAgent) {
      acts.push({
        id: `assigned-${ticket.id}`,
        type: 'assigned',
        timestamp: ticket.updatedAt,
        description: `Assigned to ${ticket.assignedAgent}`,
        user: ticket.assignedAgent,
      });
    }

    // Messages count as replies
    if (ticket.messages && ticket.messages.length > 0) {
      ticket.messages.forEach((msg, idx) => {
        if (msg.from === 'agent' || msg.from === 'bot') {
          acts.push({
            id: `reply-${msg.id || idx}`,
            type: 'replied',
            timestamp: msg.timestamp,
            description: `Reply sent${msg.from === 'bot' ? ' (via bot)' : ''}`,
            user: msg.senderName || (msg.from === 'bot' ? 'Bot' : 'Agent'),
          });
        }
      });
    }

    // Sort by timestamp (newest first)
    return acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [ticket]);

  const isOverdue = ticket?.slaDueAt && new Date(ticket.slaDueAt) < new Date();

  // Loading state
  if (isLoading && !ticket) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden"
            ref={modalRef}
          >
            <Card
              variant="glassmorphic"
              className={cn(
                'p-8',
                'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                'backdrop-blur-xl border border-white/10',
                'shadow-2xl'
              )}
            >
              <TicketModalSkeleton />
            </Card>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Error/Not Found state
  if (!ticket && !isLoading && error) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-2xl overflow-hidden"
            ref={modalRef}
          >
            <Card
              variant="glassmorphic"
              className={cn(
                'p-8',
                'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                'backdrop-blur-xl border border-white/10',
                'shadow-2xl'
              )}
            >
              <TicketNotFoundFallback
                ticketId={ticketId}
                onRetry={handleRetry}
                onClose={onClose}
                onSearch={handleSearchSimilar}
              />
            </Card>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  if (!ticket) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            'relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col',
            isMobile && 'max-w-full max-h-[95vh]'
          )}
          ref={modalRef}
        >
          <Card
            variant="glassmorphic"
            className={cn(
              'flex flex-col h-full',
              'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
              'backdrop-blur-xl border border-white/10',
              'shadow-2xl shadow-black/40'
            )}
          >
            {/* Header */}
            <div className={cn(
              'flex items-center justify-between p-6 border-b border-white/10',
              'bg-gradient-to-r from-surface/60 via-surface/50 to-surface/40',
              'backdrop-blur-xl'
            )}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-text">{ticket.id}</span>
                  <Badge className={cn('text-xs font-semibold px-2.5 py-1', statusColors[ticket.status])}>
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1',
                      priorityColors[ticket.priority],
                      'border-current/30'
                    )}
                  >
                    {ticket.priority}
                  </Badge>
                  {ticket.assignedAgent && (
                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <UserPlus className="h-3 w-3" />
                      <span>{ticket.assignedAgent}</span>
                    </div>
                  )}
                  {isOverdue && (
                    <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-400">
                      SLA Overdue
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-text line-clamp-2">{ticket.subject}</h2>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 px-3"
                  title="Link teilen"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="h-8 px-3"
                  title="Als PDF exportieren"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 px-3"
                  title="Drucken"
                >
                  <Printer className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close ticket" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-6 py-3 border-b border-white/10 bg-surface/20">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignment(true)}
                  className="h-8 px-3"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-2" />
                  {ticket.assignedAgent ? 'Neu zuweisen' : 'Zuweisen'}
                </Button>
                {ticket.status !== 'escalated' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEscalate}
                    className="h-8 px-3"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                    Eskalieren
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('done')}
                  disabled={ticket.status === 'done'}
                  className="h-8 px-3"
                >
                  <Check className="h-3.5 w-3.5 mr-2" />
                  Als erledigt markieren
                </Button>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="h-8 px-3"
                >
                  <Zap className="h-3.5 w-3.5 mr-2" />
                  Quick Actions
                </Button>
              </div>
              
              {/* Quick Actions Panel */}
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-white/10"
                >
                  <QuickActionsPanel
                    ticket={ticket}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                    onAssign={() => setShowAssignment(true)}
                    onReply={() => {
                      setActiveTab('messages');
                      setTimeout(() => {
                        const replyBox = document.querySelector('textarea[placeholder*="Antwort"]') as HTMLTextAreaElement;
                        replyBox?.focus();
                      }, 100);
                    }}
                    onClose={() => setShowQuickActions(false)}
                  />
                </motion.div>
              )}
            </div>

            {/* Tabs */}
            <div className={cn(
              'border-b border-white/10',
              'bg-gradient-to-r from-surface/40 via-surface/30 to-surface/40',
              'backdrop-blur-sm'
            )}>
              <div className="flex gap-1 px-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('details')}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
                    'relative',
                    activeTab === 'details'
                      ? 'border-accent text-text bg-gradient-to-t from-accent/10 to-transparent'
                      : 'border-transparent text-muted hover:text-text hover:bg-surface/20'
                  )}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
                    'relative',
                    activeTab === 'messages'
                      ? 'border-accent text-text bg-gradient-to-t from-accent/10 to-transparent'
                      : 'border-transparent text-muted hover:text-text hover:bg-surface/20'
                  )}
                >
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Nachrichten
                  {ticket.messages && ticket.messages.length > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs bg-accent/20 border-accent/30">
                      {ticket.messages.length}
                    </Badge>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
                    'relative',
                    activeTab === 'activity'
                      ? 'border-accent text-text bg-gradient-to-t from-accent/10 to-transparent'
                      : 'border-transparent text-muted hover:text-text hover:bg-surface/20'
                  )}
                >
                  <History className="h-4 w-4 inline mr-2" />
                  Aktivität
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
                    'relative',
                    activeTab === 'notes'
                      ? 'border-accent text-text bg-gradient-to-t from-accent/10 to-transparent'
                      : 'border-transparent text-muted hover:text-text hover:bg-surface/20'
                  )}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  Notizen
                </button>
              </div>
            </div>

            {/* Content */}
            <div className={cn(
              'flex-1 overflow-y-auto p-6',
              isMobile && 'p-4'
            )}>
              <AnimatePresence mode="wait">
                {activeTab === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* Customer Info Card */}
                    <Card 
                      variant="glassmorphic"
                      className={cn(
                        'p-4',
                        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                        'backdrop-blur-xl border border-white/10'
                      )}
                    >
                      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Kundeninformationen
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted">Kunde:</span>
                          <span className="text-text font-medium">{ticket.telegramUserHash || ticket.userId || 'Unbekannt'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted">Kanal:</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {ticket.channel || 'web'}
                          </Badge>
                        </div>
                      </div>
                    </Card>

                    {/* Priority Quick Change */}
                    <Card 
                      variant="glassmorphic"
                      className={cn(
                        'p-4',
                        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                        'backdrop-blur-xl border border-white/10'
                      )}
                    >
                      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Priorität
                      </h3>
                      <TicketPrioritySelector
                        currentPriority={ticket.priority}
                        onPriorityChange={handlePriorityChange}
                      />
                    </Card>

                    {/* Ticket Info */}
                    <Card 
                      variant="glassmorphic"
                      className={cn(
                        'p-4',
                        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                        'backdrop-blur-xl border border-white/10'
                      )}
                    >
                      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Ticket Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted" />
                          <span className="text-muted">Erstellt:</span>
                          <span className="text-text">
                            {new Date(ticket.createdAt).toLocaleString('de-DE')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted" />
                          <span className="text-muted">Aktualisiert:</span>
                          <span className="text-text">
                            {new Date(ticket.updatedAt).toLocaleString('de-DE')}
                          </span>
                        </div>
                        {ticket.assignedAgent && (
                          <div className="flex items-center gap-2 text-sm">
                            <UserPlus className="h-4 w-4 text-muted" />
                            <span className="text-muted">Zugewiesen an:</span>
                            <span className="text-text font-medium">{ticket.assignedAgent}</span>
                          </div>
                        )}
                        {ticket.slaDueAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted" />
                            <span className="text-muted">SLA Fällig:</span>
                            <span className={cn('text-text font-medium', isOverdue && 'text-red-400')}>
                              {new Date(ticket.slaDueAt).toLocaleString('de-DE')}
                              {isOverdue && ' (Überfällig)'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-sm">
                          <Tag className="h-4 w-4 text-muted mt-0.5" />
                          <div className="flex-1">
                            <span className="text-muted block mb-2">Tags:</span>
                            <TicketTagsEditor
                              tags={ticket.tags || []}
                              onTagsChange={handleTagsChange}
                              category={ticket.category}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Summary */}
                    <Card 
                      variant="glassmorphic"
                      className={cn(
                        'p-4',
                        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                        'backdrop-blur-xl border border-white/10'
                      )}
                    >
                      <h3 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Zusammenfassung
                      </h3>
                      <p className="text-sm text-text/80 whitespace-pre-wrap leading-relaxed">{ticket.summary}</p>
                    </Card>

                    {/* Related Tickets */}
                    <Card 
                      variant="glassmorphic"
                      className={cn(
                        'p-4',
                        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                        'backdrop-blur-xl border border-white/10'
                      )}
                    >
                      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Ähnliche Tickets
                      </h3>
                      <div className="space-y-2">
                        <p className="text-xs text-muted">
                          Tickets mit ähnlichem Thema oder vom selben Kunden
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Search className="h-3 w-3" />
                          <span>Feature in Entwicklung...</span>
                        </div>
                      </div>
                    </Card>

                    {/* Customer Context */}
                    <Card 
                      variant="glassmorphic"
                      className={cn(
                        'p-4',
                        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                        'backdrop-blur-xl border border-white/10'
                      )}
                    >
                      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Kundenkontext
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-xs">
                            <ShoppingBag className="h-3.5 w-3.5 text-muted" />
                            <div>
                              <div className="text-muted">Bestellungen</div>
                              <div className="text-text font-semibold">—</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <TrendingUp className="h-3.5 w-3.5 text-muted" />
                            <div>
                              <div className="text-muted">Ticket Historie</div>
                              <div className="text-text font-semibold">—</div>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-xs text-muted">
                            Vollständige Kundenhistorie wird in Kürze verfügbar sein
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'messages' && (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Conversation
                          {ticket.messages && ticket.messages.length > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {ticket.messages.length}
                            </Badge>
                          )}
                        </h3>
                        {/* Connection Status Indicator */}
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs',
                            realtimeConnected 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          )}>
                            {realtimeConnected ? (
                              <>
                                <Wifi className="h-3 w-3" />
                                <span>Live</span>
                              </>
                            ) : (
                              <>
                                <WifiOff className="h-3 w-3" />
                                <span>Offline</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <TicketMessageThread
                        messages={ticket.messages || []}
                        isLoading={isFetching}
                        onMessageRead={(messageId) => {
                          logger.debug('Message read', { messageId, ticketId: ticket.id });
                        }}
                      />
                      {/* Scroll anchor for auto-scroll */}
                      <div ref={messagesEndRef} />
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card 
                      variant="glassmorphic"
                      className={cn(
                        'p-4',
                        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                        'backdrop-blur-xl border border-white/10'
                      )}
                    >
                      <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Aktivitätsverlauf
                      </h3>
                      <TicketActivityLog activities={activities} isLoading={isFetching} />
                    </Card>
                  </motion.div>
                )}

                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <TicketNotes ticketId={ticket.id} notes={[]} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer - Reply Box & Actions */}
            {activeTab === 'messages' && (
              <div className={cn(
                'border-t border-white/10 space-y-3',
                'bg-gradient-to-t from-surface/60 via-surface/50 to-surface/40',
                'backdrop-blur-xl',
                'p-4'
              )}>
                <TicketReplyBox 
                  ticketId={ticket.id} 
                  onReplySent={() => {
                    // Optimistic update - refetch will be triggered by WebSocket event
                    // But we also refetch here as fallback
                    setTimeout(() => {
                      refetch();
                      // Auto-scroll to new message
                      setTimeout(() => {
                        if (messagesEndRef.current) {
                          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }
                      }, 100);
                    }, 200);
                  }}
                />
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Assignment Modal */}
      {showAssignment && (
        <TicketAssignmentModal
          ticketId={ticket.id}
          currentAgent={ticket.assignedAgent}
          onClose={() => setShowAssignment(false)}
          onAssign={async (agentId, agentName) => {
            try {
              await assignMutation.mutateAsync({ ticketId: ticket.id, agentId });
              toast.success('Ticket zugewiesen', `Ticket wurde ${agentName} zugewiesen`);
              setShowAssignment(false);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Fehler beim Zuweisen';
              logger.error('Failed to assign ticket', error);
              toast.error('Zuweisung fehlgeschlagen', errorMessage);
            }
          }}
        />
      )}
    </AnimatePresence>
  );
}

