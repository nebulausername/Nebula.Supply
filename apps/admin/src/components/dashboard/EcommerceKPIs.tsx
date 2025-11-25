import { useMemo, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useDashboardMetrics } from '../../lib/api/shopHooks';
import { springConfigs } from '../../utils/springConfigs';
import { logger } from '../../lib/logger';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${(value).toFixed(1)}%`;
};

interface KPICardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'cyan';
  icon: React.ReactNode;
  loading?: boolean;
  delay?: number;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
  },
  green: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20',
  },
  orange: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20',
  },
  red: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20',
  },
  purple: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
  },
};

const KPICard = memo(function KPICard({ label, value, delta, trend, color, icon, loading, delay = 0 }: KPICardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-24 bg-gray-800/50 rounded" />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfigs.gentle, delay }}
    >
      <Card className={`relative overflow-hidden border ${colors.border} transition-all duration-300 hover:shadow-lg hover:${colors.glow} hover:scale-[1.02]`}>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
              <motion.p 
                className="text-3xl font-bold text-white"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springConfigs.bouncy, delay: delay + 0.1 }}
              >
                {value}
              </motion.p>
              {delta && (
                <div className="flex items-center gap-2 mt-3">
                  {trend === 'up' && (
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                  )}
                  {trend === 'down' && (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    trend === 'up' ? 'text-green-400' : 
                    trend === 'down' ? 'text-red-400' : 
                    'text-muted-foreground'
                  }`}>
                    {delta}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
              {icon}
            </div>
          </div>
        </div>
        
        {/* Animated background gradient */}
        <motion.div
          className={`absolute inset-0 ${colors.bg} opacity-0`}
          whileHover={{ opacity: 0.1 }}
          transition={{ duration: 0.3 }}
        />
      </Card>
    </motion.div>
  );
});

