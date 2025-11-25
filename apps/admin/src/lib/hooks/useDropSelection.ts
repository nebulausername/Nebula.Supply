import { useState, useCallback, useMemo } from 'react';

export function useDropSelection() {
  const [selectedDrops, setSelectedDrops] = useState<Set<string>>(new Set());

  const selectDrop = useCallback((dropId: string, checked: boolean) => {
    setSelectedDrops(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(dropId);
      } else {
        newSet.delete(dropId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((drops: any[], checked: boolean) => {
    if (checked && Array.isArray(drops) && drops.length > 0) {
      setSelectedDrops(new Set(drops.filter(d => d && d.id).map(d => d.id)));
    } else {
      setSelectedDrops(new Set());
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDrops(new Set());
  }, []);

  const isSelected = useCallback((dropId: string) => {
    return selectedDrops.has(dropId);
  }, [selectedDrops]);

  const selectedCount = useMemo(() => {
    return selectedDrops.size;
  }, [selectedDrops.size]);

  const hasSelection = useMemo(() => {
    return selectedDrops.size > 0;
  }, [selectedDrops.size]);

  return {
    selectedDrops,
    setSelectedDrops,
    selectDrop,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount,
    hasSelection
  };
}

