import React, { memo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { cn } from '../../utils/cn';
import { 
  ShoppingBag, 
  Package, 
  Tag, 
  Layers, 
  BarChart3, 
  Truck 
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { TabErrorBoundary } from './TabErrorBoundary';
import { ErrorCategory, ErrorSeverity } from '../../lib/error/ErrorManager';
import { Suspense } from 'react';
import { SkeletonCard } from '../ui/Skeleton';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeVariant?: 'default' | 'pulse';
  content: React.ReactNode;
}

interface ShopTabsNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tabs: TabConfig[];
  onTabHover?: (tabId: string) => void;
}

export const ShopTabsNavigation = memo(({ 
  activeTab, 
  onTabChange, 
  tabs,
  onTabHover 
}: ShopTabsNavigationProps) => {
  const handleTabHover = useCallback((tabId: string) => {
    onTabHover?.(tabId);
  }, [onTabHover]);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-8 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-md border border-white/10 rounded-lg p-1 shadow-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "relative transition-all duration-300 hover:bg-white/5 rounded-md",
                isActive && "bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-white shadow-lg shadow-blue-500/20 border border-blue-400/50"
              )}
              onMouseEnter={() => handleTabHover(tab.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span className="font-medium">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "ml-2 h-5 px-1.5 text-xs",
                    tab.badgeVariant === 'pulse' && "animate-pulse",
                    isActive && "bg-blue-500/20 border-blue-400/30"
                  )}
                >
                  {tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
});

ShopTabsNavigation.displayName = 'ShopTabsNavigation';

