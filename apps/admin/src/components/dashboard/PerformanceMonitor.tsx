import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { performanceMonitor, PerformanceSummary } from '../../lib/performance';
import { logger } from '../../lib/logger';

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update performance summary every 5 seconds
    const interval = setInterval(() => {
      const newSummary = performanceMonitor.getPerformanceSummary();
      setSummary(newSummary);

      // Log performance warnings
      if (newSummary.averageRenderTime > 50) {
        logger.warn('High render times detected', {
          averageRenderTime: newSummary.averageRenderTime,
          slowestComponent: newSummary.slowestComponent
        });
      }

      if (newSummary.memoryTrend === 'increasing' && newSummary.averageMemoryUsage > 50) {
        logger.warn('Memory usage increasing', {
          memoryUsage: newSummary.averageMemoryUsage,
          trend: newSummary.memoryTrend
        });
      }
    }, 5000);

    setUpdateInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-neon/20 hover:bg-neon/30 text-neon border border-neon/30 rounded-lg px-3 py-2 text-sm font-space-grotesk transition-all duration-300"
        >
          📊 Perf
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-64' : 'w-80'}`}>
      <Card className={`p-4 bg-black/90 backdrop-blur-xl border-neon/30 ${isMinimized ? 'p-3' : ''}`}>
        <div className={`flex items-center justify-between ${isMinimized ? 'mb-2' : 'mb-4'}`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-neon rounded-full animate-pulse" />
            <h3 className="text-lg font-orbitron font-semibold text-neon">
              {isMinimized ? 'Perf' : 'Performance Monitor'}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-muted hover:text-neon transition-colors text-sm"
            >
              {isMinimized ? '↗' : '↘'}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-muted hover:text-neon transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {summary && !isMinimized && (
          <div className={`space-y-3 text-sm ${isMinimized ? 'space-y-2' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-muted">Avg Render Time</div>
                <div className={`font-semibold ${summary.averageRenderTime > 16 ? 'text-red-400' : 'text-green-400'}`}>
                  {summary.averageRenderTime.toFixed(1)}ms
                </div>
              </div>

              <div>
                <div className="text-muted">Memory Usage</div>
                <div className={`font-semibold ${summary.memoryTrend === 'increasing' ? 'text-red-400' : 'text-green-400'}`}>
                  {summary.averageMemoryUsage.toFixed(1)}MB
                  <span className="text-xs ml-1">
                    {summary.memoryTrend === 'increasing' ? '↗' : summary.memoryTrend === 'decreasing' ? '↘' : '→'}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-muted">API Response</div>
                <div className={`font-semibold ${summary.averageApiResponseTime > 1000 ? 'text-red-400' : 'text-green-400'}`}>
                  {summary.averageApiResponseTime.toFixed(0)}ms
                </div>
              </div>

              <div>
                <div className="text-muted">Total Metrics</div>
                <div className="font-semibold text-text">
                  {summary.totalMetrics}
                </div>
              </div>
            </div>

            {summary.slowestComponent !== 'none' && (
              <div className="pt-2 border-t border-white/10">
                <div className="text-muted text-xs">Slowest Component</div>
                <div className="text-red-400 text-sm font-medium">
                  {summary.slowestComponent}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  performanceMonitor.clearMetrics();
                  setSummary(performanceMonitor.getPerformanceSummary());
                }}
                className="text-xs text-muted hover:text-neon transition-colors"
              >
                Clear Metrics
              </button>
            </div>
          </div>
        )}

        {isMinimized && summary && (
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className={`text-lg font-orbitron font-bold ${summary.averageRenderTime > 16 ? 'text-red-400' : 'text-green-400'}`}>
                {summary.averageRenderTime.toFixed(0)}
              </div>
              <div className="text-xs text-muted">ms</div>
            </div>

            <div className="text-center">
              <div className={`text-lg font-orbitron font-bold ${summary.memoryTrend === 'increasing' ? 'text-red-400' : 'text-green-400'}`}>
                {summary.averageMemoryUsage.toFixed(0)}
              </div>
              <div className="text-xs text-muted">MB</div>
            </div>

            <div className="text-center">
              <div className={`text-lg font-orbitron font-bold ${summary.averageApiResponseTime > 1000 ? 'text-red-400' : 'text-green-400'}`}>
                {summary.averageApiResponseTime.toFixed(0)}
              </div>
              <div className="text-xs text-muted">ms</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
