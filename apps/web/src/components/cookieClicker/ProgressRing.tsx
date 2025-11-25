import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

// 🎯 Circular Progress Ring Component
export const ProgressRing = memo(({
  progress,
  size = 80,
  strokeWidth = 8,
  color = '#0BF7BC',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  animated = true,
  showLabel = true,
  label,
  className
}: ProgressRingProps) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayProgress / 100) * circumference;

  useEffect(() => {
    if (animated) {
      const duration = 1000;
      const steps = 60;
      const increment = progress / steps;
      let currentStep = 0;
      
      const timer = setInterval(() => {
        currentStep++;
        setDisplayProgress(prev => {
          const newVal = prev + increment;
          if (currentStep >= steps) return progress;
          return Math.min(progress, newVal);
        });
        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayProgress(progress);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: animated ? 1 : 0, ease: "easeOut" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {label ? (
              <div className="text-xs text-white/60">{label}</div>
            ) : null}
            <div className="text-sm font-bold text-white">
              {Math.round(displayProgress)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ProgressRing.displayName = 'ProgressRing';

