import React, { Component, ReactNode, useState, useMemo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, Check } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { logger } from '../lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-[#0B0B12] to-[#050509]">
          <Card className="max-w-2xl w-full p-8 border-red-500/30 bg-red-500/5">
            <div className="text-center">
              {/* Error Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-white mb-3">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">
                The application encountered an unexpected error. Please try reloading the page.
              </p>

              {/* Error Details (Collapsible) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <ErrorDetailsDisplay 
                  error={this.state.error} 
                  errorInfo={this.state.errorInfo} 
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  onClick={this.handleReset}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-white/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-white/20"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Support Info */}
              <p className="text-xs text-muted-foreground mt-6">
                If this problem persists, please contact support.
              </p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Optimized Error Details Display Component
interface ErrorDetailsDisplayProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
}

function ErrorDetailsDisplay({ error, errorInfo }: ErrorDetailsDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const errorText = useMemo(() => {
    const parts = [
      `Error: ${error.message}`,
      error.stack && `\nStack Trace:\n${error.stack}`,
      errorInfo?.componentStack && `\nComponent Stack:\n${errorInfo.componentStack}`
    ].filter(Boolean);
    return parts.join('\n\n');
  }, [error, errorInfo]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  return (
    <details 
      className="text-left mb-6 rounded-lg bg-gray-900/50 border border-white/10 overflow-hidden"
      open={expanded}
      onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer text-sm font-medium text-white p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4" />
          <span>Show error details</span>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            handleCopy();
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
          title="Copy error details"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </summary>
      <div className="px-4 pb-4 space-y-3">
        <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
          <p className="text-xs text-muted-foreground mb-1 font-semibold">Error Message:</p>
          <p className="text-sm text-red-400 font-mono break-words">{error.message}</p>
        </div>
        {error.stack && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Stack Trace:</p>
            <pre className="text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto bg-black/30 p-3 rounded border border-white/10 custom-scrollbar">
              {error.stack}
            </pre>
          </div>
        )}
        {errorInfo?.componentStack && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Component Stack:</p>
            <pre className="text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto bg-black/30 p-3 rounded border border-white/10 custom-scrollbar">
              {errorInfo.componentStack}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}

// Hook for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}
