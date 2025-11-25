import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Target,
  Zap
} from 'lucide-react';
import { useDrops } from '../../lib/api/hooks';

export function DropAnalytics() {
  const { data: dropsResponse, isLoading } = useDrops({ limit: 100 });
  const drops = dropsResponse?.data || [];

  const analytics = useMemo(() => {
    if (!drops || drops.length === 0) {
      return {
        totalRevenue: 0,
        totalDrops: 0,
        totalInterest: 0,
        totalSold: 0,
        averageConversionRate: 0,
        topDrops: [],
        revenueByStatus: {},
        conversionRates: []
      };
    }

    const totalRevenue = drops.reduce((sum: number, drop: any) => sum + (drop.revenue || 0), 0);
    const totalInterest = drops.reduce((sum: number, drop: any) => sum + (drop.interestCount || 0), 0);
    const totalSold = drops.reduce((sum: number, drop: any) => sum + (drop.soldCount || 0), 0);
    
    const conversionRates = drops
      .map((drop: any) => {
        const rate = drop.interestCount > 0 ? ((drop.soldCount || 0) / drop.interestCount) * 100 : 0;
        return { dropId: drop.id, dropName: drop.name, rate };
      })
      .filter((item: any) => item.rate > 0);

    const averageConversionRate = conversionRates.length > 0
      ? conversionRates.reduce((sum: number, item: any) => sum + item.rate, 0) / conversionRates.length
      : 0;

    const topDrops = [...drops]
      .sort((a: any, b: any) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 5);

    const revenueByStatus = drops.reduce((acc: any, drop: any) => {
      const status = drop.status || 'unknown';
      acc[status] = (acc[status] || 0) + (drop.revenue || 0);
      return acc;
    }, {});

    return {
      totalRevenue,
      totalDrops: drops.length,
      totalInterest,
      totalSold,
      averageConversionRate,
      topDrops,
      revenueByStatus,
      conversionRates
    };
  }, [drops]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-32 bg-gray-800/50 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                €{analytics.totalRevenue.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400 opacity-60" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Drops</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {analytics.totalDrops}
              </p>
            </div>
            <Zap className="w-8 h-8 text-blue-400 opacity-60" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Interest</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {analytics.totalInterest.toLocaleString()}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-400 opacity-60" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Conversion</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">
                {analytics.averageConversionRate.toFixed(1)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-orange-400 opacity-60" />
          </div>
        </Card>
      </div>

      {/* Top Drops */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-semibold">Top Performing Drops</h3>
        </div>
        <div className="space-y-4">
          {analytics.topDrops.map((drop: any, index: number) => {
            const conversionRate = drop.interestCount > 0 
              ? ((drop.soldCount || 0) / drop.interestCount) * 100 
              : 0;
            
            return (
              <div key={drop.id} className="flex items-center justify-between p-4 bg-black/25 rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{drop.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Revenue: €{(drop.revenue || 0).toLocaleString()}</span>
                      <span>Sold: {drop.soldCount || 0}</span>
                      <span>Conversion: {conversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <Badge variant={drop.status === 'active' ? 'success' : 'outline'}>
                  {drop.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Revenue by Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-pink-400" />
          <h3 className="text-xl font-semibold">Revenue by Status</h3>
        </div>
        <div className="space-y-3">
          {Object.entries(analytics.revenueByStatus).map(([status, revenue]: [string, any]) => {
            const percentage = analytics.totalRevenue > 0 
              ? (revenue / analytics.totalRevenue) * 100 
              : 0;
            
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  <span className="font-semibold">€{revenue.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Conversion Rates */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold">Conversion Rates</h3>
        </div>
        <div className="space-y-3">
          {analytics.conversionRates
            .sort((a: any, b: any) => b.rate - a.rate)
            .slice(0, 10)
            .map((item: any) => (
              <div key={item.dropId} className="flex items-center justify-between p-3 bg-black/25 rounded-lg">
                <span className="font-medium">{item.dropName}</span>
                <div className="flex items-center gap-2">
                  {item.rate > analytics.averageConversionRate ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className="font-semibold">{item.rate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

