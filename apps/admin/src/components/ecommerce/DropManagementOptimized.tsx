import React, { useState, useCallback, useMemo, memo, useTransition, Suspense, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { InlineEdit } from '../ui/InlineEdit';
import { ImagePicker } from '../media/ImagePicker';
import { SkeletonCard, Skeleton } from '../ui/Skeleton';
import { DropCard } from './DropCard';
import { VirtualizedDropGrid } from './VirtualizedDropGrid';
import { VirtualizedList } from '../ui/VirtualizedList';
import { 
  Zap, 
  Plus, 
  Search, 
  Filter,
  Grid3X3,
  List,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Copy,
  Star,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Lock,
  Globe,
  Package,
  BarChart3,
  Calendar,
  Timer,
  Flame,
  RefreshCw,
  GripVertical,
  Keyboard,
  HelpCircle
} from 'lucide-react';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { useKeyboardShortcuts } from '../../lib/hooks/useKeyboardShortcuts';
import { useQueryClient } from '@tanstack/react-query';
import { useDrops, useUpdateDrop, useBulkAction, useReorderDrops, useCreateDrop, queryKeys } from '../../lib/api/hooks';
import { useRealtimeDrops } from '../../lib/websocket/useRealtimeDrops';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';
import { useToast } from '../ui/Toast';
import { getStatusBadge, getAccessBadge, getPriorityBadge } from './dropBadges';
import { DropFilters as DropFiltersComponent, DropFilters as DropFiltersType } from './DropFilters';
import { BulkDropOperations } from './BulkDropOperations';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

// Lazy load modals for code splitting
const DropDetailsModal = React.lazy(() => import('./DropDetailsModal').then(module => ({ default: module.DropDetailsModal })));
const EditDropModal = React.lazy(() => import('./EditDropModal').then(module => ({ default: module.EditDropModal })));
const StockUpdateModal = React.lazy(() => import('./StockUpdateModal').then(module => ({ default: module.StockUpdateModal })));

interface DropManagementProps {
  viewMode: 'grid' | 'list';
  searchTerm: string;
}

export function DropManagement({ viewMode, searchTerm }: DropManagementProps) {
  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('DropManagement');
  const { handleError } = useErrorHandler('DropManagement');

  // Debounce search term - optimized for faster response
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  
  // Use transition for smooth UI updates
  const [isPending, startTransition] = useTransition();

  // Load saved filter preferences from localStorage
  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('drop-management-filters');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load saved filters:', error);
    }
    return null;
  };

  const savedFilters = loadSavedFilters();

  // State management with saved preferences
  const [selectedDrops, setSelectedDrops] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'revenue' | 'interest' | 'createdAt' | 'conversionRate' | 'stockLevel'>(savedFilters?.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(savedFilters?.sortOrder || 'desc');
  const [filterStatus, setFilterStatus] = useState<string[]>(savedFilters?.filterStatus || []);
  const [filterAccess, setFilterAccess] = useState<string[]>(savedFilters?.filterAccess || []);
  const [advancedFilters, setAdvancedFilters] = useState<DropFiltersType>({
    status: filterStatus,
    access: filterAccess,
    stockLevel: 'all',
  });
  const [draggedDropId, setDraggedDropId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync advanced filters with simple filters
  React.useEffect(() => {
    setAdvancedFilters(prev => ({
      ...prev,
      status: filterStatus,
      access: filterAccess,
    }));
  }, [filterStatus, filterAccess]);

  // Save filter preferences to localStorage
  React.useEffect(() => {
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

  // Fetch drops from API
  const {
    data: dropsResponse,
    isLoading: dropsLoading,
    error: dropsError,
    refetch: refetchDrops
  } = useDrops({
    search: debouncedSearchTerm,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    limit: 100
  });

  // Update drop mutation
  const updateDropMutation = useUpdateDrop();
  const bulkActionMutation = useBulkAction();
  const reorderDropsMutation = useReorderDrops();
  const createDropMutation = useCreateDrop();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Modal states
  const [selectedDropForDetails, setSelectedDropForDetails] = useState<any>(null);
  const [selectedDropForEdit, setSelectedDropForEdit] = useState<any>(null);
  const [selectedDropForDuplicate, setSelectedDropForDuplicate] = useState<any>(null);
  const [selectedDropForStockUpdate, setSelectedDropForStockUpdate] = useState<any>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Real-time updates via WebSocket with optimistic updates
  const realtime = useRealtimeDrops({
    enabled: true,
    filters: {
      status: filterStatus.length > 0 ? filterStatus : undefined,
      access: filterAccess.length > 0 ? filterAccess : undefined
    },
    onDropUpdated: (event) => {
      logger.info('Drop updated via WebSocket', { dropId: event.dropId });
      // Optimistic update: Update cache immediately - no refetch needed
      if (event.drop) {
        queryClient.setQueriesData(
          { queryKey: ['drops', 'list'] },
          (old: any) => {
            if (!old?.data) return old;
            const data = Array.isArray(old.data) ? old.data : (old.data?.data || []);
            return {
              ...old,
              data: data.map((d: any) => d && d.id === event.dropId ? { ...d, ...event.drop } : d)
            };
          }
        );
      }
      toast.info('Drop aktualisiert', 'Ein Drop wurde von einem anderen Benutzer aktualisiert.');
    },
    onDropCreated: (event) => {
      logger.info('Drop created via WebSocket', { dropId: event.dropId });
      // Optimistic update: Add to cache immediately - no refetch needed
      if (event.drop) {
        queryClient.setQueriesData(
          { queryKey: ['drops', 'list'] },
          (old: any) => {
            if (!old?.data) return { ...old, data: [event.drop] };
            const data = Array.isArray(old.data) ? old.data : (old.data?.data || []);
            return {
              ...old,
              data: [event.drop, ...data]
            };
          }
        );
      }
      toast.info('Neuer Drop', 'Ein neuer Drop wurde erstellt.');
    },
    onDropDeleted: (event) => {
      logger.info('Drop deleted via WebSocket', { dropId: event.dropId });
      // Optimistic update: Remove from cache immediately - no refetch needed
      queryClient.setQueriesData(
        { queryKey: ['drops', 'list'] },
        (old: any) => {
          if (!old?.data) return old;
          const data = Array.isArray(old.data) ? old.data : (old.data?.data || []);
          return {
            ...old,
            data: data.filter((d: any) => d && d.id !== event.dropId)
          };
        }
      );
      toast.warning('Drop gelöscht', 'Ein Drop wurde gelöscht.');
    },
    onProgressUpdated: (event) => {
      logger.info('Drop progress updated via WebSocket', { dropId: event.dropId });
      // Optimistic update: Update progress immediately - no refetch needed
      queryClient.setQueriesData(
        { queryKey: ['drops', 'list'] },
        (old: any) => {
          if (!old?.data) return old;
          const data = Array.isArray(old.data) ? old.data : (old.data?.data || []);
          return {
            ...old,
            data: data.map((d: any) => {
              if (d && d.id === event.dropId) {
                return {
                  ...d,
                  progress: event.progress,
                  totalStock: event.totalStock,
                  soldCount: event.soldCount
                };
              }
              return d;
            })
          };
        }
      );
      toast.info('Fortschritt aktualisiert', 'Der Fortschritt eines Drops wurde aktualisiert.');
    }
  });

  // Extract drops data
  const dropsData = dropsResponse?.data || [];
  const drops = Array.isArray(dropsData) ? dropsData : (dropsData?.data || []);

  // Process drops data
  const processedDrops = useMemo(() => {
    // Defensive check: ensure drops is always an array
    if (!Array.isArray(drops) || drops.length === 0) return [];
    
    return drops
      .filter((drop: any) => drop && drop.id) // Filter out invalid drops
      .map((drop: any) => ({
        ...drop,
        variants: Array.isArray(drop.variants) ? drop.variants : [],
        isLowStock: (drop.totalStock || 0) < 20,
        isHighRevenue: (drop.revenue || 0) > 10000,
        conversionRate: drop.interestCount > 0 ? ((drop.soldCount || 0) / drop.interestCount) * 100 : 0,
        daysUntilDrop: drop.scheduledDate ? Math.ceil((new Date(drop.scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
      }));
  }, [drops]);

  // Virtual scrolling thresholds
  const VIRTUAL_SCROLL_THRESHOLD_GRID = 40;
  const VIRTUAL_SCROLL_THRESHOLD_LIST = 80;
  
  // Container dimensions for virtual scrolling
  const [containerDimensions, setContainerDimensions] = useState({ width: 1920, height: 800 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth || window.innerWidth,
          height: window.innerHeight - 300,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Pagination for better performance
  const [page, setPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 20 : 50;
  
  // Determine if virtual scrolling should be used
  const useVirtualScrolling = useMemo(() => 
    filteredDrops.length > VIRTUAL_SCROLL_THRESHOLD_GRID && viewMode === 'grid',
    [filteredDrops.length, viewMode]
  );
  const useVirtualTableScrolling = useMemo(() => 
    filteredDrops.length > VIRTUAL_SCROLL_THRESHOLD_LIST && viewMode === 'list',
    [filteredDrops.length, viewMode]
  );
  
  // Search filter - separate memoization for better performance
  const searchFilteredDrops = useMemo(() => {
    if (!Array.isArray(processedDrops) || processedDrops.length === 0) {
      return [];
    }
    
    if (!searchTerm) {
      return processedDrops;
    }
    
    const term = searchTerm.toLowerCase();
    return processedDrops.filter(drop => {
      if (!drop) return false;
      return (
        drop.name?.toLowerCase().includes(term) ||
        drop.description?.toLowerCase().includes(term) ||
        drop.badge?.toLowerCase().includes(term) ||
        drop.flavorTag?.toLowerCase().includes(term) ||
        (Array.isArray(drop.variants) && drop.variants.some((v: any) => v?.label?.toLowerCase().includes(term)))
      );
    });
  }, [processedDrops, searchTerm]);

  // Status filter - separate memoization
  const statusFilteredDrops = useMemo(() => {
    if (!Array.isArray(filterStatus) || filterStatus.length === 0) {
      return searchFilteredDrops;
    }
    return searchFilteredDrops.filter(drop => drop && drop.status && filterStatus.includes(drop.status));
  }, [searchFilteredDrops, filterStatus]);

  // Access filter - separate memoization
  const accessFilteredDrops = useMemo(() => {
    if (!Array.isArray(filterAccess) || filterAccess.length === 0) {
      return statusFilteredDrops;
    }
    return statusFilteredDrops.filter(drop => drop && drop.access && filterAccess.includes(drop.access));
  }, [statusFilteredDrops, filterAccess]);

  // Advanced filters (date, price, stock) - separate memoization
  const advancedFilteredDrops = useMemo(() => {
    let filtered = accessFilteredDrops;

    // Date filter
    if (advancedFilters.dateFrom) {
      const dateFrom = new Date(advancedFilters.dateFrom);
      filtered = filtered.filter(drop => {
        const dropDate = new Date(drop.createdAt || 0);
        return dropDate >= dateFrom;
      });
    }
    if (advancedFilters.dateTo) {
      const dateTo = new Date(advancedFilters.dateTo);
      dateTo.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(drop => {
        const dropDate = new Date(drop.createdAt || 0);
        return dropDate <= dateTo;
      });
    }

    // Price filter (using variants)
    if (advancedFilters.priceMin !== undefined) {
      filtered = filtered.filter(drop => {
        if (!Array.isArray(drop.variants) || drop.variants.length === 0) return false;
        const minPrice = Math.min(...drop.variants.map((v: any) => v.basePrice || 0).filter((p: number) => p > 0));
        return minPrice >= advancedFilters.priceMin!;
      });
    }
    if (advancedFilters.priceMax !== undefined) {
      filtered = filtered.filter(drop => {
        if (!Array.isArray(drop.variants) || drop.variants.length === 0) return false;
        const maxPrice = Math.max(...drop.variants.map((v: any) => v.basePrice || 0).filter((p: number) => p > 0));
        return maxPrice <= advancedFilters.priceMax!;
      });
    }

    // Stock filter
    if (advancedFilters.stockMin !== undefined) {
      filtered = filtered.filter(drop => (drop.totalStock || 0) >= advancedFilters.stockMin!);
    }
    if (advancedFilters.stockMax !== undefined) {
      filtered = filtered.filter(drop => (drop.totalStock || 0) <= advancedFilters.stockMax!);
    }
    if (advancedFilters.stockLevel && advancedFilters.stockLevel !== 'all') {
      filtered = filtered.filter(drop => {
        const stock = drop.totalStock || 0;
        switch (advancedFilters.stockLevel) {
          case 'low':
            return stock > 0 && stock < 20;
          case 'out':
            return stock === 0;
          case 'in_stock':
            return stock > 0;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [accessFilteredDrops, advancedFilters]);

  // Sort comparator - memoized separately
  const sortComparator = useMemo(() => {
    return (a: any, b: any) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'revenue':
          aValue = a.revenue || 0;
          bValue = b.revenue || 0;
          break;
        case 'interest':
          aValue = a.interestCount || 0;
          bValue = b.interestCount || 0;
          break;
        case 'conversionRate':
          aValue = a.conversionRate || 0;
          bValue = b.conversionRate || 0;
          break;
        case 'stockLevel':
          aValue = a.totalStock || 0;
          bValue = b.totalStock || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    };
  }, [sortBy, sortOrder]);

  // Final filtered and sorted drops - combines all filters and sorting
  const filteredDrops = useMemo(() => {
    if (!Array.isArray(advancedFilteredDrops) || advancedFilteredDrops.length === 0) {
      return [];
    }
    
    // Create a copy to avoid mutating the original array
    const sorted = [...advancedFilteredDrops];
    sorted.sort(sortComparator);
    return sorted;
  }, [advancedFilteredDrops, sortComparator]);
  
  // Paginated drops - return all for virtual scrolling, otherwise paginate
  const paginatedDrops = useMemo(() => {
    if (useVirtualScrolling && viewMode === 'grid') {
      // Return all drops for virtual scrolling
      return filteredDrops;
    }
    if (useVirtualTableScrolling && viewMode === 'list') {
      // Return all drops for virtual table scrolling
      return filteredDrops;
    }
    const start = (page - 1) * itemsPerPage;
    return filteredDrops.slice(start, start + itemsPerPage);
  }, [filteredDrops, page, itemsPerPage, viewMode, useVirtualScrolling, useVirtualTableScrolling]);
  
  const totalPages = Math.ceil(filteredDrops.length / itemsPerPage);
  
  // Reset page when filters change
  React.useEffect(() => {
    startTransition(() => {
      setPage(1);
    });
  }, [filterStatus, filterAccess, searchTerm, sortBy, sortOrder]);

  // Handlers - defined early so they can be used in keyboard shortcuts
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked && Array.isArray(filteredDrops) && filteredDrops.length > 0) {
      setSelectedDrops(new Set(filteredDrops.filter(d => d && d.id).map(d => d.id)));
    } else {
      setSelectedDrops(new Set());
    }
  }, [filteredDrops]);

  const handleBulkAction = useCallback(async (action: string, options?: { status?: string; access?: string }) => {
    if (selectedDrops.size === 0) {
      logger.warn('No drops selected for bulk action');
      return;
    }

    const dropIds = Array.from(selectedDrops);
    
    // Confirmation for destructive actions
    if (action === 'delete') {
      if (!confirm(`Möchtest du wirklich ${dropIds.length} Drop(s) löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
        return;
      }
    }

    try {
      await measureAsync('bulk_action', async () => {
        let actionData: any = {
          action,
          dropIds
        };

        // Add additional data based on action
        if (action === 'status_change') {
          actionData.status = options?.status || 'active';
        } else if (action === 'access_change') {
          actionData.access = options?.access || 'standard';
        }

        const result = await bulkActionMutation.mutateAsync(actionData);
        logger.logUserAction('bulk_action', { action, dropIds, result });
        
        // Clear selection after successful action
        setSelectedDrops(new Set());
        
        // Invalidate queries instead of refetch for bulk operations
        queryClient.invalidateQueries({ queryKey: ['drops', 'list'] });
        
        // Show success toast
        const actionLabels: Record<string, string> = {
          activate: 'aktiviert',
          deactivate: 'deaktiviert',
          delete: 'gelöscht',
          status_change: 'Status geändert',
          access_change: 'Zugriff geändert'
        };
        toast.success(
          'Bulk-Aktion erfolgreich',
          `${dropIds.length} Drop(s) wurden ${actionLabels[action] || action}.`
        );
      });
    } catch (error) {
      handleError(error, { operation: 'bulk_action', action, dropIds });
      toast.error('Fehler bei Bulk-Aktion', 'Die Aktion konnte nicht ausgeführt werden.');
    }
  }, [selectedDrops, bulkActionMutation, measureAsync, handleError, queryClient, toast]);

  const handleDuplicateDrop = useCallback(async (drop: any) => {
    try {
      await measureAsync('drop_duplicate', async () => {
        const duplicatedDrop = {
          ...drop,
          name: `${drop.name} (Kopie)`,
          id: undefined, // Remove ID so it creates a new drop
          createdAt: undefined,
          updatedAt: undefined
        };
        
        await createDropMutation.mutateAsync(duplicatedDrop);
        logger.logUserAction('drop_duplicated', { originalDropId: drop.id });
        // Invalidate to refetch with new drop
        queryClient.invalidateQueries({ queryKey: ['drops', 'list'] });
        toast.success('Drop dupliziert', 'Der Drop wurde erfolgreich dupliziert.');
      });
    } catch (error) {
      handleError(error, { operation: 'drop_duplicate', dropId: drop.id });
      toast.error('Fehler beim Duplizieren', 'Der Drop konnte nicht dupliziert werden.');
    }
  }, [measureAsync, createDropMutation, refetchDrops, handleError, toast]);

  const handleDeleteDrop = useCallback(async (dropId: string, dropName: string) => {
    if (!confirm(`Möchtest du "${dropName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      await measureAsync('drop_delete', async () => {
        await bulkActionMutation.mutateAsync({
          action: 'delete',
          dropIds: [dropId]
        });
        logger.logUserAction('drop_deleted', { dropId });
        setSelectedDrops(prev => {
          const newSet = new Set(prev);
          newSet.delete(dropId);
          return newSet;
        });
        // Invalidate queries for delete operations
        queryClient.invalidateQueries({ queryKey: ['drops', 'list'] });
        toast.success('Drop gelöscht', 'Der Drop wurde erfolgreich gelöscht.');
      });
    } catch (error) {
      handleError(error, { operation: 'drop_delete', dropId });
      toast.error('Fehler beim Löschen', 'Der Drop konnte nicht gelöscht werden.');
    }
  }, [bulkActionMutation, measureAsync, handleError, refetchDrops, toast]);

  // Enhanced Keyboard Shortcuts
  const [selectedDropIndex, setSelectedDropIndex] = useState<number | null>(null);
  
  const dropShortcuts = React.useMemo(() => [
    {
      key: 'n',
      ctrl: true,
      meta: true,
      handler: () => {
        try {
          // Create new drop - could open modal
          toast.info('Neuer Drop', 'Shortcut: Ctrl/Cmd+N - Feature kommt bald');
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Neuen Drop erstellen'
    },
    {
      key: 'a',
      ctrl: true,
      meta: true,
      handler: () => {
        try {
          handleSelectAll(true);
          toast.info('Alle ausgewählt', `${filteredDrops.length} Drops ausgewählt`);
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Alle Drops auswählen'
    },
    {
      key: 'e',
      ctrl: true,
      meta: true,
      handler: () => {
        try {
          if (selectedDrops.size === 1) {
            const selectedId = Array.from(selectedDrops)[0];
            const drop = filteredDrops.find(d => d.id === selectedId);
            if (drop) {
              setSelectedDropForEdit(drop);
            }
          } else if (selectedDropIndex !== null && filteredDrops[selectedDropIndex]) {
            setSelectedDropForEdit(filteredDrops[selectedDropIndex]);
          }
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Ausgewählten Drop bearbeiten'
    },
    {
      key: 'd',
      ctrl: true,
      meta: true,
      handler: () => {
        try {
          if (selectedDrops.size === 1) {
            const selectedId = Array.from(selectedDrops)[0];
            const drop = filteredDrops.find(d => d.id === selectedId);
            if (drop) {
              handleDuplicateDrop(drop);
            }
          } else if (selectedDrops.size > 0) {
            if (confirm(`Möchtest du wirklich ${selectedDrops.size} Drop(s) löschen?`)) {
              handleBulkAction('delete');
            }
          }
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: selectedDrops.size === 1 ? 'Drop duplizieren' : 'Ausgewählte Drops löschen'
    },
    {
      key: 's',
      ctrl: true,
      meta: true,
      handler: () => {
        try {
          // Save changes - if editing
          if (selectedDropForEdit) {
            toast.info('Speichern', 'Änderungen werden gespeichert...');
          }
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Änderungen speichern'
    },
    {
      key: 'ArrowDown',
      ctrl: false,
      meta: false,
      handler: () => {
        try {
          if (selectedDropIndex === null) {
            setSelectedDropIndex(0);
          } else if (selectedDropIndex < filteredDrops.length - 1) {
            setSelectedDropIndex(selectedDropIndex + 1);
          }
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Zum nächsten Drop navigieren'
    },
    {
      key: 'ArrowUp',
      ctrl: false,
      meta: false,
      handler: () => {
        try {
          if (selectedDropIndex !== null && selectedDropIndex > 0) {
            setSelectedDropIndex(selectedDropIndex - 1);
          }
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Zum vorherigen Drop navigieren'
    },
    {
      key: 'Escape',
      handler: () => {
        try {
          setSelectedDrops(new Set());
          setSelectedDropForDetails(null);
          setSelectedDropForEdit(null);
          setSelectedDropForStockUpdate(null);
          setShowShortcutsHelp(false);
          setSelectedDropIndex(null);
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Auswahl aufheben / Modals schließen'
    },
    {
      key: 'f',
      ctrl: true,
      meta: true,
      handler: () => {
        try {
          // Focus search input
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="Suche"], input[placeholder*="Drops"]') as HTMLInputElement;
          searchInput?.focus();
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Suche fokussieren'
    },
    {
      key: '/',
      ctrl: true,
      meta: true,
      handler: () => {
        try {
          setShowShortcutsHelp(!showShortcutsHelp);
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Keyboard Shortcuts Hilfe anzeigen'
    },
    {
      key: '?',
      ctrl: false,
      meta: false,
      handler: () => {
        try {
          setShowShortcutsHelp(!showShortcutsHelp);
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Keyboard Shortcuts Hilfe anzeigen'
    },
    {
      key: 'h',
      ctrl: true,
      meta: true,
      handler: () => {
        try {
          setShowShortcutsHelp(!showShortcutsHelp);
        } catch (error) {
          console.error('Error in keyboard shortcut handler:', error);
        }
      },
      description: 'Keyboard Shortcuts Hilfe anzeigen'
    }
  ].filter(shortcut => shortcut && shortcut.key && shortcut.handler), [selectedDrops, handleSelectAll, handleBulkAction, handleDuplicateDrop, filteredDrops, selectedDropIndex, selectedDropForEdit]);
  
  useKeyboardShortcuts(dropShortcuts, { enabled: true });

  // Handlers
  const handleDropSelect = useCallback((dropId: string, checked: boolean) => {
    startTransition(() => {
      setSelectedDrops(prev => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(dropId);
        } else {
          newSet.delete(dropId);
        }
        return newSet;
      });
    });
  }, []);

  const handleDropUpdate = useCallback(async (dropId: string, field: string, value: any) => {
    await measureAsync('drop_update', async () => {
      logger.logUserAction('drop_updated', { dropId, field, value });
      
      // Optimistic update
      const previousData = queryClient.getQueryData(queryKeys.drops.list({
        search: debouncedSearchTerm,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        limit: 100
      }));
      
      queryClient.setQueryData(
        queryKeys.drops.list({
          search: debouncedSearchTerm,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          limit: 100
        }),
        (old: any) => {
          if (!old?.data) return old;
          const data = Array.isArray(old.data) ? old.data : (old.data?.data || []);
          return {
            ...old,
            data: data.map((d: any) => d && d.id === dropId ? { ...d, [field]: value } : d)
          };
        }
      );
      
      try {
        await updateDropMutation.mutateAsync({
          id: dropId,
          data: { [field]: value }
        });
        // Only refetch for critical fields like stock
        if (field === 'totalStock' || field === 'variants') {
          refetchDrops();
        }
        toast.success('Drop aktualisiert', `Das Feld "${field}" wurde erfolgreich aktualisiert.`);
      } catch (error) {
        // Rollback on error
        queryClient.setQueryData(
          queryKeys.drops.list({
            search: debouncedSearchTerm,
            status: filterStatus !== 'all' ? filterStatus : undefined,
            limit: 100
          }),
          previousData
        );
        handleError(error, { operation: 'drop_update', dropId, field });
        toast.error('Fehler beim Aktualisieren', 'Der Drop konnte nicht aktualisiert werden.');
      }
    });
  }, [measureAsync, updateDropMutation, queryClient, debouncedSearchTerm, filterStatus, refetchDrops, handleError, toast]);

  // Enhanced Drag & Drop handlers with better visual feedback and touch support
  const handleDragStart = useCallback((e: React.DragEvent | React.TouchEvent, dropId: string) => {
    setDraggedDropId(dropId);
    
    // Handle both mouse and touch events
    if ('dataTransfer' in e) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dropId);
      
      // Create enhanced custom drag image
      const dragImage = document.createElement('div');
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      dragImage.style.padding = '12px 16px';
      dragImage.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.95), rgba(167, 139, 250, 0.95))';
      dragImage.style.border = '2px solid rgba(167, 139, 250, 0.8)';
      dragImage.style.borderRadius = '12px';
      dragImage.style.color = 'white';
      dragImage.style.fontSize = '14px';
      dragImage.style.fontWeight = '600';
      dragImage.style.backdropFilter = 'blur(10px)';
      dragImage.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.4)';
      dragImage.style.transform = 'rotate(-2deg)';
      dragImage.textContent = 'Drop wird verschoben...';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent | React.TouchEvent, index: number) => {
    e.preventDefault();
    if ('dataTransfer' in e) {
      e.dataTransfer.dropEffect = 'move';
    }
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    // Add small delay to prevent flickering
    setTimeout(() => {
      setDragOverIndex(null);
    }, 50);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent | React.TouchEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedDropId || !Array.isArray(filteredDrops) || filteredDrops.length === 0) {
      setDraggedDropId(null);
      return;
    }

    const draggedIndex = filteredDrops.findIndex(d => d && d.id === draggedDropId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedDropId(null);
      return;
    }

    // Reorder drops (optimistic update)
    const reordered = [...filteredDrops];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Save drop order to backend
    const dropIds = reordered.map(d => d.id);
    try {
      await measureAsync('drop_reorder', async () => {
        await reorderDropsMutation.mutateAsync(dropIds);
        logger.logUserAction('drop_reordered', { 
          dropId: draggedDropId, 
          fromIndex: draggedIndex, 
          toIndex: targetIndex 
        });
        // Update cache optimistically for reorder
        queryClient.setQueryData(
          queryKeys.drops.list({
            search: debouncedSearchTerm,
            status: filterStatus !== 'all' ? filterStatus : undefined,
            limit: 100
          }),
          (old: any) => {
            if (!old?.data) return old;
            const data = Array.isArray(old.data) ? old.data : (old.data?.data || []);
            return {
              ...old,
              data: reordered
            };
          }
        );
        toast.success('Reihenfolge aktualisiert', 'Die Drop-Reihenfolge wurde erfolgreich gespeichert.');
      });
    } catch (error) {
      handleError(error, { operation: 'drop_reorder', dropId: draggedDropId });
      toast.error('Fehler beim Sortieren', 'Die Reihenfolge konnte nicht gespeichert werden.');
      // Revert optimistic update on error
      refetchDrops();
    }

    setDraggedDropId(null);
  }, [draggedDropId, filteredDrops, reorderDropsMutation, measureAsync, handleError, queryClient, debouncedSearchTerm, filterStatus, refetchDrops, toast]);

  // Badge functions are now imported from dropBadges.tsx for better memoization

  // Error handling
  if (dropsError) {
    const errorMessage = dropsError instanceof Error 
      ? dropsError.message 
      : typeof dropsError === 'string' 
        ? dropsError 
        : 'Unbekannter Fehler';
    
    return (
      <Card className="p-12 text-center border-red-500/30 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <Zap className="w-32 h-32 text-red-400" />
          </div>
          <div className="relative space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              <AlertCircle className="w-20 h-20 mx-auto text-red-400 relative z-10 animate-bounce" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white">Drops konnten nicht geladen werden</h3>
              <p className="text-muted-foreground max-w-md mx-auto">{errorMessage}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => refetchDrops()} size="lg" className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800">
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Loading state with smooth transitions
  if (dropsLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} className="animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse border-white/5">
                <div className="flex items-center gap-4">
                  <Skeleton variant="rectangular" width={64} height={64} className="rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="30%" />
                    <Skeleton variant="text" width="60%" />
                    <div className="flex gap-2">
                      <Skeleton variant="rectangular" width={80} height={24} />
                      <Skeleton variant="rectangular" width={80} height={24} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="space-y-4 md:space-y-6">
        {/* Connection Status Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              realtime.isConnected 
                ? "bg-green-400 animate-pulse" 
                : "bg-red-400"
            )} />
            <span className="text-xs text-muted-foreground">
              {realtime.isConnected ? 'Echtzeit verbunden' : 'Echtzeit getrennt'}
            </span>
          </div>
          {!realtime.isConnected && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => realtime.forceReconnect?.()}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Verbinden
            </Button>
          )}
        </div>

        {/* Advanced Filters Component */}
        <DropFiltersComponent
          filters={advancedFilters}
          onFiltersChange={(newFilters) => {
            setAdvancedFilters(newFilters);
            // Sync with simple filters
            if (newFilters.status) setFilterStatus(newFilters.status);
            if (newFilters.access) setFilterAccess(newFilters.access);
          }}
          onReset={() => {
            setAdvancedFilters({
              status: [],
              access: [],
              stockLevel: 'all',
            });
            setFilterStatus([]);
            setFilterAccess([]);
          }}
          onSavePreset={(name, filters) => {
            // Save preset to localStorage
            try {
              const presets = JSON.parse(localStorage.getItem('drop-filter-presets') || '[]');
              presets.push({ id: Date.now().toString(), name, filters });
              localStorage.setItem('drop-filter-presets', JSON.stringify(presets));
              toast.success('Filter gespeichert', `Filter "${name}" wurde gespeichert.`);
            } catch (error) {
              console.warn('Failed to save preset:', error);
            }
          }}
          onLoadPreset={(filters) => {
            setAdvancedFilters(filters);
            if (filters.status) setFilterStatus(filters.status);
            if (filters.access) setFilterAccess(filters.access);
          }}
          onDeletePreset={(presetId) => {
            try {
              const presets = JSON.parse(localStorage.getItem('drop-filter-presets') || '[]');
              const filtered = presets.filter((p: any) => p.id !== presetId);
              localStorage.setItem('drop-filter-presets', JSON.stringify(filtered));
              toast.info('Filter gelöscht', 'Der Filter wurde gelöscht.');
            } catch (error) {
              console.warn('Failed to delete preset:', error);
            }
          }}
          presets={(() => {
            try {
              return JSON.parse(localStorage.getItem('drop-filter-presets') || '[]');
            } catch {
              return [];
            }
          })()}
        />

        {/* Modern Filter UI with Chips - Legacy (can be removed later) */}
        <div className="space-y-4">
          {/* Active Filters Display */}
          {(filterStatus.length > 0 || filterAccess.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 flex-wrap"
            >
              <span className="text-xs text-muted-foreground">Aktive Filter:</span>
              {filterStatus.map(status => (
                <motion.div
                  key={status}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                    onClick={() => setFilterStatus(filterStatus.filter(s => s !== status))}
                  >
                    {status.replace('_', ' ')}
                    <XCircle className="w-3 h-3 ml-1" />
                  </Badge>
                </motion.div>
              ))}
              {filterAccess.map(access => (
                <motion.div
                  key={access}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                    onClick={() => setFilterAccess(filterAccess.filter(a => a !== access))}
                  >
                    {access}
                    <XCircle className="w-3 h-3 ml-1" />
                  </Badge>
                </motion.div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStatus([]);
                  setFilterAccess([]);
                }}
                className="text-xs h-6 px-2"
              >
                Alle entfernen
              </Button>
            </motion.div>
          )}

          {/* Filter Chips - Mobile optimized */}
          <div className="flex items-center gap-2 md:gap-4 flex-wrap overflow-x-auto pb-2 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0 scrollbar-hide">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Status:</label>
              <div className="flex gap-2 flex-wrap">
                {['active', 'scheduled', 'sold_out', 'inactive'].map(status => {
                  const isActive = filterStatus.includes(status);
                  return (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (isActive) {
                          setFilterStatus(filterStatus.filter(s => s !== status));
                        } else {
                          setFilterStatus([...filterStatus, status]);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                        "border backdrop-blur-sm",
                        isActive
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/20"
                          : "bg-black/25 border-white/20 text-muted-foreground hover:bg-white/5 hover:border-white/30"
                      )}
                    >
                      {status.replace('_', ' ')}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Access:</label>
              <div className="flex gap-2 flex-wrap">
                {['free', 'limited', 'vip', 'standard'].map(access => {
                  const isActive = filterAccess.includes(access);
                  return (
                    <motion.button
                      key={access}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (isActive) {
                          setFilterAccess(filterAccess.filter(a => a !== access));
                        } else {
                          setFilterAccess([...filterAccess, access]);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                        "border backdrop-blur-sm",
                        isActive
                          ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/20"
                          : "bg-black/25 border-white/20 text-muted-foreground hover:bg-white/5 hover:border-white/30"
                      )}
                    >
                      {access}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Sortieren:</label>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-black/25 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                >
                  <option value="createdAt">Erstellungsdatum</option>
                  <option value="name">Name</option>
                  <option value="status">Status</option>
                  <option value="revenue">Umsatz</option>
                  <option value="interest">Interesse</option>
                  <option value="conversionRate">Conversion Rate</option>
                  <option value="stockLevel">Lagerbestand</option>
                </select>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="h-8 w-8 p-0"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Bulk Actions Bar */}
        <AnimatePresence>
          {selectedDrops.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-4 md:bottom-6 left-2 right-2 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-50 max-w-4xl mx-auto"
            >
              <Card className="p-3 md:p-4 bg-gradient-to-r from-purple-900/95 via-purple-800/95 to-purple-900/95 border-purple-500/50 backdrop-blur-xl shadow-2xl shadow-purple-500/50">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 md:w-5 md:h-5 text-purple-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">
                        {selectedDrops.size} Drop{selectedDrops.size !== 1 ? 's' : ''} ausgewählt
                      </div>
                      <div className="text-xs text-purple-200/70 hidden md:block">
                        Wähle eine Aktion aus
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        size="sm" 
                        onClick={() => handleBulkAction('activate')}
                        disabled={bulkActionMutation.isPending || updateDropMutation.isPending}
                        className="bg-green-600/90 hover:bg-green-600 border-green-500/50"
                      >
                        {bulkActionMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Aktivieren
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleBulkAction('deactivate')}
                        disabled={bulkActionMutation.isPending || updateDropMutation.isPending}
                        className="border-yellow-500/50 hover:bg-yellow-500/20"
                      >
                        {bulkActionMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-1" />
                        )}
                        Deaktivieren
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          if (confirm(`Möchtest du wirklich ${selectedDrops.size} Drop(s) löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
                            handleBulkAction('delete');
                          }
                        }}
                        disabled={bulkActionMutation.isPending || updateDropMutation.isPending}
                        className="border-red-500/50 hover:bg-red-500/20 text-red-300"
                      >
                        {bulkActionMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-1" />
                        )}
                        Löschen
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setSelectedDrops(new Set())}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        Abbrechen
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {dropsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Drops Grid - Optimized with virtual scrolling and pagination */}
        {!dropsLoading && (
          <div ref={containerRef}>
            {useVirtualScrolling ? (
              <VirtualizedDropGrid
                drops={paginatedDrops}
                selectedDrops={selectedDrops}
                onSelect={handleDropSelect}
                onEdit={(drop) => setSelectedDropForEdit(drop)}
                onDelete={handleDeleteDrop}
                onDuplicate={handleDuplicateDrop}
                onDetails={(drop) => setSelectedDropForDetails(drop)}
                onStockUpdate={(drop) => setSelectedDropForStockUpdate(drop)}
                onUpdate={handleDropUpdate}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                draggedDropId={draggedDropId}
                dragOverIndex={dragOverIndex}
                getStatusBadge={getStatusBadge}
                getAccessBadge={getAccessBadge}
                getPriorityBadge={getPriorityBadge}
                containerWidth={containerDimensions.width}
                containerHeight={containerDimensions.height}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 touch-pan-y">
                <AnimatePresence mode="popLayout">
                  {paginatedDrops.map((drop, index) => (
                    <DropCard
                      key={drop.id}
                      drop={drop}
                      isSelected={selectedDrops.has(drop.id)}
                      index={index}
                      onSelect={(checked) => handleDropSelect(drop.id, checked)}
                      onEdit={() => setSelectedDropForEdit(drop)}
                      onDelete={() => handleDeleteDrop(drop.id, drop.name)}
                      onDuplicate={() => handleDuplicateDrop(drop)}
                      onDetails={() => setSelectedDropForDetails(drop)}
                      onStockUpdate={() => setSelectedDropForStockUpdate(drop)}
                      onUpdate={(field, value) => handleDropUpdate(drop.id, field, value)}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      isDragging={draggedDropId === drop.id}
                      isDragOver={dragOverIndex === index}
                      getStatusBadge={getStatusBadge}
                      getAccessBadge={getAccessBadge}
                      getPriorityBadge={getPriorityBadge}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Pagination Controls for Grid - Only show if not using virtual scrolling */}
        {!useVirtualScrolling && filteredDrops.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Zeige {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, filteredDrops.length)} von {filteredDrops.length} Drops
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startTransition(() => setPage(p => Math.max(1, p - 1)))}
                disabled={page === 1 || isPending}
              >
                ← Zurück
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Seite {page} von {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startTransition(() => setPage(p => Math.min(totalPages, p + 1)))}
                disabled={page === totalPages || isPending}
              >
                Weiter →
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {dropsError && (
          <Card className="p-12 text-center bg-red-900/10 border-red-500/30">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-bold mb-2 text-red-400">Fehler beim Laden</h3>
            <p className="text-muted-foreground mb-6">
              {dropsError instanceof Error ? dropsError.message : 'Ein Fehler ist aufgetreten'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => refetchDrops()}
                className="border-red-500/50 hover:bg-red-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!dropsLoading && !dropsError && filteredDrops.length === 0 && (
          <Card className="p-16 text-center bg-gradient-to-b from-slate-900/50 to-slate-950/50 border-dashed border-2 border-white/10 animate-in fade-in-50 duration-500">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <Zap className="w-48 h-48" />
              </div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/10 mb-6 animate-pulse">
                  <Zap className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Keine Drops gefunden</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {debouncedSearchTerm || filterStatus.length > 0 || filterAccess.length > 0
                    ? 'Versuche deine Filter oder Suchbegriffe anzupassen'
                    : 'Beginne mit dem Erstellen deines ersten Drops'}
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {(debouncedSearchTerm || filterStatus.length > 0 || filterAccess.length > 0) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterStatus([]);
                        setFilterAccess([]);
                      }}
                      className="hover:bg-white/10 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Filter zurücksetzen
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      // Handle create drop
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Neuen Drop erstellen
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Modern Filter UI with Chips */}
      <div className="space-y-4">
        {/* Active Filters Display */}
        {(filterStatus.length > 0 || filterAccess.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-xs text-muted-foreground">Aktive Filter:</span>
            {filterStatus.map(status => (
              <motion.div
                key={status}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                  onClick={() => setFilterStatus(filterStatus.filter(s => s !== status))}
                >
                  {status.replace('_', ' ')}
                  <XCircle className="w-3 h-3 ml-1" />
                </Badge>
              </motion.div>
            ))}
            {filterAccess.map(access => (
              <motion.div
                key={access}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
                  onClick={() => setFilterAccess(filterAccess.filter(a => a !== access))}
                >
                  {access}
                  <XCircle className="w-3 h-3 ml-1" />
                </Badge>
              </motion.div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus([]);
                setFilterAccess([]);
              }}
              className="text-xs h-6 px-2"
            >
              Alle entfernen
            </Button>
          </motion.div>
        )}

        {/* Filter Chips */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Status:</label>
            <div className="flex gap-2 flex-wrap">
              {['active', 'scheduled', 'sold_out', 'inactive'].map(status => {
                const isActive = filterStatus.includes(status);
                return (
                  <motion.button
                    key={status}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isActive) {
                        setFilterStatus(filterStatus.filter(s => s !== status));
                      } else {
                        setFilterStatus([...filterStatus, status]);
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                      "border backdrop-blur-sm",
                      isActive
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/20"
                        : "bg-black/25 border-white/20 text-muted-foreground hover:bg-white/5 hover:border-white/30"
                    )}
                  >
                    {status.replace('_', ' ')}
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Access:</label>
            <div className="flex gap-2 flex-wrap">
              {['free', 'limited', 'vip', 'standard'].map(access => {
                const isActive = filterAccess.includes(access);
                return (
                  <motion.button
                    key={access}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (isActive) {
                        setFilterAccess(filterAccess.filter(a => a !== access));
                      } else {
                        setFilterAccess([...filterAccess, access]);
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                      "border backdrop-blur-sm",
                      isActive
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/20"
                        : "bg-black/25 border-white/20 text-muted-foreground hover:bg-white/5 hover:border-white/30"
                    )}
                  >
                    {access}
                  </motion.button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">Sortieren:</label>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-black/25 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              >
                <option value="createdAt">Erstellungsdatum</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="revenue">Umsatz</option>
                <option value="interest">Interesse</option>
                <option value="conversionRate">Conversion Rate</option>
                <option value="stockLevel">Lagerbestand</option>
              </select>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-8 w-8 p-0"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Drops Table */}
      <Card>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          {useVirtualTableScrolling ? (
            <div className="relative" style={{ height: containerDimensions.height }}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedDrops.size === filteredDrops.length && filteredDrops.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-white/20 bg-black/25"
                      />
                    </TableHead>
                    <TableHead>Drop</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Zugriff</TableHead>
                    <TableHead>Bestand</TableHead>
                    <TableHead>Verkauft</TableHead>
                    <TableHead>Umsatz</TableHead>
                    <TableHead>Interesse</TableHead>
                    <TableHead className="w-12">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              <div className="overflow-auto" style={{ height: containerDimensions.height - 60 }}>
                <VirtualizedList
                  items={paginatedDrops}
                  renderItem={(drop, index) => (
                    <div key={drop.id} className="border-b border-white/10">
                      <Table>
                        <TableBody>
                          <TableRow 
                            className={cn(
                              "hover:bg-white/5 transition-colors",
                              draggedDropId === drop.id && "opacity-50",
                              dragOverIndex === index && "bg-purple-500/20 border-purple-500"
                            )}
                            draggable
                            onDragStart={(e) => handleDragStart(e, drop.id)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                          >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="cursor-move text-muted-foreground hover:text-purple-400 transition-colors"
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            handleDragStart(e, drop.id);
                          }}
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedDrops.has(drop.id)}
                          onChange={(e) => handleDropSelect(drop.id, e.target.checked)}
                          className="rounded border-white/20 bg-black/25"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium mb-1">
                            <InlineEdit
                              value={drop.name}
                              onSave={(newName) => handleDropUpdate(drop.id, 'name', newName)}
                              className="font-medium"
                              validate={(val) => val.length < 2 ? 'Name muss mindestens 2 Zeichen lang sein' : null}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground mb-1">
                            <InlineEdit
                              value={drop.description || ''}
                              onSave={(newDesc) => handleDropUpdate(drop.id, 'description', newDesc)}
                              type="textarea"
                              rows={2}
                              className="text-sm text-muted-foreground"
                              placeholder="Beschreibung hinzufügen..."
                            />
                          </div>
                          {drop.badge && (
                            <div className="mt-1">
                              <InlineEdit
                                value={drop.badge}
                                onSave={(newBadge) => handleDropUpdate(drop.id, 'badge', newBadge)}
                                type="text"
                                className="text-xs"
                                placeholder="Badge..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <InlineEdit
                        value={drop.status || 'active'}
                        onSave={(newStatus) => handleDropUpdate(drop.id, 'status', newStatus)}
                        type="select"
                        options={[
                          { value: 'active', label: 'Aktiv' },
                          { value: 'inactive', label: 'Inaktiv' },
                          { value: 'scheduled', label: 'Geplant' },
                          { value: 'sold_out', label: 'Ausverkauft' }
                        ]}
                        className="min-w-[100px]"
                      />
                    </TableCell>
                    <TableCell>
                      <InlineEdit
                        value={drop.access || 'standard'}
                        onSave={(newAccess) => handleDropUpdate(drop.id, 'access', newAccess)}
                        type="select"
                        options={[
                          { value: 'free', label: 'Kostenlos' },
                          { value: 'limited', label: 'Limitiert' },
                          { value: 'vip', label: 'VIP' },
                          { value: 'standard', label: 'Standard' }
                        ]}
                        className="min-w-[100px]"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-semibold text-neon">{drop.totalStock || 0}</div>
                        <div className="text-xs text-muted-foreground">
                          {Array.isArray(drop.variants) ? drop.variants.length : 0} Varianten
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-400">{drop.soldCount || 0}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-400">€{(drop.revenue || 0).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-semibold text-blue-400">{drop.interestCount || 0}</div>
                        <div className="text-xs text-muted-foreground">
                          {(drop.conversionRate || 0).toFixed(1)}% Konv.
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setSelectedDropForDetails(drop)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Details anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedDropForEdit(drop)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Drop bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateDrop(drop)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplizieren
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDropUpdate(drop.id, 'status', drop.status === 'active' ? 'inactive' : 'active')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Status umschalten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            const newAccess = drop.access === 'free' ? 'limited' : drop.access === 'limited' ? 'vip' : drop.access === 'vip' ? 'standard' : 'free';
                            handleDropUpdate(drop.id, 'access', newAccess);
                          }}>
                            <Lock className="w-4 h-4 mr-2" />
                            Zugriff ändern
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedDropForStockUpdate(drop)}>
                            <Package className="w-4 h-4 mr-2" />
                            Bestand aktualisieren
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-400"
                            onClick={() => {
                              if (confirm(`Möchtest du "${drop.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
                                handleBulkAction('delete');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  )}
                  itemHeight={120}
                  containerHeight={containerDimensions.height - 60}
                  overscan={5}
                  keyExtractor={(drop) => drop.id}
                  emptyMessage="Keine Drops gefunden"
                />
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedDrops.size === filteredDrops.length && filteredDrops.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-white/20 bg-black/25"
                    />
                  </TableHead>
                  <TableHead>Drop</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zugriff</TableHead>
                  <TableHead>Bestand</TableHead>
                  <TableHead>Verkauft</TableHead>
                  <TableHead>Umsatz</TableHead>
                  <TableHead>Interesse</TableHead>
                  <TableHead className="w-12">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDrops.map((drop, index) => (
                <TableRow 
                  key={drop.id} 
                  className={cn(
                    "hover:bg-white/5 transition-colors",
                    draggedDropId === drop.id && "opacity-50",
                    dragOverIndex === index && "bg-purple-500/20 border-purple-500"
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, drop.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="cursor-move text-muted-foreground hover:text-purple-400 transition-colors"
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, drop.id);
                        }}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedDrops.has(drop.id)}
                        onChange={(e) => handleDropSelect(drop.id, e.target.checked)}
                        className="rounded border-white/20 bg-black/25"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1">
                          <InlineEdit
                            value={drop.name}
                            onSave={(newName) => handleDropUpdate(drop.id, 'name', newName)}
                            className="font-medium"
                            validate={(val) => val.length < 2 ? 'Name muss mindestens 2 Zeichen lang sein' : null}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          <InlineEdit
                            value={drop.description || ''}
                            onSave={(newDesc) => handleDropUpdate(drop.id, 'description', newDesc)}
                            type="textarea"
                            rows={2}
                            className="text-sm text-muted-foreground"
                            placeholder="Beschreibung hinzufügen..."
                          />
                        </div>
                        {drop.badge && (
                          <div className="mt-1">
                            <InlineEdit
                              value={drop.badge}
                              onSave={(newBadge) => handleDropUpdate(drop.id, 'badge', newBadge)}
                              type="text"
                              className="text-xs"
                              placeholder="Badge..."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      value={drop.status || 'active'}
                      onSave={(newStatus) => handleDropUpdate(drop.id, 'status', newStatus)}
                      type="select"
                      options={[
                        { value: 'active', label: 'Aktiv' },
                        { value: 'inactive', label: 'Inaktiv' },
                        { value: 'scheduled', label: 'Geplant' },
                        { value: 'sold_out', label: 'Ausverkauft' }
                      ]}
                      className="min-w-[100px]"
                    />
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      value={drop.access || 'standard'}
                      onSave={(newAccess) => handleDropUpdate(drop.id, 'access', newAccess)}
                      type="select"
                      options={[
                        { value: 'free', label: 'Kostenlos' },
                        { value: 'limited', label: 'Limitiert' },
                        { value: 'vip', label: 'VIP' },
                        { value: 'standard', label: 'Standard' }
                      ]}
                      className="min-w-[100px]"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-semibold text-neon">{drop.totalStock || 0}</div>
                      <div className="text-xs text-muted-foreground">
                        {Array.isArray(drop.variants) ? drop.variants.length : 0} Varianten
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-400">{drop.soldCount || 0}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-400">€{(drop.revenue || 0).toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-semibold text-blue-400">{drop.interestCount || 0}</div>
                      <div className="text-xs text-muted-foreground">
                        {(drop.conversionRate || 0).toFixed(1)}% Konv.
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setSelectedDropForDetails(drop)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Details anzeigen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedDropForEdit(drop)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Drop bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateDrop(drop)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplizieren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDropUpdate(drop.id, 'status', drop.status === 'active' ? 'inactive' : 'active')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Status umschalten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const newAccess = drop.access === 'free' ? 'limited' : drop.access === 'limited' ? 'vip' : drop.access === 'vip' ? 'standard' : 'free';
                          handleDropUpdate(drop.id, 'access', newAccess);
                        }}>
                          <Lock className="w-4 h-4 mr-2" />
                          Zugriff ändern
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSelectedDropForStockUpdate(drop)}>
                          <Package className="w-4 h-4 mr-2" />
                          Bestand aktualisieren
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-400"
                          onClick={() => {
                            if (confirm(`Möchtest du "${drop.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
                              handleBulkAction('delete');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </div>

        {/* Pagination Controls for Table - Only show if not using virtual scrolling */}
        {!useVirtualTableScrolling && filteredDrops.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-4 px-4 py-3 border-t border-white/10">
            <div className="text-sm text-muted-foreground">
              Zeige {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, filteredDrops.length)} von {filteredDrops.length} Drops
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startTransition(() => setPage(p => Math.max(1, p - 1)))}
                disabled={page === 1 || isPending}
              >
                ← Zurück
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Seite {page} von {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startTransition(() => setPage(p => Math.min(totalPages, p + 1)))}
                disabled={page === totalPages || isPending}
              >
                Weiter →
              </Button>
            </div>
          </div>
        )}

        {filteredDrops.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Keine Drops gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Versuche deine Filter oder Suchbegriffe anzupassen
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Neuen Drop erstellen
            </Button>
          </div>
        )}
      </Card>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={dropShortcuts.map(s => ({
          key: s.key,
          ctrl: s.ctrl,
          meta: s.meta,
          description: s.description
        }))}
      />

      {/* Optimized Suspense fallback - lighter component */}
      {(() => {
        const ModalFallback = () => (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        );

        return (
          <>
            {selectedDropForDetails && (
              <Suspense fallback={<ModalFallback />}>
                <DropDetailsModal
                  isOpen={!!selectedDropForDetails}
                  onClose={() => setSelectedDropForDetails(null)}
                  drop={selectedDropForDetails}
                />
              </Suspense>
            )}

            {selectedDropForEdit && (
              <Suspense fallback={<ModalFallback />}>
                <EditDropModal
                  isOpen={!!selectedDropForEdit}
                  onClose={() => setSelectedDropForEdit(null)}
                  drop={selectedDropForEdit}
                  onSuccess={() => {
                    refetchDrops();
                    setSelectedDropForEdit(null);
                  }}
                />
              </Suspense>
            )}

            {selectedDropForStockUpdate && (
              <Suspense fallback={<ModalFallback />}>
                <StockUpdateModal
                  isOpen={!!selectedDropForStockUpdate}
                  onClose={() => setSelectedDropForStockUpdate(null)}
                  drop={selectedDropForStockUpdate}
                  onSave={(variants) => {
                    handleDropUpdate(selectedDropForStockUpdate.id, 'variants', variants);
                    setSelectedDropForStockUpdate(null);
                  }}
                />
              </Suspense>
            )}
          </>
        );
      })()}
    </div>
  );
}












































