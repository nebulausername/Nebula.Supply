import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { 
  Filter, 
  X, 
  DollarSign, 
  Calendar, 
  Tag, 
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Save,
  Bookmark,
  Crown,
  Lock,
  Globe,
  Users
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface AdvancedFilterState {
  priceRange: { min: number | null; max: number | null };
  categories: string[];
  statuses: string[];
  accessLevels: string[];
  dateRange: { start: string | null; end: string | null };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  customSort?: string;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: AdvancedFilterState;
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  onReset: () => void;
  categories: Array<{ id: string; name: string; icon?: string }>;
  className?: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  categories,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [priceSliderMin, setPriceSliderMin] = useState(0);
  const [priceSliderMax, setPriceSliderMax] = useState(1000);

  // Load presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('product_filter_presets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error('Failed to load filter presets', e);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePresets = (newPresets: FilterPreset[]) => {
    localStorage.setItem('product_filter_presets', JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  // Count active filters
  React.useEffect(() => {
    let count = 0;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
    if (filters.categories.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.accessLevels.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.customSort) count++;
    setActiveFilterCount(count);
  }, [filters]);

  // Initialize accessLevels if not present
  useEffect(() => {
    if (!filters.accessLevels) {
      onFiltersChange({
        ...filters,
        accessLevels: []
      });
    }
  }, []);

  const saveCurrentAsPreset = () => {
    if (!presetName.trim()) return;
    
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...filters }
    };
    
    savePresets([...presets, newPreset]);
    setPresetName('');
    setShowSavePreset(false);
  };

  const loadPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
  };

  const deletePreset = (presetId: string) => {
    savePresets(presets.filter(p => p.id !== presetId));
  };

  const updateFilter = (key: keyof AdvancedFilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const updatePriceRange = (field: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    updateFilter('priceRange', {
      ...filters.priceRange,
      [field]: numValue,
    });
  };

  const updateDateRange = (field: 'start' | 'end', value: string) => {
    updateFilter('dateRange', {
      ...filters.dateRange,
      [field]: value || null,
    });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId];
    updateFilter('categories', newCategories);
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    updateFilter('statuses', newStatuses);
  };

  const toggleAccessLevel = (accessLevel: string) => {
    const currentLevels = filters.accessLevels || [];
    const newLevels = currentLevels.includes(accessLevel)
      ? currentLevels.filter(l => l !== accessLevel)
      : [...currentLevels, accessLevel];
    updateFilter('accessLevels', newLevels);
  };

  const customSortOptions = [
    { value: 'bestSelling', label: 'Bestseller' },
    { value: 'lowStockFirst', label: 'Niedriger Bestand zuerst' },
    { value: 'highStockFirst', label: 'Hoher Bestand zuerst' },
    { value: 'recentlyUpdated', label: 'Zuletzt aktualisiert' },
    { value: 'recentlyCreated', label: 'Zuletzt erstellt' },
    { value: 'priceLowToHigh', label: 'Preis: Niedrig zu Hoch' },
    { value: 'priceHighToLow', label: 'Preis: Hoch zu Niedrig' },
  ];

  return (
    <Card className={cn('p-4 border-white/10', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Erweiterte Filter</span>
          {activeFilterCount > 0 && (
            <Badge variant="outline" className="ml-2">
              {activeFilterCount} aktiv
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-muted-foreground hover:text-white"
            >
              <X className="w-3 h-3 mr-1" />
              Zurücksetzen
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          {/* Price Range Filter with Visual Slider */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              Preis-Range
            </label>
            <div className="space-y-3">
              {/* Visual Range Display */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground min-w-[60px]">
                  €{filters.priceRange.min ?? 0}
                </span>
                <div className="flex-1 h-2 bg-black/25 rounded-full relative">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{
                      left: `${((filters.priceRange.min ?? 0) / priceSliderMax) * 100}%`,
                      width: `${((filters.priceRange.max ?? priceSliderMax) - (filters.priceRange.min ?? 0)) / priceSliderMax * 100}%`
                    }}
                  />
                </div>
                <span className="text-muted-foreground min-w-[60px] text-right">
                  €{filters.priceRange.max ?? priceSliderMax}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                    updatePriceRange('min', val?.toString() ?? '');
                    if (val !== null) setPriceSliderMin(Math.min(val, priceSliderMin));
                  }}
                  className="flex-1"
                  step="0.01"
                  min="0"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                    updatePriceRange('max', val?.toString() ?? '');
                    if (val !== null) setPriceSliderMax(Math.max(val, priceSliderMax));
                  }}
                  className="flex-1"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Multi-Select Categories */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4" />
              Kategorien (Multi-Select)
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={filters.categories.includes(category.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    'transition-all',
                    filters.categories.includes(category.id)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'hover:bg-white/5'
                  )}
                >
                  {category.icon && <span className="mr-1">{category.icon}</span>}
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Multi-Select Status */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              Status (Multi-Select)
            </label>
            <div className="flex flex-wrap gap-2">
              {['active', 'inactive', 'draft', 'archived'].map((status) => (
                <Button
                  key={status}
                  variant={filters.statuses.includes(status) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    'transition-all capitalize',
                    filters.statuses.includes(status)
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'hover:bg-white/5'
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          {/* Multi-Select Access Levels */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              Access-Level (Multi-Select)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'free', label: 'Kostenlos', icon: Globe },
                { value: 'standard', label: 'Standard', icon: Users },
                { value: 'limited', label: 'Limitiert', icon: Lock },
                { value: 'vip', label: 'VIP', icon: Crown }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={(filters.accessLevels || []).includes(value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleAccessLevel(value)}
                  className={cn(
                    'transition-all',
                    (filters.accessLevels || []).includes(value)
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'hover:bg-white/5'
                  )}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Datum-Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Von</label>
                <Input
                  type="date"
                  value={filters.dateRange.start || ''}
                  onChange={(e) => updateDateRange('start', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bis</label>
                <Input
                  type="date"
                  value={filters.dateRange.end || ''}
                  onChange={(e) => updateDateRange('end', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Custom Sort */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              Benutzerdefinierte Sortierung
            </label>
            <select
              value={filters.customSort || ''}
              onChange={(e) => updateFilter('customSort', e.target.value || undefined)}
              className="w-full px-3 py-2 bg-black/25 border border-white/20 rounded-lg text-sm hover:border-white/40 transition-colors"
            >
              <option value="">Standard Sortierung</option>
              {customSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Presets */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                Gespeicherte Filter
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSavePreset(!showSavePreset)}
                className="text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                Aktuellen speichern
              </Button>
            </div>
            
            {showSavePreset && (
              <div className="mb-3 p-3 bg-black/25 rounded-lg border border-white/10">
                <Input
                  placeholder="Preset-Name eingeben..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveCurrentAsPreset()}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveCurrentAsPreset} disabled={!presetName.trim()}>
                    Speichern
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setShowSavePreset(false);
                    setPresetName('');
                  }}>
                    Abbrechen
                  </Button>
                </div>
              </div>
            )}

            {presets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Badge
                    key={preset.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/50 transition-colors group"
                    onClick={() => loadPreset(preset)}
                  >
                    <span className="mr-1">{preset.name}</span>
                    <X
                      className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(preset.id);
                      }}
                    />
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Keine gespeicherten Filter. Speichere häufig verwendete Filter für schnellen Zugriff.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

