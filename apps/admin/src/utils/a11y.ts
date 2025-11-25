/**
 * Accessibility Utilities
 */

// Skip Links für Screen Reader
export function createSkipLink(href: string, label: string) {
  return {
    href,
    label,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-neon focus:text-black focus:rounded-lg'
  };
}

// Announce to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus trap for modals
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

// Get accessible name for element
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label first
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;
  
  // Check aria-labelledby
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent || '';
  }
  
  // Check for associated label
  const id = element.getAttribute('id');
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent || '';
  }
  
  // Fallback to text content
  return element.textContent?.trim() || '';
}

// Check color contrast (WCAG AA)
export function checkColorContrast(foreground: string, background: string): boolean {
  // Simplified contrast check - in production, use a proper library
  // This is a placeholder
  return true;
}

// Keyboard navigation helpers
export function handleArrowNavigation(
  currentIndex: number,
  items: HTMLElement[],
  direction: 'up' | 'down' | 'left' | 'right'
): number {
  let newIndex = currentIndex;
  
  switch (direction) {
    case 'down':
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'up':
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
    case 'right':
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'left':
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
  }
  
  items[newIndex]?.focus();
  return newIndex;
}


