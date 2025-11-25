import { memo, useMemo } from 'react';
import { Card } from '../ui/Card';
import { useTicketStats } from '../../lib/api/hooks';
import { useLiveUpdates } from '../../lib/store/dashboard';
import { useRealtimeKPIs } from '../../lib/websocket/useRealtimeKPIs';
import { motion } from 'framer-motion';
import { springConfigs } from '../../utils/springConfigs';

export const QueueByPriority = memo(function QueueByPriority() {
  const { data: stats, isLoading } = useTicketStats();
  const { liveUpdates } = useLiveUpdates();
  
  // Real-time updates via KPI hook (ticket stats are part of KPIs)
  const { isConnected } = useRealtimeKPIs({
    enabled: liveUpdates
  });

  // Verwende lokale Daten wenn API nicht verfügbar
  const localPriorityData = useMemo(() => ({
    low: 2,
    medium: 5,
    high: 3,
    critical: 2
  }), []);

  const priorityData = useMemo(() => stats ? {
    low: stats.by_priority?.low || 0,
    medium: stats.by_priority?.medium || 0,
    high: stats.by_priority?.high || 0,
    critical: stats.by_priority?.critical || 0
  } : localPriorityData, [stats, localPriorityData]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Queue by Priority</h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      </Card>
    );
  }

  const priorityLabels = useMemo(() => ({
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
  }), []);

  const priorityColors = useMemo(() => ({
    low: 'text-green-400 border-green-500/20',
    medium: 'text-yellow-400 border-yellow-500/20',
    high: 'text-orange-400 border-orange-500/20',
    critical: 'text-red-400 border-red-500/20'
  }), []);

  const total = useMemo(() => Object.values(priorityData).reduce((a, b) => a + b, 0) || 12, [priorityData]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Queue by Priority</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            Automation deflection {stats?.automationDeflectionRate ?
              Math.round(stats.automationDeflectionRate * 100) : 42}%
          </span>
          {liveUpdates && isConnected && (
            <motion.div
              className="h-2 w-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              title="Real-time updates active"
            />
          )}
        </div>
      </div>

      <div className="space-y-3">
        {(Object.keys(priorityLabels) as Array<keyof typeof priorityLabels>).map((priority, index) => {
          const count = priorityData[priority];
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

          return (
            <motion.div
              key={priority}
              className={`flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3 ${priorityColors[priority]}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                ...springConfigs.gentle,
                delay: index * 0.05
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-text">{priorityLabels[priority]}</span>
                <div className="w-16 bg-black/50 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${
                      priority === 'critical' ? 'bg-red-400' :
                      priority === 'high' ? 'bg-orange-400' :
                      priority === 'medium' ? 'bg-yellow-400' :
                      'bg-green-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                      ...springConfigs.smooth,
                      delay: index * 0.05 + 0.2
                    }}
                  />
                </div>
              </div>
              <span className="font-semibold text-text">{count} Tickets</span>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
});
