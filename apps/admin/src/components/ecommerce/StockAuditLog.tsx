import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { 
  History, 
  Download, 
  Filter, 
  Search,
  TrendingUp,
  TrendingDown,
  Edit,
  Package,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { useStockHistory } from '../../lib/api/shopHooks';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface StockAuditLogProps {
  productId: string;
  productName?: string;
  limit?: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId?: string;
  type: 'add' | 'remove' | 'set' | 'sale' | 'return' | 'damage' | 'adjustment';
  quantity: number;
  oldStock: number;
  newStock: number;
  reason?: string;
  location?: string;
  userId?: string;
  userName?: string;
  orderId?: string;
  timestamp: string;
  approved?: boolean;
  approvedBy?: string;
}

export function StockAuditLog({ productId, productName, limit = 100 }: StockAuditLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  const { data: historyData, isLoading } = useStockHistory(productId, limit);
  const movements: StockMovement[] = historyData?.data || [];

  const filteredMovements = movements.filter(movement => {
    if (searchTerm && !movement.reason?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !movement.userName?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterType !== 'all' && movement.type !== filterType) {
      return false;
    }
    if (dateRange.start && new Date(movement.timestamp) < new Date(dateRange.start)) {
      return false;
    }
    if (dateRange.end && new Date(movement.timestamp) > new Date(dateRange.end)) {
      return false;
    }
    return true;
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'add':
      case 'return':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'remove':
      case 'sale':
      case 'damage':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'set':
      case 'adjustment':
        return <Edit className="w-4 h-4 text-blue-400" />;
      default:
        return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMovementBadge = (type: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      add: { label: 'Added', color: 'text-green-400 border-green-400' },
      remove: { label: 'Removed', color: 'text-red-400 border-red-400' },
      set: { label: 'Set', color: 'text-blue-400 border-blue-400' },
      sale: { label: 'Sale', color: 'text-purple-400 border-purple-400' },
      return: { label: 'Return', color: 'text-green-400 border-green-400' },
      damage: { label: 'Damage', color: 'text-orange-400 border-orange-400' },
      adjustment: { label: 'Adjustment', color: 'text-yellow-400 border-yellow-400' },
    };
    const badge = badges[type] || { label: type, color: 'text-gray-400 border-gray-400' };
    return (
      <Badge variant="outline" className={badge.color}>
        {badge.label}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const csv = [
      ['Date', 'Type', 'Quantity', 'Old Stock', 'New Stock', 'Reason', 'User', 'Location'].join(','),
      ...filteredMovements.map(m => [
        new Date(m.timestamp).toISOString().replace('T', ' ').substring(0, 19),
        m.type,
        m.quantity,
        m.oldStock,
        m.newStock,
        m.reason || '',
        m.userName || '',
        m.location || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-audit-${productId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-800 rounded w-1/4" />
          <div className="h-20 bg-gray-800 rounded" />
          <div className="h-20 bg-gray-800 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-lg font-semibold">Stock Movement History</h3>
              {productName && (
                <p className="text-sm text-muted-foreground">{productName}</p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by reason or user..."
              className="pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-white/20 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="add">Added</option>
            <option value="remove">Removed</option>
            <option value="set">Set</option>
            <option value="sale">Sale</option>
            <option value="return">Return</option>
            <option value="damage">Damage</option>
            <option value="adjustment">Adjustment</option>
          </select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start || ''}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="text-sm"
              placeholder="Start date"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange.end || ''}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="text-sm"
              placeholder="End date"
            />
          </div>
        </div>

        {/* Movements List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No stock movements found</p>
            </div>
          ) : (
            filteredMovements.map((movement) => (
              <div
                key={movement.id}
                className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getMovementIcon(movement.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getMovementBadge(movement.type)}
                        <span className="text-sm font-medium">
                          {movement.type === 'add' || movement.type === 'return' ? '+' : ''}
                          {movement.quantity} units
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {movement.oldStock} → {movement.newStock}
                        </span>
                      </div>
                      {movement.reason && (
                        <p className="text-sm text-muted-foreground">{movement.reason}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {movement.userName && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {movement.userName}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(movement.timestamp)}
                        </div>
                        {movement.location && (
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {movement.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {filteredMovements.length > 0 && (
          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Showing {filteredMovements.length} of {movements.length} movements
              </span>
              <span className="text-muted-foreground">
                Total: {movements.reduce((sum, m) => sum + (m.type === 'add' || m.type === 'return' ? m.quantity : -m.quantity), 0)} units
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

