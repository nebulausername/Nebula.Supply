import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Search, Command, ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react';
import { cn } from '../../utils/cn';
import { fuzzySearch } from '../../lib/utils/fuzzySearch';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];
  action: () => void;
  category?: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandAction[];
  placeholder?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  commands,
  placeholder = 'Befehle durchsuchen...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search term
  const filteredCommands = useMemo(() => {
    if (!searchTerm.trim()) {
      return commands;
    }

    const results = fuzzySearch(commands, searchTerm, {
      searchFields: ['label', 'description', (cmd) => cmd.keywords?.join(' ') || ''],
      threshold: 0.5,
      limit: 20,
    });

    return results.map(r => r.item);
  }, [commands, searchTerm]);

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[data-command-item]');
      const selectedItem = items[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleCommandClick = (command: CommandAction) => {
    command.action();
    onClose();
  };

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    filteredCommands.forEach((cmd) => {
      const category = cmd.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 border-0 bg-transparent focus:ring-0 text-lg"
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="px-2 py-1 bg-black/30 rounded border border-white/10">
                <ArrowUp className="w-3 h-3 inline" />
                <ArrowDown className="w-3 h-3 inline" />
              </kbd>
              <span>navigate</span>
              <kbd className="px-2 py-1 bg-black/30 rounded border border-white/10 ml-2">
                <CornerDownLeft className="w-3 h-3 inline" />
              </kbd>
              <span>select</span>
            </div>
          </div>

          {/* Commands List */}
          <div
            ref={listRef}
            className="max-h-96 overflow-y-auto p-2"
          >
            {filteredCommands.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Keine Befehle gefunden</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category} className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                    {category}
                  </div>
                  {categoryCommands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <div
                        key={command.id}
                        data-command-item
                        onClick={() => handleCommandClick(command)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'hover:bg-white/5'
                        )}
                      >
                        {command.icon && (
                          <div className="text-muted-foreground">{command.icon}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white">{command.label}</div>
                          {command.description && (
                            <div className="text-sm text-muted-foreground truncate">
                              {command.description}
                            </div>
                          )}
                        </div>
                        {command.shortcut && (
                          <div className="flex items-center gap-1">
                            {command.shortcut.split('+').map((key, i) => (
                              <React.Fragment key={i}>
                                <kbd className="px-2 py-1 text-xs bg-black/30 rounded border border-white/10">
                                  {key}
                                </kbd>
                                {i < command.shortcut!.split('+').length - 1 && (
                                  <span className="text-muted-foreground">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

