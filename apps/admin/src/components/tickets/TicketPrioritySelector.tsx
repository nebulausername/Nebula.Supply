import { memo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import type { TicketPriority } from '@nebula/shared/types';

interface TicketPrioritySelectorProps {
  currentPriority: TicketPriority;
  onPriorityChange: (priority: TicketPriority) => void;
  disabled?: boolean;
  variant?: 'dropdown' | 'buttons';
}

const priorityConfig: Record<TicketPriority, {
  label: string;
  icon: typeof AlertCircle;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  low: {
    label: 'Niedrig',
    icon: AlertCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
  },
  medium: {
    label: 'Mittel',
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  high: {
    label: 'Hoch',
    icon: TrendingUp,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  critical: {
    label: 'Kritisch',
    icon: Zap,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
};

export const TicketPrioritySelector = memo(function TicketPrioritySelector({
  currentPriority,
  onPriorityChange,
  disabled = false,
  variant = 'buttons',
}: TicketPrioritySelectorProps) {
  const priorities: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <select
          value={currentPriority}
          onChange={(e) => onPriorityChange(e.target.value as TicketPriority)}
          disabled={disabled}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium',
            'bg-surface/50 border border-white/10',
            'focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
            'transition-all duration-200',
            priorityConfig[currentPriority].color,
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {priorities.map((priority) => {
            const config = priorityConfig[priority];
            return (
              <option key={priority} value={priority}>
                {config.label}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {priorities.map((priority) => {
        const config = priorityConfig[priority];
        const Icon = config.icon;
        const isActive = currentPriority === priority;

        return (
          <motion.button
            key={priority}
            onClick={() => !disabled && onPriorityChange(priority)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold',
              'border transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isActive
                ? `${config.bgColor} ${config.borderColor} ${config.color} shadow-lg shadow-current/20`
                : 'bg-surface/30 border-white/10 text-muted hover:bg-surface/50 hover:border-white/20',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            whileHover={!disabled ? { scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            title={`Priorität: ${config.label} (${priority})`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{config.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
});

