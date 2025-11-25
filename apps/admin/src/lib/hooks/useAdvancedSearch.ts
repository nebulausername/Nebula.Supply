import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { fuzzySearch, createQuickFilter, FuzzySearchOptions } from '../utils/fuzzySearch';

export interface SavedSearch<T> {
  id: string;
  name: string;
  searchTerm: string;
  filters: Record<string, any>;
  createdAt: string;
}

export interface UseAdvancedSearchOptions<T> extends FuzzySearchOptions<T> {
  enableFuzzySearch?: boolean;
  enableSavedSearches?: boolean;
  storageKey?: string;
}

export function useAdvancedSearch<T>(
  items: T[],
  options: UseAdvancedSearchOptions<T>
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch<T>[]>([]);

  // Load saved searches from localStorage
  const loadSavedSearches = useCallback(() => {
    if (!options.enableSavedSearches || !options.storageKey) return;
    
    try {
      const stored = localStorage.getItem(`saved_searches_${options.storageKey}`);
      if (stored) {
        setSavedSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load saved searches:', error);
    }
  }, [options.enableSavedSearches, options.storageKey]);

  // Save search to localStorage
  const saveSearch = useCallback((name: string, searchTerm: string, filters: Record<string, any>) => {
    if (!options.enableSavedSearches || !options.storageKey) return;

    const newSearch: SavedSearch<T> = {
      id: Date.now().toString(),
      name,
      searchTerm,
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);

    try {
      localStorage.setItem(`saved_searches_${options.storageKey}`, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save search:', error);
    }
  }, [savedSearches, options.enableSavedSearches, options.storageKey]);

  // Delete saved search
  const deleteSavedSearch = useCallback((id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);

    if (options.storageKey) {
      try {
        localStorage.setItem(`saved_searches_${options.storageKey}`, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to delete saved search:', error);
      }
    }
  }, [savedSearches, options.storageKey]);

  // Load saved searches on mount
  useEffect(() => {
    loadSavedSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply quick filter
  const quickFilteredItems = useMemo(() => {
    if (!quickFilter) return items;
    
    return createQuickFilter(
      items,
      quickFilter as any,
      (item: any) => item.inventory || item.stock || 0,
      (item: any) => item.status,
      (item: any) => item.featured
    );
  }, [items, quickFilter]);

  // Apply fuzzy search
  const searchedItems = useMemo(() => {
    const itemsToSearch = quickFilter ? quickFilteredItems : items;
    
    if (!searchTerm || !options.enableFuzzySearch) {
      return itemsToSearch;
    }

    const results = fuzzySearch(itemsToSearch, searchTerm, options);
    return results.map(r => r.item);
  }, [searchTerm, quickFilteredItems, items, options]);

  // Apply additional filters
  const filteredItems = useMemo(() => {
    let result = searchedItems;

    // Apply active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      
      result = result.filter((item: any) => {
        const itemValue = item[key];
        
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        
        if (typeof value === 'object' && value.min !== undefined) {
          return itemValue >= value.min && itemValue <= (value.max || Infinity);
        }
        
        return itemValue === value || String(itemValue).toLowerCase().includes(String(value).toLowerCase());
      });
    });

    return result;
  }, [searchedItems, activeFilters]);

  // Search history (last 10 searches)
  const searchHistory = useMemo(() => {
    const history = JSON.parse(localStorage.getItem(`search_history_${options.storageKey || 'default'}`) || '[]');
    return history.slice(0, 10);
  }, [options.storageKey]);

  // Add to search history
  const addToHistory = useCallback((term: string) => {
    if (!term || term.trim().length === 0) return;
    
    const history = searchHistory.filter((h: string) => h !== term);
    history.unshift(term);
    const updated = history.slice(0, 10);
    
    try {
      localStorage.setItem(`search_history_${options.storageKey || 'default'}`, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, [searchHistory, options.storageKey]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setActiveFilters({});
    setQuickFilter(null);
  }, []);

  // Apply saved search
  const applySavedSearch = useCallback((savedSearch: SavedSearch<T>) => {
    setSearchTerm(savedSearch.searchTerm);
    setActiveFilters(savedSearch.filters);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters,
    quickFilter,
    setQuickFilter,
    filteredItems,
    savedSearches,
    saveSearch,
    deleteSavedSearch,
    applySavedSearch,
    searchHistory,
    addToHistory,
    clearFilters,
  };
}

