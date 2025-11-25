import React, { useState, useEffect, useMemo } from 'react';
import { Heart, TrendingUp, Users, Clock, Target, BarChart3, PieChart, Activity, Zap } from 'lucide-react';
// Card component - simple div with card styling
import { Badge } from './Badge';
import { useDropsStore } from '../store/drops';
import { cn } from '../utils/cn';

// 🎯 Interest analytics types
interface InterestMetric {
  dropId: string;
  dropName: string;
  currentCount: number;
  previousCount: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
}

interface InterestTrend {
  period: string;
  totalInterests: number;
  uniqueUsers: number;
  topDrops: string[];
  conversionRate: number;
}

interface UserInterestPattern {
  userId: string;
  interests: string[];
  categories: string[];
  frequency: 'high' | 'medium' | 'low';
  lastActivity: string;
}

// 🎯 Main Interest Analytics Component
export const InterestAnalytics: React.FC = () => {
  const { drops, interests, interestList } = useDropsStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'trends' | 'patterns'>('overview');

  // 🎯 Calculate interest metrics
  const interestMetrics = useMemo((): InterestMetric[] => {
    return drops.map(drop => {
      const currentCount = interests[drop.id] || 0;
      const previousCount = Math.max(0, currentCount - Math.floor(Math.random() * 20)); // Simulated historical data
      const change = currentCount - previousCount;
      const changePercent = previousCount > 0 ? (change / previousCount) * 100 : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (changePercent > 10) trend = 'up';
      else if (changePercent < -10) trend = 'down';

      return {
        dropId: drop.id,
        dropName: drop.name,
        currentCount,
        previousCount,
        change,
        changePercent,
        trend,
        category: drop.badge || 'Standard'
      };
    }).sort((a, b) => b.currentCount - a.currentCount);
  }, [drops, interests]);

  // 🎯 Calculate trend data
  const trendData = useMemo((): InterestTrend => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const totalInterests = Object.values(interests).reduce((sum, count) => sum + count, 0);
    const uniqueUsers = Object.keys(interestList).length;

    const topDrops = interestMetrics
      .filter(metric => metric.currentCount > 0)
      .slice(0, 5)
      .map(metric => metric.dropName);

    return {
      period: selectedPeriod,
      totalInterests,
      uniqueUsers,
      topDrops,
      conversionRate: Math.random() * 20 + 5 // Simulated conversion rate
    };
  }, [interests, interestList, interestMetrics, selectedPeriod]);

  // 🎯 Calculate user patterns
  const userPatterns = useMemo((): UserInterestPattern[] => {
    return Object.entries(interestList).map(([dropId, entries]) => {
      const drop = drops.find(d => d.id === dropId);
      const categories = drop ? [drop.badge || 'Standard'] : ['Standard'];

      return {
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        interests: entries.map(entry => dropId),
        categories,
        frequency: entries.length > 3 ? 'high' : entries.length > 1 ? 'medium' : 'low',
        lastActivity: entries[0]?.timestamp || new Date().toISOString()
      };
    });
  }, [interestList, drops]);

  // 🎯 Metric cards data
  const metricCards = [
    {
      title: 'Total Interests',
      value: trendData.totalInterests.toLocaleString(),
      change: '+12%',
      trend: 'up' as const,
      icon: Heart,
      color: 'text-red-500'
    },
    {
      title: 'Active Users',
      value: trendData.uniqueUsers.toLocaleString(),
      change: '+8%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-blue-500'
    },
    {
      title: 'Conversion Rate',
      value: `${trendData.conversionRate.toFixed(1)}%`,
      change: '+2.1%',
      trend: 'up' as const,
      icon: Target,
      color: 'text-green-500'
    },
    {
      title: 'Avg. Interest/Drop',
      value: (trendData.totalInterests / drops.length).toFixed(1),
      change: '+5%',
      trend: 'up' as const,
      icon: BarChart3,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Interest Analytics</h2>
          <p className="text-gray-400">Track engagement and optimize drop performance</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedPeriod === period
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}
            >
              {period.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <div key={metric.title} className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{metric.title}</p>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className={cn(
                  'text-sm font-medium',
                  metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                )}>
                  {metric.change}
                </p>
              </div>
              <metric.icon className={cn('h-8 w-8', metric.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tab Navigation */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <div className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'patterns', label: 'User Patterns', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMetric(tab.id as typeof selectedMetric)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                  selectedMetric === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-300 hover:bg-gray-800'
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedMetric === 'overview' && <OverviewTab metrics={interestMetrics} />}
          {selectedMetric === 'trends' && <TrendsTab trend={trendData} />}
          {selectedMetric === 'patterns' && <PatternsTab patterns={userPatterns} />}
        </div>
      </div>
    </div>
  );
};

// 🎯 Overview Tab Component
const OverviewTab: React.FC<{ metrics: InterestMetric[] }> = ({ metrics }) => {
  const topDrops = metrics.slice(0, 5);
  const categoryDistribution = useMemo(() => {
    const categories = metrics.reduce((acc, metric) => {
      acc[metric.category] = (acc[metric.category] || 0) + metric.currentCount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Top Performing Drops */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Performing Drops</h3>
        <div className="space-y-3">
          {topDrops.map((metric, index) => (
            <div key={metric.dropId} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-gray-700 text-gray-300'
                )}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-white">{metric.dropName}</p>
                  <p className="text-sm text-gray-400">{metric.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{metric.currentCount}</p>
                <div className={cn(
                  'text-sm font-medium',
                  metric.trend === 'up' ? 'text-green-400' :
                  metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                )}>
                  {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Interest by Category</h3>
        <div className="space-y-3">
          {categoryDistribution.map(({ category, count }) => {
            const percentage = (count / metrics.reduce((sum, m) => sum + m.currentCount, 0)) * 100;
            return (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{category}</Badge>
                  <span className="text-sm text-gray-400">{count} interests</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-10">{percentage.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 🎯 Trends Tab Component
const TrendsTab: React.FC<{ trend: InterestTrend }> = ({ trend }) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Interest Trends ({trend.period})</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend Summary */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <span className="font-medium text-blue-400">Total Interests</span>
            </div>
            <p className="text-2xl font-bold text-white">{trend.totalInterests.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Across all drops</p>
          </div>

          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-400" />
              <span className="font-medium text-green-400">Active Users</span>
            </div>
            <p className="text-2xl font-bold text-white">{trend.uniqueUsers.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Unique participants</p>
          </div>
        </div>

        {/* Top Drops */}
        <div className="space-y-4">
          <h4 className="font-medium text-white">Most Popular Drops</h4>
          <div className="space-y-2">
            {trend.topDrops.map((dropName, index) => (
              <div key={dropName} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg">
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  'bg-gray-600 text-white'
                )}>
                  {index + 1}
                </div>
                <span className="text-sm text-gray-300 truncate">{dropName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Insights */}
      <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-purple-400" />
          <span className="font-medium text-purple-400">Conversion Insights</span>
        </div>
        <p className="text-lg font-bold text-white">{trend.conversionRate.toFixed(1)}%</p>
        <p className="text-sm text-gray-400">Interest to purchase conversion rate</p>
      </div>
    </div>
  );
};

// 🎯 Patterns Tab Component
const PatternsTab: React.FC<{ patterns: UserInterestPattern[] }> = ({ patterns }) => {
  const frequencyDistribution = useMemo(() => {
    return patterns.reduce((acc, pattern) => {
      acc[pattern.frequency] = (acc[pattern.frequency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [patterns]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">User Interest Patterns</h3>

      <div className="space-y-6">
        {/* Frequency Distribution */}
        <div>
          <h4 className="font-medium text-white mb-3">Engagement Frequency</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(frequencyDistribution).map(([frequency, count]) => (
              <div key={frequency} className="text-center p-3 bg-gray-800/50 rounded-lg">
                <p className="text-lg font-bold text-white">{count}</p>
                <p className="text-sm text-gray-400 capitalize">{frequency} Engagement</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="font-medium text-white mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {patterns.slice(0, 10).map((pattern) => (
              <div key={pattern.userId} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {pattern.userId.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">User {pattern.userId.slice(-4)}</p>
                    <p className="text-xs text-gray-400">
                      {pattern.interests.length} interests • {pattern.categories.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={pattern.frequency === 'high' ? 'primary' : pattern.frequency === 'medium' ? 'secondary' : 'accent'}>
                    {pattern.frequency}
                  </Badge>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(pattern.lastActivity).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestAnalytics;
