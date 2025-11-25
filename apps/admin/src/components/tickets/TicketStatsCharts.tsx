import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card } from '../ui/Card';
import { useMobile } from '../../hooks/useMobile';
import type { TicketStats } from './types';
import { cn } from '../../utils/cn';

interface TicketStatsChartsProps {
  stats?: TicketStats;
}

const COLORS = {
  open: '#22c55e',
  waiting: '#eab308',
  inProgress: '#3b82f6',
  escalated: '#ef4444',
  done: '#6b7280',
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
};

export function TicketStatsCharts({ stats }: TicketStatsChartsProps) {
  const { isMobile } = useMobile();

  const statusData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Open', value: stats.open, color: COLORS.open },
      { name: 'In Progress', value: stats.inProgress, color: COLORS.inProgress },
      { name: 'Waiting', value: stats.waiting, color: COLORS.waiting },
      { name: 'Escalated', value: stats.escalated, color: COLORS.escalated },
      { name: 'Done', value: stats.done, color: COLORS.done },
    ].filter(item => item.value > 0);
  }, [stats]);

  const priorityData = useMemo(() => {
    if (!stats?.byPriority) return [];
    return Object.entries(stats.byPriority).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
      color: COLORS[priority as keyof typeof COLORS] || COLORS.low,
    })).filter(item => item.value > 0);
  }, [stats]);

  const categoryData = useMemo(() => {
    if (!stats?.byCategory) return [];
    return Object.entries(stats.byCategory)
      .map(([category, count]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
      .filter(item => item.value > 0);
  }, [stats]);
  
  // Fix type issue - byCategory might not exist
  const hasCategoryData = stats?.byCategory && Object.keys(stats.byCategory).length > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/95 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-semibold text-text mb-1">{payload[0].name}</p>
          <p className="text-sm text-muted">
            <span className="font-semibold text-text">{payload[0].value}</span> tickets
          </p>
        </div>
      );
    }
    return null;
  };

  if (!stats || stats.total === 0) {
    return null;
  }

  return (
    <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
      {/* Status Distribution Pie Chart */}
      {statusData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            variant="glassmorphic"
            className={cn(
              'p-4',
              'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
              'backdrop-blur-xl border border-white/10'
            )}
          >
            <h3 className="text-sm font-semibold text-text mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={isMobile ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Priority Distribution Bar Chart */}
      {priorityData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card
            variant="glassmorphic"
            className={cn(
              'p-4',
              'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
              'backdrop-blur-xl border border-white/10'
            )}
          >
            <h3 className="text-sm font-semibold text-text mb-4">Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}

      {/* Category Distribution */}
      {hasCategoryData && categoryData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={isMobile ? '' : 'lg:col-span-2'}
        >
          <Card
            variant="glassmorphic"
            className={cn(
              'p-4',
              'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
              'backdrop-blur-xl border border-white/10'
            )}
          >
            <h3 className="text-sm font-semibold text-text mb-4">Category Distribution</h3>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

