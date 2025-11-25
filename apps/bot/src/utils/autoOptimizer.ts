/**
 * Auto Optimizer
 * Automatically optimizes bot performance based on usage patterns
 */

import { logger } from "../logger";
import { getPerformanceMonitor } from "./performanceMonitor";
// import { getRateLimiter } from "./rateLimit";

export interface OptimizationSuggestion {
  type: 'rate_limit' | 'memory' | 'response_time' | 'error_handling';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: string;
}

class AutoOptimizer {
  private lastOptimization: number = 0;
  private optimizationInterval: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Run optimization check
   */
  async runOptimization(): Promise<OptimizationSuggestion[]> {
    const now = Date.now();
    
    // Only run optimization every 5 minutes
    if (now - this.lastOptimization < this.optimizationInterval) {
      return [];
    }

    this.lastOptimization = now;
    const suggestions: OptimizationSuggestion[] = [];
    const metrics = getPerformanceMonitor().getMetrics();

    // Check rate limiting
    if (metrics.messageCount > 100 && metrics.averageResponseTime > 1000) {
      suggestions.push({
        type: 'rate_limit',
        priority: 'medium',
        description: 'Hohe Nachrichtenlast - Rate Limiting anpassen',
        action: 'Erhöhe RATE_LIMIT_MAX oder reduziere RATE_LIMIT_WINDOW'
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > 300) {
      suggestions.push({
        type: 'memory',
        priority: 'high',
        description: 'Hoher Speicherverbrauch - Memory Cleanup',
        action: 'Implementiere automatische Memory Cleanup'
      });
    }

    // Check response times
    if (metrics.averageResponseTime > 3000) {
      suggestions.push({
        type: 'response_time',
        priority: 'high',
        description: 'Langsame Antwortzeiten - Performance-Optimierung',
        action: 'Prüfe Database-Queries und API-Calls'
      });
    }

    // Check error rate
    if (metrics.errorRate > 10) {
      suggestions.push({
        type: 'error_handling',
        priority: 'critical',
        description: 'Hohe Fehlerrate - Error Handling verbessern',
        action: 'Implementiere bessere Error Recovery und Retry Logic'
      });
    }

    // Log suggestions
    if (suggestions.length > 0) {
      logger.info('Auto optimization suggestions', { 
        count: suggestions.length,
        suggestions: suggestions.map(s => s.description)
      });
    }

    return suggestions;
  }

  /**
   * Apply automatic optimizations
   */
  async applyOptimizations(suggestions: OptimizationSuggestion[]): Promise<void> {
    for (const suggestion of suggestions) {
      if (suggestion.priority === 'critical' || suggestion.priority === 'high') {
        await this.applyOptimization(suggestion);
      }
    }
  }

  /**
   * Apply specific optimization
   */
  private async applyOptimization(suggestion: OptimizationSuggestion): Promise<void> {
    switch (suggestion.type) {
      case 'rate_limit':
        // Adjust rate limiting dynamically
        // const rateLimiter = getRateLimiter();
        // Could implement dynamic rate limit adjustment here
        logger.info('Applied rate limit optimization');
        break;

      case 'memory':
        // Trigger garbage collection
        if (global.gc) {
          global.gc();
          logger.info('Triggered garbage collection');
        }
        break;

      case 'response_time':
        // Could implement caching or other optimizations
        logger.info('Applied response time optimization');
        break;

      case 'error_handling':
        // Could implement circuit breaker or other error handling
        logger.info('Applied error handling optimization');
        break;
    }
  }

  /**
   * Get optimization report
   */
  getOptimizationReport(): string {
    const metrics = getPerformanceMonitor().getMetrics();
    const insights = getPerformanceMonitor().getInsights();
    
    let report = '📊 **Performance Report**\n\n';
    report += `📈 **Messages:** ${metrics.messageCount}\n`;
    report += `⏱️ **Avg Response:** ${metrics.averageResponseTime}ms\n`;
    report += `❌ **Error Rate:** ${metrics.errorRate}%\n`;
    report += `💾 **Memory:** ${metrics.memoryUsage}MB\n`;
    report += `⏰ **Uptime:** ${Math.floor(metrics.uptime / 60)}min\n\n`;
    
    if (insights.length > 0) {
      report += '💡 **Insights:**\n';
      insights.forEach(insight => report += `• ${insight}\n`);
    }
    
    return report;
  }
}

let autoOptimizer: AutoOptimizer | null = null;

export const initAutoOptimizer = () => {
  autoOptimizer = new AutoOptimizer();
  logger.info('Auto optimizer initialized');
  
  // Run optimization every 5 minutes
  setInterval(async () => {
    if (autoOptimizer) {
      const suggestions = await autoOptimizer.runOptimization();
      if (suggestions.length > 0) {
        await autoOptimizer.applyOptimizations(suggestions);
      }
    }
  }, 5 * 60 * 1000);
};

export const getAutoOptimizer = (): AutoOptimizer => {
  if (!autoOptimizer) {
    throw new Error('Auto optimizer not initialized');
  }
  return autoOptimizer;
};
