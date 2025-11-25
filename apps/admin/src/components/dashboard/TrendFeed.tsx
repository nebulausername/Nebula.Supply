import { useMemo, useCallback } from 'react';
import { useTrends } from '../../lib/api/hooks';
import { useDashboardFilters } from '../../lib/store/dashboard';
import { Card } from '../ui/Card';
import { logger } from '../../lib/logger';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';

type TrendPoint = {
  timestamp: string;
  openTickets: number;
  waitingTickets: number;
  escalatedTickets: number;
  inProgressTickets?: number;
  doneTickets?: number;
  avgResponseTime?: number;
  avgResolutionTime?: number;
  satisfactionScore?: number;
  automationDeflectionRate?: number;
};

const METRIC_ALIAS: Record<string, keyof TrendPoint> = {
  tickets: 'openTickets',
  open: 'openTickets',
  waiting: 'waitingTickets',
  escalated: 'escalatedTickets',
  response_time: 'avgResponseTime',
  resolution_time: 'avgResolutionTime',
  satisfaction: 'satisfactionScore',
  automation: 'automationDeflectionRate',
  in_progress: 'inProgressTickets',
  done: 'doneTickets',
  avgResponseTime: 'avgResponseTime',
  avgResolutionTime: 'avgResolutionTime',
  satisfactionScore: 'satisfactionScore',
  automationDeflectionRate: 'automationDeflectionRate',
};

const DEFAULT_METRICS: Array<keyof TrendPoint> = [
  'openTickets',
  'waitingTickets',
  'escalatedTickets',
];

const FALLBACK_TRENDS: TrendPoint[] = Array.from({ length: 6 }).map((_, index) => {
  const time = new Date(Date.now() - index * 60 * 60 * 1000).toISOString();
  return {
    timestamp: time,
    openTickets: Math.max(0, 8 - index),
    waitingTickets: Math.max(0, 4 - index),
    escalatedTickets: index % 3 === 0 ? 2 : 1,
    inProgressTickets: Math.max(0, 6 - index),
    doneTickets: 20 + index * 2,
    avgResponseTime: 20 + index * 3,
    avgResolutionTime: 90 + index * 5,
    satisfactionScore: 4.4 - index * 0.03,
    automationDeflectionRate: 0.35 + index * 0.02,
  };
});

const metricLabel: Record<keyof TrendPoint, string> = {
  timestamp: 'Timestamp',
  openTickets: 'Open',
  waitingTickets: 'Waiting',
  escalatedTickets: 'Escalated',
  inProgressTickets: 'In Progress',
  doneTickets: 'Resolved',
  avgResponseTime: 'Avg Response',
  avgResolutionTime: 'Avg Resolution',
  satisfactionScore: 'CSAT',
  automationDeflectionRate: 'Automation',
};

const formatMetricValue = (key: keyof TrendPoint, value: number | undefined) => {
  if (value === undefined || Number.isNaN(value)) {
    return 'n/a';
  }

  switch (key) {
    case 'avgResponseTime':
    case 'avgResolutionTime':
      return `${Math.round(value)}m`;
    case 'satisfactionScore':
      return value.toFixed(2);
    case 'automationDeflectionRate':
      return `${Math.round(value * 100)}%`;
    default:
      return Math.round(value).toLocaleString();
  }
};

export function TrendFeed() {
  const { filters } = useDashboardFilters();
  const { handleError } = useErrorHandler('TrendFeed');
  const { measureAsync } = usePerformanceMonitor('TrendFeed');

  const resolvedMetrics = useMemo(() => {
    const requested = filters.metrics.length
      ? filters.metrics
          .map((metric) => METRIC_ALIAS[metric] ?? (metric as keyof TrendPoint))
          .filter((metric): metric is keyof TrendPoint => metric !== undefined)
      : DEFAULT_METRICS;

    return Array.from(new Set(requested));
  }, [filters.metrics]);

  const {
    data: trends,
    isLoading,
    error,
  } = useTrends(filters.timeRange, resolvedMetrics.join(','));

  const displayTrends = useMemo<TrendPoint[]>(() => {
    if (error) {
      handleError(error, { operation: 'trends_processing' });
    }

    if (!trends || !trends.length) {
      return FALLBACK_TRENDS;
    }

    return trends.map((point: any) => ({
      timestamp: point.timestamp,
      openTickets: point.openTickets ?? point.open ?? 0,
      waitingTickets: point.waitingTickets ?? point.waiting ?? 0,
      escalatedTickets: point.escalatedTickets ?? point.escalated ?? 0,
      inProgressTickets: point.inProgressTickets ?? point.in_progress,
      doneTickets: point.doneTickets ?? point.done,
      avgResponseTime: point.avgResponseTime,
      avgResolutionTime: point.avgResolutionTime,
      satisfactionScore: point.satisfactionScore,
      automationDeflectionRate: point.automationDeflectionRate,
    }));
  }, [error, trends, handleError]);

  // Memoize the trend click handler to prevent unnecessary re-renders
  const handleTrendClick = useMemo(() => (point: TrendPoint) => {
    logger.logUserAction('trend_point_clicked', {
      timestamp: point.timestamp,
      metrics: point,
    });
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Trend Feed</h2>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      </Card>
    );
  }

  if (error && (!trends || !trends.length)) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Trend Feed</h2>
        <div className="text-center text-red-400">
          <p>Could not load trend data</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Trend Feed</h2>
        <span className="text-xs uppercase tracking-wide text-muted">
          {filters.timeRange} window
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {displayTrends.map((point, index) => (
          <div
            key={`${point.timestamp}-${index}`}
            className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 hover:bg-black/35 transition-colors"
            onClick={() => handleTrendClick(point)}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted">
                {new Date(point.timestamp).toLocaleString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs text-muted">
                {new Date(point.timestamp).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {resolvedMetrics.map((key) => {
                const label = metricLabel[key] ?? key;
                const value = formatMetricValue(key, point[key]);

                return (
                  <div key={key} className="flex justify-between text-sm text-muted">
                    <span className="font-medium text-text/80">{label}</span>
                    <span className="text-text">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
