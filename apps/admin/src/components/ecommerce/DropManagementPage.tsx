import React, { useState, useCallback, Suspense, lazy } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Zap, 
  Search, 
  Grid3X3,
  List,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Timer,
  Flame,
  Users,
  Package,
  Sparkles,
  Loader2
} from 'lucide-react';
import { DropManagement } from './DropManagementOptimized';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { useDebounce } from '../../lib/hooks/useDebounce';
import { logger } from '../../lib/logger';
import { TabErrorBoundary } from './TabErrorBoundary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { useDrops, useUpdateDrop } from '../../lib/api/hooks';

// Lazy load drop management components for better code splitting with error handling
const DropScheduler = lazy(() => 
  import('./DropScheduler')
    .then(m => ({ default: m.DropScheduler }))
    .catch(err => {
      logger.error('Failed to load DropScheduler', { error: err });
      return { default: () => <div className="p-4 text-muted-foreground">DropScheduler konnte nicht geladen werden</div> };
    })
);
const DropManagementLive = lazy(() => 
  import('./DropManagementLive')
    .then(m => ({ default: m.DropManagementLive }))
    .catch(err => {
      logger.error('Failed to load DropManagementLive', { error: err });
      return { default: () => <div className="p-4 text-muted-foreground">DropManagementLive konnte nicht geladen werden</div> };
    })
);
const DropProductSync = lazy(() => 
  import('./DropProductSync')
    .then(m => ({ default: m.DropProductSync }))
    .catch(err => {
      logger.error('Failed to load DropProductSync', { error: err });
      return { default: () => <div className="p-4 text-muted-foreground">DropProductSync konnte nicht geladen werden</div> };
    })
);
const DropAnalytics = lazy(() => 
  import('./DropAnalytics')
    .then(m => ({ default: m.DropAnalytics }))
    .catch(err => {
      logger.error('Failed to load DropAnalytics', { error: err });
      return { default: () => <div className="p-4 text-muted-foreground">DropAnalytics konnte nicht geladen werden</div> };
    })
);
const ShippingConfigForm = lazy(() => 
  import('./ShippingConfigForm')
    .then(m => ({ default: m.ShippingConfigForm }))
    .catch(err => {
      logger.error('Failed to load ShippingConfigForm', { error: err });
      return { default: () => <div className="p-4 text-muted-foreground">ShippingConfigForm konnte nicht geladen werden</div> };
    })
);

// Shipping Config Tab Component
function ShippingConfigTab() {
  const { data: dropsResponse } = useDrops({ limit: 100 });
  const drops = dropsResponse?.data || [];
  const [selectedDropId, setSelectedDropId] = React.useState<string | null>(
    drops.length > 0 ? drops[0]?.id : null
  );
  const updateDropMutation = useUpdateDrop();

  const selectedDrop = Array.isArray(drops) ? drops.find((d: any) => d && d.id === selectedDropId) : null;

  const handleSaveShipping = async (updatedOptions: any[]) => {
    if (!selectedDrop) return;
    
    try {
      await updateDropMutation.mutateAsync({
        id: selectedDrop.id,
        data: {
          shipping: updatedOptions
        }
      });
    } catch (error) {
      console.error('Error updating shipping config:', error);
    }
  };

  React.useEffect(() => {
    if (drops.length > 0 && !selectedDropId) {
      setSelectedDropId(drops[0]?.id);
    }
  }, [drops, selectedDropId]);

  if (drops.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p>Keine Drops verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drop Selector */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Drop auswählen
        </label>
        <select
          value={selectedDropId || ''}
          onChange={(e) => setSelectedDropId(e.target.value)}
          className="w-full px-3 py-2 bg-black/25 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {drops.map((drop: any) => (
            <option key={drop.id} value={drop.id}>
              {drop.name}
            </option>
          ))}
        </select>
      </div>

      {/* Shipping Config Form */}
      {selectedDrop && (
        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        }>
          <ShippingConfigForm
            shippingOptions={selectedDrop.shippingOptions || []}
            onSave={handleSaveShipping}
            type="drop"
          />
        </Suspense>
      )}
    </div>
  );
}

