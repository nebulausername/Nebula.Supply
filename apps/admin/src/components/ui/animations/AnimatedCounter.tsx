import React, { useEffect, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  format = (val) => val.toLocaleString('de-DE', { maximumFractionDigits: 0 }),
  duration = 0.5,
  className
}) => {
  const motionValue = useMotionValue(value);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut'
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  useEffect(() => {
    const unsubscribe = motionValue.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [motionValue]);

  return <span className={className}>{format(displayValue)}</span>;
};

