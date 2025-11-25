import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

export const useIntersectionObserver = <T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>, boolean] => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
    enabled = true
  } = options;

  const elementRef = useRef<T>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!enabled || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        if (isIntersecting && !hasTriggered.current) {
          setIsIntersecting(true);
          if (triggerOnce) {
            hasTriggered.current = true;
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsIntersecting(isIntersecting);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, enabled]);

  return [elementRef, isIntersecting];
};

