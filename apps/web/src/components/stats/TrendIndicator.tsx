import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  previousValue?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TrendIndicator = memo(({
  value,
  previousValue,
  showIcon = true,
  size = 'md',
  className = ''
}: TrendIndicatorProps) => {
  if (previousValue === undefined) return null;

  const change = value - previousValue;
  const percentageChange = previousValue !== 0 
    ? ((change / previousValue) * 100).toFixed(1)
    : '0.0';

  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-1 ${className}`}
    >
      {showIcon && (
        <motion.div
          animate={{
            rotate: isPositive ? [0, 5, -5, 0] : isNegative ? [0, -5, 5, 0] : 0
          }}
          transition={{ duration: 0.5 }}
        >
          {isPositive && <TrendingUp className={`${iconSizes[size]} text-green-400`} />}
          {isNegative && <TrendingDown className={`${iconSizes[size]} text-red-400`} />}
          {isNeutral && <Minus className={`${iconSizes[size]} text-muted`} />}
        </motion.div>
      )}
      <span
        className={`${sizeClasses[size]} font-bold ${
          isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-muted'
        }`}
      >
        {isPositive ? '+' : ''}{change} ({isPositive ? '+' : ''}{percentageChange}%)
      </span>
    </motion.div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';

