import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { rankQueryKeys } from '../../hooks/useRankInfo';

interface RankErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface RankErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary specifically for Rank-related components
 * Provides retry functionality and user-friendly error messages
 */
export class RankErrorBoundary extends Component<RankErrorBoundaryProps, RankErrorBoundaryState> {
  constructor(props: RankErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): RankErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('RankErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // TODO: Send to error tracking service (e.g., Sentry) in production
    // if (import.meta.env.PROD) {
    //   errorTrackingService.captureException(error, { 
    //     extra: errorInfo,
    //     tags: { component: 'Rank' }
    //   });
    // }
  }

  handleReset = () => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Invalidate rank queries to force refetch
    // Note: This requires access to queryClient, which we'll handle via a wrapper
    if (typeof window !== 'undefined') {
      // Dispatch custom event to invalidate queries
      window.dispatchEvent(new CustomEvent('rank-error-reset'));
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <RankErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface RankErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

/**
 * Error fallback UI component for Rank errors
 */
function RankErrorFallback({ error, onReset }: RankErrorFallbackProps) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    // Invalidate all rank queries to force refetch
    queryClient.invalidateQueries({ queryKey: rankQueryKeys.all });
    // Reset error boundary
    onReset();
  };

  const getErrorMessage = (): string => {
    if (!error) return 'Ein unbekannter Fehler ist aufgetreten.';
    
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return 'Nicht autorisiert. Bitte melde dich erneut an.';
    }
    
    if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
      return 'Zugriff verweigert.';
    }
    
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return 'Rang-Informationen nicht gefunden.';
    }
    
    return error.message || 'Ein Fehler ist beim Laden der Rang-Informationen aufgetreten.';
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-gradient-to-br from-red-900/40 via-black/60 to-pink-900/40 backdrop-blur-xl rounded-3xl border-2 border-red-500/30 p-8 md:p-12 shadow-2xl">
          {/* Error Icon */}
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
              <AlertCircle className="w-16 h-16 text-red-400 relative z-10" />
            </div>
          </motion.div>

          {/* Error Title */}
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
            Fehler beim Laden
          </h2>

          {/* Error Message */}
          <p className="text-lg text-red-200 text-center mb-8 max-w-xl mx-auto">
            {getErrorMessage()}
          </p>

          {/* Error Details (Development Only) */}
          {import.meta.env.DEV && error && (
            <details className="mb-6 p-4 bg-black/40 rounded-xl border border-red-500/20">
              <summary className="text-sm text-red-300 cursor-pointer mb-2 font-medium">
                Fehlerdetails (nur Entwicklung)
              </summary>
              <pre className="text-xs text-red-400 overflow-auto mt-2">
                {error.toString()}
                {error.stack && (
                  <>
                    {'\n\nStack Trace:\n'}
                    {error.stack}
                  </>
                )}
              </pre>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={handleRetry}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Erneut versuchen</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={() => window.location.reload()}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 active:bg-black/70 text-purple-300 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Seite neu laden</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={() => window.location.href = '/'}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 active:bg-black/70 text-purple-300 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50"
            >
              <Home className="w-5 h-5" />
              <span>Zur Startseite</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Wrapper component that provides QueryClient context to RankErrorBoundary
 * Use this component instead of RankErrorBoundary directly
 */
export function RankErrorBoundaryWrapper(props: RankErrorBoundaryProps) {
  return <RankErrorBoundary {...props} />;
}

