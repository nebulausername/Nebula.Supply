// Pull-to-Refresh Wrapper Component
import React from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { cn } from '../../utils/cn';

export interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefreshWrapper({
  onRefresh,
  threshold = 80,
  enabled = true,
  children,
  className
}: PullToRefreshWrapperProps) {
  const {
    isPulling,
    pullDistance,
    isRefreshing,
    pullPercentage,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = usePullToRefresh({ onRefresh, threshold, enabled });

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        touchAction: 'pan-y'
      }}
    >
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-50"
          style={{
            height: `${Math.min(pullDistance, threshold * 1.5)}px`,
            transform: `translateY(${Math.min(pullDistance - threshold, threshold * 0.5)}px)`,
            transition: isRefreshing ? 'transform 0.3s ease' : 'none'
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {isRefreshing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-neon" />
            ) : (
              <div
                className="rounded-full bg-neon/20 p-2"
                style={{
                  transform: `rotate(${pullPercentage * 2}deg) scale(${Math.min(pullPercentage / 100, 1)})`
                }}
              >
                <svg className="w-4 h-4 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
            <span className="text-xs text-muted">
              {isRefreshing ? 'Aktualisiere...' : pullPercentage >= 100 ? 'Loslassen zum Aktualisieren' : 'Ziehen zum Aktualisieren'}
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

