import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  target?: HTMLElement | null;
}

/**
 * Hook for managing keyboard shortcuts
 * @param shortcuts Array of keyboard shortcut definitions
 * @param options Configuration options
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, target } = options;
  // Ensure shortcuts is always an array
  const safeShortcuts = Array.isArray(shortcuts) ? shortcuts : [];
  const shortcutsRef = useRef(safeShortcuts);
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    const safeArray = Array.isArray(shortcuts) ? shortcuts : [];
    shortcutsRef.current = safeArray;
    enabledRef.current = enabled;
  }, [shortcuts, enabled]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabledRef.current) return;

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

    // Find matching shortcut - ensure shortcutsRef.current is always an array
    const shortcutsArray = Array.isArray(shortcutsRef.current) ? shortcutsRef.current : [];
    const matchingShortcut = shortcutsArray.find((shortcut) => {
      if (!shortcut || !shortcut.key) return false;
      
      const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl === undefined ? true : shortcut.ctrl === (e.ctrlKey || e.metaKey);
      const metaMatch = shortcut.meta === undefined ? true : shortcut.meta === e.metaKey;
      const shiftMatch = shortcut.shift === undefined ? true : shortcut.shift === e.shiftKey;
      const altMatch = shortcut.alt === undefined ? true : shortcut.alt === e.altKey;

      return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
    });

    if (matchingShortcut && matchingShortcut.handler) {
      e.preventDefault();
      e.stopPropagation();
      try {
        matchingShortcut.handler(e);
      } catch (error) {
        console.error('Error executing keyboard shortcut handler:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const element = target || window;
    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, target, handleKeyDown]);
}

/**
 * Hook for order management specific keyboard shortcuts
 */
export function useOrderManagementShortcuts(options: {
  onQuickSearch?: () => void;
  onOpenFilters?: () => void;
  onNextOrder?: () => void;
  onPreviousOrder?: () => void;
  onOpenOrderDetails?: () => void;
  onCloseModal?: () => void;
  enabled?: boolean;
}) {
  const {
    onQuickSearch,
    onOpenFilters,
    onNextOrder,
    onPreviousOrder,
    onOpenOrderDetails,
    onCloseModal,
    enabled = true,
  } = options;

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrl: true,
      meta: true,
      handler: () => {
        onQuickSearch?.();
      },
      description: 'Open quick search',
    },
    {
      key: 'f',
      ctrl: true,
      meta: true,
      handler: () => {
        onOpenFilters?.();
      },
      description: 'Open filter panel',
    },
    {
      key: 'ArrowDown',
      handler: () => {
        onNextOrder?.();
      },
      description: 'Navigate to next order',
    },
    {
      key: 'ArrowUp',
      handler: () => {
        onPreviousOrder?.();
      },
      description: 'Navigate to previous order',
    },
    {
      key: 'Enter',
      handler: () => {
        onOpenOrderDetails?.();
      },
      description: 'Open order details',
    },
    {
      key: 'Escape',
      handler: () => {
        onCloseModal?.();
      },
      description: 'Close modal',
    },
  ];

  useKeyboardShortcuts(shortcuts, { enabled });
}
