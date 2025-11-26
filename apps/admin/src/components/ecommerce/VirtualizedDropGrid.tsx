import React, { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DropCard } from './DropCard';
import { useMobile } from '../../hooks/useMobile';
import { cn } from '../../utils/cn';

interface VirtualizedDropGridProps {
  drops: any[];
  selectedDrops: Set<string>;
  onSelect: (dropId: string, checked: boolean) => void;
  onEdit: (drop: any) => void;
  onDelete: (dropId: string, dropName: string) => void;
  onDuplicate: (drop: any) => void;
  onDetails: (drop: any) => void;
  onStockUpdate: (drop: any) => void;
  onUpdate: (dropId: string, field: string, value: any) => void;
  onDragStart: (e: React.DragEvent, dropId: string) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  draggedDropId: string | null;
  dragOverIndex: number | null;
  getStatusBadge: (drop: any) => React.ReactNode;
  getAccessBadge: (access: string) => React.ReactNode;
  getPriorityBadge: (drop: any) => React.ReactNode;
  containerWidth: number;
  containerHeight: number;
}

// Grid configuration
const GRID_COLUMNS = {
  mobile: 1,
  sm: 2,
  md: 2,
  lg: 3,
  xl: 4,
};

const CARD_HEIGHT = 320; // Approximate height of a DropCard
const CARD_GAP = 16; // Gap between cards

const VirtualizedDropGridComponent = memo(function VirtualizedDropGrid({
  drops,
  selectedDrops,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onDetails,
  onStockUpdate,
  onUpdate,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedDropId,
  dragOverIndex,
  getStatusBadge,
  getAccessBadge,
  getPriorityBadge,
  containerWidth,
  containerHeight,
}: VirtualizedDropGridProps) {
  const { isMobile } = useMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  // Calculate columns based on container width
  const columns = useMemo(() => {
    if (isMobile) return GRID_COLUMNS.mobile;
    if (containerWidth < 640) return GRID_COLUMNS.sm;
    if (containerWidth < 768) return GRID_COLUMNS.md;
    if (containerWidth < 1024) return GRID_COLUMNS.lg;
    return GRID_COLUMNS.xl;
  }, [containerWidth, isMobile]);

  // Calculate rows and items per row
  const itemsPerRow = columns;
  const rowHeight = CARD_HEIGHT + CARD_GAP;
  const totalRows = Math.ceil(drops.length / itemsPerRow);

  // Calculate visible range based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const visibleHeight = container.clientHeight;
      
      // Calculate which rows are visible
      const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
      const endRow = Math.min(
        totalRows,
        Math.ceil((scrollTop + visibleHeight) / rowHeight) + 2
      );
      
      // Convert rows to item indices
      const start = startRow * itemsPerRow;
      const end = Math.min(drops.length, endRow * itemsPerRow);
      
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [drops.length, rowHeight, totalRows, itemsPerRow]);

  // Get visible drops
  const visibleDrops = useMemo(() => {
    return drops.slice(visibleRange.start, visibleRange.end);
  }, [drops, visibleRange]);

  // Handle drop select
  const handleDropSelect = useCallback((dropId: string, checked: boolean) => {
    onSelect(dropId, checked);
  }, [onSelect]);

  // Handle drop update
  const handleDropUpdate = useCallback(async (dropId: string, field: string, value: any) => {
    onUpdate(dropId, field, value);
  }, [onUpdate]);

  if (drops.length === 0) {
    return null;
  }

  // Grid class mapping for Tailwind
  const gridClassMap: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  // For mobile or small lists, use regular rendering
  if (isMobile || drops.length < 40) {
    return (
      <div 
        className={cn(
          "grid gap-3 md:gap-4 touch-pan-y",
          gridClassMap[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        )}
      >
        <AnimatePresence mode="popLayout">
          {drops.map((drop, index) => (
            <DropCard
              key={drop.id}
              drop={drop}
              isSelected={selectedDrops.has(drop.id)}
              index={index}
              onSelect={(checked) => handleDropSelect(drop.id, checked)}
              onEdit={() => onEdit(drop)}
              onDelete={() => onDelete(drop.id, drop.name)}
              onDuplicate={() => onDuplicate(drop)}
              onDetails={() => onDetails(drop)}
              onStockUpdate={() => onStockUpdate(drop)}
              onUpdate={handleDropUpdate}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              isDragging={draggedDropId === drop.id}
              isDragOver={dragOverIndex === index}
              getStatusBadge={getStatusBadge}
              getAccessBadge={getAccessBadge}
              getPriorityBadge={getPriorityBadge}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Virtual scrolling for large grids
  const totalHeight = totalRows * rowHeight;
  const offsetY = Math.floor(visibleRange.start / itemsPerRow) * rowHeight;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-auto"
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div 
          style={{ 
            transform: `translateY(${offsetY}px)`,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${CARD_GAP}px`,
            padding: `${CARD_GAP / 2}px`
          }}
        >
          {visibleDrops.map((drop, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div key={drop.id} style={{ height: CARD_HEIGHT }}>
                <DropCard
                  drop={drop}
                  isSelected={selectedDrops.has(drop.id)}
                  index={actualIndex}
                  onSelect={(checked) => handleDropSelect(drop.id, checked)}
                  onEdit={() => onEdit(drop)}
                  onDelete={() => onDelete(drop.id, drop.name)}
                  onDuplicate={() => onDuplicate(drop)}
                  onDetails={() => onDetails(drop)}
                  onStockUpdate={() => onStockUpdate(drop)}
                  onUpdate={handleDropUpdate}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  isDragging={draggedDropId === drop.id}
                  isDragOver={dragOverIndex === actualIndex}
                  getStatusBadge={getStatusBadge}
                  getAccessBadge={getAccessBadge}
                  getPriorityBadge={getPriorityBadge}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// Named export
export const VirtualizedDropGrid = VirtualizedDropGridComponent;

// Default export for dynamic imports
export default VirtualizedDropGridComponent;

