/**
 * Frontend Configuration Hook
 * 
 * Central configuration management for frontend data handling
 * Supports multiple configuration profiles and export/import
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../logger';

// ==================== TYPES ====================

export type OverwriteMode = 'always' | 'never' | 'onChange';
export type DuplicateStrategy = 'skip' | 'update' | 'merge';
export type RetryBackoff = 'linear' | 'exponential';

export interface SyncConfig {
  enabled: boolean;
  interval: number; // Sync interval in milliseconds (0 = disabled)
  autoFill: boolean;
  overwrite: OverwriteMode;
  duplicateStrategy: DuplicateStrategy;
  batchSize: number;
  retry: {
    maxAttempts: number;
    delay: number;
    backoff: RetryBackoff;
  };
}

export interface FieldMapping {
  frontendField: string;
  backendField: string;
  transform?: string; // Transformation formula or function name
}

export interface Transformation {
  field: string;
  type: 'rename' | 'transform' | 'validate' | 'calculate';
  config: any;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
}

export interface MappingConfig {
  fieldMappings: Record<string, string>; // Simple field mappings
  transformations: Transformation[];
  defaults: Record<string, any>;
  validations: ValidationRule[];
  categoryMapping: Record<string, string>; // Frontend category ID -> Backend category ID
}

export interface DisplayConfig {
  columns: string[];
  gridColumns: number;
  visibleFields: string[];
  badges: Array<{
    field: string;
    condition: string;
    label: string;
    color: string;
  }>;
  colorScheme: 'default' | 'category' | 'custom';
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: any; // FilterState
  createdAt: string;
}

export interface QuickFilter {
  id: string;
  label: string;
  filters: any; // FilterState
  icon?: string;
}

export interface SortPreset {
  id: string;
  name: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  multiLevel?: Array<{ field: string; order: 'asc' | 'desc' }>;
}

export interface SortConfig {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  multiLevel?: boolean;
}

export interface FiltersConfig {
  presets: FilterPreset[];
  quickFilters: QuickFilter[];
  defaultFilters: any; // FilterState
}

export interface SortingConfig {
  presets: SortPreset[];
  defaultSort: SortConfig;
  multiLevel: boolean;
}

export interface FrontendConfig {
  version: string;
  sync: SyncConfig;
  mapping: MappingConfig;
  display: DisplayConfig;
  filters: FiltersConfig;
  sorting: SortingConfig;
  createdAt: string;
  updatedAt: string;
}

export interface UseFrontendConfigOptions {
  profile?: string; // Configuration profile name (default: 'default')
  autoSave?: boolean; // Auto-save changes (default: true)
  storage?: 'localStorage' | 'indexedDB'; // Storage backend (default: 'localStorage')
}

export interface UseFrontendConfigResult {
  config: FrontendConfig;
  updateConfig: (updates: Partial<FrontendConfig>) => void;
  updateSyncConfig: (updates: Partial<SyncConfig>) => void;
  updateMappingConfig: (updates: Partial<MappingConfig>) => void;
  updateDisplayConfig: (updates: Partial<DisplayConfig>) => void;
  updateFiltersConfig: (updates: Partial<FiltersConfig>) => void;
  updateSortingConfig: (updates: Partial<SortingConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (configJson: string) => boolean;
  switchProfile: (profileName: string) => void;
  profiles: string[];
  isDirty: boolean;
}

// ==================== DEFAULT CONFIG ====================

const DEFAULT_CONFIG: FrontendConfig = {
  version: '1.0',
  sync: {
    enabled: true,
    interval: 0, // Disabled by default (manual sync)
    autoFill: true,
    overwrite: 'never',
    duplicateStrategy: 'skip',
    batchSize: 50,
    retry: {
      maxAttempts: 3,
      delay: 1000,
      backoff: 'exponential',
    },
  },
  mapping: {
    fieldMappings: {},
    transformations: [],
    defaults: {},
    validations: [],
    categoryMapping: {},
  },
  display: {
    columns: ['name', 'price', 'inventory', 'status', 'category'],
    gridColumns: 4,
    visibleFields: ['name', 'price', 'inventory', 'status', 'category', 'sku'],
    badges: [],
    colorScheme: 'default',
  },
  filters: {
    presets: [],
    quickFilters: [],
    defaultFilters: {},
  },
  sorting: {
    presets: [],
    defaultSort: {
      sortBy: 'name',
      sortOrder: 'asc',
    },
    multiLevel: false,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ==================== STORAGE KEYS ====================

const STORAGE_PREFIX = 'nebula_frontend_config';
const PROFILES_KEY = `${STORAGE_PREFIX}_profiles`;

// ==================== HOOK ====================

export function useFrontendConfig(
  options: UseFrontendConfigOptions = {}
): UseFrontendConfigResult {
  const {
    profile = 'default',
    autoSave = true,
    storage = 'localStorage',
  } = options;

  const [config, setConfig] = useState<FrontendConfig>(DEFAULT_CONFIG);
  const [isDirty, setIsDirty] = useState(false);
  const [profiles, setProfiles] = useState<string[]>(['default']);
  const configRef = useRef<FrontendConfig>(DEFAULT_CONFIG);
  const profileRef = useRef<string>(profile);

  // Load config from storage
  const loadConfig = useCallback((profileName: string): FrontendConfig => {
    try {
      if (typeof window === 'undefined') return DEFAULT_CONFIG;

      const key = `${STORAGE_PREFIX}_${profileName}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle missing fields
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          sync: { ...DEFAULT_CONFIG.sync, ...parsed.sync },
          mapping: { ...DEFAULT_CONFIG.mapping, ...parsed.mapping },
          display: { ...DEFAULT_CONFIG.display, ...parsed.display },
          filters: { ...DEFAULT_CONFIG.filters, ...parsed.filters },
          sorting: { ...DEFAULT_CONFIG.sorting, ...parsed.sorting },
        };
      }
    } catch (error) {
      logger.error('Failed to load config from storage', { error, profile: profileName });
    }

    return DEFAULT_CONFIG;
  }, []);

  // Save config to storage
  const saveConfig = useCallback((configToSave: FrontendConfig, profileName: string) => {
    try {
      if (typeof window === 'undefined') return;

      const key = `${STORAGE_PREFIX}_${profileName}`;
      const configWithTimestamp = {
        ...configToSave,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(configWithTimestamp));

      // Update profiles list
      const profilesList = JSON.parse(localStorage.getItem(PROFILES_KEY) || '["default"]');
      if (!profilesList.includes(profileName)) {
        profilesList.push(profileName);
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profilesList));
        setProfiles(profilesList);
      }

      logger.debug('Config saved to storage', { profile: profileName });
    } catch (error) {
      logger.error('Failed to save config to storage', { error, profile: profileName });
    }
  }, []);

  // Load profiles list
  const loadProfiles = useCallback(() => {
    try {
      if (typeof window === 'undefined') return ['default'];

      const stored = localStorage.getItem(PROFILES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load profiles list', { error });
    }

    return ['default'];
  }, []);

  // Initialize config on mount
  useEffect(() => {
    const loadedProfiles = loadProfiles();
    setProfiles(loadedProfiles);

    const loadedConfig = loadConfig(profile);
    setConfig(loadedConfig);
    configRef.current = loadedConfig;
    profileRef.current = profile;
  }, [profile, loadConfig, loadProfiles]);

  // Auto-save when config changes
  useEffect(() => {
    if (autoSave && isDirty) {
      saveConfig(configRef.current, profileRef.current);
      setIsDirty(false);
    }
  }, [autoSave, isDirty, saveConfig]);

  // Update config
  const updateConfig = useCallback((updates: Partial<FrontendConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...updates };
      configRef.current = updated;
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Update sync config
  const updateSyncConfig = useCallback((updates: Partial<SyncConfig>) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        sync: { ...prev.sync, ...updates },
      };
      configRef.current = updated;
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Update mapping config
  const updateMappingConfig = useCallback((updates: Partial<MappingConfig>) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        mapping: { ...prev.mapping, ...updates },
      };
      configRef.current = updated;
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Update display config
  const updateDisplayConfig = useCallback((updates: Partial<DisplayConfig>) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        display: { ...prev.display, ...updates },
      };
      configRef.current = updated;
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Update filters config
  const updateFiltersConfig = useCallback((updates: Partial<FiltersConfig>) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        filters: { ...prev.filters, ...updates },
      };
      configRef.current = updated;
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Update sorting config
  const updateSortingConfig = useCallback((updates: Partial<SortingConfig>) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        sorting: { ...prev.sorting, ...updates },
      };
      configRef.current = updated;
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Reset config to defaults
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    configRef.current = DEFAULT_CONFIG;
    setIsDirty(true);
  }, []);

  // Export config as JSON
  const exportConfig = useCallback(() => {
    return JSON.stringify(configRef.current, null, 2);
  }, []);

  // Import config from JSON
  const importConfig = useCallback((configJson: string): boolean => {
    try {
      const parsed = JSON.parse(configJson);
      // Validate structure
      if (parsed && typeof parsed === 'object') {
        setConfig((prev) => {
          const merged = {
            ...DEFAULT_CONFIG,
            ...parsed,
            sync: { ...DEFAULT_CONFIG.sync, ...parsed.sync },
            mapping: { ...DEFAULT_CONFIG.mapping, ...parsed.mapping },
            display: { ...DEFAULT_CONFIG.display, ...parsed.display },
            filters: { ...DEFAULT_CONFIG.filters, ...parsed.filters },
            sorting: { ...DEFAULT_CONFIG.sorting, ...parsed.sorting },
          };
          configRef.current = merged;
          setIsDirty(true);
          return merged;
        });
        return true;
      }
    } catch (error) {
      logger.error('Failed to import config', { error });
      return false;
    }
    return false;
  }, []);

  // Switch profile
  const switchProfile = useCallback((profileName: string) => {
    // Save current config
    if (isDirty) {
      saveConfig(configRef.current, profileRef.current);
    }

    // Load new profile
    const loadedConfig = loadConfig(profileName);
    setConfig(loadedConfig);
    configRef.current = loadedConfig;
    profileRef.current = profileName;
    setIsDirty(false);
  }, [isDirty, saveConfig, loadConfig]);

  return {
    config,
    updateConfig,
    updateSyncConfig,
    updateMappingConfig,
    updateDisplayConfig,
    updateFiltersConfig,
    updateSortingConfig,
    resetConfig,
    exportConfig,
    importConfig,
    switchProfile,
    profiles,
    isDirty,
  };
}












