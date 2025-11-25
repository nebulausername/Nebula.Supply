/**
 * Virtual Scrolling Utilities
 * Optimizes rendering of long lists by only rendering visible items
 */

import React from 'react';

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}

export function calculateVirtualScroll(
  scrollTop: number,
  itemCount: number,
  options: VirtualScrollOptions
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 3 } = options;

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    startIndex + visibleCount + overscan * 2
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY
  };
}

export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const result = React.useMemo(
    () => calculateVirtualScroll(scrollTop, items.length, options),
    [scrollTop, items.length, options]
  );

  const visibleItems = items.slice(result.startIndex, result.endIndex + 1);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight: result.totalHeight,
    offsetY: result.offsetY,
    handleScroll,
    startIndex: result.startIndex,
    endIndex: result.endIndex
  };
}

// Hook für dynamische Item-Höhen (für variable Höhen)
export function useVirtualScrollDynamic<T>(
  items: T[],
  options: Omit<VirtualScrollOptions, 'itemHeight'> & {
    getItemHeight: (index: number) => number;
  }
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Calculate cumulative heights
  const cumulativeHeights = React.useMemo(() => {
    const heights: number[] = [0];
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += options.getItemHeight(i);
      heights.push(total);
    }
    return heights;
  }, [items.length, options.getItemHeight]);

  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1];

  // Find visible range
  const visibleRange = React.useMemo(() => {
    const { containerHeight, overscan = 3 } = options;
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;

    let startIndex = 0;
    let endIndex = items.length - 1;

    // Binary search for start index
    for (let i = 0; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i + 1] > viewportTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    // Binary search for end index
    for (let i = cumulativeHeights.length - 1; i >= 0; i--) {
      if (cumulativeHeights[i] < viewportBottom) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  }, [scrollTop, items.length, cumulativeHeights, options]);

  const visibleItems = items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  const offsetY = cumulativeHeights[visibleRange.startIndex] || 0;

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex,
    containerRef
  };
}

