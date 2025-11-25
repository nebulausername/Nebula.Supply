import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface EnhancedProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showLabel?: boolean;
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}

// 🎯 Enhanced Progress Bar mit Glow-Effekten
export const EnhancedProgressBar = memo(({
  progress,
  label,
  showLabel = true,
  className,
  color = 'primary',
  animated = true
}: EnhancedProgressBarProps) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const colorClasses = {
    primary: 'from-[#0BF7BC] to-[#61F4F4]',
    secondary: 'from-[#8B5CF6] to-[#A855F7]',
    success: 'from-[#10B981] to-[#34D399]',
    warning: 'from-[#F59E0B] to-[#FBBF24]',
    danger: 'from-[#EF4444] to-[#F87171]'
  };

  const glowColors = {
    primary: 'rgba(11, 247, 188, 0.5)',
    secondary: 'rgba(139, 92, 246, 0.5)',
    success: 'rgba(16, 185, 129, 0.5)',
    warning: 'rgba(245, 158, 11, 0.5)',
    danger: 'rgba(239, 68, 68, 0.5)'
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && label && (
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-white/70">{label}</span>
          <span className="text-white font-semibold">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          className={cn(
            'h-full rounded-full bg-gradient-to-r',
            colorClasses[color]
          )}
          initial={animated ? { width: 0 } : { width: `${clampedProgress}%` }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: animated ? 0.5 : 0, ease: 'easeOut' }}
          style={{
            boxShadow: `0 0 10px ${glowColors[color]}`,
          }}
        >
          {animated && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
});

EnhancedProgressBar.displayName = 'EnhancedProgressBar';

