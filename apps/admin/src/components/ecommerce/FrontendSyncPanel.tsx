import React, { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download,
  Upload,
  Package,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { syncCategoriesFromFrontend, syncProductsFromFrontend, syncAllFromFrontend, type SyncResult } from '../../lib/api/syncFrontendData';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '../../lib/logger';

interface FrontendSyncPanelProps {
  onSyncComplete?: () => void;
}

export const FrontendSyncPanel: React.FC<FrontendSyncPanelProps> = ({ onSyncComplete }) => {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncType, setSyncType] = useState<'categories' | 'products' | 'all' | null>(null);
  const [syncResult, setSyncResult] = useState<{
    categories?: SyncResult;
    products?: SyncResult;
    success: boolean;
  } | null>(null);
  const [options, setOptions] = useState({
    overwrite: false,
    skipDuplicates: true,
    dryRun: false,
  });

  const handleSync = useCallback(async (type: 'categories' | 'products' | 'all') => {
    setIsSyncing(true);
    setSyncType(type);
    setSyncResult(null);

    try {
      let result: any;

      if (type === 'categories') {
        result = await syncCategoriesFromFrontend(options);
        setSyncResult({ categories: result, success: result.success });
      } else if (type === 'products') {
        result = await syncProductsFromFrontend(options);
        setSyncResult({ products: result, success: result.success });
      } else {
        result = await syncAllFromFrontend(options);
        setSyncResult(result);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      logger.logUserAction('frontend_sync_completed', { type, result });
      onSyncComplete?.();
    } catch (error: any) {
      logger.error('Sync failed', { error, type });
      setSyncResult({
        success: false,
        categories: type === 'categories' || type === 'all' ? {
          success: false,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [{ item: 'all', error: error.message || 'Unknown error' }],
          total: 0,
        } : undefined,
        products: type === 'products' || type === 'all' ? {
          success: false,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: [{ item: 'all', error: error.message || 'Unknown error' }],
          total: 0,
        } : undefined,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [options, queryClient, onSyncComplete]);

  const getResultStats = (result?: SyncResult) => {
    if (!result) return null;
    return {
      total: result.total,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors.length,
    };
  };

  const categoriesStats = getResultStats(syncResult?.categories);
  const productsStats = getResultStats(syncResult?.products);

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Download className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">Frontend Synchronisation</h2>
            <p className="text-sm text-muted-foreground">
              Synchronisiere Kategorien und Produkte vom Frontend zum Backend
            </p>
          </div>
        </div>
        {syncResult && (
          <Badge 
            variant="outline" 
            className={syncResult.success 
              ? 'text-green-400 border-green-400 bg-green-500/10' 
              : 'text-red-400 border-red-400 bg-red-500/10'
            }
          >
            {syncResult.success ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            {syncResult.success ? 'Erfolgreich' : 'Fehlgeschlagen'}
          </Badge>
        )}
      </div>

      {/* Options */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.overwrite}
              onChange={(e) => setOptions({ ...options, overwrite: e.target.checked })}
              className="rounded border-white/20 bg-black/25"
            />
            <span>Existierende überschreiben</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.skipDuplicates}
              onChange={(e) => setOptions({ ...options, skipDuplicates: e.target.checked })}
              className="rounded border-white/20 bg-black/25"
            />
            <span>Duplikate überspringen</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={options.dryRun}
              onChange={(e) => setOptions({ ...options, dryRun: e.target.checked })}
              className="rounded border-white/20 bg-black/25"
            />
            <span>Dry Run (nur simulieren)</span>
          </label>
        </div>
      </div>

      {/* Sync Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Button
          onClick={() => handleSync('categories')}
          disabled={isSyncing}
          variant="outline"
          className="flex items-center justify-center gap-2 hover:bg-green-500/10 hover:border-green-500/30"
        >
          {isSyncing && syncType === 'categories' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Package className="w-4 h-4" />
          )}
          Kategorien synchronisieren
        </Button>
        <Button
          onClick={() => handleSync('products')}
          disabled={isSyncing}
          variant="outline"
          className="flex items-center justify-center gap-2 hover:bg-blue-500/10 hover:border-blue-500/30"
        >
          {isSyncing && syncType === 'products' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingBag className="w-4 h-4" />
          )}
          Produkte synchronisieren
        </Button>
        <Button
          onClick={() => handleSync('all')}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isSyncing && syncType === 'all' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Alles synchronisieren
        </Button>
      </div>

      {/* Results */}
      {syncResult && (
        <div className="space-y-4">
          {categoriesStats && (
            <Card className="p-4 bg-green-900/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">Kategorien</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Gesamt</div>
                  <div className="font-semibold text-white">{categoriesStats.total}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Erstellt</div>
                  <div className="font-semibold text-green-400">{categoriesStats.created}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Aktualisiert</div>
                  <div className="font-semibold text-blue-400">{categoriesStats.updated}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Übersprungen</div>
                  <div className="font-semibold text-yellow-400">{categoriesStats.skipped}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Fehler</div>
                  <div className="font-semibold text-red-400">{categoriesStats.errors}</div>
                </div>
              </div>
            </Card>
          )}

          {productsStats && (
            <Card className="p-4 bg-blue-900/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Produkte</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Gesamt</div>
                  <div className="font-semibold text-white">{productsStats.total}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Erstellt</div>
                  <div className="font-semibold text-green-400">{productsStats.created}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Aktualisiert</div>
                  <div className="font-semibold text-blue-400">{productsStats.updated}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Übersprungen</div>
                  <div className="font-semibold text-yellow-400">{productsStats.skipped}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Fehler</div>
                  <div className="font-semibold text-red-400">{productsStats.errors}</div>
                </div>
              </div>
            </Card>
          )}

          {/* Errors */}
          {(syncResult.categories?.errors.length || syncResult.products?.errors.length) ? (
            <Card className="p-4 bg-red-900/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-red-400">Fehler</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {syncResult.categories?.errors.map((error, i) => (
                  <div key={`cat-${i}`} className="text-sm text-red-300">
                    <span className="font-medium">{error.item}:</span> {error.error}
                  </div>
                ))}
                {syncResult.products?.errors.map((error, i) => (
                  <div key={`prod-${i}`} className="text-sm text-red-300">
                    <span className="font-medium">{error.item}:</span> {error.error}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </Card>
  );
};

