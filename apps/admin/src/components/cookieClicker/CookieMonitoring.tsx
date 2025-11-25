import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Server, Users, Zap, Bell, Settings, TrendingUp, Cookie, BarChart3 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useRealtime } from '../../lib/realtime/RealtimeHooks';
import { LineChart } from '../ui/charts/LineChart';

interface PerformanceMetrics {
  apiResponseTime: number;
  databaseQueryTime: number;
  websocketLatency: number;
  activeConnections: number;
  errorRate: number;
  requestsPerSecond: number;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface AlertConfig {
  id: string;
  name: string;
  enabled: boolean;
  condition: string;
  threshold: number;
  channel: 'email' | 'webhook' | 'in-app';
  webhookUrl?: string;
}

interface LiveMetric {
  timestamp: string;
  totalCookies: number;
  activePlayers: number;
  averageCPS: number;
  cookiesGenerated: number;
}

// 🚀 Real-time Monitoring Dashboard für Cookie Clicker
export const CookieMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiResponseTime: 0,
    databaseQueryTime: 0,
    websocketLatency: 0,
    activeConnections: 0,
    errorRate: 0,
    requestsPerSecond: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activePlayers, setActivePlayers] = useState(0);
  const [isHealthy, setIsHealthy] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [showAlertConfig, setShowAlertConfig] = useState(false);

  // 🎯 Realtime für Real-time Updates (Admin WebSocket)
  const { isConnected, subscribe, emit } = useRealtime({
    enabled: true
  });

  // Subscribe to monitoring events when connected
  useEffect(() => {
    if (!isConnected || !subscribe) return;

    const unsubscribeMetrics = subscribe('cookie:metrics', (data: any) => {
      setMetrics(data);
    });
    
    const unsubscribeAlert = subscribe('cookie:alert', (data: any) => {
      setAlerts(prev => [data, ...prev].slice(0, 50)); // Max 50 Alerts
    });
    
    const unsubscribePlayers = subscribe('cookie:active_players', (data: any) => {
      setActivePlayers(data.count);
    });

    const unsubscribeLiveMetrics = subscribe('cookie:live_metrics', (data: any) => {
      setLiveMetrics(prev => {
        const newMetrics = [...prev, {
          timestamp: new Date().toISOString(),
          totalCookies: data.totalCookies || 0,
          activePlayers: data.activePlayers || 0,
          averageCPS: data.averageCPS || 0,
          cookiesGenerated: data.cookiesGenerated || 0
        }];
        return newMetrics.slice(-60); // Keep last 60 data points
      });
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeAlert();
      unsubscribePlayers();
      unsubscribeLiveMetrics();
    };
  }, [isConnected, subscribe]);

  // 🎯 Health Check
  useEffect(() => {
    const checkHealth = () => {
      const isApiHealthy = metrics.apiResponseTime < 1000; // < 1s
      const isDbHealthy = metrics.databaseQueryTime < 500; // < 500ms
      const isErrorRateLow = metrics.errorRate < 0.05; // < 5%
      
      setIsHealthy(isApiHealthy && isDbHealthy && isErrorRateLow);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [metrics]);

  // 🎯 Subscribe to monitoring updates
  useEffect(() => {
    if (isConnected && emit) {
      emit('subscribe:cookie_monitoring');
    }
  }, [isConnected, emit]);

  // 🎯 Auto-resolve old alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(prev => prev.filter(alert => 
        !alert.resolved && Date.now() - alert.timestamp < 3600000 // Keep for 1 hour
      ));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const activeAlerts = useMemo(() => alerts.filter(a => !a.resolved), [alerts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Real-time Monitoring</h2>
          <p className="text-gray-400">Live performance metrics and system health</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          isHealthy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
          isConnected ? "" : "bg-yellow-500/20 text-yellow-400"
        )}>
          {isConnected ? (
            isHealthy ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )
          ) : (
            <Activity className="w-5 h-5 animate-pulse" />
          )}
          <span className="font-semibold">
            {isConnected ? (isHealthy ? 'System Healthy' : 'Issues Detected') : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Server className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">API Response Time</span>
          </div>
          <div className={cn(
            "text-3xl font-bold mb-1",
            metrics.apiResponseTime < 200 ? "text-green-400" :
            metrics.apiResponseTime < 500 ? "text-yellow-400" :
            "text-red-400"
          )}>
            {metrics.apiResponseTime.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500">Average response time</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Database Query Time</span>
          </div>
          <div className={cn(
            "text-3xl font-bold mb-1",
            metrics.databaseQueryTime < 100 ? "text-green-400" :
            metrics.databaseQueryTime < 300 ? "text-yellow-400" :
            "text-red-400"
          )}>
            {metrics.databaseQueryTime.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500">Average query time</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-400">WebSocket Latency</span>
          </div>
          <div className={cn(
            "text-3xl font-bold mb-1",
            metrics.websocketLatency < 50 ? "text-green-400" :
            metrics.websocketLatency < 100 ? "text-yellow-400" :
            "text-red-400"
          )}>
            {metrics.websocketLatency.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500">Real-time latency</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Active Players</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">{activePlayers}</div>
          <div className="text-xs text-gray-500">Currently playing</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-xl border border-red-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-400">Error Rate</span>
          </div>
          <div className={cn(
            "text-3xl font-bold mb-1",
            metrics.errorRate < 0.01 ? "text-green-400" :
            metrics.errorRate < 0.05 ? "text-yellow-400" :
            "text-red-400"
          )}>
            {(metrics.errorRate * 100).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500">Error percentage</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span className="text-sm text-gray-400">Requests/Second</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {metrics.requestsPerSecond.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">API throughput</div>
        </motion.div>
      </div>

      {/* Live Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Live Analytics Dashboard
          </h3>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-lg text-sm",
            isConnected ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          )}>
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-400 animate-pulse" : "bg-red-400")} />
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        {liveMetrics.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              data={liveMetrics.map(m => ({
                timestamp: new Date(m.timestamp).toLocaleTimeString(),
                value: m.totalCookies
              }))}
              xKey="timestamp"
              lines={[
                { dataKey: 'value', name: 'Total Cookies', color: '#f59e0b', strokeWidth: 2 }
              ]}
              title="Total Cookies (Live)"
              height={250}
              formatValue={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
                return value.toString();
              }}
              showArea={true}
            />
            <LineChart
              data={liveMetrics.map(m => ({
                timestamp: new Date(m.timestamp).toLocaleTimeString(),
                players: m.activePlayers,
                cps: m.averageCPS
              }))}
              xKey="timestamp"
              lines={[
                { dataKey: 'players', name: 'Active Players', color: '#3b82f6', strokeWidth: 2 },
                { dataKey: 'cps', name: 'Avg CPS', color: '#10b981', strokeWidth: 2 }
              ]}
              title="Active Players & CPS (Live)"
              height={250}
              formatValue={(value) => value.toFixed(0)}
              showArea={true}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Waiting for live data...</p>
          </div>
        )}
      </motion.div>

      {/* Alert Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            Alert Configuration
          </h3>
          <button
            onClick={() => setShowAlertConfig(!showAlertConfig)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            {showAlertConfig ? 'Hide' : 'Configure'}
          </button>
        </div>

        {showAlertConfig && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h4 className="text-sm font-semibold text-white mb-3">Configure New Alert</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Alert Name</label>
                    <input
                      type="text"
                      placeholder="e.g., High Error Rate"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Condition</label>
                    <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
                      <option>Error Rate ></option>
                      <option>API Latency ></option>
                      <option>Active Players <</option>
                      <option>Total Cookies ></option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Threshold</label>
                    <input
                      type="number"
                      placeholder="e.g., 0.05"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Notification Channel</label>
                    <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500">
                      <option>In-App</option>
                      <option>Email</option>
                      <option>Webhook</option>
                    </select>
                  </div>
                  <button className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm transition-colors">
                    Add Alert
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h4 className="text-sm font-semibold text-white mb-3">Active Alert Rules</h4>
                <div className="space-y-2">
                  {alertConfigs.length === 0 ? (
                    <p className="text-sm text-gray-400">No alert rules configured</p>
                  ) : (
                    alertConfigs.map(config => (
                      <div key={config.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-white">{config.name}</div>
                            <div className="text-xs text-gray-400">
                              {config.condition} {config.threshold} • {config.channel}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              config.enabled ? "bg-green-400" : "bg-gray-500"
                            )} />
                            <button className="p-1 hover:bg-slate-700 rounded transition-colors">
                              <Settings className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Default Alert Rules */}
        {!showAlertConfig && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-semibold text-white">Error Rate Alert</span>
              </div>
              <p className="text-xs text-gray-400">Triggers when error rate > 5%</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-semibold text-white">High Latency Alert</span>
              </div>
              <p className="text-xs text-gray-400">Triggers when API latency > 1s</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm font-semibold text-white">Low Activity Alert</span>
              </div>
              <p className="text-xs text-gray-400">Triggers when active players < 10</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Active Alerts ({activeAlerts.length})
          </h3>
          <div className="space-y-2">
            {activeAlerts.slice(0, 10).map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "p-4 rounded-lg border flex items-center justify-between",
                  alert.type === 'error' ? "bg-red-500/10 border-red-500/30" :
                  alert.type === 'warning' ? "bg-yellow-500/10 border-yellow-500/30" :
                  "bg-blue-500/10 border-blue-500/30"
                )}
              >
                <div className="flex items-center gap-3">
                  {alert.type === 'error' ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  )}
                  <div>
                    <div className="font-semibold text-white">{alert.message}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                >
                  Resolve
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

