import { useState, useCallback, useMemo, useEffect } from 'react';

interface UseDropFiltersOptions {
  savedFilters?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filterStatus?: string[];
    filterAccess?: string[];
  };
}

export function useDropFilters(options: UseDropFiltersOptions = {}) {
  const { savedFilters } = options;

  const [sortBy, setSortBy] = useState<'name' | 'status' | 'revenue' | 'interest' | 'createdAt' | 'conversionRate' | 'stockLevel'>(
    savedFilters?.sortBy || 'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(savedFilters?.sortOrder || 'desc');
  const [filterStatus, setFilterStatus] = useState<string[]>(savedFilters?.filterStatus || []);
  const [filterAccess, setFilterAccess] = useState<string[]>(savedFilters?.filterAccess || []);

  // Save filter preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('drop-management-filters', JSON.stringify({
        sortBy,
        sortOrder,
        filterStatus,
        filterAccess
      }));
    } catch (error) {
      console.warn('Failed to save filters:', error);
    }
  }, [sortBy, sortOrder, filterStatus, filterAccess]);

  const toggleStatusFilter = useCallback((status: string) => {
    setFilterStatus(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  }, []);

  const toggleAccessFilter = useCallback((access: string) => {
    setFilterAccess(prev => {
      if (prev.includes(access)) {
        return prev.filter(a => a !== access);
      } else {
        return [...prev, access];
      }
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilterStatus([]);
    setFilterAccess([]);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filterStatus.length > 0 || filterAccess.length > 0;
  }, [filterStatus.length, filterAccess.length]);

  return {
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filterStatus,
    setFilterStatus,
    filterAccess,
    setFilterAccess,
    toggleStatusFilter,
    toggleAccessFilter,
    clearFilters,
    hasActiveFilters
  };
}

