import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
}

export const LoadingSpinner = memo(({
  size = 'md',
  color = '#0BF7BC',
  className = '',
  variant = 'spinner'
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2
            }}
            style={{
              width: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px',
              height: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px',
              backgroundColor: color
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn('rounded-full', sizeClasses[size], className)}
        style={{ backgroundColor: color }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    );
  }

  return (
    <motion.div
      className={cn('border-2 border-transparent rounded-full', sizeClasses[size], className)}
      style={{
        borderTopColor: color,
        borderRightColor: color
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

