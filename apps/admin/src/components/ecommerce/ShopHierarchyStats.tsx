import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface HierarchyStats {
  level0: number;
  level1: number;
  level2: number;
  level3Plus: number;
  totalCategories: number;
  sneakerBrands: number;
  sneakerModels: number;
  completeness: number;
}

interface ShopHierarchyStatsProps {
  hierarchyStats: HierarchyStats;
}

export const ShopHierarchyStats = memo(({ hierarchyStats }: ShopHierarchyStatsProps) => {
  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Hierarchie-Statistiken</h2>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            hierarchyStats.completeness >= 80 ? 'text-green-400 border-green-400' :
            hierarchyStats.completeness >= 50 ? 'text-yellow-400 border-yellow-400' :
            'text-orange-400 border-orange-400'
          )}
        >
          {hierarchyStats.completeness}% Vollständig
        </Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-400 mb-1">{hierarchyStats.level0}</div>
          <div className="text-sm text-white/60">Hauptkategorien</div>
          <div className="text-xs text-white/40 mt-1">Level 0</div>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-400 mb-1">{hierarchyStats.level1}</div>
          <div className="text-sm text-white/60">Marken</div>
          <div className="text-xs text-white/40 mt-1">Level 1</div>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="text-2xl font-bold text-green-400 mb-1">{hierarchyStats.level2}</div>
          <div className="text-sm text-white/60">Modelle</div>
          <div className="text-xs text-white/40 mt-1">Level 2</div>
        </div>
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="text-2xl font-bold text-orange-400 mb-1">{hierarchyStats.sneakerBrands}</div>
          <div className="text-sm text-white/60">SNEAKER Marken</div>
          <div className="text-xs text-white/40 mt-1">{hierarchyStats.sneakerModels} Modelle</div>
        </div>
      </div>
      
      {/* Mini Hierarchie-Visualisierung */}
      <div className="mt-4 p-4 bg-black/25 rounded-lg border border-white/10">
        <h3 className="text-sm font-semibold text-white mb-3">SNEAKER Hierarchie Status</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-sm text-white/80">SNEAKER (Hauptkategorie)</span>
            <Badge variant="outline" className="ml-auto text-xs">
              {hierarchyStats.level0 > 0 ? (
                <CheckCircle2 className="w-3 h-3 mr-1 text-green-400" />
              ) : (
                <AlertTriangle className="w-3 h-3 mr-1 text-orange-400" />
              )}
              {hierarchyStats.level0 > 0 ? 'Vorhanden' : 'Fehlt'}
            </Badge>
          </div>
          <div className="ml-4 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm text-white/60">Marken (Level 1)</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {hierarchyStats.sneakerBrands} / 6
              </Badge>
            </div>
            <div className="ml-4 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-white/40">Modelle (Level 2)</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {hierarchyStats.sneakerModels} / 23
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

ShopHierarchyStats.displayName = 'ShopHierarchyStats';

