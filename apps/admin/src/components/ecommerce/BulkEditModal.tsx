import React, { useState } from 'react';
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
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { 
  Edit, 
  DollarSign, 
  Package, 
  Tag, 
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Percent
} from 'lucide-react';
import { ImagePicker } from '../media/ImagePicker';
import { useUpdateProduct, useCategories, useProducts } from '../../lib/api/shopHooks';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { useToastHelpers } from '../ui/Toast';
import { BulkProgressTracker } from './BulkProgressTracker';
import { Undo2, Eye } from 'lucide-react';
import { logger } from '../../lib/logger';

interface BulkEditModalProps {
  open: boolean;
  onClose: () => void;
  productIds: string[];
  onSuccess?: () => void;
}

type BulkEditField = 'price' | 'priceAdjust' | 'category' | 'status' | 'access' | 'inventory' | 'tags' | 'images';

export function BulkEditModal({ open, onClose, productIds, onSuccess }: BulkEditModalProps) {
  const [activeField, setActiveField] = useState<BulkEditField | null>(null);
  const [value, setValue] = useState<any>('');
  const [priceAdjustType, setPriceAdjustType] = useState<'fixed' | 'percent'>('fixed');
  const [priceAdjustValue, setPriceAdjustValue] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const [undoStack, setUndoStack] = useState<Array<{ productId: string; previousData: any }>>([]);
  const [batchSize] = useState(10); // Process 10 products at a time
  
  const updateMutation = useUpdateProduct();
  const { handleError } = useErrorHandler('BulkEditModal');
  const { success, error: showError } = useToastHelpers();
  const { data: categoriesData } = useCategories();
  const { data: productsData } = useProducts({ limit: 1000 }); // Get products for preview
  const categories = Array.isArray(categoriesData) 
    ? categoriesData 
    : ((categoriesData as any)?.data || []);
  
  const selectedProducts = (productsData?.data || []).filter((p: any) => productIds.includes(p.id));

  // Build update data based on active field
  const buildUpdateData = (product: any): any => {
    const updateData: any = {};
    
    switch (activeField) {
      case 'price':
        updateData.price = parseFloat(value) || 0;
        break;
      case 'priceAdjust':
        const adjustValue = parseFloat(priceAdjustValue) || 0;
        const currentPrice = product.price || 0;
        if (priceAdjustType === 'percent') {
          updateData.price = currentPrice * (1 + adjustValue / 100);
        } else {
          updateData.price = currentPrice + adjustValue;
        }
        break;
      case 'category':
        updateData.categoryId = value;
        break;
      case 'status':
        updateData.status = value;
        break;
      case 'access':
        updateData.access = value;
        break;
      case 'inventory':
        updateData.inventory = parseInt(value) || 0;
        break;
      case 'tags':
        updateData.tags = value.split(',').map((t: string) => t.trim()).filter(Boolean);
        break;
      case 'images':
        updateData.media = selectedImages.map((url, idx) => ({
          url,
          alt: `Product Image ${idx + 1}`,
          order: idx
        }));
        break;
    }
    
    return updateData;
  };

  const handleBulkUpdate = async () => {
    if (!activeField || productIds.length === 0) {
      showError('Invalid Selection', 'Please select a field and products to update');
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: productIds.length, errors: 0 });
    const undoData: Array<{ productId: string; previousData: any }> = [];

    try {
      // Process in batches
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (productId) => {
          try {
            const product = selectedProducts.find((p: any) => p.id === productId);
            if (!product) {
              throw new Error('Product not found');
            }

            // Store previous data for undo
            undoData.push({
              productId,
              previousData: { ...product },
            });

            const updateData = buildUpdateData(product);
            await updateMutation.mutateAsync({
              id: productId,
              product: updateData,
            });

            setProgress(prev => ({ ...prev, current: prev.current + 1 }));
            return { success: true, productId };
          } catch (err) {
            setProgress(prev => ({ ...prev, errors: prev.errors + 1, current: prev.current + 1 }));
            logger.error(`Failed to update product ${productId}`, { error: err, productId });
            return { success: false, productId, error: err };
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches to avoid overwhelming the server
        if (i + batchSize < productIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Store undo stack
      setUndoStack(undoData);

      // Get final progress state - use current progress state
      const finalErrors = progress.errors;
      const finalCurrent = progress.current;
      const successCount = finalCurrent - finalErrors;
      
      if (successCount > 0) {
        success('Bulk Update', `Updated ${successCount} product${successCount !== 1 ? 's' : ''}`);
      }
      if (finalErrors > 0) {
        showError('Partial Failure', `${finalErrors} product${finalErrors !== 1 ? 's' : ''} failed to update`);
      }

      onSuccess?.();
      // Don't close immediately - show completion state
      setTimeout(() => {
        onClose();
        setProgress({ current: 0, total: 0, errors: 0 });
        setUndoStack([]);
      }, 2000);
    } catch (error) {
      handleError(error, { operation: 'bulk_update', productIds });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: undoStack.length, errors: 0 });

    try {
      for (const { productId, previousData } of undoStack) {
        try {
          await updateMutation.mutateAsync({
            id: productId,
            product: previousData,
          });
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        } catch (err) {
          setProgress(prev => ({ ...prev, errors: prev.errors + 1, current: prev.current + 1 }));
        }
      }

      success('Undo Complete', 'Changes have been reverted');
      setUndoStack([]);
      onSuccess?.();
    } catch (error) {
      handleError(error, { operation: 'bulk_undo' });
    } finally {
      setIsProcessing(false);
    }
  };

  const fields: Array<{ id: BulkEditField; label: string; icon: any; description: string }> = [
    {
      id: 'price',
      label: 'Preis setzen',
      icon: DollarSign,
      description: 'Preis für alle ausgewählten Produkte setzen'
    },
    {
      id: 'priceAdjust',
      label: 'Preis anpassen',
      icon: Percent,
      description: 'Preise um % oder fixen Betrag anpassen'
    },
    {
      id: 'category',
      label: 'Kategorie',
      icon: Tag,
      description: 'Produkte in eine Kategorie verschieben'
    },
    {
      id: 'status',
      label: 'Status',
      icon: CheckCircle,
      description: 'Produktstatus ändern (aktiv, inaktiv, Entwurf)'
    },
    {
      id: 'access',
      label: 'Zugriffsebene',
      icon: Globe,
      description: 'Zugriffsebene setzen (kostenlos, standard, limitiert, vip)'
    },
    {
      id: 'inventory',
      label: 'Lagerbestand',
      icon: Package,
      description: 'Lagerbestand für alle Produkte setzen'
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: Tag,
      description: 'Tags hinzufügen (kommagetrennt)'
    },
    {
      id: 'images',
      label: 'Bilder',
      icon: ImageIcon,
      description: 'Bilder für alle Produkte hochladen'
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Edit className="w-6 h-6 text-blue-400" />
            Massenbearbeitung
          </DialogTitle>
          <DialogDescription>
            {productIds.length} Produkt{productIds.length !== 1 ? 'e' : ''} gleichzeitig bearbeiten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Field Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Select Field to Update</label>
            <div className="grid grid-cols-2 gap-3">
              {fields.map((field) => {
                const Icon = field.icon;
                const isSelected = activeField === field.id;
                return (
                  <button
                    key={field.id}
                    onClick={() => {
                      setActiveField(field.id);
                      setValue('');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                      <span className={`font-medium ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                        {field.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value Input */}
          {activeField && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {fields.find(f => f.id === activeField)?.label} Value
              </label>
              {activeField === 'status' ? (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-white"
                >
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              ) : activeField === 'access' ? (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-white"
                >
                  <option value="">Select access level</option>
                  <option value="free">Free</option>
                  <option value="standard">Standard</option>
                  <option value="limited">Limited</option>
                  <option value="vip">VIP</option>
                </select>
              ) : activeField === 'category' ? (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-white"
                >
                  <option value="">Select category</option>
                  {categories.map((category: any) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              ) : activeField === 'tags' ? (
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              ) : activeField === 'priceAdjust' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPriceAdjustType('fixed')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        priceAdjustType === 'fixed'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      Fixer Betrag
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceAdjustType('percent')}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        priceAdjustType === 'percent'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      Prozent
                    </button>
                  </div>
                  <Input
                    type="number"
                    value={priceAdjustValue}
                    onChange={(e) => setPriceAdjustValue(e.target.value)}
                    placeholder={priceAdjustType === 'percent' ? 'z.B. 10 für +10%' : 'z.B. 5.99 für +€5.99'}
                    step={priceAdjustType === 'percent' ? '0.1' : '0.01'}
                  />
                  {priceAdjustValue && (
                    <p className="text-xs text-muted-foreground">
                      {priceAdjustType === 'percent' 
                        ? `Preise werden um ${priceAdjustValue}% ${parseFloat(priceAdjustValue) >= 0 ? 'erhöht' : 'reduziert'}`
                        : `Preise werden um €${priceAdjustValue} ${parseFloat(priceAdjustValue) >= 0 ? 'erhöht' : 'reduziert'}`
                      }
                    </p>
                  )}
                </div>
              ) : activeField === 'images' ? (
                <div className="space-y-2">
                  <ImagePicker
                    multiple={true}
                    showPreview={true}
                    maxImages={5}
                    value={selectedImages}
                    onChange={setSelectedImages}
                  />
                  <p className="text-xs text-muted-foreground">
                    Diese Bilder werden zu allen ausgewählten Produkten hinzugefügt
                  </p>
                </div>
              ) : (
                <Input
                  type={activeField === 'price' || activeField === 'inventory' ? 'number' : 'text'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`${activeField} eingeben`}
                  min={activeField === 'price' || activeField === 'inventory' ? '0' : undefined}
                  step={activeField === 'price' ? '0.01' : undefined}
                />
              )}
            </div>
          )}

          {/* Preview */}
          {activeField && (value || (activeField === 'priceAdjust' && priceAdjustValue) || (activeField === 'images' && selectedImages.length > 0)) && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Preview ausblenden' : 'Preview anzeigen'}
              </Button>
              {showPreview && (
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-sm font-medium text-blue-400 mb-2">Preview (erste 5 Produkte):</p>
                  <div className="space-y-1">
                    {selectedProducts.slice(0, 5).map((product: any) => {
                      const updateData = buildUpdateData(product);
                      return (
                        <div key={product.id} className="text-xs text-muted-foreground">
                          <span className="font-medium">{product.name}:</span>{' '}
                          {Object.entries(updateData).map(([key, val]) => (
                            <span key={key}>
                              {key} = {String(val)}
                            </span>
                          ))}
                        </div>
                      );
                    })}
                    {selectedProducts.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        ... und {selectedProducts.length - 5} weitere
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Tracker */}
          {isProcessing && (
            <BulkProgressTracker
              total={progress.total}
              current={progress.current}
              status={progress.current >= progress.total ? 'complete' : 'processing'}
              errors={progress.errors}
              message={`Updating products... ${progress.current}/${progress.total}`}
            />
          )}

          {/* Warning */}
          {activeField && (value || (activeField === 'priceAdjust' && priceAdjustValue) || (activeField === 'images' && selectedImages.length > 0)) && !isProcessing && (
            <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-400 mb-1">Warning</p>
                  <p className="text-xs text-muted-foreground">
                    Dies wird {productIds.length} Produkt{productIds.length !== 1 ? 'e' : ''} aktualisieren.
                    {undoStack.length > 0 && ' Du kannst die Änderungen mit Undo rückgängig machen.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {undoStack.length > 0 && !isProcessing && (
            <Button
              variant="outline"
              onClick={handleUndo}
              className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Undo ({undoStack.length} changes)
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {isProcessing ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={handleBulkUpdate}
            disabled={!activeField || (!value && activeField !== 'priceAdjust' && activeField !== 'images') || 
              (activeField === 'priceAdjust' && !priceAdjustValue) ||
              (activeField === 'images' && selectedImages.length === 0) ||
              isProcessing}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Update {productIds.length} Product{productIds.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

