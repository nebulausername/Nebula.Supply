import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  start?: number;
  end: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  enabled?: boolean;
  onComplete?: () => void;
}

export const useCountUp = ({
  duration = 2000,
  start = 0,
  end,
  decimals = 0,
  suffix = '',
  prefix = '',
  enabled = true,
  onComplete
}: UseCountUpOptions) => {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (!enabled || end === start) {
      setCount(end);
      return;
    }

    setIsAnimating(true);
    hasCompletedRef.current = false;
    startTimeRef.current = null;

    const animate = (currentTime: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentCount = start + (end - start) * easeOut;

      setCount(currentCount);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsAnimating(false);
        if (!hasCompletedRef.current && onComplete) {
          hasCompletedRef.current = true;
          onComplete();
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [end, start, duration, enabled, onComplete]);

  const formattedCount = `${prefix}${count.toFixed(decimals)}${suffix}`;

  return { count, formattedCount, isAnimating };
};

