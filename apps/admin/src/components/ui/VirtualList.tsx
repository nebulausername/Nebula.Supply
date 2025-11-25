import React, { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { useVirtualScroll, UseVirtualScrollOptions } from '../../lib/hooks/useVirtualScroll';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  enabled?: boolean;
  onScroll?: (scrollTop: number) => void;
}

export const VirtualList = memo(<T,>({ 
  items, 
  itemHeight, 
  containerHeight = 600,
  renderItem, 
  overscan = 3,
  className = '',
  enabled = true,
  onScroll
}: VirtualListProps<T>) => {
  const virtualScrollOptions: UseVirtualScrollOptions = {
    itemHeight,
    containerHeight,
    overscan,
    enabled,
  };

  const {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    containerRef,
  } = useVirtualScroll(items, virtualScrollOptions);

  // Throttled scroll handler for smooth performance
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Expose scroll methods
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).__scrollToIndex = scrollToIndex;
      (containerRef.current as any).__scrollToTop = scrollToTop;
      (containerRef.current as any).__scrollToBottom = scrollToBottom;
    }
  }, [scrollToIndex, scrollToTop, scrollToBottom, containerRef]);

  const getItemHeight = useCallback((index: number): number => {
    if (typeof itemHeight === 'number') {
      return itemHeight;
    }
    return itemHeight(index);
  }, [itemHeight]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="list"
      aria-label={`Virtual list with ${items.length} items`}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((index) => {
            const item = items[index];
            if (!item) return null;
            
            const height = getItemHeight(index);
            return (
              <div
                key={index}
                style={{ height }}
                role="listitem"
                aria-posinset={index + 1}
                aria-setsize={items.length}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}) as <T>(props: VirtualListProps<T>) => React.ReactElement;

VirtualList.displayName = 'VirtualList';


