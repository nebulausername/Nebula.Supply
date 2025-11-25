import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, User, Check, TrendingUp, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useUsers, useTicketAssign } from '../../lib/api/hooks';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';

interface TicketAssignmentModalProps {
  ticketId: string;
  currentAgent?: string;
  onClose: () => void;
  onAssign: (agentId: string, agentName: string) => void;
  isBulk?: boolean;
  ticketIds?: string[];
}

// Mock agents for now - in production, fetch from API
const mockAgents = [
  { id: '1', name: 'Lea', email: 'lea@nebula.supply', status: 'online' as const, activeTickets: 5 },
  { id: '2', name: 'Marco', email: 'marco@nebula.supply', status: 'online' as const, activeTickets: 3 },
  { id: '3', name: 'Ops-Team', email: 'ops@nebula.supply', status: 'away' as const, activeTickets: 12 },
  { id: '4', name: 'Support Team', email: 'support@nebula.supply', status: 'offline' as const, activeTickets: 0 },
];

export function TicketAssignmentModal({
  ticketId,
  currentAgent,
  onClose,
  onAssign,
  isBulk = false,
  ticketIds = [],
}: TicketAssignmentModalProps) {
  const [search, setSearch] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { data: usersResponse, isLoading } = useUsers({ role: 'agent' });
  const assignMutation = useTicketAssign();
  const toast = useToast();

  // Use mock agents for now since API might not have agents endpoint
  // In production, map usersResponse to agents format
  const agents = mockAgents;

  // Sort agents by workload (ascending) for auto-assignment suggestion
  const sortedAgents = [...agents].sort((a, b) => a.activeTickets - b.activeTickets);

  const filteredAgents = sortedAgents.filter(agent =>
    agent.name.toLowerCase().includes(search.toLowerCase()) ||
    agent.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedAgentId) return;
    const agent = agents.find(a => a.id === selectedAgentId);
    if (!agent) return;

    try {
      if (isBulk && ticketIds.length > 0) {
        // Bulk assignment - assign to all tickets
        const assignments = ticketIds.map(id => 
          assignMutation.mutateAsync({ ticketId: id, agentId: agent.id })
        );
        await Promise.all(assignments);
        toast.success(
          'Tickets zugewiesen',
          `${ticketIds.length} Ticket(s) wurden ${agent.name} zugewiesen`
        );
      } else {
        // Single assignment
        await assignMutation.mutateAsync({ ticketId, agentId: agent.id });
        toast.success(
          'Ticket zugewiesen',
          `Ticket wurde ${agent.name} zugewiesen`
        );
      }
      
      logger.logUserAction('ticket_assigned', { 
        ticketId: isBulk ? ticketIds : ticketId, 
        agentId: agent.id,
        agentName: agent.name 
      });
      
      onAssign(agent.id, agent.name);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Zuweisen';
      logger.error('Failed to assign ticket', error);
      toast.error('Zuweisung fehlgeschlagen', errorMessage);
    }
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-500',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 w-full max-w-md"
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-text">
                  {isBulk ? `${ticketIds.length} Tickets zuweisen` : 'Ticket zuweisen'}
                </h2>
                <p className="text-sm text-muted mt-1">
                  {isBulk 
                    ? 'Wähle einen Agenten aus, um alle ausgewählten Tickets zuzuweisen' 
                    : `Ticket ${ticketId} einem Agenten zuweisen`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                type="text"
                placeholder="Agenten suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(
                  'pl-9',
                  'bg-surface/50 border-white/10',
                  'focus:border-accent/50 focus:ring-2 focus:ring-accent/20'
                )}
              />
            </div>

            {/* Agents List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : filteredAgents.length === 0 ? (
                <div className="text-center text-muted py-8 text-sm">
                  Keine Agenten gefunden
                </div>
              ) : (
                filteredAgents.map((agent, index) => {
                  const isSelected = selectedAgentId === agent.id;
                  const isCurrent = currentAgent === agent.name;

                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                        'bg-gradient-to-r from-surface/40 to-surface/20',
                        'backdrop-blur-sm',
                        isSelected
                          ? 'border-accent bg-gradient-to-r from-accent/20 to-primary/10 shadow-lg shadow-accent/10'
                          : 'border-white/10 hover:border-accent/30 hover:bg-surface/50',
                        isCurrent && 'border-blue-500/50 bg-blue-500/5'
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          'h-12 w-12 rounded-full flex items-center justify-center',
                          'bg-gradient-to-br from-primary/20 to-accent/20',
                          'border-2 border-white/10',
                          'shadow-md'
                        )}>
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div
                          className={cn(
                            'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-surface',
                            'shadow-sm',
                            statusColors[agent.status]
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-text">{agent.name}</span>
                          {isCurrent && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30">
                              Aktuell
                            </Badge>
                          )}
                          {index === 0 && !search && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Empfohlen
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted truncate">{agent.email}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <Clock className="h-3 w-3" />
                            <span>{agent.activeTickets} aktive Tickets</span>
                          </div>
                          {agent.activeTickets < 5 && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
                              Niedrige Auslastung
                            </Badge>
                          )}
                          {agent.activeTickets >= 10 && (
                            <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-400">
                              Hohe Auslastung
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6">
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
                onClick={handleAssign}
                disabled={!selectedAgentId || assignMutation.isPending}
                className={cn(
                  'flex-1',
                  'bg-gradient-to-r from-accent to-primary',
                  'hover:from-accent/90 hover:to-primary/90',
                  'shadow-lg shadow-accent/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {assignMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Zuweisen...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Zuweisen
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


