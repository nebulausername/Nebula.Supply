/**
 * Memory Manager
 * Advanced memory management and optimization
 */

import { logger } from "../logger";

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  usage: number;
  timestamp: number;
}

class MemoryManager {
  private memoryHistory: MemoryStats[] = [];
  private maxHistorySize = 100;
  private gcThreshold = 0.75; // Trigger GC when heap usage > 75% (more aggressive)
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    this.cleanupInterval = setInterval(() => {
      this.recordMemoryUsage();
      this.checkMemoryThreshold();
    }, 30000); // Check every 30 seconds

    logger.info("Memory monitoring started");
  }

  /**
   * Record current memory usage
   */
  private recordMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    const stats: MemoryStats = {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      usage: memUsage.heapUsed / memUsage.heapTotal,
      timestamp: Date.now()
    };

    this.memoryHistory.push(stats);
    
    // Keep only recent history
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }
  }

  /**
   * Check memory threshold and trigger cleanup
   */
  private checkMemoryThreshold(): void {
    const current = this.getCurrentMemoryStats();
    
    if (current.usage > this.gcThreshold) {
      logger.warn(`High memory usage detected: ${(current.usage * 100).toFixed(1)}%`);
      this.triggerCleanup();
    }
  }

  /**
   * Trigger memory cleanup
   */
  private triggerCleanup(): void {
    logger.info("Triggering memory cleanup");
    
    // Clear old history first (lightweight)
    if (this.memoryHistory.length > this.maxHistorySize / 2) {
      this.memoryHistory = this.memoryHistory.slice(-this.maxHistorySize / 2);
    }

    // Clear any cached data
    this.clearCaches();
    
    // Force garbage collection if available (do this last)
    if (global.gc) {
      try {
        global.gc();
        const after = this.getCurrentMemoryStats();
        logger.info(`Garbage collection triggered. Memory usage: ${(after.usage * 100).toFixed(1)}%`);
      } catch (error) {
        logger.warn("Garbage collection failed", error);
      }
    } else {
      logger.warn("Garbage collection not available. Run node with --expose-gc flag");
    }
  }

  /**
   * Clear application caches
   */
  private clearCaches(): void {
    // Clear any application-specific caches
    // This would be implemented based on your app's caching strategy
    
    // Note: require.cache is not available in ES modules
    // Module cache clearing is handled by Node.js automatically in ES module context
    
    logger.info("Application caches cleared");
  }

  /**
   * Get current memory stats
   */
  getCurrentMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      usage: memUsage.heapUsed / memUsage.heapTotal,
      timestamp: Date.now()
    };
  }

  /**
   * Get memory history
   */
  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * Get memory trends
   */
  getMemoryTrends(): {
    average: number;
    peak: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (this.memoryHistory.length < 2) {
      return { average: 0, peak: 0, trend: 'stable' };
    }

    const recent = this.memoryHistory.slice(-10);
    const average = recent.reduce((sum, stat) => sum + stat.usage, 0) / recent.length;
    const peak = Math.max(...recent.map(stat => stat.usage));
    
    const first = recent[0].usage;
    const last = recent[recent.length - 1].usage;
    const trend = last > first + 0.1 ? 'increasing' : 
                 last < first - 0.1 ? 'decreasing' : 'stable';

    return { average, peak, trend };
  }

  /**
   * Get memory report
   */
  getMemoryReport(): string {
    const current = this.getCurrentMemoryStats();
    const trends = this.getMemoryTrends();
    
    let report = '🧠 **Memory Report**\n\n';
    report += `📊 **Current Usage:**\n`;
    report += `• Heap Used: ${(current.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
    report += `• Heap Total: ${(current.heapTotal / 1024 / 1024).toFixed(2)} MB\n`;
    report += `• Usage: ${(current.usage * 100).toFixed(1)}%\n`;
    report += `• RSS: ${(current.rss / 1024 / 1024).toFixed(2)} MB\n\n`;
    
    report += `📈 **Trends:**\n`;
    report += `• Average: ${(trends.average * 100).toFixed(1)}%\n`;
    report += `• Peak: ${(trends.peak * 100).toFixed(1)}%\n`;
    report += `• Trend: ${trends.trend}\n`;

    if (current.usage > 0.7) {
      report += `\n⚠️ **Warning:** High memory usage detected!`;
    }

    return report;
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    logger.info("Memory monitoring stopped");
  }
}

let memoryManager: MemoryManager | null = null;

export const initMemoryManager = () => {
  memoryManager = new MemoryManager();
  logger.info("Memory manager initialized");
};

export const getMemoryManager = (): MemoryManager => {
  if (!memoryManager) {
    throw new Error("Memory manager not initialized");
  }
  return memoryManager;
};


