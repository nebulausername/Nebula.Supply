import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { 
  ChevronRight, 
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Folder,
  FolderOpen,
  Package,
  MoreVertical,
  Search,
  RefreshCw,
  Sparkles,
  Home,
  ChevronLeft,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Eye
} from 'lucide-react';
import { 
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useBulkUpdateCategoryOrder,
  useProducts
} from '../../lib/api/shopHooks';
import type { Category } from '../../lib/api/ecommerce';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { checkAndSetupMainCategories, setupSneakerHierarchy, type SetupProgress } from '../../lib/utils/mainCategoriesSetup';
import { CategoryEditor } from './CategoryEditor';
import { getBrandColor, findBrandForCategory, findSneakerCategory } from '../../lib/utils/brandUtils';

interface CategoryHierarchyManagerProps {
  onCategorySelect?: (categoryId: string) => void;
  onAddSubcategory?: (parentId: string) => void;
}

interface CategoryNode extends Category {
  children?: CategoryNode[];
  expanded?: boolean;
  level?: number;
  productCount?: number;
}

export const CategoryHierarchyManager = memo(({ 
  onCategorySelect, 
  onAddSubcategory 
}: CategoryHierarchyManagerProps) => {
  const { handleError } = useErrorHandler('CategoryHierarchyManager');
  const { showToast } = useToast();
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [breadcrumbPath, setBreadcrumbPath] = useState<Category[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorParentId, setEditorParentId] = useState<string | undefined>(undefined);
  
  const { data: categoriesResponse, isLoading, refetch } = useCategories({
    type: 'shop',
    limit: 1000
  });
  
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const bulkUpdateOrderMutation = useBulkUpdateCategoryOrder();
  
  const categories = categoriesResponse?.data || [];
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isSettingUpSneaker, setIsSettingUpSneaker] = useState(false);
  const [sneakerSetupProgress, setSneakerSetupProgress] = useState<SetupProgress | null>(null);
  
  // Fetch products to count per category
  const { data: productsResponse } = useProducts({ 
    type: ['shop'],
    limit: 1000
  });
  const products = productsResponse?.data || [];
  
  // Calculate product counts for each category (including children)
  const categoryProductCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    const calculateCount = (categoryId: string): number => {
      if (counts.has(categoryId)) {
        return counts.get(categoryId)!;
      }
      
      const directCount = products.filter((p: any) => p.categoryId === categoryId).length;
      const children = categories.filter(c => c.parentId === categoryId);
      const childrenCount = children.reduce((sum, child) => sum + calculateCount(child.id), 0);
      
      const total = directCount + childrenCount;
      counts.set(categoryId, total);
      return total;
    };
    
    categories.forEach(cat => calculateCount(cat.id));
    return counts;
  }, [categories, products]);
  
  // Setup Hauptkategorien beim ersten Laden with enhanced error handling
  const setupMainCategories = useCallback(async () => {
    if (isSettingUp || categories.length === 0) return;
    
    setIsSettingUp(true);
    try {
      const results = await checkAndSetupMainCategories(
        categories,
        async (category) => {
          try {
            const response = await createCategoryMutation.mutateAsync(category);
            return response.data;
          } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Unbekannter Fehler';
            logger.warn('Failed to create main category', {
              categoryName: category.name,
              error: errorMessage
            });
            throw error;
          }
        }
      );
      
      const created = results.filter(r => !r.exists && r.categoryId);
      const failed = results.filter(r => !r.exists && !r.categoryId);
      
      if (created.length > 0) {
        showToast({
          type: 'success',
          title: 'Hauptkategorien erstellt',
          message: `${created.length} Hauptkategorie(n) wurden erfolgreich erstellt.${failed.length > 0 ? ` ${failed.length} fehlgeschlagen.` : ''}`,
          duration: 5000
        });
      } else if (failed.length > 0) {
        showToast({
          type: 'warning',
          title: 'Hauptkategorien Setup',
          message: `${failed.length} Hauptkategorie(n) konnten nicht erstellt werden.`,
          duration: 6000
        });
      }
      
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unbekannter Fehler';
      handleError(error, { operation: 'setup_main_categories' });
      showToast({
        type: 'error',
        title: 'Setup fehlgeschlagen',
        message: `Beim Erstellen der Hauptkategorien ist ein Fehler aufgetreten: ${errorMessage}`,
        duration: 8000
      });
    } finally {
      setIsSettingUp(false);
    }
  }, [categories, createCategoryMutation, showToast, refetch, handleError, isSettingUp]);
  
  // Setup SNEAKER Hierarchie (3-Level) with enhanced error handling
  const setupSneakerHierarchyHandler = useCallback(async () => {
    if (isSettingUpSneaker) return;
    
    setIsSettingUpSneaker(true);
    setSneakerSetupProgress(null);
    
    try {
      const result = await setupSneakerHierarchy(
        categories,
        async (category) => {
          try {
            const response = await createCategoryMutation.mutateAsync(category);
            return response.data;
          } catch (error: any) {
            // Log individual category creation errors but continue
            const errorMessage = error?.response?.data?.message || error?.message || 'Unbekannter Fehler';
            logger.warn('Failed to create category during SNEAKER setup', {
              categoryName: category.name,
              error: errorMessage
            });
            throw error; // Re-throw to be handled by setupSneakerHierarchy
          }
        },
        (progress) => {
          setSneakerSetupProgress(progress);
        }
      );
      
      if (result.errors.length > 0) {
        showToast({
          type: 'warning',
          title: 'Setup mit Fehlern abgeschlossen',
          message: `${result.errors.length} Fehler aufgetreten. ${result.brands.length} Marken und ${result.models.length} Modelle erstellt.`,
          duration: 6000
        });
        
        // Log errors for debugging
        result.errors.forEach((error: any) => {
          logger.error('SNEAKER setup error', error);
        });
      } else {
        showToast({
          type: 'success',
          title: 'SNEAKER Hierarchie erstellt',
          message: `${result.brands.length} Marken und ${result.models.length} Modelle erfolgreich erstellt.`,
          duration: 5000
        });
      }
      
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unbekannter Fehler beim Setup';
      handleError(error, { operation: 'setup_sneaker_hierarchy' });
      showToast({
        type: 'error',
        title: 'Setup fehlgeschlagen',
        message: `Beim Erstellen der SNEAKER Hierarchie ist ein Fehler aufgetreten: ${errorMessage}`,
        duration: 8000
      });
    } finally {
      setIsSettingUpSneaker(false);
      setSneakerSetupProgress(null);
    }
  }, [categories, createCategoryMutation, showToast, refetch, handleError, isSettingUpSneaker]);
  
  // Auto-setup beim ersten Laden
  useEffect(() => {
    if (!isLoading && categories.length > 0 && !isSettingUp) {
      // Prüfe ob Hauptkategorien fehlen
      const mainCategorySlugs = ['sneaker', 'kleidung', 'accessoires', 'taschen', 'tech'];
      const hasAllMainCategories = mainCategorySlugs.every(slug => 
        categories.some(cat => cat.slug === slug)
      );
      
      if (!hasAllMainCategories) {
        setupMainCategories();
      }
    }
  }, [isLoading, categories, isSettingUp, setupMainCategories]);

  // Standardmäßig alle SNEAKER Kategorien expandieren (inkl. Modelle) - Verbessert
  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      const sneakerCategory = categories.find(cat => 
        cat.slug === 'sneaker' || cat.name === 'SNEAKER' || cat.name.toLowerCase() === 'sneaker'
      );
      
      if (sneakerCategory) {
        setExpandedCategories(prev => {
          const newSet = new Set(prev);
          let hasChanges = false;
          
          // Expand SNEAKER Hauptkategorie
          if (!newSet.has(sneakerCategory.id)) {
            newSet.add(sneakerCategory.id);
            hasChanges = true;
          }
          
          // Expand alle Marken (Level 1)
          const brands = categories.filter(cat => cat.parentId === sneakerCategory.id);
          brands.forEach(brand => {
            if (!newSet.has(brand.id)) {
              newSet.add(brand.id);
              hasChanges = true;
            }
            
            // Expand alle Modelle (Level 2) - für bessere Sichtbarkeit
            const models = categories.filter(cat => cat.parentId === brand.id);
            models.forEach(model => {
              if (!newSet.has(model.id)) {
                newSet.add(model.id);
                hasChanges = true;
              }
            });
          });
          
          // Nur Toast zeigen wenn tatsächlich expandiert wurde
          if (hasChanges && brands.length > 0) {
            const totalModels = brands.reduce((sum, brand) => {
              return sum + categories.filter(cat => cat.parentId === brand.id).length;
            }, 0);
            
            showToast({
              type: 'info',
              title: 'SNEAKER Hierarchie erweitert',
              message: `${brands.length} Marken und ${totalModels} Modelle sind jetzt sichtbar.`,
              duration: 3000
            });
          }
          
          return newSet;
        });
      }
    }
  }, [isLoading, categories, showToast]);
  
  // Build tree structure from flat categories array
  const categoryTree = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    
    const categoryMap = new Map<string, CategoryNode>();
    const rootCategories: CategoryNode[] = [];
    
    // First pass: create all nodes with product counts
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        ...cat,
        children: [],
        level: 0,
        productCount: categoryProductCounts.get(cat.id) || 0
      });
    });
    
    // Second pass: build tree
    categories.forEach(cat => {
      const node = categoryMap.get(cat.id);
      if (!node) return;
      
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(node);
          node.level = (parent.level || 0) + 1;
        } else {
          // Parent not found, treat as root
          rootCategories.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    });
    
    // Sort by order
    const sortCategories = (cats: CategoryNode[]): CategoryNode[] => {
      return cats.sort((a, b) => (a.order || 0) - (b.order || 0)).map(cat => ({
        ...cat,
        children: cat.children ? sortCategories(cat.children) : []
      }));
    };
    
    return sortCategories(rootCategories);
  }, [categories, categoryProductCounts]);
  
  // Build breadcrumb path for selected category
  const buildBreadcrumbPath = useCallback((categoryId: string): Category[] => {
    const path: Category[] = [];
    let currentId: string | undefined = categoryId;
    
    while (currentId) {
      const category = categories.find(c => c.id === currentId);
      if (!category) break;
      path.unshift(category);
      currentId = category.parentId;
    }
    
    return path;
  }, [categories]);
  
  const toggleExpand = useCallback((categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category?.name || 'Kategorie';
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      const wasExpanded = newSet.has(categoryId);
      if (wasExpanded) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      
      // Show toast for important categories (SNEAKER hierarchy)
      if (category?.slug === 'sneaker' || category?.parentId) {
        // Only show toast for SNEAKER-related categories
        const sneakerCategory = findSneakerCategory(categories);
        if (sneakerCategory && (categoryId === sneakerCategory.id || category?.parentId === sneakerCategory.id)) {
          showToast({
            type: 'info',
            title: wasExpanded ? 'Eingeklappt' : 'Erweitert',
            message: `"${categoryName}" wurde ${wasExpanded ? 'eingeklappt' : 'erweitert'}.`,
            duration: 2000
          });
        }
      }
      
      return newSet;
    });
  }, [categories, showToast]);
  
  // Find SNEAKER category (moved up for use in handleExpandAllSneaker)
  const sneakerCategory = useMemo(() => {
    return findSneakerCategory(categories);
  }, [categories]);

  // Quick expand/collapse all SNEAKER categories (moved before useEffect that uses it)
  const handleExpandAllSneaker = useCallback(() => {
    if (!sneakerCategory) {
      showToast({
        type: 'warning',
        title: 'SNEAKER Kategorie nicht gefunden',
        message: 'Bitte erstelle zuerst die SNEAKER Hauptkategorie.'
      });
      return;
    }
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      // Expand SNEAKER
      newSet.add(sneakerCategory.id);
      
      // Expand all brands (Level 1)
      const brands = categories.filter(cat => cat.parentId === sneakerCategory.id);
      let expandedCount = 1; // SNEAKER itself
      
      brands.forEach(brand => {
        newSet.add(brand.id);
        expandedCount++;
        
        // Expand all models (Level 2)
        const models = categories.filter(cat => cat.parentId === brand.id);
        models.forEach(model => {
          newSet.add(model.id);
          expandedCount++;
        });
      });
      
      showToast({
        type: 'success',
        title: 'SNEAKER Kategorien erweitert',
        message: `${expandedCount} Kategorien wurden erweitert.`
      });
      
      return newSet;
    });
  }, [sneakerCategory, categories, showToast]);
  
  // Keyboard shortcuts (Ctrl+E for expand all SNEAKER)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+E: Expand all SNEAKER categories
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExpandAllSneaker();
        return;
      }
      
      if (!selectedCategory) return;
      
      const currentCategory = categories.find(c => c.id === selectedCategory);
      if (!currentCategory) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Find next sibling or next node
          const siblings = categories.filter(c => c.parentId === currentCategory.parentId);
          const currentIndex = siblings.findIndex(c => c.id === selectedCategory);
          if (currentIndex < siblings.length - 1) {
            setSelectedCategory(siblings[currentIndex + 1].id);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          const siblingsUp = categories.filter(c => c.parentId === currentCategory.parentId);
          const currentIndexUp = siblingsUp.findIndex(c => c.id === selectedCategory);
          if (currentIndexUp > 0) {
            setSelectedCategory(siblingsUp[currentIndexUp - 1].id);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!expandedCategories.has(selectedCategory)) {
            toggleExpand(selectedCategory);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (expandedCategories.has(selectedCategory)) {
            toggleExpand(selectedCategory);
          }
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onCategorySelect?.(selectedCategory);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCategory, categories, expandedCategories, toggleExpand, onCategorySelect, handleExpandAllSneaker]);
  
  // Update breadcrumb when category is selected
  useEffect(() => {
    if (selectedCategory) {
      setBreadcrumbPath(buildBreadcrumbPath(selectedCategory));
    } else {
      setBreadcrumbPath([]);
    }
  }, [selectedCategory, buildBreadcrumbPath]);
  
  // Multi-select handlers
  const handleMultiSelect = useCallback((categoryId: string, checked: boolean) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(categoryId);
      } else {
        newSet.delete(categoryId);
      }
      return newSet;
    });
  }, []);
  
  const handleSelectAll = useCallback(() => {
    if (selectedCategories.size === categories.length) {
      setSelectedCategories(new Set());
      showToast({
        type: 'info',
        title: 'Auswahl aufgehoben',
        message: 'Alle Kategorien wurden abgewählt.'
      });
    } else {
      setSelectedCategories(new Set(categories.map(c => c.id)));
      showToast({
        type: 'info',
        title: 'Alle ausgewählt',
        message: `${categories.length} Kategorien wurden ausgewählt.`
      });
    }
  }, [selectedCategories, categories, showToast]);
  
  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return categoryTree;
    
    const filterTree = (nodes: CategoryNode[]): CategoryNode[] => {
      return nodes.reduce((acc, node) => {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            node.description?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const filteredChildren = node.children ? filterTree(node.children) : [];
        const hasMatchingChildren = filteredChildren.length > 0;
        
        if (matchesSearch || hasMatchingChildren) {
          acc.push({
            ...node,
            children: hasMatchingChildren ? filteredChildren : node.children,
            expanded: matchesSearch || hasMatchingChildren ? true : node.expanded
          });
        }
        
        return acc;
      }, [] as CategoryNode[]);
    };
    
    return filterTree(categoryTree);
  }, [categoryTree, searchTerm]);
  
  const handleDragStart = useCallback((e: React.DragEvent, categoryId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', categoryId);
    setDraggedCategory(categoryId);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    
    if (!draggedCategory || draggedCategory === targetCategoryId) {
      setDraggedCategory(null);
      return;
    }
    
    try {
      const targetCategory = categories.find(c => c.id === targetCategoryId);
      if (!targetCategory) {
        showToast({
          type: 'error',
          title: 'Fehler',
          message: 'Zielkategorie nicht gefunden.'
        });
        setDraggedCategory(null);
        return;
      }
      
      // Prevent circular references
      const draggedCat = categories.find(c => c.id === draggedCategory);
      if (draggedCat) {
        let currentParentId: string | undefined = targetCategoryId;
        while (currentParentId) {
          if (currentParentId === draggedCategory) {
            showToast({
              type: 'error',
              title: 'Zirkuläre Referenz',
              message: 'Eine Kategorie kann nicht zu ihrer eigenen Unterkategorie verschoben werden.'
            });
            setDraggedCategory(null);
            return;
          }
          const parent = categories.find(c => c.id === currentParentId);
          currentParentId = parent?.parentId;
        }
      }
      
      // Update parent
      await updateCategoryMutation.mutateAsync({
        id: draggedCategory,
        category: { parentId: targetCategoryId }
      });
      
      showToast({
        type: 'success',
        title: 'Kategorie verschoben',
        message: `Die Kategorie wurde erfolgreich zu "${targetCategory.name}" verschoben.`
      });
      
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unbekannter Fehler';
      handleError(error, { operation: 'move_category', draggedCategory, targetCategoryId });
      showToast({
        type: 'error',
        title: 'Verschicken fehlgeschlagen',
        message: `Die Kategorie konnte nicht verschoben werden: ${errorMessage}`
      });
    } finally {
      setDraggedCategory(null);
    }
  }, [draggedCategory, categories, updateCategoryMutation, showToast, refetch, handleError]);
  
  const handleDelete = useCallback(async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const categoryName = category?.name || 'diese Kategorie';
    
    // Enhanced confirmation dialog
    const confirmed = window.confirm(
      `⚠️ Kategorie löschen?\n\n` +
      `Möchten Sie "${categoryName}" wirklich löschen?\n\n` +
      `⚠️ WARNUNG: Alle Subkategorien und zugehörige Produkte werden ebenfalls gelöscht.\n\n` +
      `Diese Aktion kann nicht rückgängig gemacht werden!`
    );
    
    if (!confirmed) {
      showToast({
        type: 'info',
        title: 'Löschen abgebrochen',
        message: 'Die Kategorie wurde nicht gelöscht.'
      });
      return;
    }
    
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
      showToast({
        type: 'success',
        title: 'Kategorie gelöscht',
        message: `"${categoryName}" wurde erfolgreich gelöscht.`
      });
      // Refetch to update the list
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Unbekannter Fehler';
      handleError(error, { operation: 'delete_category', categoryId });
      showToast({
        type: 'error',
        title: 'Löschen fehlgeschlagen',
        message: `Fehler beim Löschen von "${categoryName}": ${errorMessage}`
      });
    }
  }, [deleteCategoryMutation, showToast, refetch, handleError, categories]);
  
  const handleAddSubcategory = useCallback((parentId: string) => {
    const parentCategory = categories.find(c => c.id === parentId);
    setEditorParentId(parentId);
    setEditorMode('create');
    setEditingCategory(null);
    setIsEditorOpen(true);
    onAddSubcategory?.(parentId);
    
    showToast({
      type: 'info',
      title: 'Neue Kategorie erstellen',
      message: parentCategory ? `Erstelle neue Kategorie unter "${parentCategory.name}"` : 'Erstelle neue Kategorie'
    });
  }, [onAddSubcategory, categories, showToast]);

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category);
    setEditorMode('edit');
    setEditorParentId(undefined);
    setIsEditorOpen(true);
    
    showToast({
      type: 'info',
      title: 'Kategorie bearbeiten',
      message: `Bearbeite "${category.name}"`
    });
  }, [showToast]);

  const handleEditorClose = useCallback(() => {
    setIsEditorOpen(false);
    setEditingCategory(null);
    setEditorParentId(undefined);
    // Refetch categories after editor closes to get updated data
    refetch().catch((error) => {
      handleError(error, { operation: 'refetch_after_editor_close' });
    });
  }, [refetch, handleError]);
  

  const handleCollapseAllSneaker = useCallback(() => {
    if (!sneakerCategory) {
      showToast({
        type: 'warning',
        title: 'SNEAKER Kategorie nicht gefunden',
        message: 'Bitte erstelle zuerst die SNEAKER Hauptkategorie.'
      });
      return;
    }
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      // Keep SNEAKER expanded, but collapse brands and models
      const brands = categories.filter(cat => cat.parentId === sneakerCategory.id);
      let collapsedCount = 0;
      
      brands.forEach(brand => {
        if (newSet.has(brand.id)) {
          newSet.delete(brand.id);
          collapsedCount++;
        }
        
        const models = categories.filter(cat => cat.parentId === brand.id);
        models.forEach(model => {
          if (newSet.has(model.id)) {
            newSet.delete(model.id);
            collapsedCount++;
          }
        });
      });
      
      if (collapsedCount > 0) {
        showToast({
          type: 'success',
          title: 'SNEAKER Hierarchie eingeklappt',
          message: `${collapsedCount} Kategorien wurden eingeklappt.`
        });
      }
      
      return newSet;
    });
  }, [sneakerCategory, categories, showToast]);

  // Level-basierte Farbcodierung und Icons mit Brand-spezifischen Farben
  const getLevelConfig = useCallback((level: number = 0, category?: Category) => {
    // Check if this is a brand (Level 1) and get brand-specific colors
    if (level === 1 && category) {
      const brand = findBrandForCategory(category.id, categories);
      if (brand) {
        const brandColors = getBrandColor(brand.name);
        return {
          color: brandColors.accent.replace('text-', 'text-'),
          bgColor: brandColors.primary.replace('from-', 'bg-').split(' ')[0],
          borderColor: brandColors.secondary.replace('border-', 'border-'),
          icon: '🏷️',
          label: 'Marke',
          hoverBg: brandColors.primary.replace('from-', 'hover:bg-').split(' ')[0],
          brandName: brand.name
        };
      }
    }

    switch (level) {
      case 0: // Hauptkategorie (SNEAKER)
        return {
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30',
          icon: '👟',
          label: 'Hauptkategorie',
          hoverBg: 'hover:bg-purple-500/10'
        };
      case 1: // Marke (NIKE, AIR JORDAN, etc.)
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          icon: '🏷️',
          label: 'Marke',
          hoverBg: 'hover:bg-blue-500/10'
        };
      case 2: // Modell (AIRMAX 95, etc.) - Hervorgehoben für bessere Sichtbarkeit
        return {
          color: 'text-emerald-200',
          bgColor: 'bg-emerald-500/40',
          borderColor: 'border-emerald-400/60',
          icon: '👟',
          label: 'Modell',
          hoverBg: 'hover:bg-emerald-500/30',
          glow: 'shadow-lg shadow-emerald-500/50'
        };
      default:
        return {
          color: 'text-white/60',
          bgColor: 'bg-white/5',
          borderColor: 'border-white/10',
          icon: '📦',
          label: 'Kategorie',
          hoverBg: 'hover:bg-white/5'
        };
    }
  }, [categories]);

  const renderCategoryNode = useCallback((node: CategoryNode, depth: number = 0) => {
    const isExpanded = expandedCategories.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedCategory === node.id;
    const isMultiSelected = selectedCategories.has(node.id);
    const isDragging = draggedCategory === node.id;
    const isHovered = hoveredCategory === node.id;
    const level = node.level || depth;
    const levelConfig = getLevelConfig(level, node);
    const productCount = node.productCount || categoryProductCounts.get(node.id) || 0;
    const hasProducts = productCount > 0;
    
    return (
      <div key={node.id} className="select-none">
        <motion.div
          draggable
          onDragStart={(e) => {
            const dragEvent = e as unknown as React.DragEvent;
            handleDragStart(dragEvent, node.id);
          }}
          onDragOver={(e) => {
            const dragEvent = e as unknown as React.DragEvent;
            handleDragOver(dragEvent);
          }}
          onDrop={(e) => {
            const dragEvent = e as unknown as React.DragEvent;
            handleDrop(dragEvent, node.id);
          }}
          onDragEnd={() => setDraggedCategory(null)}
          initial={{ opacity: 0, x: -20 }}
          animate={{ 
            opacity: isDragging ? 0.5 : 1, 
            x: 0,
            scale: isSelected ? 1.02 : 1
          }}
          whileHover={{ 
            x: level === 2 ? 6 : 4,
            scale: level === 2 ? 1.03 : 1.01,
            transition: { duration: 0.2, ease: 'easeOut' }
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          role="treeitem"
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={isSelected}
          aria-level={level + 1}
          aria-label={`${node.name}, ${levelConfig.label}, ${productCount} Produkte`}
          tabIndex={0}
          className={cn(
            'group flex items-center gap-2 px-4 py-3 rounded-lg transition-all border-2',
            'cursor-pointer relative',
            levelConfig.hoverBg,
            isSelected && `${levelConfig.bgColor} ${levelConfig.borderColor} border-opacity-60`,
            isMultiSelected && 'ring-2 ring-blue-500/50',
            isDragging && 'opacity-50 cursor-grabbing scale-95',
            !isSelected && !isMultiSelected && 'border-transparent',
            isHovered && level === 2 ? 'shadow-2xl shadow-emerald-500/60 ring-4 ring-emerald-400/50 scale-[1.02]' : 'shadow-lg shadow-purple-500/20',
            level === 2 && 'bg-gradient-to-r from-emerald-500/15 to-emerald-600/10 border-emerald-400/40',
            level === 1 && 'bg-gradient-to-r from-blue-500/10 to-purple-500/5',
            level === 2 && 'hover:from-emerald-500/25 hover:to-emerald-600/15 hover:border-emerald-400/60'
          )}
          onMouseEnter={() => setHoveredCategory(node.id)}
          onMouseLeave={() => setHoveredCategory(null)}
          style={{ paddingLeft: `${depth * 2 + 1}rem` }}
          onClick={(e) => {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
              handleMultiSelect(node.id, !isMultiSelected);
            } else {
              setSelectedCategory(node.id);
              onCategorySelect?.(node.id);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedCategory(node.id);
              onCategorySelect?.(node.id);
            }
          }}
        >
          {/* Multi-select checkbox */}
          <input
            type="checkbox"
            checked={isMultiSelected}
            onChange={(e) => {
              e.stopPropagation();
              handleMultiSelect(node.id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                handleMultiSelect(node.id, !isMultiSelected);
              }
            }}
            className="w-4 h-4 rounded border-white/20 bg-black/25 cursor-pointer hover:border-blue-400 hover:scale-110 transition-all focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
            aria-label={`${isMultiSelected ? 'Abwählen' : 'Auswählen'} ${node.name}`}
          />
          
          <GripVertical className={cn(
            'w-5 h-5 transition-colors',
            levelConfig.color,
            'opacity-30 group-hover:opacity-80 cursor-grab active:cursor-grabbing'
          )} />
          
          {hasChildren ? (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleExpand(node.id);
                }
              }}
              className="p-0.5 hover:bg-white/10 rounded transition-all focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              aria-label={isExpanded ? `${node.name} einklappen` : `${node.name} erweitern`}
              aria-expanded={isExpanded}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className={cn('w-4 h-4', levelConfig.color)} />
              </motion.div>
            </motion.button>
          ) : (
            <div className="w-5" />
          )}
          
          {/* Level Icon - Larger and more prominent, especially for models - OPTIMIERT */}
          <motion.div
            className={cn(
              level === 2 ? 'text-6xl p-6' : level === 1 ? 'text-4xl p-4' : 'text-2xl p-2',
              'rounded-xl transition-all duration-300',
              levelConfig.bgColor,
              levelConfig.borderColor,
              'border-2',
              level === 2 && 'shadow-2xl shadow-emerald-500/80 ring-4 ring-emerald-400/60',
              level === 1 && 'shadow-xl shadow-purple-500/40',
              level === 2 && 'bg-gradient-to-br from-emerald-500/40 via-green-500/30 to-emerald-400/20',
              level === 1 && 'bg-gradient-to-br from-purple-500/30 to-pink-500/20',
              'hover:brightness-110'
            )}
            whileHover={{ 
              scale: level === 2 ? 1.3 : level === 1 ? 1.2 : 1.15, 
              rotate: level === 2 ? 15 : level === 1 ? 8 : 5,
              boxShadow: level === 2 ? '0 0 40px rgba(16, 185, 129, 0.8)' : level === 1 ? '0 0 25px rgba(168, 85, 247, 0.6)' : undefined
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {node.icon || levelConfig.icon}
          </motion.div>
          
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <span className={cn(
                level === 2 ? 'text-3xl font-black' : level === 1 ? 'text-xl font-bold' : 'text-base font-semibold',
                'transition-all duration-200 block truncate',
                levelConfig.color,
                isSelected && 'text-white font-bold',
                level === 2 && 'drop-shadow-2xl text-emerald-100 font-black tracking-wide',
                level === 1 && 'drop-shadow-lg text-purple-100',
                'group-hover:scale-105'
              )}>
                {node.name}
              </span>
              {node.description && (
                <p className={cn(
                  'truncate mt-0.5',
                  level === 2 ? 'text-sm text-emerald-100/80 font-medium' : level === 1 ? 'text-xs text-white/60' : 'text-xs text-white/50'
                )}>
                  {node.description}
                </p>
              )}
            </div>
            
            {/* Level Badge - Larger, especially for models - OPTIMIERT */}
            <Badge 
              variant="outline" 
              className={cn(
                level === 2 ? 'text-lg px-5 py-2.5 font-black' : level === 1 ? 'text-sm px-3 py-1.5 font-bold' : 'text-xs px-2 py-1',
                levelConfig.borderColor,
                levelConfig.bgColor,
                levelConfig.color,
                level === 2 && 'ring-4 ring-emerald-400/60 shadow-2xl shadow-emerald-500/50',
                level === 2 && 'bg-gradient-to-r from-emerald-500/40 via-green-500/30 to-emerald-400/20',
                level === 2 && 'text-emerald-100 border-emerald-400/80',
                level === 1 && 'bg-gradient-to-r from-purple-500/30 to-pink-500/20',
                level === 1 && 'text-purple-100 border-purple-400/60',
                'transition-all duration-200 hover:scale-110'
              )}
            >
              {level === 2 ? '⭐ Modell' : level === 1 ? '🏷️ Marke' : `L${level}`}
            </Badge>
          </div>
          
          {/* Children Count Badge */}
          {hasChildren && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-1"
            >
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs font-bold px-2 py-1',
                  levelConfig.bgColor,
                  levelConfig.color
                )}
                title={`${node.children!.length} Unterkategorien`}
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                {node.children!.length}
              </Badge>
            </motion.div>
          )}
          
          {/* Product Count Badge - Enhanced, larger for models - OPTIMIERT */}
          {productCount > 0 && (
            <motion.div
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative group/product"
            >
              <Badge 
                variant="outline" 
                className={cn(
                  level === 2 ? 'text-lg font-black px-5 py-2.5' : level === 1 ? 'text-sm font-bold px-3 py-1.5' : 'text-xs font-bold px-2 py-1',
                  'cursor-pointer transition-all duration-200',
                  hasProducts 
                    ? 'bg-green-500/50 border-green-500/70 text-green-100 shadow-2xl shadow-green-500/40' 
                    : 'bg-white/5 border-white/10',
                  level === 2 && 'ring-4 ring-green-400/60',
                  level === 2 && hasProducts && 'bg-gradient-to-r from-green-500/50 via-emerald-500/40 to-green-400/30',
                  level === 1 && hasProducts && 'bg-gradient-to-r from-purple-500/30 to-pink-500/20',
                  'hover:brightness-110'
                )}
                title={`${productCount} Produkt${productCount !== 1 ? 'e' : ''}`}
              >
                <Package className={cn(level === 2 ? 'w-6 h-6' : level === 1 ? 'w-4 h-4' : 'w-3 h-3', 'mr-1.5')} />
                {productCount}
              </Badge>
              {/* Hover tooltip */}
              <div className="absolute right-0 top-full mt-1 opacity-0 group-hover/product:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-black/95 border border-white/20 rounded-lg p-2 text-xs whitespace-nowrap shadow-xl">
                  {productCount} Produkt{productCount !== 1 ? 'e' : ''} in dieser Kategorie
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Status Indicators - Enhanced for models */}
          {!hasProducts && (
            <Badge 
              variant="outline" 
              className={cn(
                level === 2 ? 'text-sm px-2 py-1 font-semibold' : 'text-xs',
                'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
                level === 2 && 'ring-2 ring-yellow-400/30'
              )}
            >
              <AlertTriangle className={cn(level === 2 ? 'w-4 h-4' : 'w-3 h-3', 'mr-1')} />
              Leer
            </Badge>
          )}
          {node.featured && (
            <Badge 
              variant="outline" 
              className={cn(
                level === 2 ? 'text-sm px-2 py-1 font-semibold' : 'text-xs',
                'bg-purple-500/20 border-purple-500/30 text-purple-400',
                level === 2 && 'ring-2 ring-purple-400/30 shadow-lg shadow-purple-500/20'
              )}
            >
              <Sparkles className={cn(level === 2 ? 'w-4 h-4' : 'w-3 h-3', 'mr-1')} />
              Featured
            </Badge>
          )}
          
          <div className={cn(
            "flex items-center gap-1 transition-all duration-200",
            level === 2 ? "opacity-60 group-hover:opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <DropdownMenu>
              {/* @ts-ignore - asChild is supported by DropdownMenuTrigger */}
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className={cn(
                    "h-8 w-8 p-0 transition-all duration-200",
                    level === 2 && "hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-transparent",
                    level === 1 && "hover:bg-purple-500/20 hover:border-purple-500/40 border border-transparent"
                  )}
                  aria-label="Kategorie-Aktionen"
                >
                  <MoreVertical className={cn(
                    level === 2 ? "w-5 h-5" : "w-4 h-4"
                  )} />
                </Button>
              </DropdownMenuTrigger>
              {/* @ts-ignore - align is supported by DropdownMenuContent */}
              <DropdownMenuContent align="end" className="z-50 bg-black/95 border-white/20 backdrop-blur-xl">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleAddSubcategory(node.id);
                  }}
                  disabled={isSettingUpSneaker || isSettingUp || isLoading}
                  className="hover:bg-white/10 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {level < 2 ? 'Subkategorie hinzufügen' : 'Produkt hinzufügen'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleEditCategory(node);
                  }}
                  disabled={isSettingUpSneaker || isSettingUp || isLoading}
                  className="hover:bg-white/10 cursor-pointer"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDelete(node.id);
                  }}
                  disabled={isSettingUpSneaker || isSettingUp || isLoading || deleteCategoryMutation.isPending}
                  className="text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteCategoryMutation.isPending ? 'Löschen...' : 'Löschen'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
        
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, x: -20 }}
              animate={{ height: 'auto', opacity: 1, x: 0 }}
              exit={{ height: 0, opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className={cn(
                'ml-4 border-l-2 pl-3 mt-1',
                levelConfig.borderColor,
                'border-opacity-30'
              )}>
                {node.children!.map(child => renderCategoryNode(child, depth + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Quick Preview on Hover */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-full ml-2 top-0 z-50 pointer-events-none"
          >
            <Card className="p-3 bg-black/95 border border-white/20 shadow-xl min-w-[200px]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{node.icon || levelConfig.icon}</span>
                  <div>
                    <div className="font-semibold text-white">{node.name}</div>
                    <div className="text-xs text-white/60">{levelConfig.label}</div>
                  </div>
                </div>
                {node.description && (
                  <p className="text-xs text-white/70 line-clamp-2">{node.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-xs">
                    {productCount} Produkte
                  </Badge>
                  {hasChildren && (
                    <Badge variant="outline" className="text-xs">
                      {node.children!.length} Unterkategorien
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    );
  }, [expandedCategories, selectedCategory, selectedCategories, draggedCategory, hoveredCategory, handleDragStart, handleDragOver, handleDrop, toggleExpand, onCategorySelect, handleAddSubcategory, handleDelete, getLevelConfig, categoryProductCounts, handleMultiSelect]);
  
  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900/50 to-black/50 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
            <Layers className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Kategorien-Hierarchie</h2>
            <p className="text-xs text-white/60">3-Level Struktur: Hauptkategorie → Marke → Modell</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick-Expand/Collapse All SNEAKER Buttons */}
          {sneakerCategory && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAllSneaker}
                disabled={isSettingUpSneaker || isLoading}
                className="border-purple-500/50 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Alle SNEAKER Kategorien expandieren (Ctrl+E)"
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Alle expandieren
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAllSneaker}
                disabled={isSettingUpSneaker || isLoading}
                className="border-purple-500/50 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Alle SNEAKER Kategorien einklappen"
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                Alle einklappen
              </Button>
            </div>
          )}
          
          {/* Multi-select actions */}
          {selectedCategories.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <span className="text-sm text-blue-400 font-medium">
                {selectedCategories.size} ausgewählt
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategories(new Set())}
                className="h-6 px-2 text-xs"
              >
                Abbrechen
              </Button>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMiniMap(!showMiniMap)}
            className="border-white/20 hover:bg-white/5"
          >
            <Eye className="w-4 h-4 mr-2" />
            Mini-Map
          </Button>
          
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={setupSneakerHierarchyHandler}
              disabled={isSettingUpSneaker || isSettingUp}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Erstellt die vollständige SNEAKER Hierarchie mit allen Marken und Modellen"
            >
              {isSettingUpSneaker ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {sneakerSetupProgress ? (
                    <div className="flex items-center gap-2">
                      <span>{sneakerSetupProgress.label}</span>
                      {sneakerSetupProgress.total > 0 && (
                        <span className="text-xs opacity-70">
                          ({sneakerSetupProgress.current}/{sneakerSetupProgress.total})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span>SNEAKER Setup läuft...</span>
                  )}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  SNEAKER Hierarchie Setup
                </>
              )}
            </Button>
            {/* Progress Bar - VERBESSERT */}
            {isSettingUpSneaker && sneakerSetupProgress && sneakerSetupProgress.total > 0 && (
              <Card className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-300 font-medium">{sneakerSetupProgress.label}</span>
                    <span className="text-purple-400 font-bold">
                      {sneakerSetupProgress.current}/{sneakerSetupProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(sneakerSetupProgress.current / sneakerSetupProgress.total) * 100}%` 
                      }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  {sneakerSetupProgress.stage && (
                    <div className="text-xs text-purple-300/80 mt-1 flex items-center gap-2">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        sneakerSetupProgress.stage === 'main' && "bg-blue-500/20 border-blue-500/40 text-blue-300",
                        sneakerSetupProgress.stage === 'brands' && "bg-purple-500/20 border-purple-500/40 text-purple-300",
                        sneakerSetupProgress.stage === 'models' && "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      )}>
                        {sneakerSetupProgress.stage === 'main' && 'Hauptkategorie'}
                        {sneakerSetupProgress.stage === 'brands' && 'Marken'}
                        {sneakerSetupProgress.stage === 'models' && 'Modelle'}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={setupMainCategories}
            disabled={isSettingUp || isSettingUpSneaker}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSettingUp ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Setup läuft...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Hauptkategorien Setup
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await refetch();
                showToast({
                  type: 'success',
                  title: 'Aktualisiert',
                  message: 'Kategorien wurden erfolgreich aktualisiert.',
                  duration: 2000
                });
              } catch (error: any) {
                handleError(error, { operation: 'refetch_categories' });
                showToast({
                  type: 'error',
                  title: 'Aktualisierung fehlgeschlagen',
                  message: 'Kategorien konnten nicht aktualisiert werden.'
                });
              }
            }}
            disabled={isLoading || isSettingUp || isSettingUpSneaker}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', (isLoading || isSettingUp || isSettingUpSneaker) && 'animate-spin')} />
            Aktualisieren
          </Button>
        </div>
      </div>
      
      {/* Breadcrumb Navigation */}
      {breadcrumbPath.length > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategory(null);
              setBreadcrumbPath([]);
            }}
            className="h-7 px-2"
          >
            <Home className="w-3 h-3" />
          </Button>
          {breadcrumbPath.map((cat, idx) => (
            <React.Fragment key={cat.id}>
              <ChevronRight className="w-4 h-4 text-white/40" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  onCategorySelect?.(cat.id);
                }}
                className={cn(
                  'h-7 px-2 text-sm',
                  idx === breadcrumbPath.length - 1 && 'text-primary font-semibold'
                )}
              >
                {cat.icon} {cat.name}
              </Button>
            </React.Fragment>
          ))}
        </div>
      )}
      
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            type="search"
            placeholder="Kategorien durchsuchen... (Strg+K für Shortcuts)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchTerm('');
              }
            }}
            className="pl-10 transition-all focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            aria-label="Kategorien durchsuchen"
            aria-describedby="search-hint"
          />
          <span id="search-hint" className="sr-only">
            Verwende Strg+K für Shortcuts, Escape zum Zurücksetzen
          </span>
        </div>
        {selectedCategories.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="whitespace-nowrap"
          >
            {selectedCategories.size === categories.length ? 'Alle abwählen' : 'Alle auswählen'}
          </Button>
        )}
      </div>
      
      {/* Keyboard Shortcuts Hint */}
      {selectedCategory && (
        <div className="mb-4 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
          <strong>Tastatur-Navigation:</strong> ↑↓ Navigieren | → Expandieren | ← Collapsen | Enter/Leertaste Auswählen | Shift/Ctrl+Klick Multi-Select
        </div>
      )}
      
      {/* Mini-Map */}
      {showMiniMap && (
        <Card className="mb-4 p-3 bg-black/50 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/80">Hierarchie-Übersicht</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMiniMap(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1 text-xs">
            {categoryTree.slice(0, 5).map(node => (
              <div key={node.id} className="flex items-center gap-2 text-white/60">
                <span>{node.icon}</span>
                <span className="truncate">{node.name}</span>
                {node.children && node.children.length > 0 && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    {node.children.length}
                  </Badge>
                )}
              </div>
            ))}
            {categoryTree.length > 5 && (
              <div className="text-xs text-white/40 text-center pt-1">
                +{categoryTree.length - 5} weitere...
              </div>
            )}
          </div>
        </Card>
      )}
      
      <div 
        className="space-y-1 max-h-[600px] overflow-y-auto"
        role="tree"
        aria-label="Kategorien-Hierarchie"
      >
        {filteredTree.length === 0 ? (
          <div className="text-center py-8 text-white/60" role="status" aria-live="polite">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Keine Kategorien gefunden</p>
            {searchTerm && (
              <p className="text-sm text-white/40 mt-2">
                Versuche einen anderen Suchbegriff oder{' '}
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-blue-400 hover:text-blue-300 underline focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded"
                >
                  Suche zurücksetzen
                </button>
              </p>
            )}
          </div>
        ) : (
          filteredTree.map(node => renderCategoryNode(node))
        )}
      </div>

      {/* CategoryEditor Modal */}
      <CategoryEditor
        open={isEditorOpen}
        onClose={handleEditorClose}
        category={editingCategory || undefined}
        parentId={editorParentId}
        mode={editorMode}
      />
    </Card>
  );
});

CategoryHierarchyManager.displayName = 'CategoryHierarchyManager';



