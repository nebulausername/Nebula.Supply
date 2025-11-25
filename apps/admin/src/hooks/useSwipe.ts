import { useCallback, useRef } from 'react';
import { useTouchFeedback } from './useTouchFeedback';

export interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  enableHaptic?: boolean;
}

export const useSwipe = (options: SwipeOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    enableHaptic = true
  } = options;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { triggerHaptic } = useTouchFeedback();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        if (enableHaptic) triggerHaptic('light');
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        if (enableHaptic) triggerHaptic('light');
        onSwipeLeft();
      }
    } else if (absDeltaY > threshold) {
      if (deltaY > 0 && onSwipeDown) {
        if (enableHaptic) triggerHaptic('light');
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        if (enableHaptic) triggerHaptic('light');
        onSwipeUp();
      }
    }

    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, enableHaptic, triggerHaptic]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    // Additional handlers for more control
    handleTouchMove: useCallback((e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Prevent default scrolling if swiping horizontally
      if (absDeltaX > absDeltaY && absDeltaX > 10) {
        e.preventDefault();
      }
    }, [])
  };
}

// Swipe Actions Hook - für Swipe-to-delete, Swipe-to-archive, etc.
export interface SwipeActionOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  enableHaptic?: boolean;
  preventScroll?: boolean;
}

export function useSwipeActions(options: SwipeActionOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    enableHaptic = true,
    preventScroll = true
  } = options;

  return useSwipe({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    enableHaptic
  });
};


