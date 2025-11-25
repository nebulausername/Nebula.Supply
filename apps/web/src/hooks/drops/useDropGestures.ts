import { useCallback, useRef } from 'react';
import { useEnhancedTouch } from '../useEnhancedTouch';

interface DropGesturesOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  longPressDelay?: number;
  doubleTapDelay?: number;
  swipeThreshold?: number;
}

/**
 * 🎯 Drop-Specific Gesture Handler Hook
 * Handles swipe, long-press, and double-tap gestures for drop interactions
 */
export const useDropGestures = (options: DropGesturesOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onDoubleTap,
    longPressDelay = 500,
    doubleTapDelay = 300,
    swipeThreshold = 50
  } = options;

  const { triggerHaptic } = useEnhancedTouch();
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const lastTapTimeRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);

  // 🎯 Handle Touch Start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };

    // Long press detection
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        triggerHaptic('medium');
        onLongPress();
      }, longPressDelay);
    }

    // Double tap detection
    if (onDoubleTap) {
      const timeSinceLastTap = now - lastTapTimeRef.current;
      
      if (timeSinceLastTap < doubleTapDelay) {
        tapCountRef.current += 1;
        if (tapCountRef.current === 2) {
          triggerHaptic('success');
          onDoubleTap();
          tapCountRef.current = 0;
        }
      } else {
        tapCountRef.current = 1;
      }
      
      lastTapTimeRef.current = now;
    }
  }, [onLongPress, onDoubleTap, triggerHaptic, longPressDelay, doubleTapDelay]);

  // 🎯 Handle Touch Move
  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  // 🎯 Handle Touch End
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Only detect swipe if touch was quick (< 500ms)
    if (deltaTime < 500) {
      // Horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0 && onSwipeRight) {
          triggerHaptic('light');
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          triggerHaptic('light');
          onSwipeLeft();
        }
      }
      // Vertical swipe
      else if (Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0 && onSwipeDown) {
          triggerHaptic('light');
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          triggerHaptic('light');
          onSwipeUp();
        }
      }
    }

    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, triggerHaptic, swipeThreshold]);

  // 🎯 Mouse Handlers (for desktop testing)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: now
    };

    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    if (!touchStartRef.current) return;

    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight, swipeThreshold]);

  // 🎯 Cleanup
  const cleanup = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  return {
    // Touch handlers
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    
    // Mouse handlers (for desktop)
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    
    // Cleanup
    cleanup
  };
};





