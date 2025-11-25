import { useMemo, useRef, useEffect, useState, ReactNode, useCallback } from 'react';
import { motion } from 'framer-motion';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  estimateItemHeight?: number;
  enableAnimations?: boolean;
}

export const VirtualList = <T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  estimateItemHeight,
  enableAnimations = true
}: VirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeightsRef = useRef<Map<number, number>>(new Map());
  const rafRef = useRef<number>();

  // Calculate item height (static or dynamic)
  const getItemHeight = useCallback((index: number): number => {
    if (typeof itemHeight === 'function') {
      return itemHeight(index);
    }
    return itemHeight;
  }, [itemHeight]);

  // Calculate total height with dynamic item heights
  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }
    // For dynamic heights, use estimates
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += itemHeightsRef.current.get(i) || estimateItemHeight || itemHeight(0);
    }
    return total;
  }, [items.length, itemHeight, estimateItemHeight]);

  // Optimized scroll handler with RAF throttling
  const handleScroll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container) {
        setScrollTop(container.scrollTop);
      }
    });
  }, []);

  const visibleRange = useMemo(() => {
    let start = 0;
    let currentHeight = 0;
    
    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (currentHeight + height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      currentHeight += height;
    }
    
    // Find end index
    let end = start;
    let visibleHeight = 0;
    for (let i = start; i < items.length; i++) {
      const height = getItemHeight(i);
      visibleHeight += height;
      if (visibleHeight > containerHeight + (getItemHeight(i) * overscan * 2)) {
        end = Math.min(items.length, i + overscan);
        break;
      }
      end = i + 1;
    }
    
    return { start, end: Math.min(items.length, end + overscan) };
  }, [scrollTop, containerHeight, items.length, overscan, getItemHeight]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);

  // Calculate offset for positioning
  const offsetY = useMemo(() => {
    let offset = 0;
    for (let i = 0; i < visibleRange.start; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }, [visibleRange.start, getItemHeight]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
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
          {visibleItems.map(({ item, index }) => {
            const height = getItemHeight(index);
            return enableAnimations ? (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ height }}
              >
                {renderItem(item, index)}
              </motion.div>
            ) : (
              <div key={index} style={{ height }}>
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
