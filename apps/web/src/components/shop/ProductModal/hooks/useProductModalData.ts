import { useMemo } from "react";
import { useShopStore } from "../../../../store/shop";
import type { Product, VariantType } from "@nebula/shared";

// 🎯 Optimierter Hook für Produktdaten - nur relevante Daten
export const useProductModalData = (selectedProductId: string | null) => {
  return useShopStore(
    useMemo(() => (state) => {
      if (!selectedProductId) {
        return {
          product: null,
          selection: {},
          shippingSelection: null,
          isInterested: false
        };
      }

      const product = state.products.find(p => p.id === selectedProductId);
      if (!product) {
        return {
          product: null,
          selection: {},
          shippingSelection: null,
          isInterested: false
        };
      }

      return {
        product,
        selection: state.selections[selectedProductId] ?? {},
        shippingSelection: state.shippingSelections[selectedProductId] ?? null,
        isInterested: state.interestedProducts[selectedProductId] ?? false
      };
    }, [selectedProductId])
  );
};
