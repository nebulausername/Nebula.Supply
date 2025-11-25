import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface UseVirtualScrollOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  enabled?: boolean;
}

export const useVirtualScroll = <T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  enabled = true
}: UseVirtualScrollOptions<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualData = useMemo(() => {
    if (!enabled || items.length === 0) {
      return {
        startIndex: 0,
        endIndex: items.length,
        visibleItems: items,
        totalHeight: items.length * itemHeight,
        offsetY: 0
      };
    }

    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;

    return {
      startIndex,
      endIndex,
      visibleItems,
      totalHeight,
      offsetY
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan, enabled]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const handleScrollEvent = (e: Event) => {
        const target = e.target as HTMLDivElement;
        if (target) {
          setScrollTop(target.scrollTop);
        }
      };

      containerRef.current.addEventListener('scroll', handleScrollEvent);
      return () => {
        containerRef.current?.removeEventListener('scroll', handleScrollEvent);
      };
    }
  }, []);

  return {
    containerRef,
    virtualData,
    handleScroll,
    scrollTop
  };
};

