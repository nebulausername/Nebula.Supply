import { useState, useCallback } from "react";

interface LoadingStates {
  isProductLoading: boolean;
  isImageLoading: boolean;
  isActionLoading: boolean;
  isShippingLoading: boolean;
}

// 🎯 Loading States Hook für bessere UX
export const useLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    isProductLoading: false,
    isImageLoading: false,
    isActionLoading: false,
    isShippingLoading: false
  });

  // 🎯 Set Loading State
  const setLoading = useCallback((key: keyof LoadingStates, value: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // 🎯 Set Multiple Loading States
  const setMultipleLoading = useCallback((states: Partial<LoadingStates>) => {
    setLoadingStates(prev => ({
      ...prev,
      ...states
    }));
  }, []);

  // 🎯 Reset All Loading States
  const resetLoading = useCallback(() => {
    setLoadingStates({
      isProductLoading: false,
      isImageLoading: false,
      isActionLoading: false,
      isShippingLoading: false
    });
  }, []);

  // 🎯 Loading Wrapper für Actions
  const withLoading = useCallback(async <T>(
    action: () => Promise<T>,
    loadingKey: keyof LoadingStates
  ): Promise<T> => {
    setLoading(loadingKey, true);
    try {
      const result = await action();
      return result;
    } finally {
      setLoading(loadingKey, false);
    }
  }, [setLoading]);

  return {
    ...loadingStates,
    setLoading,
    setMultipleLoading,
    resetLoading,
    withLoading
  };
};
