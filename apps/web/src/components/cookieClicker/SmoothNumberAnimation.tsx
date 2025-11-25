import { useEffect, useState, useRef, memo } from 'react';
import { useSpring, animated } from '@react-spring/web';

interface SmoothNumberAnimationProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

// 🚀 Smooth Number Animation - Count-Up-Effekt für Cookie-Zahlen
export const SmoothNumberAnimation = memo(({
  value,
  duration = 500,
  format = (val) => Math.floor(val).toLocaleString(),
  className = ''
}: SmoothNumberAnimationProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;
    const difference = endValue - startValue;
    
    if (difference === 0) return;

    const startTime = performance.now();
    previousValueRef.current = value;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 🎯 Easing function für smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (difference * easeOutCubic);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue); // Ensure final value
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {format(displayValue)}
    </span>
  );
});

SmoothNumberAnimation.displayName = 'SmoothNumberAnimation';

