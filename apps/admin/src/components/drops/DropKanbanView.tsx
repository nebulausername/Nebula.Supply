import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { Drop } from '@nebula/shared';
import { formatCurrency, getAvailableStock, getTotalSold } from '../../lib/dropUtils';
import { Edit, Trash2, Eye, GripVertical } from 'lucide-react';

interface DropKanbanViewProps {
  drops: Drop[];
  selectedDrops: Set<string>;
  onSelectDrop: (dropId: string) => void;
  onEdit: (drop: Drop) => void;
  onDelete: (dropId: string) => void;
  onView: (drop: Drop) => void;
}

const statusColumns = [
  { id: 'active', label: 'Active', color: 'text-green-400' },
  { id: 'scheduled', label: 'Scheduled', color: 'text-yellow-400' },
  { id: 'inactive', label: 'Inactive', color: 'text-gray-400' },
  { id: 'sold_out', label: 'Sold Out', color: 'text-red-400' },
];

export const DropKanbanView: React.FC<DropKanbanViewProps> = ({
  drops,
  selectedDrops,
  onSelectDrop,
  onEdit,
  onDelete,
  onView,
}) => {
  const dropsByStatus = React.useMemo(() => {
    const grouped: Record<string, Drop[]> = {
      active: [],
      scheduled: [],
      inactive: [],
      sold_out: [],
    };

    drops.forEach((drop) => {
      const status = drop.status || 'inactive';
      if (grouped[status]) {
        grouped[status].push(drop);
      } else {
        grouped.inactive.push(drop);
      }
    });

    return grouped;
  }, [drops]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusColumns.map((column) => {
        const columnDrops = dropsByStatus[column.id] || [];

        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="mb-3">
              <h3 className={`font-semibold ${column.color}`}>
                {column.label}
              </h3>
              <span className="text-sm text-muted">
                {columnDrops.length} drops
              </span>
            </div>
            <div className="space-y-2">
              {columnDrops.map((drop) => {
                const available = getAvailableStock(drop);
                const sold = getTotalSold(drop);
                const isSelected = selectedDrops.has(drop.id);

                return (
                  <Card
                    key={drop.id}
                    className={`p-3 cursor-pointer transition-all hover:border-neon/50 ${
                      isSelected ? 'border-neon bg-neon/10' : ''
                    }`}
                    onClick={() => onSelectDrop(drop.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onSelectDrop(drop.id);
                          }}
                          className="rounded border-white/20 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{drop.name}</h4>
                          {drop.badge && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {drop.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <GripVertical className="w-4 h-4 text-muted" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-muted">Stock: </span>
                        <span className="font-medium">{available}</span>
                      </div>
                      <div>
                        <span className="text-muted">Sold: </span>
                        <span className="font-medium">{sold}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <Badge variant="outline" className="text-xs">
                        {drop.access}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(drop);
                          }}
                          title="View"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(drop);
                          }}
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto text-red-400 hover:text-red-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(drop.id);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
              {columnDrops.length === 0 && (
                <div className="text-center py-8 text-sm text-muted border border-dashed border-white/10 rounded">
                  No drops
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

