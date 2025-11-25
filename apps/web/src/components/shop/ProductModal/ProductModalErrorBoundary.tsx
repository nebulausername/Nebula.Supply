import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ProductModalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// 🎯 Error Boundary für ProductModal
export class ProductModalErrorBoundary extends Component<
  ProductModalErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ProductModalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ProductModal Error:', error, errorInfo);
    
    // 🎯 Error Reporting (kann später mit einem Service wie Sentry integriert werden)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          component: 'ProductModal'
        }
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center space-y-6 max-w-md">
            {/* 🎯 Error Icon */}
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            {/* 🎯 Error Message */}
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-text">
                Oops! Etwas ist schiefgelaufen
              </h3>
              <p className="text-muted">
                Das Produkt konnte nicht geladen werden. Bitte versuche es erneut.
              </p>
              {this.state.error && (
                <details className="text-xs text-muted/70 mt-4">
                  <summary className="cursor-pointer hover:text-muted">
                    Technische Details
                  </summary>
                  <pre className="mt-2 p-2 bg-black/20 rounded text-left overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
            
            {/* 🎯 Retry Button */}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black rounded-xl font-semibold transition hover:brightness-110"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
