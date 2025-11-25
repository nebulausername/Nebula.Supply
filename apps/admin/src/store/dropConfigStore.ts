import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { z } from 'zod';

// Validation Schemas
const ColumnConfigSchema = z.object({
  id: z.string(),
  label: z.string(),
  visible: z.boolean(),
  width: z.number().min(100).max(500).optional(),
  order: z.number(),
  sortable: z.boolean().optional(),
});

const FilterPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  filters: z.record(z.any()),
  createdAt: z.string(),
});

const CustomFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'number', 'date', 'boolean', 'select']),
  required: z.boolean(),
  defaultValue: z.any().optional(),
  options: z.array(z.string()).optional(),
});

const NotificationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  condition: z.string(), // e.g., "stock < 10"
  actions: z.array(z.string()), // e.g., ["email", "desktop"]
});

const BulkActionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  actions: z.array(z.object({
    type: z.string(),
    field: z.string(),
    value: z.any(),
  })),
  createdAt: z.string(),
});

export type ColumnConfig = z.infer<typeof ColumnConfigSchema>;
export type FilterPreset = z.infer<typeof FilterPresetSchema>;
export type CustomField = z.infer<typeof CustomFieldSchema>;
export type NotificationRule = z.infer<typeof NotificationRuleSchema>;
export type BulkActionTemplate = z.infer<typeof BulkActionTemplateSchema>;

export type ViewMode = 'table' | 'cards' | 'kanban' | 'timeline';
export type TableColumnId = 
  | 'name' 
  | 'badge' 
  | 'status' 
  | 'access' 
  | 'stock' 
  | 'sold' 
  | 'revenue' 
  | 'progress' 
  | 'deadline' 
  | 'interest'
  | 'variants'
  | 'actions';

export interface DropDashboardConfig {
  // Layout Configuration
  layout: {
    columns: ColumnConfig[];
    viewMode: ViewMode;
    compact: boolean;
    showSidebar: boolean;
    sidebarWidth: number;
  };

  // Filter Configuration
  filters: {
    presets: FilterPreset[];
    activePreset: string | null;
    defaultFilters: Record<string, any>;
    savedQueries: FilterPreset[];
  };

  // Custom Fields
  customFields: CustomField[];

  // Notification Settings
  notifications: {
    enabled: boolean;
    rules: NotificationRule[];
    soundEnabled: boolean;
    desktopNotifications: boolean;
    emailNotifications: boolean;
  };

  // Bulk Actions
  bulkActions: {
    templates: BulkActionTemplate[];
    defaultActions: string[];
  };

  // View Preferences
  viewPreferences: {
    itemsPerPage: number;
    autoRefresh: boolean;
    refreshInterval: number;
    showVariants: boolean;
    showAnalytics: boolean;
    groupBy: string | null;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };

  // Advanced Settings
  advanced: {
    optimisticUpdates: boolean;
    conflictResolution: 'last-write-wins' | 'manual' | 'merge';
    enableDragDrop: boolean;
    enableKeyboardShortcuts: boolean;
    showTooltips: boolean;
    animationEnabled: boolean;
  };

  // Export/Import Settings
  export: {
    defaultFormat: 'csv' | 'json' | 'xlsx';
    includeFields: string[];
    customTemplates: Array<{
      id: string;
      name: string;
      format: string;
      fields: string[];
    }>;
  };
}

const defaultColumns: ColumnConfig[] = [
  { id: 'name', label: 'Name', visible: true, order: 0, sortable: true },
  { id: 'badge', label: 'Badge', visible: true, order: 1, sortable: false },
  { id: 'status', label: 'Status', visible: true, order: 2, sortable: true },
  { id: 'access', label: 'Access', visible: true, order: 3, sortable: true },
  { id: 'stock', label: 'Stock', visible: true, order: 4, sortable: true },
  { id: 'sold', label: 'Sold', visible: true, order: 5, sortable: true },
  { id: 'revenue', label: 'Revenue', visible: true, order: 6, sortable: true },
  { id: 'progress', label: 'Progress', visible: false, order: 7, sortable: true },
  { id: 'deadline', label: 'Deadline', visible: false, order: 8, sortable: true },
  { id: 'interest', label: 'Interest', visible: false, order: 9, sortable: true },
  { id: 'variants', label: 'Variants', visible: false, order: 10, sortable: false },
  { id: 'actions', label: 'Actions', visible: true, order: 11, sortable: false },
];

const defaultNotificationRules: NotificationRule[] = [
  {
    id: 'low-stock',
    name: 'Low Stock Alert',
    enabled: true,
    condition: 'availableStock < 10',
    actions: ['desktop'],
  },
  {
    id: 'high-revenue',
    name: 'High Revenue Milestone',
    enabled: true,
    condition: 'revenue > 1000',
    actions: ['desktop', 'sound'],
  },
];

