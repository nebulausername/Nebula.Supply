import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Flag,
  Key,
  Server,
  Database,
  Zap,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  Globe,
  Lock,
  Bell,
  Package,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import {
  useSystemConfig,
  useFeatureFlags,
  useUpdateFeatureFlag,
  useEnvironmentVariables,
  useUpdateEnvironmentVariable,
  useSystemHealth,
} from '../../lib/api/hooks';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';

type SystemTab = 'overview' | 'features' | 'environment' | 'integrations' | 'maintenance' | 'monitoring';

export function SystemConfig() {
  const [activeTab, setActiveTab] = useState<SystemTab>('overview');
  const [envSearch, setEnvSearch] = useState('');
  const [showSecrets, setShowSecrets] = useState<Set<string>>(new Set());
  const { handleError } = useErrorHandler('SystemConfig');

  // Fetch system data
  const { data: config, isLoading: configLoading } = useSystemConfig();
  const { data: featureFlags, isLoading: flagsLoading } = useFeatureFlags();
  const { data: envVars, isLoading: envLoading } = useEnvironmentVariables();
  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const updateFeatureFlag = useUpdateFeatureFlag();
  const updateEnvVar = useUpdateEnvironmentVariable();

  const handleToggleFeature = useCallback(async (flag: string, enabled: boolean) => {
    try {
      await updateFeatureFlag.mutateAsync({ flag, enabled });
      logger.logUserAction('feature_flag_toggled', { flag, enabled });
    } catch (error) {
      handleError(error, { operation: 'toggle_feature_flag' });
    }
  }, [updateFeatureFlag, handleError]);

  const handleUpdateEnvVar = useCallback(async (key: string, value: string) => {
    try {
      await updateEnvVar.mutateAsync({ key, value });
      logger.logUserAction('env_var_updated', { key });
    } catch (error) {
      handleError(error, { operation: 'update_env_var' });
    }
  }, [updateEnvVar, handleError]);

  const toggleSecretVisibility = useCallback((key: string) => {
    setShowSecrets(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const filteredEnvVars = envVars?.data?.filter((env: any) =>
    env.key.toLowerCase().includes(envSearch.toLowerCase()) ||
    env.value?.toLowerCase().includes(envSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-white">System Konfiguration</h1>
          <p className="text-muted mt-1">Feature Flags, Umgebungsvariablen und Systemeinstellungen</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">API Status</span>
              <Server className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={health.api?.status === 'healthy' ? 'success' : 'error'}>
                {health.api?.status || 'unknown'}
              </Badge>
              <span className="text-xs text-muted">
                {health.api?.responseTime ? `${health.api.responseTime}ms` : ''}
              </span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">Database</span>
              <Database className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={health.database?.status === 'healthy' ? 'success' : 'error'}>
                {health.database?.status || 'unknown'}
              </Badge>
              <span className="text-xs text-muted">
                {health.database?.connections ? `${health.database.connections} connections` : ''}
              </span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">Redis Cache</span>
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={health.redis?.status === 'healthy' ? 'success' : 'error'}>
                {health.redis?.status || 'unknown'}
              </Badge>
              <span className="text-xs text-muted">
                {health.redis?.memory ? `${Math.round(health.redis.memory / 1024 / 1024)}MB` : ''}
              </span>
            </div>
            {health.details?.cache && (
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Mode:</span>
                  <span className="text-text">{health.details.cache.mode || 'memory'}</span>
                </div>
                {health.details.cache.hitRate !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted">Hit Rate:</span>
                    <span className="text-text">{health.details.cache.hitRate.toFixed(1)}%</span>
                  </div>
                )}
                {health.details.cache.avgLatency !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted">Avg Latency:</span>
                    <span className="text-text">{health.details.cache.avgLatency.toFixed(1)}ms</span>
                  </div>
                )}
                {health.details.cache.connectionStatus && (
                  <div className="flex justify-between">
                    <span className="text-muted">Status:</span>
                    <Badge variant={health.details.cache.connectionStatus === 'connected' ? 'success' : 'error'} className="text-xs">
                      {health.details.cache.connectionStatus}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SystemTab)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
          <TabsTrigger value="environment">Umgebungsvariablen</TabsTrigger>
          <TabsTrigger value="integrations">Integrationen</TabsTrigger>
          <TabsTrigger value="maintenance">Wartung</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text mb-4">System-Informationen</h2>
              {configLoading ? (
                <div className="text-center py-8 text-muted">Lade Konfiguration...</div>
              ) : config ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Umgebung</span>
                    <Badge variant="outline">{config.environment || 'production'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Version</span>
                    <span className="text-sm text-text">{config.version || '1.0.0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Build</span>
                    <span className="text-sm text-text font-mono">{config.buildId || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Letztes Deployment</span>
                    <span className="text-sm text-text">
                      {config.deployedAt ? new Date(config.deployedAt).toLocaleString('de-DE') : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Aktive Feature Flags</h2>
              {flagsLoading ? (
                <div className="text-center py-8 text-muted">Lade Feature Flags...</div>
              ) : featureFlags?.data ? (
                <div className="space-y-2">
                  {featureFlags.data.slice(0, 5).map((flag: any) => (
                    <div key={flag.key} className="flex items-center justify-between p-2 rounded border border-white/10">
                      <div>
                        <span className="text-sm font-medium text-text">{flag.name}</span>
                        <p className="text-xs text-muted">{flag.description}</p>
                      </div>
                      <Badge variant={flag.enabled ? 'success' : 'outline'}>
                        {flag.enabled ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Alle anzeigen
                  </Button>
                </div>
              ) : null}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Feature Flags</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neues Feature Flag
              </Button>
            </div>
            {flagsLoading ? (
              <div className="text-center py-8 text-muted">Lade Feature Flags...</div>
            ) : featureFlags?.data ? (
              <div className="space-y-3">
                {featureFlags.data.map((flag: any) => (
                  <motion.div
                    key={flag.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Flag className="h-4 w-4 text-muted" />
                        <span className="font-medium text-text">{flag.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {flag.key}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted">{flag.description}</p>
                      {flag.category && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {flag.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted">Status:</span>
                        <Badge variant={flag.enabled ? 'success' : 'outline'}>
                          {flag.enabled ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                      <Button
                        variant={flag.enabled ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleFeature(flag.key, !flag.enabled)}
                        disabled={updateFeatureFlag.isPending}
                      >
                        {flag.enabled ? 'Deaktivieren' : 'Aktivieren'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted">Keine Feature Flags gefunden</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text">Umgebungsvariablen</h2>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Suchen..."
                  value={envSearch}
                  onChange={(e) => setEnvSearch(e.target.value)}
                  className="w-64"
                />
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Variable
                </Button>
              </div>
            </div>
            {envLoading ? (
              <div className="text-center py-8 text-muted">Lade Umgebungsvariablen...</div>
            ) : filteredEnvVars.length > 0 ? (
              <div className="space-y-2">
                {filteredEnvVars.map((env: any) => {
                  const isSecret = env.secret || env.key.toLowerCase().includes('secret') || env.key.toLowerCase().includes('key') || env.key.toLowerCase().includes('password');
                  const isVisible = showSecrets.has(env.key);

                  return (
                    <div
                      key={env.key}
                      className="flex items-center gap-3 p-3 rounded-lg border border-white/10 hover:bg-surface/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="h-4 w-4 text-muted" />
                          <span className="font-mono text-sm text-text">{env.key}</span>
                          {isSecret && (
                            <Badge variant="outline" className="text-xs">
                              Geheim
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isSecret ? (
                            <Input
                              type={isVisible ? 'text' : 'password'}
                              value={isVisible ? env.value : '••••••••••••••••'}
                              readOnly
                              className="font-mono text-sm"
                            />
                          ) : (
                            <span className="text-sm text-muted font-mono">{env.value}</span>
                          )}
                          {isSecret && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSecretVisibility(env.key)}
                            >
                              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Bearbeiten
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted">Keine Umgebungsvariablen gefunden</div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Externe Integrationen</h2>
            <div className="text-center py-8 text-muted">Integrations-Verwaltung wird implementiert...</div>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Wartungsmodus & Tools</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-white/10">
                <h3 className="font-medium text-text mb-2">Cache-Verwaltung</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Cache leeren
                  </Button>
                  <Button variant="outline" size="sm">
                    Cache aufwärmen
                  </Button>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-white/10">
                <h3 className="font-medium text-text mb-2">Datenbank</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Indizes optimieren
                  </Button>
                  <Button variant="outline" size="sm">
                    Statistiken aktualisieren
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-text mb-4">System-Monitoring</h2>
            {healthLoading ? (
              <div className="text-center py-8 text-muted">Lade System-Status...</div>
            ) : health ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-white/10">
                  <h3 className="font-medium text-text mb-3 flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    System-Ressourcen
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">CPU</span>
                      <span className="text-text">{health.system?.cpu || 'N/A'}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Memory</span>
                      <span className="text-text">{health.system?.memory || 'N/A'}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Disk</span>
                      <span className="text-text">{health.system?.disk || 'N/A'}%</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-white/10">
                  <h3 className="font-medium text-text mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Performance
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Avg Response Time</span>
                      <span className="text-text">{health.performance?.avgResponseTime || 'N/A'}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Requests/min</span>
                      <span className="text-text">{health.performance?.requestsPerMinute || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted">Error Rate</span>
                      <span className="text-text">{health.performance?.errorRate || 'N/A'}%</span>
                    </div>
                  </div>
                </div>
                {health.details?.cache && (
                  <div className="p-4 rounded-lg border border-white/10 md:col-span-2">
                    <h3 className="font-medium text-text mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Redis Cache Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted block mb-1">Mode</span>
                        <span className="text-text font-medium">{health.details.cache.mode || 'memory'}</span>
                      </div>
                      {health.details.cache.hitRate !== undefined && (
                        <div>
                          <span className="text-muted block mb-1">Hit Rate</span>
                          <span className="text-text font-medium">{health.details.cache.hitRate.toFixed(1)}%</span>
                        </div>
                      )}
                      {health.details.cache.missRate !== undefined && (
                        <div>
                          <span className="text-muted block mb-1">Miss Rate</span>
                          <span className="text-text font-medium">{health.details.cache.missRate.toFixed(1)}%</span>
                        </div>
                      )}
                      {health.details.cache.avgLatency !== undefined && (
                        <div>
                          <span className="text-muted block mb-1">Avg Latency</span>
                          <span className="text-text font-medium">{health.details.cache.avgLatency.toFixed(1)}ms</span>
                        </div>
                      )}
                      {health.details.cache.totalOperations !== undefined && (
                        <div>
                          <span className="text-muted block mb-1">Total Operations</span>
                          <span className="text-text font-medium">{health.details.cache.totalOperations.toLocaleString()}</span>
                        </div>
                      )}
                      {health.details.cache.errors !== undefined && (
                        <div>
                          <span className="text-muted block mb-1">Errors</span>
                          <span className="text-text font-medium">{health.details.cache.errors}</span>
                        </div>
                      )}
                      {health.details.cache.connectionStatus && (
                        <div>
                          <span className="text-muted block mb-1">Connection Status</span>
                          <Badge variant={health.details.cache.connectionStatus === 'connected' ? 'success' : 'error'} className="text-xs">
                            {health.details.cache.connectionStatus}
                          </Badge>
                        </div>
                      )}
                      {health.details.cache.redisInfo?.version && (
                        <div>
                          <span className="text-muted block mb-1">Redis Version</span>
                          <span className="text-text font-medium">{health.details.cache.redisInfo.version}</span>
                        </div>
                      )}
                      {health.details.cache.redisInfo?.usedMemory && (
                        <div>
                          <span className="text-muted block mb-1">Used Memory</span>
                          <span className="text-text font-medium">{health.details.cache.redisInfo.usedMemory}</span>
                        </div>
                      )}
                      {health.details.cache.redisInfo?.connectedClients && (
                        <div>
                          <span className="text-muted block mb-1">Connected Clients</span>
                          <span className="text-text font-medium">{health.details.cache.redisInfo.connectedClients}</span>
                        </div>
                      )}
                      {health.details.cache.memoryStoreSize !== undefined && (
                        <div>
                          <span className="text-muted block mb-1">Memory Store Size</span>
                          <span className="text-text font-medium">{health.details.cache.memoryStoreSize}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


