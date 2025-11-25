import { create } from 'zustand';
import { logger } from '../logger';

interface DashboardFilters {
  timeRange: '1h' | '24h' | '7d' | '30d';
  metrics: string[];
  priority: string[];
  status: string[];
}

interface DashboardLayout {
  columns: number;
  compact: boolean;
  showAnimations: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

interface NotificationSettings {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  alertThresholds: {
    escalated: number;
    waiting: number;
    critical: number;
  };
}

interface DashboardState {
  // UI State
  sidebarOpen: boolean;
  activeView: string;
  filters: DashboardFilters;
  layout: DashboardLayout;
  notifications: NotificationSettings;

  // Real-time State
  liveUpdates: boolean;
  lastUpdate: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';

  // Actions
  setSidebarOpen: (open: boolean) => void;
  setActiveView: (view: string) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setLayout: (layout: Partial<DashboardLayout>) => void;
  setNotifications: (settings: Partial<NotificationSettings>) => void;
  toggleLiveUpdates: () => void;
  setConnectionStatus: (status: DashboardState['connectionStatus']) => void;
  updateLastUpdate: () => void;
  resetFilters: () => void;
  resetLayout: () => void;
}

const defaultFilters: DashboardFilters = {
  timeRange: '24h',
  metrics: ['tickets', 'response_time', 'satisfaction'],
  priority: [],
  status: []
};

const defaultLayout: DashboardLayout = {
  columns: 3,
  compact: false,
  showAnimations: true,
  autoRefresh: true,
  refreshInterval: 30000 // 30 Sekunden
};

const defaultNotifications: NotificationSettings = {
  soundEnabled: true,
  desktopNotifications: true,
  alertThresholds: {
    escalated: 3,
    waiting: 10,
    critical: 1
  }
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial State
  sidebarOpen: true,
  activeView: 'overview',
  filters: defaultFilters,
  layout: defaultLayout,
  notifications: defaultNotifications,
  liveUpdates: true,
  lastUpdate: null,
  connectionStatus: 'connecting',

  // Actions
  setSidebarOpen: (open: boolean) => {
    set(state => ({
      ...state,
      sidebarOpen: open
    }));

    logger.debug('Sidebar toggled', { open });
  },

  setActiveView: (view: string) => {
    set(state => ({
      ...state,
      activeView: view
    }));

    logger.debug('Active view changed', { view });
  },

  setFilters: (newFilters: Partial<DashboardFilters>) => {
    set(state => ({
      ...state,
      filters: {
        ...state.filters,
        ...newFilters
      }
    }));

    logger.debug('Filters updated', newFilters);
  },

  setLayout: (newLayout: Partial<DashboardLayout>) => {
    set(state => ({
      ...state,
      layout: {
        ...state.layout,
        ...newLayout
      }
    }));

    logger.debug('Layout updated', newLayout);
  },

  setNotifications: (settings: Partial<NotificationSettings>) => {
    set(state => ({
      ...state,
      notifications: {
        ...state.notifications,
        ...settings
      }
    }));

    logger.debug('Notification settings updated', settings);
  },

  toggleLiveUpdates: () => {
    set(state => {
      const newLiveUpdates = !state.liveUpdates;

      logger.info('Live updates toggled', { enabled: newLiveUpdates });

      return {
        ...state,
        liveUpdates: newLiveUpdates
      };
    });
  },

  setConnectionStatus: (status: DashboardState['connectionStatus']) => {
    set(state => ({
      ...state,
      connectionStatus: status
    }));

    logger.debug('Connection status changed', { status });
  },

  updateLastUpdate: () => {
    set(state => ({
      ...state,
      lastUpdate: new Date().toISOString()
    }));
  },

  resetFilters: () => {
    set(state => ({
      ...state,
      filters: defaultFilters
    }));

    logger.info('Filters reset to defaults');
  },

  resetLayout: () => {
    set(state => ({
      ...state,
      layout: defaultLayout
    }));

    logger.info('Layout reset to defaults');
  }
}));

// Helper Hooks
export const useDashboardUI = () => {
  const {
    sidebarOpen,
    activeView,
    setSidebarOpen,
    setActiveView
  } = useDashboardStore();

  return {
    sidebarOpen,
    activeView,
    setSidebarOpen,
    setActiveView
  };
};

export const useDashboardFilters = () => {
  const {
    filters,
    setFilters,
    resetFilters
  } = useDashboardStore();

  return {
    filters,
    setFilters,
    resetFilters
  };
};

export const useDashboardLayout = () => {
  const {
    layout,
    setLayout,
    resetLayout
  } = useDashboardStore();

  return {
    layout,
    setLayout,
    resetLayout
  };
};

export const useLiveUpdates = () => {
  const {
    liveUpdates,
    connectionStatus,
    lastUpdate,
    toggleLiveUpdates,
    setConnectionStatus,
    updateLastUpdate
  } = useDashboardStore();

  return {
    liveUpdates,
    connectionStatus,
    lastUpdate,
    toggleLiveUpdates,
    setConnectionStatus,
    updateLastUpdate
  };
};

export const useNotificationSettings = () => {
  const {
    notifications,
    setNotifications
  } = useDashboardStore();

  return {
    notifications,
    setNotifications
  };
};