const defaultBulkActionTemplates: BulkActionTemplate[] = [
  {
    id: 'archive-sold-out',
    name: 'Archive Sold Out',
    description: 'Set status to sold_out for all selected',
    actions: [{ type: 'update', field: 'status', value: 'sold_out' }],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'activate-selected',
    name: 'Activate Selected',
    actions: [{ type: 'update', field: 'status', value: 'active' }],
    createdAt: new Date().toISOString(),
  },
];

const defaultConfig: DropDashboardConfig = {
  layout: {
    columns: defaultColumns,
    viewMode: 'table',
    compact: false,
    showSidebar: true,
    sidebarWidth: 280,
  },
  filters: {
    presets: [],
    activePreset: null,
    defaultFilters: {},
    savedQueries: [],
  },
  customFields: [],
  notifications: {
    enabled: true,
    rules: defaultNotificationRules,
    soundEnabled: true,
    desktopNotifications: true,
    emailNotifications: false,
  },
  bulkActions: {
    templates: defaultBulkActionTemplates,
    defaultActions: ['updateStatus', 'delete', 'export'],
  },
  viewPreferences: {
    itemsPerPage: 20,
    autoRefresh: true,
    refreshInterval: 30000,
    showVariants: false,
    showAnalytics: false,
    groupBy: null,
    sortBy: 'newest',
    sortDirection: 'desc',
  },
  advanced: {
    optimisticUpdates: true,
    conflictResolution: 'last-write-wins',
    enableDragDrop: true,
    enableKeyboardShortcuts: true,
    showTooltips: true,
    animationEnabled: true,
  },
  export: {
    defaultFormat: 'csv',
    includeFields: ['name', 'status', 'access', 'stock', 'sold', 'revenue'],
    customTemplates: [],
  },
};

export interface DropConfigState {
  config: DropDashboardConfig;
  
  // Actions - Layout
  setViewMode: (mode: ViewMode) => void;
  toggleCompact: () => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  updateColumns: (columns: ColumnConfig[]) => void;
  toggleColumnVisibility: (columnId: TableColumnId) => void;
  reorderColumns: (columnIds: string[]) => void;
  
  // Actions - Filters
  addFilterPreset: (preset: Omit<FilterPreset, 'id' | 'createdAt'>) => void;
  removeFilterPreset: (id: string) => void;
  setActivePreset: (id: string | null) => void;
  updateFilterPreset: (id: string, preset: Partial<FilterPreset>) => void;
  saveQuery: (name: string, filters: Record<string, any>) => void;
  
  // Actions - Custom Fields
  addCustomField: (field: Omit<CustomField, 'id'>) => void;
  removeCustomField: (id: string) => void;
  updateCustomField: (id: string, field: Partial<CustomField>) => void;
  
  // Actions - Notifications
  toggleNotifications: () => void;
  addNotificationRule: (rule: Omit<NotificationRule, 'id'>) => void;
  removeNotificationRule: (id: string) => void;
  updateNotificationRule: (id: string, rule: Partial<NotificationRule>) => void;
  setNotificationSettings: (settings: Partial<DropDashboardConfig['notifications']>) => void;
  
  // Actions - Bulk Actions
  addBulkActionTemplate: (template: Omit<BulkActionTemplate, 'id' | 'createdAt'>) => void;
  removeBulkActionTemplate: (id: string) => void;
  updateBulkActionTemplate: (id: string, template: Partial<BulkActionTemplate>) => void;
  
  // Actions - View Preferences
  setItemsPerPage: (count: number) => void;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
  setViewPreference: <K extends keyof DropDashboardConfig['viewPreferences']>(
    key: K,
    value: DropDashboardConfig['viewPreferences'][K]
  ) => void;
  
  // Actions - Advanced
  setAdvancedSetting: <K extends keyof DropDashboardConfig['advanced']>(
    key: K,
    value: DropDashboardConfig['advanced'][K]
  ) => void;
  
  // Actions - Export
  setExportFormat: (format: DropDashboardConfig['export']['defaultFormat']) => void;
  setExportFields: (fields: string[]) => void;
  addExportTemplate: (template: DropDashboardConfig['export']['customTemplates'][0]) => void;
  removeExportTemplate: (id: string) => void;
  
  // Utility Actions
  resetToDefaults: () => void;
  exportConfig: () => string;
  importConfig: (configJson: string) => void;
  resetSection: (section: keyof DropDashboardConfig) => void;
}

