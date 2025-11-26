import React, { useMemo, useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Target,
  Zap,
  Compare,
  Download,
  RefreshCw
} from 'lucide-react';
import { useDrops } from '../../lib/api/hooks';
import { useRealtimeDrops } from '../../lib/websocket/useRealtimeDrops';
import { motion } from 'framer-motion';

export function DropAnalytics() {
  const { data: dropsResponse, isLoading, refetch } = useDrops({ limit: 100 });
  const drops = dropsResponse?.data || [];
  const [selectedDropsForComparison, setSelectedDropsForComparison] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Real-time updates
  useRealtimeDrops({
    enabled: true,
    onProgressUpdated: (event) => {
      // Analytics will update automatically via query invalidation
      refetch();
    },
  });

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold">Conversion Rates</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1.5 bg-black/25 border border-white/20 rounded-lg text-sm"
            >
              <option value="7d">7 Tage</option>
              <option value="30d">30 Tage</option>
              <option value="90d">90 Tage</option>
              <option value="all">Alle</option>
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="border-blue-500/50 hover:bg-blue-500/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const csv = [
                  ['Drop Name', 'Conversion Rate', 'Revenue', 'Sold', 'Interest'].join(','),
                  ...analytics.conversionRates.map((item: any) => {
                    const drop = drops.find((d: any) => d.id === item.dropId);
                    return [
                      item.dropName,
                      item.rate.toFixed(2),
                      (drop?.revenue || 0).toLocaleString(),
                      (drop?.soldCount || 0),
                      (drop?.interestCount || 0)
                    ].join(',');
                  })
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `drop-analytics-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="border-green-500/50 hover:bg-green-500/20"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {analytics.conversionRates
            .sort((a: any, b: any) => b.rate - a.rate)
            .slice(0, 10)
            .map((item: any) => (
              <motion.div
                key={item.dropId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-black/25 rounded-lg hover:bg-black/35 transition-colors"
              >
                <span className="font-medium">{item.dropName}</span>
                <div className="flex items-center gap-2">
                  {item.rate > analytics.averageConversionRate ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className="font-semibold">{item.rate.toFixed(1)}%</span>
                </div>
              </motion.div>
            ))}
        </div>
      </Card>

      {/* Drop Comparison */}
      {selectedDropsForComparison.size > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Compare className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-semibold">Drop Vergleich</h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedDropsForComparison(new Set())}
            >
              Schließen
            </Button>
          </div>
          <div className="space-y-4">
            {Array.from(selectedDropsForComparison).map(dropId => {
              const drop = drops.find((d: any) => d.id === dropId);
              if (!drop) return null;
              const conversionRate = drop.interestCount > 0 
                ? ((drop.soldCount || 0) / drop.interestCount) * 100 
                : 0;
              return (
                <div key={dropId} className="p-4 bg-black/25 rounded-lg">
                  <h4 className="font-semibold mb-2">{drop.name}</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Revenue:</span>
                      <p className="font-semibold text-green-400">€{(drop.revenue || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sold:</span>
                      <p className="font-semibold">{drop.soldCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Interest:</span>
                      <p className="font-semibold text-blue-400">{drop.interestCount || 0}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conversion:</span>
                      <p className="font-semibold">{conversionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

