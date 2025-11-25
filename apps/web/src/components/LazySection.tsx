import { ReactNode, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  onLoad?: () => void;
  enabled?: boolean;
}

export const LazySection = ({
  children,
  fallback,
  threshold = 0.1,
  rootMargin = '100px',
  className = '',
  onLoad,
  enabled = true
}: LazySectionProps) => {
  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    threshold,
    rootMargin,
    triggerOnce: true,
    enabled
  });
  const [hasLoaded, setHasLoaded] = useState(!enabled);
  const onLoadCalled = useRef(false);

  useEffect(() => {
    if (isIntersecting && !hasLoaded && !onLoadCalled.current) {
      setHasLoaded(true);
      if (onLoad) {
        onLoad();
        onLoadCalled.current = true;
      }
    }
  }, [isIntersecting, hasLoaded, onLoad]);

  return (
    <div ref={ref} className={className}>
      <AnimatePresence mode="wait">
        {hasLoaded ? (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {fallback || <div className="h-64 animate-pulse bg-black/30 rounded-2xl" />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

