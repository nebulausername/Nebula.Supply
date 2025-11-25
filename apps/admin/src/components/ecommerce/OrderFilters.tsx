import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/Dialog';
import {
  Search,
  Filter,
  X,
  Calendar,
  Euro,
  User,
  Package,
  Save,
  Trash2
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface OrderFilters {
  status?: string[];
  paymentStatus?: string[];
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  hasTracking?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: OrderFilters;
  createdAt: string;
}

interface OrderFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onClearFilters: () => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, filters: OrderFilters) => void;
  onDeleteFilter?: (filterId: string) => void;
  className?: string;
  searchInputRef?: React.RefObject<HTMLInputElement>;
  isAdvancedOpen?: boolean;
  onAdvancedOpenChange?: (open: boolean) => void;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'processing', label: 'Processing', color: 'blue' },
  { value: 'shipped', label: 'Shipped', color: 'purple' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'orange' }
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'orange' }
];

const sortOptions = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'totalAmount', label: 'Total Amount' },
  { value: 'status', label: 'Status' }
];

const dateRangePresets = [
  { 
    id: 'today', 
    label: 'Today', 
    getDates: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { from: today.toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] };
    }
  },
  { 
    id: 'yesterday', 
    label: 'Yesterday', 
    getDates: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      return { from: yesterday.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
    }
  },
  { 
    id: 'last7days', 
    label: 'Last 7 Days', 
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
    }
  },
  { 
    id: 'last30days', 
    label: 'Last 30 Days', 
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
    }
  },
  { 
    id: 'thisMonth', 
    label: 'This Month', 
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
    }
  },
  { 
    id: 'lastMonth', 
    label: 'Last Month', 
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
    }
  },
  { 
    id: 'thisYear', 
    label: 'This Year', 
    getDates: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] };
    }
  },
];

export function OrderFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  savedFilters = [],
  onSaveFilter,
  onDeleteFilter,
  className,
  searchInputRef,
  isAdvancedOpen: controlledIsAdvancedOpen,
  onAdvancedOpenChange
}: OrderFiltersProps) {
  const [internalIsAdvancedOpen, setInternalIsAdvancedOpen] = useState(false);
  const isAdvancedOpen = controlledIsAdvancedOpen !== undefined ? controlledIsAdvancedOpen : internalIsAdvancedOpen;
  const setIsAdvancedOpen = onAdvancedOpenChange || setInternalIsAdvancedOpen;
  const [saveFilterName, setSaveFilterName] = useState('');
  const [isSavingFilter, setIsSavingFilter] = useState(false);

  const updateFilter = (key: keyof OrderFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const removeFilter = (key: keyof OrderFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const handleSaveFilter = async () => {
    if (!saveFilterName.trim() || !onSaveFilter) return;

    setIsSavingFilter(true);
    try {
      await onSaveFilter(saveFilterName.trim(), filters);
      setSaveFilterName('');
    } catch (error) {
      console.error('Failed to save filter:', error);
    } finally {
      setIsSavingFilter(false);
    }
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Quick Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <Input
              ref={searchInputRef}
              placeholder="Search orders, customers, or tracking numbers..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsAdvancedOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Advanced
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.status && filters.status.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted">Status:</span>
                {filters.status.map((status) => {
                  const option = statusOptions.find(opt => opt.value === status);
                  return (
                    <Badge
                      key={status}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {option?.label || status}
                      <button
                        onClick={() => {
                          const newStatus = filters.status?.filter(s => s !== status);
                          updateFilter('status', newStatus?.length ? newStatus : undefined);
                        }}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {filters.paymentStatus && filters.paymentStatus.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted">Payment:</span>
                {filters.paymentStatus.map((status) => {
                  const option = paymentStatusOptions.find(opt => opt.value === status);
                  return (
                    <Badge
                      key={status}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {option?.label || status}
                      <button
                        onClick={() => {
                          const newStatus = filters.paymentStatus?.filter(s => s !== status);
                          updateFilter('paymentStatus', newStatus?.length ? newStatus : undefined);
                        }}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {filters.dateFrom && (
              <Badge variant="outline" className="flex items-center gap-1">
                From: {new Date(filters.dateFrom).toLocaleDateString()}
                <button
                  onClick={() => removeFilter('dateFrom')}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.dateTo && (
              <Badge variant="outline" className="flex items-center gap-1">
                To: {new Date(filters.dateTo).toLocaleDateString()}
                <button
                  onClick={() => removeFilter('dateTo')}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.minAmount !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                Min: €{filters.minAmount}
                <button
                  onClick={() => removeFilter('minAmount')}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.maxAmount !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                Max: €{filters.maxAmount}
                <button
                  onClick={() => removeFilter('maxAmount')}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {filters.hasTracking !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                {filters.hasTracking ? 'Has Tracking' : 'No Tracking'}
                <button
                  onClick={() => removeFilter('hasTracking')}
                  className="ml-1 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted hover:text-text"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Saved filters:</span>
            <div className="flex flex-wrap gap-1">
              {savedFilters.map((savedFilter) => (
                <Button
                  key={savedFilter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadFilter(savedFilter)}
                  className="text-xs"
                >
                  {savedFilter.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters Dialog */}
      <Dialog open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>
              Set up detailed filters to find specific orders
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Filters */}
            <div>
              <label className="block text-sm font-medium mb-2">Order Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(option.value) || false}
                      onChange={(e) => {
                        const currentStatus = filters.status || [];
                        const newStatus = e.target.checked
                          ? [...currentStatus, option.value]
                          : currentStatus.filter(s => s !== option.value);
                        updateFilter('status', newStatus.length ? newStatus : undefined);
                      }}
                      className="rounded border-white/20 bg-black/25"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Status Filters */}
            <div>
              <label className="block text-sm font-medium mb-2">Payment Status</label>
              <div className="flex flex-wrap gap-2">
                {paymentStatusOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.paymentStatus?.includes(option.value) || false}
                      onChange={(e) => {
                        const currentStatus = filters.paymentStatus || [];
                        const newStatus = e.target.checked
                          ? [...currentStatus, option.value]
                          : currentStatus.filter(s => s !== option.value);
                        updateFilter('paymentStatus', newStatus.length ? newStatus : undefined);
                      }}
                      className="rounded border-white/20 bg-black/25"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                />
              </div>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Min Amount (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.minAmount || ''}
                  onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Amount (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.maxAmount || ''}
                  onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Other Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer ID</label>
                <Input
                  placeholder="Enter customer ID"
                  value={filters.customerId || ''}
                  onChange={(e) => updateFilter('customerId', e.target.value || undefined)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Has Tracking</label>
                <Select
                  value={filters.hasTracking === undefined ? 'all' : filters.hasTracking ? 'yes' : 'no'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      removeFilter('hasTracking');
                    } else {
                      updateFilter('hasTracking', value === 'yes');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <Select
                  value={filters.sortBy || 'createdAt'}
                  onValueChange={(value) => updateFilter('sortBy', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sort Order</label>
                <Select
                  value={filters.sortOrder || 'desc'}
                  onValueChange={(value) => updateFilter('sortOrder', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Save Filter */}
            {onSaveFilter && (
              <div className="flex gap-2">
                <Input
                  placeholder="Save this filter as..."
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveFilter}
                  disabled={!saveFilterName.trim() || isSavingFilter}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingFilter ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdvancedOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setIsAdvancedOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}








































































