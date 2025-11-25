import { useState, useEffect, useCallback, useRef } from 'react';

// 🎯 Enhanced Touch & Gesture Hook für Premium Mobile Experience
export interface TouchState {
  isLongPress: boolean;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
  hapticEnabled: boolean;
  isTouching: boolean;
  touchCount: number;
}

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useEnhancedTouch = () => {
  const [touchState, setTouchState] = useState<TouchState>({
    isLongPress: false,
    swipeDirection: null,
    hapticEnabled: true,
    isTouching: false,
    touchCount: 0
  });

  const longPressTimerRef = useRef<NodeJS.Timeout>();
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // 🎯 Haptic Feedback mit verschiedenen Intensitäten
  const triggerHaptic = useCallback((type: HapticFeedbackType = 'light') => {
    if (!touchState.hapticEnabled) return;
    
    // Vibration API
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
  }, [touchState.hapticEnabled]);

  // 🎯 Toggle Haptic Feedback
  const toggleHaptic = useCallback(() => {
    setTouchState(prev => ({
      ...prev,
      hapticEnabled: !prev.hapticEnabled
    }));
    
    // Save to localStorage
    localStorage.setItem('hapticEnabled', String(!touchState.hapticEnabled));
  }, [touchState.hapticEnabled]);

  // 🎯 Long Press Detection
  const handleLongPressStart = useCallback((callback: () => void, delay: number = 500) => {
    return (e: TouchEvent | React.TouchEvent) => {
      const touch = 'touches' in e ? e.touches[0] : e;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      longPressTimerRef.current = setTimeout(() => {
        setTouchState(prev => ({ ...prev, isLongPress: true }));
        triggerHaptic('medium');
        callback();
      }, delay);
    };
  }, [triggerHaptic]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    setTouchState(prev => ({ ...prev, isLongPress: false }));
    touchStartRef.current = null;
  }, []);

  // 🎯 Swipe Detection
  const detectSwipe = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        return deltaX > 0 ? 'right' : 'left';
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        return deltaY > 0 ? 'down' : 'up';
      }
    }
    return null;
  }, []);

  // 🎯 Check if device supports touch
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const savedHaptic = localStorage.getItem('hapticEnabled');
    
    setTouchState(prev => ({
      ...prev,
      hapticEnabled: savedHaptic ? savedHaptic === 'true' : hasTouch
    }));
  }, []);

  // 🎯 Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    touchState,
    triggerHaptic,
    toggleHaptic,
    handleLongPressStart,
    handleLongPressEnd,
    detectSwipe
  };
};

// 🎯 Hook für Swipe Gestures
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void
) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { triggerHaptic } = useEnhancedTouch();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minDistance) {
      if (deltaX > 0 && onSwipeRight) {
        triggerHaptic('light');
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        triggerHaptic('light');
        onSwipeLeft();
      }
    } else if (Math.abs(deltaY) > minDistance) {
      if (deltaY > 0 && onSwipeDown) {
        triggerHaptic('light');
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        triggerHaptic('light');
        onSwipeUp();
      }
    }

    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, triggerHaptic]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  };
};

// 🎯 Hook für Pull-to-Refresh
export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef<number>(0);
  const { triggerHaptic } = useEnhancedTouch();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(currentY - touchStartRef.current, 120));
      
      setPullDistance(distance);
      
      if (distance > 80 && !isPulling) {
        setIsPulling(true);
        triggerHaptic('medium');
      } else if (distance <= 80 && isPulling) {
        setIsPulling(false);
      }
    }
  }, [isPulling, triggerHaptic]);

  const handleTouchEnd = useCallback(async () => {
    if (isPulling && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('success');
      
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
          touchStartRef.current = 0;
        }, 500);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      touchStartRef.current = 0;
    }
  }, [isPulling, isRefreshing, onRefresh, triggerHaptic]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

// 🎯 Hook für Pinch-to-Zoom
export const usePinchZoom = (
  onZoom?: (scale: number) => void,
  minScale: number = 0.5,
  maxScale: number = 3
) => {
  const [scale, setScale] = useState(1);
  const touchDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(1);

  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchDistanceRef.current = getTouchDistance(e.touches);
      initialScaleRef.current = scale;
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistanceRef.current > 0) {
      const currentDistance = getTouchDistance(e.touches);
      const newScale = Math.max(
        minScale,
        Math.min(maxScale, (currentDistance / touchDistanceRef.current) * initialScaleRef.current)
      );
      setScale(newScale);
      onZoom?.(newScale);
    }
  }, [minScale, maxScale, onZoom]);

  const handleTouchEnd = useCallback(() => {
    touchDistanceRef.current = 0;
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    onZoom?.(1);
  }, [onZoom]);

  return {
    scale,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetZoom
  };
};