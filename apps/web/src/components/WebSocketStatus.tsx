import { useState, useEffect } from 'react';
import { useHomepageRealtime } from '../hooks/useHomepageRealtime';
import { useWebSocket } from '../hooks/useWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, Activity, Zap } from 'lucide-react';
import { cn } from '../utils/cn';

export const WebSocketStatus = () => {
  const { isConnected, lastUpdate } = useHomepageRealtime();
  const { connectionQuality, queuedMessages, reconnect } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: true
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = () => {
    setIsReconnecting(true);
    reconnect();
    setTimeout(() => setIsReconnecting(false), 3000);
  };

  const getQualityColor = () => {
    if (!isConnected) return 'text-red-400';
    if (connectionQuality.latency === -1) return 'text-yellow-400';
    if (connectionQuality.latency < 100) return 'text-green-400';
    if (connectionQuality.latency < 300) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getQualityText = () => {
    if (!isConnected) return 'Offline';
    if (connectionQuality.latency === -1) return 'Unknown';
    if (connectionQuality.latency < 100) return 'Excellent';
    if (connectionQuality.latency < 300) return 'Good';
    return 'Poor';
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, type: 'spring' }}
    >
      <div className={cn(
        "rounded-xl backdrop-blur-xl border shadow-2xl transition-all duration-300",
        isConnected 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30',
        isExpanded && 'bg-black/80 border-white/20'
      )}>
        {/* Compact View */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "px-4 py-2.5 rounded-xl text-xs font-medium transition-all",
            "flex items-center gap-2 w-full",
            isConnected 
              ? 'text-green-400 hover:bg-green-500/20' 
              : 'text-red-400 hover:bg-red-500/20'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={cn(
            "w-2.5 h-2.5 rounded-full transition-all",
            isConnected 
              ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' 
              : 'bg-red-400'
          )} />
          <span className="font-semibold">
            {isConnected ? 'Live' : 'Offline'}
          </span>
          {isConnected && connectionQuality.latency > 0 && (
            <span className={cn("text-[10px] font-mono", getQualityColor())}>
              {connectionQuality.latency}ms
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-auto"
          >
            <Activity className="w-3.5 h-3.5 opacity-60" />
          </motion.div>
        </motion.button>

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 space-y-3 border-t border-white/10">
                {/* Connection Quality */}
                {isConnected && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Quality
                      </span>
                      <span className={cn("font-semibold", getQualityColor())}>
                        {getQualityText()}
                      </span>
                    </div>
                    {connectionQuality.latency > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Latency</span>
                        <span className={cn("font-mono", getQualityColor())}>
                          {connectionQuality.latency}ms
                        </span>
                      </div>
                    )}
                    {queuedMessages > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Queued</span>
                        <span className="text-yellow-400 font-semibold">
                          {queuedMessages} messages
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Last Update */}
                {lastUpdate && (
                  <div className="text-xs text-muted">
                    Last update: {new Date(lastUpdate).toLocaleTimeString()}
                  </div>
                )}

                {/* Reconnect Button */}
                {!isConnected && (
                  <motion.button
                    onClick={handleReconnect}
                    disabled={isReconnecting}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-xs font-medium",
                      "bg-accent/20 hover:bg-accent/30 border border-accent/30",
                      "text-accent transition-all flex items-center justify-center gap-2",
                      isReconnecting && "opacity-50 cursor-not-allowed"
                    )}
                    whileHover={{ scale: isReconnecting ? 1 : 1.02 }}
                    whileTap={{ scale: isReconnecting ? 1 : 0.98 }}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isReconnecting && "animate-spin")} />
                    {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
                  </motion.button>
                )}

                {/* Connection Status Details */}
                <div className="text-[10px] text-muted/60 font-mono pt-2 border-t border-white/5">
                  {isConnected ? (
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3 h-3 text-green-400" />
                      <span>WebSocket Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <WifiOff className="w-3 h-3 text-red-400" />
                      <span>Connection Lost</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};





















































































