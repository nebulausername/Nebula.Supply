import { memo, useState, useCallback, useEffect } from 'react';
import { AlertCircle, RefreshCw, X, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { logger } from '../../lib/logger';

export interface InlineErrorProps {
  error: Error | string;
  title?: string;
  message?: string;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  severity?: 'error' | 'warning' | 'info';
  showDetails?: boolean;
  recoverySuggestions?: string[];
  className?: string;
  autoRetry?: boolean;
  maxRetries?: number;
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    badge: 'error' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    badge: 'warning' as const,
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    badge: 'info' as const,
  },
};

export const InlineError = memo(function InlineError({
  error,
  title,
  message,
  onRetry,
  onDismiss,
  severity = 'error',
  showDetails = false,
  recoverySuggestions = [],
  className,
  autoRetry = false,
  maxRetries = 3,
}: InlineErrorProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(showDetails);
  const [dismissed, setDismissed] = useState(false);

  const config = severityConfig[severity];
  const Icon = config.icon;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  // Exponential backoff calculation
  const getRetryDelay = useCallback((attempt: number): number => {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  }, []);

  const handleRetry = useCallback(async () => {
    if (!onRetry || retryCount >= maxRetries) return;

    setIsRetrying(true);
    const delay = getRetryDelay(retryCount);

    try {
      await new Promise(resolve => setTimeout(resolve, delay));
      await onRetry();
      setRetryCount(prev => prev + 1);
      logger.info('Error retry attempted', { attempt: retryCount + 1, maxRetries });
    } catch (err) {
      logger.error('Error retry failed', { error: err, attempt: retryCount + 1 });
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryCount, maxRetries, getRetryDelay]);

  // Auto-retry logic
  useEffect(() => {
    if (autoRetry && onRetry && retryCount < maxRetries && !dismissed) {
      const delay = getRetryDelay(retryCount);
      const timeout = setTimeout(() => {
        handleRetry();
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [autoRetry, onRetry, retryCount, maxRetries, dismissed, getRetryDelay, handleRetry]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  if (dismissed) return null;

  const canRetry = onRetry && retryCount < maxRetries;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn('w-full', className)}
      >
        <Card className={cn('p-4 border', config.border, config.bg)}>
          <div className="flex items-start gap-3">
            <div className={cn('flex-shrink-0', config.color)}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-text">
                      {title || 'An error occurred'}
                    </h3>
                    <Badge variant={config.badge} className="text-xs">
                      {severity}
                    </Badge>
                    {retryCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Retry {retryCount}/{maxRetries}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {message || errorMessage}
                  </p>
                </div>

                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="flex-shrink-0 h-6 w-6 p-0"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {showFullDetails && errorStack && (
                <details className="mt-3">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-text">
                    Show error details
                  </summary>
                  <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-auto max-h-32">
                    {errorStack}
                  </pre>
                </details>
              )}

              {recoverySuggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Suggestions:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    {recoverySuggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {canRetry && (
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
                    {isRetrying ? 'Retrying...' : `Retry${retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ''}`}
                  </Button>
                  {retryCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Next retry in {Math.round(getRetryDelay(retryCount) / 1000)}s
                    </span>
                  )}
                </div>
              )}

              {!canRetry && retryCount >= maxRetries && (
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum retry attempts reached. Please refresh the page or contact support.
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
});

