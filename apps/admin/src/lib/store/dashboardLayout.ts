import { create } from 'zustand';
import { logger } from '../logger';

export type WidgetId = 
  | 'quick-stats'
  | 'kpi-dashboard'
  | 'ecommerce-kpis'
  | 'ticket-command'
  | 'trend-feed'
  | 'queue-by-priority'
  | 'automations'
  | 'shop-categories'
  | 'knowledge-highlights'
  | 'coin-rewards'
  | 'activity-feed'
  | 'invite-status';

export interface Widget {
  id: WidgetId;
  title: string;
  enabled: boolean;
  order: number;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
}

export interface DashboardLayout {
  widgets: Widget[];
  layoutMode: 'grid' | 'freeform';
  savedViews: Array<{
    id: string;
    name: string;
    widgets: Widget[];
    createdAt: string;
  }>;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'quick-stats', title: 'Quick Stats', enabled: true, order: 0, size: 'full', position: { x: 0, y: 0 } },
  { id: 'kpi-dashboard', title: 'Live Metrics', enabled: true, order: 1, size: 'full', position: { x: 0, y: 1 } },
  { id: 'ecommerce-kpis', title: 'E-Commerce Metrics', enabled: true, order: 2, size: 'full', position: { x: 0, y: 2 } },
  { id: 'ticket-command', title: 'Ticket Command', enabled: true, order: 3, size: 'large', position: { x: 0, y: 3 } },
  { id: 'trend-feed', title: 'Trend Feed', enabled: true, order: 4, size: 'medium', position: { x: 1, y: 3 } },
  { id: 'queue-by-priority', title: 'Queue by Priority', enabled: true, order: 5, size: 'large', position: { x: 0, y: 4 } },
  { id: 'automations', title: 'Automations', enabled: true, order: 6, size: 'medium', position: { x: 1, y: 4 } },
  { id: 'shop-categories', title: 'Shop Categories', enabled: true, order: 7, size: 'medium', position: { x: 0, y: 5 } },
  { id: 'knowledge-highlights', title: 'Knowledge Highlights', enabled: true, order: 8, size: 'medium', position: { x: 1, y: 5 } },
  { id: 'coin-rewards', title: 'Coin Rewards', enabled: true, order: 9, size: 'medium', position: { x: 0, y: 6 } },
  { id: 'activity-feed', title: 'Activity Feed', enabled: true, order: 10, size: 'medium', position: { x: 1, y: 6 } },
  { id: 'invite-status', title: 'Invite Status', enabled: true, order: 11, size: 'full', position: { x: 0, y: 7 } },
];

interface DashboardLayoutState {
  layout: DashboardLayout;
  isEditing: boolean;
  draggedWidget: WidgetId | null;
  setLayout: (layout: DashboardLayout) => void;
  updateWidget: (widgetId: WidgetId, updates: Partial<Widget>) => void;
  toggleWidget: (widgetId: WidgetId) => void;
  reorderWidgets: (widgetIds: WidgetId[]) => void;
  resetLayout: () => void;
  saveView: (name: string) => string;
  loadView: (viewId: string) => void;
  deleteView: (viewId: string) => void;
  setIsEditing: (editing: boolean) => void;
  setDraggedWidget: (widgetId: WidgetId | null) => void;
}

// Simple persistence using localStorage
const STORAGE_KEY = 'dashboard-layout-storage';

const loadFromStorage = (): Partial<DashboardLayoutState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure layout has widgets array
      if (parsed.layout && Array.isArray(parsed.layout.widgets)) {
        return { layout: parsed.layout };
      }
    }
  } catch (error) {
    logger.error('Failed to load dashboard layout from storage', { error });
  }
  return {};
};

const saveToStorage = (layout: DashboardLayout) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout }));
  } catch (error) {
    logger.error('Failed to save dashboard layout to storage', { error });
  }
};

const getInitialLayout = (): DashboardLayout => {
  const stored = loadFromStorage();
  if (stored.layout && Array.isArray(stored.layout.widgets)) {
    return {
      widgets: stored.layout.widgets,
      layoutMode: stored.layout.layoutMode || 'grid',
      savedViews: Array.isArray(stored.layout.savedViews) ? stored.layout.savedViews : []
    };
  }
  return {
    widgets: DEFAULT_WIDGETS,
    layoutMode: 'grid',
    savedViews: []
  };
};

