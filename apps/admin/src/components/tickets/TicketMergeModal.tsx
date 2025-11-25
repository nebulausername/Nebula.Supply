import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Merge, AlertTriangle, CheckCircle, ArrowRight, FileText, MessageSquare, Tag, User } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useTicket, useTicketMerge } from '../../lib/api/hooks';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';
import type { Ticket } from '@nebula/shared/types';

interface TicketMergeModalProps {
  sourceTicketIds: string[];
  onClose: () => void;
  onSuccess?: () => void;
}

interface MergeConflict {
  field: string;
  sourceValue: any;
  targetValue: any;
  resolution?: 'source' | 'target' | 'merge';
}

export const TicketMergeModal = memo(function TicketMergeModal({
  sourceTicketIds,
  onClose,
  onSuccess,
}: TicketMergeModalProps) {
  const [targetTicketId, setTargetTicketId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [conflicts, setConflicts] = useState<MergeConflict[]>([]);
  const [mergeOptions, setMergeOptions] = useState({
    keepSourceMessages: true,
    keepSourceTags: true,
    mergeNotes: true,
  });
  
  const { data: sourceTicketsData } = useTicket(sourceTicketIds[0]);
  const { data: targetTicketData } = useTicket(targetTicketId);
  const mergeMutation = useTicketMerge();
  const toast = useToast();

  const sourceTicket = sourceTicketsData?.data;
  const targetTicket = targetTicketData?.data;

  // Detect conflicts when target ticket is selected
  useEffect(() => {
    if (sourceTicket && targetTicket) {
      const detectedConflicts: MergeConflict[] = [];

      // Check for conflicts
      if (sourceTicket.status !== targetTicket.status) {
        detectedConflicts.push({
          field: 'status',
          sourceValue: sourceTicket.status,
          targetValue: targetTicket.status,
          resolution: 'target',
        });
      }

      if (sourceTicket.priority !== targetTicket.priority) {
        detectedConflicts.push({
          field: 'priority',
          sourceValue: sourceTicket.priority,
          targetValue: targetTicket.priority,
          resolution: 'target',
        });
      }

      if (sourceTicket.assignedAgent !== targetTicket.assignedAgent) {
        detectedConflicts.push({
          field: 'assignedAgent',
          sourceValue: sourceTicket.assignedAgent,
          targetValue: targetTicket.assignedAgent,
          resolution: 'target',
        });
      }

      setConflicts(detectedConflicts);
    }
  }, [sourceTicket, targetTicket]);

  const handleMerge = async () => {
    if (!targetTicketId) {
      toast.error('Fehler', 'Bitte wähle ein Ziel-Ticket aus');
      return;
    }

    try {
      await mergeMutation.mutateAsync({
        sourceTicketIds,
        targetTicketId,
        options: mergeOptions,
      });

      toast.success(
        'Tickets zusammengeführt',
        `${sourceTicketIds.length} Ticket(s) wurden erfolgreich zusammengeführt`
      );
      logger.logUserAction('tickets_merged', {
        sourceTicketIds,
        targetTicketId,
        options: mergeOptions,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Zusammenführen';
      logger.error('Failed to merge tickets', error);
      toast.error('Zusammenführung fehlgeschlagen', errorMessage);
    }
  };

  const resolveConflict = (field: string, resolution: 'source' | 'target' | 'merge') => {
    setConflicts(conflicts.map((c) =>
      c.field === field ? { ...c, resolution } : c
    ));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
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
          className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          <Card
            variant="glassmorphic"
            className={cn(
              'p-6',
              'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
              'backdrop-blur-xl border border-white/10',
              'shadow-2xl'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                  <Merge className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Tickets zusammenführen</h2>
                  <p className="text-sm text-muted">
                    {sourceTicketIds.length} Ticket(s) in ein Ziel-Ticket zusammenführen
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Source Tickets */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-3">Quell-Tickets</h3>
                <div className="space-y-2">
                  {sourceTicketIds.map((id) => (
                    <div
                      key={id}
                      className={cn(
                        'p-3 rounded-lg',
                        'bg-surface/30 border border-white/10',
                        'flex items-center gap-2'
                      )}
                    >
                      <FileText className="h-4 w-4 text-muted" />
                      <span className="text-sm font-mono text-text">{id}</span>
                      {id === sourceTicketIds[0] && sourceTicket && (
                        <span className="text-xs text-muted ml-auto">
                          {sourceTicket.subject}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Ticket Selection */}
              <div>
                <label className="text-sm font-semibold text-text mb-2 block">
                  Ziel-Ticket ID
                </label>
                <Input
                  type="text"
                  placeholder="Ticket-ID eingeben..."
                  value={targetTicketId}
                  onChange={(e) => setTargetTicketId(e.target.value)}
                  className={cn(
                    'bg-surface/50 border-white/10',
                    'focus:border-accent/50 focus:ring-2 focus:ring-accent/20'
                  )}
                />
                {targetTicket && (
                  <div className="mt-2 p-3 rounded-lg bg-surface/30 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted" />
                      <span className="text-sm font-semibold text-text">{targetTicket.subject}</span>
                    </div>
                    <div className="text-xs text-muted">
                      Status: {targetTicket.status} | Priorität: {targetTicket.priority}
                    </div>
                  </div>
                )}
              </div>

              {/* Conflicts */}
              {conflicts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    Konflikte
                  </h3>
                  <div className="space-y-2">
                    {conflicts.map((conflict) => (
                      <Card
                        key={conflict.field}
                        variant="glassmorphic"
                        className={cn(
                          'p-3',
                          'bg-yellow-500/10 border-yellow-500/30'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-text capitalize">
                            {conflict.field}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant={conflict.resolution === 'source' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => resolveConflict(conflict.field, 'source')}
                              className="h-7 text-xs"
                            >
                              Quelle
                            </Button>
                            <Button
                              variant={conflict.resolution === 'target' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => resolveConflict(conflict.field, 'target')}
                              className="h-7 text-xs"
                            >
                              Ziel
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="bg-red-500/10 border-red-500/30">
                            {conflict.sourceValue}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted" />
                          <Badge variant="outline" className="bg-green-500/10 border-green-500/30">
                            {conflict.targetValue}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Merge Options */}
              <div>
                <h3 className="text-sm font-semibold text-text mb-3">Zusammenführungs-Optionen</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mergeOptions.keepSourceMessages}
                      onChange={(e) =>
                        setMergeOptions({ ...mergeOptions, keepSourceMessages: e.target.checked })
                      }
                      className="rounded border-white/20"
                    />
                    <MessageSquare className="h-4 w-4 text-muted" />
                    <span className="text-text">Nachrichten aus Quell-Tickets übernehmen</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mergeOptions.keepSourceTags}
                      onChange={(e) =>
                        setMergeOptions({ ...mergeOptions, keepSourceTags: e.target.checked })
                      }
                      className="rounded border-white/20"
                    />
                    <Tag className="h-4 w-4 text-muted" />
                    <span className="text-text">Tags aus Quell-Tickets übernehmen</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mergeOptions.mergeNotes}
                      onChange={(e) =>
                        setMergeOptions({ ...mergeOptions, mergeNotes: e.target.checked })
                      }
                      className="rounded border-white/20"
                    />
                    <FileText className="h-4 w-4 text-muted" />
                    <span className="text-text">Notizen zusammenführen</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={onClose}
                className={cn(
                  'flex-1',
                  'bg-surface/30 border-white/10',
                  'hover:bg-surface/50 hover:border-white/20'
                )}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleMerge}
                disabled={!targetTicketId || mergeMutation.isPending}
                className={cn(
                  'flex-1',
                  'bg-gradient-to-r from-accent to-primary',
                  'hover:from-accent/90 hover:to-primary/90',
                  'shadow-lg shadow-accent/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {mergeMutation.isPending ? (
                  <>
                    <Merge className="h-4 w-4 mr-2 animate-spin" />
                    Zusammenführen...
                  </>
                ) : (
                  <>
                    <Merge className="h-4 w-4 mr-2" />
                    Zusammenführen
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

