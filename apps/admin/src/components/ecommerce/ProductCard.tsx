import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { InlineEdit } from '../ui/InlineEdit';
import { ImagePicker } from '../media/ImagePicker';
import { SkeletonCard } from '../ui/Skeleton';
import {
  MoreHorizontal,
  Edit,
  Package,
  Copy,
  Trash2,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Lock,
  Globe,
  Users,
  Sparkles
} from 'lucide-react';
import type { Product, ProductVariant, ProductMedia } from '../../lib/api/ecommerce';
import { LiveUpdateIndicator } from './LiveUpdateIndicator';

interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (checked: boolean, event?: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAdjustStock: () => void;
  onUpdate: (field: string, value: string | number | boolean | null) => Promise<void>;
  loadedImages: Set<string>;
  onImageLoad: (productId: string) => void;
  categories?: Array<{ id: string; name: string; icon?: string }>;
}

export const ProductCard = memo(({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onAdjustStock,
  onUpdate,
  loadedImages,
  onImageLoad,
  categories = []
}: ProductCardProps) => {
  // State for visual feedback
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [highlightField, setHighlightField] = useState<string | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear update feedback after timeout
  useEffect(() => {
    if (updateSuccess || updateError) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        setUpdateSuccess(false);
        setUpdateError(null);
        setHighlightField(null);
      }, 2000);
    }
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateSuccess, updateError]);

  // Enhanced onUpdate with visual feedback
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleUpdate = useCallback(async (field: string, value: string | number | boolean | null) => {
    setIsUpdating(true);
    setUpdateError(null);
    setHighlightField(field);
    
    // Clear any existing highlight timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    
    try {
      await onUpdate(field, value);
      setUpdateSuccess(true);
      setIsUpdating(false);
      
      // Clear highlight after animation
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightField(null);
        highlightTimeoutRef.current = null;
      }, 500);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Update fehlgeschlagen');
      setIsUpdating(false);
      setHighlightField(null);
    }
  }, [onUpdate]);
  
  // Cleanup highlight timeout on unmount
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Memoize badge components to prevent unnecessary re-renders
  const statusBadge = React.useMemo(() => {
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
  }, [product.isOutOfStock, product.isLowStock, product.isFeatured, product.status]);

  const accessBadge = React.useMemo(() => {
    const access = product.access || 'standard';
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
  }, [product.access]);

  // Find category info with null-safety
  const categoriesArray = Array.isArray(categories) ? categories : [];
  const categoryInfo = categoriesArray.find(cat => cat && cat.id === product?.categoryId);
  const categoryName = categoryInfo?.name || 'Unbekannt';
  const categoryIcon = categoryInfo?.icon || product?.categoryIcon || '📦';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative h-full"
    >
      <Card className={`group relative p-5 h-full flex flex-col hover:bg-gradient-to-br hover:from-white/5 hover:to-white/2 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-500/40 border border-white/10 rounded-xl backdrop-blur-sm ${
        isUpdating ? 'ring-2 ring-yellow-500/50 bg-yellow-500/5' : ''
      } ${updateSuccess ? 'ring-2 ring-green-500/50 bg-green-500/5' : ''} ${updateError ? 'ring-2 ring-red-500/50 bg-red-500/5' : ''} ${
        isSelected ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''
      }`}>
        {/* Update Success Indicator */}
        <AnimatePresence>
          {updateSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-3 right-3 z-20 bg-green-500/90 text-white rounded-full p-1.5 shadow-lg"
            >
              <CheckCircle className="w-4 h-4" />
            </motion.div>
          )}
          {updateError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-3 right-3 z-20 bg-red-500/90 text-white rounded-full p-1.5 shadow-lg"
            >
              <XCircle className="w-4 h-4" />
            </motion.div>
          )}
          {isUpdating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 right-3 z-20 bg-yellow-500/90 text-white rounded-full p-1.5 shadow-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Overlay - appears on hover with better styling */}
        <motion.div 
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          whileHover={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute top-2 right-2 z-10 flex gap-1.5"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 bg-black/90 hover:bg-blue-600/90 border border-blue-500/30 backdrop-blur-sm shadow-lg"
              title="Bearbeiten"
            >
              <Edit className="w-4 h-4 text-blue-400" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="h-8 w-8 p-0 bg-black/90 hover:bg-purple-600/90 border border-purple-500/30 backdrop-blur-sm shadow-lg"
              title="Duplizieren"
            >
              <Copy className="w-4 h-4 text-purple-400" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdjustStock}
              className="h-8 w-8 p-0 bg-black/90 hover:bg-orange-600/90 border border-orange-500/30 backdrop-blur-sm shadow-lg"
              title="Lagerbestand anpassen"
            >
              <Package className="w-4 h-4 text-orange-400" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 bg-black/90 hover:bg-red-600/90 border border-red-500/30 backdrop-blur-sm shadow-lg"
              title="Löschen"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </motion.div>
        </motion.div>

        <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked, e.nativeEvent as any)}
            onClick={(e) => {
              // Prevent event bubbling for Shift-Click
              if (e.shiftKey) {
                e.stopPropagation();
              }
            }}
            className="rounded border-white/20 bg-black/25 w-4 h-4 cursor-pointer hover:border-blue-400 transition-colors focus:ring-2 focus:ring-blue-500"
            tabIndex={0}
            onKeyDown={(e) => {
              // Space or Enter to toggle
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onSelect(!isSelected, e.nativeEvent as any);
              }
            }}
          />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0" title={categoryName}>{categoryIcon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground truncate" title={categoryName}>
                {categoryName}
              </div>
              <LiveUpdateIndicator
                isLive={true}
                lastUpdate={product.lastUpdated ? new Date(product.lastUpdated) : undefined}
                className="text-xs"
              />
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAdjustStock}>
              <Package className="w-4 h-4 mr-2" />
              Lagerbestand anpassen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplizieren
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-400" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3 flex-1 flex flex-col">
        {/* Product Image with Lazy Loading using Intersection Observer */}
        <div className="relative group/image">
          <LazyImage
            src={product.media && product.media.length > 0 ? product.media[0].url : null}
            alt={product.media?.[0]?.alt || product.name}
            productId={product.id}
            loadedImages={loadedImages}
            onImageLoad={onImageLoad}
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
          {/* Status badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {statusBadge}
            {product.isFeatured && (
              <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-500/20 backdrop-blur-sm">
                <Star className="w-3 h-3 mr-1" />Featured
              </Badge>
            )}
          </div>
        </div>

        <motion.h3 
          className={`font-semibold text-lg truncate mb-2 group-hover:text-blue-400 transition-colors ${
            highlightField === 'name' ? 'text-yellow-400' : ''
          }`}
          title={product.name}
          animate={highlightField === 'name' ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {product.name}
        </motion.h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {product.description || 'Keine Beschreibung'}
        </p>
        
        {/* Price and Access Badge */}
        <motion.div 
          className={`flex items-center justify-between mb-4 pb-4 border-b border-white/10 ${
            highlightField === 'price' ? 'bg-yellow-500/10 rounded-lg p-2 -m-2' : ''
          }`}
          animate={highlightField === 'price' ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-baseline gap-2">
            <InlineEdit
              value={product.price}
              onSave={(newPrice) => handleUpdate('price', newPrice)}
              type="number"
              className="text-xl font-bold text-neon hover:text-blue-400 transition-colors"
              step="0.01"
              min={0}
              format={(v) => `€${Number(v).toFixed(2)}`}
              parse={(v) => parseFloat(String(v).replace('€', '').replace(',', '.'))}
              enablePreview={true}
              fieldLabel="Preis"
              entityName={product.name}
              entityType="product"
              enableOptimisticUpdate={true}
            />
            <span className="text-xs text-muted-foreground">/ Stück</span>
          </div>
          {accessBadge}
        </motion.div>

        {/* Stock and Variants */}
        <motion.div 
          className={`flex items-center justify-between text-sm mb-4 ${
            highlightField === 'inventory' ? 'bg-yellow-500/10 rounded-lg p-2 -m-2' : ''
          }`}
          animate={highlightField === 'inventory' ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Lager:</span>
            <InlineEdit
              value={product.inventory || 0}
              onSave={(newStock) => handleUpdate('inventory', newStock)}
              type="number"
              className={`font-semibold transition-colors ${
                (product.inventory || 0) === 0 
                  ? 'text-red-400' 
                  : (product.inventory || 0) < 10 
                    ? 'text-yellow-400' 
                    : 'text-green-400'
              }`}
              enablePreview={true}
              fieldLabel="Lagerbestand"
              entityName={product.name}
              entityType="product"
              enableOptimisticUpdate={true}
            />
          </div>
          {product.totalVariants > 0 && (
            <span className="text-muted-foreground flex items-center gap-1">
              <motion.span 
                className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {product.totalVariants} Variante{product.totalVariants !== 1 ? 'n' : ''}
            </span>
          )}
        </motion.div>

        {/* Status Badge and Category - Improved Layout */}
        <div className="flex items-center justify-between mb-3 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            {product.isOutOfStock && (
              <Badge variant="destructive" className="text-red-400 bg-red-500/20 border-red-500/50">
                <XCircle className="w-3 h-3 mr-1" />Ausverkauft
              </Badge>
            )}
            {product.isLowStock && !product.isOutOfStock && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400 bg-yellow-500/20">
                <AlertCircle className="w-3 h-3 mr-1" />Niedrig
              </Badge>
            )}
            {product.isActive && !product.isOutOfStock && (
              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-500/20">
                <CheckCircle className="w-3 h-3 mr-1" />Aktiv
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="text-lg">{categoryIcon}</span>
            <InlineEdit
              value={product.categoryId || 'all'}
              onSave={(newCategoryId) => handleUpdate('categoryId', newCategoryId)}
              type="select"
              options={[
                { value: 'all', label: 'Keine Kategorie' },
                ...(Array.isArray(categories) ? categories.filter(cat => cat && cat.id).map(cat => ({ 
                  value: cat.id, 
                  label: `${cat.icon || ''} ${cat.name || 'Unnamed'}` 
                })) : [])
              ]}
              className="text-xs max-w-[120px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Featured:</span>
            <InlineEdit
              value={product.isFeatured ? 'true' : 'false'}
              onSave={(val) => handleUpdate('featured', val === 'true' || val === true)}
              type="toggle"
              className="text-xs"
            />
          </div>
          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.filter(Boolean).slice(0, 3).map((tag: string, idx: number) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 rounded-full border border-blue-500/30 backdrop-blur-sm"
                >
                  {tag}
                </motion.span>
              ))}
              {product.tags.length > 3 && (
                <span className="text-xs text-muted-foreground flex items-center">+{product.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Tags Editor */}
        <div className="pt-1">
          <div className="text-xs text-muted-foreground mb-1">Tags:</div>
          <InlineEdit
            value={product.tags || []}
            onSave={(tags) => handleUpdate('tags', tags)}
            type="tags"
            className="text-xs"
          />
        </div>

        {/* Variants Quick View - Enhanced */}
        {product.variants && product.variants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-2 border-t border-white/10"
          >
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Package className="w-3 h-3" />
              Varianten ({product.variants.length}):
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
              {Array.isArray(product.variants) ? product.variants.filter((v): v is ProductVariant => Boolean(v)).slice(0, 3).map((variant: ProductVariant, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between text-xs bg-gradient-to-r from-white/5 to-white/2 p-1.5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-colors"
                >
                  <span className="text-muted-foreground font-medium">{variant.label || variant.name}</span>
                  <span className="text-neon font-semibold">€{Number(variant.price || variant.basePrice || 0).toFixed(2)}</span>
                </motion.div>
              )) : null}
              {Array.isArray(product.variants) && product.variants.length > 3 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  +{product.variants.length - 3} weitere Variante{product.variants.length - 3 !== 1 ? 'n' : ''}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Inline Image Manager - Enhanced */}
        <div className="pt-2">
          <div className="text-xs text-muted-foreground mb-2">Produktbilder:</div>
          <ImagePicker
            multiple={true}
            showPreview={true}
            maxImages={5}
            value={Array.isArray(product.media) && product.media.length > 0 ? product.media.filter((m): m is ProductMedia => Boolean(m && m.url)).map((m: ProductMedia) => m.url) : []}
            onChange={(urls) => {
              const urlsArray = Array.isArray(urls) ? urls.filter(Boolean) : [];
              handleUpdate('media', urlsArray.map((url, index) => ({ 
                url: String(url), 
                alt: `${product?.name || 'Product'} - Bild ${index + 1}`,
                order: index
              })));
            }}
          />
        </div>
      </div>
      </Card>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance - optimized with early returns
  // Only re-render if relevant props changed
  if (prevProps.product.id !== nextProps.product.id) return false;
  if (prevProps.product.name !== nextProps.product.name) return false;
  if (prevProps.product.price !== nextProps.product.price) return false;
  if (prevProps.product.inventory !== nextProps.product.inventory) return false;
  if (prevProps.product.status !== nextProps.product.status) return false;
  if (prevProps.product.featured !== nextProps.product.featured) return false;
  if (prevProps.product.categoryId !== nextProps.product.categoryId) return false;
  if (prevProps.product.media?.length !== nextProps.product.media?.length) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.loadedImages.has(prevProps.product.id) !== nextProps.loadedImages.has(nextProps.product.id)) return false;
  
  // All relevant props are equal - skip re-render
  return true;
});

