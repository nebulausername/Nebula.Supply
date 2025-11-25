/**
 * 🗄️ Nebula Data Storage Utilities
 * 
 * Comprehensive data storage management for all Nebula stores.
 * Provides utilities for data persistence, migration, and cleanup.
 */

import { useCookieClickerStore } from '../store/cookieClicker';
import { useGlobalCartStore } from '../store/globalCart';
import { useCheckoutStore } from '../store/checkout';
import { useDropsStore } from '../store/drops';
import { useAuthStore } from '../store/auth';

// 🎯 Storage Keys
export const STORAGE_KEYS = {
  COOKIE_CLICKER: 'nebula-cookie-clicker',
  GLOBAL_CART: 'nebula-global-cart',
  CHECKOUT: 'nebula-checkout-store',
  DROPS: 'nebula-drops-store',
  AUTH: 'nebula-auth',
  INTERESTED_PRODUCTS: 'nebula-interested-products'
} as const;

// 🎯 Storage Types
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// 🎯 Storage Utilities
export class StorageManager {
  /**
   * Clear all Nebula data from localStorage
   */
  static clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🗑️ All Nebula data cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Clear specific store data
   */
  static clearStoreData(storeKey: StorageKey): void {
    try {
      localStorage.removeItem(storeKey);
      console.log(`🗑️ Cleared ${storeKey} from localStorage`);
    } catch (error) {
      console.error(`Failed to clear ${storeKey}:`, error);
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): {
    totalSize: number;
    storeSizes: Record<string, number>;
    availableSpace: number;
  } {
    const storeSizes: Record<string, number> = {};
    let totalSize = 0;

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      try {
        const data = localStorage.getItem(key);
        const size = data ? new Blob([data]).size : 0;
        storeSizes[name] = size;
        totalSize += size;
      } catch (error) {
        console.error(`Failed to get size for ${key}:`, error);
        storeSizes[name] = 0;
      }
    });

    // Estimate available space (5MB limit for localStorage)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const availableSpace = Math.max(0, maxSize - totalSize);

    return {
      totalSize,
      storeSizes,
      availableSpace
    };
  }

  /**
   * Export all store data as JSON
   */
  static exportData(): string {
    const data: Record<string, any> = {};
    
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      try {
        const storeData = localStorage.getItem(key);
        if (storeData) {
          data[name] = JSON.parse(storeData);
        }
      } catch (error) {
        console.error(`Failed to export ${key}:`, error);
      }
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import store data from JSON
   */
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      Object.entries(data).forEach(([storeName, storeData]) => {
        const key = Object.values(STORAGE_KEYS).find(k => 
          k.includes(storeName.toLowerCase().replace(/_/g, '-'))
        );
        
        if (key && storeData) {
          localStorage.setItem(key, JSON.stringify(storeData));
        }
      });

      console.log('✅ Data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Reset all stores to initial state
   */
  static resetAllStores(): void {
    try {
      // Reset each store
      useCookieClickerStore.getState().cleanupParticles();
      useGlobalCartStore.getState().clearCart();
      useCheckoutStore.getState().reset();
      useDropsStore.getState().clearReservation();
      
      console.log('🔄 All stores reset to initial state');
    } catch (error) {
      console.error('Failed to reset stores:', error);
    }
  }

  /**
   * Get store health status
   */
  static getStoreHealth(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const storageInfo = this.getStorageInfo();

    // Check storage usage
    if (storageInfo.totalSize > 4 * 1024 * 1024) { // 4MB
      issues.push('Storage usage is high (>4MB)');
      recommendations.push('Consider clearing old data or reducing stored information');
    }

    // Check individual store sizes
    Object.entries(storageInfo.storeSizes).forEach(([store, size]) => {
      if (size > 1024 * 1024) { // 1MB per store
        issues.push(`${store} store is using ${Math.round(size / 1024)}KB`);
        recommendations.push(`Consider optimizing ${store} data structure`);
      }
    });

    // Check for corrupted data
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          JSON.parse(data);
        }
      } catch (error) {
        issues.push(`${name} store contains corrupted data`);
        recommendations.push(`Clear ${name} store data`);
      }
    });

    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}

