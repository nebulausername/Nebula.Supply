import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, AlertTriangle, Info, CheckCircle, RefreshCw, Filter, Download } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getErrorManager, ErrorCategory, ErrorSeverity, ManagedError } from '../../lib/error/ErrorManager';
import { getErrorRecovery } from '../../lib/error/ErrorRecovery';
import { getErrorLogger } from '../../lib/error/ErrorLogger';
import { cn } from '../../utils/cn';

interface ErrorNotificationCenterProps {
  maxNotifications?: number;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ErrorNotificationCenter({
  maxNotifications = 5,
  autoDismiss = true,
  autoDismissDelay = 5000,
  position = 'top-right'
}: ErrorNotificationCenterProps) {
  const [notifications, setNotifications] = useState<ManagedError[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<{
    category?: ErrorCategory;
    severity?: ErrorSeverity;
  }>({});

  const errorManager = getErrorManager();
  const errorRecovery = getErrorRecovery();
  const errorLogger = getErrorLogger();

  useEffect(() => {
    const unsubscribe = errorManager.on('error', (error: ManagedError) => {
      setNotifications(prev => {
        const updated = [error, ...prev.filter(n => n.id !== error.id)];
        return updated.slice(0, maxNotifications);
      });

      if (autoDismiss && error.severity !== ErrorSeverity.CRITICAL) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== error.id));
        }, autoDismissDelay);
      }
    });

    return unsubscribe;
  }, [maxNotifications, autoDismiss, autoDismissDelay]);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filter.category) {
      filtered = filtered.filter(n => n.category === filter.category);
    }

    if (filter.severity) {
      filtered = filtered.filter(n => n.severity === filter.severity);
    }

    return filtered;
  }, [notifications, filter]);

  const handleDismiss = useCallback((errorId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== errorId));
  }, []);

  const handleRetry = useCallback(async (errorId: string) => {
    const result = await errorRecovery.attemptRecovery(errorId);
    if (result.success) {
      errorManager.resolveError(errorId);
      handleDismiss(errorId);
    }
  }, []);

  const handleResolve = useCallback((errorId: string) => {
    errorManager.resolveError(errorId);
    handleDismiss(errorId);
  }, []);

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case ErrorSeverity.HIGH:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case ErrorSeverity.MEDIUM:
        return <Info className="w-5 h-5 text-yellow-500" />;
      case ErrorSeverity.LOW:
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'border-red-500/30 bg-red-500/10';
      case ErrorSeverity.HIGH:
        return 'border-orange-500/30 bg-orange-500/10';
      case ErrorSeverity.MEDIUM:
        return 'border-yellow-500/30 bg-yellow-500/10';
      case ErrorSeverity.LOW:
        return 'border-blue-500/30 bg-blue-500/10';
      default:
        return 'border-gray-500/30 bg-gray-500/10';
    }
  };

  const getCategoryLabel = (category: ErrorCategory) => {
    const labels: Record<ErrorCategory, string> = {
      [ErrorCategory.API]: 'API',
      [ErrorCategory.NETWORK]: 'Network',
      [ErrorCategory.VALIDATION]: 'Validation',
      [ErrorCategory.RUNTIME]: 'Runtime',
      [ErrorCategory.PERMISSION]: 'Permission',
      [ErrorCategory.UNKNOWN]: 'Unknown'
    };
    return labels[category];
  };

  const stats = errorManager.getErrorStats();

  if (notifications.length === 0 && !expanded) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      {/* Notification Toggle Button */}
      <div className="mb-2 flex gap-2">
        <Button
          onClick={() => setExpanded(!expanded)}
          variant="outline"
          size="sm"
          className="bg-black/80 backdrop-blur-sm border-neon/30"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Errors ({stats.unresolved})
        </Button>
      </div>

      {/* Notifications List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-96 max-h-[600px] overflow-y-auto"
          >
            <Card className="bg-black/95 backdrop-blur-xl border-neon/30 p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Error Center</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const logs = errorLogger.exportLogs('json');
                      const blob = new Blob([logs], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `error-logs-${Date.now()}.json`;
                      a.click();
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setExpanded(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-900/50 rounded p-2">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-red-900/30 rounded p-2">
                  <div className="text-xs text-muted-foreground">Unresolved</div>
                  <div className="text-lg font-bold text-red-400">{stats.unresolved}</div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-4">
                <select
                  value={filter.category || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value as ErrorCategory || undefined }))}
                  className="flex-1 bg-gray-900/50 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                >
                  <option value="">All Categories</option>
                  {Object.values(ErrorCategory).map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
                <select
                  value={filter.severity || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value as ErrorSeverity || undefined }))}
                  className="flex-1 bg-gray-900/50 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                >
                  <option value="">All Severities</option>
                  {Object.values(ErrorSeverity).map(sev => (
                    <option key={sev} value={sev}>{sev}</option>
                  ))}
                </select>
              </div>

              {/* Notifications */}
              <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No errors to display
                  </div>
                ) : (
                  filteredNotifications.map((error) => (
                    <motion.div
                      key={error.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn(
                        'p-3 rounded-lg border',
                        getSeverityColor(error.severity)
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(error.category)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {error.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-white font-medium truncate">
                            {error.error.message}
                          </p>
                          {error.context.component && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Component: {error.context.component}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {error.retryCount < 3 && (
                              <Button
                                onClick={() => handleRetry(error.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Retry
                              </Button>
                            )}
                            <Button
                              onClick={() => handleResolve(error.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                            >
                              Resolve
                            </Button>
                            <Button
                              onClick={() => handleDismiss(error.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs ml-auto"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Notifications */}
      <div className="space-y-2">
        <AnimatePresence>
          {notifications
            .filter(n => !expanded)
            .slice(0, 3)
            .map((error) => (
              <motion.div
                key={error.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className={cn(
                  'p-3 rounded-lg border shadow-lg min-w-[300px]',
                  getSeverityColor(error.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(error.severity)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {error.error.message}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {error.retryCount < 3 && (
                        <Button
                          onClick={() => handleRetry(error.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDismiss(error.id)}
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs ml-auto"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

