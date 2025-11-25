import { AlertTriangle, RefreshCw, X, Copy, Check } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '../../utils/cn';
import { useState, useCallback } from 'react';
import { getErrorSolution } from '../../lib/utils/errorMessages';

export interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  variant?: 'inline' | 'card' | 'full';
  className?: string;
}

export function ErrorDisplay({
  error,
  title,
  onRetry,
  onDismiss,
  showDetails = false,
  variant = 'inline',
  className,
}: ErrorDisplayProps) {
  const [showFullDetails, setShowFullDetails] = useState(showDetails);
  const [copied, setCopied] = useState(false);

  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;
  const errorSolution = error instanceof Error ? getErrorSolution(error) : null;

  const handleCopy = useCallback(async () => {
    const errorText = error instanceof Error
      ? `Error: ${error.message}\n\nStack:\n${error.stack}`
      : String(error);

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  }, [error]);

  const content = (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-400 mb-1">
            {title || 'An error occurred'}
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{errorMessage}</p>
          {errorSolution && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="font-semibold mb-2 text-blue-300">{errorSolution.title}</p>
              <p className="text-sm text-blue-200/90 whitespace-pre-line mb-3">{errorSolution.description}</p>
              {errorSolution.actions && errorSolution.actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {errorSolution.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={action.action}
                      className="text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-text transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showFullDetails && errorStack && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-text transition-colors">
            Show error details
          </summary>
          <div className="mt-2 p-3 bg-black/30 rounded text-xs font-mono text-muted-foreground overflow-auto max-h-48">
            <pre className="whitespace-pre-wrap">{errorStack}</pre>
          </div>
        </details>
      )}

      <div className="flex items-center gap-2">
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
        {errorStack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        )}
        {errorStack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullDetails(!showFullDetails)}
          >
            {showFullDetails ? 'Hide' : 'Show'} Details
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        {content}
      </Card>
    );
  }

  if (variant === 'full') {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-red-500/30 bg-red-500/5">
          {content}
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 border border-red-500/30 bg-red-500/5 rounded-lg">
      {content}
    </div>
  );
}

// Error Boundary Fallback Component
export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <ErrorDisplay
      error={error}
      title="Something went wrong"
      onRetry={resetErrorBoundary}
      variant="full"
      showDetails={true}
    />
  );
}

// Inline Error Component
export function InlineError({
  error,
  onRetry,
  className,
}: {
  error: Error | string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorDisplay
      error={error}
      variant="inline"
      onRetry={onRetry}
      className={className}
    />
  );
}

