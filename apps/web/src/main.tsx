import { StrictMode } from "react";
// Node polyfills for browser environment (process, Buffer)
// These shims prevent "process is not defined" errors from dependencies
import process from "process";
import { Buffer } from "buffer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles/glass.css";
import "./styles/animations.css";
import "./styles/drop-animations.css";
import "./styles/design-system.css";
import "./styles/mobile.css";
import "./styles/category-menu-animations.css";
import App from "./App";
import { initPerformanceMonitoring } from "./utils/performance";

// Expose shims globally for libraries expecting Node globals
(window as any).process = (window as any).process || process;
(window as any).Buffer = (window as any).Buffer || Buffer;

// Optimized QueryClient configuration with defaults for Rank API
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default retry: 3 attempts with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
      },
      // Default staleTime: 2 minutes (data is fresh for 2 minutes)
      staleTime: 2 * 60 * 1000,
      // Default gcTime: 5 minutes (cache stays in memory for 5 minutes)
      gcTime: 5 * 60 * 1000,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Refetch on reconnect when network comes back
      refetchOnReconnect: true,
      // Refetch on mount to ensure fresh data
      refetchOnMount: true,
    },
  },
});

// Global error handlers for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Suppress external extension errors
  const errorMessage = String(event.reason || '').toLowerCase();
  const isExtensionError = 
    errorMessage.includes('chrome-extension://') || 
    errorMessage.includes('moz-extension://') ||
    errorMessage.includes('safari-extension://') ||
    errorMessage.includes('runtime.lasterror') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('extension context invalidated') ||
    errorMessage.includes('denying load') ||
    errorMessage.includes('web_accessible_resources') ||
    errorMessage.includes('net::err_failed') ||
    errorMessage.includes('invalid/');
  
  if (isExtensionError) {
    event.preventDefault();
    return;
  }
  
  // Only log real errors (not in production for extension errors)
  if (!import.meta.env.PROD || !isExtensionError) {
    console.error('Unhandled promise rejection:', event.reason);
  }
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  // Suppress external extension errors
  const errorMessage = String(event.message || '').toLowerCase();
  const isExtensionError = 
    errorMessage.includes('chrome-extension://') || 
    errorMessage.includes('moz-extension://') ||
    errorMessage.includes('safari-extension://') ||
    errorMessage.includes('extension context invalidated') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('runtime.lasterror') ||
    errorMessage.includes('denying load') ||
    errorMessage.includes('web_accessible_resources') ||
    errorMessage.includes('net::err_failed') ||
    errorMessage.includes('invalid/');
  
  if (isExtensionError) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  
  // Only log real errors
  if (!import.meta.env.PROD || !isExtensionError) {
    console.error('Global error:', event.error);
  }
});

// Initialize performance monitoring (only in dev or if enabled)
if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
  initPerformanceMonitoring();
}

// 🎯 ALWAYS use App.tsx - it handles mobile detection internally
// App.tsx uses useMobileOptimizations() hook which properly detects mobile devices
// and renders the correct layout. This ensures consistent behavior whether
// loaded directly on mobile or switched from desktop.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
