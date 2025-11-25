import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToastHelpers } from '../../components/ui/Toast';
import { getRealtimeClient, RealtimeEvent, SystemHealth } from '../../lib/realtime';
import { logger } from '../../lib/logger';

interface RealtimeData {
  orders: RealtimeEvent[];
  inventory: RealtimeEvent[];
  systemHealth: SystemHealth | null;
  lastUpdate: Date | null;
}

interface RealtimePanelProps {
  className?: string;
}

export const RealtimePanel: React.FC<RealtimePanelProps> = ({ className }) => {
  const [data, setData] = useState<RealtimeData>({
    orders: [],
    inventory: [],
    systemHealth: null,
    lastUpdate: null
  });
  const [isPaused, setIsPaused] = useState(false);
  const [timeWindow, setTimeWindow] = useState<'1m' | '5m' | '15m' | '1h'>('5m');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { error: showError, info: showInfo } = useToastHelpers();

  const realtimeClient = getRealtimeClient();

  // Filter events by time window
  const getTimeWindowMs = (window: string): number => {
    switch (window) {
      case '1m': return 60 * 1000;
      case '5m': return 5 * 60 * 1000;
      case '15m': return 15 * 60 * 1000;
      case '1h': return 60 * 60 * 1000;
      default: return 5 * 60 * 1000;
    }
  };

  const filterEventsByTime = useCallback((events: RealtimeEvent[]) => {
    const cutoff = Date.now() - getTimeWindowMs(timeWindow);
    return events.filter(event => new Date(event.timestamp).getTime() > cutoff);
  }, [timeWindow]);

  // Handle realtime events
  const handleRealtimeEvent = useCallback((event: RealtimeEvent) => {
    if (isPaused) return;

    setData(prev => {
      const newData = { ...prev };
      
      switch (event.type) {
        case 'order_created':
        case 'order_updated':
        case 'order_status_changed':
          newData.orders = [event, ...prev.orders].slice(0, 100); // Keep last 100
          break;
        case 'inventory_updated':
        case 'stock_changed':
          newData.inventory = [event, ...prev.inventory].slice(0, 100);
          break;
        case 'system_health':
          newData.systemHealth = event.data;
          break;
      }
      
      newData.lastUpdate = new Date();
      return newData;
    });
  }, [isPaused]);

  // Handle connection status changes
  const handleConnectionStatus = useCallback((status: any) => {
    if (!status.connected && !status.reconnecting) {
      showError('Realtime Connection Lost', 'Live updates are unavailable. Some features may not work correctly.');
    } else if (status.connected && status.reconnecting) {
      showInfo('Realtime Reconnected', 'Live updates have been restored.');
    }
  }, [showError, showInfo]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!realtimeClient) return;

    // Subscribe to events
    realtimeClient.on('realtime_event', handleRealtimeEvent);
    realtimeClient.on('status', handleConnectionStatus);

    // Subscribe to data streams
    realtimeClient.subscribeToOrders();
    realtimeClient.subscribeToInventory();
    realtimeClient.subscribeToSystemHealth();

    // Setup online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      realtimeClient.off('realtime_event', handleRealtimeEvent);
      realtimeClient.off('status', handleConnectionStatus);
      realtimeClient.unsubscribeFromOrders();
      realtimeClient.unsubscribeFromInventory();
      realtimeClient.unsubscribeFromSystemHealth();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [realtimeClient, handleRealtimeEvent, handleConnectionStatus]);

  // Clear old events periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setData(prev => ({
          ...prev,
          orders: filterEventsByTime(prev.orders),
          inventory: filterEventsByTime(prev.inventory)
        }));
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isPaused, filterEventsByTime]);

  const togglePause = () => {
    setIsPaused(!isPaused);
    logger.logUserAction('realtime_panel_toggle_pause', { paused: !isPaused });
  };

  const clearData = () => {
    setData({
      orders: [],
      inventory: [],
      systemHealth: data.systemHealth,
      lastUpdate: null
    });
    logger.logUserAction('realtime_panel_clear_data');
  };

  const getHealthStatusColor = (health: SystemHealth | null) => {
    if (!health) return 'bg-gray-500';
    switch (health.status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatEventTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Realtime Dashboard</h3>
            <div className="flex items-center gap-2">
              <Badge 
                className={`${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              {realtimeClient?.isConnected && (
                <Badge className="bg-blue-500">
                  Connected
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value as any)}
              className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
            >
              <option value="1m">Last 1 minute</option>
              <option value="5m">Last 5 minutes</option>
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
            </select>
            
            <Button
              onClick={togglePause}
              variant={isPaused ? "outline" : "default"}
              size="sm"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            
            <Button
              onClick={clearData}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </div>
        </div>
        
        {data.lastUpdate && (
          <p className="text-sm text-gray-400 mt-2">
            Last update: {data.lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </Card>

      {/* System Health */}
      {data.systemHealth && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">System Health</h4>
            <Badge className={getHealthStatusColor(data.systemHealth)}>
              {data.systemHealth.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Uptime</p>
              <p className="font-mono">{Math.floor(data.systemHealth.uptime / 3600)}h</p>
            </div>
            <div>
              <p className="text-gray-400">Memory</p>
              <p className="font-mono">{data.systemHealth.memory.percentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400">CPU</p>
              <p className="font-mono">{data.systemHealth.cpu.usage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-400">Database</p>
              <p className="font-mono">{data.systemHealth.database.connected ? 'OK' : 'ERR'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Orders Stream */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Recent Orders</h4>
          <Badge className="bg-blue-500">
            {filterEventsByTime(data.orders).length}
          </Badge>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filterEventsByTime(data.orders).length === 0 ? (
            <p className="text-gray-400 text-sm">No recent order activity</p>
          ) : (
            filterEventsByTime(data.orders).map((event, index) => (
              <div key={`${event.timestamp}-${index}`} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                <div>
                  <p className="text-sm font-medium">{event.type.replace(/_/g, ' ')}</p>
                  {event.data?.orderId && (
                    <p className="text-xs text-gray-400">Order #{event.data.orderId.slice(-8)}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400">{formatEventTime(event.timestamp)}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Inventory Stream */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Inventory Changes</h4>
          <Badge className="bg-green-500">
            {filterEventsByTime(data.inventory).length}
          </Badge>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filterEventsByTime(data.inventory).length === 0 ? (
            <p className="text-gray-400 text-sm">No recent inventory changes</p>
          ) : (
            filterEventsByTime(data.inventory).map((event, index) => (
              <div key={`${event.timestamp}-${index}`} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                <div>
                  <p className="text-sm font-medium">{event.type.replace(/_/g, ' ')}</p>
                  {event.data?.productId && (
                    <p className="text-xs text-gray-400">Product #{event.data.productId.slice(-8)}</p>
                  )}
                  {event.data?.quantity && (
                    <p className="text-xs text-gray-400">Qty: {event.data.quantity}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400">{formatEventTime(event.timestamp)}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};



