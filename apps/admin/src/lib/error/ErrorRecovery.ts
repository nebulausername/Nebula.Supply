import { ErrorManager, ErrorCategory, ManagedError, getErrorManager } from './ErrorManager';
import { logger } from '../logger';

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'ignore' | 'notify';
  execute: (error: ManagedError) => Promise<boolean>;
}

export interface RecoveryResult {
  success: boolean;
  action: string;
  error?: Error;
}

class ErrorRecovery {
  private errorManager: ErrorManager;
  private recoveryActions: Map<ErrorCategory, RecoveryAction[]> = new Map();
  private recoveryHistory: Array<{ errorId: string; action: string; success: boolean; timestamp: Date }> = [];

  constructor(errorManager?: ErrorManager) {
    this.errorManager = errorManager || getErrorManager();
    this.setupDefaultRecoveryActions();
  }

  private setupDefaultRecoveryActions(): void {
    // API errors - retry with exponential backoff
    this.recoveryActions.set(ErrorCategory.API, [
      {
        type: 'retry',
        execute: async (error: ManagedError) => {
          return await this.errorManager.retryError(error.id);
        }
      },
      {
        type: 'fallback',
        execute: async (error: ManagedError) => {
          logger.warn('[ErrorRecovery] API error fallback triggered', { errorId: error.id });
          return true;
        }
      }
    ]);

    // Network errors - retry with longer delays
    this.recoveryActions.set(ErrorCategory.NETWORK, [
      {
        type: 'retry',
        execute: async (error: ManagedError) => {
          return await this.errorManager.retryError(error.id);
        }
      },
      {
        type: 'fallback',
        execute: async (error: ManagedError) => {
          logger.warn('[ErrorRecovery] Network error fallback - using cached data', { errorId: error.id });
          return true;
        }
      }
    ]);

    // Validation errors - notify only
    this.recoveryActions.set(ErrorCategory.VALIDATION, [
      {
        type: 'notify',
        execute: async (error: ManagedError) => {
          logger.info('[ErrorRecovery] Validation error - user notification', { errorId: error.id });
          return true;
        }
      }
    ]);

    // Runtime errors - attempt recovery
    this.recoveryActions.set(ErrorCategory.RUNTIME, [
      {
        type: 'retry',
        execute: async (error: ManagedError) => {
          return await this.errorManager.retryError(error.id);
        }
      },
      {
        type: 'notify',
        execute: async (error: ManagedError) => {
          logger.error('[ErrorRecovery] Runtime error - user notification', { errorId: error.id });
          return true;
        }
      }
    ]);
  }

  async attemptRecovery(errorId: string): Promise<RecoveryResult> {
    const error = this.errorManager.getError(errorId);
    if (!error) {
      return {
        success: false,
        action: 'error_not_found',
        error: new Error(`Error ${errorId} not found`)
      };
    }

    if (error.resolved) {
      return {
        success: true,
        action: 'already_resolved'
      };
    }

    const actions = this.recoveryActions.get(error.category) || [];
    
    for (const action of actions) {
      try {
        const success = await action.execute(error);
        
        this.recoveryHistory.push({
          errorId,
          action: action.type,
          success,
          timestamp: new Date()
        });

        if (success) {
          if (action.type === 'retry') {
            return {
              success: true,
              action: 'retry_success'
            };
          }
          
          if (action.type === 'fallback') {
            return {
              success: true,
              action: 'fallback_success'
            };
          }

          return {
            success: true,
            action: action.type
          };
        }
      } catch (err) {
        logger.error(`[ErrorRecovery] Recovery action ${action.type} failed:`, err);
        continue;
      }
    }

    return {
      success: false,
      action: 'all_recovery_actions_failed',
      error: new Error('All recovery actions failed')
    };
  }

  async recoverWithFallback<T>(
    errorId: string,
    fallbackValue: T,
    fallbackFn?: () => Promise<T>
  ): Promise<T> {
    const result = await this.attemptRecovery(errorId);
    
    if (result.success && result.action === 'fallback_success') {
      if (fallbackFn) {
        try {
          return await fallbackFn();
        } catch (err) {
          logger.error('[ErrorRecovery] Fallback function failed:', err);
        }
      }
      return fallbackValue;
    }

    throw new Error(`Recovery failed for error ${errorId}`);
  }

  async recoverWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries - 1) {
          const waitTime = delay * Math.pow(2, attempt);
          logger.warn(`[ErrorRecovery] Retry attempt ${attempt + 1}/${maxRetries} after ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  addRecoveryAction(category: ErrorCategory, action: RecoveryAction): void {
    if (!this.recoveryActions.has(category)) {
      this.recoveryActions.set(category, []);
    }
    this.recoveryActions.get(category)!.push(action);
  }

  getRecoveryHistory(errorId?: string): typeof this.recoveryHistory {
    if (errorId) {
      return this.recoveryHistory.filter(h => h.errorId === errorId);
    }
    return [...this.recoveryHistory];
  }

  clearRecoveryHistory(): void {
    this.recoveryHistory = [];
  }
}

// Singleton instance
let errorRecoveryInstance: ErrorRecovery | null = null;

export const getErrorRecovery = (): ErrorRecovery => {
  if (!errorRecoveryInstance) {
    errorRecoveryInstance = new ErrorRecovery();
  }
  return errorRecoveryInstance;
};

export { ErrorRecovery };

