import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Select } from '../ui/Select';
import { ImagePicker } from '../media/ImagePicker';
import {
  Package,
  Save,
  X,
  Info,
  Image,
  DollarSign,
  Layers,
  Tag,
  Globe,
  CheckCircle,
  AlertCircle,
  Grid3X3
} from 'lucide-react';
import { useCreateProduct, useUpdateProduct, useCategories } from '../../lib/api/shopHooks';
import type { Product } from '../../lib/api/ecommerce';
import { ProductVariantsMatrix } from '../../pages/products/ProductVariantsMatrix';
import type { ProductVariant } from '@nebula/shared';
import type { VariantCombination } from '@nebula/shared';
import { useToast } from '../ui/Toast';

interface ProductEditorProps {
  open: boolean;
  onClose: () => void;
  product?: Product; // If editing existing product
  mode: 'create' | 'edit';
}

export function ProductEditor({ open, onClose, product, mode }: ProductEditorProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    categoryId: '',
    sku: '',
    description: '',
    price: 0,
    currency: 'EUR',
    inventory: 0,
    status: 'draft',
    featured: false,
    access: 'standard',
    type: 'shop',
    media: [],
    badges: [],
    variants: [],
  });

  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);

  const [activeTab, setActiveTab] = useState('basic');
  const [seoData, setSeoData] = useState({
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [] as string[],
  });

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { showToast } = useToast();

  // Fetch categories with null-safety
  const { data: categoriesData, isLoading: categoriesLoading, refetch: refetchCategories } = useCategories();
  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : [];

  // Initialize form with product data when editing
  useEffect(() => {
    if (product && mode === 'edit') {
      // Ensure all arrays are properly initialized
      const safeVariants = Array.isArray(product.variants) ? product.variants : [];
      const safeMedia = Array.isArray(product.media) ? product.media : [];
      const safeBadges = Array.isArray(product.badges) ? product.badges : [];
      
      setFormData({
        name: product.name || '',
        categoryId: product.categoryId || '',
        sku: product.sku || '',
        description: product.description || '',
        price: typeof product.price === 'number' ? product.price : 0,
        currency: product.currency || 'EUR',
        inventory: typeof product.inventory === 'number' ? product.inventory : 0,
        status: product.status || 'draft',
        featured: product.featured || false,
        access: product.access || 'standard',
        type: product.type || 'shop',
        media: safeMedia,
        badges: safeBadges,
        variants: safeVariants,
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        name: '',
        categoryId: '',
        sku: '',
        description: '',
        price: 0,
        currency: 'EUR',
        inventory: 0,
        status: 'draft',
        featured: false,
        access: 'standard',
        type: 'shop',
        media: [],
        badges: [],
        variants: [],
      });
      setVariantCombinations([]);
    }
  }, [product, mode]);

  const handleSubmit = async () => {
    try {
      // Use safeFormData for validation and submission
      // Validate required fields
      if (!safeFormData.name || safeFormData.name.trim() === '') {
        showToast({
          type: 'error',
          title: 'Validierungsfehler',
          message: 'Produktname ist erforderlich'
        });
        return;
      }
      
      if (!safeFormData.categoryId || safeFormData.categoryId.trim() === '') {
        showToast({
          type: 'error',
          title: 'Validierungsfehler',
          message: 'Bitte wählen Sie eine Kategorie aus'
        });
        return;
      }
      
      // Validate category exists - but be more lenient
      // If categories are still loading, try to refetch them first
      if (categoriesLoading) {
        await refetchCategories();
      }
      
      const categoriesArray = Array.isArray(categories) ? categories : [];
      const categoryExists = categoriesArray.some(cat => cat && cat.id === safeFormData.categoryId);
      
      // If category doesn't exist in loaded list, but we have a valid ID, 
      // still allow submission (category might exist in backend but not loaded yet)
      // Only show warning if we have categories loaded and it's definitely not there
      if (!categoryExists && categoriesArray.length > 0) {
        // Check if categoryId looks like a valid ID (not empty, has some structure)
        const isValidIdFormat = safeFormData.categoryId && safeFormData.categoryId.length > 0;
        
        if (!isValidIdFormat) {
          showToast({
            type: 'error',
            title: 'Validierungsfehler',
            message: 'Bitte wählen Sie eine gültige Kategorie aus'
          });
          return;
        }
        
        // If it's a valid ID format but not in the list, show warning but allow
        console.warn('Category not found in loaded list, but proceeding with valid ID:', safeFormData.categoryId);
      }
      
      const productData = {
        ...safeFormData,
        ...seoData,
      };

      // If variants exist, calculate total inventory from combinations
      if (variantCombinations.length > 0) {
        productData.inventory = variantCombinations.reduce((sum, combo) => sum + (combo.inventory || 0), 0);
      }

      if (mode === 'create') {
        await createMutation.mutateAsync(productData);
        showToast({
          type: 'success',
          title: 'Erfolg',
          message: 'Produkt erfolgreich erstellt'
        });
      } else if (product) {
        await updateMutation.mutateAsync({
          id: product.id,
          product: productData,
        });
        showToast({
          type: 'success',
          title: 'Erfolg',
          message: 'Produkt erfolgreich aktualisiert'
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      // Show error to user with toast
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Speichern des Produkts';
      showToast({
        type: 'error',
        title: 'Fehler',
        message: errorMessage
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Ensure formData is always valid before rendering
  const safeFormData = useMemo(() => ({
    name: formData.name || '',
    categoryId: formData.categoryId || '',
    sku: formData.sku || '',
    description: formData.description || '',
    price: typeof formData.price === 'number' && !isNaN(formData.price) ? formData.price : 0,
    currency: formData.currency || 'EUR',
    inventory: typeof formData.inventory === 'number' && !isNaN(formData.inventory) ? formData.inventory : 0,
    status: formData.status || 'draft',
    featured: formData.featured || false,
    access: formData.access || 'standard',
    type: formData.type || 'shop',
    media: Array.isArray(formData.media) ? formData.media : [],
    badges: Array.isArray(formData.badges) ? formData.badges : [],
    variants: Array.isArray(formData.variants) ? formData.variants : [],
  }), [formData]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-400" />
            {mode === 'create' ? 'Create New Product' : 'Edit Product'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new product to your shop'
              : `Editing: ${safeFormData.name || product?.name || 'Product'}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="variants" className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Variants
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Media
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                SEO
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white mb-2 block">
                    Product Name *
                  </label>
                  <Input
                    value={safeFormData.name}
                    onChange={(e) => setFormData({ ...safeFormData, name: e.target.value || '' })}
                    placeholder="e.g., Nike Air Max 95"
                    className="text-lg"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Category *
                  </label>
                  <select
                    value={safeFormData.categoryId}
                    onChange={(e) => {
                      const newCategoryId = e.target.value || '';
                      setFormData({ ...safeFormData, categoryId: newCategoryId });
                    }}
                    className="w-full px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? 'Lade Kategorien...' : categories.length === 0 ? 'Keine Kategorien verfügbar - Bitte erstellen Sie zuerst eine Kategorie' : 'Kategorie auswählen *'}
                    </option>
                    {categories.map((category) => {
                      if (!category || !category.id) return null;
                      return (
                        <option key={category.id} value={category.id}>
                          {category.icon || '📦'} {category.name || 'Unnamed'}
                        </option>
                      );
                    })}
                    {/* Show current category if it's not in the list (e.g., if it was deleted) */}
                    {safeFormData.categoryId && !categories.some(cat => cat && cat.id === safeFormData.categoryId) && (
                      <option value={safeFormData.categoryId} disabled>
                        ⚠️ Aktuelle Kategorie (nicht verfügbar)
                      </option>
                    )}
                  </select>
                  {safeFormData.categoryId && !categories.some(cat => cat && cat.id === safeFormData.categoryId) && categories.length > 0 && (
                    <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Die ausgewählte Kategorie ist nicht in der Liste. Bitte wählen Sie eine andere Kategorie.
                    </p>
                  )}
                  {categories.length === 0 && !categoriesLoading && (
                    <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Keine Kategorien verfügbar. Bitte erstellen Sie zuerst eine Kategorie im Kategorie-Management.
                    </p>
                  )}
                </div>

                {/* SKU */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    SKU
                  </label>
                  <Input
                    value={safeFormData.sku}
                    onChange={(e) => setFormData({ ...safeFormData, sku: e.target.value || '' })}
                    placeholder="Auto-generated if empty"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Status
                  </label>
                  <select
                    value={safeFormData.status}
                    onChange={(e) => setFormData({ ...safeFormData, status: (e.target.value || 'draft') as any })}
                    className="w-full px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-white"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Product Type
                  </label>
                  <select
                    value={safeFormData.type}
                    onChange={(e) => setFormData({ ...safeFormData, type: (e.target.value || 'shop') as any })}
                    className="w-full px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-white"
                  >
                    <option value="shop">Shop Product</option>
                    <option value="drop">Drop/Limited</option>
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white mb-2 block">
                    Description
                  </label>
                  <Textarea
                    value={safeFormData.description}
                    onChange={(e) => setFormData({ ...safeFormData, description: e.target.value || '' })}
                    placeholder="Detailed product description..."
                    rows={4}
                  />
                </div>

                {/* Toggles */}
                <div className="md:col-span-2 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={safeFormData.featured}
                      onChange={(e) => setFormData({ ...safeFormData, featured: e.target.checked || false })}
                      className="rounded border-white/20"
                    />
                    <span className="text-sm text-white">Featured Product</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-white">Access Level:</label>
                    <select
                      value={safeFormData.access}
                      onChange={(e) => setFormData({ ...safeFormData, access: (e.target.value || 'standard') as any })}
                      className="px-3 py-1 bg-gray-900 border border-white/20 rounded text-sm text-white"
                    >
                      <option value="free">Free</option>
                      <option value="standard">Standard</option>
                      <option value="limited">Limited</option>
                      <option value="vip">VIP Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Variants Tab */}
            <TabsContent value="variants" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Product Variants</h3>
                    <p className="text-sm text-muted-foreground">
                      Create variants like Size, Color, Material, etc. Each combination will have its own SKU, price, and inventory.
                    </p>
                  </div>
                </div>
                <ProductVariantsMatrix
                  variants={safeFormData.variants as ProductVariant[]}
                  onVariantsChange={(variants) => {
                    setFormData({ ...safeFormData, variants: Array.isArray(variants) ? variants : [] });
                  }}
                  onCombinationsChange={(combinations) => {
                    setVariantCombinations(Array.isArray(combinations) ? combinations : []);
                  }}
                />
                {variantCombinations.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">
                        {variantCombinations.length} variant combination{variantCombinations.length !== 1 ? 's' : ''} created
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total inventory across all variants: {variantCombinations.reduce((sum, c) => sum + c.inventory, 0)} units
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Price */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Price *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={safeFormData.price}
                      onChange={(e) => {
                        const value = e.target.value || '0';
                        const numValue = parseFloat(value);
                        setFormData({ ...safeFormData, price: isNaN(numValue) ? 0 : numValue });
                      }}
                      placeholder="0.00"
                      className="pl-10 text-lg font-semibold"
                    />
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Currency
                  </label>
                  <select
                    value={safeFormData.currency}
                    onChange={(e) => setFormData({ ...safeFormData, currency: e.target.value || 'EUR' })}
                    className="w-full px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-white"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                {/* Inventory */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    Initial Stock *
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      value={safeFormData.inventory}
                      onChange={(e) => {
                        const value = e.target.value || '0';
                        const intValue = parseInt(value);
                        setFormData({ ...safeFormData, inventory: isNaN(intValue) ? 0 : intValue });
                      }}
                      placeholder="0"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Stock Alert */}
                <div className="flex items-center">
                  {formData.inventory !== undefined && formData.inventory < 10 && (
                    <Badge variant="outline" className="text-orange-400 border-orange-400">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Low stock warning will be triggered
                    </Badge>
                  )}
                  {formData.inventory !== undefined && formData.inventory >= 10 && (
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Good stock level
                    </Badge>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Product Images
                </label>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload product images (first image will be the main image)
                </p>
                <ImagePicker
                  multiple={true}
                  value={safeFormData.media.filter(m => m && m.url).map(m => m.url)}
                  onChange={(urls) => {
                    const urlsArray = Array.isArray(urls) ? urls.filter(Boolean) : [];
                    setFormData({
                      ...safeFormData,
                      media: urlsArray.map((url, index) => ({
                        id: `img_${index}`,
                        url: String(url),
                        alt: safeFormData.name || 'Product image',
                      })),
                    });
                  }}
                />
              </div>

              {/* Badge Tags */}
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Product Badges
                </label>
                <p className="text-sm text-muted-foreground mb-3">
                  Add badges like "New", "Bestseller", "Limited", etc.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['New', 'Bestseller', 'Limited', 'Hot', 'Sale', 'Premium'].map((badge) => (
                    <Button
                      key={badge}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const badges = safeFormData.badges;
                        if (badges.includes(badge)) {
                          setFormData({
                            ...safeFormData,
                            badges: badges.filter(b => b && b !== badge),
                          });
                        } else {
                          setFormData({
                            ...safeFormData,
                            badges: [...badges, badge],
                          });
                        }
                      }}
                      className={
                        safeFormData.badges.includes(badge)
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : ''
                      }
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {badge}
                    </Button>
                  ))}
                </div>
                {safeFormData.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {safeFormData.badges.filter(Boolean).map((badge, index) => (
                      <Badge key={badge || `badge-${index}`} variant="outline" className="text-blue-400 border-blue-400">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-4">
                {/* SEO Title */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    SEO Title
                  </label>
                  <Input
                    value={seoData.seoTitle}
                    onChange={(e) => setSeoData({ ...seoData, seoTitle: e.target.value })}
                    placeholder={formData.name || 'Product title for search engines'}
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {seoData.seoTitle.length}/60 characters (optimal: 50-60)
                  </p>
                </div>

                {/* SEO Description */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    SEO Description
                  </label>
                  <Textarea
                    value={seoData.seoDescription}
                    onChange={(e) => setSeoData({ ...seoData, seoDescription: e.target.value })}
                    placeholder="Description for search engine results..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {seoData.seoDescription.length}/160 characters (optimal: 120-160)
                  </p>
                </div>

                {/* SEO Keywords */}
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">
                    SEO Keywords
                  </label>
                  <Input
                    value={Array.isArray(seoData.seoKeywords) ? seoData.seoKeywords.join(', ') : ''}
                    onChange={(e) => {
                      const value = e.target.value || '';
                      const keywords = value.split(',').map(k => k.trim()).filter(Boolean);
                      setSeoData({
                        ...seoData,
                        seoKeywords: Array.isArray(keywords) ? keywords : [],
                      });
                    }}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate keywords with commas
                  </p>
                </div>

                {/* SEO Preview */}
                <div className="p-4 rounded-lg bg-gray-900 border border-white/10">
                  <p className="text-xs text-muted-foreground mb-2">Search Result Preview</p>
                  <div className="space-y-1">
                    <p className="text-blue-400 text-lg font-medium">
                      {seoData.seoTitle || formData.name || 'Product Title'}
                    </p>
                    <p className="text-green-600 text-sm">
                      nebula.supply/products/{formData.sku || 'product-slug'}
                    </p>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {seoData.seoDescription || formData.description || 'Product description will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between w-full">
            {/* Status Badge */}
            <Badge 
              variant="outline" 
              className={
                formData.status === 'active' 
                  ? 'text-green-400 border-green-400' :
                formData.status === 'draft'
                  ? 'text-gray-400 border-gray-400' :
                  'text-orange-400 border-orange-400'
              }
            >
              {formData.status}
            </Badge>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!safeFormData.name || !safeFormData.categoryId || isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isPending ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="mr-2"
                    >
                      <Package className="w-4 h-4" />
                    </motion.div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create Product' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

