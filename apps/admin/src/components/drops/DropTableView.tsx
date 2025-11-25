import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useDropConfig, type ColumnConfig } from '../../store/dropConfigStore';
import type { Drop } from '@nebula/shared';
import { formatCurrency, getStatusColor, getAccessColor, getAvailableStock, getTotalSold, getRevenue } from '../../lib/dropUtils';
import { MoreHorizontal, Edit, Trash2, Eye, ChevronDown, ChevronRight } from 'lucide-react';

interface DropTableViewProps {
  drops: Drop[];
  selectedDrops: Set<string>;
  onSelectDrop: (dropId: string) => void;
  onSelectAll: () => void;
  onEdit: (drop: Drop) => void;
  onDelete: (dropId: string) => void;
  onView: (drop: Drop) => void;
  expandedVariants: Set<string>;
  onToggleVariant: (dropId: string) => void;
}

export const DropTableView: React.FC<DropTableViewProps> = ({
  drops,
  selectedDrops,
  onSelectDrop,
  onSelectAll,
  onEdit,
  onDelete,
  onView,
  expandedVariants,
  onToggleVariant,
}) => {
  const config = useDropConfig();
  const visibleColumns = config.layout.columns
    .filter((col) => col.visible)
    .sort((a, b) => a.order - b.order);

  const allSelected = drops.length > 0 && drops.every((drop) => selectedDrops.has(drop.id));
  const someSelected = drops.some((drop) => selectedDrops.has(drop.id));

  const renderCell = (drop: Drop, column: ColumnConfig) => {
    switch (column.id) {
      case 'name':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedDrops.has(drop.id)}
              onChange={() => onSelectDrop(drop.id)}
              className="rounded border-white/20"
            />
            <div>
              <div className="font-medium">{drop.name}</div>
              {drop.shortDescription && (
                <div className="text-sm text-muted">{drop.shortDescription}</div>
              )}
            </div>
          </div>
        );
      case 'badge':
        return drop.badge ? (
          <Badge variant="outline">{drop.badge}</Badge>
        ) : (
          <span className="text-muted">—</span>
        );
      case 'status':
        return (
          <Badge variant={drop.status === 'active' ? 'success' : 'secondary'}>
            {drop.status}
          </Badge>
        );
      case 'access':
        return (
          <span className={getAccessColor(drop.access)}>
            {drop.access}
          </span>
        );
      case 'stock':
        const available = getAvailableStock(drop);
        return (
          <div>
            <div>{available}</div>
            {drop.variants && drop.variants.length > 1 && (
              <button
                onClick={() => onToggleVariant(drop.id)}
                className="text-xs text-muted hover:text-white mt-1"
              >
                {expandedVariants.has(drop.id) ? (
                  <ChevronDown className="w-3 h-3 inline" />
                ) : (
                  <ChevronRight className="w-3 h-3 inline" />
                )}
                {drop.variants.length} variants
              </button>
            )}
          </div>
        );
      case 'sold':
        return <span>{getTotalSold(drop)}</span>;
      case 'revenue':
        return <span className="font-medium">{formatCurrency(getRevenue(drop))}</span>;
      case 'progress':
        const totalStock = drop.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
        const sold = getTotalSold(drop);
        const progress = totalStock > 0 ? (sold / totalStock) * 100 : 0;
        return (
          <div className="w-24">
            <div className="text-xs text-muted mb-1">{progress.toFixed(1)}%</div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-neon transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      case 'deadline':
        return drop.deadlineAt ? (
          <span className="text-sm">
            {new Date(drop.deadlineAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-muted">—</span>
        );
      case 'interest':
        return <span>{drop.interestCount || 0}</span>;
      case 'variants':
        return (
          <span className="text-sm text-muted">
            {drop.variants?.length || 0} variants
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(drop)}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(drop)}
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(drop.id)}
              title="Delete"
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return <span className="text-muted">—</span>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={column.id} className="whitespace-nowrap">
                {column.id === 'name' && (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={onSelectAll}
                    className="mr-2 rounded border-white/20"
                  />
                )}
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {drops.map((drop) => (
            <React.Fragment key={drop.id}>
              <TableRow
                className={selectedDrops.has(drop.id) ? 'bg-white/5' : ''}
              >
                {visibleColumns.map((column) => (
                  <TableCell key={column.id}>
                    {renderCell(drop, column)}
                  </TableCell>
                ))}
              </TableRow>
              {expandedVariants.has(drop.id) && drop.variants && drop.variants.length > 0 && (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length}>
                    <div className="pl-8 py-2 space-y-2">
                      <div className="text-sm font-medium mb-2">Variants:</div>
                      {drop.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between text-sm bg-white/5 rounded p-2"
                        >
                          <div>
                            <span className="font-medium">{variant.label}</span>
                            {variant.description && (
                              <span className="text-muted ml-2">
                                {variant.description}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <span>Stock: {variant.stock || 0}</span>
                            <span>Sold: {variant.sold || 0}</span>
                            <span>Price: {formatCurrency(variant.price || 0)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
      {drops.length === 0 && (
        <div className="text-center py-12 text-muted">
          No drops found
        </div>
      )}
    </div>
  );
};

