import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProfilePreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    achievements: boolean;
    drops: boolean;
    coins: boolean;
    referrals: boolean;
  };
  privacy: {
    showStats: boolean;
    showAchievements: boolean;
    showActivity: boolean;
  };
  layout: {
    dashboardWidgets: string[];
    widgetOrder: string[];
  };
}

interface ProfileState {
  preferences: ProfilePreferences;
  lastSync: number | null;
  offlineQueue: any[];
  isOnline: boolean;
  
  // Actions
  updatePreferences: (preferences: Partial<ProfilePreferences>) => void;
  setOnline: (isOnline: boolean) => void;
  addToOfflineQueue: (action: any) => void;
  clearOfflineQueue: () => void;
  setLastSync: (timestamp: number) => void;
  reset: () => void;
}

const defaultPreferences: ProfilePreferences = {
  theme: 'dark',
  notifications: {
    achievements: true,
    drops: true,
    coins: true,
    referrals: true,
  },
  privacy: {
    showStats: true,
    showAchievements: true,
    showActivity: true,
  },
  layout: {
    dashboardWidgets: ['stats', 'activity', 'achievements', 'coins'],
    widgetOrder: ['stats', 'activity', 'achievements', 'coins'],
  },
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      lastSync: null,
      offlineQueue: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
            notifications: {
              ...state.preferences.notifications,
              ...(newPreferences.notifications || {}),
            },
            privacy: {
              ...state.preferences.privacy,
              ...(newPreferences.privacy || {}),
            },
            layout: {
              ...state.preferences.layout,
              ...(newPreferences.layout || {}),
            },
          },
        }));
      },

      setOnline: (isOnline) => {
        set({ isOnline });
        if (isOnline && get().offlineQueue.length > 0) {
          // TODO: Sync offline queue with server
          console.log('Syncing offline queue:', get().offlineQueue);
        }
      },

      addToOfflineQueue: (action) => {
        set((state) => ({
          offlineQueue: [...state.offlineQueue, action],
        }));
      },

      clearOfflineQueue: () => {
        set({ offlineQueue: [] });
      },

      setLastSync: (timestamp) => {
        set({ lastSync: timestamp });
      },

      reset: () => {
        set({
          preferences: defaultPreferences,
          lastSync: null,
          offlineQueue: [],
        });
      },
    }),
    {
      name: 'nebula-profile-store',
      partialize: (state) => ({
        preferences: state.preferences,
        lastSync: state.lastSync,
      }),
    }
  )
);

// Online/Offline detection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useProfileStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useProfileStore.getState().setOnline(false);
  });
}

