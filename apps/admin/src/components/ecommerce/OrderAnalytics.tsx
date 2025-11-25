import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Order } from '../../lib/api/ecommerce';
import { TrendingUp, TrendingDown, DollarSign, Package, Users } from 'lucide-react';

interface OrderAnalyticsProps {
  orders: Order[];
  className?: string;
}

export function OrderAnalytics({ orders, className }: OrderAnalyticsProps) {
  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    const statusDistribution = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const revenueByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate trends (comparing last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    });
    const previous7Days = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
             orderDate < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    });

    const last7DaysRevenue = last7Days.reduce((sum, order) => sum + order.totalAmount, 0);
    const previous7DaysRevenue = previous7Days.reduce((sum, order) => sum + order.totalAmount, 0);
    const revenueTrend = previous7DaysRevenue > 0 
      ? ((last7DaysRevenue - previous7DaysRevenue) / previous7DaysRevenue) * 100 
      : 0;

    const orderCountTrend = previous7Days.length > 0
      ? ((last7Days.length - previous7Days.length) / previous7Days.length) * 100
      : 0;

    // Top customers
    const customerOrders = orders.reduce((acc, order) => {
      if (!acc[order.customerId]) {
        acc[order.customerId] = {
          name: order.customerName,
          email: order.customerEmail,
          orderCount: 0,
          totalSpent: 0,
        };
      }
      acc[order.customerId].orderCount += 1;
      acc[order.customerId].totalSpent += order.totalAmount;
      return acc;
    }, {} as Record<string, { name: string; email: string; orderCount: number; totalSpent: number }>);

    const topCustomers = Object.values(customerOrders)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalRevenue,
      averageOrderValue,
      statusDistribution,
      revenueByStatus,
      revenueTrend,
      orderCountTrend,
      topCustomers,
      totalOrders: orders.length,
    };
  }, [orders]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Revenue</p>
              <p className="text-2xl font-bold">€{analytics.totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            {analytics.revenueTrend >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400">+{analytics.revenueTrend.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-red-400">{analytics.revenueTrend.toFixed(1)}%</span>
              </>
            )}
            <span className="text-muted">vs last week</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Orders</p>
              <p className="text-2xl font-bold">{analytics.totalOrders}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm">
            {analytics.orderCountTrend >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-green-400">+{analytics.orderCountTrend.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-red-400">{analytics.orderCountTrend.toFixed(1)}%</span>
              </>
            )}
            <span className="text-muted">vs last week</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Average Order Value</p>
              <p className="text-2xl font-bold">€{analytics.averageOrderValue.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Top Customers</p>
              <p className="text-2xl font-bold">{analytics.topCustomers.length}</p>
            </div>
            <Users className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.statusDistribution).map(([status, count]) => {
              const percentage = (count / analytics.totalOrders) * 100;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm capitalize">{status}</span>
                    <span className="text-sm font-medium">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Status</h3>
          <div className="space-y-3">
            {Object.entries(analytics.revenueByStatus).map(([status, revenue]) => {
              const percentage = (revenue / analytics.totalRevenue) * 100;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm capitalize">{status}</span>
                    <span className="text-sm font-medium">€{revenue.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top Customers */}
      {analytics.topCustomers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <div className="space-y-3">
            {analytics.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-white/10 rounded">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted">{customer.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">€{customer.totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-muted">{customer.orderCount} orders</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

