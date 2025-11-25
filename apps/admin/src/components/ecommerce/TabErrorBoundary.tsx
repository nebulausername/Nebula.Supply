import React, { Component, ErrorInfo, ReactNode, useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertCircle, RefreshCw, Copy, Check, Bug } from 'lucide-react';
import { getErrorManager, ErrorCategory, ErrorSeverity } from '../../lib/error/ErrorManager';
import { getErrorRecovery } from '../../lib/error/ErrorRecovery';

interface TabErrorBoundaryProps {
  children: ReactNode;
  tabName: string;
  onRetry?: () => void;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  private errorManager = getErrorManager();
  private errorRecovery = getErrorRecovery();

  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<TabErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { tabName, category, severity } = this.props;

    // Report error to ErrorManager
    const errorId = this.errorManager.handleError(error, {
      category: category || ErrorCategory.RUNTIME,
      severity: severity || ErrorSeverity.HIGH,
      context: {
        component: `Tab: ${tabName}`,
        componentStack: errorInfo.componentStack
      }
    });

    console.error(`Error in ${tabName} tab:`, error, errorInfo);
    this.setState({
      error,
      errorInfo,
      errorId
    });
  }

  handleRetry = async () => {
    const { errorId } = this.state;
    const { onRetry } = this.props;

    if (errorId) {
      const result = await this.errorRecovery.attemptRecovery(errorId);
      
      if (result.success) {
        this.resetError();
        onRetry?.();
      }
    } else {
      this.resetError();
      onRetry?.();
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
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 border border-red-500/30 bg-red-500/5">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Error in {this.props.tabName}</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Something went wrong while loading this tab. Please try again or refresh the page.
            </p>
            {this.state.error && (
              <TabErrorDetailsDisplay 
                error={this.state.error} 
                errorInfo={this.state.errorInfo} 
              />
            )}
            <div className="flex gap-3 mt-4">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
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

// Optimized Error Details Display Component for Tabs
interface TabErrorDetailsDisplayProps {
  error: Error;
  errorInfo: ErrorInfo | null;
}

function TabErrorDetailsDisplay({ error, errorInfo }: TabErrorDetailsDisplayProps) {
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
      className="mt-4 text-left w-full max-w-2xl bg-gray-900/50 rounded-lg border border-white/10 overflow-hidden"
      open={expanded}
      onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
    >
      <summary className="text-xs text-muted-foreground cursor-pointer p-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center gap-2">
          <Bug className="w-3 h-3" />
          <span className="font-medium">Error Details</span>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            handleCopy();
          }}
          className="flex items-center gap-1 text-xs hover:text-white transition-colors"
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
      <div className="px-3 pb-3 space-y-2">
        <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
          <p className="text-xs text-muted-foreground mb-1 font-semibold">Error:</p>
          <p className="text-xs text-red-400 font-mono break-words">{error.message}</p>
        </div>
        {error.stack && (
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-semibold">Stack Trace:</p>
            <pre className="text-xs text-gray-300 font-mono bg-black/30 p-2 rounded border border-white/10 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
              {error.stack}
            </pre>
          </div>
        )}
        {errorInfo?.componentStack && (
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-semibold">Component Stack:</p>
            <pre className="text-xs text-gray-300 font-mono bg-black/30 p-2 rounded border border-white/10 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
              {errorInfo.componentStack}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}


