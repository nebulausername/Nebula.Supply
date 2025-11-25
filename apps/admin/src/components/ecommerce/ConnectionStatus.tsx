import React, { useState, useEffect } from 'react';
import { getWebSocketClient } from '../../lib/websocket/client';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [status, setStatus] = useState(getWebSocketClient().connectionStatus);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState(getWebSocketClient().connectionQuality);

  useEffect(() => {
    const wsClient = getWebSocketClient();
    
    const handleStatusChange = (newStatus: any) => {
      setStatus(newStatus);
    };

    wsClient.on('status', handleStatusChange);

    return () => {
      wsClient.off('status', handleStatusChange);
    };
  }, []);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    getWebSocketClient().forceReconnect();
    
    // Reset reconnecting state after a delay
    setTimeout(() => {
      setIsReconnecting(false);
    }, 3000);
  };

  const getStatusIcon = () => {
    if (status.connected) {
      return <Wifi className="w-4 h-4 text-green-500" />;
    } else if (status.reconnecting || isReconnecting) {
      return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
    } else {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (status.connected) {
      return 'Connected';
    } else if (status.reconnecting || isReconnecting) {
      return 'Reconnecting...';
    } else {
      return 'Disconnected';
    }
  };

  const getStatusColor = () => {
    if (status.connected) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (status.reconnecting || isReconnecting) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getDetailedStatus = () => {
    if (status.connected && status.lastConnected) {
      return `Connected since ${status.lastConnected.toLocaleTimeString()}`;
    } else if (status.error) {
      return status.error;
    } else {
      return 'No connection';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">
          {getStatusText()}
        </span>
      </div>

      {!status.connected && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isReconnecting ? 'animate-spin' : ''}`} />
          Reconnect
        </Button>
      )}

      {showDetails && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500">
            {getDetailedStatus()}
          </div>
          {status.connected && connectionQuality.latency > 0 && (
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>Latency: {connectionQuality.latency}ms</span>
              {connectionQuality.packetLoss > 0 && (
                <span className="text-yellow-500">
                  Packet Loss: {connectionQuality.packetLoss}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {status.error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{status.error}</span>
        </div>
      )}
    </div>
  );
};

// Compact version for headers/toolbars
export const ConnectionStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [status, setStatus] = useState(getWebSocketClient().connectionStatus);

  useEffect(() => {
    const wsClient = getWebSocketClient();
    
    const handleStatusChange = (newStatus: any) => {
      setStatus(newStatus);
    };

    wsClient.on('status', handleStatusChange);

    return () => {
      wsClient.off('status', handleStatusChange);
    };
  }, []);

  const getBadgeVariant = () => {
    if (status.connected) return 'success';
    if (status.reconnecting) return 'warning';
    return 'error';
  };

  const getBadgeText = () => {
    if (status.connected) return 'Live';
    if (status.reconnecting) return 'Reconnecting';
    return 'Offline';
  };

  return (
    <Badge 
      variant={getBadgeVariant()} 
      className={`flex items-center gap-1 ${className}`}
    >
      <div className={`w-2 h-2 rounded-full ${
        status.connected ? 'bg-green-500' : 
        status.reconnecting ? 'bg-yellow-500 animate-pulse' : 
        'bg-red-500'
      }`} />
      {getBadgeText()}
    </Badge>
  );
};

// Full status component with detailed information
export const ConnectionStatusDetailed: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [status, setStatus] = useState(getWebSocketClient().connectionStatus);

  useEffect(() => {
    const wsClient = getWebSocketClient();
    
    const handleStatusChange = (newStatus: any) => {
      setStatus(newStatus);
    };

    wsClient.on('status', handleStatusChange);

    return () => {
      wsClient.off('status', handleStatusChange);
    };
  }, []);

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Connection Status</h3>
        <ConnectionStatusBadge />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Status:</span>
          <span className={status.connected ? 'text-green-600' : 'text-red-600'}>
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {status.lastConnected && (
          <div className="flex justify-between">
            <span className="text-gray-500">Last Connected:</span>
            <span className="text-gray-900">
              {status.lastConnected.toLocaleString()}
            </span>
          </div>
        )}

        {status.error && (
          <div className="flex justify-between">
            <span className="text-gray-500">Error:</span>
            <span className="text-red-600 text-xs">{status.error}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-500">Socket ID:</span>
          <span className="text-gray-900 font-mono text-xs">
            {getWebSocketClient().socketId || 'N/A'}
          </span>
        </div>
      </div>

      {!status.connected && (
        <div className="mt-3 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => getWebSocketClient().forceReconnect()}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Force Reconnect
          </Button>
        </div>
      )}
    </div>
  );
};






