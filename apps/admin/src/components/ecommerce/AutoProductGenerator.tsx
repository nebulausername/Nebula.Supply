import React, { useState, useCallback, useMemo, memo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { 
  Package,
  Sparkles,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Play,
  X,
  Loader2,
  Filter,
  ChevronDown,
  ChevronRight,
  Euro,
  Tag,
  Layers
} from 'lucide-react';
import { 
  useCategories,
  useCreateProduct,
  useProducts
} from '../../lib/api/shopHooks';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { useToast } from '../ui/Toast';
import { 
  getCategoryTemplate, 
  generateSKU, 
  generateProductName,
  SNEAKER_SUBCATEGORIES,
  KLEIDUNG_SUBCATEGORIES,
  SNEAKER_HIERARCHY
} from '../../lib/utils/productTemplates';
import type { Product } from '../../lib/api/ecommerce';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Progress } from '../ui/Progress';

interface AutoProductGeneratorProps {
  categoryId?: string;
  onComplete?: (products: Product[]) => void;
}

interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
  currentBrand?: string;
  currentModel?: string;
  startTime?: number;
  errors?: Array<{ categoryId: string; categoryName: string; error: string }>;
}

// Berechne Level einer Kategorie
function getCategoryLevel(category: any, allCategories: any[]): number {
  if (!category.parentId) return 0;
  
  let level = 0;
  let currentParentId: string | undefined = category.parentId;
  const visited = new Set<string>();
  
  while (currentParentId) {
    if (visited.has(currentParentId)) return -1;
    visited.add(currentParentId);
    
    const parent = allCategories.find((c: any) => c.id === currentParentId);
    if (!parent) break;
    
    level++;
    currentParentId = parent.parentId;
    if (level > 10) break;
  }
  
  return level;
}

