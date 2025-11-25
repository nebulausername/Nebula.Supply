import { useCallback } from "react";
import { useShopStore } from "../../../../store/shop";
import type { VariantType } from "@nebula/shared";

// 🎯 Optimierte Store-Selektoren für bessere Performance
export const useOptimizedShopStore = () => {
  // 🎯 Memoized Selektoren für verschiedene Bereiche
  const useProductData = useCallback((productId: string | null) => {
    return useShopStore(useCallback((state) => {
      if (!productId) return null;
      return state.products.find(p => p.id === productId) ?? null;
    }, [productId]));
  }, []);

  const useProductSelection = useCallback((productId: string | null) => {
    return useShopStore(useCallback((state) => {
      if (!productId) return {};
      return state.selections[productId] ?? {};
    }, [productId]));
  }, []);

  const useProductShipping = useCallback((productId: string | null) => {
    return useShopStore(useCallback((state) => {
      if (!productId) return null;
      return state.shippingSelections[productId] ?? null;
    }, [productId]));
  }, []);

  const useProductInterest = useCallback((productId: string | null) => {
    return useShopStore(useCallback((state) => {
      if (!productId) return false;
      return state.interestedProducts[productId] ?? false;
    }, [productId]));
  }, []);

  // 🎯 Actions (nur die, die gebraucht werden)
  const useProductActions = useCallback(() => {
    return useShopStore(useCallback((state) => ({
      selectVariant: state.selectVariant,
      selectShippingOption: state.selectShippingOption,
      toggleInterest: state.toggleInterest,
      addToCart: state.addToCart,
      checkout: state.checkout,
      closeProduct: state.closeProduct
    }), []));
  }, []);

  return {
    useProductData,
    useProductSelection,
    useProductShipping,
    useProductInterest,
    useProductActions
  };
};
