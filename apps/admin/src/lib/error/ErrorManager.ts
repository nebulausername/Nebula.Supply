import { logger } from '../logger';

export enum ErrorCategory {
  API = 'api',
  NETWORK = 'network',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface ManagedError {
  id: string;
  error: Error;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: Date;
  resolved: boolean;
  retryCount: number;
  lastRetry?: Date;
}

export interface ErrorRecoveryStrategy {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  onRetry?: (error: ManagedError) => void;
  onFailure?: (error: ManagedError) => void;
}

class ErrorManager {
  private errors: Map<string, ManagedError> = new Map();
  private recoveryStrategies: Map<ErrorCategory, ErrorRecoveryStrategy> = new Map();
  private listeners: Map<string, Set<(error: ManagedError) => void>> = new Map();
  private errorIdCounter = 0;

  constructor() {
    this.setupDefaultRecoveryStrategies();
    this.setupGlobalErrorHandlers();
  }

  private setupDefaultRecoveryStrategies(): void {
    this.recoveryStrategies.set(ErrorCategory.API, {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true
    });

    this.recoveryStrategies.set(ErrorCategory.NETWORK, {
      maxRetries: 5,
      retryDelay: 2000,
      exponentialBackoff: true
    });

    this.recoveryStrategies.set(ErrorCategory.VALIDATION, {
      maxRetries: 0,
      retryDelay: 0,
      exponentialBackoff: false
    });

    this.recoveryStrategies.set(ErrorCategory.RUNTIME, {
      maxRetries: 1,
      retryDelay: 0,
      exponentialBackoff: false
    });
  }

  private setupGlobalErrorHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.handleError(error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.HIGH,
        context: {
          type: 'unhandledRejection',
          reason: event.reason
        }
      });
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      const error = event.error || new Error(event.message);
      this.handleError(error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        context: {
          type: 'globalError',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorCategory.VALIDATION;
    }

    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorCategory.PERMISSION;
    }

    if (message.includes('api') || stack.includes('api')) {
      return ErrorCategory.API;
    }

    return ErrorCategory.UNKNOWN;
  }

  determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }

    if (category === ErrorCategory.NETWORK || category === ErrorCategory.API) {
      return ErrorSeverity.HIGH;
    }

    if (category === ErrorCategory.VALIDATION) {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.MEDIUM;
  }

  handleError(
    error: Error | unknown,
    options: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      context?: ErrorContext;
    } = {}
  ): string {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const category = options.category || this.categorizeError(errorObj);
    const severity = options.severity || this.determineSeverity(errorObj, category);
    
    const errorId = `error_${Date.now()}_${++this.errorIdCounter}`;
    const timestamp = new Date();

    const managedError: ManagedError = {
      id: errorId,
      error: errorObj,
      category,
      severity,
      context: {
        ...options.context,
        timestamp: timestamp.toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      timestamp,
      resolved: false,
      retryCount: 0
    };

    this.errors.set(errorId, managedError);
    this.notifyListeners('error', managedError);

    // Log error
    logger.error(`[ErrorManager] ${category}/${severity}:`, {
      id: errorId,
      message: errorObj.message,
      stack: errorObj.stack,
      context: managedError.context
    });

    return errorId;
  }

  getError(errorId: string): ManagedError | undefined {
    return this.errors.get(errorId);
  }

  getAllErrors(): ManagedError[] {
    return Array.from(this.errors.values());
  }

  getErrorsByCategory(category: ErrorCategory): ManagedError[] {
    return this.getAllErrors().filter(e => e.category === category);
  }

  getErrorsBySeverity(severity: ErrorSeverity): ManagedError[] {
    return this.getAllErrors().filter(e => e.severity === severity);
  }

  getUnresolvedErrors(): ManagedError[] {
    return this.getAllErrors().filter(e => !e.resolved);
  }

  resolveError(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      this.notifyListeners('resolved', error);
    }
  }

  retryError(errorId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const managedError = this.errors.get(errorId);
      if (!managedError || managedError.resolved) {
        resolve(false);
        return;
      }

      const strategy = this.recoveryStrategies.get(managedError.category) || {
        maxRetries: 0,
        retryDelay: 0,
        exponentialBackoff: false
      };

      if (managedError.retryCount >= strategy.maxRetries) {
        strategy.onFailure?.(managedError);
        resolve(false);
        return;
      }

      managedError.retryCount++;
      managedError.lastRetry = new Date();

      const delay = strategy.exponentialBackoff
        ? strategy.retryDelay * Math.pow(2, managedError.retryCount - 1)
        : strategy.retryDelay;

      setTimeout(() => {
        strategy.onRetry?.(managedError);
        this.notifyListeners('retry', managedError);
        resolve(true);
      }, delay);
    });
  }

  setRecoveryStrategy(category: ErrorCategory, strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(category, strategy);
  }

  on(event: 'error' | 'resolved' | 'retry', callback: (error: ManagedError) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: 'error' | 'resolved' | 'retry', error: ManagedError): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        logger.error('[ErrorManager] Error in listener:', err);
      }
    });
  }

  clearResolvedErrors(): void {
    const resolved = this.getAllErrors().filter(e => e.resolved);
    resolved.forEach(e => this.errors.delete(e.id));
  }

  clearAllErrors(): void {
    this.errors.clear();
  }

  getErrorStats(): {
    total: number;
    unresolved: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const allErrors = this.getAllErrors();
    const unresolved = allErrors.filter(e => !e.resolved);

    const byCategory = {} as Record<ErrorCategory, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;

    Object.values(ErrorCategory).forEach(cat => {
      byCategory[cat] = 0;
    });

    Object.values(ErrorSeverity).forEach(sev => {
      bySeverity[sev] = 0;
    });

    allErrors.forEach(error => {
      byCategory[error.category]++;
      bySeverity[error.severity]++;
    });

    return {
      total: allErrors.length,
      unresolved: unresolved.length,
      byCategory,
      bySeverity
    };
  }
}

// Singleton instance
let errorManagerInstance: ErrorManager | null = null;

export const getErrorManager = (): ErrorManager => {
  if (!errorManagerInstance) {
    errorManagerInstance = new ErrorManager();
  }
  return errorManagerInstance;
};

export { ErrorManager };

