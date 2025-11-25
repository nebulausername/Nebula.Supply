import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, X, Filter, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import type { TicketFilters } from './types';

interface AdvancedFiltersProps {
  filters: TicketFilters;
  onFiltersChange: (filters: TicketFilters) => void;
  onClose?: () => void;
}

export const AdvancedFilters = memo(function AdvancedFilters({
  filters,
  onFiltersChange,
  onClose,
}: AdvancedFiltersProps) {
  const [dateFrom, setDateFrom] = useState(
    filters.dateRange?.from ? filters.dateRange.from.toISOString().split('T')[0] : ''
  );
  const [dateTo, setDateTo] = useState(
    filters.dateRange?.to ? filters.dateRange.to.toISOString().split('T')[0] : ''
  );

  const handleDateRangeChange = () => {
    if (dateFrom && dateTo) {
      onFiltersChange({
        ...filters,
        dateRange: {
          from: new Date(dateFrom),
          to: new Date(dateTo),
        },
      });
    } else if (!dateFrom && !dateTo) {
      const newFilters = { ...filters };
      delete newFilters.dateRange;
      onFiltersChange(newFilters);
    }
  };

  const handleQuickDateRange = (range: 'today' | 'week' | 'month' | 'custom') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (range) {
      case 'today':
        setDateFrom(today.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        onFiltersChange({
          ...filters,
          dateRange: {
            from: today,
            to: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        });
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        setDateFrom(weekAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        onFiltersChange({
          ...filters,
          dateRange: {
            from: weekAgo,
            to: today,
          },
        });
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        setDateFrom(monthAgo.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
        onFiltersChange({
          ...filters,
          dateRange: {
            from: monthAgo,
            to: today,
          },
        });
        break;
      case 'custom':
        // Already handled by date inputs
        break;
    }
  };

  const clearDateRange = () => {
    setDateFrom('');
    setDateTo('');
    const newFilters = { ...filters };
    delete newFilters.dateRange;
    onFiltersChange(newFilters);
  };

  return (
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
          <Filter className="h-5 w-5 text-accent" />
          <h3 className="text-lg font-semibold text-text">Advanced Filters</h3>
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

      {/* Date Range */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text mb-2 block flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </label>
          
          {/* Quick Date Buttons */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateRange('today')}
              className="h-7 text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateRange('week')}
              className="h-7 text-xs"
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickDateRange('month')}
              className="h-7 text-xs"
            >
              Last 30 Days
            </Button>
            {filters.dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateRange}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted mb-1 block">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  if (e.target.value && dateTo) {
                    setTimeout(() => handleDateRangeChange(), 100);
                  }
                }}
                className="bg-surface/50 border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  if (dateFrom && e.target.value) {
                    setTimeout(() => handleDateRangeChange(), 100);
                  }
                }}
                className="bg-surface/50 border-white/10"
              />
            </div>
          </div>

          {filters.dateRange && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {new Date(filters.dateRange.from).toLocaleDateString('de-DE')} - {new Date(filters.dateRange.to).toLocaleDateString('de-DE')}
              </Badge>
            </div>
          )}
        </div>

        {/* SLA Overdue Filter */}
        <div>
          <label className="text-sm font-medium text-text mb-2 block flex items-center gap-2">
            <Clock className="h-4 w-4" />
            SLA Status
          </label>
          <Button
            variant={filters.slaOverdue ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              onFiltersChange({
                ...filters,
                slaOverdue: filters.slaOverdue ? undefined : true,
              });
            }}
            className="w-full justify-start"
          >
            Show Only Overdue Tickets
          </Button>
        </div>
      </div>
    </Card>
  );
});


