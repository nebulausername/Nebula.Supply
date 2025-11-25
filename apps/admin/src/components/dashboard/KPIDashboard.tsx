import { useEffect, useMemo, useCallback, useState } from 'react';
import { useKPIs, useTicketStats } from '../../lib/api/hooks';
import { useLiveUpdates } from '../../lib/store/dashboard';
import { KpiCard } from '../ui/KpiCard';
import { logger } from '../../lib/logger';
import { useRealtimeKPIs } from '../../lib/realtime/hooks/useRealtimeKPIs';
import { performanceMonitor } from '../../lib/performance';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { motion } from 'framer-motion';
import { springConfigs } from '../../utils/springConfigs';
import { KpiUpdateEvent } from '../../lib/types/common';
import { KPIDetailModal } from './KPIDetailModal';
import { WidgetSkeleton } from '../ui/skeletons/WidgetSkeleton';

const DEFAULT_KPIS = {
  openTickets: 0,
  waitingTickets: 0,
  escalatedTickets: 0,
  totalTickets: 0,
  avgResponseTime: 0,
  avgResolutionTime: 0,
  satisfactionScore: null as number | null,
  automationDeflectionRate: 0,
  timestamp: new Date().toISOString(),
};

const DEFAULT_STATS = {
  total: 0,
  open: 0,
  waiting: 0,
  escalated: 0,
  in_progress: 0,
  done: 0,
  by_priority: {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  },
  avgResolutionTime: 0,
  avgResponseTime: 0,
  satisfactionScore: null as number | null,
  automationDeflectionRate: 0,
  timestamp: new Date().toISOString(),
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
const formatMinutes = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value) ? `${value}m` : 'n/a';

