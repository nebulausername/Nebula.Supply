import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PieChart } from '../ui/charts/PieChart';
import { BarChart } from '../ui/charts/BarChart';
import {
  Users,
  UserPlus,
  RefreshCw,
  Download,
  TrendingUp,
  Heart,
  Award,
  Star,
  DollarSign,
  ShoppingCart,
  Target,
  AlertCircle
} from 'lucide-react';
import { useCustomerAnalytics } from '../../lib/api/shopHooks';
import { springConfigs } from '../../utils/springConfigs';

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
  return date.toLocaleDateString('de-DE', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

interface StatsCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

function StatsCard({ label, value, subValue, icon, color, delay = 0 }: StatsCardProps) {
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
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
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            {subValue && (
              <p className="text-sm text-muted-foreground">{subValue}</p>
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

export function CustomerAnalytics() {
  const {
    data: analytics,
    isLoading,
    error,
    refetch
  } = useCustomerAnalytics();

  const stats = useMemo(() => {
    if (!analytics) {
      return {
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        customerLifetimeValue: 0,
        averageOrderFrequency: 0,
        topCustomers: [],
      };
    }
    return analytics;
  }, [analytics]);

  // Customer segmentation data
  const segmentationData = useMemo(() => {
    if (!analytics) return [];
    
    const total = analytics.totalCustomers;
    return [
      {
        name: 'New Customers',
        value: analytics.newCustomers,
        percentage: total > 0 ? (analytics.newCustomers / total) * 100 : 0,
      },
      {
        name: 'Returning Customers',
        value: analytics.returningCustomers,
        percentage: total > 0 ? (analytics.returningCustomers / total) * 100 : 0,
      },
      {
        name: 'One-Time Buyers',
        value: analytics.totalCustomers - analytics.returningCustomers,
        percentage: total > 0 ? ((analytics.totalCustomers - analytics.returningCustomers) / total) * 100 : 0,
      },
    ];
  }, [analytics]);

  // Top customers chart data
  const topCustomersChartData = useMemo(() => {
    if (!stats.topCustomers) return [];
    return stats.topCustomers.slice(0, 10).map(customer => ({
      name: customer.customerName.length > 20 
        ? customer.customerName.substring(0, 20) + '...' 
        : customer.customerName,
      fullName: customer.customerName,
      spent: customer.totalSpent,
      orders: customer.totalOrders,
    }));
  }, [stats.topCustomers]);

  if (error) {
    return (
      <Card className="p-6 border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Failed to load customer analytics</p>
            <p className="text-sm text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-400" />
            Customer Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customer lifetime value, segmentation, and insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
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
          label="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          subValue={`${stats.returningCustomers} returning`}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          delay={0}
        />
        <StatsCard
          label="New Customers"
          value={stats.newCustomers.toLocaleString()}
          subValue="Last 30 days"
          icon={<UserPlus className="w-6 h-6" />}
          color="green"
          delay={0.05}
        />
        <StatsCard
          label="Customer Lifetime Value"
          value={formatCurrency(stats.customerLifetimeValue)}
          subValue="Average CLV"
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
          delay={0.1}
        />
        <StatsCard
          label="Order Frequency"
          value={stats.averageOrderFrequency.toFixed(1)}
          subValue="Orders per customer"
          icon={<Target className="w-6 h-6" />}
          color="orange"
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Segmentation */}
        <PieChart
          data={segmentationData}
          title="Customer Segmentation"
          description="Distribution of customer types"
          height={350}
          formatValue={(value) => value.toLocaleString()}
          innerRadius={70}
          outerRadius={120}
          colors={[
            '#10b981', // green - new
            '#3b82f6', // blue - returning
            '#6b7280', // gray - one-time
          ]}
        />

        {/* Top Customers */}
        <BarChart
          data={topCustomersChartData}
          xKey="name"
          bars={[
            {
              dataKey: 'spent',
              name: 'Total Spent',
              color: '#8b5cf6',
            },
          ]}
          title="Top 10 Customers by Spend"
          description="Most valuable customers"
          height={350}
          formatValue={(value) => formatCurrency(value)}
          horizontal={true}
          colorGradient={[
            '#8b5cf6',
            '#a855f7',
            '#c084fc',
            '#d8b4fe',
            '#e9d5ff',
          ]}
        />
      </div>

      {/* Top Customers Table */}
      {stats.topCustomers && stats.topCustomers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.gentle, delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              VIP Customers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Orders</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total Spent</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Avg Order</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Last Order</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topCustomers.map((customer, index) => {
                    const avgOrder = customer.totalOrders > 0 
                      ? customer.totalSpent / customer.totalOrders 
                      : 0;
                    const isVIP = customer.totalSpent > 500;
                    const isWhale = customer.totalSpent > 1000;

                    return (
                      <motion.tr
                        key={customer.customerId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline" 
                            className={
                              index < 3 
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
                                : 'bg-gray-800/50 text-gray-400 border-gray-700'
                            }
                          >
                            {index + 1}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isWhale && <Award className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                            {isVIP && !isWhale && <Star className="w-4 h-4 text-purple-400 fill-purple-400" />}
                            <span className="font-medium text-white">{customer.customerName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-medium text-blue-400">{customer.totalOrders}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-green-400">{formatCurrency(customer.totalSpent)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-purple-400">{formatCurrency(avgOrder)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-muted-foreground">{formatDate(customer.lastOrderDate)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge 
                            variant="outline"
                            className={
                              isWhale 
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              isVIP
                                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }
                          >
                            {isWhale ? 'Whale' : isVIP ? 'VIP' : 'Regular'}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Customer Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springConfigs.gentle, delay: 0.4 }}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {/* Retention Rate */}
          <Card className="p-6 border-green-500/30 bg-green-500/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retention Rate</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {((stats.returningCustomers / stats.totalCustomers) * 100 || 0).toFixed(1)}%
                </p>
              </div>
              <Heart className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.returningCustomers} of {stats.totalCustomers} customers returned
            </p>
          </Card>

          {/* Growth Rate */}
          <Card className="p-6 border-blue-500/30 bg-blue-500/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Growth Rate</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {((stats.newCustomers / stats.totalCustomers) * 100 || 0).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              {stats.newCustomers} new customers in last 30 days
            </p>
          </Card>

          {/* VIP Count */}
          <Card className="p-6 border-purple-500/30 bg-purple-500/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">VIP Customers</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {stats.topCustomers.filter(c => c.totalSpent > 500).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              Customers with €500+ lifetime value
            </p>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

