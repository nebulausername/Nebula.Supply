import { Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface VipBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  animated?: boolean;
}

export const VipBadge = ({ 
  size = 'md', 
  showLabel = false,
  className,
  animated = true 
}: VipBadgeProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const crownComponent = (
    <Crown 
      className={cn(
        'text-yellow-400 fill-yellow-400',
        sizeClasses[size]
      )}
      strokeWidth={2}
    />
  );

  if (animated) {
    return (
      <motion.div
        className={cn('flex items-center gap-2', className)}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: 'spring', 
          stiffness: 200, 
          damping: 15 
        }}
        whileHover={{ scale: 1.1 }}
      >
        {crownComponent}
        {showLabel && (
          <span className={cn(
            'font-bold text-yellow-400',
            textSizes[size]
          )}>
            VIP
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {crownComponent}
      {showLabel && (
        <span className={cn(
          'font-bold text-yellow-400',
          textSizes[size]
        )}>
          VIP
        </span>
      )}
    </div>
  );
};

