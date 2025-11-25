import React, { useState, useEffect } from 'react';
import { useRealtimeDrops } from '../../lib/websocket/useRealtimeDrops';
import { getWebSocketClient } from '../../lib/websocket/client';
import { ConnectionStatus } from './ConnectionStatus';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const RealtimeDropTest: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Test real-time connection
  const { isConnected: wsConnected, connectionStatus } = useRealtimeDrops({
    enabled: true,
    onDropCreated: (event) => {
      console.log('Drop created event:', event);
      setEvents(prev => [...prev.slice(-9), { type: 'created', data: event, timestamp: new Date() }]);
    },
    onDropUpdated: (event) => {
      console.log('Drop updated event:', event);
      setEvents(prev => [...prev.slice(-9), { type: 'updated', data: event, timestamp: new Date() }]);
    },
    onDropDeleted: (event) => {
      console.log('Drop deleted event:', event);
      setEvents(prev => [...prev.slice(-9), { type: 'deleted', data: event, timestamp: new Date() }]);
    },
    onStockChanged: (event) => {
      console.log('Stock changed event:', event);
      setEvents(prev => [...prev.slice(-9), { type: 'stock_changed', data: event, timestamp: new Date() }]);
    }
  });

  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  const testConnection = () => {
    const wsClient = getWebSocketClient();
    wsClient.forceReconnect();
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Real-time Drop Dashboard Test</h3>
        
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <ConnectionStatus showDetails />
            <Button onClick={testConnection} variant="outline" size="sm">
              Test Connection
            </Button>
          </div>

          {/* Connection Details */}
          <div className="text-sm text-gray-600">
            <p>WebSocket Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
            <p>Connection Status: {connectionStatus.connected ? 'Connected' : connectionStatus.reconnecting ? 'Reconnecting' : 'Disconnected'}</p>
            {connectionStatus.error && (
              <p className="text-red-600">Error: {connectionStatus.error}</p>
            )}
          </div>

          {/* Events Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Real-time Events ({events.length})</h4>
              <Button onClick={clearEvents} variant="outline" size="sm">
                Clear
              </Button>
            </div>
            
            <div className="bg-gray-50 rounded p-3 max-h-64 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-gray-500 text-sm">No events yet. Try editing drops in another window.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((event, index) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          event.type === 'created' ? 'bg-green-100 text-green-800' :
                          event.type === 'updated' ? 'bg-blue-100 text-blue-800' :
                          event.type === 'deleted' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.type}
                        </span>
                        <span className="text-gray-500">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-600">
                        Drop ID: {event.data?.dropId}
                        {event.data?.changes && (
                          <span> - {event.data.changes.length} changes</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h5 className="font-medium text-blue-900 mb-2">Test Instructions:</h5>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Open another browser window/tab to the admin dashboard</li>
              <li>2. Edit a drop field in the other window</li>
              <li>3. Watch for real-time events in this window</li>
              <li>4. Try disconnecting/reconnecting network to test connection status</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
};






