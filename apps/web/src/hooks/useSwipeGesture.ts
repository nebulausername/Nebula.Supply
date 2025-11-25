import { useRef, useEffect, RefObject } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeGestureOptions {
  onSwipe?: (direction: SwipeDirection) => void;
  threshold?: number; // Minimum distance in pixels to trigger swipe
  velocity?: number; // Minimum velocity to trigger swipe
  preventDefault?: boolean;
}

const defaultOptions: Required<Omit<SwipeGestureOptions, 'onSwipe'>> & { onSwipe: (direction: SwipeDirection) => void } = {
  onSwipe: () => {},
  threshold: 50,
  velocity: 0.3,
  preventDefault: true,
};

export const useSwipeGesture = <T extends HTMLElement>(
  options: SwipeGestureOptions = {}
): RefObject<T> => {
  const ref = useRef<T>(null);
  const startPos = useRef({ x: 0, y: 0, time: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const isTracking = useRef(false);

  const opts = { ...defaultOptions, ...options };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleStart = (clientX: number, clientY: number) => {
      startPos.current = { x: clientX, y: clientY, time: Date.now() };
      currentPos.current = { x: clientX, y: clientY };
      isTracking.current = true;

      if (opts.preventDefault) {
        // Prevent default only if we might swipe
      }
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isTracking.current) return;
      currentPos.current = { x: clientX, y: clientY };
    };

    const handleEnd = () => {
      if (!isTracking.current) return;

      const deltaX = currentPos.current.x - startPos.current.x;
      const deltaY = currentPos.current.y - startPos.current.y;
      const deltaTime = Date.now() - startPos.current.time;
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const velocity = distance / deltaTime; // pixels per ms

      // Check if swipe meets threshold and velocity
      if (distance >= opts.threshold && velocity >= opts.velocity) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Determine primary direction
        if (absX > absY) {
          opts.onSwipe(deltaX > 0 ? 'right' : 'left');
        } else {
          opts.onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }

      isTracking.current = false;
    };

    // Mouse events (for desktop testing)
    const handleMouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY);
      if (opts.preventDefault) {
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    // Touch events (for mobile)
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleStart(touch.clientX, touch.clientY);
        if (opts.preventDefault) {
          e.preventDefault();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      handleEnd();
      if (opts.preventDefault) {
        e.preventDefault();
      }
    };

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('mouseleave', handleEnd);

    element.addEventListener('touchstart', handleTouchStart, { passive: !opts.preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !opts.preventDefault });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleEnd);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      element.removeEventListener('mouseleave', handleEnd);

      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleEnd);
    };
  }, [opts.threshold, opts.velocity, opts.preventDefault]);

  return ref;
};
