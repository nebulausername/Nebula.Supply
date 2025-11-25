import { X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { TicketFilters as TicketFiltersType } from './types';
import { cn } from '../../utils/cn';

interface FilterChipsProps {
  filters: TicketFiltersType;
  onRemoveFilter: (filterType: keyof TicketFiltersType, value?: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) {
  const activeFilters: Array<{ type: keyof TicketFiltersType; label: string; value?: string }> = [];

  if (filters.search) {
    activeFilters.push({ type: 'search', label: `Search: ${filters.search}` });
  }

  if (filters.status && filters.status.length > 0) {
    filters.status.forEach(status => {
      activeFilters.push({ type: 'status', label: status.replace('_', ' '), value: status });
    });
  }

  if (filters.priority && filters.priority.length > 0) {
    filters.priority.forEach(priority => {
      activeFilters.push({ type: 'priority', label: priority, value: priority });
    });
  }

  if (filters.category && filters.category.length > 0) {
    filters.category.forEach(category => {
      activeFilters.push({ type: 'category', label: category, value: category });
    });
  }

  if (filters.assignedAgent && filters.assignedAgent.length > 0) {
    filters.assignedAgent.forEach(agent => {
      activeFilters.push({ type: 'assignedAgent', label: `Agent: ${agent}`, value: agent });
    });
  }

  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach(tag => {
      activeFilters.push({ type: 'tags', label: tag, value: tag });
    });
  }

  if (filters.slaOverdue) {
    activeFilters.push({ type: 'slaOverdue', label: 'SLA Overdue' });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.type}-${filter.value || index}`}
          variant="outline"
          className="text-xs flex items-center gap-1 pr-1"
        >
          <span>{filter.label}</span>
          <button
            onClick={() => onRemoveFilter(filter.type, filter.value)}
            className="ml-1 hover:bg-white/10 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

