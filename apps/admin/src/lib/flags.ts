import React from 'react';

// Feature flags for progressive rollout and A/B testing
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: {
    userIds?: string[];
    roles?: string[];
    environments?: string[];
  };
  metadata?: Record<string, any>;
}

// Default feature flags
const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  realtime_dashboard: {
    name: 'realtime_dashboard',
    enabled: true,
    rolloutPercentage: 100,
    conditions: {
      environments: ['development', 'staging', 'production']
    }
  },
  media_queue: {
    name: 'media_queue',
    enabled: true,
    rolloutPercentage: 100,
    conditions: {
      environments: ['development', 'staging', 'production']
    }
  },
  rbac_gates: {
    name: 'rbac_gates',
    enabled: true,
    rolloutPercentage: 100,
    conditions: {
      environments: ['development', 'staging', 'production']
    }
  },
  order_status_machine: {
    name: 'order_status_machine',
    enabled: true,
    rolloutPercentage: 100,
    conditions: {
      environments: ['development', 'staging', 'production']
    }
  },
  inventory_optimistic_updates: {
    name: 'inventory_optimistic_updates',
    enabled: true,
    rolloutPercentage: 100,
    conditions: {
      environments: ['development', 'staging', 'production']
    }
  },
  product_variants_matrix: {
    name: 'product_variants_matrix',
    enabled: true,
    rolloutPercentage: 100,
    conditions: {
      environments: ['development', 'staging', 'production']
    }
  },
  bulk_operations: {
    name: 'bulk_operations',
    enabled: true,
    rolloutPercentage: 100,
    conditions: {
      environments: ['development', 'staging', 'production']
    }
  },
  advanced_analytics: {
    name: 'advanced_analytics',
    enabled: false,
    rolloutPercentage: 0,
    conditions: {
      environments: ['development']
    }
  },
  experimental_ui: {
    name: 'experimental_ui',
    enabled: false,
    rolloutPercentage: 0,
    conditions: {
      environments: ['development']
    }
  }
};

class FeatureFlagManager {
  private flags: Record<string, FeatureFlag> = { ...DEFAULT_FLAGS };
  private userId: string | null = null;
  private userRole: string | null = null;
  private environment: string = import.meta.env.MODE || 'development';

  constructor() {
    this.loadFlagsFromStorage();
    this.loadUserContext();
  }

