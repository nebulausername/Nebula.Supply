import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { InlineEditCell } from './InlineEditCell';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Package, 
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export interface DropVariant {
  id: string;
  label: string;
  basePrice: number;
  stock: number;
  sold?: number;
  image?: string;
  description?: string;
  sku?: string;
}

export interface DropVariantEditorProps {
  variants: DropVariant[];
  onVariantsChange: (variants: DropVariant[]) => void;
  onStockChange?: (variantId: string, oldStock: number, newStock: number) => void;
  onPriceChange?: (variantId: string, oldPrice: number, newPrice: number) => void;
  disabled?: boolean;
  className?: string;
}

export const DropVariantEditor: React.FC<DropVariantEditorProps> = ({
  variants,
  onVariantsChange,
  onStockChange,
  onPriceChange,
  disabled = false,
  className = ''
}) => {
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  const toggleVariantExpansion = (variantId: string) => {
    const newExpanded = new Set(expandedVariants);
    if (newExpanded.has(variantId)) {
      newExpanded.delete(variantId);
    } else {
      newExpanded.add(variantId);
    }
    setExpandedVariants(newExpanded);
  };

  const addVariant = () => {
    const newVariant: DropVariant = {
      id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: 'New Variant',
      basePrice: 0,
      stock: 0,
      sold: 0
    };

    onVariantsChange([...variants, newVariant]);
    setExpandedVariants(prev => new Set([...prev, newVariant.id]));
    setIsAddingVariant(false);
  };

  const removeVariant = (variantId: string) => {
    onVariantsChange(variants.filter(v => v.id !== variantId));
    setExpandedVariants(prev => {
      const newSet = new Set(prev);
      newSet.delete(variantId);
      return newSet;
    });
  };

  const updateVariant = (variantId: string, updates: Partial<DropVariant>) => {
    const updatedVariants = variants.map(variant =>
      variant.id === variantId ? { ...variant, ...updates } : variant
    );
    onVariantsChange(updatedVariants);
  };

  const getStockStatus = (variant: DropVariant) => {
    const available = variant.stock - (variant.sold || 0);
    const percentage = variant.stock > 0 ? (available / variant.stock) * 100 : 0;

    if (available <= 0) {
      return { status: 'out', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    } else if (percentage <= 10) {
      return { status: 'low', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    } else if (percentage <= 50) {
      return { status: 'medium', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle };
    } else {
      return { status: 'good', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
  };

  const getStockColor = (variant: DropVariant) => {
    const available = variant.stock - (variant.sold || 0);
    const percentage = variant.stock > 0 ? (available / variant.stock) * 100 : 0;

    if (available <= 0) return 'text-red-600';
    if (percentage <= 10) return 'text-yellow-600';
    if (percentage <= 50) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          Variants ({variants.length})
        </h4>
        {!disabled && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingVariant(true)}
            className="h-7 px-2 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Variant
          </Button>
        )}
      </div>

      {/* Variants List */}
      <div className="space-y-1">
        {variants.map((variant) => {
          const isExpanded = expandedVariants.has(variant.id);
          const stockStatus = getStockStatus(variant);
          const available = variant.stock - (variant.sold || 0);

          return (
            <Card key={variant.id} className="p-3">
              {/* Variant Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVariantExpansion(variant.id)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-sm">{variant.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {variant.sku || 'No SKU'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Stock Status */}
                  <div className="flex items-center gap-1">
                    <stockStatus.icon className={`w-3 h-3 ${stockStatus.color.split(' ')[1]}`} />
                    <span className={`text-xs font-medium ${getStockColor(variant)}`}>
                      {available} / {variant.stock}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-gray-400" />
                    <span className="text-sm font-medium">
                      €{variant.basePrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Actions */}
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variant.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Label */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Label
                      </label>
                      <InlineEditCell
                        value={variant.label}
                        onSave={(newValue) => updateVariant(variant.id, { label: newValue })}
                        placeholder="Variant label"
                        disabled={disabled}
                      />
                    </div>

                    {/* SKU */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        SKU
                      </label>
                      <InlineEditCell
                        value={variant.sku || ''}
                        onSave={(newValue) => updateVariant(variant.id, { sku: newValue })}
                        placeholder="Product SKU"
                        disabled={disabled}
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Price (€)
                      </label>
                      <InlineEditCell
                        value={variant.basePrice}
                        onSave={(newValue) => {
                          const oldPrice = variant.basePrice;
                          updateVariant(variant.id, { basePrice: newValue });
                          onPriceChange?.(variant.id, oldPrice, newValue);
                        }}
                        type="number"
                        min={0}
                        step={0.01}
                        formatDisplay={(value) => `€${value.toFixed(2)}`}
                        formatInput={(value) => value.toString()}
                        disabled={disabled}
                      />
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        Stock
                      </label>
                      <InlineEditCell
                        value={variant.stock}
                        onSave={(newValue) => {
                          const oldStock = variant.stock;
                          updateVariant(variant.id, { stock: newValue });
                          onStockChange?.(variant.id, oldStock, newValue);
                        }}
                        type="number"
                        min={0}
                        disabled={disabled}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Description
                    </label>
                    <InlineEditCell
                      value={variant.description || ''}
                      onSave={(newValue) => updateVariant(variant.id, { description: newValue })}
                      type="textarea"
                      placeholder="Variant description"
                      disabled={disabled}
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      Image URL
                    </label>
                    <InlineEditCell
                      value={variant.image || ''}
                      onSave={(newValue) => updateVariant(variant.id, { image: newValue })}
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      disabled={disabled}
                    />
                  </div>

                  {/* Stock Summary */}
                  <div className="bg-gray-50 rounded p-2">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{variant.stock}</div>
                        <div className="text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{variant.sold || 0}</div>
                        <div className="text-gray-500">Sold</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-medium ${getStockColor(variant)}`}>
                          {available}
                        </div>
                        <div className="text-gray-500">Available</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Variant Button (when no variants) */}
      {variants.length === 0 && !disabled && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">No variants yet</p>
          <Button
            variant="outline"
            onClick={() => setIsAddingVariant(true)}
            className="h-8 px-3 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add First Variant
          </Button>
        </div>
      )}

      {/* Quick Add Variant */}
      {isAddingVariant && (
        <Card className="p-3 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm text-blue-900">Add New Variant</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Variant name"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addVariant();
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={addVariant}
                className="h-8 px-3 text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAddingVariant(false)}
                className="h-8 px-3 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};






