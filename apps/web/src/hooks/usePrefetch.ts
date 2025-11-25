import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Route prediction based on current location
const getLikelyNextRoutes = (currentPath: string): string[] => {
  const routeMap: Record<string, string[]> = {
    '/': ['/shop', '/drops', '/profile'],
    '/shop': ['/cart', '/checkout', '/'],
    '/drops': ['/shop', '/'],
    '/cart': ['/checkout', '/shop'],
    '/checkout': ['/order', '/'],
    '/profile': ['/shop', '/'],
    '/cookie-clicker': ['/profile', '/'],
  };

  return routeMap[currentPath] || [];
};

// Prefetch route via Service Worker
const prefetchRoute = (url: string) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PREFETCH_ROUTE',
      url
    });
  }
};

// Prefetch component chunks
const prefetchComponent = (componentPath: string) => {
  // Use link prefetch for component chunks
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'script';
  link.href = componentPath;
  document.head.appendChild(link);
};

/**
 * Hook for intelligent route prefetching
 * Prefetches likely next routes and component chunks
 */
export const usePrefetch = () => {
  const location = useLocation();

  const prefetchNextRoutes = useCallback(() => {
    const likelyRoutes = getLikelyNextRoutes(location.pathname);
    
    // Prefetch likely next routes
    likelyRoutes.forEach(route => {
      prefetchRoute(route);
    });

    // Prefetch component chunks for likely routes
    // This is done automatically by Vite's code splitting
    // but we can hint the browser
    likelyRoutes.forEach(route => {
      // Prefetch API data for likely routes
      if (route === '/shop') {
        prefetchRoute('/api/shop/products');
      } else if (route === '/drops') {
        prefetchRoute('/api/drops/featured');
      }
    });
  }, [location.pathname]);

  // Prefetch on route change
  useEffect(() => {
    // Small delay to not interfere with current navigation
    const timeoutId = setTimeout(() => {
      prefetchNextRoutes();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [prefetchNextRoutes]);

  // Prefetch on hover for links (if available)
  const prefetchOnHover = useCallback((route: string) => {
    prefetchRoute(route);
  }, []);

  return {
    prefetchRoute: prefetchOnHover,
    prefetchNextRoutes
  };
};

/**
 * Hook for prefetching on link hover
 */
export const useLinkPrefetch = (route: string) => {
  const handleMouseEnter = useCallback(() => {
    prefetchRoute(route);
  }, [route]);

  return {
    onMouseEnter: handleMouseEnter,
    onTouchStart: handleMouseEnter // Also prefetch on touch for mobile
  };
};





