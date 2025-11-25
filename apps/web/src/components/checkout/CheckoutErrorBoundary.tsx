import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class CheckoutErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Checkout Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log to error tracking service in production
    if (import.meta.env.PROD) {
      // TODO: Send to error tracking service
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 rounded-2xl border border-slate-700 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Ein Fehler ist aufgetreten
          </h2>
          <p className="text-slate-400 mb-4">
            Beim Checkout ist etwas schiefgelaufen. Bitte versuche es erneut.
          </p>
          {error && (
            <div className="bg-slate-900/50 rounded-lg p-4 mb-4 text-left">
              <p className="text-xs text-slate-500 font-mono break-all">
                {error.message || 'Unbekannter Fehler'}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Erneut versuchen
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
          >
            <Home className="h-5 w-5" />
            Zurück zum Shop
          </button>
        </div>
      </div>
    </div>
  );
};

