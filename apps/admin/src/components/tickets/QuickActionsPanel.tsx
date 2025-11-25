import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, CheckCircle, AlertTriangle, UserPlus, Tag, Clock, Send } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ReplyTemplates } from './ReplyTemplates';
import { cn } from '../../utils/cn';
import type { Ticket, TicketStatus, TicketPriority } from '@nebula/shared/types';

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Zap;
  color: string;
  action: () => void;
  shortcut?: string;
}

interface QuickActionsPanelProps {
  ticket: Ticket;
  onStatusChange: (status: TicketStatus) => void;
  onPriorityChange: (priority: TicketPriority) => void;
  onAssign: () => void;
  onReply: (template?: string) => void;
  onClose?: () => void;
}

export const QuickActionsPanel = memo(function QuickActionsPanel({
  ticket,
  onStatusChange,
  onPriorityChange,
  onAssign,
  onReply,
  onClose,
}: QuickActionsPanelProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'reply',
      label: 'Quick Reply',
      icon: Send,
      color: 'blue',
      action: () => setShowTemplates(true),
      shortcut: 'r',
    },
    {
      id: 'assign',
      label: 'Assign',
      icon: UserPlus,
      color: 'purple',
      action: onAssign,
      shortcut: 'a',
    },
    {
      id: 'escalate',
      label: 'Escalate',
      icon: AlertTriangle,
      color: 'red',
      action: () => onStatusChange('escalated'),
      shortcut: 'e',
    },
    {
      id: 'done',
      label: 'Mark Done',
      icon: CheckCircle,
      color: 'green',
      action: () => onStatusChange('done'),
      shortcut: 'd',
    },
    {
      id: 'high-priority',
      label: 'High Priority',
      icon: Zap,
      color: 'orange',
      action: () => onPriorityChange('high'),
    },
    {
      id: 'critical',
      label: 'Critical',
      icon: AlertTriangle,
      color: 'red',
      action: () => onPriorityChange('critical'),
    },
  ];

  const statusQuickActions: QuickAction[] = [
    {
      id: 'open',
      label: 'Open',
      icon: CheckCircle,
      color: 'green',
      action: () => onStatusChange('open'),
      shortcut: 'o',
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      icon: Clock,
      color: 'blue',
      action: () => onStatusChange('in_progress'),
      shortcut: 'i',
    },
    {
      id: 'waiting',
      label: 'Waiting',
      icon: Clock,
      color: 'yellow',
      action: () => onStatusChange('waiting'),
      shortcut: 'w',
    },
  ];

  const handleTemplateSelect = (template: any) => {
    onReply(template.content);
    setShowTemplates(false);
  };

  return (
    <>
      <Card
        variant="glassmorphic"
        className={cn(
          'p-4',
          'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
          'backdrop-blur-xl border border-white/10'
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-semibold text-text">Quick Actions</h3>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={action.action}
                  className={cn(
                    'w-full h-auto py-3 flex flex-col items-center gap-2',
                    'bg-surface/30 hover:bg-surface/50',
                    'border-white/10 hover:border-accent/30',
                    'transition-all duration-200'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5',
                    action.color === 'blue' && 'text-blue-400',
                    action.color === 'purple' && 'text-purple-400',
                    action.color === 'red' && 'text-red-400',
                    action.color === 'green' && 'text-green-400',
                    action.color === 'orange' && 'text-orange-400',
                  )} />
                  <span className="text-xs font-medium">{action.label}</span>
                  {action.shortcut && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {action.shortcut}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Status Quick Actions */}
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Status</h4>
          <div className="grid grid-cols-3 gap-2">
            {statusQuickActions.map((action) => {
              const Icon = action.icon;
              const isActive = ticket.status === action.id.replace('-', '_');
              return (
                <motion.div
                  key={action.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    onClick={action.action}
                    className={cn(
                      'w-full h-auto py-2 flex flex-col items-center gap-1',
                      'text-xs',
                      !isActive && 'bg-surface/30 hover:bg-surface/50',
                      'border-white/10 hover:border-accent/30',
                      'transition-all duration-200'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <ReplyTemplates
                onSelect={handleTemplateSelect}
                onClose={() => setShowTemplates(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});


