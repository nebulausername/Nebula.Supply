import { useState, useMemo, useCallback } from 'react';
import type { Drop, DropVariant } from '@nebula/shared';
import { useEnhancedTouch } from '../useEnhancedTouch';

export type SelectionMode = 'single' | 'multi';

interface UseVariantSelectionOptions {
  mode?: SelectionMode;
  defaultVariantId?: string;
  onVariantChange?: (variantId: string | string[]) => void;
}

/**
 * 🎯 Smart Variant Selection Hook
 * Handles single and multi-variant selection with haptic feedback
 */
export const useVariantSelection = (
  drop: Drop,
  options: UseVariantSelectionOptions = {}
) => {
  const {
    mode = 'single',
    defaultVariantId = drop.defaultVariantId,
    onVariantChange
  } = options;

  const { triggerHaptic } = useEnhancedTouch();
  
  // Single selection state
  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVariantId);
  
  // Multi selection state
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  
  // Individual variant quantities for multi-select
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});

  // Get selected variant(s)
  const selectedVariant = useMemo(() => {
    if (mode === 'multi') {
      return drop.variants.filter(v => selectedVariantIds.has(v.id));
    }
    return drop.variants.find(v => v.id === selectedVariantId) ?? drop.variants[0];
  }, [drop.variants, selectedVariantId, selectedVariantIds, mode]);

  // 🎯 Select single variant
  const selectVariant = useCallback((variantId: string) => {
    const variant = drop.variants.find(v => v.id === variantId);
    if (!variant) return;

    // Check if variant is available
    if (variant.stock <= 0) {
      triggerHaptic('error');
      return;
    }

    triggerHaptic('light');
    setSelectedVariantId(variantId);
    onVariantChange?.(variantId);
  }, [drop.variants, triggerHaptic, onVariantChange]);

  // 🎯 Toggle multi-select variant
  const toggleVariant = useCallback((variantId: string) => {
    const variant = drop.variants.find(v => v.id === variantId);
    if (!variant || variant.stock <= 0) {
      triggerHaptic('error');
      return;
    }

    triggerHaptic('light');
    
    setSelectedVariantIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variantId)) {
        newSet.delete(variantId);
        // Remove quantity for deselected variant
        setVariantQuantities(quantities => {
          const { [variantId]: _, ...rest } = quantities;
          return rest;
        });
      } else {
        newSet.add(variantId);
        // Set default quantity for new variant
        setVariantQuantities(quantities => ({
          ...quantities,
          [variantId]: variant.minQuantity ?? 1
        }));
      }
      
      const selectedIds = Array.from(newSet);
      onVariantChange?.(selectedIds);
      return newSet;
    });
  }, [drop.variants, triggerHaptic, onVariantChange]);

  // 🎯 Set quantity for specific variant (multi-select)
  const setVariantQuantity = useCallback((variantId: string, quantity: number) => {
    const variant = drop.variants.find(v => v.id === variantId);
    if (!variant) return;

    const minQty = variant.minQuantity ?? 1;
    const maxQty = Math.min(variant.maxQuantity ?? 10, variant.stock);
    const clampedQuantity = Math.max(minQty, Math.min(quantity, maxQty));

    setVariantQuantities(prev => ({
      ...prev,
      [variantId]: clampedQuantity
    }));
  }, [drop.variants]);

  // 🎯 Select all available variants
  const selectAll = useCallback(() => {
    triggerHaptic('medium');
    const availableVariants = drop.variants.filter(v => v.stock > 0);
    const newSet = new Set(availableVariants.map(v => v.id));
    
    setSelectedVariantIds(newSet);
    
    // Set default quantities for all
    const newQuantities: Record<string, number> = {};
    availableVariants.forEach(v => {
      newQuantities[v.id] = v.minQuantity ?? 1;
    });
    setVariantQuantities(newQuantities);
    
    onVariantChange?.(Array.from(newSet));
  }, [drop.variants, triggerHaptic, onVariantChange]);

  // 🎯 Clear all selections
  const clearSelection = useCallback(() => {
    triggerHaptic('light');
    setSelectedVariantIds(new Set());
    setVariantQuantities({});
    onVariantChange?.([]);
  }, [triggerHaptic, onVariantChange]);

  // 🎯 Calculate total price for multi-select
  const totalPrice = useMemo(() => {
    if (mode === 'single') {
      const variant = selectedVariant as DropVariant;
      return variant.basePrice;
    }
    
    const variants = selectedVariant as DropVariant[];
    return variants.reduce((total, variant) => {
      const quantity = variantQuantities[variant.id] ?? 1;
      return total + (variant.basePrice * quantity);
    }, 0);
  }, [mode, selectedVariant, variantQuantities]);

  // 🎯 Calculate total quantity for multi-select
  const totalQuantity = useMemo(() => {
    if (mode === 'single') return 1;
    return Object.values(variantQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [mode, variantQuantities]);

  // 🎯 Check if variant is selected
  const isVariantSelected = useCallback((variantId: string) => {
    if (mode === 'single') {
      return selectedVariantId === variantId;
    }
    return selectedVariantIds.has(variantId);
  }, [mode, selectedVariantId, selectedVariantIds]);

  // 🎯 Get available variants (in stock)
  const availableVariants = useMemo(() => {
    return drop.variants.filter(v => v.stock > 0);
  }, [drop.variants]);

  return {
    // State
    selectedVariant,
    selectedVariantId,
    selectedVariantIds: Array.from(selectedVariantIds),
    variantQuantities,
    
    // Actions
    selectVariant,
    toggleVariant,
    setVariantQuantity,
    selectAll,
    clearSelection,
    
    // Computed
    totalPrice,
    totalQuantity,
    isVariantSelected,
    availableVariants,
    hasSelection: mode === 'single' ? !!selectedVariantId : selectedVariantIds.size > 0,
  };
};





