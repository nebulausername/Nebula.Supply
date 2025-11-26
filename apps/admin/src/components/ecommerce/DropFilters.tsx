import React, { useState, useCallback, useMemo, memo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { 
  Filter, 
  X, 
  Save, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Package,
  TrendingUp,
  Calendar,
  Tag
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DropFiltersType {
  status?: string[];
  access?: string[];
  stockLevel?: 'all' | 'low' | 'out' | 'in_stock';
  revenueMin?: number;
  revenueMax?: number;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

interface DropFiltersProps {
  filters: DropFiltersType;
  onFiltersChange: (filters: DropFiltersType) => void;
  onReset: () => void;
  onSavePreset?: (name: string, filters: DropFiltersType) => void;
  savedPresets?: Array<{ id: string; name: string; filters: DropFiltersType }>;
  onLoadPreset?: (preset: { id: string; name: string; filters: DropFiltersType }) => void;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktiv', color: 'text-green-400' },
  { value: 'scheduled', label: 'Geplant', color: 'text-blue-400' },
  { value: 'sold_out', label: 'Ausverkauft', color: 'text-red-400' },
  { value: 'inactive', label: 'Inaktiv', color: 'text-gray-400' },
];

const ACCESS_OPTIONS = [
  { value: 'free', label: 'Kostenlos', color: 'text-green-400' },
  { value: 'limited', label: 'Limitiert', color: 'text-yellow-400' },
  { value: 'vip', label: 'VIP', color: 'text-purple-400' },
  { value: 'standard', label: 'Standard', color: 'text-blue-400' },
];

export const DropFilters = memo(({ 
  filters, 
  onFiltersChange, 
  onReset,
  onSavePreset,
  savedPresets = [],
  onLoadPreset
}: DropFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleStatusToggle = useCallback((status: string) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status];
    
    onFiltersChange({
      ...filters,
      status: newStatus.length > 0 ? newStatus : undefined,
    });
  }, [filters, onFiltersChange]);

  const handleAccessToggle = useCallback((access: string) => {
    const currentAccess = filters.access || [];
    const newAccess = currentAccess.includes(access)
      ? currentAccess.filter(a => a !== access)
      : [...currentAccess, access];
    
    onFiltersChange({
      ...filters,
      access: newAccess.length > 0 ? newAccess : undefined,
    });
  }, [filters, onFiltersChange]);

  const handleStockLevelChange = useCallback((level: 'all' | 'low' | 'out' | 'in_stock') => {
    onFiltersChange({
      ...filters,
      stockLevel: level === 'all' ? undefined : level,
    });
  }, [filters, onFiltersChange]);

  const handleRevenueMinChange = useCallback((value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({
      ...filters,
      revenueMin: numValue,
    });
  }, [filters, onFiltersChange]);

  const handleRevenueMaxChange = useCallback((value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({
      ...filters,
      revenueMax: numValue,
    });
  }, [filters, onFiltersChange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count += filters.status.length;
    if (filters.access && filters.access.length > 0) count += filters.access.length;
    if (filters.stockLevel && filters.stockLevel !== 'all') count += 1;
    if (filters.revenueMin !== undefined) count += 1;
    if (filters.revenueMax !== undefined) count += 1;
    if (filters.dateFrom) count += 1;
    if (filters.dateTo) count += 1;
    if (filters.tags && filters.tags.length > 0) count += filters.tags.length;
    return count;
  }, [filters]);

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim() || !onSavePreset) return;
    onSavePreset(presetName.trim(), filters);
    setPresetName('');
  }, [presetName, filters, onSavePreset]);

  return (
    <Card className="p-4 bg-gradient-to-r from-gray-900/50 to-black/50 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Erweiterte Filter</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="outline" className="text-purple-400 border-purple-400 bg-purple-500/10">
              {activeFiltersCount} aktiv
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs hover:bg-white/10"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Zurücksetzen
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs hover:bg-white/10"
          >
            {isExpanded ? 'Weniger' : 'Mehr'}
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-2">Status</label>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(option => {
            const isActive = filters.status?.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => handleStatusToggle(option.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                  isActive
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/20"
                    : "bg-black/25 border-white/20 text-muted-foreground hover:bg-white/5 hover:border-white/30"
                )}
              >
                {isActive && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Access Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-2">Zugriff</label>
        <div className="flex flex-wrap gap-2">
          {ACCESS_OPTIONS.map(option => {
            const isActive = filters.access?.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => handleAccessToggle(option.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                  isActive
                    ? "bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/20"
                    : "bg-black/25 border-white/20 text-muted-foreground hover:bg-white/5 hover:border-white/30"
                )}
              >
                {isActive && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stock Level Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-2">Lagerbestand</label>
        <Select
          value={filters.stockLevel || 'all'}
          onValueChange={handleStockLevelChange}
        >
          <SelectTrigger className="w-full bg-black/25 border-white/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="in_stock">Auf Lager</SelectItem>
            <SelectItem value="low">Niedrig</SelectItem>
            <SelectItem value="out">Ausverkauft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          {/* Revenue Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Min. Umsatz (€)</label>
              <Input
                type="number"
                value={filters.revenueMin || ''}
                onChange={(e) => handleRevenueMinChange(e.target.value)}
                placeholder="0"
                className="bg-black/25 border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Max. Umsatz (€)</label>
              <Input
                type="number"
                value={filters.revenueMax || ''}
                onChange={(e) => handleRevenueMaxChange(e.target.value)}
                placeholder="∞"
                className="bg-black/25 border-white/20"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Von</label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
                className="bg-black/25 border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Bis</label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
                className="bg-black/25 border-white/20"
              />
            </div>
          </div>

          {/* Save Preset */}
          {onSavePreset && (
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Filter-Preset Name..."
                  className="flex-1 bg-black/25 border-white/20"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="border-purple-500/30 hover:bg-purple-500/20"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </div>
          )}

          {/* Saved Presets */}
          {savedPresets.length > 0 && onLoadPreset && (
            <div className="pt-4 border-t border-white/10">
              <label className="block text-sm font-medium text-white mb-2">Gespeicherte Presets</label>
              <div className="flex flex-wrap gap-2">
                {savedPresets.map(preset => (
                  <Badge
                    key={preset.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors"
                    onClick={() => onLoadPreset(preset)}
                  >
                    {preset.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

DropFilters.displayName = 'DropFilters';

