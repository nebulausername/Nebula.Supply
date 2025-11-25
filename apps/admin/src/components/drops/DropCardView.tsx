import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Drop } from '@nebula/shared';
import { formatCurrency, getAvailableStock, getTotalSold, getRevenue, getProgress } from '../../lib/dropUtils';
import { Edit, Trash2, Eye, Package, TrendingUp, DollarSign } from 'lucide-react';

interface DropCardViewProps {
  drops: Drop[];
  selectedDrops: Set<string>;
  onSelectDrop: (dropId: string) => void;
  onEdit: (drop: Drop) => void;
  onDelete: (dropId: string) => void;
  onView: (drop: Drop) => void;
}

export const DropCardView: React.FC<DropCardViewProps> = ({
  drops,
  selectedDrops,
  onSelectDrop,
  onEdit,
  onDelete,
  onView,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {drops.map((drop) => {
        const available = getAvailableStock(drop);
        const sold = getTotalSold(drop);
        const revenue = getRevenue(drop);
        const progress = getProgress(drop);
        const isSelected = selectedDrops.has(drop.id);

        return (
          <Card
            key={drop.id}
            className={`p-4 cursor-pointer transition-all hover:border-neon/50 ${
              isSelected ? 'border-neon bg-neon/10' : ''
            }`}
            onClick={() => onSelectDrop(drop.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onSelectDrop(drop.id);
                    }}
                    className="rounded border-white/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <h3 className="font-semibold text-lg">{drop.name}</h3>
                </div>
                {drop.badge && (
                  <Badge variant="outline" className="mb-2">
                    {drop.badge}
                  </Badge>
                )}
                {drop.shortDescription && (
                  <p className="text-sm text-muted line-clamp-2">
                    {drop.shortDescription}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4 text-muted" />
                <span className="text-muted">Stock:</span>
                <span className="font-medium">{available}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-muted" />
                <span className="text-muted">Sold:</span>
                <span className="font-medium">{sold}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-muted" />
                <span className="text-muted">Revenue:</span>
                <span className="font-medium">{formatCurrency(revenue)}</span>
              </div>
              <div>
                <span className="text-muted">Progress:</span>
                <div className="mt-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neon transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex gap-2">
                <Badge variant={drop.status === 'active' ? 'success' : 'secondary'}>
                  {drop.status}
                </Badge>
                <Badge variant="outline">{drop.access}</Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(drop);
                  }}
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(drop);
                  }}
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(drop.id);
                  }}
                  title="Delete"
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
      {drops.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted">
          No drops found
        </div>
      )}
    </div>
  );
};