export function DropManagementPage() {
  // Performance monitoring
  const { measureAsync } = usePerformanceMonitor('DropManagementPage');
  const { handleError } = useErrorHandler('DropManagementPage');

  // State management
  const [activeTab, setActiveTab] = useState<string>('drops');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dropSearchTerm, setDropSearchTerm] = useState('');
  const debouncedDropSearchTerm = useDebounce(dropSearchTerm, 300);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await measureAsync('refresh_data', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      logger.logUserAction('drop_data_refreshed');
    });
    setIsRefreshing(false);
  }, [measureAsync]);

  const handleDropSearch = useCallback((term: string) => {
    setDropSearchTerm(term);
    logger.logUserAction('drop_search', { term });
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
    logger.logUserAction('view_mode_changed', { mode, area: 'drops' });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            Drop Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Verwalte deine exklusiven Vape Drops, Limited Editions und Scheduled Releases
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="min-w-32"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Aktualisiere...' : 'Aktualisieren'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-purple-900/20 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Aktive Drops</p>
              <p className="text-2xl font-bold text-purple-400">8</p>
            </div>
            <Zap className="w-8 h-8 text-purple-400 opacity-60" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <Flame className="w-4 h-4 text-orange-400 mr-1" />
            <span className="text-orange-400">3 Live</span>
          </div>
        </Card>

        <Card className="p-6 bg-pink-900/20 border border-pink-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Drop Revenue</p>
              <p className="text-2xl font-bold text-pink-400">€38.2K</p>
            </div>
            <TrendingUp className="w-8 h-8 text-pink-400 opacity-60" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-green-400">+24%</span>
            <span className="text-muted-foreground ml-1">diesen Monat</span>
          </div>
        </Card>

        <Card className="p-6 bg-orange-900/20 border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Interesse</p>
              <p className="text-2xl font-bold text-orange-400">1.2K</p>
            </div>
            <Users className="w-8 h-8 text-orange-400 opacity-60" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <Sparkles className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-yellow-400">518 neue</span>
          </div>
        </Card>

        <Card className="p-6 bg-blue-900/20 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold text-blue-400">5</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400 opacity-60" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <Timer className="w-4 h-4 text-yellow-400 mr-1" />
            <span className="text-yellow-400">3 starten bald</span>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
          <TabsTrigger value="drops">Drops</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
          <TabsTrigger value="shipping">Versand</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Drops Tab */}
        <TabsContent value="drops" className="mt-6">
          <Card className="p-6 bg-purple-900/20 border border-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-purple-400" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Vape Drops</h2>
                  <p className="text-sm text-muted-foreground">
                    Verwalte exklusive Limited Edition Drops und Scheduled Releases
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewModeChange('grid')}
                  className={viewMode === 'grid' ? 'bg-purple-500/20 border-purple-500' : ''}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewModeChange('list')}
                  className={viewMode === 'list' ? 'bg-purple-500/20 border-purple-500' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  <Flame className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </div>
            </div>

            {/* Drop Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Drops durchsuchen..."
                  value={dropSearchTerm}
                  onChange={(e) => handleDropSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/25 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <TabErrorBoundary tabName="Drops">
              <DropManagement viewMode={viewMode} searchTerm={debouncedDropSearchTerm} />
              
              <div className="mt-4">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                }>
                  <DropManagementLive />
                </Suspense>
              </div>
            </TabErrorBoundary>
          </Card>
        </TabsContent>

        {/* Scheduler Tab */}
        <TabsContent value="scheduler" className="mt-6">
          <Card className="p-6 bg-blue-900/20 border border-blue-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Drop Scheduler</h2>
                  <p className="text-sm text-muted-foreground">
                    Plane und verwalte zukünftige Drop-Releases
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                <Timer className="w-3 h-3 mr-1" />
                5 Scheduled
              </Badge>
            </div>

            <TabErrorBoundary tabName="Scheduler">
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              }>
                <DropScheduler />
              </Suspense>
            </TabErrorBoundary>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="mt-6">
          <Card className="p-6 bg-green-900/20 border border-green-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-green-400" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Drop ↔ Product Sync</h2>
                  <p className="text-sm text-muted-foreground">
                    Synchronisiere Drops mit Shop-Produkten
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Aktiv
              </Badge>
            </div>

            <TabErrorBoundary tabName="Sync">
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-400" />
                </div>
              }>
                <DropProductSync />
              </Suspense>
            </TabErrorBoundary>
          </Card>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping" className="mt-6">
          <Card className="p-6 bg-blue-900/20 border border-blue-500/30">
            <TabErrorBoundary tabName="Shipping">
              <ShippingConfigTab />
            </TabErrorBoundary>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <Card className="p-6 bg-pink-900/20 border border-pink-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-pink-400" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Drop Analytics</h2>
                  <p className="text-sm text-muted-foreground">
                    Performance-Metriken und Conversion-Analysen
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-pink-400 border-pink-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                +24% Wachstum
              </Badge>
            </div>

            <TabErrorBoundary tabName="Analytics">
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                </div>
              }>
                <DropAnalytics />
              </Suspense>
            </TabErrorBoundary>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Default export for dynamic imports
export default DropManagementPage;

