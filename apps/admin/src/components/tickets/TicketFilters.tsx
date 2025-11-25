import { useState, useEffect, memo } from 'react';
import { X, Search, Calendar, Hash, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { TicketFilterPresets } from './TicketFilterPresets';
import { AdvancedFilters } from './AdvancedFilters';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/cn';
import type { TicketFilters as TicketFiltersType } from './types';
import type { TicketStatus, TicketPriority, TicketCategory } from '@nebula/shared/types';

interface TicketFiltersProps {
  filters: TicketFiltersType;
  onFiltersChange: (filters: TicketFiltersType) => void;
}

const statusOptions: TicketStatus[] = ['open', 'waiting', 'in_progress', 'escalated', 'done'];
const priorityOptions: TicketPriority[] = ['low', 'medium', 'high', 'critical'];
const categoryOptions: TicketCategory[] = ['order', 'product', 'shipping', 'payment', 'account', 'other', 'support', 'bug', 'feature', 'billing', 'technical'];

export const TicketFilters = memo(function TicketFilters({ filters, onFiltersChange }: TicketFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch || undefined });
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleStatusToggle = (status: TicketStatus) => {
    const current = filters.status || [];
    const newStatus = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, status: newStatus.length > 0 ? newStatus : undefined });
  };

  const handlePriorityToggle = (priority: TicketPriority) => {
    const current = filters.priority || [];
    const newPriority = current.includes(priority)
      ? current.filter(p => p !== priority)
      : [...current, priority];
    onFiltersChange({ ...filters, priority: newPriority.length > 0 ? newPriority : undefined });
  };

  const handleCategoryToggle = (category: TicketCategory) => {
    const current = filters.category || [];
    const newCategory = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    onFiltersChange({ ...filters, category: newCategory.length > 0 ? newCategory : undefined });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onFiltersChange({});
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status?.length ||
    filters.priority?.length ||
    filters.category?.length ||
    filters.assignedAgent?.length ||
    filters.tags?.length ||
    filters.slaOverdue
  );

  return (
    <div className="space-y-6">
      {/* Search - Full-Text */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Volltext-Suche</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            type="text"
            placeholder="Suche in ID, Betreff, Inhalt, Tags..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={cn(
              'pl-9',
              'bg-surface/50 border-white/10',
              'focus:border-accent/50 focus:ring-2 focus:ring-accent/20'
            )}
          />
        </div>
        <p className="text-xs text-muted mt-1">
          Durchsucht Ticket-ID, Betreff, Zusammenfassung, Nachrichten und Tags
        </p>
      </div>

      {/* Filter Presets */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Gespeicherte Filter</label>
        <TicketFilterPresets
          filters={filters}
          onPresetSelect={onFiltersChange}
          onPresetSave={(name, savedFilters) => {
            // Preset saved - could show toast notification
            // Preset saved successfully
          }}
        />
      </div>

      {/* Status */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Status</label>
        <div className="space-y-2">
          {statusOptions.map(status => (
            <Button
              key={status}
              variant={filters.status?.includes(status) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusToggle(status)}
              className={cn(
                'w-full justify-start',
                'transition-all duration-200',
                filters.status?.includes(status)
                  ? 'bg-accent/20 border-accent/30 text-accent'
                  : 'hover:bg-surface/50'
              )}
            >
              {status.replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Priorität</label>
        <div className="space-y-2">
          {priorityOptions.map(priority => (
            <Button
              key={priority}
              variant={filters.priority?.includes(priority) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePriorityToggle(priority)}
              className={cn(
                'w-full justify-start',
                'transition-all duration-200',
                filters.priority?.includes(priority)
                  ? 'bg-accent/20 border-accent/30 text-accent'
                  : 'hover:bg-surface/50'
              )}
            >
              {priority}
            </Button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">Kategorie</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categoryOptions.map(category => (
            <Button
              key={category}
              variant={filters.category?.includes(category) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryToggle(category)}
              className={cn(
                'w-full justify-start capitalize',
                'transition-all duration-200',
                filters.category?.includes(category)
                  ? 'bg-accent/20 border-accent/30 text-accent'
                  : 'hover:bg-surface/50'
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Tags
        </label>
        <Input
          type="text"
          placeholder="Tags filtern (kommagetrennt)..."
          value={filters.tags?.join(', ') || ''}
          onChange={(e) => {
            const tagValues = e.target.value
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t.length > 0);
            onFiltersChange({
              ...filters,
              tags: tagValues.length > 0 ? tagValues : undefined,
            });
          }}
          className={cn(
            'bg-surface/50 border-white/10',
            'focus:border-accent/50 focus:ring-2 focus:ring-accent/20'
          )}
        />
      </div>

      {/* SLA Overdue */}
      <div>
        <label className="text-sm font-medium text-text mb-2 block">SLA</label>
        <Button
          variant={filters.slaOverdue ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFiltersChange({ ...filters, slaOverdue: !filters.slaOverdue })}
          className={cn(
            'w-full justify-start',
            'transition-all duration-200',
            filters.slaOverdue
              ? 'bg-red-500/20 border-red-500/30 text-red-400'
              : 'hover:bg-surface/50'
          )}
        >
          Nur überfällige Tickets
        </Button>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className={cn(
              'w-full',
              'bg-surface/30 border-white/10',
              'hover:bg-surface/50 hover:border-white/20'
            )}
          >
            <X className="h-4 w-4 mr-2" />
            Alle Filter zurücksetzen
          </Button>
        )}

      {/* Advanced Filters Toggle */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </div>
          {showAdvanced ? <X className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="mt-4">
          <AdvancedFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>
      )}
    </div>
  );
});


