// Circuit Breaker Pattern Implementation
// Prevents cascading failures by stopping requests when service is down

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time in ms before attempting to close circuit
  monitoringWindow: number; // Time window for tracking failures
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
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      monitoringWindow: config.monitoringWindow || 60000, // 1 minute
    };
  }

  private cleanOldFailures(): void {
    const now = Date.now();
    const windowStart = now - this.config.monitoringWindow;
    // Only filter if we have failures and they might be old
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
      // Success in half-open state, close the circuit
      this.state = 'CLOSED';
      this.failures = [];
      this.lastFailureTime = 0;
    } else if (this.state === 'CLOSED') {
      // Clean old failures on success
      this.cleanOldFailures();
    }
  }

  recordFailure(error: any): void {
    const now = Date.now();
    this.failures.push({ timestamp: now, error });
    this.lastFailureTime = now;

    if (this.shouldOpenCircuit()) {
      this.state = 'OPEN';
    }
  }

  canAttemptRequest(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        // Transition to half-open to test if service recovered
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow one attempt
    return true;
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    this.cleanOldFailures();
    return this.failures.length;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = [];
    this.lastFailureTime = 0;
  }
}

// Circuit Breaker instances per endpoint pattern
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(endpoint: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  // Group endpoints by pattern (e.g., all /api/products/* share one breaker)
  const pattern = endpoint.split('/').slice(0, 3).join('/'); // e.g., '/api/products'
  
  if (!circuitBreakers.has(pattern)) {
    circuitBreakers.set(pattern, new CircuitBreaker(config));
  }
  
  return circuitBreakers.get(pattern)!;
}

export function resetCircuitBreaker(endpoint: string): void {
  const pattern = endpoint.split('/').slice(0, 3).join('/');
  const breaker = circuitBreakers.get(pattern);
  if (breaker) {
    breaker.reset();
  }
}

export function getCircuitBreakerState(endpoint: string): CircuitState {
  const pattern = endpoint.split('/').slice(0, 3).join('/');
  const breaker = circuitBreakers.get(pattern);
  return breaker?.getState() || 'CLOSED';
}

