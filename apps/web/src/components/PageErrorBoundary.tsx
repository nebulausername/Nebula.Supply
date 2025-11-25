import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName: string;
  fallback?: ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Granular Error Boundary for individual pages
 * Provides page-specific error handling with graceful degradation
 */
export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error(`[PageErrorBoundary] Error in ${this.props.pageName}:`, error, errorInfo);
    }

    // Report error to backend (if error reporting service exists)
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Only report in production
      if (!import.meta.env.DEV) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        await fetch(`${apiUrl}/api/errors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: this.props.pageName,
            error: {
              message: error.message,
              stack: error.stack,
              componentStack: errorInfo.componentStack,
            },
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {
          // Silently fail if error reporting fails
        });
      }
    } catch (reportError) {
      // Silently fail if error reporting fails
      console.error('Failed to report error:', reportError);
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-black p-4">
          <div className="max-w-md w-full rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Etwas ist schiefgelaufen
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Die Seite "{this.props.pageName}" konnte nicht geladen werden.
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-gray-500">Fehlerdetails</summary>
                    <pre className="mt-2 text-xs text-red-400 overflow-auto">
                      {this.state.error.message}
                      {'\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 rounded-lg bg-accent text-black font-semibold hover:bg-accent/90 transition-colors"
                >
                  Erneut versuchen
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 rounded-lg border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Zur Startseite
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping pages with error boundary
 */
export const withPageErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  pageName: string
) => {
  const WrappedComponent = (props: P) => (
    <PageErrorBoundary pageName={pageName}>
      <Component {...props} />
    </PageErrorBoundary>
  );

  WrappedComponent.displayName = `withPageErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};





