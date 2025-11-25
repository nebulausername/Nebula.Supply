import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { LineChart } from '../ui/charts/LineChart';
import { BarChart } from '../ui/charts/BarChart';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useSalesAnalytics, useBestsellers } from '../../lib/api/shopHooks';
import { springConfigs } from '../../utils/springConfigs';

type Period = 'day' | 'week' | 'month' | 'year';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
};

const formatMonthDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
};

interface StatsCardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

function StatsCard({ label, value, change, icon, color, delay = 0 }: StatsCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springConfigs.gentle, delay }}
    >
      <Card className={`p-6 border ${colors.border} hover:shadow-lg transition-all duration-300`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-white mb-2">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {change >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {Math.abs(change).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">vs last period</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
            {icon}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function SalesAnalytics() {
  const [period, setPeriod] = useState<Period>('month');
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  const { 
    data: salesData, 
    isLoading: salesLoading, 
    error: salesError,
    refetch: refetchSales 
  } = useSalesAnalytics({ period, ...dateRange });

  const {
    data: bestsellers,
    isLoading: bestsellersLoading,
    refetch: refetchBestsellers
  } = useBestsellers({ limit: 10, ...dateRange });

  const stats = useMemo(() => {
    if (!salesData) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        growth: 0,
        dataPoints: [],
      };
    }
    return salesData;
  }, [salesData]);

  const chartData = useMemo(() => {
    if (!stats.dataPoints || stats.dataPoints.length === 0) return [];
    
    return stats.dataPoints.map(point => ({
      date: point.date,
      formattedDate: period === 'month' ? formatMonthDate(point.date) : formatDate(point.date),
      revenue: point.revenue,
      orders: point.orders,
      aov: point.averageOrderValue,
      products: point.productsSold,
    }));
  }, [stats.dataPoints, period]);

  const bestsellersChartData = useMemo(() => {
    if (!bestsellers || bestsellers.length === 0) return [];
    
    return bestsellers.slice(0, 10).map(product => ({
      name: product.productName.length > 20 
        ? product.productName.substring(0, 20) + '...' 
        : product.productName,
      fullName: product.productName,
      revenue: product.totalRevenue,
      sold: product.totalSold,
      orders: product.orders,
    }));
  }, [bestsellers]);

  const handleRefresh = () => {
    refetchSales();
    refetchBestsellers();
  };

  if (salesError) {
    return (
      <Card className="p-6 border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <TrendingDown className="w-5 h-5" />
          <div>
            <p className="font-medium">Failed to load sales analytics</p>
            <p className="text-sm text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </Card>
    );
  }

  const isLoading = salesLoading || bestsellersLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-400" />
            Sales Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track revenue, orders, and performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1">
            {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className={period === p ? 'bg-blue-500/20 text-blue-400' : ''}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.growth}
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          delay={0}
        />
        <StatsCard
          label="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          change={stats.growth}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="blue"
          delay={0.05}
        />
        <StatsCard
          label="Average Order Value"
          value={formatCurrency(stats.averageOrderValue)}
          icon={<Package className="w-6 h-6" />}
          color="purple"
          delay={0.1}
        />
        <StatsCard
          label="Products Sold"
          value={stats.dataPoints.reduce((sum, p) => sum + p.productsSold, 0).toLocaleString()}
          icon={<Package className="w-6 h-6" />}
          color="orange"
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="orders">Orders Overview</TabsTrigger>
          <TabsTrigger value="bestsellers">Top Products</TabsTrigger>
        </TabsList>

        {/* Revenue Chart */}
        <TabsContent value="revenue" className="mt-6">
          <LineChart
            data={chartData}
            xKey="formattedDate"
            lines={[
              {
                dataKey: 'revenue',
                name: 'Revenue',
                color: '#10b981',
                strokeWidth: 3,
              },
            ]}
            title="Revenue Over Time"
            description={`${period.charAt(0).toUpperCase() + period.slice(1)}ly revenue performance`}
            height={400}
            formatValue={(value) => formatCurrency(value)}
            showArea={true}
            showGrid={true}
          />
        </TabsContent>

        {/* Orders Chart */}
        <TabsContent value="orders" className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <BarChart
              data={chartData}
              xKey="formattedDate"
              bars={[
                {
                  dataKey: 'orders',
                  name: 'Orders',
                  color: '#3b82f6',
                },
              ]}
              title="Orders Over Time"
              description={`${period.charAt(0).toUpperCase() + period.slice(1)}ly order volume`}
              height={400}
              formatValue={(value) => value.toLocaleString()}
              showGrid={true}
            />
          </motion.div>
        </TabsContent>

        {/* Bestsellers Chart */}
        <TabsContent value="bestsellers" className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <BarChart
              data={bestsellersChartData}
              xKey="name"
              bars={[
                {
                  dataKey: 'revenue',
                  name: 'Revenue',
                  color: '#10b981',
                },
              ]}
              title="Top 10 Products by Revenue"
              description="Best performing products in the selected period"
              height={400}
              formatValue={(value) => formatCurrency(value)}
              horizontal={true}
              colorGradient={[
                '#10b981',
                '#14b8a6',
                '#06b6d4',
                '#3b82f6',
                '#6366f1',
                '#8b5cf6',
                '#a855f7',
                '#d946ef',
                '#ec4899',
                '#f43f5e',
              ]}
            />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Bestsellers Table */}
      {bestsellers && bestsellers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.gentle, delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Product Performance Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Units Sold</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Orders</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {bestsellers.slice(0, 10).map((product, index) => (
                    <motion.tr
                      key={product.productId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Badge 
                          variant="outline" 
                          className={`${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            index === 1 ? 'bg-gray-400/20 text-gray-400 border-gray-400/30' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                            'bg-gray-800/50 text-gray-400 border-gray-700'
                          }`}
                        >
                          {index + 1}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-white">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">{product.categoryName}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-white">{product.totalSold.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-blue-400">{product.orders.toLocaleString()}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-green-400">{formatCurrency(product.totalRevenue)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-muted-foreground">{formatCurrency(product.averagePrice)}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

