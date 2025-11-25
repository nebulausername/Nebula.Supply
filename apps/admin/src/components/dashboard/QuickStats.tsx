import { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Ticket, 
  ShoppingBag, 
  Package, 
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useDashboardMetrics } from '../../lib/api/shopHooks';
import { useKPIs, useTicketStats } from '../../lib/api/hooks';
import { useLiveUpdates } from '../../lib/store/dashboard';
import { useRealtimeKPIs } from '../../lib/realtime/hooks/useRealtimeKPIs';
import { springConfigs } from '../../utils/springConfigs';
import { logger } from '../../lib/logger';
import { WidgetSkeleton } from '../ui/skeletons/WidgetSkeleton';

interface QuickStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan';
  onClick?: () => void;
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    hover: 'hover:border-blue-500/50',
  },
  green: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    hover: 'hover:border-green-500/50',
  },
  orange: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    hover: 'hover:border-orange-500/50',
  },
  red: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    hover: 'hover:border-red-500/50',
  },
  purple: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    hover: 'hover:border-purple-500/50',
  },
  cyan: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    hover: 'hover:border-cyan-500/50',
  },
};

const QuickStatCard = memo(function QuickStatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  color,
  onClick,
  loading
}: QuickStatCardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return <WidgetSkeleton variant="kpi" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.gentle}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <Card
        className={`
          p-4 cursor-pointer transition-all
          ${colors.bg} ${colors.border} border
          ${onClick ? colors.hover : ''}
        `}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${colors.text}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : trend === 'down' ? (
                  <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                ) : null}
                <span className="text-xs text-muted-foreground">{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${colors.bg}`}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});

export const QuickStats = memo(function QuickStats() {
  const { liveUpdates } = useLiveUpdates();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: ticketStats, isLoading: ticketsLoading } = useTicketStats();
  const { data: kpis, isLoading: kpisLoading } = useKPIs();

  // Real-time updates
  const { isConnected } = useRealtimeKPIs({
    enabled: liveUpdates,
    onUpdated: useCallback(() => {
      logger.debug('Quick stats updated via WebSocket');
    }, [])
  });

  const isLoading = metricsLoading || ticketsLoading || kpisLoading;

  const stats = useMemo(() => {
    const revenue = metrics?.revenue?.today || 0;
    const revenueGrowth = metrics?.revenue?.growth || 0;
    
    const openTickets = kpis?.openTickets || ticketStats?.open || 0;
    const totalTickets = kpis?.totalTickets || ticketStats?.total || 0;
    
    const pendingOrders = metrics?.orders?.pending || 0;
    const totalOrders = metrics?.orders?.total || 0;
    
    const lowStock = metrics?.inventory?.lowStock || 0;
    const totalProducts = metrics?.inventory?.total || 0;
    
    const liveVisitors = metrics?.analytics?.liveVisitors || 0;
    const visitorGrowth = metrics?.analytics?.visitorGrowth || 0;

    return [
      {
        label: 'Today\'s Revenue',
        value: new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
        }).format(revenue),
        icon: <DollarSign className="w-5 h-5" />,
        trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'neutral',
        trendValue: revenueGrowth !== 0 ? `${Math.abs(revenueGrowth).toFixed(1)}%` : undefined,
        color: 'green' as const,
        onClick: () => logger.info('Revenue clicked'),
      },
      {
        label: 'Open Tickets',
        value: openTickets,
        icon: <Ticket className="w-5 h-5" />,
        trend: openTickets > totalTickets * 0.2 ? 'up' : 'neutral',
        trendValue: totalTickets > 0 ? `${Math.round((openTickets / totalTickets) * 100)}% of total` : undefined,
        color: openTickets > 10 ? 'red' : 'blue' as const,
        onClick: () => logger.info('Tickets clicked'),
      },
      {
        label: 'Pending Orders',
        value: pendingOrders,
        icon: <ShoppingBag className="w-5 h-5" />,
        trend: pendingOrders > 5 ? 'up' : 'neutral',
        trendValue: totalOrders > 0 ? `${Math.round((pendingOrders / totalOrders) * 100)}%` : undefined,
        color: pendingOrders > 10 ? 'orange' : 'purple' as const,
        onClick: () => logger.info('Orders clicked'),
      },
      {
        label: 'Low Stock Items',
        value: lowStock,
        icon: <Package className="w-5 h-5" />,
        trend: lowStock > 0 ? 'up' : 'neutral',
        trendValue: totalProducts > 0 ? `${Math.round((lowStock / totalProducts) * 100)}%` : undefined,
        color: lowStock > 5 ? 'red' : 'cyan' as const,
        onClick: () => logger.info('Stock clicked'),
      },
      {
        label: 'Live Visitors',
        value: liveVisitors,
        icon: <Users className="w-5 h-5" />,
        trend: visitorGrowth > 0 ? 'up' : visitorGrowth < 0 ? 'down' : 'neutral',
        trendValue: visitorGrowth !== 0 ? `${Math.abs(visitorGrowth).toFixed(1)}%` : undefined,
        color: 'green' as const,
        onClick: () => logger.info('Visitors clicked'),
      },
    ];
  }, [metrics, ticketStats, kpis]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <WidgetSkeleton key={i} variant="kpi" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quick Stats</h2>
          <p className="text-sm text-muted-foreground">
            Real-time overview of key metrics
          </p>
        </div>
        {isConnected && (
          <Badge variant="success" className="flex items-center gap-2">
            <motion.span
              className="h-2 w-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Live
          </Badge>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => (
          <QuickStatCard
            key={stat.label}
            {...stat}
            loading={isLoading}
            delay={index * 0.05}
          />
        ))}
      </div>
    </section>
  );
});



