import { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

// 🚀 Keyboard Shortcuts Hook für Admin-Dashboard
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    // Ensure shortcuts is always an array
    const safeShortcuts = Array.isArray(shortcuts) ? shortcuts : [];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
      ) {
        // Allow Ctrl/Cmd+K for search even in inputs
        if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
          // Continue to process
        } else {
          return;
        }
      }

      const shortcut = safeShortcuts.find(s => {
        if (!s || !s.key) return false;
        
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = s.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;
        
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (shortcut && shortcut.action) {
        e.preventDefault();
        try {
          shortcut.action();
        } catch (error) {
          console.error('Error executing keyboard shortcut action:', error);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// 🎯 Pre-defined shortcuts for Cookie Clicker Admin
export const useCookieClickerShortcuts = (handlers: {
  onRefresh?: () => void;
  onExport?: () => void;
  onSearch?: () => void;
  onNewSeason?: () => void;
  onNewEvent?: () => void;
  onSave?: () => void;
}) => {
  useKeyboardShortcuts([
    {
      key: 'r',
      ctrl: true,
      action: () => handlers.onRefresh?.(),
      description: 'Refresh data'
    },
    {
      key: 'e',
      ctrl: true,
      action: () => handlers.onExport?.(),
      description: 'Export data'
    },
    {
      key: 'f',
      ctrl: true,
      action: () => handlers.onSearch?.(),
      description: 'Focus search'
    },
    {
      key: 'n',
      ctrl: true,
      shift: true,
      action: () => handlers.onNewSeason?.(),
      description: 'New season'
    },
    {
      key: 's',
      ctrl: true,
      action: () => handlers.onSave?.(),
      description: 'Save changes'
    }
  ]);
};

// 🎯 Command Palette Hook for Admin Dashboard
export interface Command {
  id: string;
  label: string;
  description?: string;
  action: () => void;
  category?: string;
}

export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Default commands based on admin navigation
  const defaultCommands: Command[] = useMemo(() => [
    {
      id: 'overview',
      label: 'Mission Control',
      description: 'Go to dashboard overview',
      category: 'Navigation',
      action: () => {
        setSearchParams({ view: 'overview' }, { replace: true });
        setIsOpen(false);
      }
    },
    {
      id: 'shop',
      label: 'Shop Management',
      description: 'Manage products and categories',
      category: 'E-commerce',
      action: () => {
        setSearchParams({ view: 'shop' }, { replace: true });
        setIsOpen(false);
      }
    },
    {
      id: 'drops',
      label: 'Drop Management',
      description: 'Manage drops and releases',
      category: 'E-commerce',
      action: () => {
        setSearchParams({ view: 'drops' }, { replace: true });
        setIsOpen(false);
      }
    },
    {
      id: 'orders',
      label: 'Order Management',
      description: 'View and manage orders',
      category: 'E-commerce',
      action: () => {
        setSearchParams({ view: 'orders' }, { replace: true });
        setIsOpen(false);
      }
    },
    {
      id: 'customers',
      label: 'Customer Management',
      description: 'Manage customers',
      category: 'E-commerce',
      action: () => {
        setSearchParams({ view: 'customers' }, { replace: true });
        setIsOpen(false);
      }
    },
    {
      id: 'tickets',
      label: 'Support Tickets',
      description: 'View and manage support tickets',
      category: 'Support',
      action: () => {
        setSearchParams({ view: 'tickets' }, { replace: true });
        setIsOpen(false);
      }
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Manage users and permissions',
      category: 'System',
      action: () => {
        setSearchParams({ view: 'users' }, { replace: true });
        setIsOpen(false);
      }
    },
    {
      id: 'settings',
      label: 'System Config',
      description: 'System settings and configuration',
      category: 'System',
      action: () => {
        setSearchParams({ view: 'settings' }, { replace: true });
        setIsOpen(false);
      }
    }
  ], [setSearchParams]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return defaultCommands;

    const lowerQuery = query.toLowerCase();
    return defaultCommands.filter(cmd => {
      const matchesLabel = cmd.label.toLowerCase().includes(lowerQuery);
      const matchesDescription = cmd.description?.toLowerCase().includes(lowerQuery);
      const matchesCategory = cmd.category?.toLowerCase().includes(lowerQuery);
      
      return matchesLabel || matchesDescription || matchesCategory;
    });
  }, [query, defaultCommands]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open/close
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        return;
      }

      if (!isOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
        return;
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }

      // Enter to execute
      if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const executeCommand = useCallback((command: Command) => {
    command.action();
    closePalette();
  }, [closePalette]);

  return {
    isOpen,
    query,
    setQuery,
    selectedIndex,
    filteredCommands,
    closePalette,
    executeCommand
  };
};
