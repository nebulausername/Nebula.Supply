import { useEffect, useRef } from 'react';
import { trackScrollDepth, resetScrollDepth } from '../utils/analytics';

export const useScrollTracking = () => {
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollableHeight = documentHeight - viewportHeight;
      
      if (scrollableHeight > 0) {
        const scrollPercentage = Math.round((scrollY / scrollableHeight) * 100);
        trackScrollDepth(scrollPercentage);
      }
      
      lastScrollY.current = scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Reset on page load
    resetScrollDepth();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
};

