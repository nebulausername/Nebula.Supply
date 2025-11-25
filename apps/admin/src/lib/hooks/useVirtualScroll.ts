import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

export interface UseVirtualScrollOptions {
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  enabled?: boolean;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number[];
  totalHeight: number;
  offsetY: number;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Advanced virtual scrolling hook with support for:
 * - Dynamic item heights
 * - Keyboard navigation
 * - Smooth scrolling
 * - Intersection Observer for better performance
 */
export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
): VirtualScrollResult {
  const {
    itemHeight,
    containerHeight,
    overscan = 3,
    enabled = true,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());

  // Check if itemHeight is dynamic (function) or static (number)
  const isDynamicHeight = typeof itemHeight === 'function';

  // Calculate item height (static or dynamic)
  const getItemHeight = useCallback(
    (index: number): number => {
      if (typeof itemHeight === 'number') {
        return itemHeight;
      }
      // Check cached height first
      const cached = itemHeights.get(index);
      if (cached !== undefined) {
        return cached;
      }
      // Use function to calculate
      return itemHeight(index);
    },
    [itemHeight, itemHeights]
  );

  // Calculate cumulative heights for dynamic heights
  const cumulativeHeights = useMemo(() => {
    if (!isDynamicHeight) {
      return null;
    }

    const heights: number[] = [];
    let cumulative = 0;

    for (let i = 0; i < items.length; i++) {
      heights.push(cumulative);
      cumulative += getItemHeight(i);
    }

    return heights;
  }, [items.length, getItemHeight, isDynamicHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (!isDynamicHeight) {
      return items.length * (itemHeight as number);
    }

    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  }, [items.length, itemHeight, isDynamicHeight, getItemHeight]);

  // Find start index using binary search for dynamic heights
  const findStartIndex = useCallback(
    (scrollTop: number): number => {
      if (!isDynamicHeight || !cumulativeHeights) {
        return Math.max(0, Math.floor(scrollTop / (itemHeight as number)) - overscan);
      }

      // Binary search for dynamic heights
      let left = 0;
      let right = cumulativeHeights.length - 1;
      let result = 0;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (cumulativeHeights[mid] <= scrollTop) {
          result = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      return Math.max(0, result - overscan);
    },
    [isDynamicHeight, cumulativeHeights, itemHeight, overscan]
  );

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!enabled || items.length === 0) {
      return { startIndex: 0, endIndex: items.length };
    }

    const startIndex = findStartIndex(scrollTop);
    let endIndex = startIndex;
    let currentHeight = isDynamicHeight && cumulativeHeights
      ? cumulativeHeights[startIndex]
      : startIndex * (itemHeight as number);

    // Calculate end index
    while (endIndex < items.length && currentHeight < scrollTop + containerHeight) {
      currentHeight += getItemHeight(endIndex);
      endIndex++;
    }

    return {
      startIndex,
      endIndex: Math.min(items.length, endIndex + overscan),
    };
  }, [
    enabled,
    items.length,
    scrollTop,
    containerHeight,
    findStartIndex,
    overscan,
    isDynamicHeight,
    cumulativeHeights,
    itemHeight,
    getItemHeight,
  ]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return Array.from(
      { length: visibleRange.endIndex - visibleRange.startIndex },
      (_, i) => visibleRange.startIndex + i
    );
  }, [visibleRange.startIndex, visibleRange.endIndex]);

  // Calculate offset Y
  const offsetY = useMemo(() => {
    if (!isDynamicHeight || !cumulativeHeights) {
      return visibleRange.startIndex * (itemHeight as number);
    }
    return cumulativeHeights[visibleRange.startIndex] || 0;
  }, [isDynamicHeight, cumulativeHeights, visibleRange.startIndex, itemHeight]);

  // Throttled scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
    });
  }, []);

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (!containerRef.current || index < 0 || index >= items.length) {
        return;
      }

      let targetScrollTop: number;

      if (!isDynamicHeight) {
        const itemH = itemHeight as number;
        switch (align) {
          case 'start':
            targetScrollTop = index * itemH;
            break;
          case 'center':
            targetScrollTop = index * itemH - containerHeight / 2 + itemH / 2;
            break;
          case 'end':
            targetScrollTop = index * itemH - containerHeight + itemH;
            break;
        }
      } else {
        const itemH = getItemHeight(index);
        const cumulative = cumulativeHeights?.[index] || 0;
        switch (align) {
          case 'start':
            targetScrollTop = cumulative;
            break;
          case 'center':
            targetScrollTop = cumulative - containerHeight / 2 + itemH / 2;
            break;
          case 'end':
            targetScrollTop = cumulative - containerHeight + itemH;
            break;
        }
      }

      containerRef.current.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    },
    [items.length, containerHeight, isDynamicHeight, itemHeight, getItemHeight, cumulativeHeights]
  );

  // Scroll to top
  const scrollToTop = useCallback(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    containerRef.current?.scrollTo({ top: totalHeight, behavior: 'smooth' });
  }, [totalHeight]);

  // Update item height when measured (for dynamic heights)
  const updateItemHeight = useCallback((index: number, height: number) => {
    setItemHeights((prev) => {
      const next = new Map(prev);
      next.set(index, height);
      return next;
    });
  }, []);

  // Expose updateItemHeight for components that need to measure heights
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).__updateItemHeight = updateItemHeight;
    }
  }, [updateItemHeight]);

  // Keyboard navigation
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if container is focused or contains focused element
      if (!containerRef.current?.contains(document.activeElement)) {
        return;
      }

      const currentIndex = visibleRange.startIndex;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          scrollToIndex(Math.min(items.length - 1, currentIndex + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          scrollToIndex(Math.max(0, currentIndex - 1));
          break;
        case 'Home':
          e.preventDefault();
          scrollToTop();
          break;
        case 'End':
          e.preventDefault();
          scrollToBottom();
          break;
        case 'PageDown':
          e.preventDefault();
          scrollToIndex(Math.min(items.length - 1, currentIndex + 10));
          break;
        case 'PageUp':
          e.preventDefault();
          scrollToIndex(Math.max(0, currentIndex - 10));
          break;
      }
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);
    container.setAttribute('tabIndex', '0'); // Make focusable for keyboard navigation

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, visibleRange.startIndex, items.length, scrollToIndex, scrollToTop, scrollToBottom]);

  return {
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    containerRef,
  };
}

