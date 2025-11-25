import { useEffect, useRef, useCallback, RefObject } from 'react';

export interface KeyboardNavigationOptions {
  /**
   * Array of item IDs for navigation
   */
  items: string[];
  /**
   * Currently active/focused item ID
   */
  activeId?: string;
  /**
   * Callback when an item should be activated
   */
  onActivate?: (id: string) => void;
  /**
   * Callback when focus should change
   */
  onFocusChange?: (id: string) => void;
  /**
   * Ref to the container element
   */
  containerRef?: RefObject<HTMLElement>;
  /**
   * Whether navigation is enabled
   */
  enabled?: boolean;
  /**
   * Orientation: 'horizontal' | 'vertical'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Whether to wrap around at edges
   */
  wrap?: boolean;
  /**
   * Custom key handlers
   */
  customHandlers?: Record<string, (e: KeyboardEvent) => void>;
}

/**
 * Hook for keyboard navigation in tab-like interfaces
 * Supports arrow keys, home/end, number keys, and custom handlers
 */
export function useKeyboardNavigation({
  items,
  activeId,
  onActivate,
  onFocusChange,
  containerRef,
  enabled = true,
  orientation = 'horizontal',
  wrap = true,
  customHandlers = {},
}: KeyboardNavigationOptions) {
  const focusedIndexRef = useRef<number | null>(null);

  // Get current focused index
  const getCurrentIndex = useCallback(() => {
    if (focusedIndexRef.current !== null) {
      return focusedIndexRef.current;
    }
    if (activeId) {
      return items.findIndex(id => id === activeId);
    }
    return -1;
  }, [items, activeId]);

  // Navigate to next/previous item
  const navigate = useCallback(
    (direction: 'next' | 'previous') => {
      const currentIndex = getCurrentIndex();
      let nextIndex: number;

      if (direction === 'next') {
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : wrap ? 0 : currentIndex;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : wrap ? items.length - 1 : currentIndex;
      }

      if (nextIndex >= 0 && nextIndex < items.length) {
        const nextId = items[nextIndex];
        focusedIndexRef.current = nextIndex;
        onFocusChange?.(nextId);
        return nextId;
      }
      return null;
    },
    [items, getCurrentIndex, wrap, onFocusChange]
  );

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check custom handlers first
      if (customHandlers[e.key]) {
        customHandlers[e.key](e);
        return;
      }

      // Arrow key navigation
      const isHorizontal = orientation === 'horizontal';
      const arrowRight = isHorizontal ? 'ArrowRight' : 'ArrowDown';
      const arrowLeft = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

      if (e.key === arrowRight) {
        e.preventDefault();
        const nextId = navigate('next');
        if (nextId) {
          onActivate?.(nextId);
        }
        return;
      }

      if (e.key === arrowLeft) {
        e.preventDefault();
        const nextId = navigate('previous');
        if (nextId) {
          onActivate?.(nextId);
        }
        return;
      }

      // Home/End keys
      if (e.key === 'Home') {
        e.preventDefault();
        const firstId = items[0];
        if (firstId) {
          focusedIndexRef.current = 0;
          onFocusChange?.(firstId);
          onActivate?.(firstId);
        }
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        const lastId = items[items.length - 1];
        if (lastId) {
          focusedIndexRef.current = items.length - 1;
          onFocusChange?.(lastId);
          onActivate?.(lastId);
        }
        return;
      }

      // Number keys 1-9 for quick navigation
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        const targetId = items[num - 1];
        if (targetId) {
          focusedIndexRef.current = num - 1;
          onFocusChange?.(targetId);
          onActivate?.(targetId);
        }
        return;
      }

      // Enter to activate focused item
      if (e.key === 'Enter') {
        const currentIndex = getCurrentIndex();
        if (currentIndex >= 0 && currentIndex < items.length) {
          e.preventDefault();
          const currentId = items[currentIndex];
          onActivate?.(currentId);
        }
        return;
      }
    };

    const element = containerRef?.current || window;
    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    items,
    orientation,
    navigate,
    getCurrentIndex,
    onActivate,
    onFocusChange,
    containerRef,
    customHandlers,
  ]);

  return {
    focusedIndex: focusedIndexRef.current,
    navigate,
    setFocusedIndex: (index: number | null) => {
      focusedIndexRef.current = index;
    },
  };
}

