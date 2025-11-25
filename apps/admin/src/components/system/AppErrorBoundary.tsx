import { ErrorBoundary } from 'react-error-boundary';
import { QueryErrorResetBoundary, QueryClient } from '@tanstack/react-query';
import { logger } from '../../lib/logger';
import { RefreshCw, Home, AlertTriangle, X, Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import { getErrorSolution } from '../../lib/utils/errorMessages';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

// Error reporting service (can be extended to send to external service)
function reportError(error: Error, errorInfo?: React.ErrorInfo) {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userId: localStorage.getItem('nebula_user_id') || 'anonymous',
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error Report:', errorReport);
  }

  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, { extra: errorReport });
    logger.logApiError(error, errorReport);
  }

  return errorReport;
}

function FullPageErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const errorReport = reportError(error);
  const errorSolution = getErrorSolution(error);

  const handleCopyError = useCallback(async () => {
    try {
      const errorText = `Error: ${error.message}\n\nStack:\n${error.stack}\n\nComponent Stack:\n${errorReport.componentStack || 'N/A'}`;
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  }, [error, errorReport]);

  const handleClearCache = useCallback(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      // Clear service worker cache if available
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      window.location.reload();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0B0B12] to-[#050509] p-4">
      <div className="max-w-2xl w-full p-8 bg-gray-900/50 rounded-lg border border-red-500/30">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-red-400 mb-2">
            Application Error
          </h1>
          
          <p className="text-gray-400 mb-2">
            {errorSolution?.description || 'The application encountered an unexpected error.'}
          </p>

          {errorSolution?.title && (
            <p className="text-sm text-gray-500 mb-6">
              {errorSolution.title}
            </p>
          )}
          
          {/* Error Details - Collapsible */}
          <div className="mb-6 text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full cursor-pointer text-sm text-gray-500 hover:text-gray-300 mb-2 p-2 rounded hover:bg-gray-800/50"
            >
              <span>{showDetails ? 'Hide' : 'Show'} error details</span>
              <X className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-45' : ''}`} />
            </button>
            
            {showDetails && (
              <div className="bg-black/50 rounded-lg p-4 overflow-auto max-h-64 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Error Details</span>
                  <button
                    onClick={handleCopyError}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs text-red-400 whitespace-pre-wrap">
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </div>
            )}
          </div>

          {/* Recovery Actions */}
          <div className="flex flex-wrap gap-3 justify-center mb-4">
            <button
              onClick={resetErrorBoundary}
              className="inline-flex items-center gap-2 px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center gap-2 px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>

            <button
              onClick={handleClearCache}
              className="inline-flex items-center gap-2 px-6 py-2 border border-yellow-600 rounded-lg text-yellow-300 hover:bg-yellow-900/20 transition-colors"
            >
              Clear Cache & Reload
            </button>
          </div>

          {/* Additional Actions from Error Solution */}
          {errorSolution?.actions && errorSolution.actions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Suggested Actions:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {errorSolution.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-6">
            Error ID: {errorReport.timestamp} | If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AppErrorBoundary({ children, queryClient }: AppErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary 
          FallbackComponent={FullPageErrorFallback}
          onReset={() => {
            reset();
            queryClient?.resetQueries();
          }}
          onError={(error, errorInfo) => {
            reportError(error, errorInfo);
            logger.error('AppErrorBoundary caught error', {
              error: error.message,
              stack: error.stack,
              componentStack: errorInfo.componentStack
            });
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}



