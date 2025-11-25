/**
 * Performance Monitor
 * Tracks bot performance and provides optimization insights
 */

import { logger } from "../logger";

export interface PerformanceMetrics {
  messageCount: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  uptime: number;
  activeUsers: number;
}

class PerformanceMonitor {
  private startTime: number = Date.now();
  private messageCount: number = 0;
  private totalResponseTime: number = 0;
  private errorCount: number = 0;
  private lastMemoryCheck: number = 0;
  private memoryUsage: number = 0;

  /**
   * Track message processing
   */
  trackMessage(responseTime: number, isError: boolean = false) {
    this.messageCount++;
    this.totalResponseTime += responseTime;
    
    if (isError) {
      this.errorCount++;
    }

    // Log slow responses
    if (responseTime > 5000) {
      logger.warn('Slow response detected', { responseTime });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    const uptime = Date.now() - this.startTime;
    const averageResponseTime = this.messageCount > 0 
      ? this.totalResponseTime / this.messageCount 
      : 0;
    const errorRate = this.messageCount > 0 
      ? (this.errorCount / this.messageCount) * 100 
      : 0;

    // Update memory usage every 30 seconds
    if (Date.now() - this.lastMemoryCheck > 30000) {
      this.memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      this.lastMemoryCheck = Date.now();
    }

    return {
      messageCount: this.messageCount,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      memoryUsage: Math.round(this.memoryUsage),
      uptime: Math.floor(uptime / 1000),
      activeUsers: 0 // Would be tracked separately
    };
  }

  /**
   * Get performance insights
   */
  getInsights(): string[] {
    const metrics = this.getMetrics();
    const insights: string[] = [];

    if (metrics.averageResponseTime > 2000) {
      insights.push('⚠️ Langsame Antwortzeiten - prüfe Server-Performance');
    }

    if (metrics.errorRate > 5) {
      insights.push('⚠️ Hohe Fehlerrate - prüfe Logs und Konfiguration');
    }

    if (metrics.memoryUsage > 500) {
      insights.push('⚠️ Hoher Speicherverbrauch - prüfe Memory Leaks');
    }

    if (metrics.messageCount > 1000 && metrics.errorRate < 1) {
      insights.push('✅ Gute Performance - Bot läuft stabil');
    }

    return insights;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.messageCount = 0;
    this.totalResponseTime = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }
}

let performanceMonitor: PerformanceMonitor | null = null;

export const initPerformanceMonitor = () => {
  performanceMonitor = new PerformanceMonitor();
  logger.info('Performance monitor initialized');
};

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    throw new Error('Performance monitor not initialized');
  }
  return performanceMonitor;
};

/**
 * Performance middleware
 */
export const performanceMiddleware = async (ctx: any, next: () => Promise<void>) => {
  const startTime = Date.now();
  
  try {
    await next();
    const responseTime = Date.now() - startTime;
    getPerformanceMonitor().trackMessage(responseTime, false);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    getPerformanceMonitor().trackMessage(responseTime, true);
    throw error;
  }
};


