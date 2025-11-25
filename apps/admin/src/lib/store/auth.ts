import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setAuthTokens, clearAuthTokens, getAuthTokens } from '../api/client';
import { logger } from '../logger';

interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
  createdAt?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isDemoMode: boolean; // Demo-Mode Flag
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  hydrate: () => void; // Hydration für State Recovery

  // Internal
  _setLoading: (loading: boolean) => void;
  _setError: (error: string) => void;
  _setAuth: (user: User, tokens: AuthTokens, isDemo?: boolean) => void;
  _clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Helper function to check if token is demo token (optimized)
      const isDemoToken = (token: string | null): boolean => {
        return Boolean(token?.startsWith('demo-'));
      };

      // Initial State - Check localStorage for persisted auth
      const initialTokens = getAuthTokens();
      const isDemo = isDemoToken(initialTokens.accessToken);

      return {
        // Initial State
        user: null,
        tokens: null,
        isAuthenticated: false,
        isDemoMode: isDemo,
        isLoading: false,
        error: null,

      // Actions
      login: async (email: string, password: string) => {
        const state = get();
        state._setLoading(true);
        state._setError('');

        try {
          // Einfache Demo-Authentifizierung für sofortigen Zugriff
          if (email === 'admin@nebula.local' && password === 'admin123') {
            const now = new Date().toISOString();
            const timestamp = Date.now();
            
            const demoUser: User = {
              id: 'admin-1',
              email: 'admin@nebula.local',
              role: 'admin',
              permissions: ['tickets:read', 'tickets:write', 'dashboard:read', 'kpi:read', 'admin:full'],
              createdAt: now,
              lastLogin: now
            };

            const demoTokens: AuthTokens = {
              accessToken: `demo-jwt-token-${timestamp}`,
              refreshToken: `demo-refresh-token-${timestamp}`,
              expiresIn: 8 * 60 * 60 // 8 Stunden
            };

            // Setze Tokens im localStorage
            setAuthTokens(demoTokens.accessToken, demoTokens.refreshToken);

            // Update State mit Demo-Mode Flag
            state._setAuth(demoUser, demoTokens, true);

            logger.info('Demo user logged in successfully', { userId: demoUser.id, email: demoUser.email });
          } else {
            throw new Error('Ungültige Anmeldedaten. Verwende: admin@nebula.local / admin123');
          }

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Login fehlgeschlagen';
          get()._setError(errorMessage);
          logger.error('Login failed', { email, error: errorMessage });
          throw error;
        } finally {
          get()._setLoading(false);
        }
      },

      logout: async () => {
        const state = get();
        state._setLoading(true);

        try {
          // Einfacher Logout - nur lokale State bereinigen
          clearAuthTokens();
          state._clearAuth();

          logger.info('User logged out');

        } finally {
          state._setLoading(false);
        }
      },

      refreshToken: async () => {
        const state = get();
        const currentTokens = state.tokens;
        const isDemo = state.isDemoMode;

        // Kein Refresh für Demo-Tokens
        if (isDemo || isDemoToken(currentTokens?.accessToken || null)) {
          logger.info('Skipping token refresh for demo mode');
          return;
        }

        if (!currentTokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await api.post('/api/auth/refresh', {
            refreshToken: currentTokens.refreshToken
          });

          const { accessToken, expiresIn } = response;

          // Update Tokens
          const newTokens: AuthTokens = {
            ...currentTokens,
            accessToken,
            expiresIn
          };

          setAuthTokens(accessToken, currentTokens.refreshToken);

          // Update State
          set(prevState => ({
            ...prevState,
            tokens: newTokens
          }));

          logger.info('Token refreshed successfully');

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
          logger.error('Token refresh failed', { error: errorMessage, originalError: error });
          // Bei Fehler komplett ausloggen (nur wenn nicht Demo)
          if (!isDemo) {
            state.logout();
          }
          throw error;
        }
      },

      setUser: (user: User) => {
        set(state => ({
          ...state,
          user
        }));
      },

      clearError: () => {
        get()._setError('');
      },

      hydrate: () => {
        // Hydration für State Recovery beim App-Start
        const tokens = getAuthTokens();
        
        if (!tokens.accessToken || !tokens.refreshToken) {
          return;
        }

        const isDemo = isDemoToken(tokens.accessToken);
        const currentState = get();
        
        // Wenn State bereits authentifiziert ist, nur Demo-Mode Flag aktualisieren
        if (currentState.isAuthenticated) {
          if (currentState.isDemoMode !== isDemo) {
            set({ ...currentState, isDemoMode: isDemo });
          }
          return;
        }
        
        // Versuche User aus localStorage zu holen
        try {
          const persisted = localStorage.getItem('nebula-auth-storage');
          if (persisted) {
            const parsed = JSON.parse(persisted);
            if (parsed.state?.user && parsed.state?.tokens) {
              set({
                ...currentState,
                user: parsed.state.user,
                tokens: parsed.state.tokens,
                isAuthenticated: true,
                isDemoMode: isDemo
              });
              logger.info('Auth state hydrated from localStorage', { isDemo });
              return;
            }
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to hydrate auth state';
          logger.warn('Failed to hydrate auth state', { error: errorMessage, originalError: error });
        }
        
        // Fallback: Setze minimalen State für Demo-Mode
        if (isDemo) {
          const now = new Date().toISOString();
          const demoUser: User = {
            id: 'admin-1',
            email: 'admin@nebula.local',
            role: 'admin',
            permissions: ['tickets:read', 'tickets:write', 'dashboard:read', 'kpi:read', 'admin:full'],
            createdAt: now,
            lastLogin: now
          };
          
          const demoTokens: AuthTokens = {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 8 * 60 * 60
          };
          
          currentState._setAuth(demoUser, demoTokens, true);
          logger.info('Demo auth state hydrated');
        }
      },

      // Internal Methods
      _setLoading: (loading: boolean) => {
        set(state => ({
          ...state,
          isLoading: loading
        }));
      },

      _setError: (error: string) => {
        set(state => ({
          ...state,
          error
        }));
      },

      _setAuth: (user: User, tokens: AuthTokens, isDemo: boolean = false) => {
        set(state => ({
          ...state,
          user,
          tokens,
          isAuthenticated: true,
          isDemoMode: isDemo,
          error: null
        }));
      },

      _clearAuth: () => {
        const state = get();
        // Bei Demo-Mode: Nur wenn explizit gewünscht
        if (state.isDemoMode) {
          logger.info('Skipping auth clear in demo mode');
          return;
        }
        
        set(prevState => ({
          ...prevState,
          user: null,
          tokens: null,
          isAuthenticated: false,
          isDemoMode: false,
          error: null
        }));
      }
      }
    },
    {
      name: 'nebula-auth-storage',
      // Nur bestimmte Teile des States persistieren
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        isDemoMode: state.isDemoMode
      }),
      // Hydration beim App-Start
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrate();
        }
      }
    }
  )
);

