import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  navigationTiming: PerformanceNavigationTiming | null;
}

interface CustomPerformanceMark {
  name: string;
  startTime: number;
  duration: number;
  detail?: any;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    navigationTiming: null,
  };

  private marks: CustomPerformanceMark[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Measure Core Web Vitals
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureFCP();
    this.measureTTFB();

    // Measure navigation timing
    this.measureNavigationTiming();
  }

  private measureLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP measurement not supported:', error);
    }
  }

  private measureFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID measurement not supported:', error);
    }
  }

  private measureCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS measurement not supported:', error);
    }
  }

  private measureFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FCP measurement not supported:', error);
    }
  }

  private measureTTFB() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.metrics.navigationTiming = navigation;
      }
    } catch (error) {
      console.warn('TTFB measurement not supported:', error);
    }
  }

  private measureNavigationTiming() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.navigationTiming = navigation;
      }
    } catch (error) {
      console.warn('Navigation timing not supported:', error);
    }
  }

  mark(name: string, detail?: any) {
    const startTime = performance.now();
    performance.mark(name);
    
    return {
      end: () => {
        performance.mark(`${name}-end`);
        performance.measure(name, name, `${name}-end`);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        
        if (measure) {
          this.marks.push({
            name,
            startTime,
            duration: measure.duration,
            detail
          });
        }
      }
    };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getMarks(): CustomPerformanceMark[] {
    return [...this.marks];
  }

  getPageLoadTimeline(): {
    dns: number;
    tcp: number;
    request: number;
    response: number;
    dom: number;
    load: number;
  } | null {
    if (!this.metrics.navigationTiming) return null;

    const timing = this.metrics.navigationTiming;
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      request: timing.responseStart - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domContentLoadedEventEnd - timing.responseEnd,
      load: timing.loadEventEnd - timing.navigationStart,
    };
  }

  checkPerformanceBudget(): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    const budget = {
      lcp: 2500, // 2.5s
      fid: 100, // 100ms
      cls: 0.1, // 0.1
      fcp: 1800, // 1.8s
      ttfb: 800, // 800ms
    };

    if (this.metrics.lcp !== null && this.metrics.lcp > budget.lcp) {
      violations.push(`LCP: ${this.metrics.lcp.toFixed(0)}ms (budget: ${budget.lcp}ms)`);
    }
    if (this.metrics.fid !== null && this.metrics.fid > budget.fid) {
      violations.push(`FID: ${this.metrics.fid.toFixed(0)}ms (budget: ${budget.fid}ms)`);
    }
    if (this.metrics.cls !== null && this.metrics.cls > budget.cls) {
      violations.push(`CLS: ${this.metrics.cls.toFixed(3)} (budget: ${budget.cls})`);
    }
    if (this.metrics.fcp !== null && this.metrics.fcp > budget.fcp) {
      violations.push(`FCP: ${this.metrics.fcp.toFixed(0)}ms (budget: ${budget.fcp}ms)`);
    }
    if (this.metrics.ttfb !== null && this.metrics.ttfb > budget.ttfb) {
      violations.push(`TTFB: ${this.metrics.ttfb.toFixed(0)}ms (budget: ${budget.ttfb}ms)`);
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for performance monitoring
 * Tracks Core Web Vitals and custom performance marks
 */
export const usePerformanceMonitoring = (enabled: boolean = true) => {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || initializedRef.current) return;

    // Initialize monitoring after a short delay to not interfere with initial load
    const timeoutId = setTimeout(() => {
      performanceMonitor.init();
      initializedRef.current = true;
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (initializedRef.current) {
        performanceMonitor.cleanup();
        initializedRef.current = false;
      }
    };
  }, [enabled]);

  const mark = useCallback((name: string, detail?: any) => {
    return performanceMonitor.mark(name, detail);
  }, []);

  const getMetrics = useCallback(() => {
    return performanceMonitor.getMetrics();
  }, []);

  const getMarks = useCallback(() => {
    return performanceMonitor.getMarks();
  }, []);

  const getPageLoadTimeline = useCallback(() => {
    return performanceMonitor.getPageLoadTimeline();
  }, []);

  const checkPerformanceBudget = useCallback(() => {
    return performanceMonitor.checkPerformanceBudget();
  }, []);

  return {
    mark,
    getMetrics,
    getMarks,
    getPageLoadTimeline,
    checkPerformanceBudget,
  };
};





