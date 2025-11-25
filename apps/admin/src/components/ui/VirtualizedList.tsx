// Generic Virtualized List Component
// Optimiert für große Listen (Orders, Customers, Users, etc.)

import React, { memo, useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  onScroll?: (scrollTop: number) => void;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight = 600,
  overscan = 5,
  className,
  emptyMessage = 'No items found',
  onScroll,
  keyExtractor
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const rafRef = useRef<number>();
  const lastScrollTop = useRef(0);

  // Calculate visible range and offset manually for better control

  // Optimized scroll handler with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    
    // Throttle scroll updates
    if (Math.abs(currentScrollTop - lastScrollTop.current) < 5) {
      return;
    }
    
    lastScrollTop.current = currentScrollTop;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(currentScrollTop);
      onScroll?.(currentScrollTop);
    });
  }, [onScroll]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, items.length, itemHeight, overscan]);

  // Get visible items
  const visibleItemsList = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  // Calculate offset and total height
  const calculatedOffsetY = visibleRange.startIndex * itemHeight;
  const calculatedTotalHeight = items.length * itemHeight;

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12 text-muted", className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto w-full", className)}
      style={{
        height: containerHeight,
        willChange: 'scroll-position',
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: calculatedTotalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${calculatedOffsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            willChange: 'transform',
          }}
        >
          {visibleItemsList.map((item, relativeIndex) => {
            const absoluteIndex = visibleRange.startIndex + relativeIndex;
            const key = keyExtractor 
              ? keyExtractor(item, absoluteIndex)
              : absoluteIndex;
            
            return (
              <div
                key={key}
                style={{
                  height: itemHeight,
                  minHeight: itemHeight,
                }}
              >
                {renderItem(item, absoluteIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const VirtualizedListMemo = memo(VirtualizedList) as typeof VirtualizedList;