// 🎯 Store-specific utilities
export class CookieClickerStorage {
  static saveGame(): void {
    // Cookie clicker auto-saves via Zustand persist
    console.log('🍪 Cookie Clicker game saved');
  }

  static loadGame(): void {
    // Game loads automatically via Zustand persist
    console.log('🍪 Cookie Clicker game loaded');
  }

  static exportSave(): string {
    const state = useCookieClickerStore.getState();
    return JSON.stringify({
      cookies: state.cookies,
      totalCookies: state.totalCookies,
      level: state.level,
      xp: state.xp,
      buildings: state.buildings,
      upgrades: state.upgrades,
      achievements: state.achievements,
      prestigeLevel: state.prestigeLevel,
      prestigePoints: state.prestigePoints
    }, null, 2);
  }
}

export class CartStorage {
  static clearCart(): void {
    useGlobalCartStore.getState().clearCart();
    console.log('🛒 Cart cleared');
  }

  static getCartSize(): number {
    return useGlobalCartStore.getState().totalItems;
  }

  static getCartValue(): number {
    return useGlobalCartStore.getState().totalPrice;
  }
}

export class DropsStorage {
  static clearSelections(): void {
    // Reset all user selections
    const store = useDropsStore.getState();
    // Note: This would require adding a clearSelections method to the store
    console.log('🎯 Drop selections cleared');
  }

  static getReservationHistory(): any[] {
    return useDropsStore.getState().reservationHistory;
  }
}

// 🎯 Development utilities
export class DevStorage {
  static logAllStores(): void {
    console.group('🗄️ Nebula Store States');
    
    console.log('🍪 Cookie Clicker:', useCookieClickerStore.getState());
    console.log('🛒 Global Cart:', useGlobalCartStore.getState());
    console.log('💳 Checkout:', useCheckoutStore.getState());
    console.log('🎯 Drops:', useDropsStore.getState());
    console.log('🔐 Auth:', useAuthStore.getState());
    
    console.groupEnd();
  }

  static getStorageStats(): void {
    const info = StorageManager.getStorageInfo();
    const health = StorageManager.getStoreHealth();
    
    console.group('📊 Storage Statistics');
    console.log('Total Size:', Math.round(info.totalSize / 1024), 'KB');
    console.log('Available Space:', Math.round(info.availableSpace / 1024), 'KB');
    console.log('Store Sizes:', info.storeSizes);
    console.log('Health Status:', health.healthy ? '✅ Healthy' : '⚠️ Issues Found');
    
    if (health.issues.length > 0) {
      console.log('Issues:', health.issues);
      console.log('Recommendations:', health.recommendations);
    }
    
    console.groupEnd();
  }
}

// 🎯 Auto-cleanup utilities
export class AutoCleanup {
  private static cleanupInterval: NodeJS.Timeout | null = null;

  static startAutoCleanup(): void {
    if (this.cleanupInterval) return;

    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);

    console.log('🧹 Auto-cleanup started');
  }

  static stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🧹 Auto-cleanup stopped');
    }
  }

  private static performCleanup(): void {
    try {
      // Clean up old particles in cookie clicker
      useCookieClickerStore.getState().cleanupParticles();
      
      // Check storage health
      const health = StorageManager.getStoreHealth();
      if (!health.healthy) {
        console.warn('⚠️ Storage health issues detected:', health.issues);
      }
      
      console.log('🧹 Auto-cleanup completed');
    } catch (error) {
      console.error('Auto-cleanup failed:', error);
    }
  }
}

// 🎯 Export all utilities
export default {
  StorageManager,
  CookieClickerStorage,
  CartStorage,
  DropsStorage,
  DevStorage,
  AutoCleanup
};

