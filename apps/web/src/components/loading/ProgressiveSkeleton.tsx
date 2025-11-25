import { memo } from 'react';
import { motion } from 'framer-motion';

interface ProgressiveSkeletonProps {
  variant?: 'card' | 'text' | 'image' | 'list';
  lines?: number;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
}

export const ProgressiveSkeleton = memo(({
  variant = 'card',
  lines = 3,
  className = '',
  priority = 'medium'
}: ProgressiveSkeletonProps) => {
  const delay = priority === 'high' ? 0 : priority === 'medium' ? 0.1 : 0.2;

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
        className={`rounded-2xl bg-black/30 p-6 ${className}`}
      >
        <div className="space-y-4">
          <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
        </div>
      </motion.div>
    );
  }

  if (variant === 'text') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
        className={`space-y-2 ${className}`}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-white/10 rounded animate-pulse`}
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </motion.div>
    );
  }

  if (variant === 'image') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
        className={`aspect-video bg-white/10 rounded-2xl animate-pulse ${className}`}
      />
    );
  }

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
        className={`space-y-3 ${className}`}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/10 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </motion.div>
    );
  }

  return null;
});

ProgressiveSkeleton.displayName = 'ProgressiveSkeleton';

