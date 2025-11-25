// Route-based Code Splitting mit Preloading-Strategie
// Preloadet häufig genutzte Routen für schnellere Navigation

import { preloadComponentDelayed } from './componentPreloader';

// Route Preloader Configuration
interface RouteConfig {
  component: () => Promise<any>;
  priority: 'high' | 'medium' | 'low';
  preloadOnHover?: boolean;
  preloadDelay?: number;
}

// Helper function to create a retryable import loader with error handling
function createRetryableLoader(
  importFn: () => Promise<any>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): () => Promise<any> {
  return async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const module = await importFn();
        
        // Ensure we have a default export
        if (!module || (!module.default && !module.TicketManagement && !module.ShopManagement)) {
          throw new Error('Module does not have expected exports');
        }
        
        // Handle different export patterns
        if (module.default) {
          return { default: module.default };
        }
        
        // Try to find named exports (for backward compatibility)
        const namedExport = module.TicketManagement || 
                           module.ShopManagement || 
                           module.OrderManagement ||
                           module.DropManagementPage ||
                           module.CustomerManagement ||
                           module.ImageLibraryPage ||
                           module.ShippingManagement ||
                           module.UserManagement ||
                           module.SecurityCenter ||
                           module.SystemConfig ||
                           module.ContestAdminPanel ||
                           module.CookieClickerAdmin ||
                           module.MaintenanceControl ||
                           module.InviteCodeAdminPage;
        
        if (namedExport) {
          return { default: namedExport };
        }
        
        throw new Error('No valid export found in module');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on the last attempt
        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw new Error(
      `Failed to load module after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`
    );
  };
}

// Route Component Loaders with retry logic
const routeLoaders = {
  shop: createRetryableLoader(() => import('../../components/ecommerce/ShopManagement').then(m => ({ default: m.ShopManagement }))),
  drops: createRetryableLoader(() => import('../../components/ecommerce/DropManagementPage').then(m => ({ default: m.DropManagementPage }))),
  orders: createRetryableLoader(() => import('../../components/ecommerce/OrderManagement').then(m => ({ default: m.OrderManagement }))),
  customers: createRetryableLoader(() => import('../../components/ecommerce/CustomerManagement').then(m => ({ default: m.CustomerManagement }))),
  images: createRetryableLoader(() => import('../../features/images/ImageLibraryPage').then(m => ({ default: m.ImageLibraryPage }))),
  shipping: createRetryableLoader(() => import('../../components/ecommerce/ShippingManagement').then(m => ({ default: m.ShippingManagement }))),
  tickets: createRetryableLoader(() => import('../../components/tickets/TicketManagement').then(m => ({ default: m.TicketManagement }))),
  users: createRetryableLoader(() => import('../../components/users/UserManagement').then(m => ({ default: m.UserManagement }))),
  security: createRetryableLoader(() => import('../../components/security/SecurityCenter').then(m => ({ default: m.SecurityCenter }))),
  settings: createRetryableLoader(() => import('../../components/system/SystemConfig').then(m => ({ default: m.SystemConfig }))),
  contests: createRetryableLoader(() => import('../../components/contest/ContestAdminPanel').then(m => ({ default: m.ContestAdminPanel }))),
  cookieClicker: createRetryableLoader(() => import('../../components/cookieClicker/CookieClickerAdmin').then(m => ({ default: m.CookieClickerAdmin }))),
  maintenance: createRetryableLoader(() => import('../../components/maintenance/MaintenanceControl').then(m => ({ default: m.MaintenanceControl }))),
  'invite-codes': createRetryableLoader(() => import('../../components/invite/InviteCodeAdminPage').then(m => ({ default: m.InviteCodeAdminPage }))),
};

