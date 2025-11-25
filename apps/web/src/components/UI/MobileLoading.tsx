import React, { memo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { cn } from '../../utils/cn';

interface MobileLoadingProps {
  isLoading: boolean;
  children: ReactNode;
  message?: string;
  pullToRefresh?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const MobileLoading = memo(({
  isLoading,
  children,
  message = 'Lädt...',
  pullToRefresh = false,
  onRefresh,
  className
}: MobileLoadingProps) => {
  const { triggerHaptic } = useEnhancedTouch();

  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center min-h-[200px] p-6', className)}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 mb-4"
        >
          <Loader2 className="w-full h-full text-accent" />
        </motion.div>
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted text-sm"
          >
            {message}
          </motion.p>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});

MobileLoading.displayName = 'MobileLoading';

// Pull to Refresh Component
interface PullToRefreshProps {
  onRefresh: () => void;
  children: ReactNode;
  threshold?: number;
}

export const PullToRefresh = memo(({
  onRefresh,
  children,
  threshold = 80
}: PullToRefreshProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isPulling, setIsPulling] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const startY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    setPullDistance(Math.min(distance, threshold * 1.5));

    if (distance >= threshold && !isRefreshing) {
      triggerHaptic('medium');
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('success');
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1000);
    } else {
      setPullDistance(0);
    }
    setIsPulling(false);
  };

  const progress = Math.min(100, (pullDistance / threshold) * 100);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull Indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
            style={{ transform: `translateY(${Math.min(pullDistance, threshold)}px)` }}
          >
            <div className="bg-black/80 backdrop-blur-sm rounded-full p-3 shadow-lg">
              {isRefreshing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-6 h-6 text-accent" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: pullDistance >= threshold ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <RefreshCw className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        style={{ transform: `translateY(${Math.min(pullDistance * 0.5, threshold * 0.5)}px)` }}
        className={cn(isPulling && 'transition-transform duration-200')}
      >
        {children}
      </motion.div>
    </div>
  );
});

PullToRefresh.displayName = 'PullToRefresh';