export const EcommerceKPIs = memo(function EcommerceKPIs() {
  const { 
    data: metrics, 
    isLoading, 
    error,
    isRefetching 
  } = useDashboardMetrics();

  // Default values for safe fallback
  const DEFAULT_KPI_DATA = {
    todayRevenue: 0,
    todayOrders: 0,
    weekRevenue: 0,
    weekOrders: 0,
    monthRevenue: 0,
    monthOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    activeCustomers: 0,
    conversionRate: 0,
    averageOrderValue: 0,
  } as const;

  const kpiData = useMemo(() => {
    if (!metrics) {
      return DEFAULT_KPI_DATA;
    }
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_KPI_DATA, ...metrics };
  }, [metrics]);

  // Calculate growth percentages with safe defaults
  const revenueGrowth = useMemo(() => {
    if (!metrics || !metrics.weekRevenue || metrics.weekRevenue === 0) return 0;
    const weeklyAvg = metrics.weekRevenue / 7;
    if (weeklyAvg === 0) return 0;
    const todayRevenue = metrics.todayRevenue ?? 0;
    return ((todayRevenue - weeklyAvg) / weeklyAvg) * 100;
  }, [metrics]);

  const ordersGrowth = useMemo(() => {
    if (!metrics || !metrics.weekOrders || metrics.weekOrders === 0) return 0;
    const weeklyAvg = metrics.weekOrders / 7;
    if (weeklyAvg === 0) return 0;
    const todayOrders = metrics.todayOrders ?? 0;
    return ((todayOrders - weeklyAvg) / weeklyAvg) * 100;
  }, [metrics]);

  // All hooks must be called before any early returns
  const cards = useMemo(() => [
    {
      label: "Today's Revenue",
      value: formatCurrency(kpiData.todayRevenue ?? 0),
      delta: revenueGrowth !== 0 ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs avg` : undefined,
      trend: revenueGrowth > 0 ? 'up' as const : revenueGrowth < 0 ? 'down' as const : 'neutral' as const,
      color: 'green' as const,
      icon: <DollarSign className="w-6 h-6" />,
    },
    {
      label: "Today's Orders",
      value: (kpiData.todayOrders ?? 0).toLocaleString(),
      delta: ordersGrowth !== 0 ? `${ordersGrowth > 0 ? '+' : ''}${ordersGrowth.toFixed(1)}% vs avg` : undefined,
      trend: ordersGrowth > 0 ? 'up' as const : ordersGrowth < 0 ? 'down' as const : 'neutral' as const,
      color: 'blue' as const,
      icon: <ShoppingCart className="w-6 h-6" />,
    },
    {
      label: 'Pending Orders',
      value: (kpiData.pendingOrders ?? 0).toLocaleString(),
      delta: 'Requires processing',
      trend: (kpiData.pendingOrders ?? 0) > 10 ? 'up' as const : 'neutral' as const,
      color: 'orange' as const,
      icon: <Package className="w-6 h-6" />,
    },
    {
      label: 'Low Stock Items',
      value: (kpiData.lowStockItems ?? 0).toLocaleString(),
      delta: (kpiData.lowStockItems ?? 0) > 0 ? 'Needs attention' : 'All good',
      trend: (kpiData.lowStockItems ?? 0) > 0 ? 'down' as const : 'up' as const,
      color: (kpiData.lowStockItems ?? 0) > 5 ? 'red' as const : 'orange' as const,
      icon: <AlertTriangle className="w-6 h-6" />,
    },
    {
      label: 'Average Order Value',
      value: formatCurrency(kpiData.averageOrderValue ?? 0),
      delta: `${kpiData.activeCustomers ?? 0} active customers`,
      trend: 'neutral' as const,
      color: 'purple' as const,
      icon: <Target className="w-6 h-6" />,
    },
    {
      label: 'Conversion Rate',
      value: formatPercent(kpiData.conversionRate ?? 0),
      delta: 'Last 30 days',
      trend: (kpiData.conversionRate ?? 0) > 2 ? 'up' as const : 'neutral' as const,
      color: 'cyan' as const,
      icon: <TrendingUp className="w-6 h-6" />,
    },
  ], [kpiData, revenueGrowth, ordersGrowth]);

  // Early return for error state - AFTER all hooks are called
  // Show error but still render with default values for better UX
  if (error && !kpiData) {
    logger.error('Failed to load e-commerce metrics', { error });
    return (
      <Card className="p-6 border-red-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-medium">Failed to load e-commerce metrics</p>
              <p className="text-sm text-muted-foreground mt-1">
                Showing default values. Data will refresh automatically.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-3">
            E-Commerce Metrics
            {isRefetching && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Package className="w-5 h-5 text-blue-400" />
              </motion.div>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time sales and inventory overview
          </p>
        </div>
        
        {/* Period Summary */}
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(kpiData.weekRevenue ?? 0)}</p>
            <p className="text-xs text-muted-foreground">{kpiData.weekOrders ?? 0} orders</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(kpiData.monthRevenue ?? 0)}</p>
            <p className="text-xs text-muted-foreground">{kpiData.monthOrders ?? 0} orders</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card, index) => (
          <KPICard
            key={card.label}
            {...card}
            loading={isLoading}
            delay={index * 0.05}
          />
        ))}
      </div>

      {/* Quick Actions */}
      {((kpiData.pendingOrders ?? 0) > 0 || (kpiData.lowStockItems ?? 0) > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.gentle, delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="font-medium text-white">Action Required</p>
                  <p className="text-sm text-muted-foreground">
                    {(kpiData.pendingOrders ?? 0) > 0 && `${kpiData.pendingOrders ?? 0} orders need processing`}
                    {(kpiData.pendingOrders ?? 0) > 0 && (kpiData.lowStockItems ?? 0) > 0 && ' • '}
                    {(kpiData.lowStockItems ?? 0) > 0 && `${kpiData.lowStockItems ?? 0} items low on stock`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {(kpiData.pendingOrders ?? 0) > 0 && (
                  <Badge variant="outline" className="text-orange-400 border-orange-400">
                    View Orders
                  </Badge>
                )}
                {(kpiData.lowStockItems ?? 0) > 0 && (
                  <Badge variant="outline" className="text-red-400 border-red-400">
                    Check Inventory
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </section>
  );
});

