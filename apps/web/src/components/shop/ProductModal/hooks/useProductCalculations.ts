import { useMemo } from "react";
import type { Product, VariantType, VariantOption } from "@nebula/shared";
import { formatCurrency } from "../../../../utils/currency";

const DEFAULT_ACCENT = "#0BF7BC";

interface ProductCalculationsProps {
  product: Product | null;
  selection: Partial<Record<VariantType, string>>;
  shippingSelection: string | null;
}

// 🎯 Optimierter Hook für alle Berechnungen
export const useProductCalculations = ({ product, selection, shippingSelection }: ProductCalculationsProps) => {
  return useMemo(() => {
    if (!product) {
      return {
        activeMedia: null,
        fallbackColor: DEFAULT_ACCENT,
        accentColor: DEFAULT_ACCENT,
        unitPrice: 0,
        totalPrice: 0,
        shippingCost: 0,
        shippingAdjustment: 0,
        activeShippingOption: null,
        selectedVariantLabels: {},
        variantSummary: "Individuelle Auswahl"
      };
    }

    // 🎯 Color Variant Logic
    const colorVariant = product.variants?.find(v => v.type === "color") ?? null;
    const selectedColorId = selection.color ?? colorVariant?.options[0]?.id;
    const selectedColorOption = selectedColorId
      ? colorVariant?.options.find(option => option.id === selectedColorId)
      : undefined;

    // 🎯 Active Media Logic
    const activeMedia = (() => {
      if (selectedColorOption?.value) {
        const mediaByColor = product.media.find(media => media.color === selectedColorOption.value);
        if (mediaByColor) return mediaByColor;
      }
      return product.media[0] ?? null;
    })();

    // 🎯 Color Calculations
    const accentColor = selectedColorOption?.swatch ?? colorVariant?.options[0]?.swatch ?? DEFAULT_ACCENT;
    const fallbackColor = selectedColorOption?.swatch ?? activeMedia?.color ?? DEFAULT_ACCENT;

    // 🎯 Shipping Calculations
    const activeShippingOption = (() => {
      const fallback = product.shippingOptions[0] ?? null;
      if (!fallback) return null;
      const optionId = shippingSelection ?? fallback.id;
      return product.shippingOptions.find(option => option.id === optionId) ?? fallback;
    })();

    const shippingAdjustment = activeShippingOption?.priceAdjustment ?? 0;

    // 🎯 Pricing Calculations
    const unitPrice = product.price; // TODO: Add pricing tiers logic
    const totalPrice = unitPrice + shippingAdjustment;

    // 🎯 Variant Labels
    const selectedVariantLabels = (() => {
      if (!product.variants) return {};
      const labels: Partial<Record<VariantType, string>> = {};
      product.variants.forEach(variant => {
        const optionId = selection[variant.type] ?? variant.options[0]?.id;
        if (!optionId) return;
        const option = variant.options.find(item => item.id === optionId);
        if (option) {
          labels[variant.type] = option.label;
        }
      });
      return labels;
    })();

    const variantSummary = (() => {
      const entries = Object.entries(selectedVariantLabels)
        .filter(([, label]) => Boolean(label))
        .map(([type, label]) => `${type}: ${label}`);
      return entries.length ? entries.join(" | ") : "Individuelle Auswahl";
    })();

    return {
      activeMedia,
      fallbackColor,
      accentColor,
      unitPrice,
      totalPrice,
      shippingCost: shippingAdjustment,
      shippingAdjustment,
      activeShippingOption,
      selectedVariantLabels,
      variantSummary
    };
  }, [product, selection, shippingSelection]);
};
