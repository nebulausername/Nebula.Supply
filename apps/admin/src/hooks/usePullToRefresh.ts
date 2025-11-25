import { useState, useCallback, useRef } from 'react';
import { useTouchFeedback } from './useTouchFeedback';

export interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true
}: PullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef<number>(0);
  const { triggerHaptic } = useTouchFeedback();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || window.scrollY > 0) return;
    touchStartRef.current = e.touches[0].clientY;
  }, [enabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled || !touchStartRef.current || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, Math.min(currentY - touchStartRef.current, 120));
    
    setPullDistance(distance);
    
    if (distance > threshold && !isPulling) {
      setIsPulling(true);
      triggerHaptic('medium');
    } else if (distance <= threshold && isPulling) {
      setIsPulling(false);
    }
  }, [enabled, threshold, isPulling, triggerHaptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !touchStartRef.current) return;
    
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
  }, [enabled, isPulling, isRefreshing, onRefresh, triggerHaptic]);

  return {
    isPulling,
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // Helper for percentage calculation
    pullPercentage: Math.min((pullDistance / threshold) * 100, 100)
  };
}


