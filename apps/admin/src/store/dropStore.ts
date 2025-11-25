import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface DropDashboardState {
  // UI State
  currentlyEditingCell: string | null;
  pendingChanges: Map<string, any>;
  expandedVariants: Set<string>;
  selectedDrops: Set<string>;
  
  // Filter & Sort State
  filters: {
    status?: string;
    access?: string;
    search?: string;
  };
  sortBy: 'name' | 'price' | 'popularity' | 'availability' | 'newest' | 'status';
  sortDirection: 'asc' | 'desc';
  
  // Pagination
  currentPage: number;
  pageSize: number;
  
  // View State
  viewMode: 'table' | 'cards' | 'list';
  showVariants: boolean;
  showAnalytics: boolean;
  
  // Real-time State
  lastUpdateTime: Date | null;
  updateSource: 'local' | 'remote' | null;
  conflictResolution: 'last-write-wins' | 'manual';
  
  // Actions
  setEditingCell: (cellId: string | null) => void;
  setPendingChange: (cellId: string, value: any) => void;
  clearPendingChanges: () => void;
  toggleVariantExpansion: (variantId: string) => void;
  toggleDropSelection: (dropId: string) => void;
  selectAllDrops: (dropIds: string[]) => void;
  clearSelection: () => void;
  
  setFilters: (filters: Partial<DropDashboardState['filters']>) => void;
  setSorting: (sortBy: DropDashboardState['sortBy'], direction?: 'asc' | 'desc') => void;
  setPagination: (page: number, pageSize?: number) => void;
  
  setViewMode: (mode: DropDashboardState['viewMode']) => void;
  toggleShowVariants: () => void;
  toggleShowAnalytics: () => void;
  
  setLastUpdate: (time: Date, source: 'local' | 'remote') => void;
  setConflictResolution: (mode: DropDashboardState['conflictResolution']) => void;
  
  // Computed getters
  getSelectedDrops: () => string[];
  getExpandedVariants: () => string[];
  hasPendingChanges: () => boolean;
  getPendingChange: (cellId: string) => any;
}

export const useDropStore = create<DropDashboardState>()(
  devtools(
    (set, get) => ({
      // Initial State
      currentlyEditingCell: null,
      pendingChanges: new Map(),
      expandedVariants: new Set(),
      selectedDrops: new Set(),
      
      filters: {},
      sortBy: 'newest',
      sortDirection: 'desc',
      
      currentPage: 1,
      pageSize: 20,
      
      viewMode: 'table',
      showVariants: false,
      showAnalytics: false,
      
      lastUpdateTime: null,
      updateSource: null,
      conflictResolution: 'last-write-wins',
      
      // Cell Editing Actions
      setEditingCell: (cellId) => {
        set({ currentlyEditingCell: cellId });
      },
      
      setPendingChange: (cellId, value) => {
        set((state) => {
          const newPendingChanges = new Map(state.pendingChanges);
          newPendingChanges.set(cellId, value);
          return { pendingChanges: newPendingChanges };
        });
      },
      
      clearPendingChanges: () => {
        set({ 
          pendingChanges: new Map(),
          currentlyEditingCell: null 
        });
      },
      
      // Variant Management
      toggleVariantExpansion: (variantId) => {
        set((state) => {
          const newExpanded = new Set(state.expandedVariants);
          if (newExpanded.has(variantId)) {
            newExpanded.delete(variantId);
          } else {
            newExpanded.add(variantId);
          }
          return { expandedVariants: newExpanded };
        });
      },
      
      // Selection Management
      toggleDropSelection: (dropId) => {
        set((state) => {
          const newSelected = new Set(state.selectedDrops);
          if (newSelected.has(dropId)) {
            newSelected.delete(dropId);
          } else {
            newSelected.add(dropId);
          }
          return { selectedDrops: newSelected };
        });
      },
      
      selectAllDrops: (dropIds) => {
        set({ selectedDrops: new Set(dropIds) });
      },
      
      clearSelection: () => {
        set({ selectedDrops: new Set() });
      },
      
      // Filter & Sort Actions
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1 // Reset to first page when filtering
        }));
      },
      
      setSorting: (sortBy, direction) => {
        set((state) => ({
          sortBy,
          sortDirection: direction || (state.sortBy === sortBy && state.sortDirection === 'asc' ? 'desc' : 'asc'),
          currentPage: 1 // Reset to first page when sorting
        }));
      },
      
      setPagination: (page, pageSize) => {
        set((state) => ({
          currentPage: page,
          pageSize: pageSize || state.pageSize
        }));
      },
      
      // View Actions
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },
      
      toggleShowVariants: () => {
        set((state) => ({ showVariants: !state.showVariants }));
      },
      
      toggleShowAnalytics: () => {
        set((state) => ({ showAnalytics: !state.showAnalytics }));
      },
      
      // Real-time Actions
      setLastUpdate: (time, source) => {
        set({ 
          lastUpdateTime: time,
          updateSource: source
        });
      },
      
      setConflictResolution: (mode) => {
        set({ conflictResolution: mode });
      },
      
      // Computed Getters
      getSelectedDrops: () => {
        return Array.from(get().selectedDrops);
      },
      
      getExpandedVariants: () => {
        return Array.from(get().expandedVariants);
      },
      
      hasPendingChanges: () => {
        return get().pendingChanges.size > 0;
      },
      
      getPendingChange: (cellId) => {
        return get().pendingChanges.get(cellId);
      }
    }),
    {
      name: 'drop-dashboard-store',
      partialize: (state) => ({
        // Only persist UI preferences, not real-time state
        filters: state.filters,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
        pageSize: state.pageSize,
        viewMode: state.viewMode,
        showVariants: state.showVariants,
        showAnalytics: state.showAnalytics,
        conflictResolution: state.conflictResolution
      })
    }
  )
);

// Selector hooks for better performance
export const useDropFilters = () => useDropStore((state) => state.filters);
export const useDropSorting = () => useDropStore((state) => ({ 
  sortBy: state.sortBy, 
  sortDirection: state.sortDirection 
}));
export const useDropPagination = () => useDropStore((state) => ({ 
  currentPage: state.currentPage, 
  pageSize: state.pageSize 
}));
export const useDropViewMode = () => useDropStore((state) => state.viewMode);
export const useDropSelection = () => useDropStore((state) => ({
  selectedDrops: state.getSelectedDrops(),
  toggleSelection: state.toggleDropSelection,
  selectAll: state.selectAllDrops,
  clearSelection: state.clearSelection
}));
export const useDropEditing = () => useDropStore((state) => ({
  currentlyEditing: state.currentlyEditingCell,
  pendingChanges: state.pendingChanges,
  hasPendingChanges: state.hasPendingChanges(),
  setEditing: state.setEditingCell,
  setPending: state.setPendingChange,
  clearPending: state.clearPendingChanges
}));
export const useDropRealtime = () => useDropStore((state) => ({
  lastUpdateTime: state.lastUpdateTime,
  updateSource: state.updateSource,
  conflictResolution: state.conflictResolution,
  setLastUpdate: state.setLastUpdate,
  setConflictResolution: state.setConflictResolution
}));