export const useDropConfigStore = create<DropConfigState>()(
  devtools(
    persist(
      (set, get) => ({
        config: defaultConfig,

        // Layout Actions
        setViewMode: (mode) => {
          set((state) => ({
            config: {
              ...state.config,
              layout: { ...state.config.layout, viewMode: mode },
            },
          }));
        },

        toggleCompact: () => {
          set((state) => ({
            config: {
              ...state.config,
              layout: {
                ...state.config.layout,
                compact: !state.config.layout.compact,
              },
            },
          }));
        },

        toggleSidebar: () => {
          set((state) => ({
            config: {
              ...state.config,
              layout: {
                ...state.config.layout,
                showSidebar: !state.config.layout.showSidebar,
              },
            },
          }));
        },

        setSidebarWidth: (width) => {
          set((state) => ({
            config: {
              ...state.config,
              layout: {
                ...state.config.layout,
                sidebarWidth: Math.max(200, Math.min(400, width)),
              },
            },
          }));
        },

        updateColumns: (columns) => {
          set((state) => ({
            config: {
              ...state.config,
              layout: { ...state.config.layout, columns },
            },
          }));
        },

        toggleColumnVisibility: (columnId) => {
          set((state) => {
            const columns = state.config.layout.columns.map((col) =>
              col.id === columnId ? { ...col, visible: !col.visible } : col
            );
            return {
              config: {
                ...state.config,
                layout: { ...state.config.layout, columns },
              },
            };
          });
        },

        reorderColumns: (columnIds) => {
          set((state) => {
            const columnMap = new Map(
              state.config.layout.columns.map((col) => [col.id, col])
            );
            const reordered = columnIds
              .map((id) => columnMap.get(id))
              .filter((col): col is ColumnConfig => col !== undefined);
            return {
              config: {
                ...state.config,
                layout: {
                  ...state.config.layout,
                  columns: reordered.map((col, idx) => ({
                    ...col,
                    order: idx,
                  })),
                },
              },
            };
          });
        },

        // Filter Actions
        addFilterPreset: (preset) => {
          const newPreset: FilterPreset = {
            ...preset,
            id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            config: {
              ...state.config,
              filters: {
                ...state.config.filters,
                presets: [...state.config.filters.presets, newPreset],
              },
            },
          }));
        },

        removeFilterPreset: (id) => {
          set((state) => ({
            config: {
              ...state.config,
              filters: {
                ...state.config.filters,
                presets: state.config.filters.presets.filter((p) => p.id !== id),
                activePreset:
                  state.config.filters.activePreset === id
                    ? null
                    : state.config.filters.activePreset,
              },
            },
          }));
        },

        setActivePreset: (id) => {
          set((state) => ({
            config: {
              ...state.config,
              filters: {
                ...state.config.filters,
                activePreset: id,
              },
            },
          }));
        },

        updateFilterPreset: (id, preset) => {
          set((state) => ({
            config: {
              ...state.config,
              filters: {
                ...state.config.filters,
                presets: state.config.filters.presets.map((p) =>
                  p.id === id ? { ...p, ...preset } : p
                ),
              },
            },
          }));
        },

        saveQuery: (name, filters) => {
          const query: FilterPreset = {
            id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            filters,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            config: {
              ...state.config,
              filters: {
                ...state.config.filters,
                savedQueries: [...state.config.filters.savedQueries, query],
              },
            },
          }));
        },

        // Custom Fields Actions
        addCustomField: (field) => {
          const newField: CustomField = {
            ...field,
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          };
          set((state) => ({
            config: {
              ...state.config,
              customFields: [...state.config.customFields, newField],
            },
          }));
        },

        removeCustomField: (id) => {
          set((state) => ({
            config: {
              ...state.config,
              customFields: state.config.customFields.filter((f) => f.id !== id),
            },
          }));
        },

        updateCustomField: (id, field) => {
          set((state) => ({
            config: {
              ...state.config,
              customFields: state.config.customFields.map((f) =>
                f.id === id ? { ...f, ...field } : f
              ),
            },
          }));
        },

        // Notification Actions
        toggleNotifications: () => {
          set((state) => ({
            config: {
              ...state.config,
              notifications: {
                ...state.config.notifications,
                enabled: !state.config.notifications.enabled,
              },
            },
          }));
        },

        addNotificationRule: (rule) => {
          const newRule: NotificationRule = {
            ...rule,
            id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          };
          set((state) => ({
            config: {
              ...state.config,
              notifications: {
                ...state.config.notifications,
                rules: [...state.config.notifications.rules, newRule],
              },
            },
          }));
        },

        removeNotificationRule: (id) => {
          set((state) => ({
            config: {
              ...state.config,
              notifications: {
                ...state.config.notifications,
                rules: state.config.notifications.rules.filter((r) => r.id !== id),
              },
            },
          }));
        },

        updateNotificationRule: (id, rule) => {
          set((state) => ({
            config: {
              ...state.config,
              notifications: {
                ...state.config.notifications,
                rules: state.config.notifications.rules.map((r) =>
                  r.id === id ? { ...r, ...rule } : r
                ),
              },
            },
          }));
        },

        setNotificationSettings: (settings) => {
          set((state) => ({
            config: {
              ...state.config,
              notifications: {
                ...state.config.notifications,
                ...settings,
              },
            },
          }));
        },

        // Bulk Actions
        addBulkActionTemplate: (template) => {
          const newTemplate: BulkActionTemplate = {
            ...template,
            id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            config: {
              ...state.config,
              bulkActions: {
                ...state.config.bulkActions,
                templates: [...state.config.bulkActions.templates, newTemplate],
              },
            },
          }));
        },

        removeBulkActionTemplate: (id) => {
          set((state) => ({
            config: {
              ...state.config,
              bulkActions: {
                ...state.config.bulkActions,
                templates: state.config.bulkActions.templates.filter(
                  (t) => t.id !== id
                ),
              },
            },
          }));
        },

        updateBulkActionTemplate: (id, template) => {
          set((state) => ({
            config: {
              ...state.config,
              bulkActions: {
                ...state.config.bulkActions,
                templates: state.config.bulkActions.templates.map((t) =>
                  t.id === id ? { ...t, ...template } : t
                ),
              },
            },
          }));
        },

        // View Preferences
        setItemsPerPage: (count) => {
          set((state) => ({
            config: {
              ...state.config,
              viewPreferences: {
                ...state.config.viewPreferences,
                itemsPerPage: Math.max(5, Math.min(100, count)),
              },
            },
          }));
        },

        toggleAutoRefresh: () => {
          set((state) => ({
            config: {
              ...state.config,
              viewPreferences: {
                ...state.config.viewPreferences,
                autoRefresh: !state.config.viewPreferences.autoRefresh,
              },
            },
          }));
        },

        setRefreshInterval: (interval) => {
          set((state) => ({
            config: {
              ...state.config,
              viewPreferences: {
                ...state.config.viewPreferences,
                refreshInterval: Math.max(5000, Math.min(300000, interval)),
              },
            },
          }));
        },

        setViewPreference: (key, value) => {
          set((state) => ({
            config: {
              ...state.config,
              viewPreferences: {
                ...state.config.viewPreferences,
                [key]: value,
              },
            },
          }));
        },

        // Advanced Settings
        setAdvancedSetting: (key, value) => {
          set((state) => ({
            config: {
              ...state.config,
              advanced: {
                ...state.config.advanced,
                [key]: value,
              },
            },
          }));
        },

        // Export Settings
        setExportFormat: (format) => {
          set((state) => ({
            config: {
              ...state.config,
              export: {
                ...state.config.export,
                defaultFormat: format,
              },
            },
          }));
        },

        setExportFields: (fields) => {
          set((state) => ({
            config: {
              ...state.config,
              export: {
                ...state.config.export,
                includeFields: fields,
              },
            },
          }));
        },

        addExportTemplate: (template) => {
          set((state) => ({
            config: {
              ...state.config,
              export: {
                ...state.config.export,
                customTemplates: [
                  ...state.config.export.customTemplates,
                  template,
                ],
              },
            },
          }));
        },

        removeExportTemplate: (id) => {
          set((state) => ({
            config: {
              ...state.config,
              export: {
                ...state.config.export,
                customTemplates: state.config.export.customTemplates.filter(
                  (t) => t.id !== id
                ),
              },
            },
          }));
        },

        // Utility Actions
        resetToDefaults: () => {
          set({ config: defaultConfig });
        },

        exportConfig: () => {
          return JSON.stringify(get().config, null, 2);
        },

        importConfig: (configJson) => {
          try {
            const imported = JSON.parse(configJson) as DropDashboardConfig;
            // Validate and merge
            set({ config: imported });
          } catch (error) {
            console.error('Failed to import config:', error);
            throw new Error('Invalid config format');
          }
        },

        resetSection: (section) => {
          set((state) => ({
            config: {
              ...state.config,
              [section]: defaultConfig[section],
            },
          }));
        },
      }),
      {
        name: 'drop-dashboard-config',
        version: 1,
      }
    ),
    { name: 'DropConfigStore' }
  )
);

// Selector Hooks for Performance
export const useDropConfig = () => useDropConfigStore((state) => state.config);
export const useDropLayout = () =>
  useDropConfigStore((state) => state.config.layout);
export const useDropFilters = () =>
  useDropConfigStore((state) => state.config.filters);
export const useDropNotifications = () =>
  useDropConfigStore((state) => state.config.notifications);
export const useDropViewPreferences = () =>
  useDropConfigStore((state) => state.config.viewPreferences);
export const useDropAdvanced = () =>
  useDropConfigStore((state) => state.config.advanced);

