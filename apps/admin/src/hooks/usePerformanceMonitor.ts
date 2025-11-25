import { useEffect, useRef, useCallback } from 'react';
import { logger } from '../lib/logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceThreshold {
  name: string;
  threshold: number;
  unit: string;
  severity: 'warning' | 'error';
}

const DEFAULT_THRESHOLDS: PerformanceThreshold[] = [
  { name: 'component_render', threshold: 100, unit: 'ms', severity: 'warning' },
  { name: 'api_request', threshold: 2000, unit: 'ms', severity: 'warning' },
  { name: 'api_request', threshold: 5000, unit: 'ms', severity: 'error' },
  { name: 'image_load', threshold: 3000, unit: 'ms', severity: 'warning' },
  { name: 'image_load', threshold: 10000, unit: 'ms', severity: 'error' },
  { name: 'memory_usage', threshold: 100, unit: 'MB', severity: 'warning' },
  { name: 'memory_usage', threshold: 200, unit: 'MB', severity: 'error' }
];

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private thresholds: PerformanceThreshold[] = DEFAULT_THRESHOLDS;
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    this.setupPerformanceObservers();
    this.setupMemoryMonitoring();
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.recordMetric('page_load', entry.loadEventEnd - entry.loadEventStart, 'ms');
            this.recordMetric('dom_content_loaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart, 'ms');
            this.recordMetric('first_paint', entry.loadEventEnd - entry.navigationStart, 'ms');
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);
    } catch (error) {
      logger.warn('Failed to setup navigation observer:', error);
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('first_contentful_paint', entry.startTime, 'ms');
          }
          if (entry.name === 'largest-contentful-paint') {
            this.recordMetric('largest_contentful_paint', entry.startTime, 'ms');
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', paintObserver);
    } catch (error) {
      logger.warn('Failed to setup paint observer:', error);
    }

    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const duration = entry.responseEnd - entry.requestStart;
            this.recordMetric('resource_load', duration, 'ms', {
              name: entry.name,
              type: entry.initiatorType
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    } catch (error) {
      logger.warn('Failed to setup resource observer:', error);
    }
  }

  private setupMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return;
    }

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        this.recordMetric('memory_usage', usedMB, 'MB');
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  recordMetric(name: string, value: number, unit: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check thresholds
    this.checkThresholds(metric);

    // Log performance data
    logger.logPerformance(name, value, metadata);
  }

  private checkThresholds(metric: PerformanceMetric): void {
    const relevantThresholds = this.thresholds.filter(t => t.name === metric.name);
    
    for (const threshold of relevantThresholds) {
      if (metric.value > threshold.threshold) {
        const message = `Performance ${threshold.severity}: ${metric.name} exceeded threshold (${metric.value}${metric.unit} > ${threshold.threshold}${threshold.unit})`;
        
        if (threshold.severity === 'error') {
          logger.error(message, { metric, threshold });
        } else {
          logger.warn(message, { metric, threshold });
        }
      }
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  getAverageMetric(name: string, timeWindow?: number): number {
    let filteredMetrics = this.metrics.filter(m => m.name === name);
    
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filteredMetrics = filteredMetrics.filter(m => m.timestamp > cutoff);
    }
    
    if (filteredMetrics.length === 0) return 0;
    
    const sum = filteredMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / filteredMetrics.length;
  }

  getSlowestOperations(count: number = 10): PerformanceMetric[] {
    return [...this.metrics]
      .sort((a, b) => b.value - a.value)
      .slice(0, count);
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  addThreshold(threshold: PerformanceThreshold): void {
    this.thresholds.push(threshold);
  }

  removeThreshold(name: string, threshold: number): void {
    this.thresholds = this.thresholds.filter(t => !(t.name === name && t.threshold === threshold));
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const startTimeRef = useRef<number>(0);

  const startTiming = useCallback((name: string) => {
    startTimeRef.current = performance.now();
    return name;
  }, []);

  const endTiming = useCallback((name: string, metadata?: Record<string, any>) => {
    if (startTimeRef.current === 0) return;
    
    const duration = performance.now() - startTimeRef.current;
    performanceMonitor.recordMetric(name, duration, 'ms', metadata);
    startTimeRef.current = 0;
  }, []);

  const measureAsync = useCallback(async <T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration, 'ms', { ...metadata, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration, 'ms', { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }, []);

  const measureSync = useCallback(<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T => {
    const start = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration, 'ms', { ...metadata, success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration, 'ms', { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }, []);

  return {
    startTiming,
    endTiming,
    measureAsync,
    measureSync,
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getAverageMetric: performanceMonitor.getAverageMetric.bind(performanceMonitor),
    getSlowestOperations: performanceMonitor.getSlowestOperations.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor)
  };
};

// Hook for component performance monitoring
export const useComponentPerformance = (componentName: string) => {
  const { startTiming, endTiming } = usePerformanceMonitor();

  useEffect(() => {
    const renderStart = performance.now();
    
    return () => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      performanceMonitor.recordMetric('component_render', renderTime, 'ms', { component: componentName });
    };
  }, [componentName]);

  const measureRender = useCallback((renderFn: () => void) => {
    const name = `${componentName}_render`;
    startTiming(name);
    renderFn();
    endTiming(name);
  }, [componentName, startTiming, endTiming]);

  return { measureRender };
};

// Hook for API performance monitoring
export const useAPIPerformance = () => {
  const { measureAsync } = usePerformanceMonitor();

  const measureAPI = useCallback(async <T>(
    endpoint: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return measureAsync(`api_request_${endpoint}`, operation, { endpoint });
  }, [measureAsync]);

  return { measureAPI };
};

export { performanceMonitor };



