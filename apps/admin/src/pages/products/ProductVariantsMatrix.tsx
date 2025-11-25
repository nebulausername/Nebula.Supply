import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useToastHelpers } from '../../components/ui/Toast';
import { ProductVariant, VariantOption, VariantCombination } from '@nebula/shared';
import { ImagePicker } from '../../components/media/ImagePicker';
import { logger } from '../../lib/logger';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  Edit, 
  Save, 
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Image as ImageIcon,
  DollarSign,
  Package
} from 'lucide-react';

interface ProductVariantsMatrixProps {
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  onCombinationsChange: (combinations: VariantCombination[]) => void;
  className?: string;
}

export const ProductVariantsMatrix: React.FC<ProductVariantsMatrixProps> = ({
  variants,
  onVariantsChange,
  onCombinationsChange,
  className
}) => {
  // Ensure variants is always an array
  const safeVariants = Array.isArray(variants) ? variants : [];
  
  const [combinations, setCombinations] = useState<VariantCombination[]>([]);
  const [editingCombination, setEditingCombination] = useState<string | null>(null);
  const { success, error: showError } = useToastHelpers();

  // Generate all possible combinations of variant options
  const generateCombinations = useMemo(() => {
    if (!Array.isArray(safeVariants) || safeVariants.length === 0) return [];

    const generate = (variantIndex: number, currentOptions: Record<string, string> = {}): VariantCombination[] => {
      if (variantIndex >= safeVariants.length) {
        // Create combination for this set of options
        const combinationId = Object.entries(currentOptions)
          .map(([key, value]) => `${key}:${value}`)
          .join('|');
        
        return [{
          id: combinationId,
          options: { ...currentOptions },
          sku: generateSKU(currentOptions),
          price: 0,
          inventory: 0,
          isActive: true,
          images: [],
          barcode: ''
        }];
      }

      const variant = safeVariants[variantIndex];
      if (!variant || !Array.isArray(variant.options) || variant.options.length === 0) {
        // Skip invalid variants
        return generate(variantIndex + 1, currentOptions);
      }

      const combinations: VariantCombination[] = [];

      for (const option of variant.options) {
        if (!option || !option.value) continue; // Skip invalid options
        const newOptions = { ...currentOptions, [variant.name || `variant_${variantIndex}`]: option.value };
        combinations.push(...generate(variantIndex + 1, newOptions));
      }

      return combinations;
    };

    return generate(0);
  }, [safeVariants]);

  const generateSKU = (options: Record<string, string>, baseSKU?: string): string => {
    const base = baseSKU || 'PROD';
    const optionCodes = Object.entries(options)
      .map(([key, value]) => {
        const keyCode = key.substring(0, 2).toUpperCase();
        const valueCode = value.substring(0, 3).toUpperCase().replace(/\s/g, '');
        return `${keyCode}-${valueCode}`;
      })
      .join('-');
    return `${base}-${optionCodes}`;
  };

  // Update combinations when variants change
  React.useEffect(() => {
    if (!Array.isArray(generateCombinations)) return;
    
    const combinationsArray = Array.isArray(combinations) ? combinations : [];
    const newCombinations = generateCombinations.map(combo => {
      if (!combo || !combo.id) return combo;
      const existing = combinationsArray.find(c => c && c.id === combo.id);
      return existing || combo;
    });
    setCombinations(newCombinations);
    onCombinationsChange(newCombinations);
  }, [generateCombinations, combinations, onCombinationsChange]);

  const handleVariantChange = (variantIndex: number, field: keyof ProductVariant, value: any) => {
    if (!Array.isArray(safeVariants) || variantIndex < 0 || variantIndex >= safeVariants.length) return;
    
    const newVariants = [...safeVariants];
    const variant = newVariants[variantIndex];
    if (!variant) return;
    
    newVariants[variantIndex] = { ...variant, [field]: value };
    onVariantsChange(newVariants);
  };

  const handleOptionChange = (variantIndex: number, optionIndex: number, field: keyof VariantOption, value: any) => {
    if (!Array.isArray(safeVariants) || variantIndex < 0 || variantIndex >= safeVariants.length) return;
    
    const newVariants = [...safeVariants];
    const variant = newVariants[variantIndex];
    if (!variant || !Array.isArray(variant.options) || optionIndex < 0 || optionIndex >= variant.options.length) return;
    
    const newOptions = [...variant.options];
    const option = newOptions[optionIndex];
    if (!option) return;
    
    newOptions[optionIndex] = { ...option, [field]: value };
    newVariants[variantIndex] = { ...variant, options: newOptions };
    onVariantsChange(newVariants);
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      type: 'color',
      name: 'New Variant',
      options: [
        { id: '1', label: 'Option 1', value: 'option1' },
        { id: '2', label: 'Option 2', value: 'option2' }
      ]
    };
    const variantsArray = Array.isArray(safeVariants) ? safeVariants : [];
    onVariantsChange([...variantsArray, newVariant]);
    logger.logUserAction('product_variant_added', { variantName: newVariant.name });
  };

  const removeVariant = (variantIndex: number) => {
    if (!Array.isArray(safeVariants) || variantIndex < 0 || variantIndex >= safeVariants.length) return;
    
    const newVariants = safeVariants.filter((_, index) => index !== variantIndex);
    onVariantsChange(newVariants);
    logger.logUserAction('product_variant_removed', { variantIndex });
  };

  const addOption = (variantIndex: number) => {
    if (!Array.isArray(safeVariants) || variantIndex < 0 || variantIndex >= safeVariants.length) return;
    
    const newVariants = [...safeVariants];
    const variant = newVariants[variantIndex];
    if (!variant) return;
    
    const optionsArray = Array.isArray(variant.options) ? variant.options : [];
    const newOption: VariantOption = {
      id: Date.now().toString(),
      label: `Option ${optionsArray.length + 1}`,
      value: `option${optionsArray.length + 1}`
    };
    newVariants[variantIndex] = { ...variant, options: [...optionsArray, newOption] };
    onVariantsChange(newVariants);
  };

  const removeOption = (variantIndex: number, optionIndex: number) => {
    if (!Array.isArray(safeVariants) || variantIndex < 0 || variantIndex >= safeVariants.length) return;
    
    const variant = safeVariants[variantIndex];
    if (!variant || !Array.isArray(variant.options)) return;
    
    if (variant.options.length <= 1) {
      showError('Cannot Remove Option', 'Each variant must have at least one option');
      return;
    }

    const newVariants = [...safeVariants];
    const variantToUpdate = newVariants[variantIndex];
    if (!variantToUpdate || !Array.isArray(variantToUpdate.options)) return;
    
    newVariants[variantIndex] = {
      ...variantToUpdate,
      options: variantToUpdate.options.filter((_, index) => index !== optionIndex)
    };
    onVariantsChange(newVariants);
  };

  const handleCombinationChange = (combinationId: string, field: keyof VariantCombination, value: any) => {
    const combinationsArray = Array.isArray(combinations) ? combinations : [];
    const newCombinations = combinationsArray.map(combo =>
      combo && combo.id === combinationId ? { ...combo, [field]: value } : combo
    ).filter(Boolean) as VariantCombination[];
    setCombinations(newCombinations);
    onCombinationsChange(newCombinations);
  };

  const toggleCombinationActive = (combinationId: string) => {
    const combinationsArray = Array.isArray(combinations) ? combinations : [];
    const existing = combinationsArray.find(c => c && c.id === combinationId);
    handleCombinationChange(combinationId, 'isActive', !existing?.isActive);
  };

  const bulkUpdateCombinations = (field: keyof VariantCombination, value: any) => {
    const combinationsArray = Array.isArray(combinations) ? combinations : [];
    const newCombinations = combinationsArray.map(combo => combo ? { ...combo, [field]: value } : combo).filter(Boolean) as VariantCombination[];
    setCombinations(newCombinations);
    onCombinationsChange(newCombinations);
    success('Bulk Update', `Updated ${field} for all combinations`);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Variants Configuration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <Button onClick={addVariant} size="sm">
            Add Variant
          </Button>
        </div>

        <div className="space-y-4">
          {safeVariants.map((variant, variantIndex) => {
            if (!variant) return null;
            const optionsArray = Array.isArray(variant.options) ? variant.options : [];
            
            return (
              <div key={variantIndex} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Input
                      value={variant.name || ''}
                      onChange={(e) => handleVariantChange(variantIndex, 'name', e.target.value)}
                      className="w-32"
                      placeholder="Variant name"
                    />
                    <Select
                      value={variant.type || 'color'}
                      onChange={(e) => handleVariantChange(variantIndex, 'type', e.target.value)}
                      className="w-32"
                    >
                      <option value="color">Color</option>
                      <option value="size">Size</option>
                      <option value="material">Material</option>
                      <option value="style">Style</option>
                      <option value="finish">Finish</option>
                      <option value="pattern">Pattern</option>
                      <option value="custom">Custom</option>
                    </Select>
                  </div>
                  <Button
                    onClick={() => removeVariant(variantIndex)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Options</span>
                    <Button onClick={() => addOption(variantIndex)} size="sm" variant="outline">
                      Add Option
                    </Button>
                  </div>
                  
                  {optionsArray.map((option, optionIndex) => {
                    if (!option) return null;
                    return (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'label', e.target.value)}
                      placeholder="Option label"
                      className="flex-1"
                    />
                    <Input
                      value={option.value}
                      onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'value', e.target.value)}
                      placeholder="Option value"
                      className="flex-1"
                    />
                    <Input
                      value={option.swatch || ''}
                      onChange={(e) => handleOptionChange(variantIndex, optionIndex, 'swatch', e.target.value)}
                      placeholder="Color code"
                      className="w-20"
                    />
                      <Button
                        onClick={() => removeOption(variantIndex, optionIndex)}
                        variant="outline"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </Button>
                    </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Combinations Matrix */}
      {combinations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Variant Combinations ({combinations.length})
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {combinations.filter(c => c.isActive).length} active, {combinations.filter(c => !c.isActive).length} inactive
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  const avgPrice = combinations.reduce((sum, c) => sum + c.price, 0) / combinations.length || 0;
                  bulkUpdateCombinations('price', avgPrice);
                }}
                size="sm"
                variant="outline"
                title="Set all prices to average"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Avg Price
              </Button>
              <Button
                onClick={() => {
                  const input = prompt('Enter inventory amount for all combinations:');
                  if (input !== null) {
                    const amount = parseInt(input) || 0;
                    bulkUpdateCombinations('inventory', amount);
                  }
                }}
                size="sm"
                variant="outline"
              >
                <Package className="w-4 h-4 mr-1" />
                Set Stock
              </Button>
              <Button
                onClick={() => {
                  const csv = [
                    ['SKU', 'Options', 'Price', 'Inventory', 'Active', 'Barcode'].join(','),
                    ...combinations.map(c => [
                      c.sku,
                      Object.entries(c.options).map(([k, v]) => `${k}:${v}`).join(';'),
                      c.price,
                      c.inventory,
                      c.isActive ? 'Yes' : 'No',
                      c.barcode || ''
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `variants-${Date.now()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  success('Export', 'Variants exported to CSV');
                }}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2">Options</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Inventory</th>
                  <th className="text-left p-2">Barcode</th>
                  <th className="text-left p-2">Images</th>
                  <th className="text-left p-2">Active</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((combination) => {
                  const isLowStock = combination.inventory < 10 && combination.inventory > 0;
                  const isOutOfStock = combination.inventory === 0;
                  const isEditing = editingCombination === combination.id;
                  
                  return (
                    <tr 
                      key={combination.id} 
                      className={`border-b border-gray-800 ${
                        !combination.isActive ? 'opacity-50' : ''
                      } ${isOutOfStock ? 'bg-red-900/10' : isLowStock ? 'bg-orange-900/10' : ''}`}
                    >
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(combination.options || {}).map(([key, value]) => {
                            const variantsArray = Array.isArray(safeVariants) ? safeVariants : [];
                            const variant = variantsArray.find(v => v && v.name === key);
                            const optionsArray = variant && Array.isArray(variant.options) ? variant.options : [];
                            const option = optionsArray.find(o => o && o.value === value);
                            return (
                              <Badge
                                key={`${key}-${value}`}
                                variant="outline"
                                className="text-xs"
                                style={option?.swatch ? { 
                                  backgroundColor: option.swatch,
                                  borderColor: option.swatch,
                                  color: '#fff'
                                } : {}}
                              >
                                {key}: {value}
                              </Badge>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-2">
                        <Input
                          value={combination.sku}
                          onChange={(e) => handleCombinationChange(combination.id, 'sku', e.target.value)}
                          className="w-32 text-sm"
                          placeholder="Auto-generated"
                        />
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input
                            type="number"
                            value={combination.price}
                            onChange={(e) => handleCombinationChange(combination.id, 'price', parseFloat(e.target.value) || 0)}
                            className="w-24 text-sm pl-7"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="relative">
                          <Package className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                          <Input
                            type="number"
                            value={combination.inventory}
                            onChange={(e) => handleCombinationChange(combination.id, 'inventory', parseInt(e.target.value) || 0)}
                            className={`w-24 text-sm pl-7 ${
                              isOutOfStock ? 'border-red-500' : isLowStock ? 'border-orange-500' : ''
                            }`}
                            min="0"
                          />
                        </div>
                        {isLowStock && (
                          <AlertCircle className="w-3 h-3 text-orange-400 mt-1" />
                        )}
                        {isOutOfStock && (
                          <XCircle className="w-3 h-3 text-red-400 mt-1" />
                        )}
                      </td>
                      <td className="p-2">
                        <Input
                          value={combination.barcode || ''}
                          onChange={(e) => handleCombinationChange(combination.id, 'barcode', e.target.value)}
                          className="w-28 text-sm"
                          placeholder="Barcode"
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {combination.images && combination.images.length > 0 ? (
                            <Badge variant="outline" className="text-xs">
                              <ImageIcon className="w-3 h-3 mr-1" />
                              {combination.images.length}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Open image picker for this combination
                                const urls = prompt('Enter image URLs (comma-separated):');
                                if (urls) {
                                  const imageUrls = urls.split(',').map(url => url.trim()).filter(Boolean);
                                  handleCombinationChange(combination.id, 'images', imageUrls.map((url, idx) => ({
                                    id: `img_${combination.id}_${idx}`,
                                    url,
                                    alt: `${combination.sku} image ${idx + 1}`
                                  })));
                                }
                              }}
                              className="h-6 px-2"
                            >
                              <ImageIcon className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={combination.isActive}
                            onChange={() => toggleCombinationActive(combination.id)}
                            className="rounded border-gray-600"
                          />
                          {combination.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => {
                              const newCombo = { ...combination, id: `${combination.id}_copy_${Date.now()}` };
                              const newCombinations = [...combinations, newCombo];
                              setCombinations(newCombinations);
                              onCombinationsChange(newCombinations);
                              success('Duplicated', 'Variant combination duplicated');
                            }}
                            size="sm"
                            variant="outline"
                            title="Duplicate"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};



