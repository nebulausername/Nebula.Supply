import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';

// 🎨 ANIMATION SYSTEM - MAXIMIERT & GEIL!
export const AnimationSystem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animationQueue, setAnimationQueue] = useState<Array<() => void>>([]);
  const animationRef = useRef<number>();

  // 🎯 ANIMATION PREFERENCES - GEIL!
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 🎯 ANIMATION QUEUE - GEIL!
  useEffect(() => {
    if (animationQueue.length > 0 && animationsEnabled && !reducedMotion) {
      const animate = () => {
        const nextAnimation = animationQueue.shift();
        if (nextAnimation) {
          nextAnimation();
        }
        if (animationQueue.length > 0) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationQueue, animationsEnabled, reducedMotion]);

  // 🎯 ANIMATION UTILITIES - GEIL!
  const animationUtils = {
    // 🎯 FADE IN - GEIL!
    fadeIn: (element: HTMLElement, duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.opacity = '1';
        return;
      }

      element.style.opacity = '0';
      element.style.transition = `opacity ${duration}ms ease-out`;
      
      requestAnimationFrame(() => {
        element.style.opacity = '1';
      });
    },

    // 🎯 FADE OUT - GEIL!
    fadeOut: (element: HTMLElement, duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.opacity = '0';
        return;
      }

      element.style.transition = `opacity ${duration}ms ease-in`;
      element.style.opacity = '0';
    },

    // 🎯 SLIDE IN - GEIL!
    slideIn: (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'left', duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.transform = 'translate(0, 0)';
        return;
      }

      const transforms = {
        left: 'translateX(-100%)',
        right: 'translateX(100%)',
        up: 'translateY(-100%)',
        down: 'translateY(100%)'
      };

      element.style.transform = transforms[direction];
      element.style.transition = `transform ${duration}ms ease-out`;
      
      requestAnimationFrame(() => {
        element.style.transform = 'translate(0, 0)';
      });
    },

    // 🎯 SLIDE OUT - GEIL!
    slideOut: (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'left', duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        const transforms = {
          left: 'translateX(-100%)',
          right: 'translateX(100%)',
          up: 'translateY(-100%)',
          down: 'translateY(100%)'
        };
        element.style.transform = transforms[direction];
        return;
      }

      const transforms = {
        left: 'translateX(-100%)',
        right: 'translateX(100%)',
        up: 'translateY(-100%)',
        down: 'translateY(100%)'
      };

      element.style.transition = `transform ${duration}ms ease-in`;
      element.style.transform = transforms[direction];
    },

    // 🎯 SCALE IN - GEIL!
    scaleIn: (element: HTMLElement, scale = 1.1, duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.transform = 'scale(1)';
        return;
      }

      element.style.transform = `scale(${scale})`;
      element.style.transition = `transform ${duration}ms ease-out`;
      
      requestAnimationFrame(() => {
        element.style.transform = 'scale(1)';
      });
    },

    // 🎯 SCALE OUT - GEIL!
    scaleOut: (element: HTMLElement, scale = 0.9, duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.transform = `scale(${scale})`;
        return;
      }

      element.style.transition = `transform ${duration}ms ease-in`;
      element.style.transform = `scale(${scale})`;
    },

    // 🎯 ROTATE - GEIL!
    rotate: (element: HTMLElement, degrees = 360, duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.transform = 'rotate(0deg)';
        return;
      }

      element.style.transition = `transform ${duration}ms ease-out`;
      element.style.transform = `rotate(${degrees}deg)`;
    },

    // 🎯 BOUNCE - GEIL!
    bounce: (element: HTMLElement, intensity = 0.2, duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.transform = 'translateY(0)';
        return;
      }

      const bounceHeight = intensity * 20;
      element.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
      element.style.transform = `translateY(-${bounceHeight}px)`;
      
      setTimeout(() => {
        element.style.transform = 'translateY(0)';
      }, duration / 2);
    },

    // 🎯 PULSE - GEIL!
    pulse: (element: HTMLElement, intensity = 0.1, duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.transform = 'scale(1)';
        return;
      }

      const pulseScale = 1 + intensity;
      element.style.transition = `transform ${duration}ms ease-in-out`;
      element.style.transform = `scale(${pulseScale})`;
      
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, duration / 2);
    },

    // 🎯 SHAKE - GEIL!
    shake: (element: HTMLElement, intensity = 10, duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.transform = 'translateX(0)';
        return;
      }

      const shakeDistance = intensity;
      element.style.transition = `transform ${duration}ms ease-in-out`;
      
      let startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
          const shake = Math.sin(progress * Math.PI * 8) * shakeDistance * (1 - progress);
          element.style.transform = `translateX(${shake}px)`;
          requestAnimationFrame(animate);
        } else {
          element.style.transform = 'translateX(0)';
        }
      };
      
      requestAnimationFrame(animate);
    },

    // 🎯 GLOW - GEIL!
    glow: (element: HTMLElement, color = '#fbbf24', intensity = 0.5, duration = 300) => {
      if (!animationsEnabled || reducedMotion) {
        element.style.boxShadow = 'none';
        return;
      }

      const glowSize = intensity * 20;
      element.style.transition = `box-shadow ${duration}ms ease-out`;
      element.style.boxShadow = `0 0 ${glowSize}px ${color}`;
      
      setTimeout(() => {
        element.style.boxShadow = 'none';
      }, duration);
    }
  };

  // 🎯 ANIMATION COMPONENTS - GEIL!
  const AnimationComponents = {
    // 🎯 FADE WRAPPER - GEIL!
    FadeWrapper: ({ children, delay = 0, duration = 300 }: { children: React.ReactNode; delay?: number; duration?: number }) => {
      const [isVisible, setIsVisible] = useState(false);
      const elementRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        const timer = setTimeout(() => {
          setIsVisible(true);
          if (elementRef.current) {
            animationUtils.fadeIn(elementRef.current, duration);
          }
        }, delay);

        return () => clearTimeout(timer);
      }, [delay, duration]);

      return (
        <div
          ref={elementRef}
          className={cn(
            "transition-opacity duration-300",
            isVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {children}
        </div>
      );
    },

    // 🎯 SLIDE WRAPPER - GEIL!
    SlideWrapper: ({ 
      children, 
      direction = 'left', 
      delay = 0, 
      duration = 300 
    }: { 
      children: React.ReactNode; 
      direction?: 'left' | 'right' | 'up' | 'down'; 
      delay?: number; 
      duration?: number; 
    }) => {
      const [isVisible, setIsVisible] = useState(false);
      const elementRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        const timer = setTimeout(() => {
          setIsVisible(true);
          if (elementRef.current) {
            animationUtils.slideIn(elementRef.current, direction, duration);
          }
        }, delay);

        return () => clearTimeout(timer);
      }, [delay, duration, direction]);

      return (
        <div
          ref={elementRef}
          className={cn(
            "transition-transform duration-300",
            isVisible ? "translate-x-0 translate-y-0" : 
            direction === 'left' ? "-translate-x-full" :
            direction === 'right' ? "translate-x-full" :
            direction === 'up' ? "-translate-y-full" :
            "translate-y-full"
          )}
        >
          {children}
        </div>
      );
    },

    // 🎯 SCALE WRAPPER - GEIL!
    ScaleWrapper: ({ 
      children, 
      scale = 1.1, 
      delay = 0, 
      duration = 300 
    }: { 
      children: React.ReactNode; 
      scale?: number; 
      delay?: number; 
      duration?: number; 
    }) => {
      const [isVisible, setIsVisible] = useState(false);
      const elementRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        const timer = setTimeout(() => {
          setIsVisible(true);
          if (elementRef.current) {
            animationUtils.scaleIn(elementRef.current, scale, duration);
          }
        }, delay);

        return () => clearTimeout(timer);
      }, [delay, duration, scale]);

      return (
        <div
          ref={elementRef}
          className={cn(
            "transition-transform duration-300",
            isVisible ? "scale-100" : "scale-110"
          )}
        >
          {children}
        </div>
      );
    }
  };

  return (
    <div className="animation-system">
      {/* 🎯 ANIMATION CONTROLS - GEIL! */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setAnimationsEnabled(!animationsEnabled)}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            animationsEnabled 
              ? "bg-green-500 text-white" 
              : "bg-red-500 text-white"
          )}
        >
          {animationsEnabled ? '🎬 ON' : '⏸️ OFF'}
        </button>
      </div>

      {/* 🎯 ANIMATION STATUS - GEIL! */}
      {reducedMotion && (
        <div className="fixed top-4 left-4 z-50 bg-yellow-500/20 text-yellow-200 px-3 py-2 rounded-lg text-sm">
          Reduced Motion Enabled
        </div>
      )}

      {/* 🎯 CHILDREN - GEIL! */}
      {children}
    </div>
  );
};

