// Service Worker Registration Utility

export interface ServiceWorkerRegistrationOptions {
  enabled?: boolean;
  onUpdateAvailable?: () => void;
  onUpdateInstalled?: () => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private options: ServiceWorkerRegistrationOptions;

  constructor(options: ServiceWorkerRegistrationOptions = {}) {
    this.options = {
      enabled: true,
      ...options
    };
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.options.enabled) {
      console.log('[SW] Service Worker disabled');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Service Workers not supported');
      return null;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('[SW] Service Worker registered:', this.registration.scope);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[SW] New service worker installed');
              this.options.onUpdateAvailable?.();
            } else {
              // Service worker installed for first time
              console.log('[SW] Service worker installed');
              this.options.onUpdateInstalled?.();
            }
          }
        });
      });

      // Handle controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW] New service worker activated');
        // Reload page to use new service worker
        window.location.reload();
      });

      // Check for updates periodically
      this.checkForUpdates();

      return this.registration;
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      this.options.onError?.(error as Error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const unregistered = await this.registration.unregister();
      console.log('[SW] Service Worker unregistered');
      this.registration = null;
      return unregistered;
    } catch (error) {
      console.error('[SW] Service Worker unregistration failed:', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      await this.registration.update();
      console.log('[SW] Service Worker update check triggered');
    } catch (error) {
      console.error('[SW] Service Worker update failed:', error);
    }
  }

  async clearCache(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.registration?.active) {
        resolve(false);
        return;
      }

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };

      this.registration?.active?.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  async getCacheSize(): Promise<Array<{ name: string; size: number }> | null> {
    return new Promise((resolve) => {
      if (!this.registration?.active) {
        resolve(null);
        return;
      }

      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.sizes);
      };

      this.registration?.active?.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  private checkForUpdates(): void {
    // Check for updates every hour
    setInterval(() => {
      this.update();
    }, 60 * 60 * 1000);
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Singleton instance
let swManager: ServiceWorkerManager | null = null;

export function getServiceWorkerManager(options?: ServiceWorkerRegistrationOptions): ServiceWorkerManager {
  if (!swManager) {
    swManager = new ServiceWorkerManager(options);
  }
  return swManager;
}

// Auto-register on import (only in production)
if (import.meta.env.PROD && typeof window !== 'undefined') {
  const manager = getServiceWorkerManager({
    enabled: true,
    onUpdateAvailable: () => {
      // Show update notification to user
      if (confirm('Eine neue Version ist verfügbar. Seite neu laden?')) {
        window.location.reload();
      }
    }
  });

  // Register when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      manager.register();
    });
  } else {
    manager.register();
  }
}

export { ServiceWorkerManager };