export const AutoProductGenerator = memo(({ 
  categoryId,
  onComplete 
}: AutoProductGeneratorProps) => {
  const { handleError } = useErrorHandler('AutoProductGenerator');
  const { showToast } = useToast();
  
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [filterLevel, setFilterLevel] = useState<number | null>(3); // Nur Modelle (Level 3)
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<GenerationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    errors: []
  });
  
  const { data: categoriesResponse } = useCategories({
    type: 'shop',
    limit: 1000
  });
  
  const { data: productsResponse } = useProducts({
    type: ['shop'],
    limit: 1000
  });
  
  const createProductMutation = useCreateProduct();
  
  const categories = categoriesResponse?.data || [];
  const products = productsResponse?.data || [];
  
  // Finde Subkategorien ohne Produkte, gefiltert nach Level
  const subcategoriesWithoutProducts = useMemo(() => {
    if (!Array.isArray(categories) || !Array.isArray(products)) return [];
    
    return categories.filter(cat => {
      // Level-Filter: Nur Modelle (Level 3) wenn Filter aktiv
      if (filterLevel !== null) {
        const level = getCategoryLevel(cat, categories);
        if (level !== filterLevel) return false;
      } else {
        // Mindestens Level 1 (Subkategorien)
        if (!cat.parentId) return false;
      }
      
      // Prüfe ob bereits ein Produkt existiert
      const hasProduct = products.some(p => p.categoryId === cat.id);
      
      return !hasProduct;
    });
  }, [categories, products, filterLevel]);

  // Gruppiere nach Marke (Parent-Kategorie)
  const categoriesByBrand = useMemo(() => {
    const grouped = new Map<string, typeof subcategoriesWithoutProducts>();
    
    subcategoriesWithoutProducts.forEach(cat => {
      if (!cat.parentId) return;
      
      const brand = categories.find(c => c.id === cat.parentId);
      if (!brand) return;
      
      const brandKey = brand.id;
      if (!grouped.has(brandKey)) {
        grouped.set(brandKey, []);
      }
      grouped.get(brandKey)!.push(cat);
    });
    
    return grouped;
  }, [subcategoriesWithoutProducts, categories]);

  // Preview der zu erstellenden Produkte
  const previewProducts = useMemo(() => {
    if (!showPreview || selectedCategories.size === 0) return [];
    
    return Array.from(selectedCategories).map(categoryId => {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return null;
      
      const parentCategory = category.parentId 
        ? categories.find(c => c.id === category.parentId)
        : null;
      const grandParentCategory = parentCategory?.parentId
        ? categories.find(c => c.id === parentCategory.parentId)
        : null;
      
      const categorySlug = grandParentCategory?.slug || parentCategory?.slug || category.slug;
      const template = getCategoryTemplate(categorySlug);
      
      const productName = generateProductName(
        parentCategory?.name || '',
        category.name
      );
      
      return {
        categoryId: category.id,
        categoryName: category.name,
        brandName: parentCategory?.name || 'Unbekannt',
        productName,
        price: template?.defaultPrice || 0,
        sku: generateSKU(categorySlug, productName),
        template
      };
    }).filter(Boolean) as Array<{
      categoryId: string;
      categoryName: string;
      brandName: string;
      productName: string;
      price: number;
      sku: string;
      template: any;
    }>;
  }, [selectedCategories, categories, showPreview]);
  
  const handleCategoryToggle = useCallback((categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);
  
  const handleSelectAll = useCallback(() => {
    if (selectedCategories.size === subcategoriesWithoutProducts.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(subcategoriesWithoutProducts.map(c => c.id)));
    }
  }, [selectedCategories, subcategoriesWithoutProducts]);

  // Batch-Auswahl nach Marke
  const handleSelectBrand = useCallback((brandId: string) => {
    const brandCategories = categoriesByBrand.get(brandId) || [];
    const brandCategoryIds = brandCategories.map(c => c.id);
    const allSelected = brandCategoryIds.every(id => selectedCategories.has(id));
    
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        brandCategoryIds.forEach(id => newSet.delete(id));
      } else {
        brandCategoryIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }, [categoriesByBrand, selectedCategories]);

  const toggleBrandExpand = useCallback((brandId: string) => {
    setExpandedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brandId)) {
        newSet.delete(brandId);
      } else {
        newSet.add(brandId);
      }
      return newSet;
    });
  }, []);
  
  const generateProducts = useCallback(async () => {
    if (selectedCategories.size === 0) {
      showToast({
        type: 'error',
        title: 'Keine Kategorien ausgewählt',
        message: 'Bitte wählen Sie mindestens eine Subkategorie aus.'
      });
      return;
    }
    
    setIsGenerating(true);
    setProgress({
      total: selectedCategories.size,
      completed: 0,
      failed: 0,
      startTime: Date.now(),
      errors: []
    });
    
    const generatedProducts: Product[] = [];
    const categoryIds = Array.from(selectedCategories);
    
    for (let i = 0; i < categoryIds.length; i++) {
      const categoryId = categoryIds[i];
      const category = categories.find(c => c.id === categoryId);
      
      if (!category) {
        setProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
        continue;
      }
      
      // Finde Parent-Kategorie für Template
      const parentCategory = category.parentId 
        ? categories.find(c => c.id === category.parentId)
        : null;
      
      const categorySlug = parentCategory?.slug || category.slug;
      const template = getCategoryTemplate(categorySlug);
      
      if (!template) {
        setProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
        continue;
      }
      
      const brand = parentCategory?.name || 'Unbekannt';
      setProgress(prev => ({ 
        ...prev, 
        current: category.name,
        currentBrand: brand,
        currentModel: category.name
      }));
      
      try {
        const productName = generateProductName(
          parentCategory?.name || '',
          category.name
        );
        
        const productData: Partial<Product> = {
          name: productName,
          description: template.defaultDescription,
          price: template.defaultPrice,
          categoryId: category.id,
          sku: generateSKU(categorySlug, productName),
          inventory: template.defaultStock || 10,
          variants: template.defaultVariants?.map(v => ({
            name: v.name,
            options: v.options.map(opt => ({
              name: opt,
              priceModifier: 0
            })),
            required: v.required || false
          })) || [],
          badges: template.defaultTags || []
        };
        
        const response = await createProductMutation.mutateAsync(productData);
        generatedProducts.push(response.data);
        
        setProgress(prev => ({ 
          ...prev, 
          completed: prev.completed + 1 
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
        handleError(error, { operation: 'generate_product', categoryId });
        setProgress(prev => ({ 
          ...prev, 
          failed: prev.failed + 1,
          errors: [...(prev.errors || []), {
            categoryId,
            categoryName: category.name,
            error: errorMessage
          }]
        }));
      }
    }
    
    setIsGenerating(false);
    
    const endTime = Date.now();
    const duration = ((endTime - (progress.startTime || endTime)) / 1000).toFixed(1);
    
    if (generatedProducts.length > 0) {
      showToast({
        type: 'success',
        title: 'Produkte erstellt',
        message: `${generatedProducts.length} Produkt(e) wurden erfolgreich erstellt in ${duration}s.`
      });
      
      onComplete?.(generatedProducts);
    }
    
    if (progress.failed > 0) {
      showToast({
        type: 'error',
        title: 'Einige Produkte konnten nicht erstellt werden',
        message: `${progress.failed} Fehler beim Erstellen.`
      });
    }
    
    // Reset selection after generation
    setSelectedCategories(new Set());
  }, [selectedCategories, categories, createProductMutation, showToast, handleError, onComplete, progress]);
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-white">Automatische Produkterstellung</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {subcategoriesWithoutProducts.length} ohne Produkte
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Layers className="w-4 h-4 mr-2" />
            {showPreview ? 'Vorschau ausblenden' : 'Vorschau anzeigen'}
          </Button>
        </div>
      </div>

      {/* Level Filter */}
      <div className="mb-4 flex items-center gap-2">
        <Filter className="w-4 h-4 text-white/60" />
        <span className="text-sm text-white/80">Filter:</span>
        <Button
          variant={filterLevel === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterLevel(null)}
        >
          Alle Level
        </Button>
        <Button
          variant={filterLevel === 3 ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterLevel(3)}
        >
          Nur Modelle (Level 3)
        </Button>
      </div>
      
      {isGenerating && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              {progress.currentBrand && progress.currentModel ? (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-white">
                    {progress.currentBrand} - {progress.currentModel}
                  </span>
                  <div className="text-xs text-white/60">
                    Marke: {progress.currentBrand} | Modell: {progress.currentModel}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-white/80">Generiere Produkte...</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm text-white/60">
                {progress.completed} / {progress.total}
              </span>
              {progress.startTime && (
                <div className="text-xs text-white/40">
                  ETA: {progress.total > 0 
                    ? `${Math.round(((Date.now() - progress.startTime) / progress.completed) * (progress.total - progress.completed) / 1000)}s`
                    : '-'}
                </div>
              )}
            </div>
          </div>
          <Progress 
            value={progress.total > 0 ? (progress.completed / progress.total) * 100 : 0} 
            className="h-2"
          />
          {progress.failed > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {progress.failed} Fehler
              </div>
              {progress.errors && progress.errors.length > 0 && (
                <details className="text-xs text-white/60">
                  <summary className="cursor-pointer hover:text-white/80">Fehler-Details anzeigen</summary>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {progress.errors.map((err, idx) => (
                      <div key={idx} className="p-2 bg-red-500/10 rounded">
                        <strong>{err.categoryName}:</strong> {err.error}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview der zu erstellenden Produkte */}
      {showPreview && previewProducts.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Vorschau ({previewProducts.length} Produkte)</h3>
            <Badge variant="secondary">{previewProducts.length} Produkte</Badge>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {previewProducts.map((preview, idx) => (
              <div key={idx} className="p-2 bg-white/5 rounded text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white">{preview.productName}</div>
                    <div className="text-xs text-white/60">
                      {preview.brandName} → {preview.categoryName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-white/80">
                      <Euro className="w-3 h-3" />
                      <span>{preview.price}</span>
                    </div>
                    <div className="text-xs text-white/40">{preview.sku}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {subcategoriesWithoutProducts.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Alle Subkategorien haben bereits Produkte</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedCategories.size === subcategoriesWithoutProducts.length 
                ? 'Alle abwählen' 
                : 'Alle auswählen'}
            </Button>
            <Badge>
              {selectedCategories.size} ausgewählt
            </Badge>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto space-y-3 mb-6">
            {Array.from(categoriesByBrand.entries()).map(([brandId, brandCategories]) => {
              const brand = categories.find(c => c.id === brandId);
              if (!brand) return null;
              
              const isExpanded = expandedBrands.has(brandId);
              const brandCategoryIds = brandCategories.map(c => c.id);
              const allSelected = brandCategoryIds.length > 0 && brandCategoryIds.every(id => selectedCategories.has(id));
              const someSelected = brandCategoryIds.some(id => selectedCategories.has(id));
              
              return (
                <div key={brandId} className="border border-white/10 rounded-lg overflow-hidden">
                  {/* Brand Header */}
                  <div className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 transition-colors">
                    <button
                      onClick={() => toggleBrandExpand(brandId)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-white/60" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={() => handleSelectBrand(brandId)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white">
                        {brand.icon} {brand.name}
                      </div>
                      <div className="text-xs text-white/60">
                        {brandCategories.length} Modell(e) ohne Produkte
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {brandCategories.filter(c => selectedCategories.has(c.id)).length} / {brandCategories.length}
                    </Badge>
                  </div>
                  
                  {/* Brand Categories */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 space-y-1">
                        {brandCategories.map(category => {
                          const isSelected = selectedCategories.has(category.id);
                          
                          return (
                            <motion.div
                              key={category.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                'flex items-center gap-2 p-2 rounded border transition-all cursor-pointer ml-4',
                                isSelected 
                                  ? 'bg-primary/20 border-primary/50' 
                                  : 'bg-white/5 border-white/10 hover:border-white/20'
                              )}
                              onClick={() => handleCategoryToggle(category.id)}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleCategoryToggle(category.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded border-white/20 bg-white/10"
                              />
                              <div className="flex-1">
                                <div className="text-sm text-white">
                                  {category.name}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
          
          <Button
            onClick={generateProducts}
            disabled={isGenerating || selectedCategories.size === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generiere Produkte...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Produkte erstellen ({selectedCategories.size})
              </>
            )}
          </Button>
        </>
      )}
    </Card>
  );
});

AutoProductGenerator.displayName = 'AutoProductGenerator';