// 🎨 ANIMATION HOOKS - GEIL!
export const useAnimation = () => {
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { animationsEnabled, setAnimationsEnabled, reducedMotion };
};

// 🎨 ANIMATION UTILITIES - GEIL!
export const AnimationUtils = {
  // 🎯 EASING FUNCTIONS - GEIL!
  easing: {
    linear: (t: number) => t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    bounce: (t: number) => {
      if (t < 1 / 2.75) return 7.5625 * t * t;
      if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    },
    elastic: (t: number) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
    }
  },

  // 🎯 ANIMATION PRESETS - GEIL!
  presets: {
    fadeIn: { opacity: [0, 1], duration: 300, easing: 'easeOut' },
    fadeOut: { opacity: [1, 0], duration: 300, easing: 'easeIn' },
    slideInLeft: { transform: ['translateX(-100%)', 'translateX(0)'], duration: 300, easing: 'easeOut' },
    slideInRight: { transform: ['translateX(100%)', 'translateX(0)'], duration: 300, easing: 'easeOut' },
    slideInUp: { transform: ['translateY(100%)', 'translateY(0)'], duration: 300, easing: 'easeOut' },
    slideInDown: { transform: ['translateY(-100%)', 'translateY(0)'], duration: 300, easing: 'easeOut' },
    scaleIn: { transform: ['scale(0.8)', 'scale(1)'], duration: 300, easing: 'easeOut' },
    scaleOut: { transform: ['scale(1)', 'scale(0.8)'], duration: 300, easing: 'easeIn' },
    rotateIn: { transform: ['rotate(-180deg)', 'rotate(0deg)'], duration: 300, easing: 'easeOut' },
    bounce: { transform: ['translateY(0)', 'translateY(-20px)', 'translateY(0)'], duration: 600, easing: 'bounce' },
    shake: { transform: ['translateX(0)', 'translateX(-10px)', 'translateX(10px)', 'translateX(-10px)', 'translateX(10px)', 'translateX(0)'], duration: 500, easing: 'easeInOut' }
  }
};

export default AnimationSystem;





