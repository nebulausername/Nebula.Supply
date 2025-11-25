// 🚀 PERFORMANCE UTILITIES für Cookie Clicker

// 🎯 DEBOUNCE FUNCTION
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 🎯 THROTTLE FUNCTION
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 🎯 REQUEST ANIMATION FRAME THROTTLE
export const rafThrottle = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let rafId: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func(...args);
        rafId = null;
      });
    }
  };
};

// 🎯 PERFORMANCE MONITORING
export const measurePerformance = (label: string, fn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
};

// 🎯 MEMORY CLEANUP
export const cleanupMemory = () => {
  if (typeof window !== 'undefined' && 'gc' in window) {
    // Force garbage collection if available (Chrome DevTools)
    (window as any).gc();
  }
};

// 🎯 CHECK PERFORMANCE MODE
export const shouldReduceAnimations = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return true;
  
  // Check device capabilities
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  
  return isMobile && Boolean(isLowEndDevice);
};

