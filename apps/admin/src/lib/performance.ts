import { useEffect, useRef } from 'react';

// Performance Monitoring Utilities

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  websocketLatency: number;
  timestamp: number;
  componentName?: string;
  operation?: string;
  userAction?: string;
}

export interface PerformanceSummary {
  averageRenderTime: number;
  averageMemoryUsage: number;
  averageApiResponseTime: number;
  totalMetrics: number;
  slowestComponent: string;
  memoryTrend: 'increasing' | 'stable' | 'decreasing';
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;

  // Measure component render time
  measureRenderTime(componentName: string, startTime: number): number {
    const renderTime = performance.now() - startTime;

    // Log slow renders with more detailed warnings
    if (renderTime > 50) { // More than 50ms is considered slow
      console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      if (renderTime > 100) {
        console.error(`🚨 Very slow render in ${componentName}: ${renderTime.toFixed(2)}ms - Consider optimization!`);
      }
    }

    return renderTime;
  }

  // Measure memory usage
  getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  // Measure API response time
  async measureApiCall<T>(apiCall: () => Promise<T>): Promise<{ result: T; responseTime: number }> {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const responseTime = performance.now() - startTime;

      // Log slow API calls
      if (responseTime > 1000) { // More than 1 second
        console.warn(`Slow API call detected: ${responseTime.toFixed(2)}ms`);
      }

      return { result, responseTime };
    } catch (error) {
      const responseTime = performance.now() - startTime;
      console.error(`API call failed after ${responseTime.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  // Measure WebSocket latency
  measureWebSocketLatency(startTime: number): number {
    return performance.now() - startTime;
  }

  // Record metrics
  recordMetrics(metrics: Partial<PerformanceMetrics>) {
    const fullMetrics: PerformanceMetrics = {
      renderTime: metrics.renderTime || 0,
      memoryUsage: metrics.memoryUsage || this.getMemoryUsage(),
      apiResponseTime: metrics.apiResponseTime || 0,
      websocketLatency: metrics.websocketLatency || 0,
      timestamp: Date.now(),
      componentName: metrics.componentName,
      operation: metrics.operation,
      userAction: metrics.userAction,
    };

    this.metrics.push(fullMetrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Auto-warn on performance issues
    if (fullMetrics.renderTime > 100 && fullMetrics.componentName) {
      console.warn(`Performance Warning: ${fullMetrics.componentName} rendered in ${fullMetrics.renderTime.toFixed(2)}ms`);
    }
  }

  // Record user action with performance tracking
  recordUserAction(action: string, componentName?: string, duration?: number) {
    this.recordMetrics({
      userAction: action,
      componentName,
      renderTime: duration || 0,
    });
  }

  // Get performance summary
  getPerformanceSummary(): PerformanceSummary {
    if (this.metrics.length === 0) {
      return {
        averageRenderTime: 0,
        averageMemoryUsage: 0,
        averageApiResponseTime: 0,
        totalMetrics: 0,
        slowestComponent: 'none',
        memoryTrend: 'stable',
      };
    }

    const recentMetrics = this.metrics.slice(-20); // Last 20 measurements

    // Calculate averages
    const averageRenderTime = recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length;
    const averageMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    const averageApiResponseTime = recentMetrics.reduce((sum, m) => sum + m.apiResponseTime, 0) / recentMetrics.length;

    // Find slowest component
    const slowestComponent = recentMetrics.reduce((slowest, current) => {
      return current.renderTime > slowest.renderTime ? current : slowest;
    }, recentMetrics[0]);

    // Calculate memory trend
    const firstHalf = recentMetrics.slice(0, 10);
    const secondHalf = recentMetrics.slice(10);
    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.memoryUsage, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.memoryUsage, 0) / secondHalf.length;
    const memoryTrend = secondHalfAvg > firstHalfAvg * 1.1 ? 'increasing' :
                       firstHalfAvg > secondHalfAvg * 1.1 ? 'decreasing' : 'stable';

    return {
      averageRenderTime,
      averageMemoryUsage,
      averageApiResponseTime,
      totalMetrics: this.metrics.length,
      slowestComponent: slowestComponent.componentName || 'unknown',
      memoryTrend,
    };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component performance
export function usePerformanceMonitoring(componentName: string) {
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const renderTime = performanceMonitor.measureRenderTime(componentName, startTimeRef.current);
    performanceMonitor.recordMetrics({ renderTime });

    // Reset start time for next render
    startTimeRef.current = performance.now();
  });

  return {
    recordApiCall: <T>(apiCall: () => Promise<T>) =>
      performanceMonitor.measureApiCall(apiCall),
    recordWebSocketLatency: (startTime: number) =>
      performanceMonitor.measureWebSocketLatency(startTime),
    getSummary: () => performanceMonitor.getPerformanceSummary(),
  };
}

// Helper to measure function execution time
export function measureExecutionTime<T>(
  fn: () => T,
  label?: string
): { result: T; executionTime: number } {
  const startTime = performance.now();
  const result = fn();
  const executionTime = performance.now() - startTime;

  if (label) {
    console.log(`${label} took ${executionTime.toFixed(2)}ms`);
  }

  return { result, executionTime };
}

// Helper to measure async function execution time
export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; executionTime: number }> {
  const startTime = performance.now();
  const result = await fn();
  const executionTime = performance.now() - startTime;

  if (label) {
    console.log(`${label} took ${executionTime.toFixed(2)}ms`);
  }

  return { result, executionTime };
}
