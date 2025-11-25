import { useCallback } from 'react';
import { logger } from '../logger';
import { ErrorContext } from '../types/common';

export function useErrorHandler(componentName: string) {
  const handleError = useCallback((
    error: Error | unknown,
    context: ErrorContext = {}
  ) => {
    const errorContext = {
      component: componentName,
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    logger.logApiError(error, errorContext);

    // In production, you might want to send to error tracking service
    if (import.meta.env.PROD) {
      // Example: send to error tracking service
      // errorTrackingService.captureException(error, { extra: errorContext });
    }
  }, [componentName]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [handleError]);

  const withErrorHandling = useCallback(<T extends unknown[], R>(
    fn: (...args: T) => R,
    context: ErrorContext = {}
  ) => {
    return (...args: T): R | null => {
      try {
        return fn(...args);
      } catch (error) {
        handleError(error, { ...context, args });
        return null;
      }
    };
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
    withErrorHandling,
  };
}

































































