import { useState, useEffect, useCallback } from 'react';

interface AnimationBudget {
  fps: number;
  isLowPerformance: boolean;
  shouldReduceAnimations: boolean;
  animationScale: number;
}

class PerformanceMonitor {
  private fps = 60;
  private frameCount = 0;
  private lastTime = 0;
  private isMonitoring = false;
  private animationFrameId: number | null = null;
  private callbacks: Set<(budget: AnimationBudget) => void> = new Set();

  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.measureFPS();
  }

  stop() {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private measureFPS = () => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameCount++;

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;

      // Notify callbacks
      const budget = this.getAnimationBudget();
      this.callbacks.forEach(callback => callback(budget));
    }

    this.animationFrameId = requestAnimationFrame(this.measureFPS);
  };

  getAnimationBudget(): AnimationBudget {
    const isLowPerformance = this.fps < 30;
    const shouldReduceAnimations = this.fps < 45;
    
    // Calculate animation scale based on performance
    let animationScale = 1;
    if (this.fps < 20) animationScale = 0.3;
    else if (this.fps < 30) animationScale = 0.5;
    else if (this.fps < 45) animationScale = 0.7;
    else if (this.fps < 55) animationScale = 0.9;

    return {
      fps: this.fps,
      isLowPerformance,
      shouldReduceAnimations,
      animationScale
    };
  }

  subscribe(callback: (budget: AnimationBudget) => void) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  getCurrentFPS() {
    return this.fps;
  }
}

const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.start();
}

export const useAnimationBudget = () => {
  const [budget, setBudget] = useState<AnimationBudget>(() => 
    performanceMonitor.getAnimationBudget()
  );

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe(setBudget);
    return unsubscribe;
  }, []);

  return budget;
};

export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

export const useAnimationSettings = () => {
  const budget = useAnimationBudget();
  const prefersReducedMotion = useReducedMotion();

  const shouldAnimate = !prefersReducedMotion && !budget.shouldReduceAnimations;
  const animationDuration = budget.shouldReduceAnimations ? 0.2 : 0.5;
  const particleCount = Math.floor(20 * budget.animationScale);
  const maxConcurrentAnimations = Math.floor(3 * budget.animationScale);

  return {
    shouldAnimate,
    animationDuration,
    particleCount,
    maxConcurrentAnimations,
    animationScale: budget.animationScale,
    fps: budget.fps,
    isLowPerformance: budget.isLowPerformance
  };
};

// Performance-aware animation variants
export const getAnimationVariants = (baseVariants: any, settings: ReturnType<typeof useAnimationSettings>) => {
  if (!settings.shouldAnimate) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 }
    };
  }

  return {
    ...baseVariants,
    transition: {
      ...baseVariants.transition,
      duration: settings.animationDuration
    }
  };
};

// Performance-aware particle system settings
export const getParticleSettings = (settings: ReturnType<typeof useAnimationSettings>) => ({
  maxParticles: settings.particleCount,
  duration: settings.animationDuration * 2,
  enabled: settings.shouldAnimate && settings.particleCount > 0
});

// Auto-disable animations on low performance
export const usePerformanceOptimizedAnimations = () => {
  const settings = useAnimationSettings();
  
  const optimizedVariants = useCallback((baseVariants: any) => {
    return getAnimationVariants(baseVariants, settings);
  }, [settings]);

  const optimizedParticles = useCallback(() => {
    return getParticleSettings(settings);
  }, [settings]);

  return {
    settings,
    optimizedVariants,
    optimizedParticles,
    shouldAnimate: settings.shouldAnimate
  };
};

export { performanceMonitor };



































































































