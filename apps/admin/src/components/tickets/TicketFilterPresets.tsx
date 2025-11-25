import { useState, useEffect, memo } from 'react';
import { Save, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { logger } from '../../lib/logger';
import type { TicketFilters } from './types';

interface TicketFilterPresetsProps {
  filters: TicketFilters;
  onPresetSelect: (preset: TicketFilters) => void;
  onPresetSave: (name: string, filters: TicketFilters) => void;
}

interface SavedPreset {
  id: string;
  name: string;
  filters: TicketFilters;
  createdAt: string;
}

const PRESETS_STORAGE_KEY = 'ticket_filter_presets';

export const TicketFilterPresets = memo(function TicketFilterPresets({
  filters,
  onPresetSelect,
  onPresetSave,
}: TicketFilterPresetsProps) {
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    // Load saved presets from localStorage
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        setSavedPresets(JSON.parse(stored));
      }
    } catch (error) {
      logger.error('Failed to load filter presets', { error });
    }
  }, []);

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: SavedPreset = {
      id: `preset-${Date.now()}`,
      name: presetName.trim(),
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    onPresetSave(presetName.trim(), filters);
    setPresetName('');
    setShowSaveDialog(false);
  };

  const handleDeletePreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    onPresetSelect(preset.filters);
  };

  if (savedPresets.length === 0 && !showSaveDialog) {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          className="w-full"
        >
          <Save className="h-3.5 w-3.5 mr-2" />
          Filter speichern
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Save Dialog */}
      {showSaveDialog && (
        <Card
          variant="glassmorphic"
          className={cn(
            'p-3',
            'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
            'backdrop-blur-xl border border-white/10'
          )}
        >
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Preset-Name eingeben..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSavePreset();
                } else if (e.key === 'Escape') {
                  setShowSaveDialog(false);
                  setPresetName('');
                }
              }}
              className="bg-surface/50 border-white/10"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="flex-1"
              >
                <Save className="h-3.5 w-3.5 mr-2" />
                Speichern
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSaveDialog(false);
                  setPresetName('');
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text">Gespeicherte Filter</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              className="h-6 px-2 text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              Neu
            </Button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {savedPresets.map((preset) => (
              <div
                key={preset.id}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg',
                  'bg-surface/30 border border-white/10',
                  'hover:bg-surface/50 hover:border-accent/30',
                  'transition-all duration-200 cursor-pointer group'
                )}
                onClick={() => handleLoadPreset(preset)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FolderOpen className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                  <span className="text-sm text-text truncate">{preset.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto flex-shrink-0">
                    {Object.keys(preset.filters).length} Filter
                  </Badge>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePreset(preset.id);
                  }}
                  className={cn(
                    'ml-2 p-1 rounded hover:bg-red-500/20',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'text-red-400'
                  )}
                  aria-label={`Delete preset ${preset.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