// Memoized component for updated time to prevent unnecessary re-renders
const UpdatedTime = ({ lastUpdate, timestamp }: { lastUpdate?: string | null; timestamp: string }) => {
  const formattedTime = useMemo(() => {
    return new Date(lastUpdate ?? timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [lastUpdate, timestamp]);

  return <span>Updated {formattedTime}</span>;
};

export function KPIDashboard() {
  const startTime = performance.now();
  const { handleError } = useErrorHandler('KPIDashboard');
  const { measureAsync } = usePerformanceMonitor('KPIDashboard');
  const [selectedKPI, setSelectedKPI] = useState<{ label: string; value: string; delta?: string; trend?: 'up' | 'down' | 'neutral'; description?: string } | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');

  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
  } = useKPIs();
  const {
    data: ticketStats,
    isLoading: statsLoading,
    error: statsError,
  } = useTicketStats();

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS - Rules of Hooks
  const { liveUpdates, connectionStatus, lastUpdate } = useLiveUpdates();
  
  // Memoized callback for WebSocket updates
  const handleKpiUpdate = useCallback((event: KpiUpdateEvent) => {
    logger.info('KPI updated via WebSocket', { type: event.type, timestamp: event.timestamp });
  }, []);

  // Real-time KPI updates via WebSocket
  const { isConnected: kpiConnected, connectionStatus: kpiConnectionStatus } = useRealtimeKPIs({
    enabled: liveUpdates,
    onUpdated: handleKpiUpdate
  });

  // Use real-time connection status if available - memoized
  const effectiveConnectionStatus = useMemo(() => {
    return kpiConnected ? 'connected' : (kpiConnectionStatus?.connected ? 'connected' : connectionStatus);
  }, [kpiConnected, kpiConnectionStatus?.connected, connectionStatus]);

  // All useEffect hooks
  useEffect(() => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.recordMetrics({
      renderTime,
      componentName: 'KPIDashboard',
      operation: 'render',
    });
  }, []); // Only run once on mount

  useEffect(() => {
    if (kpiConnected) {
      logger.info('Real-time KPI updates connected');
    }
  }, [kpiConnected]);

  // Log errors with proper error handling
  useEffect(() => {
    if (kpisError) {
      handleError(kpisError, { operation: 'kpis_fetch', scope: 'kpis' });
    }
  }, [kpisError, handleError]);

  useEffect(() => {
    if (statsError) {
      handleError(statsError, { operation: 'stats_fetch', scope: 'stats' });
    }
  }, [statsError, handleError]);

  const { displayKpis, displayStats } = useMemo(() => {
    const stats = ticketStats
      ? { ...DEFAULT_STATS, ...ticketStats }
      : { ...DEFAULT_STATS };

    const currentKpis = kpis
      ? {
          ...DEFAULT_KPIS,
          ...kpis,
        }
      : { ...DEFAULT_KPIS };

    const merged = {
      openTickets: currentKpis.openTickets ?? stats.open,
      waitingTickets: currentKpis.waitingTickets ?? stats.waiting,
      escalatedTickets: currentKpis.escalatedTickets ?? stats.escalated,
      totalTickets: currentKpis.totalTickets ?? stats.total,
      avgResponseTime: currentKpis.avgResponseTime ?? stats.avgResponseTime ?? 0,
      avgResolutionTime:
        currentKpis.avgResolutionTime ?? stats.avgResolutionTime ?? 0,
      satisfactionScore:
        currentKpis.satisfactionScore ?? stats.satisfactionScore ?? null,
      automationDeflectionRate:
        currentKpis.automationDeflectionRate ?? stats.automationDeflectionRate ?? 0,
      timestamp: currentKpis.timestamp ?? stats.timestamp ?? new Date().toISOString(),
    };

    return {
      displayKpis: merged,
      displayStats: stats,
    };
  }, [kpis, ticketStats]);

  // Memoized ratio function
  const ratio = useCallback((part: number, total: number) => (total ? part / total : 0), []);

  // Memoized cards array - only recalculate when displayKpis or displayStats change
  // Must be called before any early returns
  const cards = useMemo(() => {
    if (!displayKpis || !displayStats) return [];
    return [
    {
      label: 'Open Tickets',
      value: (displayKpis.openTickets ?? 0).toLocaleString(),
      delta: `${formatPercent(ratio(displayKpis.openTickets ?? 0, displayKpis.totalTickets ?? displayStats.total ?? 1))} of total`,
      trend: 'neutral' as const,
      color: 'blue' as const,
      icon: 'OT',
      description: 'Currently active conversations',
    },
    {
      label: 'Waiting',
      value: (displayKpis.waitingTickets ?? 0).toLocaleString(),
      delta: `${(displayStats.by_priority?.high ?? 0) + (displayStats.by_priority?.critical ?? 0)} high/critical`,
      trend: 'neutral' as const,
      color: 'yellow' as const,
      icon: 'WT',
      description: 'Pending agent response',
    },
    {
      label: 'Escalated',
      value: (displayKpis.escalatedTickets ?? 0).toLocaleString(),
      delta: `${displayStats.by_priority?.critical ?? 0} critical escalations`,
      trend: (displayKpis.escalatedTickets ?? 0) > 0 ? 'up' : 'neutral',
      color: 'red' as const,
      icon: 'ES',
      description: 'Requires leadership attention',
    },
    {
      label: 'Avg Response',
      value: formatMinutes(displayKpis.avgResponseTime),
      delta: 'Target < 30m',
      trend: (displayKpis.avgResponseTime ?? 0) > 30 ? 'down' : 'up',
      color: 'purple' as const,
      icon: 'AR',
      description: 'Time to first reply',
    },
    {
      label: 'Avg Resolution',
      value: formatMinutes(displayKpis.avgResolutionTime),
      delta: 'Target < 120m',
      trend: (displayKpis.avgResolutionTime ?? 0) > 120 ? 'down' : 'up',
      color: 'cyan' as const,
      icon: 'AS',
      description: 'Time to close tickets',
    },
    {
      label: 'Automation Rate',
      value: formatPercent(displayKpis.automationDeflectionRate ?? 0),
      delta: displayKpis.satisfactionScore !== null && displayKpis.satisfactionScore !== undefined
        ? `CSAT ${displayKpis.satisfactionScore.toFixed(1)}`
        : 'Monitoring',
      trend: (displayKpis.automationDeflectionRate ?? 0) > 0.4 ? 'up' : 'neutral',
      color: 'green' as const,
      icon: 'AI',
      description: 'AI deflection performance',
    },
    ];
  }, [displayKpis, displayStats, ratio]);

  // Memoize formatted update time - must be outside JSX to follow Rules of Hooks
  const formattedUpdateTime = useMemo(() => {
    const timestamp = lastUpdate ?? displayKpis?.timestamp ?? new Date().toISOString();
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [lastUpdate, displayKpis?.timestamp]);

  const handleKpiClick = useCallback((card: typeof cards[0]) => {
    setSelectedKPI(card);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedKPI(null);
  }, []);

  // Early return AFTER all hooks are called
  const isLoading = kpisLoading || statsLoading;
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <WidgetSkeleton key={index} variant="kpi" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-semibold">Live Metrics</h2>
          <p className="text-sm text-muted">
            Real-time snapshot of support and automation health
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          <div className={`flex items-center gap-2 ${
            effectiveConnectionStatus === 'connected'
              ? 'text-green-400'
              : effectiveConnectionStatus === 'connecting'
              ? 'text-yellow-400'
              : 'text-red-400'
          }`}>
            <motion.span
              className={`h-2 w-2 rounded-full ${
                effectiveConnectionStatus === 'connected'
                  ? 'bg-green-400'
                  : effectiveConnectionStatus === 'connecting'
                  ? 'bg-yellow-400'
                  : 'bg-red-400'
              }`}
              animate={
                effectiveConnectionStatus === 'connected'
                  ? { opacity: [1, 0.5, 1] }
                  : effectiveConnectionStatus === 'connecting'
                  ? { opacity: [0.5, 1, 0.5] }
                  : { opacity: 1 }
              }
              transition={{
                duration: 2,
                repeat: effectiveConnectionStatus === 'connected' || effectiveConnectionStatus === 'connecting' ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
            {effectiveConnectionStatus === 'connected'
              ? 'Live'
              : effectiveConnectionStatus === 'connecting'
              ? 'Connecting'
              : 'Offline'}
          </div>

          <span>•</span>

          <span>
            Updated {formattedUpdateTime}
          </span>

          {liveUpdates ? (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-green-400">
              Auto refresh on
            </span>
          ) : (
            <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-gray-400">
              Auto refresh off
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...springConfigs.gentle,
              delay: index * 0.05
            }}
          >
            <KpiCard
              label={card.label}
              value={card.value}
              delta={card.delta}
              trend={card.trend}
              color={card.color}
              icon={card.icon}
              description={card.description}
              isLive={liveUpdates && effectiveConnectionStatus === 'connected'}
              onClick={() => handleKpiClick(card)}
            />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <motion.div
          className="rounded-lg border border-white/10 bg-black/20 p-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springConfigs.gentle, delay: 0.3 }}
        >
          <p className="text-sm text-muted">Total Tickets</p>
          <p className="text-lg font-semibold text-text">
            {displayStats.total.toLocaleString()}
          </p>
        </motion.div>
        <motion.div
          className="rounded-lg border border-white/10 bg-black/20 p-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springConfigs.gentle, delay: 0.35 }}
        >
          <p className="text-sm text-muted">In Progress</p>
          <p className="text-lg font-semibold text-text">
            {displayStats.in_progress.toLocaleString()}
          </p>
        </motion.div>
        <motion.div
          className="rounded-lg border border-white/10 bg-black/20 p-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springConfigs.gentle, delay: 0.4 }}
        >
          <p className="text-sm text-muted">Done</p>
          <p className="text-lg font-semibold text-text">
            {displayStats.done.toLocaleString()}
          </p>
        </motion.div>
        <motion.div
          className="rounded-lg border border-white/10 bg-black/20 p-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...springConfigs.gentle, delay: 0.45 }}
        >
          <p className="text-sm text-muted">Satisfaction</p>
          <p className="text-lg font-semibold text-text">
            {displayKpis.satisfactionScore
              ? displayKpis.satisfactionScore.toFixed(1)
              : 'n/a'}
          </p>
        </motion.div>
      </div>

      {/* KPI Detail Modal */}
      {selectedKPI && (
        <KPIDetailModal
          isOpen={!!selectedKPI}
          onClose={handleCloseModal}
          kpiData={selectedKPI}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}
    </section>
  );
}
