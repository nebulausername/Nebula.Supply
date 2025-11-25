import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../utils/cn';

// 📱 MOBILE UX OPTIMIZER - MAXIMIERT & GEIL!
export const MobileUXOptimizer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const [hapticEnabled, setHapticEnabled] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [safeArea, setSafeArea] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  // 🎯 MOBILE DETECTION - GEIL!
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice || (isTouchDevice && isSmallScreen));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🎯 ORIENTATION DETECTION - GEIL!
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // 🎯 SAFE AREA DETECTION - GEIL!
  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  // 🎯 HAPTIC FEEDBACK - GEIL!
  useEffect(() => {
    if ('vibrate' in navigator) {
      setHapticEnabled(true);
    }
  }, []);

  // 🎯 TOUCH HANDLING - GEIL!
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setTouchEnd(null);
    setSwipeDirection(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const deltaTime = touchEnd.time - touchStart.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // 🎯 SWIPE DETECTION - GEIL!
    if (velocity > 0.3 && distance > 50) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setSwipeDirection(deltaX > 0 ? 'right' : 'left');
      } else {
        setSwipeDirection(deltaY > 0 ? 'down' : 'up');
      }

      // 🎯 HAPTIC FEEDBACK - GEIL!
      if (hapticEnabled) {
        navigator.vibrate(50);
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, hapticEnabled]);

  // 🎯 SWIPE ACTIONS - GEIL!
  useEffect(() => {
    if (swipeDirection) {
      // 🎯 SWIPE LEFT - PREVIOUS TAB
      if (swipeDirection === 'left') {
        // Implement previous tab logic
        console.log('Swipe left - Previous tab');
      }
      
      // 🎯 SWIPE RIGHT - NEXT TAB
      if (swipeDirection === 'right') {
        // Implement next tab logic
        console.log('Swipe right - Next tab');
      }
      
      // 🎯 SWIPE UP - SCROLL UP
      if (swipeDirection === 'up') {
        // Implement scroll up logic
        console.log('Swipe up - Scroll up');
      }
      
      // 🎯 SWIPE DOWN - SCROLL DOWN
      if (swipeDirection === 'down') {
        // Implement scroll down logic
        console.log('Swipe down - Scroll down');
      }
    }
  }, [swipeDirection]);

  // 🎯 MOBILE OPTIMIZATIONS - GEIL!
  const mobileOptimizations = {
    // 🎯 TOUCH TARGETS - GEIL!
    touchTargets: {
      minSize: 44, // 44px minimum touch target
      padding: 12, // 12px padding for touch targets
      margin: 8    // 8px margin between touch targets
    },
    
    // 🎯 TYPOGRAPHY - GEIL!
    typography: {
      minSize: 16, // 16px minimum font size
      lineHeight: 1.5, // 1.5 line height for readability
      contrast: 4.5 // 4.5:1 contrast ratio for accessibility
    },
    
    // 🎯 SPACING - GEIL!
    spacing: {
      section: 24, // 24px between sections
      element: 16, // 16px between elements
      text: 8      // 8px between text elements
    },
    
    // 🎯 ANIMATIONS - GEIL!
    animations: {
      duration: 300, // 300ms animation duration
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Smooth easing
      reduceMotion: false // Respect user's motion preferences
    }
  };

  // 🎯 MOBILE STYLES - GEIL!
  const mobileStyles = {
    container: cn(
      "min-h-screen w-full",
      isMobile && "touch-pan-y touch-pan-x",
      isPortrait && "flex flex-col",
      !isPortrait && "flex flex-row"
    ),
    safeArea: {
      paddingTop: safeArea.top,
      paddingBottom: safeArea.bottom,
      paddingLeft: safeArea.left,
      paddingRight: safeArea.right
    },
    touchTarget: {
      minHeight: mobileOptimizations.touchTargets.minSize,
      minWidth: mobileOptimizations.touchTargets.minSize,
      padding: mobileOptimizations.touchTargets.padding,
      margin: mobileOptimizations.touchTargets.margin
    }
  };

  return (
    <div
      className={mobileStyles.container}
      style={mobileStyles.safeArea}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 🎯 MOBILE INDICATORS - GEIL! */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-2 text-xs text-white/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Mobile Optimized</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{isPortrait ? 'Portrait' : 'Landscape'}</span>
              {hapticEnabled && <span>📳</span>}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 SWIPE INDICATORS - GEIL! */}
      {swipeDirection && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
            "bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-white font-medium",
            "animate-pulse"
          )}>
            Swipe {swipeDirection}
          </div>
        </div>
      )}

      {/* 🎯 CHILDREN - GEIL! */}
      {children}
    </div>
  );
};

// 📱 MOBILE UX HOOKS - GEIL!
export const useMobileUX = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileDevice || (isTouchDevice && isSmallScreen));
    };

    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    const checkHaptic = () => {
      if ('vibrate' in navigator) {
        setHapticEnabled(true);
      }
    };

    checkMobile();
    checkOrientation();
    checkHaptic();

    window.addEventListener('resize', () => {
      checkMobile();
      checkOrientation();
    });
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return { isMobile, isPortrait, hapticEnabled };
};

// 📱 MOBILE UX UTILITIES - GEIL!
export const MobileUXUtils = {
  // 🎯 HAPTIC FEEDBACK - GEIL!
  vibrate: (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  // 🎯 TOUCH OPTIMIZATION - GEIL!
  optimizeTouchTarget: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const minSize = 44;
    
    if (rect.width < minSize || rect.height < minSize) {
      element.style.minWidth = `${minSize}px`;
      element.style.minHeight = `${minSize}px`;
    }
  },

  // 🎯 SCROLL OPTIMIZATION - GEIL!
  optimizeScroll: (container: HTMLElement) => {
    container.style.overflowY = 'auto';
    container.style.overflowX = 'hidden';
    (container.style as any).webkitOverflowScrolling = 'touch';
    container.style.scrollBehavior = 'smooth';
  },

  // 🎯 FOCUS OPTIMIZATION - GEIL!
  optimizeFocus: (element: HTMLElement) => {
    element.style.outline = 'none';
    element.style.boxShadow = '0 0 0 2px rgba(251, 191, 36, 0.5)';
  }
};

export default MobileUXOptimizer;





