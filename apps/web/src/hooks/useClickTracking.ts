import { useEffect } from 'react';
import { trackClick } from '../utils/analytics';

export const useClickTracking = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Get element identifier
      const elementId = target.id || target.className || target.tagName;
      const elementText = target.textContent?.slice(0, 50) || '';
      
      trackClick(
        elementId,
        e.clientX,
        e.clientY,
        {
          elementText,
          tagName: target.tagName,
          href: (target as HTMLAnchorElement).href || undefined
        }
      );
    };

    document.addEventListener('click', handleClick, { passive: true });
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [enabled]);
};

