import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { TicketFilters } from '../components/tickets/types';

export interface SavedFilter {
  id: string;
  name: string;
  filters: TicketFilters;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'ticket-saved-filters';

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useLocalStorage<SavedFilter[]>(STORAGE_KEY, []);

  const saveFilter = useCallback(
    (name: string, filters: TicketFilters) => {
      const newFilter: SavedFilter = {
        id: crypto.randomUUID(),
        name,
        filters,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSavedFilters((prev) => [...prev, newFilter]);
      return newFilter;
    },
    [setSavedFilters]
  );

  const updateFilter = useCallback(
    (id: string, updates: Partial<SavedFilter>) => {
      setSavedFilters((prev) =>
        prev.map((filter) =>
          filter.id === id
            ? { ...filter, ...updates, updatedAt: new Date().toISOString() }
            : filter
        )
      );
    },
    [setSavedFilters]
  );

  const deleteFilter = useCallback(
    (id: string) => {
      setSavedFilters((prev) => prev.filter((filter) => filter.id !== id));
    },
    [setSavedFilters]
  );

  const loadFilter = useCallback(
    (id: string): TicketFilters | null => {
      const filter = savedFilters.find((f) => f.id === id);
      return filter?.filters || null;
    },
    [savedFilters]
  );

  const getFilterById = useCallback(
    (id: string): SavedFilter | undefined => {
      return savedFilters.find((f) => f.id === id);
    },
    [savedFilters]
  );

  return {
    savedFilters,
    saveFilter,
    updateFilter,
    deleteFilter,
    loadFilter,
    getFilterById,
  };
}
