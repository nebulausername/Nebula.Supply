import { useCallback } from 'react';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useTouchFeedback = () => {
  const triggerHaptic = useCallback((type: HapticFeedbackType = 'light') => {
    if ('vibrate' in navigator) {
      const patterns: Record<HapticFeedbackType, number | number[]> = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [10, 20, 10],
        warning: [20, 10, 20],
        error: [30, 10, 30, 10, 30]
      };
      
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return {
    triggerHaptic
  };
};


