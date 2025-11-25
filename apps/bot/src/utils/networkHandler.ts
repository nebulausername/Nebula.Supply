import { logger } from "../logger";

// Network Error Handler für bessere Fehlerbehandlung
export class NetworkHandler {
  private retryAttempts = new Map<string, number>();
  private lastRetryTime = new Map<string, number>();
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000; // 2 Sekunden

  /**
   * Handle network errors with retry logic
   */
  async handleNetworkError<T>(
    operation: () => Promise<T>,
    context: string,
    fallback?: () => T
  ): Promise<T | null> {
    const now = Date.now();
    const attempts = this.retryAttempts.get(context) || 0;
    const lastRetry = this.lastRetryTime.get(context) || 0;

    // Check if we should retry
    if (attempts >= this.maxRetries) {
      logger.warn("Max retry attempts reached", { context, attempts });
      return fallback ? fallback() : null;
    }

    // Check cooldown period
    if (now - lastRetry < this.retryDelay) {
      logger.debug("Retry cooldown active", { context, remaining: this.retryDelay - (now - lastRetry) });
      return fallback ? fallback() : null;
    }

    try {
      const result = await operation();
      // Reset retry count on success
      this.retryAttempts.delete(context);
      this.lastRetryTime.delete(context);
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Check if it's a network error
      if (this.isNetworkError(errorMessage)) {
        this.retryAttempts.set(context, attempts + 1);
        this.lastRetryTime.set(context, now);
        
        logger.warn("Network error detected, will retry", {
          context,
          attempt: attempts + 1,
          error: errorMessage,
          nextRetryIn: this.retryDelay
        });

        // Wait before retry
        await this.delay(this.retryDelay);
        return this.handleNetworkError(operation, context, fallback);
      }

      // Non-network error, don't retry
      logger.error("Non-network error, not retrying", { context, error: errorMessage });
      return fallback ? fallback() : null;
    }
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(errorMessage: string): boolean {
    const networkErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'timeout',
      'network',
      'connection',
      'fetch'
    ];

    return networkErrors.some(error => 
      errorMessage.toLowerCase().includes(error.toLowerCase())
    );
  }

  /**
   * Delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry statistics
   */
  getRetryStats() {
    return {
      activeRetries: this.retryAttempts.size,
      contexts: Array.from(this.retryAttempts.keys()),
      totalAttempts: Array.from(this.retryAttempts.values()).reduce((sum, attempts) => sum + attempts, 0)
    };
  }

  /**
   * Reset retry counters
   */
  resetRetries() {
    this.retryAttempts.clear();
    this.lastRetryTime.clear();
    logger.info("Retry counters reset");
  }
}

// Singleton instance
export const networkHandler = new NetworkHandler();
