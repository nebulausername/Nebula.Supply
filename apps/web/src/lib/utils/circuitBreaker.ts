// Circuit Breaker Pattern Implementation
// Prevents cascading failures by stopping requests when service is down

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface FailureRecord {
  timestamp: number;
  error: any;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: FailureRecord[] = [];
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000,
      monitoringWindow: config.monitoringWindow || 60000,
    };
  }

  private cleanOldFailures(): void {
    const now = Date.now();
    const windowStart = now - this.config.monitoringWindow;
    if (this.failures.length > 0) {
      this.failures = this.failures.filter(
        failure => failure.timestamp >= windowStart
      );
    }
  }

  private shouldOpenCircuit(): boolean {
    this.cleanOldFailures();
    return this.failures.length >= this.config.failureThreshold;
  }

  private shouldAttemptReset(): boolean {
    if (this.state !== 'OPEN') return false;
    const now = Date.now();
    return now - this.lastFailureTime >= this.config.resetTimeout;
  }

  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failures = [];
    }
  }

  recordFailure(error: any): void {
    this.failures.push({
      timestamp: Date.now(),
      error,
    });
    this.lastFailureTime = Date.now();

    if (this.shouldOpenCircuit()) {
      this.state = 'OPEN';
    }
  }

  canAttemptRequest(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN' && this.shouldAttemptReset()) {
      this.state = 'HALF_OPEN';
      return true;
    }
    return this.state === 'HALF_OPEN';
  }

  getState(): CircuitState {
    return this.state;
  }
}

const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(url: string): CircuitBreaker {
  const baseUrl = url.split('?')[0];
  if (!circuitBreakers.has(baseUrl)) {
    circuitBreakers.set(baseUrl, new CircuitBreaker());
  }
  return circuitBreakers.get(baseUrl)!;
}

export function resetCircuitBreaker(url: string): void {
  const baseUrl = url.split('?')[0];
  circuitBreakers.delete(baseUrl);
}

