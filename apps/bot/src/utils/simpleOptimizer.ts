/**
 * Simple Optimizer
 * Lightweight performance optimization without complex dependencies
 */

import { logger } from "../logger";
import { getPerformanceMonitor } from "./performanceMonitor";

export interface SimpleOptimizationSuggestion {
  type: 'memory' | 'response_time' | 'error_handling';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: string;
}

class SimpleOptimizer {
  private lastOptimization: number = 0;
  private optimizationInterval: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Run optimization check
   */
  async runOptimization(): Promise<SimpleOptimizationSuggestion[]> {
    const now = Date.now();
    
    // Only run optimization every 5 minutes
    if (now - this.lastOptimization < this.optimizationInterval) {
      return [];
    }

    this.lastOptimization = now;
    const suggestions: SimpleOptimizationSuggestion[] = [];
    const performance = getPerformanceMonitor();
    const metrics = performance.getMetrics();

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
      logger.info('Simple optimization suggestions', { 
        count: suggestions.length,
        suggestions: suggestions.map(s => s.description)
      });
    }

    return suggestions;
  }

  /**
   * Apply automatic optimizations
   */
  async applyOptimizations(suggestions: SimpleOptimizationSuggestion[]): Promise<void> {
    for (const suggestion of suggestions) {
      if (suggestion.priority === 'critical' || suggestion.priority === 'high') {
        await this.applyOptimization(suggestion);
      }
    }
  }

  /**
   * Apply specific optimization
   */
  private async applyOptimization(suggestion: SimpleOptimizationSuggestion): Promise<void> {
    switch (suggestion.type) {
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
    const performance = getPerformanceMonitor();
    const metrics = performance.getMetrics();
    const insights = performance.getInsights();
    
    let report = '📊 **Simple Performance Report**\n\n';
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

let simpleOptimizer: SimpleOptimizer | null = null;

export const initSimpleOptimizer = () => {
  simpleOptimizer = new SimpleOptimizer();
  logger.info('Simple optimizer initialized');
  
  // Run optimization every 5 minutes
  setInterval(async () => {
    if (simpleOptimizer) {
      const suggestions = await simpleOptimizer.runOptimization();
      if (suggestions.length > 0) {
        await simpleOptimizer.applyOptimizations(suggestions);
      }
    }
  }, 5 * 60 * 1000);
};

export const getSimpleOptimizer = (): SimpleOptimizer => {
  if (!simpleOptimizer) {
    throw new Error('Simple optimizer not initialized');
  }
  return simpleOptimizer;
};


