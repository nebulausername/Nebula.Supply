import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Shield, 
  Zap,
  AlertCircle,
  Info,
  Clock,
  TrendingUp
} from 'lucide-react';
import { shopSyncService } from '../../lib/services/shopSyncService';
import { frontendSyncQueue } from '../../lib/services/frontendSyncQueue';
import { useRealtimeShop } from '../../lib/websocket/useRealtimeShop';
import { cn } from '../../utils/cn';
import { logger } from '../../lib/logger';

interface SyncLog {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
  details?: any;
}

export const AnonymShopDropSync: React.FC = () => {
  const [syncDirection, setSyncDirection] = useState<'shop_to_drops' | 'drops_to_shop' | 'bidirectional'>('bidirectional');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStats, setSyncStats] = useState({
    itemsSynced: 0,
    itemsSkipped: 0,
    itemsFailed: 0,
    conflicts: 0
  });

  // Realtime updates
  const realtimeShop = useRealtimeShop();

  React.useEffect(() => {
    // Check if subscribe and unsubscribe functions are available
    if (!realtimeShop || typeof realtimeShop.subscribe !== 'function' || typeof realtimeShop.unsubscribe !== 'function') {
      console.warn('[AnonymShopDropSync] Realtime shop websocket not available');
      return;
    }

    const handleSyncUpdate = (data: any) => {
      if (data.type === 'sync_progress') {
        setSyncProgress(data.progress || 0);
        addLog('info', `Sync Fortschritt: ${data.progress}%`, data);
      } else if (data.type === 'sync_complete') {
        setIsSyncing(false);
        setSyncStatus('completed');
        setSyncProgress(100);
        setSyncStats(data.stats || { itemsSynced: 0, itemsSkipped: 0, itemsFailed: 0, conflicts: 0 });
        addLog('success', 'Synchronisation abgeschlossen', data);
        setLastSyncTime(new Date());
      } else if (data.type === 'sync_error') {
        setIsSyncing(false);
        setSyncStatus('error');
        addLog('error', `Fehler: ${data.message}`, data);
      }
    };

    try {
      const subId = realtimeShop.subscribe('shop_sync', handleSyncUpdate);
      return () => {
        if (realtimeShop.unsubscribe && typeof realtimeShop.unsubscribe === 'function') {
          realtimeShop.unsubscribe('shop_sync', subId);
        }
      };
    } catch (error) {
      console.error('[AnonymShopDropSync] Failed to subscribe to realtime updates:', error);
    }
  }, [realtimeShop]);

  const addLog = useCallback((level: SyncLog['level'], message: string, details?: any) => {
    setSyncLogs(prev => [{
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      message,
      level,
      details
    }, ...prev].slice(0, 50)); // Keep last 50 logs
  }, []);

  // Subscribe to sync queue updates
  React.useEffect(() => {
    const unsubscribeStats = frontendSyncQueue.subscribe((stats) => {
      if (stats.inProgress > 0) {
        setIsSyncing(true);
        setSyncStatus('syncing');
      } else if (stats.completed > 0 && stats.inProgress === 0) {
        setIsSyncing(false);
        setSyncStatus('completed');
        setSyncProgress(100);
        setLastSyncTime(new Date());
      } else if (stats.failed > 0 && stats.inProgress === 0) {
        setIsSyncing(false);
        setSyncStatus('error');
      }
    });

    const unsubscribeProgress = frontendSyncQueue.subscribeProgress((taskId, progress) => {
      setSyncProgress(progress);
      addLog('info', `Sync Fortschritt: ${progress}%`);
    });

    return () => {
      unsubscribeStats();
      unsubscribeProgress();
    };
  }, [addLog]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncProgress(0);
    setSyncStats({ itemsSynced: 0, itemsSkipped: 0, itemsFailed: 0, conflicts: 0 });
    addLog('info', `Starte anonyme Synchronisation (Frontend): ${syncDirection}`);

    try {
      // Add task to frontend sync queue
      const taskId = frontendSyncQueue.addTask(syncDirection, {
        includeInventory: true,
        includeImages: true,
        includeVariants: true,
      });

      addLog('info', `Synchronisation zur Queue hinzugefügt. Task ID: ${taskId}`);
      
      // Monitor task progress
      const checkTask = setInterval(() => {
        const task = frontendSyncQueue.getTask(taskId);
        if (task) {
          setSyncProgress(task.progress);
          
          if (task.status === 'completed') {
            clearInterval(checkTask);
            setIsSyncing(false);
            setSyncStatus('completed');
            setSyncProgress(100);
            addLog('success', 'Synchronisation erfolgreich abgeschlossen');
            setLastSyncTime(new Date());
          } else if (task.status === 'failed') {
            clearInterval(checkTask);
            setIsSyncing(false);
            setSyncStatus('error');
            addLog('error', `Synchronisation fehlgeschlagen: ${task.error || 'Unbekannter Fehler'}`);
          }
        }
      }, 500);

      // Cleanup after 5 minutes
      setTimeout(() => clearInterval(checkTask), 5 * 60 * 1000);
    } catch (error: any) {
      setIsSyncing(false);
      setSyncStatus('error');
      addLog('error', `Synchronisation fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`, error);
      logger.error('[AnonymShopDropSync] Sync failed', error);
    }
  }, [syncDirection, addLog]);

  const pollSyncStatus = useCallback(async (syncId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await shopSyncService.getSyncStatus(syncId);
        
        if (status.progress !== undefined) {
          setSyncProgress(status.progress);
        }

        if (status.state === 'completed') {
          setIsSyncing(false);
          setSyncStatus('completed');
          setSyncProgress(100);
          setSyncStats({
            itemsSynced: status.items?.filter(i => i.status === 'synced').length || 0,
            itemsSkipped: status.items?.filter(i => i.status === 'skipped').length || 0,
            itemsFailed: status.items?.filter(i => i.status === 'failed').length || 0,
            conflicts: status.conflicts?.length || 0
          });
          addLog('success', 'Synchronisation erfolgreich abgeschlossen');
          setLastSyncTime(new Date());
        } else if (status.state === 'failed') {
          setIsSyncing(false);
          setSyncStatus('error');
          addLog('error', 'Synchronisation fehlgeschlagen');
        } else if (status.state === 'in_progress' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else if (attempts >= maxAttempts) {
          setIsSyncing(false);
          setSyncStatus('error');
          addLog('error', 'Synchronisation-Timeout: Maximale Versuche erreicht');
        }
      } catch (error: any) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        } else {
          setIsSyncing(false);
          setSyncStatus('error');
          addLog('error', `Status-Abfrage fehlgeschlagen: ${error.message}`);
        }
      }
    };

    poll();
  }, [addLog]);

  const getStatusBadge = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Badge variant="outline" className="border-yellow-500/40 text-yellow-300">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Synchronisiere...
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500/40 text-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Abgeschlossen
        </Badge>;
      case 'error':
        return <Badge variant="outline" className="border-red-500/40 text-red-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          Fehler
        </Badge>;
      default:
        return <Badge variant="outline" className="border-gray-500/40 text-gray-300">
          <Clock className="w-3 h-3 mr-1" />
          Bereit
        </Badge>;
    }
  };

  return (
    <Card className="p-6 border border-white/10 bg-slate-950/40">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Anonyme Shop ↔ Drops Synchronisation</h3>
            <p className="text-sm text-muted-foreground">
              Synchronisiere Produktdaten anonym zwischen Shop und Vape Drops (ohne persönliche Daten)
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-4">
        {/* Sync Direction Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Synchronisations-Richtung:</label>
          <div className="flex gap-2">
            <Button
              variant={syncDirection === 'shop_to_drops' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSyncDirection('shop_to_drops')}
            >
              Shop → Drops
            </Button>
            <Button
              variant={syncDirection === 'drops_to_shop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSyncDirection('drops_to_shop')}
            >
              Drops → Shop
            </Button>
            <Button
              variant={syncDirection === 'bidirectional' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSyncDirection('bidirectional')}
            >
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Bidirektional
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm text-blue-200">
              <p className="font-medium mb-1">Anonyme Synchronisation</p>
              <p className="text-blue-200/80">
                Diese Synchronisation entfernt automatisch alle persönlichen Daten (Benutzerinformationen, Bestellhistorie, etc.) 
                und synchronisiert nur Produktdaten wie Name, Beschreibung, Preise, Bilder und Lagerbestand.
              </p>
            </div>
          </div>
        </div>

        {/* Sync Button */}
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full"
          size="lg"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Synchronisiere... ({syncProgress}%)
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Synchronisation starten
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="h-2 bg-black/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Fortschritt: {syncProgress}%</span>
              <span>{syncStats.itemsSynced} synchronisiert</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {syncStatus === 'completed' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Synchronisiert</div>
              <div className="text-2xl font-bold text-green-400">{syncStats.itemsSynced}</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Übersprungen</div>
              <div className="text-2xl font-bold text-yellow-400">{syncStats.itemsSkipped}</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Fehler</div>
              <div className="text-2xl font-bold text-red-400">{syncStats.itemsFailed}</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Konflikte</div>
              <div className="text-2xl font-bold text-orange-400">{syncStats.conflicts}</div>
            </div>
          </div>
        )}

        {/* Last Sync Time */}
        {lastSyncTime && (
          <div className="text-xs text-muted-foreground text-center">
            Letzte Synchronisation: {lastSyncTime.toLocaleString('de-DE')}
          </div>
        )}

        {/* Sync Logs */}
        {syncLogs.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Synchronisations-Logs</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSyncLogs([])}
              >
                Löschen
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'text-xs p-2 rounded border',
                    log.level === 'error' && 'bg-red-500/10 border-red-500/30 text-red-300',
                    log.level === 'warn' && 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
                    log.level === 'success' && 'bg-green-500/10 border-green-500/30 text-green-300',
                    log.level === 'info' && 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{log.message}</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(log.timestamp).toLocaleTimeString('de-DE')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