ProductCard.displayName = 'ProductCard';

// Optimized Lazy Image Component with Intersection Observer
const LazyImage = memo(({ 
  src, 
  alt, 
  productId, 
  loadedImages, 
  onImageLoad 
}: { 
  src: string | null; 
  alt: string; 
  productId: string;
  loadedImages: Set<string>;
  onImageLoad: (id: string) => void;
}) => {
  const [isInView, setIsInView] = useState(loadedImages.has(productId)); // Pre-load if already loaded
  const [isLoaded, setIsLoaded] = useState(loadedImages.has(productId));
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Skip if already loaded or no source
    if (isInView || !src || !imgRef.current) return;

    // Create observer with optimized options
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Disconnect immediately after first intersection
          if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
          }
        }
      },
      { 
        rootMargin: '100px', // Increased from 50px for better preloading
        threshold: 0.01 // Trigger as soon as 1% is visible
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [isInView, src]);

  if (!src) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full aspect-video bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-900/30 rounded-lg overflow-hidden relative flex items-center justify-center border border-white/5"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Package className="w-8 h-8 opacity-30 text-muted-foreground" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div 
      ref={imgRef}
      className="w-full aspect-video bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-900/30 rounded-lg overflow-hidden relative group/image-container"
    >
      {!isInView ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full h-full bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-900/30 animate-pulse"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Package className="w-6 h-6 opacity-20 text-muted-foreground" />
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <>
          {!isLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-900/30"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Package className="w-6 h-6 opacity-30 text-muted-foreground" />
                </motion.div>
              </div>
            </motion.div>
          )}
          <motion.img
            src={src}
            alt={alt}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 1.1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onLoad={() => {
              setIsLoaded(true);
              onImageLoad(productId);
            }}
            onError={() => {
              setIsLoaded(true);
              onImageLoad(productId);
            }}
          />
          {/* Gradient overlay for better text readability on hover */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none transition-opacity duration-300"
          />
        </>
      )}
    </div>
  );
});
LazyImage.displayName = 'LazyImage';

