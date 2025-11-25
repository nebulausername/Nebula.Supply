import { useState, useCallback, useMemo } from 'react';
import type { DropFilter } from '../lib/dropUtils';
import { useDropConfigStore } from '../store/dropConfigStore';
import type { Drop } from '@nebula/shared';

export interface FilterPreset {
  id: string;
  name: string;
  filters: DropFilter[];
}

export const useDropFilters = (drops: Drop[]) => {
  const { config, addFilterPreset, setActivePreset, removeFilterPreset } = useDropConfigStore();
  const [activeFilters, setActiveFilters] = useState<DropFilter[]>([]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');

  // Apply active preset
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = config.filters.presets.find((p) => p.id === presetId);
      if (preset) {
        setActiveFilters(preset.filters as DropFilter[]);
        setActivePreset(presetId);
      }
    },
    [config.filters.presets, setActivePreset]
  );

  // Save current filters as preset
  const saveAsPreset = useCallback(
    (name: string) => {
      if (activeFilters.length === 0) return;

      addFilterPreset({
        name,
        filters: activeFilters.reduce((acc, filter) => {
          acc[filter.field] = { operator: filter.operator, value: filter.value };
          return acc;
        }, {} as Record<string, any>),
      });
    },
    [activeFilters, addFilterPreset]
  );

  // Add filter
  const addFilter = useCallback(() => {
    setActiveFilters([
      ...activeFilters,
      { field: 'status', operator: 'equals', value: '' },
    ]);
  }, [activeFilters]);

  // Update filter
  const updateFilter = useCallback(
    (index: number, filter: Partial<DropFilter>) => {
      const newFilters = [...activeFilters];
      newFilters[index] = { ...newFilters[index], ...filter };
      setActiveFilters(newFilters);
    },
    [activeFilters]
  );

  // Remove filter
  const removeFilter = useCallback(
    (index: number) => {
      setActiveFilters(activeFilters.filter((_, i) => i !== index));
    },
    [activeFilters]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setActivePreset(null);
  }, [setActivePreset]);

  // Apply filters to drops
  const filteredDrops = useMemo(() => {
    if (activeFilters.length === 0) return drops;

    return drops.filter((drop) => {
      if (filterLogic === 'AND') {
        return activeFilters.every((filter) => {
          const fieldValue = getFieldValue(drop, filter.field);
          return matchesFilter(fieldValue, filter);
        });
      } else {
        return activeFilters.some((filter) => {
          const fieldValue = getFieldValue(drop, filter.field);
          return matchesFilter(fieldValue, filter);
        });
      }
    });
  }, [drops, activeFilters, filterLogic]);

  return {
    activeFilters,
    filteredDrops,
    filterLogic,
    setFilterLogic,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    applyPreset,
    saveAsPreset,
    presets: config.filters.presets,
    activePreset: config.filters.activePreset,
    removePreset: removeFilterPreset,
  };
};

// Helper functions
function getFieldValue(drop: Drop, field: string): any {
  const parts = field.split('.');
  let value: any = drop;
  for (const part of parts) {
    value = value?.[part];
  }
  return value;
}

function matchesFilter(value: any, filter: DropFilter): boolean {
  switch (filter.operator) {
    case 'equals':
      return value === filter.value;
    case 'contains':
      return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
    case 'gt':
      return Number(value) > Number(filter.value);
    case 'lt':
      return Number(value) < Number(filter.value);
    case 'gte':
      return Number(value) >= Number(filter.value);
    case 'lte':
      return Number(value) <= Number(filter.value);
    case 'in':
      return Array.isArray(filter.value) && filter.value.includes(value);
    case 'notIn':
      return Array.isArray(filter.value) && !filter.value.includes(value);
    default:
      return true;
  }
}

