import { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Clock, Activity } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useConnectionPool } from '../../lib/realtime/hooks/useConnectionPool';
import { getConnectionPool } from '../../lib/realtime/connectionPool';
import { useLiveUpdates } from '../../lib/store/dashboard';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';

export const ConnectionStatus = memo(function ConnectionStatus() {
  const { liveUpdates } = useLiveUpdates();
  const { connectionStatus, metrics } = useConnectionPool('ConnectionStatus', { enabled: true });

  const statusInfo = useMemo(() => {
    if (connectionStatus.connected) {
      return {
        label: 'Connected',
        color: 'text-green-400',
        bg: 'bg-green-500/20',
        border: 'border-green-500/30',
        icon: Wifi,
        pulse: true,
      };
    } else if (connectionStatus.reconnecting) {
      return {
        label: 'Connecting',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
        icon: RefreshCw,
        pulse: true,
      };
    } else {
      return {
        label: 'Disconnected',
        color: 'text-red-400',
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        icon: WifiOff,
        pulse: false,
      };
    }
  }, [connectionStatus]);

  const handleReconnect = useCallback(() => {
    const pool = getConnectionPool();
    const client = pool.getClient();
    if (client && !client.isConnected) {
      client.connect();
      logger.info('Manual reconnect triggered');
    }
  }, []);

  const connectionQuality = useMemo(() => {
    if (!metrics.latency) return 'Unknown';
    if (metrics.latency < 100) return 'Excellent';
    if (metrics.latency < 300) return 'Good';
    if (metrics.latency < 500) return 'Fair';
    return 'Poor';
  }, [metrics.latency]);

  const Icon = statusInfo.icon;

  return (
    <Card className={cn('p-4 border', statusInfo.border, statusInfo.bg)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={statusInfo.pulse ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon className={cn('w-5 h-5', statusInfo.color)} />
            </motion.div>
            <h3 className="text-sm font-semibold">WebSocket Status</h3>
            <Badge 
              variant={connectionStatus.connected ? 'success' : connectionStatus.reconnecting ? 'warning' : 'error'}
              className="text-xs"
            >
              {statusInfo.label}
            </Badge>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            {liveUpdates ? (
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-green-400" />
                <span>Auto-refresh enabled</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-gray-400" />
                <span>Auto-refresh disabled</span>
              </div>
            )}

            {metrics.latency > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Latency: {metrics.latency}ms ({connectionQuality})</span>
              </div>
            )}

            {metrics.reconnectCount > 0 && (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3" />
                <span>Reconnects: {metrics.reconnectCount}</span>
              </div>
            )}
          </div>
        </div>

        {!connectionStatus.connected && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReconnect}
            className="ml-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reconnect
          </Button>
        )}
      </div>
    </Card>
  );
});

