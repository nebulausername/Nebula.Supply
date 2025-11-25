/**
 * Error Recovery System
 * Advanced error handling and recovery mechanisms
 */

import { logger } from "../logger";

interface ErrorRecoveryConfig {
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  recoveryTimeout: number;
}

class ErrorRecoverySystem {
  private config: ErrorRecoveryConfig;
  private errorCounts: Map<string, number> = new Map();
  private circuitBreakerStates: Map<string, 'closed' | 'open' | 'half-open'> = new Map();
  private lastErrorTimes: Map<string, number> = new Map();

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      recoveryTimeout: config.recoveryTimeout || 30000,
      ...config
    };
  }

  /**
   * Handle error with recovery logic
   */
  async handleError<T>(
    operation: () => Promise<T>,
    context: string,
    fallback?: () => T
  ): Promise<T | null> {
    const errorKey = context;
    const currentTime = Date.now();

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(errorKey)) {
      logger.warn(`Circuit breaker open for ${errorKey}`);
      return fallback ? fallback() : null;
    }

    try {
      const result = await operation();
      this.resetErrorCount(errorKey);
      return result;
    } catch (error) {
      this.recordError(errorKey, currentTime);
      
      if (this.shouldRetry(errorKey)) {
        logger.info(`Retrying operation ${errorKey} (attempt ${this.getErrorCount(errorKey)})`);
        await this.delay(this.config.retryDelay * this.getErrorCount(errorKey));
        return this.handleError(operation, context, fallback);
      }

      logger.error(`Operation ${errorKey} failed after retries`, { error: String(error) });
      return fallback ? fallback() : null;
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(key: string): boolean {
    const state = this.circuitBreakerStates.get(key) || 'closed';
    if (state === 'open') {
      const lastErrorTime = this.lastErrorTimes.get(key) || 0;
      if (Date.now() - lastErrorTime > this.config.recoveryTimeout) {
        this.circuitBreakerStates.set(key, 'half-open');
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record error occurrence
   */
  private recordError(key: string, timestamp: number): void {
    const count = this.getErrorCount(key) + 1;
    this.errorCounts.set(key, count);
    this.lastErrorTimes.set(key, timestamp);

    if (count >= this.config.circuitBreakerThreshold) {
      this.circuitBreakerStates.set(key, 'open');
      logger.warn(`Circuit breaker opened for ${key} after ${count} errors`);
    }
  }

  /**
   * Reset error count
   */
  private resetErrorCount(key: string): void {
    this.errorCounts.set(key, 0);
    this.circuitBreakerStates.set(key, 'closed');
  }

  /**
   * Check if should retry
   */
  private shouldRetry(key: string): boolean {
    return this.getErrorCount(key) < this.config.maxRetries;
  }

  /**
   * Get error count
   */
  private getErrorCount(key: string): number {
    return this.errorCounts.get(key) || 0;
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get system status
   */
  getStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [key, count] of this.errorCounts.entries()) {
      status[key] = {
        errorCount: count,
        circuitBreakerState: this.circuitBreakerStates.get(key) || 'closed',
        lastErrorTime: this.lastErrorTimes.get(key)
      };
    }

    return status;
  }

  /**
   * Reset all error states
   */
  reset(): void {
    this.errorCounts.clear();
    this.circuitBreakerStates.clear();
    this.lastErrorTimes.clear();
    logger.info("Error recovery system reset");
  }
}

let errorRecoverySystem: ErrorRecoverySystem | null = null;

export const initErrorRecovery = (config?: Partial<ErrorRecoveryConfig>) => {
  errorRecoverySystem = new ErrorRecoverySystem(config);
  logger.info("Error recovery system initialized");
};

export const getErrorRecovery = (): ErrorRecoverySystem => {
  if (!errorRecoverySystem) {
    throw new Error("Error recovery system not initialized");
  }
  return errorRecoverySystem;
};


