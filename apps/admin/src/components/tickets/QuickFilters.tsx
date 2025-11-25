import { Clock, AlertTriangle, User, Inbox } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useMobile } from '../../hooks/useMobile';

interface QuickFiltersProps {
  onFilterSelect: (preset: string) => void;
  activePreset?: string;
}

const quickFilterPresets = [
  { id: 'all', label: 'Alle', icon: Inbox },
  { id: 'my-tickets', label: 'Meine Tickets', icon: User },
  { id: 'overdue', label: 'Überfällig', icon: AlertTriangle },
  { id: 'today', label: 'Heute', icon: Clock },
  { id: 'unassigned', label: 'Nicht zugewiesen', icon: User },
  { id: 'critical', label: 'Kritisch', icon: AlertTriangle },
  { id: 'open', label: 'Offen', icon: Inbox },
  { id: 'in-progress', label: 'In Bearbeitung', icon: Clock },
];

export function QuickFilters({ onFilterSelect, activePreset }: QuickFiltersProps) {
  const { isMobile } = useMobile();

  return (
    <div className={cn(
      'flex items-center gap-2',
      isMobile ? 'overflow-x-auto -mx-4 px-4 pb-2' : 'flex-wrap'
    )}>
      {isMobile ? (
        <div className="flex gap-2 min-w-max">
          {quickFilterPresets.map((preset) => {
            const Icon = preset.icon;
            return (
              <Button
                key={preset.id}
                variant={activePreset === preset.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterSelect(preset.id)}
                className={cn(
                  'h-8 px-3 whitespace-nowrap',
                  activePreset === preset.id && 'bg-accent text-accent-foreground'
                )}
                aria-label={preset.label}
              >
                <Icon className="h-3 w-3 mr-1.5" />
                {preset.label}
              </Button>
            );
          })}
        </div>
      ) : (
        quickFilterPresets.map((preset) => {
          const Icon = preset.icon;
          return (
            <Button
              key={preset.id}
              variant={activePreset === preset.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterSelect(preset.id)}
              className={cn(
                'h-8 px-3',
                activePreset === preset.id && 'bg-accent text-accent-foreground'
              )}
            >
              <Icon className="h-3 w-3 mr-1.5" />
              {preset.label}
            </Button>
          );
        })
      )}
    </div>
  );
}

