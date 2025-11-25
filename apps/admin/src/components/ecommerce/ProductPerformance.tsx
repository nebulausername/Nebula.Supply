import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { BarChart } from '../ui/charts/BarChart';
import { PieChart } from '../ui/charts/PieChart';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  Crown,
  AlertTriangle,
  RefreshCw,
  Download,
  Star,
  Award,
  Target
} from 'lucide-react';
import { useBestsellers, useCategoryPerformance } from '../../lib/api/shopHooks';
import { springConfigs } from '../../utils/springConfigs';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function ProductPerformance() {
  const [bestsellersLimit, setBestsellersLimit] = useState(10);
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  const {
    data: bestsellers,
    isLoading: bestsellersLoading,
    error: bestsellersError,
    refetch: refetchBestsellers
  } = useBestsellers({ limit: bestsellersLimit, ...dateRange });

  const {
    data: categoryPerformance,
    isLoading: categoryLoading,
    error: categoryError,
    refetch: refetchCategory
  } = useCategoryPerformance(dateRange);

  // Bestsellers chart data
  const bestsellersChartData = useMemo(() => {
    if (!bestsellers) return [];
    return bestsellers.map(product => ({
      name: product.productName.length > 25 
        ? product.productName.substring(0, 25) + '...' 
        : product.productName,
      fullName: product.productName,
      revenue: product.totalRevenue,
      sold: product.totalSold,
      orders: product.orders,
    }));
  }, [bestsellers]);

  // Category performance chart data
  const categoryChartData = useMemo(() => {
    if (!categoryPerformance) return [];
    return categoryPerformance.slice(0, 8).map(category => ({
      name: category.categoryName,
      revenue: category.totalRevenue,
      orders: category.totalOrders,
      products: category.totalProducts,
    }));
  }, [categoryPerformance]);

  // Category pie chart data
  const categoryPieData = useMemo(() => {
    if (!categoryPerformance) return [];
    return categoryPerformance.slice(0, 6).map(category => ({
      name: category.categoryName,
      value: category.totalRevenue,
    }));
  }, [categoryPerformance]);

  const handleRefresh = () => {
    refetchBestsellers();
    refetchCategory();
  };

  if (bestsellersError || categoryError) {
    return (
      <Card className="p-6 border-red-500/30">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-medium">Failed to load performance data</p>
            <p className="text-sm text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </Card>
    );
  }

  const isLoading = bestsellersLoading || categoryLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Award className="w-7 h-7 text-purple-400" />
            Product Performance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze bestsellers, trends, and category performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bestsellers Limit Selector */}
          <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1">
            {[10, 20, 50].map((limit) => (
              <Button
                key={limit}
                variant={bestsellersLimit === limit ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBestsellersLimit(limit)}
                className={bestsellersLimit === limit ? 'bg-purple-500/20 text-purple-400' : ''}
              >
                Top {limit}
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

      {/* Bestsellers Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bestsellers Chart */}
        <BarChart
          data={bestsellersChartData}
          xKey="name"
          bars={[
            {
              dataKey: 'revenue',
              name: 'Revenue',
              color: '#8b5cf6',
            },
          ]}
          title="Top Products by Revenue"
          description="Highest earning products"
          height={400}
          formatValue={(value) => formatCurrency(value)}
          horizontal={true}
          colorGradient={[
            '#8b5cf6', // purple-500
            '#a855f7', // purple-400
            '#c084fc', // purple-300
            '#d8b4fe', // purple-200
            '#e9d5ff', // purple-100
          ]}
        />

        {/* Best Performers List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Best Performers
            </h3>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              Top {bestsellersLimit}
            </Badge>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {bestsellers?.map((product, index) => (
              <motion.div
                key={product.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-all border border-white/5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-400' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-700/20 text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">{product.categoryName} • {product.sku}</p>
                    </div>
                  </div>
                  {index < 3 && (
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-sm font-semibold text-green-400">{formatCurrency(product.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sold</p>
                    <p className="text-sm font-semibold text-white">{product.totalSold} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="text-sm font-semibold text-blue-400">{product.orders}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Category Performance Section */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
          <TabsTrigger value="revenue">Category Revenue</TabsTrigger>
          <TabsTrigger value="distribution">Revenue Distribution</TabsTrigger>
        </TabsList>

        {/* Category Revenue Bar Chart */}
        <TabsContent value="revenue" className="mt-6">
          <BarChart
            data={categoryChartData}
            xKey="name"
            bars={[
              {
                dataKey: 'revenue',
                name: 'Revenue',
                color: '#10b981',
              },
            ]}
            title="Revenue by Category"
            description="Compare revenue across product categories"
            height={350}
            formatValue={(value) => formatCurrency(value)}
          />
        </TabsContent>

        {/* Category Pie Chart */}
        <TabsContent value="distribution" className="mt-6">
          <PieChart
            data={categoryPieData}
            title="Revenue Distribution"
            description="Revenue share by category"
            height={400}
            formatValue={(value) => formatCurrency(value)}
            innerRadius={80}
            outerRadius={140}
            colors={[
              '#10b981', // green-500
              '#3b82f6', // blue-500
              '#8b5cf6', // purple-500
              '#f59e0b', // amber-500
              '#ef4444', // red-500
              '#06b6d4', // cyan-500
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Category Performance Table */}
      {categoryPerformance && categoryPerformance.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.gentle, delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              Category Performance Metrics
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Products</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Orders</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Units Sold</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">AOV</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryPerformance.map((category, index) => {
                    const isTop = index < 3;
                    return (
                      <motion.tr
                        key={category.categoryId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isTop && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                            <span className="font-medium text-white">{category.categoryName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-muted-foreground">{category.totalProducts}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-medium text-blue-400">{category.totalOrders.toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-medium text-white">{category.productsSold.toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-green-400">{formatCurrency(category.totalRevenue)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-purple-400">{formatCurrency(category.averageOrderValue)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge 
                            variant="outline" 
                            className={
                              category.totalRevenue > 10000 
                                ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                              category.totalRevenue > 5000
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                'bg-gray-500/10 text-gray-400 border-gray-500/30'
                            }
                          >
                            {category.totalRevenue > 10000 ? 'Excellent' :
                             category.totalRevenue > 5000 ? 'Good' : 'Average'}
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

      {/* Performance Insights */}
      {bestsellers && bestsellers.length > 0 && categoryPerformance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.gentle, delay: 0.4 }}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {/* Top Category */}
            <Card className="p-6 border-green-500/30 bg-green-500/5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Category</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {categoryPerformance[0]?.categoryName}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="text-sm font-semibold text-green-400">
                    {formatCurrency(categoryPerformance[0]?.totalRevenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Products</span>
                  <span className="text-sm font-semibold text-white">
                    {categoryPerformance[0]?.totalProducts || 0}
                  </span>
                </div>
              </div>
            </Card>

            {/* Best Seller */}
            <Card className="p-6 border-purple-500/30 bg-purple-500/5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Best Seller</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {bestsellers[0]?.productName}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-purple-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sold</span>
                  <span className="text-sm font-semibold text-white">
                    {bestsellers[0]?.totalSold.toLocaleString()} units
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="text-sm font-semibold text-green-400">
                    {formatCurrency(bestsellers[0]?.totalRevenue || 0)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Category Count */}
            <Card className="p-6 border-blue-500/30 bg-blue-500/5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Categories</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {categoryPerformance?.length || 0}
                  </p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="text-sm font-semibold text-green-400">
                    {formatCurrency(categoryPerformance?.reduce((sum, c) => sum + c.totalRevenue, 0) || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <span className="text-sm font-semibold text-white">
                    {categoryPerformance?.reduce((sum, c) => sum + c.totalOrders, 0).toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Trophy Icon (Custom)
function Trophy({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

