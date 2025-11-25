import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Clock, Tag, MessageSquare, Send, MoreVertical, UserPlus, AlertTriangle, FileText, History, Check, ShoppingBag, TrendingUp, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { TicketReplyBox } from './TicketReplyBox';
import { TicketAssignmentModal } from './TicketAssignmentModal';
import { MobileTicketSheet } from './MobileTicketSheet';
import { TicketMessageThread } from './TicketMessageThread';
import { TicketPrioritySelector } from './TicketPrioritySelector';
import { TicketTagsEditor } from './TicketTagsEditor';
import { TicketNotes } from './TicketNotes';
import { QuickActionsPanel } from './QuickActionsPanel';
import { useTicket, useUpdateTicketStatus, useTicketAssign, useUpdateTicketPriority, useTicketTags } from '../../lib/api/hooks';
import { useMobile } from '../../hooks/useMobile';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';
import type { TicketStatus, TicketPriority } from '@nebula/shared/types';
import { cn } from '../../utils/cn';

interface TicketDetailPanelProps {
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

export function TicketDetailPanel({ ticketId, onClose }: TicketDetailPanelProps) {
  const { isMobile } = useMobile();
  const toast = useToast();
  const [showAssignment, setShowAssignment] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'activity'>('messages');
  const { data: ticketResponse, isLoading } = useTicket(ticketId);
  const updateStatus = useUpdateTicketStatus();
  const assignMutation = useTicketAssign();
  const updatePriority = useUpdateTicketPriority();
  const updateTags = useTicketTags();

  const ticket = ticketResponse?.data;

  // Define handlers before useEffect to avoid initialization errors
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

  const handleEscalate = useCallback(async () => {
    if (!ticket) return;
    await handleStatusChange('escalated');
  }, [ticket, handleStatusChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape to close
      if (e.key === 'Escape' && !isMobile) {
        onClose();
        return;
      }

      if (!ticket) return;

      // Cmd/Ctrl + 1/2/3 to switch tabs
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
        // Focus reply box - will be handled by TicketReplyBox
        setTimeout(() => {
          const replyBox = document.querySelector('textarea[placeholder*="Antwort"]') as HTMLTextAreaElement;
          replyBox?.focus();
        }, 100);
        return;
      }

      // 'e' - Escalate
      if (e.key === 'e' && !e.metaKey && !e.ctrlKey && ticket.status !== 'escalated') {
        e.preventDefault();
        handleEscalate();
        return;
      }

      // 'd' - Mark Done
      if (e.key === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleStatusChange('done');
        return;
      }

      // Priority shortcuts: 1-4
      if (['1', '2', '3', '4'].includes(e.key) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const priorities: TicketPriority[] = ['low', 'medium', 'high', 'critical'];
        const priorityIndex = parseInt(e.key) - 1;
        if (priorityIndex >= 0 && priorityIndex < priorities.length) {
          const newPriority = priorities[priorityIndex];
          updatePriority.mutate(
            { ticketId: ticket.id, priority: newPriority },
            {
              onSuccess: () => {
                toast.success('Priorität geändert', `Priorität auf ${newPriority} gesetzt`);
              },
              onError: (error) => {
                const errorMessage = error instanceof Error ? error.message : 'Fehler beim Ändern der Priorität';
                toast.error('Fehler', errorMessage);
              },
            }
          );
        }
        return;
      }

      // Status shortcuts
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        // Cycle through statuses or show status menu
        const statuses: TicketStatus[] = ['open', 'waiting', 'in_progress', 'done'];
        const currentIndex = statuses.indexOf(ticket.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        handleStatusChange(statuses[nextIndex]);
        return;
      }

      // Quick status shortcuts
      if (e.key === 'o' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleStatusChange('open');
        return;
      }
      if (e.key === 'w' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleStatusChange('waiting');
        return;
      }
      if (e.key === 'i' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleStatusChange('in_progress');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isMobile, ticket, handleEscalate, handleStatusChange, updatePriority, toast]);

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

  if (isLoading) {
    if (isMobile) {
      return (
        <MobileTicketSheet
          isOpen={true}
          onClose={onClose}
          title="Loading..."
          snapPoints={[85]}
          defaultSnapPoint={0}
        >
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        </MobileTicketSheet>
      );
    }
    return (
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed right-0 top-0 bottom-0 w-[600px] bg-surface border-l border-white/10 z-50 flex items-center justify-center"
      >
        <LoadingSpinner />
      </motion.div>
    );
  }

  if (!ticket) {
    if (isMobile) {
      return (
        <MobileTicketSheet
          isOpen={true}
          onClose={onClose}
          title="Ticket not found"
          snapPoints={[50]}
          defaultSnapPoint={0}
        >
          <div className="text-center text-muted p-4">
            <p className="mb-4">Ticket not found</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </MobileTicketSheet>
      );
    }
    return (
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed right-0 top-0 bottom-0 w-[600px] bg-surface border-l border-white/10 z-50 flex items-center justify-center"
      >
        <div className="text-center text-muted">
          <p>Ticket not found</p>
          <Button variant="outline" size="sm" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      </motion.div>
    );
  }

  const isOverdue = ticket.slaDueAt && new Date(ticket.slaDueAt) < new Date();

  // Generate activity log from ticket data
  const activities = useMemo(() => {
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

    // Status changes (if we had history, we'd track them)
    // For now, we show current status
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

  const panelContent = (
    <>
      {/* Header - Only for desktop - Sticky */}
      {!isMobile && (
        <div className={cn(
          'sticky top-0 z-10 flex items-center justify-between p-4',
          'border-b border-white/10',
          'bg-gradient-to-r from-surface/60 via-surface/50 to-surface/40',
          'backdrop-blur-xl shadow-lg'
        )}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
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
            </div>
            <h2 className="text-lg font-semibold text-text line-clamp-2">{ticket.subject}</h2>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignment(true)}
              className="h-8 px-3"
              title="Assign ticket"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
            {ticket.status !== 'escalated' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEscalate}
                className="h-8 px-3"
                title="Escalate ticket"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('done')}
              disabled={ticket.status === 'done'}
              className="h-8 px-3"
              title="Mark as done"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close ticket" className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-muted">{ticket.id}</span>
            <Badge className={cn('text-xs', statusColors[ticket.status])}>
              {ticket.status.replace('_', ' ')}
            </Badge>
            <span className={cn('text-xs font-medium', priorityColors[ticket.priority])}>
              {ticket.priority}
            </span>
          </div>
          <h2 className="text-base font-semibold text-text">{ticket.subject}</h2>
        </div>
      )}

      {/* Quick Actions Button */}
      {!isMobile && (
        <div className="px-4 py-2 border-b border-white/10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      )}

      {/* Quick Actions Panel */}
      {showQuickActions && !isMobile && (
        <div className="px-4 py-4 border-b border-white/10">
          <QuickActionsPanel
            ticket={ticket}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onAssign={() => setShowAssignment(true)}
            onReply={handleQuickReply}
            onClose={() => setShowQuickActions(false)}
          />
        </div>
      )}

      {/* Tabs */}
      <div className={cn(
        'border-b border-white/10',
        'bg-gradient-to-r from-surface/40 via-surface/30 to-surface/40',
        'backdrop-blur-sm'
      )}>
        <div className="flex gap-1 px-4">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200',
              'relative',
              activeTab === 'details'
                ? 'border-accent text-text bg-gradient-to-t from-accent/10 to-transparent'
                : 'border-transparent text-muted hover:text-text hover:bg-surface/20'
            )}
            aria-label="Details tab"
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200',
              'relative',
              activeTab === 'messages'
                ? 'border-accent text-text bg-gradient-to-t from-accent/10 to-transparent'
                : 'border-transparent text-muted hover:text-text hover:bg-surface/20'
            )}
            aria-label="Messages tab"
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
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200',
              'relative',
              activeTab === 'activity'
                ? 'border-accent text-text bg-gradient-to-t from-accent/10 to-transparent'
                : 'border-transparent text-muted hover:text-text hover:bg-surface/20'
            )}
            aria-label="Activity tab"
          >
            <History className="h-4 w-4 inline mr-2" />
            Aktivität
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        'overflow-y-auto',
        isMobile ? 'p-4' : 'flex-1 p-4'
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
                  {/* Placeholder for customer stats - can be extended with API call */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
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
                {ticket.priority === 'critical' && (
                  <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                    <p className="text-xs text-red-400 font-medium">
                      ⚠️ Kritische Priorität - Sofortige Aufmerksamkeit erforderlich
                    </p>
                  </div>
                )}
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
                  {/* Tags Editor */}
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

              {/* Internal Notes */}
              <Card 
                variant="glassmorphic"
                className={cn(
                  'p-4',
                  'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                  'backdrop-blur-xl border border-white/10'
                )}
              >
                <TicketNotes ticketId={ticket.id} notes={[]} />
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
                <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Conversation
                  {ticket.messages && ticket.messages.length > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {ticket.messages.length}
                    </Badge>
                  )}
                </h3>
                <TicketMessageThread
                  messages={ticket.messages || []}
                  isLoading={false}
                  onMessageRead={(messageId) => {
                    logger.debug('Message read', { messageId, ticketId: ticket.id });
                  }}
                />
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
                <TicketActivityLog activities={activities} isLoading={false} />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        {/* Actions */}
        <div className={cn(
          'border-t border-white/10 space-y-3',
          'bg-gradient-to-t from-surface/60 via-surface/50 to-surface/40',
          'backdrop-blur-xl',
          isMobile ? 'sticky bottom-0 p-4 pb-safe' : 'p-4'
        )}>
          <div className={cn('flex gap-2', isMobile && 'flex-col')}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignment(true)}
              className={cn(
                'flex-1',
                'bg-gradient-to-r from-surface/50 to-surface/30',
                'border-white/20 hover:border-accent/40',
                'hover:shadow-lg hover:shadow-accent/10',
                'transition-all duration-200',
                isMobile && 'w-full'
              )}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {ticket.assignedAgent ? 'Neu zuweisen' : 'Zuweisen'}
            </Button>
            {ticket.status !== 'escalated' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEscalate}
                className={cn(
                  'flex-1',
                  'bg-gradient-to-r from-surface/50 to-surface/30',
                  'border-yellow-500/30 hover:border-yellow-500/50',
                  'hover:shadow-lg hover:shadow-yellow-500/10',
                  'transition-all duration-200',
                  isMobile && 'w-full'
                )}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Eskalieren
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('done')}
              disabled={ticket.status === 'done'}
              className={cn(
                'flex-1',
                'bg-gradient-to-r from-surface/50 to-surface/30',
                'border-green-500/30 hover:border-green-500/50',
                'hover:shadow-lg hover:shadow-green-500/10',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isMobile && 'w-full'
              )}
            >
              <Check className="h-4 w-4 mr-2" />
              Als erledigt markieren
            </Button>
          </div>

          {/* Quick Status Change */}
          <div className={cn('flex gap-2', isMobile && 'flex-col')}>
            {(['open', 'waiting', 'in_progress'] as TicketStatus[]).map(status => (
              <Button
                key={status}
                variant={ticket.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(status)}
                className={cn(
                  'flex-1',
                  ticket.status === status
                    ? 'bg-gradient-to-r from-accent to-primary shadow-lg shadow-accent/20'
                    : 'bg-gradient-to-r from-surface/50 to-surface/30 border-white/20 hover:border-accent/40',
                  'transition-all duration-200',
                  isMobile && 'w-full'
                )}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>

          {/* Reply Box */}
          <TicketReplyBox 
            ticketId={ticket.id} 
            onReplySent={() => {
              // Refetch ticket to get updated messages
              // This will be handled by react-query automatically
            }}
          />
        </div>
      </>
  );

  if (isMobile) {
    return (
      <>
        <MobileTicketSheet
          isOpen={true}
          onClose={onClose}
          title={ticket.subject}
          snapPoints={[60, 85]}
          defaultSnapPoint={0}
        >
          {panelContent}
        </MobileTicketSheet>
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
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed right-0 top-0 bottom-0 w-[700px] z-50 flex flex-col overflow-hidden',
          'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
          'backdrop-blur-xl border-l border-white/10',
          'shadow-2xl shadow-black/40'
        )}
      >
        {panelContent}
      </motion.div>

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
    </>
  );
}


