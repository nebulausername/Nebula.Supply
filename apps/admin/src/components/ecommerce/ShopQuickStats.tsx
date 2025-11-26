import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { ShoppingBag, Package, BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Trend {
  value: string;
  color: string;
  icon: React.ReactNode;
  tooltip?: string;
}

interface QuickStat {
  value: string | number;
  isLoading: boolean;
  trend?: Trend;
}

interface QuickStats {
  products: QuickStat;
  inventory: QuickStat;
  categories: QuickStat;
  revenue: QuickStat;
}

interface QuickStatCardProps {
  title: string;
  value: string | number;
  trend?: Trend;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  borderColor: string;
  textColor: string;
  isLoading?: boolean;
}

const QuickStatCard = memo(({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  bgColor, 
  borderColor, 
  textColor,
  isLoading = false
}: QuickStatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    whileHover={{ scale: 1.02, y: -2 }}
  >
    <Card className={`p-6 ${bgColor} border ${borderColor} transition-all duration-300 hover:shadow-lg hover:shadow-${textColor}/20`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-800/50 rounded animate-pulse mt-2" />
          ) : (
            <motion.p 
              className={`text-2xl font-bold ${textColor}`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {value}
            </motion.p>
          )}
        </div>
        <motion.div
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className={`w-8 h-8 ${textColor} opacity-60 ${isLoading ? 'animate-pulse' : ''}`} />
        </motion.div>
      </div>
      {trend && (
        <motion.div 
          className="mt-2 flex items-center text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="h-4 w-20 bg-gray-800/50 rounded animate-pulse" />
          ) : (
            <>
              {trend.icon}
              <span className={trend.color}>{trend.value}</span>
            </>
          )}
        </motion.div>
      )}
    </Card>
  </motion.div>
));
QuickStatCard.displayName = 'QuickStatCard';

interface ShopQuickStatsProps {
  quickStats: QuickStats;
}

export const ShopQuickStats = memo(({ quickStats }: ShopQuickStatsProps) => {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, staggerChildren: 0.1 }}
    >
      <QuickStatCard
        title="Shop Produkte"
        value={quickStats.products.value}
        trend={quickStats.products.trend}
        icon={ShoppingBag}
        bgColor="bg-blue-900/20"
        borderColor="border-blue-500/30"
        textColor="text-blue-400"
        isLoading={quickStats.products.isLoading}
      />
      <QuickStatCard
        title="Lagerbestand"
        value={quickStats.inventory.value}
        trend={quickStats.inventory.trend}
        icon={Package}
        bgColor="bg-orange-900/20"
        borderColor="border-orange-500/30"
        textColor="text-orange-400"
        isLoading={quickStats.inventory.isLoading}
      />
      <QuickStatCard
        title="Kategorien"
        value={quickStats.categories.value}
        trend={quickStats.categories.trend}
        icon={Package}
        bgColor="bg-green-900/20"
        borderColor="border-green-500/30"
        textColor="text-green-400"
        isLoading={quickStats.categories.isLoading}
      />
      <QuickStatCard
        title="Umsatz"
        value={quickStats.revenue.value}
        trend={quickStats.revenue.trend}
        icon={BarChart3}
        bgColor="bg-pink-900/20"
        borderColor="border-pink-500/30"
        textColor="text-pink-400"
        isLoading={quickStats.revenue.isLoading}
      />
    </motion.div>
  );
});

ShopQuickStats.displayName = 'ShopQuickStats';