  private loadFlagsFromStorage(): void {
    try {
      const stored = localStorage.getItem('nebula_feature_flags');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.flags = { ...this.flags, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }
  }

  private saveFlagsToStorage(): void {
    try {
      localStorage.setItem('nebula_feature_flags', JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  private loadUserContext(): void {
    try {
      const userStr = localStorage.getItem('nebula_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.userId = user.id;
        this.userRole = user.role;
      }
    } catch (error) {
      console.warn('Failed to load user context:', error);
    }
  }

  setUserContext(userId: string, userRole: string): void {
    this.userId = userId;
    this.userRole = userRole;
  }

  // Check if a feature flag is enabled for the current user
  isEnabled(flagName: string): boolean {
    const flag = this.flags[flagName];
    if (!flag) {
      return false;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check conditions
    if (flag.conditions) {
      // Check user IDs
      if (flag.conditions.userIds && this.userId) {
        if (!flag.conditions.userIds.includes(this.userId)) {
          return false;
        }
      }

      // Check roles
      if (flag.conditions.roles && this.userRole) {
        if (!flag.conditions.roles.includes(this.userRole)) {
          return false;
        }
      }

      // Check environments
      if (flag.conditions.environments) {
        if (!flag.conditions.environments.includes(this.environment)) {
          return false;
        }
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashString(`${flagName}-${this.userId || 'anonymous'}`);
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rolloutPercentage;
    }

    return true;
  }

  // Get all enabled flags for the current user
  getEnabledFlags(): string[] {
    return Object.keys(this.flags).filter(flagName => this.isEnabled(flagName));
  }

  // Get flag metadata
  getFlagMetadata(flagName: string): Record<string, any> | null {
    const flag = this.flags[flagName];
    return flag?.metadata || null;
  }

  // Update a feature flag (admin only)
  updateFlag(flagName: string, updates: Partial<FeatureFlag>): void {
    if (this.flags[flagName]) {
      this.flags[flagName] = { ...this.flags[flagName], ...updates };
      this.saveFlagsToStorage();
    }
  }

  // Add a new feature flag
  addFlag(flag: FeatureFlag): void {
    this.flags[flag.name] = flag;
    this.saveFlagsToStorage();
  }

  // Remove a feature flag
  removeFlag(flagName: string): void {
    delete this.flags[flagName];
    this.saveFlagsToStorage();
  }

  // Get all flags (for admin interface)
  getAllFlags(): Record<string, FeatureFlag> {
    return { ...this.flags };
  }

  // Reset flags to defaults
  resetToDefaults(): void {
    this.flags = { ...DEFAULT_FLAGS };
    this.saveFlagsToStorage();
  }

  // Hash function for consistent user-based rollout
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Progressive rollout helpers
  enableForPercentage(flagName: string, percentage: number): void {
    this.updateFlag(flagName, { 
      enabled: true, 
      rolloutPercentage: Math.max(0, Math.min(100, percentage)) 
    });
  }

  enableForUsers(flagName: string, userIds: string[]): void {
    this.updateFlag(flagName, { 
      enabled: true, 
      conditions: { 
        ...this.flags[flagName]?.conditions, 
        userIds 
      } 
    });
  }

  enableForRoles(flagName: string, roles: string[]): void {
    this.updateFlag(flagName, { 
      enabled: true, 
      conditions: { 
        ...this.flags[flagName]?.conditions, 
        roles 
      } 
    });
  }

  // A/B testing helpers
  createABTest(flagName: string, variants: string[], weights: number[] = []): void {
    if (variants.length === 0) return;

    // Normalize weights
    const normalizedWeights = weights.length === variants.length 
      ? weights.map(w => w / weights.reduce((a, b) => a + b, 0))
      : variants.map(() => 1 / variants.length);

    const hash = this.hashString(`${flagName}-${this.userId || 'anonymous'}`);
    let cumulative = 0;
    let selectedVariant = variants[0];

    for (let i = 0; i < variants.length; i++) {
      cumulative += normalizedWeights[i];
      if (hash % 100 < cumulative * 100) {
        selectedVariant = variants[i];
        break;
      }
    }

    this.updateFlag(flagName, {
      enabled: true,
      metadata: {
        ...this.flags[flagName]?.metadata,
        abTest: {
          variants,
          weights: normalizedWeights,
          selectedVariant
        }
      }
    });
  }

  getABTestVariant(flagName: string): string | null {
    const metadata = this.getFlagMetadata(flagName);
    return metadata?.abTest?.selectedVariant || null;
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

// React hook for feature flags
export const useFeatureFlag = (flagName: string): boolean => {
  const [enabled, setEnabled] = React.useState(featureFlags.isEnabled(flagName));

  React.useEffect(() => {
    const checkFlag = () => {
      setEnabled(featureFlags.isEnabled(flagName));
    };

    // Check on mount
    checkFlag();

    // Listen for storage changes (if flags are updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nebula_feature_flags') {
        checkFlag();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [flagName]);

  return enabled;
};

// Hook for multiple feature flags
export const useFeatureFlags = (flagNames: string[]): Record<string, boolean> => {
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const checkFlags = () => {
      const newFlags: Record<string, boolean> = {};
      flagNames.forEach(name => {
        newFlags[name] = featureFlags.isEnabled(name);
      });
      setFlags(newFlags);
    };

    checkFlags();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nebula_feature_flags') {
        checkFlags();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [flagNames.join(',')]);

  return flags;
};

// React components moved to separate file: components/FeatureFlag.tsx
