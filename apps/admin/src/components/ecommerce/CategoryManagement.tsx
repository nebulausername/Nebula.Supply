import React, { useState, useCallback, useMemo, memo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { InlineEdit } from '../ui/InlineEdit';
import { 
  Package, 
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
  Settings,
  Lock,
  Globe,
  Zap,
  Crown,
  BarChart3,
  RefreshCw,
  GripVertical,
  X,
  Layers,
  ChevronDown,
  Save,
  Download,
  Upload
} from 'lucide-react';
import { 
  useCategories, 
  useDeleteCategory, 
  useUpdateCategory, 
  useBulkUpdateCategoryOrder,
  useCategoryAnalytics,
  useProducts,
  useCreateProduct,
  useBulkGenerateProducts
} from '../../lib/api/shopHooks';
import type { Category } from '../../lib/api/ecommerce';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { logger } from '../../lib/logger';
import { generateProductsForCategory } from '../../lib/utils/productGenerator';
import { Sparkles } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CategoryManagementProps {
  viewMode: 'grid' | 'list';
  searchTerm: string;
}

export const CategoryManagement = memo(({ viewMode, searchTerm }: CategoryManagementProps) => {
  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('CategoryManagement');
  const { handleError } = useErrorHandler('CategoryManagement');
  const { showToast } = useToast();

  // State management
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'order' | 'products' | 'createdAt'>('order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterFeatured, setFilterFeatured] = useState<string>('all');
  const [categoryType, setCategoryType] = useState<'shop' | 'drop'>('shop');
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterSneaker, setFilterSneaker] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // API hooks
  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories
  } = useCategories({
    type: categoryType,
    featured: filterFeatured !== 'all' ? filterFeatured === 'featured' : undefined,
    search: searchTerm,
    sortBy,
    sortOrder,
  });

  // Fetch products to count per category
  const { data: productsResponse } = useProducts({ 
    type: categoryType === 'shop' ? ['shop'] : ['drop'],
    limit: 1000 // Get all products to count
  });

  const deleteCategoryMutation = useDeleteCategory();
  const updateCategoryMutation = useUpdateCategory();
  const bulkUpdateOrderMutation = useBulkUpdateCategoryOrder();
  const createProductMutation = useCreateProduct();
  const bulkGenerateProductsMutation = useBulkGenerateProducts();
  
  // State for product generation
  const [isGeneratingProducts, setIsGeneratingProducts] = useState(false);
  const [generatingCategoryId, setGeneratingCategoryId] = useState<string | null>(null);

  // Extract data
  const categories = categoriesResponse?.data || [];
  const products = productsResponse?.data || [];

  // Process categories data with actual product counts
  const processedCategories = useMemo(() => {
    return categories.map(category => {
      const categoryProducts = products.filter((p: any) => p.categoryId === category.id);
      const totalProducts = categoryProducts.length;
      const totalRevenue = categoryProducts.reduce((sum: number, p: any) => sum + (p.price || 0), 0);
      const averagePrice = totalProducts > 0 ? totalRevenue / totalProducts : 0;
      
      return {
        ...category,
        totalProducts,
        totalRevenue,
        averagePrice,
        isLowProducts: totalProducts < 5,
        isHighPerformance: totalProducts > 20,
        lastUpdated: category.updatedAt || new Date().toISOString(),
        productTypes: {
          shop: categoryProducts.filter((p: any) => p.type === 'shop' || !p.type).length,
          drop: categoryProducts.filter((p: any) => p.type === 'drop').length
        }
      };
    });
  }, [categories, products]);

  // Helper function to calculate category level
  const getCategoryLevel = useCallback((category: any): number => {
    if (!category.parentId) return 0;
    
    let level = 0;
    let currentParentId: string | undefined = category.parentId;
    const visited = new Set<string>();
    
    while (currentParentId) {
      if (visited.has(currentParentId)) return -1;
      visited.add(currentParentId);
      
      const parent = categories.find(c => c.id === currentParentId);
      if (!parent) break;
      
      level++;
      currentParentId = parent.parentId;
      if (level > 10) break;
    }
    
    return level;
  }, [categories]);

  // Filter categories by level and SNEAKER hierarchy
  const filteredCategories = useMemo(() => {
    let filtered = [...processedCategories];
    
    // Filter by SNEAKER hierarchy
    if (filterSneaker) {
      const sneakerCategory = categories.find(c => c.slug === 'sneaker' || c.name === 'SNEAKER' || c.name.toLowerCase() === 'sneaker');
      if (sneakerCategory) {
        // Get all categories in SNEAKER hierarchy (including sneaker itself, brands, and models)
        const sneakerIds = new Set<string>([sneakerCategory.id]);
        const brands = categories.filter(c => c.parentId === sneakerCategory.id);
        brands.forEach(brand => {
          sneakerIds.add(brand.id);
          const models = categories.filter(c => c.parentId === brand.id);
          models.forEach(model => sneakerIds.add(model.id));
        });
        filtered = filtered.filter(cat => sneakerIds.has(cat.id));
      }
    }
    
    // Filter by level
    if (filterLevel !== null) {
      filtered = filtered.filter(cat => getCategoryLevel(cat) === filterLevel);
    }
    
    return filtered;
  }, [processedCategories, filterLevel, filterSneaker, getCategoryLevel, categories]);

  // Handlers
  const handleCategorySelect = useCallback((categoryId: string, checked: boolean) => {
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

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedCategories(new Set(filteredCategories.map(c => c.id)));
    } else {
      setSelectedCategories(new Set());
    }
  }, [filteredCategories]);

  const handleCategoryUpdate = useCallback(async (categoryId: string, field: string, value: any) => {
    await measureAsync('category_update', async () => {
      logger.logUserAction('category_updated', { categoryId, field, value });
      try {
        await updateCategoryMutation.mutateAsync({
          id: categoryId,
          category: { [field]: value }
        });
      } catch (error) {
        handleError(error, { operation: 'category_update', categoryId, field });
      }
    });
  }, [measureAsync, updateCategoryMutation, handleError]);

  const handleBulkAction = useCallback(async (action: string) => {
    await measureAsync('bulk_action', async () => {
      logger.logUserAction('bulk_action', { action, categoryIds: Array.from(selectedCategories) });
      try {
        if (action === 'delete') {
          for (const categoryId of Array.from(selectedCategories)) {
            await deleteCategoryMutation.mutateAsync(categoryId);
          }
          setSelectedCategories(new Set());
        } else if (action === 'feature') {
          for (const categoryId of Array.from(selectedCategories)) {
            await updateCategoryMutation.mutateAsync({
              id: categoryId,
              category: { featured: true }
            });
          }
        } else if (action === 'unfeature') {
          for (const categoryId of Array.from(selectedCategories)) {
            await updateCategoryMutation.mutateAsync({
              id: categoryId,
              category: { featured: false }
            });
          }
        }
        refetchCategories();
      } catch (error) {
        handleError(error, { operation: 'bulk_action', action });
      }
    });
  }, [selectedCategories, measureAsync, deleteCategoryMutation, updateCategoryMutation, refetchCategories, handleError]);

  // Generate products for a single category
  const handleGenerateProducts = useCallback(async (categoryId: string) => {
    const categoriesArray = Array.isArray(processedCategories) ? processedCategories : [];
    const category = categoriesArray.find(c => c && c.id === categoryId);
    if (!category) return;

    setIsGeneratingProducts(true);
    setGeneratingCategoryId(categoryId);

    try {
      const result = await bulkGenerateProductsMutation.mutateAsync({
        categories: [{
          id: category.id,
          name: category.name,
          icon: category.icon,
          description: category.description,
        }],
        count: 2 + Math.floor(Math.random() * 2), // 2-3 products
      });

      if (result?.data) {
        const created = result.data.created || 0;
        showToast({
          type: 'success',
          title: 'Produkte generiert',
          message: `${created} Produkte für "${category.name}" erstellt`,
          duration: 4000,
        });
        refetchCategories();
      }
    } catch (error) {
      handleError(error, { operation: 'generate_products', categoryId });
      showToast({
        type: 'error',
        title: 'Fehler beim Generieren',
        message: `Konnte keine Produkte für "${category.name}" erstellen`,
        duration: 5000,
      });
    } finally {
      setIsGeneratingProducts(false);
      setGeneratingCategoryId(null);
    }
  }, [processedCategories, bulkGenerateProductsMutation, refetchCategories, handleError, showToast]);

  // Generate products for all empty categories
  const handleGenerateProductsForAllEmpty = useCallback(async () => {
    const emptyCategories = processedCategories.filter(c => c.totalProducts === 0);
    if (emptyCategories.length === 0) return;

    setIsGeneratingProducts(true);

    try {
      const result = await bulkGenerateProductsMutation.mutateAsync({
        categories: emptyCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
        })),
        count: 2 + Math.floor(Math.random() * 2), // 2-3 products per category
      });

      if (result?.data) {
        const created = result.data.created || 0;
        showToast({
          type: 'success',
          title: 'Produkte generiert',
          message: `${created} Produkte für ${emptyCategories.length} Kategorien erstellt`,
          duration: 5000,
        });
        refetchCategories();
      }
    } catch (error) {
      handleError(error, { operation: 'generate_products_bulk' });
      showToast({
        type: 'error',
        title: 'Fehler beim Generieren',
        message: 'Konnte nicht alle Produkte generieren',
        duration: 5000,
      });
    } finally {
      setIsGeneratingProducts(false);
    }
  }, [processedCategories, bulkGenerateProductsMutation, refetchCategories, handleError, showToast]);

  // Drag and Drop handlers
  const handleDragStart = (categoryId: string) => {
    setDraggedCategory(categoryId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetCategoryId: string) => {
    if (!draggedCategory || draggedCategory === targetCategoryId) {
      setDraggedCategory(null);
      return;
    }

    try {
      const draggedIndex = filteredCategories.findIndex(c => c.id === draggedCategory);
      const targetIndex = filteredCategories.findIndex(c => c.id === targetCategoryId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Create new order updates
      const updates = filteredCategories.map((category, index) => {
        let newOrder = category.order;
        
        if (draggedIndex < targetIndex) {
          // Moving down
          if (index === draggedIndex) {
            newOrder = filteredCategories[targetIndex].order;
          } else if (index > draggedIndex && index <= targetIndex) {
            newOrder = filteredCategories[index - 1].order;
          }
        } else {
          // Moving up
          if (index === draggedIndex) {
            newOrder = filteredCategories[targetIndex].order;
          } else if (index >= targetIndex && index < draggedIndex) {
            newOrder = filteredCategories[index + 1].order;
          }
        }

        return {
          categoryId: category.id,
          order: newOrder
        };
      });

      const filteredCategoriesArray = Array.isArray(filteredCategories) ? filteredCategories : [];
      await bulkUpdateOrderMutation.mutateAsync(updates.filter(u => 
        u.order !== filteredCategoriesArray.find(c => c && c.id === u.categoryId)?.order
      ));
      
      refetchCategories();
    } catch (error) {
      handleError(error, { operation: 'category_reorder' });
    } finally {
      setDraggedCategory(null);
    }
  };

  const getPerformanceBadge = (category: any) => {
    if (category.isHighPerformance) {
      return <Badge variant="success" className="text-green-400">Hohe Performance</Badge>;
    }
    if (category.isLowProducts) {
      return <Badge variant="warning" className="text-yellow-400">Wenige Produkte</Badge>;
    }
    return <Badge variant="outline" className="text-gray-400">Normal</Badge>;
  };

  const getStatusBadge = (category: any) => {
    if (category.featured) {
      return <Badge variant="outline" className="text-purple-400 border-purple-400">Featured</Badge>;
    }
    return <Badge variant="outline" className="text-gray-400">Standard</Badge>;
  };

  if (categoriesError) {
    return (
      <Card className="p-12 text-center border-red-500/30">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold mb-2">Kategorien konnten nicht geladen werden</h3>
        <p className="text-muted-foreground mb-4">Bitte versuche es erneut</p>
        <Button onClick={() => refetchCategories()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Erneut versuchen
        </Button>
      </Card>
    );
  }

  if (categoriesLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-24 bg-gray-800/50 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Typ:</label>
            <select
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value as 'shop' | 'drop')}
              className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
            >
              <option value="shop">Shop-Kategorien</option>
              <option value="drop">Vape-Drop-Kategorien</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Level:</label>
            <select
              value={filterLevel === null ? 'all' : filterLevel.toString()}
              onChange={(e) => setFilterLevel(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
            >
              <option value="all">Alle Level</option>
              <option value="0">Level 0 (Hauptkategorien)</option>
              <option value="1">Level 1 (Marken)</option>
              <option value="2">Level 2 (Modelle)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">SNEAKER:</label>
            <Button
              variant={filterSneaker ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const sneakerCategory = categories.find(c => c.slug === 'sneaker' || c.name === 'SNEAKER' || c.name.toLowerCase() === 'sneaker');
                if (sneakerCategory) {
                  setFilterSneaker(!filterSneaker);
                  if (!filterSneaker) {
                    showToast({
                      type: 'info',
                      title: 'SNEAKER Filter aktiviert',
                      message: 'Zeige alle SNEAKER Hierarchie-Kategorien (Hauptkategorie, Marken, Modelle).',
                      duration: 2000
                    });
                  } else {
                    showToast({
                      type: 'info',
                      title: 'SNEAKER Filter deaktiviert',
                      message: 'Zeige alle Kategorien.',
                      duration: 2000
                    });
                  }
                } else {
                  showToast({
                    type: 'warning',
                    title: 'SNEAKER Kategorie nicht gefunden',
                    message: 'Bitte erstelle zuerst die SNEAKER Hauptkategorie.',
                    duration: 4000
                  });
                }
              }}
              className={cn(
                "text-xs transition-all",
                filterSneaker && "bg-gradient-to-r from-purple-500/30 to-pink-500/20 border-purple-500/50"
              )}
            >
              <Layers className="w-3 h-3 mr-1" />
              {filterSneaker ? 'SNEAKER aktiv' : 'SNEAKER Hierarchie'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Featured:</label>
            <select
              value={filterFeatured}
              onChange={(e) => setFilterFeatured(e.target.value)}
              className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
            >
              <option value="all">Alle Kategorien</option>
              <option value="featured">Nur Featured</option>
              <option value="not-featured">Nicht Featured</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sortieren nach:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
            >
              <option value="order">Reihenfolge</option>
              <option value="name">Name</option>
              <option value="products">Produktanzahl</option>
              <option value="createdAt">Zuletzt aktualisiert</option>
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

        {/* Bulk Actions */}
        <div className="space-y-2">
          {selectedCategories.size > 0 && (
            <Card className="p-4 bg-blue-900/20 border-blue-500/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedCategories.size} Kategor{selectedCategories.size !== 1 ? 'ien' : 'ie'} ausgewählt
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleBulkAction('feature')}>
                    <Star className="w-4 h-4 mr-1" />
                    Featured
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('unfeature')}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Nicht Featured
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Löschen
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Generate Products for Empty Categories */}
          {processedCategories.filter(c => c.totalProducts === 0).length > 0 && (
            <Card className="p-4 bg-yellow-900/20 border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">
                    {processedCategories.filter(c => c.totalProducts === 0).length} Kategorien ohne Produkte
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateProductsForAllEmpty}
                  disabled={isGeneratingProducts}
                  className="hover:bg-yellow-500/10 hover:border-yellow-500/50"
                >
                  {isGeneratingProducts ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1" />
                  )}
                  Produkte für alle generieren
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Floating Action Bar for Bulk Operations */}
        {selectedCategories.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    {selectedCategories.size} ausgewählt
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleBulkAction('feature')}>
                    <Star className="w-4 h-4 mr-1" />
                    Featured
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('unfeature')}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Nicht Featured
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    if (confirm(`Möchten Sie wirklich ${selectedCategories.size} Kategorien löschen?`)) {
                      handleBulkAction('delete');
                    }
                  }}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Löschen
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedCategories(new Set())}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Categories Grid - Enhanced with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((category) => {
            const getCategoryLevel = (cat: any): number => {
              if (!cat.parentId) return 0;
              const parent = categories.find((c: any) => c.id === cat.parentId);
              if (!parent) return 1;
              if (!parent.parentId) return 1;
              return 2;
            };
            const level = getCategoryLevel(category);
            const levelColors = [
              { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30', text: 'text-purple-400' },
              { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30', text: 'text-blue-400' },
              { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30', text: 'text-green-400' }
            ];
            const levelColor = levelColors[level] || levelColors[0];
            
            return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
            >
              <Card 
                className={`group relative p-5 cursor-move border-2 backdrop-blur-sm bg-gradient-to-br ${
                  category.totalProducts === 0 
                    ? 'from-yellow-500/10 to-orange-500/10 border-yellow-500/40' 
                    : category.featured 
                    ? `from-purple-500/20 to-pink-500/20 border-purple-500/40`
                    : `${levelColor.bg} ${levelColor.border}`
                } ${
                  draggedCategory === category.id ? 'opacity-50 scale-95' : 'hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/20'
                } transition-all duration-300`}
              draggable
              onDragStart={() => handleDragStart(category.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(category.id)}
            >
              {/* Level Badge */}
              <div className="absolute top-2 left-2 z-10">
                <Badge 
                  variant="outline" 
                  className={`text-xs font-bold ${levelColor.border} ${levelColor.text} bg-black/50 backdrop-blur-sm`}
                >
                  L{level}
                </Badge>
              </div>
              
              {/* Quick Actions Overlay - Enhanced */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-black/80 hover:bg-blue-600/80 border border-white/20"
                  title="Bearbeiten"
                >
                  <Edit className="w-4 h-4 text-blue-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-black/80 hover:bg-red-600/80 border border-white/20"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <GripVertical className="w-5 h-5 text-white/30 cursor-grab active:cursor-grabbing flex-shrink-0 hover:text-white/60 transition-colors" />
                  <input
                    type="checkbox"
                    checked={selectedCategories.has(category.id)}
                    onChange={(e) => handleCategorySelect(category.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-white/20 bg-black/25 w-5 h-5 cursor-pointer hover:border-blue-400 hover:scale-110 transition-all flex-shrink-0"
                  />
                  <motion.div 
                    className="text-5xl flex-shrink-0" 
                    title={category.name}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {category.icon}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <InlineEdit
                      value={category.name}
                      onSave={(newName) => handleCategoryUpdate(category.id, 'name', newName)}
                      className="font-bold text-lg truncate group-hover:text-blue-400 transition-colors"
                    />
                  </div>
                </div>
                <DropdownMenu>
                  {/* @ts-ignore - asChild is supported by DropdownMenuTrigger */}
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      Details anzeigen
                    </DropdownMenuItem>
                    {category.totalProducts === 0 && (
                      <DropdownMenuItem
                        onClick={() => handleGenerateProducts(category.id)}
                        // @ts-ignore - disabled is supported by DropdownMenuItem
                        disabled={isGeneratingProducts && generatingCategoryId === category.id}
                      >
                        {isGeneratingProducts && generatingCategoryId === category.id ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Produkte generieren
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Kategorie bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplizieren
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {category.description || 'Keine Beschreibung'}
                </p>

                {/* Product Count - Enhanced with Glassmorphism */}
                <motion.div 
                  className={`bg-gradient-to-br backdrop-blur-md ${category.totalProducts === 0 ? 'from-yellow-500/30 to-orange-500/30 border-yellow-500/40' : 'from-blue-500/30 to-purple-500/30 border-blue-500/40'} rounded-xl p-5 border-2 shadow-lg`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white/60 mb-1 font-medium">Produkte</div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {category.totalProducts}
                      </div>
                    </div>
                    {category.totalProducts === 0 ? (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateProducts(category.id)}
                          disabled={isGeneratingProducts && generatingCategoryId === category.id}
                          className="hover:bg-yellow-500/20 hover:border-yellow-500/50 border-yellow-500/30"
                        >
                          {isGeneratingProducts && generatingCategoryId === category.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                        <Package className="w-10 h-10 text-blue-400 opacity-70" />
                      </motion.div>
                    )}
                  </div>
                  {category.totalProducts === 0 && (
                    <motion.div 
                      className="mt-3 text-xs text-yellow-300 flex items-center gap-1 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <AlertCircle className="w-3 h-3" />
                      Keine Produkte - Klicke zum Generieren
                    </motion.div>
                  )}
                </motion.div>

                {/* Analytics Grid - Enhanced */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <motion.div 
                    className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30 hover:border-green-500/50 transition-all"
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div className="text-xs text-white/60 mb-1 font-medium">Ø Preis</div>
                    <div className="font-bold text-green-400 text-xl">
                      {category.averagePrice > 0 ? `€${category.averagePrice.toFixed(2)}` : 'N/A'}
                    </div>
                  </motion.div>
                  <motion.div 
                    className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 hover:border-purple-500/50 transition-all"
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div className="text-xs text-white/60 mb-1 font-medium">Umsatz</div>
                    <div className="font-bold text-purple-400 text-xl">
                      {category.totalRevenue > 0 ? `€${(category.totalRevenue / 100).toFixed(0)}` : '€0'}
                    </div>
                  </motion.div>
                </div>

                {/* Status and Performance */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(category)}
                    {getPerformanceBadge(category)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                    {category.productTypes.shop} Shop
                    {category.productTypes.drop > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                        {category.productTypes.drop} Drops
                      </>
                    )}
                  </div>
                </div>

                {/* Featured Badge */}
                {category.featured && (
                  <div className="flex items-center gap-2 text-purple-400 bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">Featured Kategorie</span>
                  </div>
                )}

                {/* Order Indicator */}
                <div className="text-xs text-muted-foreground flex items-center justify-between pt-2 border-t border-white/10">
                  <span>Reihenfolge: {category.order || 0}</span>
                  <span className="text-blue-400">#{filteredCategories.findIndex(c => c.id === category.id) + 1}</span>
                </div>
              </div>
            </Card>
            </motion.div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Keine Kategorien gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Versuche deine Filter oder Suchbegriffe anzupassen
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Neue Kategorie hinzufügen
            </Button>
          </Card>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Typ:</label>
          <select
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value as 'shop' | 'drop')}
            className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
          >
            <option value="shop">Shop-Kategorien</option>
            <option value="drop">Vape-Drop-Kategorien</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Featured:</label>
          <select
            value={filterFeatured}
            onChange={(e) => setFilterFeatured(e.target.value)}
            className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
          >
            <option value="all">Alle Kategorien</option>
            <option value="featured">Nur Featured</option>
            <option value="not-featured">Nicht Featured</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sortieren nach:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 bg-black/25 border border-white/20 rounded-md text-sm"
          >
            <option value="order">Reihenfolge</option>
            <option value="name">Name</option>
            <option value="products">Produktanzahl</option>
            <option value="createdAt">Zuletzt aktualisiert</option>
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

      {/* Categories Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedCategories.size === filteredCategories.length && filteredCategories.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-white/20 bg-black/25"
                  />
                </TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Reihenfolge</TableHead>
                <TableHead>Produkte</TableHead>
                <TableHead>Umsatz</TableHead>
                <TableHead>Ø Preis</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => (
                <TableRow key={category.id} className="hover:bg-white/5">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedCategories.has(category.id)}
                      onChange={(e) => handleCategorySelect(category.id, e.target.checked)}
                      className="rounded border-white/20 bg-black/25"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <InlineEdit
                          value={category.name}
                          onSave={(newName) => handleCategoryUpdate(category.id, 'name', newName)}
                          className="font-medium"
                        />
                        <div className="text-sm text-muted-foreground">
                          {category.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Slug: {category.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <InlineEdit
                      value={category.order || 0}
                      onSave={(newOrder) => handleCategoryUpdate(category.id, 'order', newOrder)}
                      type="number"
                      className="font-medium"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-semibold text-neon">{category.totalProducts}</div>
                      <div className="text-xs text-muted-foreground">
                        {category.productTypes.shop} shop • {category.productTypes.drop} drops
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-400">
                      €{category.totalRevenue.toFixed(0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      €{category.averagePrice.toFixed(0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPerformanceBadge(category)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(category)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      {/* @ts-ignore - asChild is supported by DropdownMenuTrigger */}
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Details anzeigen
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Kategorie bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplizieren
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400">
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
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Keine Kategorien gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Versuche deine Filter oder Suchbegriffe anzupassen
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Neue Kategorie hinzufügen
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
});
CategoryManagement.displayName = 'CategoryManagement';





































