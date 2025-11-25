import { useCallback } from 'react';
import { useCookieStore } from '../store/cookieStore';

// 📳 Haptic Feedback Hook for Mobile Touch Interactions

export const useHaptic = () => {
  const { settings } = useCookieStore();

  const vibrate = useCallback(
    (duration: number | number[]) => {
      if (!settings.vibrationEnabled) return;
      if (!('vibrate' in navigator)) return;

      try {
        navigator.vibrate(duration);
      } catch (error) {
        console.warn('Vibration not supported:', error);
      }
    },
    [settings.vibrationEnabled]
  );

  // Different haptic patterns for different actions
  const hapticClick = useCallback(() => {
    vibrate(10); // Short tap for cookie click
  }, [vibrate]);

  const hapticPurchase = useCallback(() => {
    vibrate([20, 10, 20]); // Double tap for purchase
  }, [vibrate]);

  const hapticAchievement = useCallback(() => {
    vibrate([50, 30, 50, 30, 100]); // Celebration pattern
  }, [vibrate]);

  const hapticError = useCallback(() => {
    vibrate([100, 50, 100]); // Error pattern
  }, [vibrate]);

  const hapticMilestone = useCallback(() => {
    vibrate([30, 20, 30, 20, 30, 20, 60]); // Epic celebration
  }, [vibrate]);

  return {
    vibrate,
    hapticClick,
    hapticPurchase,
    hapticAchievement,
    hapticError,
    hapticMilestone,
  };
};
