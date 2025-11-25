import { memo, useMemo, useRef, useState, useCallback } from 'react';
import { useCookieClickerStore, BUILDINGS } from '../../store/cookieClicker';
import { rafThrottle } from '../../utils/performance';
import { BuildingCard } from './BuildingCard';

interface VirtualizedBuildingListProps {
  containerHeight?: number;
  itemHeight?: number;
  overscan?: number;
}

// 🚀 Virtualisierte Building List für bessere Performance
export const VirtualizedBuildingList = memo(({
  containerHeight = 600,
  itemHeight = 200,
  overscan = 3
}: VirtualizedBuildingListProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const cookies = useCookieClickerStore(state => state.cookies);
  const buildings = useCookieClickerStore(state => state.buildings);

  // Memoized building data
  const buildingData = useMemo(() => BUILDINGS.map(building => {
    const owned = buildings[building.id] || 0;
    const cost = Math.floor(building.baseCost * Math.pow(1.2, owned));
    const canAfford = cookies >= cost;
    
    return { building, owned, cost, canAfford };
  }), [buildings, cookies]);

  // Optimized scroll handler with RAF
  const handleScroll = useCallback(
    rafThrottle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }),
    []
  );

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      buildingData.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, buildingData.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return buildingData.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [buildingData, visibleRange.startIndex, visibleRange.endIndex]);

  // Calculate total height and offset
  const totalHeight = buildingData.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className="overflow-auto custom-scrollbar"
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
            right: 0
          }}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map(({ building, owned, cost, canAfford }) => (
              <BuildingCard
                key={building.id}
                building={building}
                owned={owned}
                cost={cost}
                canAfford={canAfford}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualizedBuildingList.displayName = 'VirtualizedBuildingList';