// Route Configuration mit Prioritäten
const routeConfigs: Record<string, RouteConfig> = {
  tickets: {
    component: routeLoaders.tickets,
    priority: 'high',
    preloadOnHover: true,
    preloadDelay: 100
  },
  orders: {
    component: routeLoaders.orders,
    priority: 'high',
    preloadOnHover: true,
    preloadDelay: 100
  },
  shop: {
    component: routeLoaders.shop,
    priority: 'high',
    preloadOnHover: true,
    preloadDelay: 200
  },
  customers: {
    component: routeLoaders.customers,
    priority: 'medium',
    preloadOnHover: true,
    preloadDelay: 300
  },
  drops: {
    component: routeLoaders.drops,
    priority: 'medium',
    preloadOnHover: true,
    preloadDelay: 300
  },
  users: {
    component: routeLoaders.users,
    priority: 'medium',
    preloadOnHover: true,
    preloadDelay: 400
  },
  security: {
    component: routeLoaders.security,
    priority: 'low',
    preloadOnHover: true,
    preloadDelay: 500
  },
  settings: {
    component: routeLoaders.settings,
    priority: 'low',
    preloadOnHover: true,
    preloadDelay: 500
  },
  images: {
    component: routeLoaders.images,
    priority: 'medium',
    preloadOnHover: true,
    preloadDelay: 300
  },
  shipping: {
    component: routeLoaders.shipping,
    priority: 'medium',
    preloadOnHover: true,
    preloadDelay: 400
  },
  contests: {
    component: routeLoaders.contests,
    priority: 'low',
    preloadOnHover: true,
    preloadDelay: 500
  },
  cookieClicker: {
    component: routeLoaders.cookieClicker,
    priority: 'low',
    preloadOnHover: true,
    preloadDelay: 500
  },
  maintenance: {
    component: routeLoaders.maintenance,
    priority: 'low',
    preloadOnHover: true,
    preloadDelay: 500
  },
  'invite-codes': {
    component: routeLoaders['invite-codes'],
    priority: 'medium',
    preloadOnHover: true,
    preloadDelay: 400
  },
};

class RoutePreloader {
  private preloadedRoutes = new Set<string>();
  private preloadQueue: string[] = [];

  // Preload route immediately with better error handling
  preloadRoute(routeId: string): void {
    const config = routeConfigs[routeId];
    if (!config || this.preloadedRoutes.has(routeId)) {
      return;
    }

    this.preloadedRoutes.add(routeId);
    config.component().catch((error) => {
      // Log error for debugging but don't spam console
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Failed to preload route ${routeId}:`, error);
      }
      // Remove from preloaded set to allow retry
      this.preloadedRoutes.delete(routeId);
    });
  }

  // Preload route on hover with delay
  preloadRouteOnHover(routeId: string): (() => void) | null {
    const config = routeConfigs[routeId];
    if (!config || !config.preloadOnHover) {
      return null;
    }

    return preloadComponentDelayed(
      config.component,
      config.preloadDelay || 200
    );
  }

  // Preload high priority routes immediately
  preloadHighPriorityRoutes(): void {
    Object.entries(routeConfigs)
      .filter(([_, config]) => config.priority === 'high')
      .forEach(([routeId]) => {
        this.preloadRoute(routeId);
      });
  }

  // Preload medium priority routes after a delay
  preloadMediumPriorityRoutes(delay: number = 2000): void {
    setTimeout(() => {
      Object.entries(routeConfigs)
        .filter(([_, config]) => config.priority === 'medium')
        .forEach(([routeId]) => {
          this.preloadRoute(routeId);
        });
    }, delay);
  }

  // Queue route for preloading
  queuePreload(routeId: string): void {
    if (!this.preloadQueue.includes(routeId) && !this.preloadedRoutes.has(routeId)) {
      this.preloadQueue.push(routeId);
    }
  }

  // Process preload queue
  processQueue(): void {
    if (this.preloadQueue.length === 0) {
      return;
    }

    // Process one route at a time to avoid blocking
    const routeId = this.preloadQueue.shift();
    if (routeId) {
      this.preloadRoute(routeId);
      // Process next route after a short delay
      setTimeout(() => this.processQueue(), 100);
    }
  }

  // Check if route is preloaded
  isPreloaded(routeId: string): boolean {
    return this.preloadedRoutes.has(routeId);
  }

  // Get preload function for route
  getPreloadFunction(routeId: string): (() => void) | null {
    return this.preloadRouteOnHover(routeId);
  }
}

// Singleton instance
let routePreloader: RoutePreloader | null = null;

export function getRoutePreloader(): RoutePreloader {
  if (!routePreloader) {
    routePreloader = new RoutePreloader();
  }
  return routePreloader;
}

// Auto-preload high priority routes on app start
if (typeof window !== 'undefined') {
  // Preload high priority routes immediately
  getRoutePreloader().preloadHighPriorityRoutes();

  // Preload medium priority routes after 2 seconds
  getRoutePreloader().preloadMediumPriorityRoutes(2000);

  // Preload routes when user is idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      getRoutePreloader().preloadMediumPriorityRoutes(0);
    });
  }
}

export { RoutePreloader, routeLoaders, routeConfigs };

