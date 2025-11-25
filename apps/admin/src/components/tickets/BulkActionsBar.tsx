import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, UserPlus, Tag, AlertTriangle, Forward, Merge, Split, Clock, Eye, Download, MoreVertical, ChevronDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Input } from '../ui/Input';
import { TicketAssignmentModal } from './TicketAssignmentModal';
import { TicketMergeModal } from './TicketMergeModal';
import { useBulkTicketUpdate } from '../../lib/api/hooks';
import { useMobile } from '../../hooks/useMobile';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';
import type { TicketStatus, TicketPriority } from '@nebula/shared/types';

interface BulkActionsBarProps {
  selectedCount: number;
  ticketIds: string[];
  onClear: () => void;
}

export function BulkActionsBar({ selectedCount, ticketIds, onClear }: BulkActionsBarProps) {
  const { isMobile } = useMobile();
  const toast = useToast();
  const [showAssignment, setShowAssignment] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | ''>('');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | ''>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const bulkUpdate = useBulkTicketUpdate();

  const handleBulkStatusChange = async () => {
    if (!selectedStatus) return;
    try {
      await bulkUpdate.mutateAsync({
        ticketIds,
        updates: { status: selectedStatus },
      });
      logger.logUserAction('bulk_status_change', { count: ticketIds.length, status: selectedStatus });
      toast.success(
        'Status updated',
        `${ticketIds.length} ticket(s) status changed to ${selectedStatus.replace('_', ' ')}`
      );
      setSelectedStatus('');
      onClear();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      logger.error('Failed to bulk update status', error);
      toast.error('Failed to update status', errorMessage);
    }
  };

  const handleBulkPriorityChange = async () => {
    if (!selectedPriority) return;
    try {
      await bulkUpdate.mutateAsync({
        ticketIds,
        updates: { priority: selectedPriority },
      });
      logger.logUserAction('bulk_priority_change', { count: ticketIds.length, priority: selectedPriority });
      toast.success(
        'Priority updated',
        `${ticketIds.length} ticket(s) priority changed to ${selectedPriority}`
      );
      setSelectedPriority('');
      onClear();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update priority';
      logger.error('Failed to bulk update priority', error);
      toast.error('Failed to update priority', errorMessage);
    }
  };

  const handleBulkEscalate = async () => {
    try {
      await bulkUpdate.mutateAsync({
        ticketIds,
        updates: { status: 'escalated' },
      });
      logger.logUserAction('bulk_escalate', { count: ticketIds.length });
      toast.success('Tickets escalated', `${ticketIds.length} ticket(s) have been escalated`);
      onClear();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to escalate tickets';
      logger.error('Failed to bulk escalate', error);
      toast.error('Failed to escalate', errorMessage);
    }
  };

  const handleBulkForward = () => {
    logger.info('Bulk forward tickets', { count: ticketIds.length });
    // TODO: Implement bulk forward
  };

  const handleBulkMerge = () => {
    if (ticketIds.length < 2) {
      toast.warning('Zu wenige Tickets', 'Mindestens 2 Tickets müssen ausgewählt sein');
      return;
    }
    setShowMergeModal(true);
  };

  const handleBulkAddTags = async () => {
    if (selectedTags.length === 0) {
      toast.warning('No tags selected', 'Please select at least one tag');
      return;
    }
    try {
      await bulkUpdate.mutateAsync({
        ticketIds,
        updates: { tags: selectedTags },
      });
      logger.logUserAction('bulk_tag_add', { count: ticketIds.length, tags: selectedTags });
      toast.success('Tags added', `${selectedTags.length} tag(s) added to ${ticketIds.length} ticket(s)`);
      setSelectedTags([]);
      setTagInput('');
      setShowTagManager(false);
      onClear();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add tags';
      logger.error('Failed to bulk add tags', error);
      toast.error('Failed to add tags', errorMessage);
    }
  };

  const handleBulkExport = () => {
    // Export selected tickets to CSV/JSON
    logger.info('Bulk export tickets', { count: ticketIds.length });
    toast.info('Export started', `Exporting ${ticketIds.length} ticket(s)...`);
    // TODO: Implement actual export
  };

  const handleBulkSetDueDate = () => {
    logger.info('Bulk set due date', { count: ticketIds.length });
    // TODO: Implement bulk due date
  };

  return (
    <>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
      >
        <Card className="p-4 bg-primary/10 border-primary/20">
          <div className={cn(
            'flex items-center justify-between',
            isMobile && 'flex-col gap-3'
          )}>
            <div className={cn(
              'flex items-center gap-4',
              isMobile && 'w-full justify-between'
            )}>
              <span className="text-sm font-medium text-text">
                {selectedCount} {selectedCount === 1 ? 'ticket' : 'tickets'} selected
              </span>

              {/* Status Change */}
              <div className="flex items-center gap-2">
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as TicketStatus)}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                {selectedStatus && (
                  <Button size="sm" onClick={handleBulkStatusChange} disabled={bulkUpdate.isPending}>
                    <Check className="h-3 w-3 mr-1" />
                    Apply
                  </Button>
                )}
              </div>

              {/* Priority Change */}
              <div className="flex items-center gap-2">
                <Select value={selectedPriority} onValueChange={(v) => setSelectedPriority(v as TicketPriority)}>
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue placeholder="Change priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                {selectedPriority && (
                  <Button size="sm" onClick={handleBulkPriorityChange} disabled={bulkUpdate.isPending}>
                    <Check className="h-3 w-3 mr-1" />
                    Apply
                  </Button>
                )}
              </div>

              {/* Quick Actions */}
              <div className={cn(
                'flex items-center gap-2',
                isMobile && 'flex-wrap'
              )}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignment(true)}
                  className={cn(isMobile && 'flex-1')}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEscalate}
                  disabled={bulkUpdate.isPending}
                  className={cn(isMobile && 'flex-1')}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Escalate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className={cn(isMobile && 'flex-1')}
                >
                  More
                </Button>
              </div>
            </div>

            <div className={cn(
              'flex items-center gap-2',
              isMobile && 'w-full justify-end'
            )}>
              <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear selection">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* More Actions Dropdown */}
          {showMoreActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className={cn(
                'grid gap-2',
                isMobile ? 'grid-cols-2' : 'grid-cols-4'
              )}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkForward}
                  className="justify-start"
                >
                  <Forward className="h-3 w-3 mr-2" />
                  Forward
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkMerge}
                  className="justify-start"
                >
                  <Merge className="h-3 w-3 mr-2" />
                  Merge
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTagManager(!showTagManager)}
                  className="justify-start"
                >
                  <Tag className="h-3 w-3 mr-2" />
                  Add Tags
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkSetDueDate}
                  className="justify-start"
                >
                  <Clock className="h-3 w-3 mr-2" />
                  Set Due Date
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  className="justify-start"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Export
                </Button>
              </div>
              
              {/* Tag Manager */}
              <AnimatePresence>
                {showTagManager && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/10"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="Enter tag and press Enter"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                              if (!selectedTags.includes(tagInput.trim())) {
                                setSelectedTags([...selectedTags, tagInput.trim()]);
                              }
                              setTagInput('');
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={handleBulkAddTags}
                          disabled={selectedTags.length === 0 || bulkUpdate.isPending}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Apply Tags
                        </Button>
                      </div>
                      {selectedTags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {tag}
                              <button
                                onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                                className="ml-1 hover:text-red-400"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Assignment Modal */}
      {showAssignment && (
        <TicketAssignmentModal
          ticketId={ticketIds[0]} // Use first ticket ID for modal
          onClose={() => setShowAssignment(false)}
          onAssign={(agentId, agentName) => {
            // Handle bulk assignment
            setShowAssignment(false);
            onClear();
          }}
          isBulk={true}
          ticketIds={ticketIds}
        />
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <TicketMergeModal
          sourceTicketIds={ticketIds}
          onClose={() => setShowMergeModal(false)}
          onSuccess={() => {
            setShowMergeModal(false);
            onClear();
          }}
        />
      )}
    </>
  );
}


