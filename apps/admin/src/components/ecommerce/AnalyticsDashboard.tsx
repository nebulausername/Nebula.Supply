import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity,
  Users,
  ShoppingBag,
  Euro,
  Star,
  Eye,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  Zap,
  Crown,
  Package,
  Globe,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { SalesAnalytics } from './SalesAnalytics';
import { ProductPerformance } from './ProductPerformance';
import { CustomerAnalytics } from './CustomerAnalytics';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { logger } from '../../lib/logger';

export function AnalyticsDashboard() {
  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('AnalyticsDashboard');
  const { handleError } = useErrorHandler('AnalyticsDashboard');

  // State management
  const [activeTab, setActiveTab] = useState('sales');
  const [timeRange, setTimeRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handlers
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    logger.logUserAction('analytics_tab_changed', { tabId });
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await measureAsync('refresh_analytics', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      logger.logUserAction('analytics_refreshed', { timeRange });
    });
    setIsRefreshing(false);
  }, [timeRange, measureAsync]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
        </TabsList>

        {/* Sales Analytics Tab */}
        <TabsContent value="sales" className="mt-6">
          <SalesAnalytics />
        </TabsContent>

        {/* Product Performance Tab */}
        <TabsContent value="products" className="mt-6">
          <ProductPerformance />
        </TabsContent>

        {/* Customer Analytics Tab */}
        <TabsContent value="customers" className="mt-6">
          <CustomerAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Remove old implementation
const OLD_IMPLEMENTATION = () => {
  const analyticsData = useMemo(() => {
    const totalProducts = products.length;
    const totalCategories = categories.length;
    const totalRevenue = products.reduce((sum, product) => sum + product.price, 0);
    const averageOrderValue = 165.50;
    const conversionRate = 3.2;
    const bounceRate = 45.8;
    const topSellingProduct = products[0];
    const topCategory = categories[0];

    // Generate mock time series data
    const salesData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
      sales: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 10,
      visitors: Math.floor(Math.random() * 2000) + 500
    }));

    // Category performance
    const categoryPerformance = categories.map(category => {
      const categoryProducts = products.filter(p => p.categoryId === category.id);
      const revenue = categoryProducts.reduce((sum, p) => sum + p.price, 0);
      const growth = Math.random() * 40 - 10; // -10% to +30%
      
      return {
        ...category,
        revenue,
        products: categoryProducts.length,
        growth,
        conversionRate: Math.random() * 5 + 1
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Product performance
    const productPerformance = products.map(product => {
      const views = Math.floor(Math.random() * 10000) + 1000;
      const sales = Math.floor(Math.random() * 100) + 1;
      const conversionRate = (sales / views) * 100;
      const revenue = product.price * sales;
      const growth = Math.random() * 60 - 20; // -20% to +40%
      
      return {
        ...product,
        views,
        sales,
        conversionRate,
        revenue,
        growth
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      overview: {
        totalRevenue,
        totalOrders: 1247,
        totalVisitors: 15680,
        conversionRate,
        averageOrderValue,
        bounceRate,
        growth: {
          revenue: 18.5,
          orders: 12.3,
          visitors: -2.1,
          conversion: 0.8
        }
      },
      salesData,
      categoryPerformance,
      productPerformance,
      topSellingProduct,
      topCategory
    };
  }, []);
  
  return null; // Old implementation removed
};