import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertCircle, RefreshCw, Home, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { getErrorSolution } from '../../lib/utils/errorMessages';
import { NetworkMonitor } from '../../lib/utils/offlineCache';
import { resetCircuitBreaker } from '../../lib/utils/circuitBreaker';

interface ShopErrorBoundaryProps {
  children: ReactNode;
  context?: string;
  onRetry?: () => void;
  fallback?: ReactNode;
}

interface ShopErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isOnline: boolean;
}

export class ShopErrorBoundary extends Component<ShopErrorBoundaryProps, ShopErrorBoundaryState> {
  private unsubscribeNetwork?: () => void;

  constructor(props: ShopErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isOnline: NetworkMonitor.getStatus(),
    };
  }

  componentDidMount() {
    // Subscribe to network status changes
    this.unsubscribeNetwork = NetworkMonitor.subscribe((isOnline) => {
      this.setState({ isOnline });
    });
  }

  componentWillUnmount() {
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork();
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ShopErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.context || 'Shop Management'}:`, error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleClearCache = async () => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      localStorage.removeItem('nebula_api_cache_');
      this.handleRetry();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  handleResetCircuitBreaker = () => {
    resetCircuitBreaker('/api/products');
    resetCircuitBreaker('/api/categories');
    resetCircuitBreaker('/api/inventory');
    this.handleRetry();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const solution = error ? getErrorSolution(error, this.props.context) : null;

      return (
        <Card className="p-8 border-red-500/30 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            {/* Error Icon */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
              <AlertCircle className="w-16 h-16 text-red-400 relative z-10" />
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">
                {solution?.title || 'Ein Fehler ist aufgetreten'}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {solution?.description || error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
              </p>
            </div>

            {/* Network Status */}
            {!this.state.isOnline && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <WifiOff className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">Offline - Verwende gecachte Daten</span>
              </div>
            )}

            {/* Solution Actions */}
            {solution && solution.actions.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center">
                {solution.actions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.action}
                    variant={index === 0 ? 'default' : 'outline'}
                    className="min-w-[140px]"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Default Actions */}
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button
                onClick={this.handleRetry}
                variant="default"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
              
              <Button
                onClick={this.handleClearCache}
                variant="outline"
                className="border-white/20 hover:bg-white/5"
              >
                Cache leeren
              </Button>

              <Button
                onClick={this.handleResetCircuitBreaker}
                variant="outline"
                className="border-white/20 hover:bg-white/5"
              >
                Circuit Breaker zurücksetzen
              </Button>

              <Button
                onClick={() => (window.location.href = '/')}
                variant="ghost"
                className="text-muted-foreground hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Zum Dashboard
              </Button>
            </div>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="w-full max-w-2xl mt-4 text-left">
                <summary className="cursor-pointer text-sm text-red-400/80 hover:text-red-400 transition-colors font-medium">
                  Technische Details anzeigen
                </summary>
                <div className="mt-3 p-4 bg-red-950/30 rounded-lg border border-red-500/20">
                  <p className="text-xs text-red-400/90 font-mono break-all mb-2">
                    {error.message}
                  </p>
                  {error.stack && (
                    <pre className="mt-2 text-xs text-red-400/60 overflow-auto max-h-48">
                      {error.stack}
                    </pre>
                  )}
                  {this.state.errorInfo && (
                    <pre className="mt-2 text-xs text-red-400/60 overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

