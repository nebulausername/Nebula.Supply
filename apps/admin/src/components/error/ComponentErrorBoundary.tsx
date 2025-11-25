import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertCircle, RefreshCw, Bug, Home, ExternalLink } from 'lucide-react';
import { getErrorManager, ErrorCategory, ErrorSeverity } from '../../lib/error/ErrorManager';
import { getErrorRecovery } from '../../lib/error/ErrorRecovery';
import { logger } from '../../lib/logger';

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
}

export class ComponentErrorBoundary extends Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  private errorManager = getErrorManager();
  private errorRecovery = getErrorRecovery();

  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ComponentErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName, onError, category, severity } = this.props;

    // Report error to ErrorManager
    const errorId = this.errorManager.handleError(error, {
      category: category || ErrorCategory.RUNTIME,
      severity: severity || ErrorSeverity.MEDIUM,
      context: {
        component: componentName,
        componentStack: errorInfo.componentStack
      }
    });

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);
  }

  handleRetry = async () => {
    const { errorId, retryCount, error } = this.state;
    const { onRetry, componentName } = this.props;

    // Limit retries to prevent infinite loops
    if (retryCount >= 3) {
      logger.warn(`Max retries reached for ${componentName}`);
      return;
    }

    this.setState({ isRetrying: true });

    try {
      // Check if it's a dynamic import error - try reloading the page
      const isDynamicImportError = error?.message?.includes('Failed to fetch dynamically imported module') ||
                                   error?.message?.includes('Failed to load module');

      if (isDynamicImportError && retryCount === 0) {
        // For dynamic import errors, try a hard reload on first retry
        logger.info(`Attempting hard reload for dynamic import error in ${componentName}`);
        window.location.reload();
        return;
      }

      if (errorId) {
        const result = await this.errorRecovery.attemptRecovery(errorId);
        
        if (result.success) {
          logger.info(`Error recovery successful for ${componentName}`, { errorId });
          this.resetError();
          onRetry?.();
          return;
        } else {
          logger.warn(`Error recovery failed for ${componentName}`, { errorId, reason: result.reason });
        }
      } else {
        // Simple retry without error recovery system - exponential backoff
        const delay = 1000 * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        this.resetError();
        onRetry?.();
        return;
      }
    } catch (retryError) {
      logger.error(`Retry failed for ${componentName}`, { error: retryError });
    } finally {
      this.setState(prev => ({ 
        isRetrying: false, 
        retryCount: prev.retryCount + 1 
      }));
    }
  };

  handleReset = () => {
    const { errorId } = this.state;
    
    if (errorId) {
      this.errorManager.resolveError(errorId);
    }
    
    this.resetError();
  };

  private resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  private getContextualErrorMessage(): { title: string; message: string; suggestion: string } {
    const { componentName, category, severity } = this.props;
    const { error } = this.state;

    // Check for dynamic import errors specifically
    const isDynamicImportError = error?.message?.includes('Failed to fetch dynamically imported module') ||
                                 error?.message?.includes('Failed to load module');

    if (isDynamicImportError) {
      return {
        title: 'Module Loading Error',
        message: 'Failed to load the component module. This might be a network or caching issue.',
        suggestion: 'Try refreshing the page. If the issue persists, clear your browser cache or contact support.'
      };
    }

    // Context-specific error messages
    if (componentName.includes('KPI') || componentName.includes('Dashboard')) {
      return {
        title: 'Dashboard Error',
        message: 'Unable to load dashboard metrics. This might be a temporary issue.',
        suggestion: 'Try refreshing the page or check your connection.'
      };
    }

    if (componentName.includes('Ticket')) {
      return {
        title: 'Ticket System Error',
        message: 'An error occurred while loading tickets.',
        suggestion: 'Try refreshing or contact support if the issue persists.'
      };
    }

    if (componentName.includes('Order') || componentName.includes('Ecommerce')) {
      return {
        title: 'E-Commerce Error',
        message: 'Unable to load order or product data.',
        suggestion: 'Check your connection and try again.'
      };
    }

    if (category === ErrorCategory.NETWORK) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the server.',
        suggestion: 'Check your internet connection and try again.'
      };
    }

    if (category === ErrorCategory.API) {
      return {
        title: 'API Error',
        message: error?.message || 'An error occurred while fetching data.',
        suggestion: 'The server might be temporarily unavailable. Please try again in a moment.'
      };
    }

    // Default message
    return {
      title: `Error in ${componentName}`,
      message: error?.message || 'Something went wrong in this component.',
      suggestion: 'Try refreshing the page or contact support if the issue persists.'
    };
  };

  render() {
    if (this.state.hasError) {
      const { fallback, componentName } = this.props;
      const { error, errorInfo } = this.state;

      if (fallback) {
        return fallback;
      }

      const { title, message, suggestion } = this.getContextualErrorMessage();
      const { retryCount, isRetrying } = this.state;
      const canRetry = retryCount < 3;

      return (
        <Card className="p-6 border border-red-500/30 bg-red-500/5">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            
            <p className="text-sm text-muted-foreground max-w-md">
              {message}
            </p>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 max-w-md">
              <p className="text-xs text-blue-400">
                💡 <strong>Suggestion:</strong> {suggestion}
              </p>
            </div>

            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Retry attempts: {retryCount}/3
              </p>
            )}

            {error && (
              <div className="mt-4 w-full max-w-2xl">
                <details className="bg-gray-900/50 rounded-lg border border-white/10 overflow-hidden">
                  <summary className="text-xs text-muted-foreground cursor-pointer p-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Bug className="w-3 h-3" />
                      <span className="font-medium">Error Details</span>
                    </div>
                  </summary>
                  <div className="px-3 pb-3 space-y-2">
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                      <p className="text-xs text-muted-foreground mb-1 font-semibold">Error:</p>
                      <p className="text-xs text-red-400 font-mono break-words">{error.message}</p>
                    </div>
                    {error.stack && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-semibold">Stack Trace:</p>
                        <pre className="text-xs text-gray-300 font-mono bg-black/30 p-2 rounded border border-white/10 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 font-semibold">Component Stack:</p>
                        <pre className="text-xs text-gray-300 font-mono bg-black/30 p-2 rounded border border-white/10 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex gap-3 mt-4 flex-wrap justify-center">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isRetrying}
                >
                  <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
              )}
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Reload Page
              </Button>
              <Button
                onClick={this.handleReset}
                variant="outline"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

