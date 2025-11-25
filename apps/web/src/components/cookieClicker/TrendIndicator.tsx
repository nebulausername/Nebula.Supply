import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  trend: 'up' | 'down' | 'neutral';
  value?: number | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

// 📈 Trend Indicator Component
export const TrendIndicator = memo(({
  trend,
  value,
  size = 'md',
  showIcon = true,
  className
}: TrendIndicatorProps) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const colorClasses = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-white/60'
  };

  const bgClasses = {
    up: 'bg-green-500/20',
    down: 'bg-red-500/20',
    neutral: 'bg-white/10'
  };

  const iconSize = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-lg",
        bgClasses[trend],
        sizeClasses[size],
        className
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {showIcon && (
        <>
          {trend === 'up' && <TrendingUp size={iconSize[size]} className={colorClasses[trend]} />}
          {trend === 'down' && <TrendingDown size={iconSize[size]} className={colorClasses[trend]} />}
          {trend === 'neutral' && <Minus size={iconSize[size]} className={colorClasses[trend]} />}
        </>
      )}
      {value !== undefined && (
        <span className={cn("font-bold", colorClasses[trend])}>
          {typeof value === 'number' && value > 0 ? '+' : ''}{value}
        </span>
      )}
    </motion.div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';