export const useDashboardWidgetLayout = create<DashboardLayoutState>()(
  (set, get) => ({
      layout: getInitialLayout(),
      isEditing: false,
      draggedWidget: null,

      setLayout: (layout) => {
        set({ layout });
        saveToStorage(layout);
        logger.info('Dashboard layout updated', { widgetCount: layout.widgets.length });
      },

      updateWidget: (widgetId, updates) => {
        set((state) => {
          if (!state.layout?.widgets || !Array.isArray(state.layout.widgets)) {
            logger.warn('Cannot update widget: layout.widgets is not an array', { widgetId });
            return state;
          }
          return {
            layout: {
              ...state.layout,
              widgets: state.layout.widgets.map((widget) =>
                widget.id === widgetId ? { ...widget, ...updates } : widget
              )
            }
          };
        });
        logger.info('Widget updated', { widgetId, updates });
      },

      toggleWidget: (widgetId) => {
        set((state) => {
          if (!state.layout?.widgets || !Array.isArray(state.layout.widgets)) {
            logger.warn('Cannot toggle widget: layout.widgets is not an array', { widgetId });
            return state;
          }
          return {
            layout: {
              ...state.layout,
              widgets: state.layout.widgets.map((widget) =>
                widget.id === widgetId ? { ...widget, enabled: !widget.enabled } : widget
              )
            }
          };
        });
        logger.info('Widget toggled', { widgetId });
      },

      reorderWidgets: (widgetIds) => {
        set((state) => {
          if (!state.layout?.widgets || !Array.isArray(state.layout.widgets)) {
            logger.warn('Cannot reorder widgets: layout.widgets is not an array');
            return state;
          }
          const widgetMap = new Map(state.layout.widgets.map(w => [w.id, w]));
          const reorderedWidgets = widgetIds
            .map((id, index) => {
              const widget = widgetMap.get(id);
              return widget ? { ...widget, order: index } : null;
            })
            .filter((w): w is Widget => w !== null);

          // Add any widgets not in the reordered list
          const existingIds = new Set(widgetIds);
          const remainingWidgets = state.layout.widgets
            .filter(w => !existingIds.has(w.id))
            .map((w, index) => ({ ...w, order: widgetIds.length + index }));

          return {
            layout: {
              ...state.layout,
              widgets: [...reorderedWidgets, ...remainingWidgets].sort((a, b) => a.order - b.order)
            }
          };
        });
        logger.info('Widgets reordered', { widgetIds });
      },

      resetLayout: () => {
        set({
          layout: {
            widgets: DEFAULT_WIDGETS,
            layoutMode: 'grid',
            savedViews: get().layout.savedViews
          }
        });
        logger.info('Dashboard layout reset');
      },

      saveView: (name) => {
        const viewId = `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
          layout: {
            ...state.layout,
            savedViews: [
              ...state.layout.savedViews,
              {
                id: viewId,
                name,
                widgets: state.layout.widgets,
                createdAt: new Date().toISOString()
              }
            ]
          }
        }));
        logger.info('Dashboard view saved', { viewId, name });
        return viewId;
      },

      loadView: (viewId) => {
        const state = get();
        if (!state.layout?.savedViews || !Array.isArray(state.layout.savedViews)) {
          logger.warn('Cannot load view: savedViews is not an array', { viewId });
          return;
        }
        const view = state.layout.savedViews.find(v => v.id === viewId);
        if (view && Array.isArray(view.widgets)) {
          set({
            layout: {
              ...state.layout,
              widgets: view.widgets
            }
          });
          logger.info('Dashboard view loaded', { viewId });
        }
      },

      deleteView: (viewId) => {
        set((state) => ({
          layout: {
            ...state.layout,
            savedViews: state.layout.savedViews.filter(v => v.id !== viewId)
          }
        }));
        logger.info('Dashboard view deleted', { viewId });
      },

      setIsEditing: (editing) => {
        set({ isEditing: editing });
      },

      setDraggedWidget: (widgetId) => {
        set({ draggedWidget: widgetId });
      }
    })
);

// Load initial state from storage
const initialState = loadFromStorage();
if (initialState.layout) {
  useDashboardWidgetLayout.setState({ layout: initialState.layout });
}

