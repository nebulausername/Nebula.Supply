import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePullToRefresh } from '../../hooks/useEnhancedTouch';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export const PullToRefresh = ({ 
  onRefresh, 
  children, 
  threshold = 80,
  className 
}: PullToRefreshProps) => {
  const {
    isPulling,
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = usePullToRefresh(onRefresh);

  // Calculate rotation and opacity based on pull distance
  const rotation = Math.min((pullDistance / threshold) * 360, 360);
  const opacity = Math.min(pullDistance / threshold, 1);
  const scale = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull Indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-10",
          "flex items-center justify-center",
          "transition-all duration-200"
        )}
        style={{
          height: pullDistance,
          opacity
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center",
            "w-10 h-10 rounded-full",
            "bg-gradient-to-br from-[#0BF7BC] to-[#61F4F4]",
            "shadow-lg shadow-[#0BF7BC]/50",
            "transition-all duration-200"
          )}
          style={{
            transform: `scale(${scale})`,
          }}
        >
          <RefreshCw
            className={cn(
              "w-5 h-5 text-black",
              (isRefreshing || isPulling) && "animate-spin"
            )}
            style={{
              transform: isRefreshing ? '' : `rotate(${rotation}deg)`,
              transition: isRefreshing ? '' : 'transform 0.1s'
            }}
          />
        </div>

        {/* Pull Text */}
        {pullDistance > 30 && !isRefreshing && (
          <div className="absolute top-full mt-2 text-xs font-medium text-[#0BF7BC]">
            {isPulling ? 'Release to refresh' : 'Pull to refresh'}
          </div>
        )}
      </div>

      {/* Content with padding when pulling */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling || isRefreshing ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};