// Helper Hooks
export const useAuthUser = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  return { user, isAuthenticated, isLoading };
};

export const useAuthActions = () => {
  const { login, logout, refreshToken, clearError } = useAuthStore();
  return { login, logout, refreshToken, clearError };
};

export const useAuthError = () => {
  const { error } = useAuthStore();
  return error;
};

// Helper function exportieren (optimized)
export const isDemoToken = (token: string | null): boolean => {
  return Boolean(token?.startsWith('demo-'));
};

// Auto-Token-Refresh Setup (nur für non-demo tokens)
let refreshIntervalId: ReturnType<typeof setInterval> | null = null;

if (typeof window !== 'undefined') {
  const REFRESH_CHECK_INTERVAL = 60 * 1000; // 1 Minute
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 Minuten
  
  // Setup automatic token refresh
  const startTokenRefresh = () => {
    // Cleanup existing interval if any
    if (refreshIntervalId !== null) {
      clearInterval(refreshIntervalId);
    }

    refreshIntervalId = setInterval(async () => {
      const { tokens, refreshToken, isDemoMode } = useAuthStore.getState();

      // Skip refresh für Demo-Mode
      if (isDemoMode || isDemoToken(tokens?.accessToken || null)) {
        return;
      }

      if (!tokens?.accessToken || !tokens?.expiresIn) {
        return;
      }

      // Prüfe ob Token in den nächsten 5 Minuten abläuft
      const expiresAt = Date.now() + (tokens.expiresIn * 1000);
      const thresholdTime = Date.now() + REFRESH_THRESHOLD;

      if (expiresAt < thresholdTime) {
        try {
          await refreshToken();
        } catch (error) {
          logger.warn('Auto token refresh failed', error);
        }
      }
    }, REFRESH_CHECK_INTERVAL);
  };

  // Start token refresh
  startTokenRefresh();

  // Cleanup bei Page Unload
  const cleanup = () => {
    if (refreshIntervalId !== null) {
      clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }
  };

  window.addEventListener('beforeunload', cleanup);
  
  // Also cleanup on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Optional: cleanup when tab is hidden to save resources
      // cleanup();
    } else {
      // Restart when tab becomes visible again
      startTokenRefresh();
    }
  });
}
