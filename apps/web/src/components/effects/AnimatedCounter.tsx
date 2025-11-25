import { useState, useEffect, useMemo, memo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPulse?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const AnimatedCounter = memo(({
  end,
  duration = 2000,
  prefix = '',
  suffix = '',
  color = '#0BF7BC',
  size = 'lg',
  showPulse = false,
  onComplete,
  className = ''
}: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousEnd, setPreviousEnd] = useState(end);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  // Spring animation for smooth counting
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    mass: 1
  });

  // Transform spring value to count
  const displayCount = useTransform(spring, (value) => Math.floor(value));

  // Color pulse animation
  const pulseColor = useTransform(spring, (value) => {
    const progress = value / end;
    if (progress > 0.8) return '#F59E0B'; // Orange when near end
    if (progress > 0.5) return '#10B981'; // Green when halfway
    return color; // Default color
  });

  useEffect(() => {
    if (end !== previousEnd) {
      setIsAnimating(true);
      setPreviousEnd(end);
      
      // Animate to new value
      spring.set(end);
      
      // Handle completion
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [end, previousEnd, spring, duration, onComplete]);

  // Format number with locale
  const formatNumber = useMemo(() => {
    return (num: number) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toLocaleString();
    };
  }, []);

  return (
    <motion.div
      className={`relative ${className}`}
      animate={showPulse && isAnimating ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 0.5,
        repeat: isAnimating ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      <motion.span
        className={`font-bold ${sizeClasses[size]} bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent`}
        style={{
          color: isAnimating ? pulseColor : undefined
        }}
      >
        {prefix}
        <motion.span
          key={end} // Force re-render when end changes
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {formatNumber(displayCount.get())}
        </motion.span>
        {suffix}
      </motion.span>

      {/* Pulse effect overlay */}
      {showPulse && isAnimating && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          animate={{
            background: [
              `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
              `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
              `radial-gradient(circle, ${color}20 0%, transparent 70%)`
            ]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
});

AnimatedCounter.displayName = 'AnimatedCounter';

// Specialized counter for statistics
export const StatsCounter = memo(({
  value,
  label,
  color = '#0BF7BC',
  showTrend = false,
  trend = '+0',
  className = ''
}: {
  value: number | string;
  label: string;
  color?: string;
  showTrend?: boolean;
  trend?: string;
  className?: string;
}) => {
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.-]/g, '')) 
    : value;

  const hasPercentSuffix = typeof value === 'string' && value.includes('%');
  const suffix = hasPercentSuffix ? '%' : '';

  return (
    <div className={`text-center ${className}`}>
      <AnimatedCounter
        end={numericValue}
        color={color}
        suffix={suffix}
        showPulse={true}
        size="lg"
      />
      <p className="text-sm text-muted font-medium uppercase tracking-wide mt-2">
        {label}
      </p>
      {showTrend && trend && (
        <motion.div
          className="flex items-center justify-center gap-1 mt-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.span
            className="text-green-400 text-sm font-bold"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ↗
          </motion.span>
          <span className="text-green-400 text-sm font-bold">
            {trend}
          </span>
        </motion.div>
      )}
    </div>
  );
});

StatsCounter.displayName = 'StatsCounter';

// Counter with digit-by-digit animation for large numbers
export const DigitCounter = memo(({
  end,
  prefix = '',
  suffix = '',
  color = '#0BF7BC',
  className = ''
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  color?: string;
  className?: string;
}) => {
  const [digits, setDigits] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const endStr = end.toString();
    const targetDigits = endStr.split('').map(Number);
    
    // Animate each digit
    const animateDigit = (index: number, target: number) => {
      const timer = setTimeout(() => {
        setDigits(prev => {
          const newDigits = [...prev];
          newDigits[index] = target;
          return newDigits;
        });
      }, index * 100); // Stagger animation
      
      return timer;
    };

    const timers: NodeJS.Timeout[] = [];
    targetDigits.forEach((digit, index) => {
      timers.push(animateDigit(index, digit));
    });

    const completeTimer = setTimeout(() => {
      setIsAnimating(false);
    }, targetDigits.length * 100 + 500);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [end]);

  return (
    <motion.div
      className={`flex items-center ${className}`}
      animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <span className="text-white font-bold text-4xl">
        {prefix}
        {digits.map((digit, index) => (
          <motion.span
            key={index}
            className="inline-block"
            animate={{ 
              color: isAnimating ? [color, '#ffffff'] : color,
              scale: isAnimating ? [1, 1.2, 1] : 1
            }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.1
            }}
          >
            {digit}
          </motion.span>
        ))}
        {suffix}
      </span>
    </motion.div>
  );
});

DigitCounter.displayName = 'DigitCounter';



































































































