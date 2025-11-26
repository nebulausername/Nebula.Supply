import { useState, memo } from 'react';
import { Save, Trash2, Edit2, Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { useSavedFilters } from '../../hooks/useSavedFilters';
import { useToast } from '../ui/Toast';
import type { TicketFilters } from './types';
import { cn } from '../../utils/cn';

interface SavedFiltersMenuProps {
  currentFilters: TicketFilters;
  onLoadFilter: (filters: TicketFilters) => void;
}

export const SavedFiltersMenu = memo(function SavedFiltersMenu({
  currentFilters,
  onLoadFilter,
}: SavedFiltersMenuProps) {
  const { savedFilters, saveFilter, deleteFilter, loadFilter, updateFilter } = useSavedFilters();
  const toast = useToast();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error('Name required', 'Please enter a name for the filter');
      return;
    }

    if (editingFilterId) {
      updateFilter(editingFilterId, { name: filterName });
      toast.success('Filter updated', 'Your filter has been updated');
    } else {
      saveFilter(filterName, currentFilters);
      toast.success('Filter saved', 'Your filter has been saved');
    }

    setFilterName('');
    setEditingFilterId(null);
    setIsSaveDialogOpen(false);
  };

  const handleLoadFilter = (filterId: string) => {
    const loadedFilters = loadFilter(filterId);
    if (loadedFilters) {
      onLoadFilter(loadedFilters);
      toast.success('Filter loaded', 'Filter has been applied');
    }
  };

  const handleDeleteFilter = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFilter(filterId);
    toast.success('Filter deleted', 'Filter has been removed');
  };

  const handleEditFilter = (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filter = savedFilters.find((f) => f.id === filterId);
    if (filter) {
      setFilterName(filter.name);
      setEditingFilterId(filterId);
      setIsSaveDialogOpen(true);
    }
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Saved Filters</span>
            {savedFilters.length > 0 && (
              <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs">
                {savedFilters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Saved Filters</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {savedFilters.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted">
              No saved filters yet
            </div>
          ) : (
            savedFilters.map((filter) => (
              <DropdownMenuItem
                key={filter.id}
                className="flex items-center justify-between group"
                onSelect={() => handleLoadFilter(filter.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{filter.name}</div>
                  <div className="text-xs text-muted truncate">
                    {new Date(filter.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => handleEditFilter(filter.id, e)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={(e) => handleDeleteFilter(filter.id, e)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setIsSaveDialogOpen(true)}
            disabled={!hasActiveFilters}
            className={cn(!hasActiveFilters && 'opacity-50 cursor-not-allowed')}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Current Filter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFilterId ? 'Edit Filter' : 'Save Filter'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filter Name</label>
              <Input
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="e.g., My Open Tickets"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveFilter();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
                {editingFilterId ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
