import { memo } from 'react';
import { motion } from 'framer-motion';
import { Truck, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FreeShippingBadgeProps {
  progress?: number; // 0-100
  threshold?: number;
  current?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const FreeShippingBadge = memo(({
  progress = 0,
  threshold = 25,
  current = 0,
  className,
  size = 'md',
  animated = true
}: FreeShippingBadgeProps) => {
  const isComplete = progress >= 100;
  const remaining = Math.max(0, threshold - current);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (isComplete) {
    return (
      <motion.div
        initial={animated ? { scale: 0.8, opacity: 0 } : false}
        animate={animated ? { scale: 1, opacity: 1 } : false}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'inline-flex items-center gap-2 rounded-full',
          'bg-gradient-to-r from-green-500 to-emerald-400',
          'text-white font-semibold',
          'shadow-lg shadow-green-500/50',
          'border border-green-400/30',
          sizeClasses[size],
          className
        )}
      >
        <motion.div
          animate={animated ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <Truck className={iconSizes[size]} />
        </motion.div>
        <span>Gratisversand!</span>
        <motion.div
          animate={animated ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Sparkles className={iconSizes[size]} />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={animated ? { scale: 0.9, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : false}
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        'bg-gradient-to-r from-accent/20 to-emerald-400/20',
        'text-text font-medium',
        'border border-accent/30',
        'backdrop-blur-sm',
        sizeClasses[size],
        className
      )}
    >
      <motion.div
        animate={animated ? { x: [0, 2, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Truck className={cn(iconSizes[size], 'text-accent')} />
      </motion.div>
      <div className="flex flex-col">
        <span className="leading-tight">Gratisversand ab {threshold}€</span>
        {remaining > 0 && (
          <span className="text-xs text-muted leading-tight">
            Noch {remaining.toFixed(2)}€
          </span>
        )}
      </div>
      {/* Progress indicator */}
      <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
});

FreeShippingBadge.displayName = 'FreeShippingBadge';

