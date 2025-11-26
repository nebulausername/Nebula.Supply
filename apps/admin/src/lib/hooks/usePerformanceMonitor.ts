import { useEffect, useRef, useCallback } from 'react';
import { logger } from '../logger';
import { performanceMonitor } from '../performance';

interface PerformanceMetrics {
  componentName: string;
  operation: string;
  duration: number;
  timestamp: number;
}

export function usePerformanceMonitor(componentName: string) {
  const startTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);

  const startTiming = useCallback((operation: string = 'render') => {
    startTimeRef.current = performance.now();
    renderCountRef.current += 1;
  }, []);

  const endTiming = useCallback((operation: string = 'render') => {
    if (startTimeRef.current === 0) return;

    const duration = performance.now() - startTimeRef.current;
    
    // Record metrics
    performanceMonitor.recordMetrics({
      renderTime: duration,
      componentName,
      operation,
    });

    // Log performance warnings
    if (duration > 100) {
      logger.logPerformance(`${componentName}.${operation}`, duration, {
        renderCount: renderCountRef.current,
        componentName,
        operation,
      });
    }

    startTimeRef.current = 0;
  }, [componentName]);

  const measureAsync = useCallback(async <T>(
    operation: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await asyncFn();
      const duration = performance.now() - start;
      
      logger.logPerformance(`${componentName}.${operation}`, duration, {
        componentName,
        operation,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      logger.logPerformance(`${componentName}.${operation}`, duration, {
        componentName,
        operation,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }, [componentName]);

  // Auto-timing for render cycles
  useEffect(() => {
    startTiming('render');
    return () => endTiming('render');
  });

  return {
    startTiming,
    endTiming,
    measureAsync,
    renderCount: renderCountRef.current,
  };
}























































































