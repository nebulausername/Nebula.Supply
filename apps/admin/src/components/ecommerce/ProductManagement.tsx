import React, { useState, useCallback, useMemo, memo, useTransition, startTransition, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { InlineEdit } from '../ui/InlineEdit';
import { ImagePicker } from '../media/ImagePicker';
import { 
  ShoppingBag, 
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
  Package,
  Tag,
  Euro,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Crown,
  Lock,
  Globe,
  RefreshCw,
  GripVertical,
  Upload,
  Download,
  WifiOff
} from 'lucide-react';
import { useProducts, useDeleteProduct, useUpdateProduct, useDuplicateProduct, useCategories } from '../../lib/api/shopHooks';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/api/hooks';
import { ProductEditor } from './ProductEditor';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { BulkEditModal } from './BulkEditModal';
import { BulkImportModal } from './BulkImportModal';
import { BulkExportModal } from './BulkExportModal';
import { ProductCard } from './ProductCard';
// Lazy load heavy components for better initial load performance
const VirtualizedProductGrid = React.lazy(() => import('./VirtualizedProductGrid').then(module => ({ default: module.VirtualizedProductGrid })));
const VirtualizedProductTable = React.lazy(() => import('./VirtualizedProductTable').then(module => ({ default: module.VirtualizedProductTable })));
import type { Product } from '../../lib/api/ecommerce';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';
import { SkeletonCard, SkeletonTableRow } from '../ui/Skeleton';
import { getErrorSolution } from '../../lib/utils/errorMessages';
import { NetworkMonitor } from '../../lib/utils/offlineCache';
import { useRealtimeShop } from '../../lib/websocket/useRealtimeShop';
import { useAdvancedSearch } from '../../lib/hooks/useAdvancedSearch';
import { QuickFilters } from './QuickFilters';
import { AdvancedFilters, AdvancedFilterState } from './AdvancedFilters';
import { useKeyboardShortcuts } from '../../lib/hooks/useKeyboardShortcuts';
import { CommandPalette, CommandAction } from './CommandPalette';
import { ProductSyncStatus } from './ProductSyncStatus';
import { useToast } from '../ui/Toast';
import { extractBrands, findBrandForCategory, findModelForCategory, filterProductsByBrands, getBrandColor } from '../../lib/utils/brandUtils';

interface ProductManagementProps {
  viewMode: 'grid' | 'list';
  searchTerm: string;
}

export const ProductManagement = memo(({ viewMode, searchTerm }: ProductManagementProps) => {
  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('ProductManagement');
  const { handleError } = useErrorHandler('ProductManagement');
  const { showToast } = useToast();

  // Debounce search term to reduce API calls - optimized for faster response
  const debouncedSearchTerm = useDebounce(searchTerm, 200); // Optimized from 250ms to 200ms
  
  // Use transition for non-urgent updates (smooth UI)
  const [isPending, startTransition] = useTransition();

  // State management - All states declared before useEffect
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'inventory' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBrandIds, setFilterBrandIds] = useState<string[]>([]);
  const [groupByBrand, setGroupByBrand] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState<Product | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isBulkExportOpen, setIsBulkExportOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({
    priceRange: { min: null, max: null },
    categories: [],
    statuses: [],
    accessLevels: [],
    dateRange: { start: null, end: null },
    sortBy: 'name',
    sortOrder: 'asc',
    customSort: undefined,
  });
  
  // Reset page when filters change
  React.useEffect(() => {
    startTransition(() => {
      setPage(1);
    });
  }, [filterCategory, filterStatus, debouncedSearchTerm, sortBy, sortOrder]);

  // API hooks - use debounced search term
  const {
    data: productsResponse,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useProducts({
    categoryId: filterCategory !== 'all' ? filterCategory : undefined,
    search: debouncedSearchTerm,
    sortBy,
    sortOrder,
    status: filterStatus !== 'all' ? [filterStatus] : undefined,
  });

  const { data: categoriesResponse } = useCategories();
  
  // Extract products array
  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : [];
  const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];
  
  // Extract brands for filtering
  const brands = useMemo(() => {
    if (!categories.length) return [];
    return extractBrands(categories, products);
  }, [categories, products]);
  
  const deleteProductMutation = useDeleteProduct();
  const updateProductMutation = useUpdateProduct();
  const duplicateProductMutation = useDuplicateProduct();
  const queryClient = useQueryClient();

  // Real-time WebSocket integration for live updates - memoized callbacks for performance
  const invalidateProducts = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient]);

  const invalidateInventory = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
  }, [queryClient]);

  useRealtimeShop({
    enabled: true,
    channels: ['products', 'inventory'],
    onProductCreated: invalidateProducts,
    onProductUpdated: invalidateProducts,
    onProductDeleted: invalidateProducts,
    onInventoryEvent: () => {
      invalidateProducts();
      invalidateInventory();
    },
  });

  // Process products data - optimized with category map for O(1) lookup
  const categoryMap = useMemo(() => {
    if (!Array.isArray(categories)) return new Map();
    const map = new Map();
    categories.forEach(cat => {
      if (cat && cat.id) {
        map.set(cat.id, cat);
      }
    });
    return map;
  }, [categories]);

  const processedProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    
    return products.map(product => {
      if (!product || !product.id) return null;
      const category = categoryMap.get(product.categoryId);
      return {
        ...product,
        categoryName: category?.name || 'Unknown',
        categoryIcon: category?.icon || '📦',
        totalVariants: Array.isArray(product.variants) ? product.variants.length : 0,
        totalStock: product.inventory ?? 0,
        isLowStock: (product.inventory ?? 0) > 0 && (product.inventory ?? 0) < 10,
        isOutOfStock: (product.inventory ?? 0) === 0,
        isFeatured: product.featured === true,
        isActive: product.status === 'active',
        lastUpdated: product.updatedAt || product.createdAt || new Date().toISOString()
      };
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [products, categoryMap]);

  // Advanced search with fuzzy matching and quick filters
  const {
    searchTerm: advancedSearchTerm,
    setSearchTerm: setAdvancedSearchTerm,
    quickFilter,
    setQuickFilter,
    filteredItems: fuzzyFilteredProducts,
    clearFilters: clearAdvancedFilters,
  } = useAdvancedSearch(processedProducts, {
    searchFields: ['name', 'description', 'sku', (p: Product & { categoryName?: string }) => p.categoryName || ''],
    threshold: 0.6,
    enableFuzzySearch: true,
    enableSavedSearches: true,
    storageKey: 'product_management',
  });
  
  // Combine API search with fuzzy search
  const effectiveSearchTerm = debouncedSearchTerm || advancedSearchTerm;

  // Products are already filtered by API, apply fuzzy search, quick filters, and advanced filters on top
  // Memoized for performance - only recalculate when dependencies change
  const filteredProducts = useMemo(() => {
    let result = processedProducts;
    
    // Apply fuzzy search if active
    if (advancedSearchTerm && fuzzyFilteredProducts.length > 0) {
      result = fuzzyFilteredProducts;
    }
    
    // Apply quick filter - optimized with early returns
    if (quickFilter) {
      switch (quickFilter) {
        case 'lowStock':
          result = result.filter(p => (p.inventory || 0) > 0 && (p.inventory || 0) < 20);
          break;
        case 'outOfStock':
          result = result.filter(p => (p.inventory || 0) === 0);
          break;
        case 'featured':
          result = result.filter(p => p.isFeatured);
          break;
        case 'active':
          result = result.filter(p => p.isActive);
          break;
        case 'inactive':
          result = result.filter(p => !p.isActive);
          break;
        case 'highStock':
          result = result.filter(p => (p.inventory || 0) >= 50);
          break;
        case 'recent':
          result = result.filter(p => {
            if (!p.updatedAt) return false;
            const updated = new Date(p.updatedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return updated > weekAgo;
          });
          break;
        default:
          break;
      }
    }
    
    // Apply advanced filters - optimized with early returns
    // Price range
    const hasPriceFilter = advancedFilters.priceRange.min !== null || advancedFilters.priceRange.max !== null;
    if (hasPriceFilter) {
      const min = advancedFilters.priceRange.min ?? 0;
      const max = advancedFilters.priceRange.max ?? Infinity;
      result = result.filter(p => {
        const price = p.price ?? 0;
        return price >= min && price <= max;
      });
    }
    
    // Multi-select categories - use Set for O(1) lookup
    if (advancedFilters.categories.length > 0) {
      const categorySet = new Set(advancedFilters.categories);
      result = result.filter(p => p.categoryId && categorySet.has(p.categoryId));
    }
    
    // Multi-select statuses - use Set for O(1) lookup
    if (advancedFilters.statuses.length > 0) {
      const statusSet = new Set(advancedFilters.statuses);
      result = result.filter(p => p.status && statusSet.has(p.status));
    }
    
    // Multi-select access levels - use Set for O(1) lookup
    if (advancedFilters.accessLevels && advancedFilters.accessLevels.length > 0) {
      const accessSet = new Set(advancedFilters.accessLevels);
      result = result.filter(p => {
        const productAccess = p.access || 'standard';
        return accessSet.has(productAccess);
      });
    }
    
    // Brand filter
    if (filterBrandIds.length > 0 && categoriesResponse?.data) {
      const brandProducts = filterProductsByBrands(result, filterBrandIds, categoriesResponse.data);
      result = brandProducts;
    }
    
    // Date range - optimized with early returns
    if (advancedFilters.dateRange.start || advancedFilters.dateRange.end) {
      result = result.filter(p => {
        const createdAt = p.createdAt || p.updatedAt;
        if (!createdAt) return false; // Skip products without dates
        
        const createdAtDate = new Date(createdAt);
        if (isNaN(createdAtDate.getTime())) return false; // Invalid date
        
        const start = advancedFilters.dateRange.start ? new Date(advancedFilters.dateRange.start) : null;
        const end = advancedFilters.dateRange.end ? new Date(advancedFilters.dateRange.end) : null;
        
        if (start && !isNaN(start.getTime()) && createdAtDate < start) return false;
        if (end && !isNaN(end.getTime())) {
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          if (createdAtDate > endDate) return false;
        }
        return true;
      });
    }
    
    // Custom sorting - optimized with early returns and null checks
    // Pre-compute sort values to avoid repeated calculations
    if (advancedFilters.customSort) {
      const sortType = advancedFilters.customSort;
      
      // Pre-process products with sort values for better performance
      const productsWithSortValues = result.map(p => {
        let sortValue: number = 0;
        
        switch (sortType) {
          case 'lowStockFirst':
            sortValue = p.inventory ?? 0;
            break;
          case 'highStockFirst':
            sortValue = -(p.inventory ?? 0); // Negate for descending
            break;
          case 'recentlyUpdated':
            sortValue = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
            break;
          case 'recentlyCreated':
            sortValue = p.createdAt ? new Date(p.createdAt).getTime() : 0;
            break;
          case 'priceLowToHigh':
            sortValue = p.price ?? 0;
            break;
          case 'priceHighToLow':
            sortValue = -(p.price ?? 0); // Negate for descending
            break;
          default:
            sortValue = 0;
        }
        
        return { product: p, sortValue };
      });
      
      // Sort by pre-computed values
      productsWithSortValues.sort((a, b) => {
        // Handle NaN values
        if (isNaN(a.sortValue) || isNaN(b.sortValue)) {
          return isNaN(a.sortValue) ? 1 : -1;
        }
        return b.sortValue - a.sortValue; // Descending by default (most recent/highest first)
      });
      
      // Extract sorted products
      result = productsWithSortValues.map(item => item.product);
    }
    
    return result;
  }, [processedProducts, fuzzyFilteredProducts, advancedSearchTerm, quickFilter, advancedFilters]);
  
  // Reduced pagination for better performance - use virtual scrolling for large lists
  // Optimized thresholds based on view mode and device performance
  const itemsPerPage = useMemo(() => viewMode === 'grid' ? 12 : 50, [viewMode]);
  const VIRTUAL_SCROLL_THRESHOLD_GRID = 40; // Lower threshold for grid (more items per view)
  const VIRTUAL_SCROLL_THRESHOLD_LIST = 80; // Higher threshold for list (less items per view)
  const useVirtualScrolling = useMemo(() => 
    filteredProducts.length > VIRTUAL_SCROLL_THRESHOLD_GRID && viewMode === 'grid',
    [filteredProducts.length, viewMode]
  );
  const useVirtualTableScrolling = useMemo(() => 
    filteredProducts.length > VIRTUAL_SCROLL_THRESHOLD_LIST && viewMode === 'list',
    [filteredProducts.length, viewMode]
  );
  
  const paginatedProducts = useMemo(() => {
    if (useVirtualScrolling && viewMode === 'grid') {
      // Return all products for virtual scrolling
      return filteredProducts;
    }
    if (useVirtualTableScrolling && viewMode === 'list') {
      // Return all products for virtual table scrolling
      return filteredProducts;
    }
    const start = (page - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, page, itemsPerPage, viewMode, useVirtualScrolling, useVirtualTableScrolling]);
  
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handlers - Optimized with transitions and Shift-Click support
  const lastSelectedIndexRef = useRef<number | null>(null);
  
  const handleProductSelect = useCallback((productId: string, checked: boolean, event?: React.MouseEvent) => {
    startTransition(() => {
      setSelectedProducts(prev => {
        const newSet = new Set(prev);
        
        // Shift-Click support for range selection
        if (event?.shiftKey && lastSelectedIndexRef.current !== null && checked) {
          const currentIndex = filteredProducts.findIndex(p => p && p.id === productId);
          if (currentIndex !== -1) {
            const start = Math.min(lastSelectedIndexRef.current, currentIndex);
            const end = Math.max(lastSelectedIndexRef.current, currentIndex);
            
            for (let i = start; i <= end; i++) {
              const product = filteredProducts[i];
              if (product && product.id) {
                newSet.add(product.id);
              }
            }
          }
        } else {
          if (checked) {
            newSet.add(productId);
            // Store index for Shift-Click
            const index = filteredProducts.findIndex(p => p && p.id === productId);
            if (index !== -1) {
              lastSelectedIndexRef.current = index;
            }
          } else {
            newSet.delete(productId);
            lastSelectedIndexRef.current = null;
          }
        }
        
        return newSet;
      });
    });
  }, [filteredProducts]);

  const handleSelectAll = useCallback((checked: boolean) => {
    startTransition(() => {
      if (checked) {
        setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
      } else {
        setSelectedProducts(new Set());
      }
    });
  }, [paginatedProducts]);

  const handleProductUpdate = useCallback(async (productId: string, field: string, value: string | number | boolean | null) => {
    // Validate inputs
    if (!productId || typeof productId !== 'string') {
      handleError(new Error('Ungültige Produkt-ID'), { operation: 'product_update' });
      showToast({
        type: 'error',
        title: 'Fehler',
        message: 'Ungültige Produkt-ID'
      });
      return;
    }
    
    if (!field || typeof field !== 'string') {
      handleError(new Error('Ungültiges Feld'), { operation: 'product_update', productId });
      showToast({
        type: 'error',
        title: 'Fehler',
        message: 'Ungültiges Feld'
      });
      return;
    }
    
    // Sanitize value based on field type
    let sanitizedValue = value;
    if (field === 'price' || field === 'inventory') {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      sanitizedValue = isNaN(numValue) ? 0 : numValue;
    } else if (field === 'featured') {
      sanitizedValue = value === true || value === 'true' || value === 1;
    } else if (typeof value === 'string') {
      sanitizedValue = value.trim();
    }
    
    // Optimistic update for instant UI feedback - update cache immediately
    const product = products.find(p => p && p.id === productId);
    if (product) {
      // Immediately update the cache for instant UI reflection
      queryClient.setQueryData(queryKeys.products.list(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((p: Product) => 
            p.id === productId ? { ...p, [field]: sanitizedValue } : p
          )
        };
      });
    }
    
    // Optimistic update for instant UI feedback
    startTransition(() => {
      // UI updates immediately via cache update above
    });
    
    await measureAsync('product_update', async () => {
      logger.logUserAction('product_updated', { productId, field, value: sanitizedValue });
      try {
        await updateProductMutation.mutateAsync({
          id: productId,
          product: { [field]: sanitizedValue }
        });
        
        // Show success toast
        const fieldLabels: Record<string, string> = {
          price: 'Preis',
          inventory: 'Lagerbestand',
          name: 'Name',
          description: 'Beschreibung',
          categoryId: 'Kategorie',
          status: 'Status',
          featured: 'Featured',
          access: 'Zugriff'
        };
        
        showToast({
          type: 'success',
          title: 'Erfolgreich aktualisiert',
          message: `${fieldLabels[field] || field} wurde aktualisiert`
        });
      } catch (error) {
        // Rollback optimistic update on error
        if (product) {
          queryClient.setQueryData(queryKeys.products.list(), (old: { data?: Product[] } | undefined) => {
            if (!old?.data) return old;
            return {
              ...old,
              data: old.data.map((p: Product) => 
                p.id === productId ? product : p
              )
            };
          });
        }
        
        handleError(error, { operation: 'product_update', productId, field });
        showToast({
          type: 'error',
          title: 'Fehler',
          message: error instanceof Error ? error.message : 'Update fehlgeschlagen'
        });
      }
    });
  }, [measureAsync, updateProductMutation, handleError, showToast, products, queryClient]);

  const handleBulkAction = useCallback(async (action: string) => {
    const productIds = Array.from(selectedProducts);
    if (productIds.length === 0) return;

    await measureAsync('bulk_action', async () => {
      logger.logUserAction('bulk_action', { action, productIds, count: productIds.length });
      
      // Optimistic update - update UI immediately
      startTransition(() => {
        if (action === 'delete') {
          queryClient.setQueryData(queryKeys.products.list(), (old: { data?: Product[] } | undefined) => {
            if (!old?.data) return old;
            return {
              ...old,
              data: old.data.filter((p: Product) => !productIds.includes(p.id))
            };
          });
        } else if (action === 'activate' || action === 'deactivate') {
          const newStatus = action === 'activate' ? 'active' : 'inactive';
          queryClient.setQueryData(queryKeys.products.list(), (old: { data?: Product[] } | undefined) => {
            if (!old?.data) return old;
            return {
              ...old,
              data: old.data.map((p: Product) => 
                productIds.includes(p.id) ? { ...p, status: newStatus } : p
              )
            };
          });
        }
      });

      try {
        const BATCH_SIZE = 10; // Process in batches of 10 for better performance
        
        if (action === 'delete') {
          // Batch delete operations
          for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
            const batch = productIds.slice(i, i + BATCH_SIZE);
            await Promise.allSettled(
              batch.map(productId => deleteProductMutation.mutateAsync(productId))
            );
          }
          setSelectedProducts(new Set());
          showToast({
            type: 'success',
            title: 'Erfolgreich',
            message: `${productIds.length} Produkt${productIds.length !== 1 ? 'e' : ''} gelöscht`
          });
        } else if (action === 'activate' || action === 'deactivate') {
          const newStatus = action === 'activate' ? 'active' : 'inactive';
          // Batch update operations
          for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
            const batch = productIds.slice(i, i + BATCH_SIZE);
            await Promise.allSettled(
              batch.map(productId => updateProductMutation.mutateAsync({
                id: productId,
                product: { status: newStatus }
              }))
            );
          }
          showToast({
            type: 'success',
            title: 'Erfolgreich',
            message: `${productIds.length} Produkt${productIds.length !== 1 ? 'e' : ''} ${action === 'activate' ? 'aktiviert' : 'deaktiviert'}`
          });
        }
        
        // Invalidate queries to sync with server
        queryClient.invalidateQueries({ queryKey: queryKeys.products.list() });
      } catch (error) {
        // Rollback optimistic update on error
        await refetchProducts();
        handleError(error, { operation: 'bulk_action', action });
        showToast({
          type: 'error',
          title: 'Fehler',
          message: `Bulk-Aktion fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        });
      }
    });
  }, [selectedProducts, measureAsync, deleteProductMutation, updateProductMutation, refetchProducts, handleError, showToast, queryClient, startTransition]);

  const handleCreateProduct = () => {
    setEditorMode('create');
    setEditingProduct(undefined);
    setIsEditorOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    // Validate product before editing
    if (!product || !product.id) {
      handleError(new Error('Ungültiges Produkt zum Bearbeiten'), { operation: 'product_edit' });
      return;
    }
    
    // Ensure product has required fields
    if (!product.name || !product.categoryId) {
      handleError(new Error('Produkt hat fehlende erforderliche Felder'), { operation: 'product_edit', productId: product.id });
      return;
    }
    
    // Ensure all arrays are properly initialized
    const safeProduct: Product = {
      ...product,
      variants: Array.isArray(product.variants) ? product.variants : [],
      media: Array.isArray(product.media) ? product.media : [],
      badges: Array.isArray(product.badges) ? product.badges : [],
      price: typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0,
      inventory: typeof product.inventory === 'number' && !isNaN(product.inventory) ? product.inventory : 0,
    };
    
    setEditorMode('edit');
    setEditingProduct(safeProduct);
    setIsEditorOpen(true);
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      await duplicateProductMutation.mutateAsync({
        id: product.id,
        newName: `${product.name} (Copy)`
      });
      refetchProducts();
      showToast({
        type: 'success',
        title: 'Erfolgreich dupliziert',
        message: `"${product.name}" wurde dupliziert`
      });
    } catch (error) {
      handleError(error, { operation: 'product_duplicate', productId: product.id });
      showToast({
        type: 'error',
        title: 'Duplizieren fehlgeschlagen',
        message: error instanceof Error ? error.message : 'Das Produkt konnte nicht dupliziert werden. Bitte versuchen Sie es erneut.'
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Möchten Sie "${product.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    
    try {
      await deleteProductMutation.mutateAsync(product.id);
      refetchProducts();
      showToast({
        type: 'success',
        title: 'Erfolgreich gelöscht',
        message: `"${product.name}" wurde gelöscht`
      });
    } catch (error) {
      handleError(error, { operation: 'product_delete', productId: product.id });
      showToast({
        type: 'error',
        title: 'Löschen fehlgeschlagen',
        message: error instanceof Error ? error.message : 'Das Produkt konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.'
      });
    }
  };

  const handleAdjustStock = useCallback((product: Product) => {
    // Validate product before opening stock adjustment modal
    if (!product || !product.id) {
      handleError(new Error('Ungültiges Produkt für Lagerbestand-Anpassung'), { operation: 'stock_adjustment' });
      return;
    }
    
    // Ensure product has required fields
    if (!product.name) {
      handleError(new Error('Produktname fehlt'), { operation: 'stock_adjustment', productId: product.id });
      return;
    }
    
    // Ensure inventory is a valid number
    const safeProduct: Product = {
      ...product,
      inventory: typeof product.inventory === 'number' && !isNaN(product.inventory) ? product.inventory : 0,
      sku: product.sku || 'N/A',
    };
    
    setStockAdjustmentProduct(safeProduct);
  }, [handleError]);

  // Keyboard shortcuts - defined after handlers
  const shortcuts = React.useMemo<CommandAction[]>(() => [
    {
      id: 'create-product',
      label: 'Neues Produkt erstellen',
      description: 'Erstelle ein neues Produkt',
      category: 'Products',
      shortcut: 'Ctrl+N',
      action: handleCreateProduct,
    },
    {
      id: 'edit-product',
      label: 'Produkt bearbeiten',
      description: 'Bearbeite das ausgewählte Produkt',
      category: 'Products',
      shortcut: 'Ctrl+E',
      action: () => {
        if (selectedProducts.size === 1) {
          const productId = Array.from(selectedProducts)[0];
          const productsArray = Array.isArray(processedProducts) ? processedProducts : [];
          const product = productsArray.find(p => p && p.id === productId);
          if (product) {
            handleEditProduct(product);
          }
        }
      },
    },
    {
      id: 'delete-products',
      label: 'Ausgewählte Produkte löschen',
      description: `Lösche ${selectedProducts.size} ausgewählte Produkt(e)`,
      category: 'Products',
      shortcut: 'Delete',
      action: () => {
        if (selectedProducts.size > 0) {
          handleBulkAction('delete');
        }
      },
    },
    {
      id: 'focus-search',
      label: 'Suche fokussieren',
      description: 'Fokussiere das Suchfeld',
      category: 'Navigation',
      shortcut: 'Ctrl+F',
      action: () => {
        searchInputRef.current?.focus();
      },
    },
  ], [selectedProducts, processedProducts, handleCreateProduct, handleEditProduct, handleBulkAction]);

  // Memoized keyboard shortcuts for better performance
  const keyboardShortcuts = React.useMemo(() => {
    const selectedCount = selectedProducts.size;
    const selectedProductId = selectedCount === 1 ? Array.from(selectedProducts)[0] : null;
    const productsArray = Array.isArray(processedProducts) ? processedProducts : [];
    const selectedProduct = selectedProductId ? productsArray.find(p => p && p.id === selectedProductId) : null;

    // Ensure all shortcuts have valid handlers
    return [
      {
        key: 'k',
        ctrl: true,
        handler: () => {
          try {
            setIsCommandPaletteOpen(true);
          } catch (error) {
            console.error('Error in keyboard shortcut handler:', error);
          }
        },
        description: 'Open Command Palette',
      },
      {
        key: 'n',
        ctrl: true,
        handler: () => {
          try {
            handleCreateProduct();
          } catch (error) {
            console.error('Error in keyboard shortcut handler:', error);
          }
        },
        description: 'Create New Product',
      },
      {
        key: 'e',
        ctrl: true,
        handler: () => {
          try {
            if (selectedProduct) {
              handleEditProduct(selectedProduct);
            }
          } catch (error) {
            console.error('Error in keyboard shortcut handler:', error);
          }
        },
        description: 'Edit Selected Product',
      },
      {
        key: 'Delete',
        handler: () => {
          try {
            if (selectedCount > 0) {
              handleBulkAction('delete');
            }
          } catch (error) {
            console.error('Error in keyboard shortcut handler:', error);
          }
        },
        description: 'Delete Selected Products',
      },
      {
        key: 'f',
        ctrl: true,
        handler: () => {
          try {
            searchInputRef.current?.focus();
          } catch (error) {
            console.error('Error in keyboard shortcut handler:', error);
          }
        },
        description: 'Focus Search',
      },
      {
        key: 'Escape',
        handler: () => {
          try {
            if (isEditorOpen) setIsEditorOpen(false);
            if (isBulkEditOpen) setIsBulkEditOpen(false);
            if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
          } catch (error) {
            console.error('Error in keyboard shortcut handler:', error);
          }
        },
        description: 'Close Modals',
      },
    ].filter(shortcut => shortcut && shortcut.key && shortcut.handler); // Filter out invalid shortcuts
  }, [selectedProducts, processedProducts, handleCreateProduct, handleEditProduct, handleBulkAction, isEditorOpen, isBulkEditOpen, isCommandPaletteOpen]);

  // Ensure keyboardShortcuts is always an array before passing to hook
  const safeKeyboardShortcuts = Array.isArray(keyboardShortcuts) ? keyboardShortcuts : [];
  useKeyboardShortcuts(safeKeyboardShortcuts, { enabled: true });

  // Drag & Drop Handlers for Product Reordering
  const handleDragStart = useCallback((e: React.DragEvent, productId: string) => {
    setDraggedProductId(productId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', productId);
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
    
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.backgroundColor = '';
    }
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.backgroundColor = '';
    }

    if (!draggedProductId) return;

    const draggedIndex = filteredProducts.findIndex(p => p.id === draggedProductId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedProductId(null);
      setDragOverIndex(null);
      return;
    }

    // Optimistically update UI
    const newProducts = [...filteredProducts];
    const [draggedProduct] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(dropIndex, 0, draggedProduct);

    setIsReordering(true);
    setDraggedProductId(null);
    setDragOverIndex(null);

    try {
      // Update product order via API - optimized batch processing
      // Since there's no dedicated order endpoint, we'll update each product's order field
      // In a real implementation, you'd want a bulk update endpoint
      const orderUpdates = newProducts
        .map((product, index) => ({
          id: product.id,
          order: index,
        }))
        .filter(update => update.id); // Filter out invalid updates

      if (orderUpdates.length === 0) {
        setIsReordering(false);
        return;
      }

      // Update products in batches for better performance (5 at a time)
      const batchSize = 5;
      for (let i = 0; i < orderUpdates.length; i += batchSize) {
        const batch = orderUpdates.slice(i, i + batchSize);
        await Promise.all(
          batch.map(update =>
            updateProductMutation.mutateAsync({
              id: update.id,
              product: { order: update.order } as any,
            }).catch(err => {
              logger.error(`Failed to update product order ${update.id}`, { error: err, update });
              throw err;
            })
          )
        );
      }

      // Refetch to get updated order
      await refetchProducts();
    } catch (error) {
      handleError(error, { operation: 'product_reorder', draggedId: draggedProductId });
      // Revert optimistic update by refetching
      await refetchProducts();
    } finally {
      setIsReordering(false);
    }
  }, [draggedProductId, filteredProducts, updateProductMutation, refetchProducts, handleError]);

  const getStatusBadge = (product: Product) => {
    if (product.isOutOfStock) {
      return <Badge variant="destructive" className="text-red-400 animate-pulse">Ausverkauft</Badge>;
    }
    if (product.isLowStock) {
      return <Badge variant="outline" className="text-yellow-400 border-yellow-400">Niedriger Bestand</Badge>;
    }
    if (product.isFeatured) {
      return <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-500/10">
        <Star className="w-3 h-3 mr-1" />Featured
      </Badge>;
    }
    if (product.status === 'active') {
      return <Badge variant="outline" className="text-green-400 border-green-400 bg-green-500/10">
        <CheckCircle className="w-3 h-3 mr-1" />Aktiv
      </Badge>;
    }
    if (product.status === 'draft') {
      return <Badge variant="outline" className="text-gray-400 border-gray-400">
        <Edit className="w-3 h-3 mr-1" />Entwurf
      </Badge>;
    }
    return <Badge variant="outline" className="text-orange-400 border-orange-400">{product.status}</Badge>;
  };

  // Container dimensions for virtual scrolling - MUST be before early returns
  const [containerDimensions, setContainerDimensions] = React.useState({ width: 1200, height: 600 });
  
  React.useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById('product-grid-container');
      if (container) {
        setContainerDimensions({
          width: container.clientWidth,
          height: container.clientHeight || 600
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Enhanced error handling with solution suggestions
  const [isOnline, setIsOnline] = React.useState(() => NetworkMonitor.getStatus());
  
  React.useEffect(() => {
    const unsubscribe = NetworkMonitor.subscribe((online) => {
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  // Extract sync status from products response
  const syncStatus = (productsResponse as any)?._syncStatus;
  const source = (productsResponse as any)?._source;

  // Quick Filters with counts - memoized for performance (moved before early returns to follow Rules of Hooks)
  const quickFilterCounts = useMemo(() => ({
    lowStock: processedProducts.filter(p => (p.inventory || 0) > 0 && (p.inventory || 0) < 20).length,
    outOfStock: processedProducts.filter(p => (p.inventory || 0) === 0).length,
    featured: processedProducts.filter(p => p.isFeatured).length,
    active: processedProducts.filter(p => p.isActive).length,
    inactive: processedProducts.filter(p => !p.isActive).length,
    highStock: processedProducts.filter(p => (p.inventory || 0) >= 50).length,
    recent: processedProducts.filter(p => {
      if (!p.updatedAt) return false;
      const updated = new Date(p.updatedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return updated > weekAgo;
    }).length,
  }), [processedProducts]);

  const hasActiveFilters = useMemo(() => 
    quickFilter || advancedSearchTerm || Object.values(advancedFilters).some(v => 
      (Array.isArray(v) && v.length > 0) || 
      (typeof v === 'object' && v !== null && Object.values(v).some(subV => subV !== null))
    ), [quickFilter, advancedSearchTerm, advancedFilters]);

  if (productsError) {
    const errorMessage = productsError instanceof Error 
      ? productsError.message 
      : typeof productsError === 'string' 
        ? productsError 
        : 'Unbekannter Fehler';
    
    const errorSolution = getErrorSolution(productsError, 'Product Management');
    const isNetworkError = errorMessage.includes('fetch') || 
                          errorMessage.includes('network') || 
                          errorMessage.includes('timeout') ||
                          errorMessage.includes('Failed to fetch') ||
                          errorMessage.includes('Keine Internetverbindung');
    const isAuthError = errorMessage.includes('Authentifizierung') || 
                        errorMessage.includes('401') ||
                        (productsError as any)?.status === 401;
    
    return (
      <Card className="p-12 text-center border-red-500/30 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent backdrop-blur-sm">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <ShoppingBag className="w-32 h-32 text-red-400" />
          </div>
          <div className="relative space-y-6">
            {/* Animated Error Icon */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              <AlertCircle className="w-20 h-20 mx-auto text-red-400 relative z-10 animate-bounce" />
            </div>
            
            {/* Error Message */}
            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-white">
                {errorSolution?.title || (isNetworkError ? 'Verbindungsfehler' : 'Produkte konnten nicht geladen werden')}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {errorSolution?.description || (isNetworkError 
                  ? 'Es konnte keine Verbindung zum Server hergestellt werden. Bitte überprüfe deine Internetverbindung.'
                  : 'Es gab einen Fehler beim Abrufen der Produkte.')}
              </p>
              
              {/* Network Status Indicator */}
              {!isOnline && (
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg max-w-md mx-auto">
                  <WifiOff className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-400">Offline - Verwende gecachte Daten falls verfügbar</span>
                </div>
              )}
              
              {/* Error Details */}
              <div className="mt-4 space-y-2">
                <details className="text-left max-w-2xl mx-auto">
                  <summary className="cursor-pointer text-sm text-red-400/80 hover:text-red-400 transition-colors font-medium">
                    Technische Details anzeigen
                  </summary>
                  <div className="mt-3 p-4 bg-red-950/30 rounded-lg border border-red-500/20">
                    <p className="text-xs text-red-400/90 font-mono break-all">
                      {errorMessage}
                    </p>
                    {productsError instanceof Error && productsError.stack && (
                      <pre className="mt-2 text-xs text-red-400/60 overflow-auto max-h-32">
                        {productsError.stack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    )}
                  </div>
                </details>
              </div>
            </div>
            
            {/* Action Buttons - Use solution actions if available */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
              {isAuthError ? (
                <>
                  <Button 
                    onClick={() => {
                      localStorage.removeItem('nebula_access_token');
                      localStorage.removeItem('nebula_refresh_token');
                      window.location.reload();
                    }}
                    size="lg" 
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                  >
                    Zur Anmeldung
                  </Button>
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg max-w-md">
                    <p className="text-sm text-blue-300 font-semibold mb-2">💡 Anmeldedaten:</p>
                    <p className="text-xs text-blue-200">
                      Email: <code className="bg-black/30 px-2 py-1 rounded">admin@nebula.local</code>
                    </p>
                    <p className="text-xs text-blue-200 mt-1">
                      Passwort: <code className="bg-black/30 px-2 py-1 rounded">admin123</code>
                    </p>
                  </div>
                </>
              ) : errorSolution && errorSolution.actions.length > 0 ? (
                errorSolution.actions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.action}
                    size="lg"
                    variant={index === 0 ? 'default' : 'outline'}
                    className={index === 0 
                      ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/20 transition-all hover:scale-105"
                      : "border-white/20 hover:bg-white/5"
                    }
                  >
                    {action.label}
                  </Button>
                ))
              ) : (
                <>
                  <Button 
                    onClick={() => refetchProducts()} 
                    size="lg" 
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/20 transition-all hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Erneut versuchen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      // Clear cache and retry
                      if (typeof window !== 'undefined' && 'caches' in window) {
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map(name => caches.delete(name)));
                      }
                      refetchProducts();
                    }}
                    size="lg"
                    className="border-white/20 hover:bg-white/5"
                  >
                    Cache leeren & Neu laden
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => window.location.reload()}
                    size="lg"
                    className="text-muted-foreground hover:text-white"
                  >
                    Seite neu laden
                  </Button>
                </>
              )}
            </div>
            
            {/* Helpful Tips */}
            {isNetworkError && (
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-blue-400/90">
                  <strong>Tipp:</strong> Überprüfe deine Internetverbindung oder versuche es später erneut. 
                  {!isOnline && ' Du bist derzeit offline - gecachte Daten werden verwendet falls verfügbar.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (productsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: viewMode === 'grid' ? 8 : 6 }).map((_, i) => (
          <Card 
            key={i} 
            className={`${viewMode === 'grid' ? 'p-4' : 'p-6'} animate-pulse border-white/5`}
          >
            {viewMode === 'grid' ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="h-6 w-6 bg-gray-800/50 rounded" />
                  <div className="h-8 w-8 bg-gray-800/50 rounded" />
                </div>
                <div className="w-full aspect-video bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg" />
                <div className="h-5 w-3/4 bg-gray-800/50 rounded" />
                <div className="h-4 w-full bg-gray-800/30 rounded" />
                <div className="h-4 w-2/3 bg-gray-800/30 rounded" />
                <div className="flex items-center justify-between">
                  <div className="h-6 w-20 bg-gray-800/50 rounded" />
                  <div className="h-5 w-16 bg-gray-800/30 rounded" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-800/50 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/3 bg-gray-800/50 rounded" />
                  <div className="h-4 w-2/3 bg-gray-800/30 rounded" />
                  <div className="h-3 w-1/4 bg-gray-800/20 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-800/50 rounded" />
                <div className="h-6 w-16 bg-gray-800/30 rounded" />
                <div className="h-6 w-24 bg-gray-800/30 rounded" />
              </div>
            )}
          </Card>
        ))}
        {/* Loading indicator */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Produkte werden geladen...</span>
          </div>
        </div>
      </div>
    );
  }

  // Helper function for access badges
  const getAccessBadge = (access: string) => {
    switch (access) {
      case 'free':
        return <Badge variant="outline" className="text-green-400 border-green-400 bg-green-500/10">
          <Globe className="w-3 h-3 mr-1" />Kostenlos
        </Badge>;
      case 'limited':
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400 bg-yellow-500/10">
          <Lock className="w-3 h-3 mr-1" />Limitiert
        </Badge>;
      case 'vip':
        return <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-500/10">
          <Crown className="w-3 h-3 mr-1" />VIP
        </Badge>;
      case 'standard':
        return <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-500/10">
          <Users className="w-3 h-3 mr-1" />Standard
        </Badge>;
      default:
        return <Badge variant="outline" className="text-gray-400">Unbekannt</Badge>;
    }
  };

  if (viewMode === 'grid') {
    return (
      <div className="space-y-4">
        {/* Product Sync Status */}
        {syncStatus && (
          <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <ProductSyncStatus syncStatus={syncStatus} source={source} />
            <div className="text-xs text-muted-foreground">
              {products.length} von {productsResponse?.total || products.length} Produkten angezeigt
            </div>
          </div>
        )}

        {/* Quick Filters with counts */}
        <div className="mb-4 space-y-2">
          <QuickFilters
            filters={[
              { id: 'lowStock', label: 'Niedriger Bestand', value: 'lowStock', count: quickFilterCounts.lowStock, icon: <AlertCircle className="w-3 h-3" /> },
              { id: 'outOfStock', label: 'Ausverkauft', value: 'outOfStock', count: quickFilterCounts.outOfStock, icon: <XCircle className="w-3 h-3" /> },
              { id: 'featured', label: 'Featured', value: 'featured', count: quickFilterCounts.featured, icon: <Star className="w-3 h-3" /> },
              { id: 'active', label: 'Aktiv', value: 'active', count: quickFilterCounts.active, icon: <CheckCircle className="w-3 h-3" /> },
              { id: 'inactive', label: 'Inaktiv', value: 'inactive', count: quickFilterCounts.inactive, icon: <XCircle className="w-3 h-3" /> },
              { id: 'highStock', label: 'Hoher Bestand', value: 'highStock', count: quickFilterCounts.highStock, icon: <Package className="w-3 h-3" /> },
              { id: 'recent', label: 'Kürzlich aktualisiert', value: 'recent', count: quickFilterCounts.recent, icon: <Clock className="w-3 h-3" /> },
            ]}
            activeFilter={quickFilter}
            onFilterChange={setQuickFilter}
            onClear={clearAdvancedFilters}
          />
          {/* Filter Preview with result count */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg"
            >
              <div className="flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4 text-blue-400" />
                <span className="text-muted-foreground">
                  {filteredProducts.length} von {processedProducts.length} Produkt{processedProducts.length !== 1 ? 'en' : ''} angezeigt
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuickFilter(null);
                  clearAdvancedFilters();
                }}
                className="text-xs"
              >
                Filter zurücksetzen
              </Button>
            </motion.div>
          )}
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          onReset={() => {
            setAdvancedFilters({
              priceRange: { min: null, max: null },
              categories: [],
              statuses: [],
              accessLevels: [],
              dateRange: { start: null, end: null },
              sortBy: 'name',
              sortOrder: 'asc',
              customSort: undefined,
            });
            clearAdvancedFilters();
          }}
          categories={categories}
          className="mb-4"
        />

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Kategorie:
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 bg-black/25 border border-white/20 rounded-lg text-sm hover:border-white/40 transition-colors"
            >
              <option value="all">Alle Kategorien</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-black/25 border border-white/20 rounded-lg text-sm hover:border-white/40 transition-colors"
            >
              <option value="all">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
              <option value="low-stock">Niedriger Bestand</option>
              <option value="out-of-stock">Ausverkauft</option>
            </select>
          </div>
          {brands.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Brand:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={filterBrandIds.length === 0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterBrandIds([])}
                >
                  Alle Brands
                </Button>
                {brands.slice(0, 6).map(brand => {
                  const colors = getBrandColor(brand.name);
                  const isSelected = filterBrandIds.includes(brand.id);
                  return (
                    <Button
                      key={brand.id}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          setFilterBrandIds(filterBrandIds.filter(id => id !== brand.id));
                        } else {
                          setFilterBrandIds([...filterBrandIds, brand.id]);
                        }
                      }}
                      className={isSelected ? `bg-gradient-to-r ${colors.primary} border ${colors.secondary}` : ''}
                    >
                      {brand.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sortierung:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-black/25 border border-white/20 rounded-lg text-sm hover:border-white/40 transition-colors"
            >
              <option value="name">Name</option>
              <option value="price">Preis</option>
              <option value="category">Kategorie</option>
              <option value="inventory">Lagerbestand</option>
              <option value="createdAt">Zuletzt aktualisiert</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 hover:bg-white/10 transition-colors"
            >
              {sortOrder === 'asc' ? '↑ Aufsteigend' : '↓ Absteigend'}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <Card className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30 animate-in slide-in-from-top">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-white">
                  {selectedProducts.size} Produkt{selectedProducts.size !== 1 ? 'e' : ''} ausgewählt
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setIsBulkEditOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Edit className="w-4 h-4 mr-1" />
                  Massenbearbeitung
                </Button>
                <Button size="sm" onClick={() => handleBulkAction('activate')} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Aktivieren
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')} className="border-yellow-500/50 hover:bg-yellow-500/10">
                  <XCircle className="w-4 h-4 mr-1" />
                  Deaktivieren
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')} className="border-red-500/50 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Löschen
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {productsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Products Grid - Optimized with Virtual Scrolling for large lists */}
        {!productsLoading && (
          <div id="product-grid-container" className={cn("w-full", useVirtualScrolling && viewMode === 'grid' ? "h-[600px]" : "")}>
            {useVirtualScrolling && viewMode === 'grid' ? (
              <Suspense fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              }>
                <VirtualizedProductGrid
                  products={paginatedProducts}
                  selectedProducts={selectedProducts}
                  onSelect={handleProductSelect}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onDuplicate={handleDuplicateProduct}
                  onAdjustStock={handleAdjustStock}
                  onUpdate={handleProductUpdate}
                  loadedImages={loadedImages}
                  onImageLoad={(id) => setLoadedImages(prev => new Set(prev).add(id))}
                  categories={categories}
                  containerWidth={containerDimensions.width}
                  containerHeight={containerDimensions.height}
                />
              </Suspense>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ProductCard
                      product={product}
                      isSelected={selectedProducts.has(product.id)}
                      onSelect={(checked) => handleProductSelect(product.id, checked)}
                      onEdit={() => handleEditProduct(product)}
                      onDelete={() => handleDeleteProduct(product)}
                      onDuplicate={() => handleDuplicateProduct(product)}
                      onAdjustStock={() => handleAdjustStock(product)}
                      onUpdate={(field, value) => handleProductUpdate(product.id, field, value)}
                      loadedImages={loadedImages}
                      onImageLoad={(id) => setLoadedImages(prev => new Set(prev).add(id))}
                      categories={categories}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination Controls for Grid - Only show if not using virtual scrolling */}
        {!useVirtualScrolling && filteredProducts.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Zeige {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, filteredProducts.length)} von {filteredProducts.length} Produkten
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
        
        {/* Virtual Scrolling Info */}
        {(useVirtualScrolling && viewMode === 'grid' || useVirtualTableScrolling && viewMode === 'list') && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Virtual Scrolling aktiviert - {filteredProducts.length} Produkte werden performant gerendert
          </div>
        )}


        {/* Error State */}
        {productsError && (
          <Card className="p-12 text-center bg-red-900/10 border-red-500/30">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-bold mb-2 text-red-400">Fehler beim Laden</h3>
            <p className="text-muted-foreground mb-6">
              {productsError instanceof Error ? productsError.message : 'Ein Fehler ist aufgetreten'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => refetchProducts()}
                className="border-red-500/50 hover:bg-red-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!productsLoading && !productsError && filteredProducts.length === 0 && (
          <Card className="p-16 text-center bg-gradient-to-b from-slate-900/50 to-slate-950/50 border-dashed border-2 border-white/10 animate-in fade-in-50 duration-500">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <ShoppingBag className="w-48 h-48" />
              </div>
              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/10 mb-6 animate-pulse">
                  <Package className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">
                  {products.length === 0 
                    ? 'Keine Produkte vorhanden' 
                    : 'Keine Produkte gefunden'}
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  {products.length === 0 
                    ? 'Es sind noch keine Produkte im System. Erstelle dein erstes Produkt oder synchronisiere Produkte vom Frontend.'
                    : debouncedSearchTerm || filterCategory !== 'all' || filterStatus !== 'all' || advancedFilters.categories.length > 0 || advancedFilters.statuses.length > 0
                      ? 'Versuche deine Filter oder Suchbegriffe anzupassen'
                      : 'Beginne mit dem Erstellen deines ersten Produkts'}
                </p>
                {products.length === 0 && (
                  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-yellow-400 flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Tipp: Du kannst Produkte vom Frontend synchronisieren oder automatisch für Kategorien generieren.
                    </p>
                  </div>
                )}
                <div className="flex gap-3 justify-center flex-wrap">
                  {(debouncedSearchTerm || filterCategory !== 'all' || filterStatus !== 'all' || advancedFilters.categories.length > 0 || advancedFilters.statuses.length > 0) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilterCategory('all');
                        setFilterStatus('all');
                        setAdvancedFilters({
                          priceRange: { min: null, max: null },
                          categories: [],
                          statuses: [],
                          accessLevels: [],
                          dateRange: { start: null, end: null },
                          sortBy: 'name',
                          sortOrder: 'asc',
                        });
                        setAdvancedSearchTerm('');
                        setQuickFilter(null);
                      }}
                      className="hover:bg-white/10 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Filter zurücksetzen
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkImportOpen(true)}
                    className="hover:bg-white/10 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importieren
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkExportOpen(true)}
                    className="hover:bg-white/10 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportieren
                  </Button>
                  <Button
                    onClick={() => {
                      setEditorMode('create');
                      setEditingProduct(undefined);
                      setIsEditorOpen(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Neues Produkt hinzufügen
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Product Editor Modal */}
        <ProductEditor
          open={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingProduct(undefined);
            refetchProducts();
          }}
          product={editingProduct}
          mode={editorMode}
        />

        {/* Stock Adjustment Modal */}
        {stockAdjustmentProduct && stockAdjustmentProduct.id && (
          <StockAdjustmentModal
            open={!!stockAdjustmentProduct}
            onClose={() => {
              setStockAdjustmentProduct(null);
              refetchProducts();
            }}
            productId={stockAdjustmentProduct.id}
            productName={stockAdjustmentProduct.name || 'Unknown Product'}
            currentStock={typeof stockAdjustmentProduct.inventory === 'number' && !isNaN(stockAdjustmentProduct.inventory) 
              ? stockAdjustmentProduct.inventory 
              : 0}
            sku={stockAdjustmentProduct.sku || 'N/A'}
          />
        )}

        {/* Bulk Edit Modal */}
        {isBulkEditOpen && (
          <BulkEditModal
            open={isBulkEditOpen}
            onClose={() => setIsBulkEditOpen(false)}
            selectedProducts={Array.from(selectedProducts)}
            onSave={() => {
              setIsBulkEditOpen(false);
              setSelectedProducts(new Set());
              refetchProducts();
            }}
          />
        )}

        {/* Bulk Import Modal */}
        <BulkImportModal
          open={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          onSuccess={() => {
            setIsBulkImportOpen(false);
            refetchProducts();
          }}
          type="products"
        />

        {/* Bulk Export Modal */}
        <BulkExportModal
          open={isBulkExportOpen}
          onClose={() => setIsBulkExportOpen(false)}
          type="products"
          selectedIds={selectedProducts.size > 0 ? Array.from(selectedProducts) : undefined}
          filters={{ category: filterCategory, status: filterStatus }}
          products={selectedProducts.size > 0 
            ? filteredProducts.filter(p => selectedProducts.has(p.id))
            : filteredProducts
          }
        />

        {/* Command Palette */}
        <CommandPalette
          open={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          commands={shortcuts}
        />
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {/* Product Sync Status */}
      {syncStatus && (
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <ProductSyncStatus syncStatus={syncStatus} source={source} />
          <div className="text-xs text-muted-foreground">
            {products.length} von {productsResponse?.total || products.length} Produkten angezeigt
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
          >
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="category">Category</option>
            <option value="inventory">Inventory</option>
            <option value="createdAt">Last Updated</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Reordering Indicator */}
      {isReordering && (
        <Card className="p-4 bg-blue-500/10 border-blue-500/30 mb-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-sm text-blue-400">Produkt-Reihenfolge wird aktualisiert...</span>
          </div>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-white/20 bg-black/25"
                    disabled={isReordering}
                  />
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand / Model</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Access</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={8} />
                ))
              ) : useVirtualTableScrolling ? (
                <Suspense fallback={
                  <div>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <SkeletonTableRow key={i} columns={8} />
                    ))}
                  </div>
                }>
                  <VirtualizedProductTable
                    products={paginatedProducts}
                    selectedProducts={selectedProducts}
                    onSelect={handleProductSelect}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onDuplicate={handleDuplicateProduct}
                    onAdjustStock={handleAdjustStock}
                    onUpdate={handleProductUpdate}
                    draggedProductId={draggedProductId}
                    dragOverIndex={dragOverIndex}
                    isReordering={isReordering}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  containerHeight={600}
                  processedProducts={processedProducts}
                />
                </Suspense>
              ) : (
                paginatedProducts.map((product, index) => (
                <TableRow 
                  key={product.id} 
                  className={cn(
                    "hover:bg-white/5 transition-colors",
                    draggedProductId === product.id && "opacity-50 cursor-grabbing",
                    dragOverIndex === index && "bg-blue-500/20 border-blue-500",
                    isReordering && "opacity-60"
                  )}
                  draggable={!isReordering}
                  onDragStart={(e) => handleDragStart(e, product.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={(e) => {
                    // Reset opacity on drag end
                    if (e.currentTarget instanceof HTMLElement) {
                      e.currentTarget.style.opacity = '';
                    }
                    if (!isReordering) {
                      setDraggedProductId(null);
                      setDragOverIndex(null);
                    }
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className={cn(
                          "cursor-move text-muted-foreground hover:text-white transition-colors",
                          isReordering && "cursor-not-allowed opacity-50"
                        )}
                        draggable={!isReordering}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          if (!isReordering) {
                            handleDragStart(e, product.id);
                          }
                        }}
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                        className="rounded border-white/20 bg-black/25"
                        onClick={(e) => e.stopPropagation()}
                        disabled={isReordering}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{product.categoryIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mb-1">
                          <InlineEdit
                            value={product.name}
                            onSave={(newName) => handleProductUpdate(product.id, 'name', newName)}
                            type="text"
                            className="font-medium"
                            validate={(val) => val.length < 2 ? 'Name muss mindestens 2 Zeichen lang sein' : null}
                            autoComplete={processedProducts.slice(0, 10).map(p => p.name)}
                          />
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          <InlineEdit
                            value={product.description || ''}
                            onSave={(newDesc) => handleProductUpdate(product.id, 'description', newDesc)}
                            type="textarea"
                            rows={2}
                            className="text-sm text-muted-foreground"
                            placeholder="Beschreibung hinzufügen..."
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          SKU: <InlineEdit
                            value={product.sku || ''}
                            onSave={(newSku) => handleProductUpdate(product.id, 'sku', newSku)}
                            type="text"
                            className="text-xs"
                            placeholder="SKU eingeben..."
                            validate={(val) => val.length > 0 && val.length < 3 ? 'SKU muss mindestens 3 Zeichen lang sein' : null}
                          />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{product.categoryIcon}</span>
                      <span className="text-sm">{product.categoryName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const brand = categoriesResponse?.data ? findBrandForCategory(product.categoryId, categoriesResponse.data) : null;
                      const model = categoriesResponse?.data ? findModelForCategory(product.categoryId, categoriesResponse.data) : null;
                      const brandColors = brand ? getBrandColor(brand.name) : null;
                      
                      if (model) {
                        return (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className={`text-xs ${brandColors?.badge || 'bg-gray-500/20 border-gray-500/50 text-gray-300'}`}>
                              {brand?.name || 'Unknown'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{model.name}</span>
                          </div>
                        );
                      } else if (brand) {
                        return (
                          <Badge variant="outline" className={`text-xs ${brandColors?.badge || 'bg-gray-500/20 border-gray-500/50 text-gray-300'}`}>
                            {brand.name}
                          </Badge>
                        );
                      }
                      return <span className="text-xs text-muted-foreground">-</span>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      value={product.price}
                      onSave={(newPrice) => handleProductUpdate(product.id, 'price', newPrice)}
                      type="number"
                      className="font-bold text-neon"
                      step="0.01"
                      min={0}
                      format={(v) => `€${Number(v).toFixed(2)}`}
                      parse={(v) => parseFloat(String(v).replace('€', '').replace(',', '.'))}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <InlineEdit
                        value={product.inventory || 0}
                        onSave={(newStock) => handleProductUpdate(product.id, 'inventory', newStock)}
                        type="number"
                        className="font-medium"
                      />
                      <span className="text-xs text-muted-foreground">
                        / {product.totalStock} total
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      value={product.status || 'draft'}
                      onSave={(newStatus) => handleProductUpdate(product.id, 'status', newStatus)}
                      type="select"
                      options={[
                        { value: 'active', label: 'Aktiv' },
                        { value: 'inactive', label: 'Inaktiv' },
                        { value: 'draft', label: 'Entwurf' },
                        { value: 'archived', label: 'Archiviert' }
                      ]}
                      className="min-w-[100px]"
                    />
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      value={product.access || 'standard'}
                      onSave={(newAccess) => handleProductUpdate(product.id, 'access', newAccess)}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Produkt bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAdjustStock(product)}>
                          <Package className="w-4 h-4 mr-2" />
                          Lagerbestand anpassen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplizieren
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400" onClick={() => handleDeleteProduct(product)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls for Table - Only show if not using virtual scrolling */}
        {!useVirtualTableScrolling && filteredProducts.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-4 px-4 py-3 border-t border-white/10">
            <div className="text-sm text-muted-foreground">
              Zeige {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, filteredProducts.length)} von {filteredProducts.length} Produkten
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

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search terms
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
            
            {/* Product Editor Modal */}
            <ProductEditor
              open={isEditorOpen}
              onClose={() => {
                setIsEditorOpen(false);
                setEditingProduct(undefined);
                refetchProducts();
              }}
              product={editingProduct}
              mode={editorMode}
            />

            {/* Stock Adjustment Modal */}
            {stockAdjustmentProduct && (
              <StockAdjustmentModal
                open={!!stockAdjustmentProduct}
                onClose={() => {
                  setStockAdjustmentProduct(null);
                  refetchProducts();
                }}
                productId={stockAdjustmentProduct.id}
                productName={stockAdjustmentProduct.name}
                currentStock={stockAdjustmentProduct.inventory || 0}
                sku={stockAdjustmentProduct.sku}
              />
            )}

            {/* Bulk Edit Modal */}
            <BulkEditModal
              open={isBulkEditOpen}
              onClose={() => {
                setIsBulkEditOpen(false);
                setSelectedProducts(new Set());
              }}
              productIds={Array.from(selectedProducts)}
              onSuccess={() => {
                refetchProducts();
                setSelectedProducts(new Set());
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
});
ProductManagement.displayName = 'ProductManagement';



