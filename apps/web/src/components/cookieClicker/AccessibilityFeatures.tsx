import { useEffect, memo } from 'react';
import { useCookieClickerStore } from '../../store/cookieClicker';

// ♿ KEYBOARD SHORTCUTS
export const KeyboardShortcuts = memo(() => {
  const clickCookie = useCookieClickerStore(state => state.clickCookie);
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Space = Click Cookie
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        clickCookie(centerX, centerY);
      }
      
      // Numbers 1-9 = Buy Buildings/Upgrades (if available)
      // This would need to be context-aware
      
      // 'S' = Stats
      if (e.key.toLowerCase() === 's' && e.ctrlKey) {
        e.preventDefault();
        // Navigate to stats - would need navigation context
      }
      
      // 'A' = Achievements
      if (e.key.toLowerCase() === 'a' && e.ctrlKey) {
        e.preventDefault();
        // Navigate to achievements
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [clickCookie]);
  
  return null;
});
KeyboardShortcuts.displayName = 'KeyboardShortcuts';

// ♿ FOCUS TRAP (für Modals)
export const FocusTrap = memo(({ children, isActive }: { 
  children: React.ReactNode;
  isActive: boolean;
}) => {
  useEffect(() => {
    if (!isActive) return;
    
    const trap = document.querySelector('[data-focus-trap]');
    if (!trap) return;
    
    const focusableElements = trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTab = (e: KeyboardEvent) => {
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
    
    document.addEventListener('keydown', handleTab);
    firstElement?.focus();
    
    return () => {
      document.removeEventListener('keydown', handleTab);
    };
  }, [isActive]);
  
  return <div data-focus-trap>{children}</div>;
});
FocusTrap.displayName = 'FocusTrap';

// ♿ SKIP TO CONTENT LINK
export const SkipToContent = memo(() => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-500 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      Zum Hauptinhalt springen
    </a>
  );
});
SkipToContent.displayName = 'SkipToContent';

// ♿ ARIA LIVE REGION (für Screen Reader)
export const AriaLiveRegion = memo(() => {
  const cookies = useCookieClickerStore(state => state.cookies);
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const unlockedAchievements = useCookieClickerStore(state => state.unlockedAchievements);
  const level = useCookieClickerStore(state => state.level);
  
  // Announce important changes
  const announcements = [
    `${Math.floor(cookies).toLocaleString()} Cookies`,
    `Level ${level}`,
    `${unlockedAchievements.length} Achievements freigeschaltet`
  ];
  
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="aria-live-region"
    >
      {/* Screen reader announcements will be injected here */}
    </div>
  );
});
AriaLiveRegion.displayName = 'AriaLiveRegion';

