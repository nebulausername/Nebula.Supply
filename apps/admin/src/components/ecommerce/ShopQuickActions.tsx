import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sparkles, Upload, Zap, Loader2 } from 'lucide-react';
import { CategoryBulkImporter } from './CategoryBulkImporter';
import type { SetupProgress } from '../../lib/utils/mainCategoriesSetup';

interface ShopQuickActionsProps {
  showBulkImporter: boolean;
  isSettingUpSneaker: boolean;
  sneakerSetupProgress: SetupProgress | null;
  onToggleBulkImporter: () => void;
  onSetupSneakerHierarchy: () => void;
  onBulkImportComplete: () => void;
}

export const ShopQuickActions = memo(({
  showBulkImporter,
  isSettingUpSneaker,
  sneakerSetupProgress,
  onToggleBulkImporter,
  onSetupSneakerHierarchy,
  onBulkImportComplete,
}: ShopQuickActionsProps) => {
  return (
    <>
      <Card className="p-4 mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">SNEAKER Hierarchie Quick-Actions</h3>
              <p className="text-xs text-white/60">Schnelle Einrichtung der 3-Level SNEAKER Hierarchie</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleBulkImporter}
              className="border-purple-500/30 hover:bg-purple-500/20"
            >
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onSetupSneakerHierarchy}
              disabled={isSettingUpSneaker}
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30"
            >
              {isSettingUpSneaker ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {sneakerSetupProgress ? sneakerSetupProgress.label : 'Setup läuft...'}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  SNEAKER Hierarchie erstellen
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Bulk Importer */}
      {showBulkImporter && (
        <div className="mb-6">
          <CategoryBulkImporter onComplete={onBulkImportComplete} />
        </div>
      )}
    </>
  );
});

ShopQuickActions.displayName = 'ShopQuickActions';

