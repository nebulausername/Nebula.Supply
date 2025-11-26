import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RefreshCw } from 'lucide-react';

interface ShopHeaderProps {
  isAutoSyncing: boolean;
  isRealtimeConnected: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const ShopHeader = memo(({ 
  isAutoSyncing, 
  isRealtimeConnected, 
  isRefreshing, 
  onRefresh 
}: ShopHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-neon via-blue-400 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Shop Management
          </motion.h1>
          {/* Auto-sync Status */}
          {isAutoSyncing && (
            <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-500/10 animate-pulse">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              Synchronisiere...
            </Badge>
          )}
          {/* Real-time Connection Status */}
          <div className="flex items-center gap-2">
            {isRealtimeConnected ? (
              <Badge variant="outline" className="text-green-400 border-green-400 bg-green-500/10">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400 bg-yellow-500/10">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                Offline
              </Badge>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          Verwalte deine Shop-Produkte, Kategorien, Lagerbestand und Analytics
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="min-w-32 hover:bg-white/5 transition-colors"
          title="Daten aktualisieren (Ctrl+R)"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Aktualisiere...' : 'Aktualisieren'}
        </Button>
      </div>
    </div>
  );
});

ShopHeader.displayName = 'ShopHeader';

