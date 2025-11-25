import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDrops, useUpdateDrop, useDeleteDrop } from '../../lib/api/hooks';
import { useRealtimeDrops } from '../../lib/websocket/useRealtimeDrops';
import { useDropStore, useDropSelection } from '../../store/dropStore';
import {
  useDropConfig,
  useDropLayout,
  useDropViewPreferences,
  useDropConfigStore,
} from '../../store/dropConfigStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { DropTableView } from '../drops/DropTableView';
import { DropCardView } from '../drops/DropCardView';
import { DropKanbanView } from '../drops/DropKanbanView';
import { BulkOperations } from '../../features/drops/BulkOperations';
import { calculateDropStats, searchDrops, filterDrops, sortDrops } from '../../lib/dropUtils';
import type { DropFilter, DropSort } from '../../lib/dropUtils';
import {
  Search,
  Filter,
  Settings,
  LayoutGrid,
  LayoutList,
  Columns,
  Plus,
  Download,
  Upload,
  RefreshCw,
  X,
  Zap,
  Wifi,
  WifiOff,
  Radio,
} from 'lucide-react';

export const DropManagementAdvanced: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localFilters, setLocalFilters] = useState<DropFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [editingDrop, setEditingDrop] = useState<any>(null);
  const [viewingDrop, setViewingDrop] = useState<any>(null);

  // Config Store
  const config = useDropConfig();
  const layout = useDropLayout();
  const viewPreferences = useDropViewPreferences();
  const {
    setViewMode,
    toggleCompact,
    setItemsPerPage,
    toggleAutoRefresh,
  } = useDropConfigStore();

  // Drop Store
  const { selectedDrops, toggleSelection, selectAll, clearSelection } = useDropSelection();
  const dropStore = useDropStore();
  const expandedVariants = dropStore.expandedVariants;
  const toggleVariantExpansion = dropStore.toggleVariantExpansion;

  // State for live updates feedback
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [liveUpdateBadge, setLiveUpdateBadge] = useState<{ visible: boolean; type: 'created' | 'updated' | 'deleted' | 'progress' } | null>(null);
  const badgeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup badge timeout on unmount
  useEffect(() => {
    return () => {
      if (badgeTimeoutRef.current) {
        clearTimeout(badgeTimeoutRef.current);
      }
    };
  }, []);

  // Real-time connection - always enabled for admin
  const { isConnected, connectionStatus } = useRealtimeDrops({
    enabled: true, // Always enabled for real-time updates
    filters: {
      status: localFilters.find((f) => f.field === 'status')?.value as string,
    },
    onDropCreated: (event) => {
      setLastUpdateTime(new Date());
      setLiveUpdateBadge({ visible: true, type: 'created' });
      if (badgeTimeoutRef.current) {
        clearTimeout(badgeTimeoutRef.current);
      }
      badgeTimeoutRef.current = setTimeout(() => {
        setLiveUpdateBadge(null);
        badgeTimeoutRef.current = null;
      }, 3000);
      // Refetch to get latest data
      refetch();
    },
    onDropUpdated: (event) => {
      setLastUpdateTime(new Date());
      setLiveUpdateBadge({ visible: true, type: 'updated' });
      if (badgeTimeoutRef.current) {
        clearTimeout(badgeTimeoutRef.current);
      }
      badgeTimeoutRef.current = setTimeout(() => {
        setLiveUpdateBadge(null);
        badgeTimeoutRef.current = null;
      }, 3000);
      // Optimistic update - cache is already updated by the hook
      refetch();
    },
    onDropDeleted: (event) => {
      setLastUpdateTime(new Date());
      setLiveUpdateBadge({ visible: true, type: 'deleted' });
      if (badgeTimeoutRef.current) {
        clearTimeout(badgeTimeoutRef.current);
      }
      badgeTimeoutRef.current = setTimeout(() => {
        setLiveUpdateBadge(null);
        badgeTimeoutRef.current = null;
      }, 3000);
      clearSelection();
      refetch();
    },
    onStockChanged: (event) => {
      setLastUpdateTime(new Date());
      // Stock changes trigger progress updates
      refetch();
    },
    onStatusChanged: (event) => {
      setLastUpdateTime(new Date());
      refetch();
    },
  });

  // Listen for progress updates
  useEffect(() => {
    if (!isConnected) return;

    const wsClient = require('../../lib/websocket/client').getWebSocketClient();
    if (!wsClient) return;

    const handleProgressUpdate = (data: any) => {
      setLastUpdateTime(new Date());
      setLiveUpdateBadge({ visible: true, type: 'progress' });
      if (badgeTimeoutRef.current) {
        clearTimeout(badgeTimeoutRef.current);
      }
      badgeTimeoutRef.current = setTimeout(() => {
        setLiveUpdateBadge(null);
        badgeTimeoutRef.current = null;
      }, 2000);
      // Update cache optimistically
      const queryClient = require('@tanstack/react-query').useQueryClient();
      queryClient.setQueriesData(
        { queryKey: ['drops'] },
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((d: any) => 
              d.id === data.dropId 
                ? { ...d, progress: data.progress, totalStock: data.totalStock, soldCount: data.soldCount }
                : d
            )
          };
        }
      );
    };

    wsClient.on('drop:progress_updated', handleProgressUpdate);

    return () => {
      wsClient.off('drop:progress_updated', handleProgressUpdate);
    };
  }, [isConnected]);

  // Data fetching
  const { data: dropsData, isLoading, error, refetch } = useDrops({
    search: searchTerm,
    limit: viewPreferences.itemsPerPage,
    offset: 0,
  });

  const updateDropMutation = useUpdateDrop();
  const deleteDropMutation = useDeleteDrop();

  // Process drops
  const processedDrops = useMemo(() => {
    let drops = dropsData?.data || [];

    // Apply search
    if (searchTerm) {
      drops = searchDrops(drops, searchTerm);
    }

    // Apply filters
    if (localFilters.length > 0) {
      drops = filterDrops(drops, localFilters);
    }

    // Apply sorting
    if (viewPreferences.sortBy) {
      drops = sortDrops(drops, {
        field: viewPreferences.sortBy,
        direction: viewPreferences.sortDirection,
      });
    }

    return drops;
  }, [dropsData, searchTerm, localFilters, viewPreferences.sortBy, viewPreferences.sortDirection]);

  // Statistics
  const stats = useMemo(() => calculateDropStats(processedDrops), [processedDrops]);

  // Handlers
  const handleSelectDrop = useCallback(
    (dropId: string) => {
      toggleSelection(dropId);
    },
    [toggleSelection]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedDrops.size === processedDrops.length) {
      clearSelection();
    } else {
      selectAll(processedDrops.map((d) => d.id));
    }
  }, [processedDrops, selectedDrops, selectAll, clearSelection]);

  const handleEdit = useCallback((drop: any) => {
    setEditingDrop(drop);
  }, []);

  const handleView = useCallback((drop: any) => {
    setViewingDrop(drop);
  }, []);

  const handleDelete = useCallback(
    async (dropId: string) => {
      if (confirm('Are you sure you want to delete this drop?')) {
        try {
          await deleteDropMutation.mutateAsync(dropId);
          clearSelection();
        } catch (error) {
          console.error('Failed to delete drop:', error);
        }
      }
    },
    [deleteDropMutation, clearSelection]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedDrops.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedDrops.length} drop(s)?`
      )
    ) {
      return;
    }

    try {
      await Promise.all(
        selectedDrops.map((id) => deleteDropMutation.mutateAsync(id))
      );
      clearSelection();
    } catch (error) {
      console.error('Failed to delete drops:', error);
    }
  }, [selectedDrops, deleteDropMutation, clearSelection]);

  const handleBulkStatusUpdate = useCallback(
    async (status: string) => {
      if (selectedDrops.length === 0) return;

      try {
        await Promise.all(
          selectedDrops.map((id) =>
            updateDropMutation.mutateAsync({
              id,
              data: { status },
            })
          )
        );
        clearSelection();
      } catch (error) {
        console.error('Failed to update drops:', error);
      }
    },
    [selectedDrops, updateDropMutation, clearSelection]
  );

  const handleAddFilter = useCallback(() => {
    setLocalFilters([...localFilters, { field: 'status', operator: 'equals', value: '' }]);
  }, [localFilters]);

  const handleRemoveFilter = useCallback(
    (index: number) => {
      setLocalFilters(localFilters.filter((_, i) => i !== index));
    },
    [localFilters]
  );

  const handleViewModeChange = useCallback(
    (mode: 'table' | 'cards' | 'kanban' | 'timeline') => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  // Auto-refresh
  useEffect(() => {
    if (!viewPreferences.autoRefresh || !isConnected) return;

    const interval = setInterval(() => {
      refetch();
    }, viewPreferences.refreshInterval);

    return () => clearInterval(interval);
  }, [viewPreferences.autoRefresh, viewPreferences.refreshInterval, isConnected, refetch]);

  // Render view based on mode
  const renderView = () => {
    const viewProps = {
      drops: processedDrops,
      selectedDrops: new Set(selectedDrops),
      onSelectDrop: handleSelectDrop,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onView: handleView,
    };

    switch (layout.viewMode) {
      case 'cards':
        return <DropCardView {...viewProps} />;
      case 'kanban':
        return <DropKanbanView {...viewProps} />;
      case 'table':
      default:
        return (
          <DropTableView
            {...viewProps}
            onSelectAll={handleSelectAll}
            expandedVariants={expandedVariants}
            onToggleVariant={toggleVariantExpansion}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-neon" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          Error loading drops: {(error as Error).message}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Vape Drops</h1>
            {isConnected ? (
              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-500/10">
                <Wifi className="w-3 h-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-400 border-red-400 bg-red-500/10">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            {liveUpdateBadge?.visible && (
              <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-500/10 animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                {liveUpdateBadge.type === 'created' && 'Neuer Drop'}
                {liveUpdateBadge.type === 'updated' && 'Aktualisiert'}
                {liveUpdateBadge.type === 'deleted' && 'Gelöscht'}
                {liveUpdateBadge.type === 'progress' && 'Progress Update'}
              </Badge>
            )}
          </div>
          <p className="text-muted">Echtzeit-Verwaltung für exklusive Vape Drops</p>
          {lastUpdateTime && (
            <p className="text-xs text-muted-foreground mt-1">
              Letztes Update: {lastUpdateTime.toLocaleTimeString('de-DE')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button className="bg-neon hover:bg-neon/80">
            <Plus className="w-4 h-4 mr-2" />
            Drop erstellen
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted">Active</div>
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted">Stock</div>
          <div className="text-2xl font-bold">{stats.totalStock}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted">Sold</div>
          <div className="text-2xl font-bold">{stats.totalSold}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted">Revenue</div>
          <div className="text-2xl font-bold">€{stats.totalRevenue.toFixed(0)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted">Interest</div>
          <div className="text-2xl font-bold">{stats.totalInterest}</div>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                placeholder="Search drops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={layout.viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('table')}
              title="Table View"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant={layout.viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('cards')}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={layout.viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('kanban')}
              title="Kanban View"
            >
              <Columns className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {localFilters.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {localFilters.length}
              </Badge>
            )}
          </Button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedDrops.length > 0 && (
              <>
                <Badge variant="outline">{selectedDrops.length} selected</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('active')}
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusUpdate('inactive')}
                >
                  Deactivate
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  Delete
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Filters</h3>
              <Button variant="ghost" size="sm" onClick={handleAddFilter}>
                <Plus className="w-4 h-4 mr-1" />
                Add Filter
              </Button>
            </div>
            {localFilters.length === 0 ? (
              <p className="text-sm text-muted">No filters applied</p>
            ) : (
              <div className="space-y-2">
                {localFilters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={filter.field}
                      onChange={(e) => {
                        const newFilters = [...localFilters];
                        newFilters[index].field = e.target.value;
                        setLocalFilters(newFilters);
                      }}
                      className="px-3 py-1 border border-white/10 rounded bg-black/25 text-white text-sm"
                    >
                      <option value="status">Status</option>
                      <option value="access">Access</option>
                      <option value="stock">Stock</option>
                      <option value="revenue">Revenue</option>
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => {
                        const newFilters = [...localFilters];
                        newFilters[index].operator = e.target.value as any;
                        setLocalFilters(newFilters);
                      }}
                      className="px-3 py-1 border border-white/10 rounded bg-black/25 text-white text-sm"
                    >
                      <option value="equals">Equals</option>
                      <option value="contains">Contains</option>
                      <option value="gt">Greater Than</option>
                      <option value="lt">Less Than</option>
                    </select>
                    <Input
                      value={filter.value || ''}
                      onChange={(e) => {
                        const newFilters = [...localFilters];
                        newFilters[index].value = e.target.value;
                        setLocalFilters(newFilters);
                      }}
                      className="flex-1"
                      placeholder="Value"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFilter(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Bulk Operations */}
      {selectedDrops.length > 0 && (
        <BulkOperations drops={processedDrops} onComplete={() => refetch()} />
      )}

      {/* Main Content */}
      <Card className="p-6">
        {renderView()}
      </Card>
    </div>
  );
};

