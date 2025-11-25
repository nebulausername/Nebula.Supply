import { useState, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { useSwipeGesture } from '../../hooks/useEnhancedTouch';

interface SwipeableViewProps {
  views: React.ReactNode[];
  initialView?: number;
  onViewChange?: (index: number) => void;
  showIndicators?: boolean;
  loop?: boolean;
  className?: string;
}

export const SwipeableView = ({
  views,
  initialView = 0,
  onViewChange,
  showIndicators = true,
  loop = false,
  className
}: SwipeableViewProps) => {
  const [currentView, setCurrentView] = useState(initialView);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSwipeLeft = useCallback(() => {
    if (currentView < views.length - 1) {
      const newView = currentView + 1;
      setCurrentView(newView);
      onViewChange?.(newView);
    } else if (loop) {
      setCurrentView(0);
      onViewChange?.(0);
    }
  }, [currentView, views.length, loop, onViewChange]);

  const handleSwipeRight = useCallback(() => {
    if (currentView > 0) {
      const newView = currentView - 1;
      setCurrentView(newView);
      onViewChange?.(newView);
    } else if (loop) {
      const newView = views.length - 1;
      setCurrentView(newView);
      onViewChange?.(newView);
    }
  }, [currentView, views.length, loop, onViewChange]);

  const swipeHandlers = useSwipeGesture(
    handleSwipeLeft,
    handleSwipeRight
  );

  // Manual drag handling for smooth animation
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    swipeHandlers.onTouchStart(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - dragStartX.current;
    setDragOffset(offset);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    setDragOffset(0);
    swipeHandlers.onTouchEnd(e);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Views Container */}
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(calc(-${currentView * 100}% + ${dragOffset}px))`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {views.map((view, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full"
          >
            {view}
          </div>
        ))}
      </div>

      {/* Indicators */}
      {showIndicators && views.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {views.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentView(index);
                onViewChange?.(index);
              }}
              className={cn(
                "transition-all duration-300",
                "rounded-full",
                currentView === index
                  ? "w-6 h-2 bg-[#0BF7BC]"
                  : "w-2 h-2 bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to view ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 🎯 Horizontal Scrollable Cards
interface ScrollableCardsProps {
  children: React.ReactNode[];
  cardClassName?: string;
  containerClassName?: string;
}

export const ScrollableCards = ({
  children,
  cardClassName,
  containerClassName
}: ScrollableCardsProps) => {
  return (
    <div className={cn(
      "overflow-x-auto overflow-y-hidden",
      "snap-x snap-mandatory",
      "scrollbar-hide",
      "-mx-4 px-4",
      "pb-2",
      containerClassName
    )}>
      <div className="flex gap-4">
        {children.map((child, index) => (
          <div
            key={index}
            className={cn(
              "flex-shrink-0 snap-start",
              "w-[85vw] sm:w-[45vw] lg:w-[30vw]",
              cardClassName
            )}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};


