import "./index.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { useWebSocket } from './lib/websocket/client';
import { useAuthStore } from './lib/store/auth';
import { useDashboardStore } from './lib/store/dashboard';
import { logger } from './lib/logger';

// Import Components
import { LoginForm } from "./components/auth/LoginForm";
import { Dashboard } from "./components/dashboard/Dashboard";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { AppErrorBoundary } from "./components/system/AppErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";

// Create Query Client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes default
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false, // Changed to false for better UX - manual refresh preferred
      refetchOnMount: true, // Refetch on mount for fresh data
      refetchOnReconnect: true, // Refetch on reconnect
      refetchInterval: false, // Disable by default, enable per-query for live data
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      // Network mode: prefer online, but allow stale data when offline
      networkMode: 'online',
      // Structural sharing for better performance
      structuralSharing: true,
      // Optimistic updates enabled by default
      placeholderData: (previousData) => previousData, // Keep previous data while refetching
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      // Optimistic updates for better UX
      onError: (error, variables, context) => {
        // Error handling is done in components
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      // Network mode: mutations should always try online first
      networkMode: 'online',
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const { liveUpdates, setConnectionStatus, updateLastUpdate } = useDashboardStore();
  const [isHydrating, setIsHydrating] = useState(true);

  // Hydrate auth state beim App-Start
  useEffect(() => {
    // Hydrate Auth State aus localStorage
    hydrate();
    
    // Small delay um Flash zu vermeiden
    const timer = setTimeout(() => {
      setIsHydrating(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [hydrate]);

  // WebSocket Connection (Mock for now)
  const { connectionStatus } = useWebSocket();

  // Update connection status when WebSocket status changes
  useEffect(() => {
    setConnectionStatus(connectionStatus.connected ? 'connected' : 'disconnected');
  }, [connectionStatus.connected, setConnectionStatus]);

  // Update last update timestamp periodically (mock for now)
  useEffect(() => {
    if (!liveUpdates || !connectionStatus.connected) return;
    
    const interval = setInterval(() => {
      updateLastUpdate();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [liveUpdates, connectionStatus.connected, updateLastUpdate]);

  // Loading State (inkl. Hydration)
  if (isLoading || isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-[#0B0B12] to-[#050509]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Authentication Check
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Main Dashboard
  return <Dashboard />;
}

function App() {
  return (
    <AppErrorBoundary queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ToastProvider>
            <AppContent />
            {/* React Query DevTools disabled for now */}
            {/* {import.meta.env.DEV && (
              <ReactQueryDevtools initialIsOpen={false} />
            )} */}
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
