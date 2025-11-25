import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/cookieFormatters';
import { TrendIndicator } from './TrendIndicator';

interface AnimatedStatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'red';
  sparkline?: number[];
  tooltip?: string;
  className?: string;
}

// 📊 Animated Stat Card Component
export const AnimatedStatCard = memo(({
  icon: Icon,
  label,
  value,
  previousValue,
  trend,
  color = 'blue',
  sparkline,
  tooltip,
  className
}: AnimatedStatCardProps) => {
  const [displayValue, setDisplayValue] = useState(typeof value === 'number' ? 0 : value);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        setDisplayValue(prev => {
          const newVal = typeof prev === 'number' ? prev + increment : increment;
          if (currentStep >= steps) return value;
          return Math.min(value, newVal);
        });
        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayValue(value);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  // Calculate trend if not provided
  const calculatedTrend = trend || (previousValue !== undefined && typeof value === 'number'
    ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
    : 'neutral');

  const trendValue = previousValue !== undefined && typeof value === 'number'
    ? Math.abs(((value - previousValue) / previousValue) * 100)
    : undefined;

  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400'
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm p-4",
        colorClasses[color],
        className
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.2 }}
      title={tooltip}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          `bg-${color}-500/20`
        )}>
          <Icon className={cn("w-5 h-5", `text-${color}-400`)} />
        </div>
        {calculatedTrend !== 'neutral' && (
          <TrendIndicator
            trend={calculatedTrend}
            value={trendValue ? `${trendValue.toFixed(1)}%` : undefined}
            size="sm"
          />
        )}
      </div>
      
      <div className="text-2xl font-bold text-white mb-1">
        {typeof displayValue === 'number' ? formatNumber(displayValue) : displayValue}
      </div>
      <div className="text-sm text-white/60">{label}</div>

      {/* Sparkline */}
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 h-8 w-full relative">
          <svg width="100%" height="100%" className="absolute inset-0">
            <motion.polyline
              points={sparkline.map((val, i) => {
                const x = (i / (sparkline.length - 1)) * 100;
                const y = 100 - ((val / Math.max(...sparkline)) * 100);
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke={`var(--color-${color}-400)`}
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
});

AnimatedStatCard.displayName = 'AnimatedStatCard';

