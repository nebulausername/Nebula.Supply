// 🚀 Centralized Error Handling Utilities

export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
  details?: any;
}

export class CustomError extends Error {
  code: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

// 🎯 User-friendly error messages
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof CustomError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Map common errors to user-friendly messages
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'You are not authorized. Please log in again.';
    }
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('404') || error.message.includes('not found')) {
      return 'The requested resource was not found.';
    }
    if (error.message.includes('500') || error.message.includes('server')) {
      return 'Server error. Please try again later.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// 🎯 Error logging (for production error tracking)
export const logError = (error: unknown, context?: Record<string, any>) => {
  const errorMessage = getErrorMessage(error);
  const errorDetails = {
    message: errorMessage,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorDetails);
  }

  // TODO: Send to error tracking service in production
  // if (import.meta.env.PROD) {
  //   errorTrackingService.captureException(error, { extra: context });
  // }
};

// 🎯 Graceful error handling for async operations
export const handleAsyncError = async <T,>(
  operation: () => Promise<T>,
  fallback?: T,
  onError?: (error: unknown) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    logError(error);
    onError?.(error);
    return fallback ?? null;
  }
};

// 🎯 API Error Handler
export const handleApiError = (error: unknown): AppError => {
  if (error instanceof CustomError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: getErrorMessage(error),
      details: { originalError: error.message }
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred'
  };
};

