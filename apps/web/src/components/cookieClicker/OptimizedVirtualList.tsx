import { useMemo, useRef, useState, useCallback, memo } from 'react';
import { rafThrottle } from '../../utils/performance';

interface OptimizedVirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  enableAnimations?: boolean;
}

// 🚀 Optimierte Virtual List mit RAF-basiertem Scrolling
export const OptimizedVirtualList = memo(<T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
  enableAnimations = true
}: OptimizedVirtualListProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  // 🎯 RAF-basierter Scroll Handler für flüssige Performance
  const handleScroll = useCallback(
    rafThrottle((e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(newScrollTop);
      });
    }),
    []
  );

  // 🎯 Berechne sichtbare Items - Memoized für Performance
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, items.length, itemHeight, overscan]);

  // 🎯 Visible Items - Memoized
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      absoluteIndex: visibleRange.startIndex + index
    }));
  }, [items, visibleRange]);

  // 🎯 Offset für Positioning
  const offsetY = visibleRange.startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;

  // Cleanup
  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            willChange: 'transform'
          }}
        >
          {visibleItems.map(({ item, absoluteIndex }) => (
            <div
              key={absoluteIndex}
              style={{
                height: itemHeight,
                willChange: enableAnimations ? 'transform, opacity' : undefined
              }}
            >
              {renderItem(item, absoluteIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}) as <T,>(props: OptimizedVirtualListProps<T>) => JSX.Element;

OptimizedVirtualList.displayName = 'OptimizedVirtualList';

