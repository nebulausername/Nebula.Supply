import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { X, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface QuickFilter {
  id: string;
  label: string;
  value: string;
  count?: number;
  icon?: React.ReactNode;
}

interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: string | null;
  onFilterChange: (filterId: string | null) => void;
  onClear?: () => void;
  className?: string;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  activeFilter,
  onFilterChange,
  onClear,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span>Quick Filters:</span>
      </div>
      
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(activeFilter === filter.value ? null : filter.value)}
          className={cn(
            'transition-all',
            activeFilter === filter.value
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'hover:bg-white/5'
          )}
        >
          {filter.icon && <span className="mr-1">{filter.icon}</span>}
          {filter.label}
          {filter.count !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                'ml-2',
                activeFilter === filter.value
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/20'
              )}
            >
              {filter.count}
            </Badge>
          )}
        </Button>
      ))}
      
      {activeFilter && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-white"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};

