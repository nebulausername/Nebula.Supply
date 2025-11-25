// Using native fetch instead of axios to avoid dependency issues
import { logger } from '../logger';
import { getCircuitBreaker } from '../utils/circuitBreaker';
import { OfflineCache, NetworkMonitor } from '../utils/offlineCache';
import { getErrorSolution } from '../utils/errorMessages';
import { ApiError } from '../types/common';

// API Client Konfiguration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_TIMEOUT = 10000; // 10 Sekunden
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay
const USE_OFFLINE_CACHE = true;

// Request Deduplication - prevents duplicate requests
interface PendingRequest {
  promise: Promise<Response>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();
const REQUEST_DEDUP_WINDOW = 1000; // 1 second window for deduplication

// Generate request key for deduplication
function getRequestKey(url: string, options: RequestInit): string {
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
}

// Clean up old pending requests
function cleanupPendingRequests(): void {
  const now = Date.now();
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > REQUEST_DEDUP_WINDOW * 2) {
      pendingRequests.delete(key);
    }
  }
}

// Helper function to create timeout promise
const createTimeoutPromise = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
};

// Exponential backoff retry helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateRetryDelay = (attempt: number): number => {
  // Exponential backoff with jitter: 1s, 2s, 4s, 8s...
  const exponentialDelay = RETRY_DELAY_BASE * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Random jitter up to 1s
  const maxDelay = 30000; // Cap at 30 seconds
  return Math.min(exponentialDelay + jitter, maxDelay);
};

// Retry policy for different error types
const shouldRetry = (error: ApiError | Error, attempt: number): boolean => {
  if (attempt >= MAX_RETRIES) return false;
  
  const apiError = error as ApiError;
  const status = apiError.status;
  
  // Don't retry on client errors (4xx) except 429 (rate limit) and 408 (timeout)
  if (status !== undefined && status >= 400 && status < 500 && status !== 429 && status !== 408) {
    return false;
  }
  
  // Retry on server errors (5xx), network errors, and timeouts
  return (status !== undefined && status >= 500) || 
         status === undefined || 
         error.name === 'TypeError' || 
         error.name === 'AbortError' ||
         error.message?.includes('timeout') ||
         error.message?.includes('network') ||
         error.message?.includes('fetch failed');
};

// Helper function to make authenticated requests with retry logic, circuit breaker, offline cache, and request deduplication
async function makeRequest(
  url: string,
  options: RequestInit = {},
  attempt: number = 0,
  useCache: boolean = USE_OFFLINE_CACHE
): Promise<Response> {
  const fullUrl = `${API_BASE_URL}${url}`;
  const isGetRequest = (options.method || 'GET') === 'GET';
  
  // Request deduplication - only for GET requests to avoid side effects
  if (isGetRequest && attempt === 0) {
    cleanupPendingRequests();
    const requestKey = getRequestKey(url, options);
    const pendingRequest = pendingRequests.get(requestKey);
    
    if (pendingRequest) {
      const age = Date.now() - pendingRequest.timestamp;
      // If request is still pending and within deduplication window, reuse it
      if (age < REQUEST_DEDUP_WINDOW) {
        logger.debug('Reusing pending request', { url, key: requestKey });
        return pendingRequest.promise;
      } else {
        // Request is too old, remove it
        pendingRequests.delete(requestKey);
      }
    }
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  const circuitBreaker = getCircuitBreaker(url);
  
  // Create the request promise
  const requestPromise = (async (): Promise<Response> => {
    try {
    // Check circuit breaker
    if (!circuitBreaker.canAttemptRequest()) {
      const cachedData = useCache && isGetRequest ? OfflineCache.get(fullUrl) : null;
      if (cachedData) {
        logger.info('Using cached data due to circuit breaker', { url });
        // Return a mock response with cached data
        return new Response(JSON.stringify({ success: true, data: cachedData }), {
          status: 200,
          statusText: 'OK (Cached)',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw {
        message: 'Service temporarily unavailable (Circuit Breaker Open)',
        status: 503,
        name: 'CircuitBreakerError',
        attempt,
        solution: getErrorSolution({ status: 503, message: 'Service temporarily unavailable' }),
      };
    }

    // Check offline status and try cache for GET requests
    const isOnline = NetworkMonitor.getStatus();
    if (!isOnline && isGetRequest && useCache) {
      const cachedData = OfflineCache.get(fullUrl);
      if (cachedData) {
        logger.info('Using cached data (offline)', { url });
        return new Response(JSON.stringify({ success: true, data: cachedData }), {
          status: 200,
          statusText: 'OK (Cached - Offline)',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw {
        message: 'Keine Internetverbindung',
        status: 0,
        name: 'NetworkError',
        attempt,
        solution: getErrorSolution({ status: 0, message: 'Keine Internetverbindung' }),
      };
    }

    // Add JWT Token if available
    const token = localStorage.getItem('nebula_access_token');
    const headers = new Headers(options.headers);

    // Für Demo-Tokens: Setze Authorization Header, aber API wird es ignorieren können
    if (token) {
      // Demo-Tokens werden nicht wirklich validiert, aber Header wird gesetzt für Konsistenz
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Add idempotency key for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(options.method || 'GET')) {
      const idempotencyKey = `idempotency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      headers.set('Idempotency-Key', idempotencyKey);
    }

    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    const startTime = performance.now();
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const duration = performance.now() - startTime;
    logger.logPerformance(`API ${options.method || 'GET'} ${url}`, duration, {
      status: response.status,
      attempt
    });

    clearTimeout(timeoutId);

    // Record success in circuit breaker
    if (response.ok) {
      circuitBreaker.recordSuccess();
      
      // Cache successful GET responses - optimized with smart invalidation
      if (isGetRequest && useCache && response.status === 200) {
        try {
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();
          if (data?.data && typeof data.data === 'object') {
            // Only cache if data is valid
            OfflineCache.set(fullUrl, data.data);
            
            // Invalidate related caches for mutations (e.g., POST/PUT/DELETE on same resource)
            // This is handled by query invalidation in React Query, but we can also do it here
            const cacheControl = response.headers.get('Cache-Control');
            if (cacheControl && cacheControl.includes('no-cache')) {
              // Don't cache if server says not to
              OfflineCache.remove(fullUrl);
            }
          }
        } catch (error) {
          // Ignore cache errors - don't break the request
          logger.debug('Failed to cache response', { url: fullUrl, error });
        }
      }
    } else {
      // Record failure in circuit breaker for server errors
      if (response.status >= 500) {
        circuitBreaker.recordFailure({ status: response.status });
      }
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: error instanceof Error && error.name === 'AbortError' 
        ? 408 
        : (error as ApiError)?.status,
      name: error instanceof Error ? error.name : 'UnknownError',
      attempt,
      solution: (error as ApiError)?.solution || getErrorSolution(error),
    };

    // Record failure in circuit breaker
    if (apiError.status >= 500 || !apiError.status) {
      circuitBreaker.recordFailure(apiError);
    }

    // Check if we should retry
    if (shouldRetry(apiError, attempt)) {
      const retryDelay = calculateRetryDelay(attempt);
      logger.warn(`API request failed, retrying in ${retryDelay}ms`, {
        url,
        error: apiError,
        attempt: attempt + 1
      });
      
      await delay(retryDelay);
      return makeRequest(url, options, attempt + 1, useCache);
    }

    // Try cache as fallback for GET requests
    if (isGetRequest && useCache && attempt === MAX_RETRIES) {
      const cachedData = OfflineCache.get(fullUrl);
      if (cachedData) {
        logger.info('Using cached data as fallback after retries', { url });
        return new Response(JSON.stringify({ success: true, data: cachedData }), {
          status: 200,
          statusText: 'OK (Cached - Fallback)',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    logger.logApiError(apiError, { url, options });
    throw apiError;
    }
  })();

  // Store pending request for deduplication (only for GET requests on first attempt)
  if (isGetRequest && attempt === 0) {
    const requestKey = getRequestKey(url, options);
    pendingRequests.set(requestKey, {
      promise: requestPromise,
      timestamp: Date.now(),
    });
    
    // Clean up after request completes
    requestPromise.finally(() => {
      // Small delay to allow other requests to reuse this one
      setTimeout(() => {
        pendingRequests.delete(requestKey);
      }, 100);
    });
  }

  return requestPromise;
}

// Helper function to check if token is demo token
function isDemoToken(token: string | null): boolean {
  return token?.startsWith('demo-') || false;
}

// Helper function to check if in demo mode (exported version used)
export const isDemoMode = () => {
  return isDemoToken(localStorage.getItem('nebula_access_token'));
};

// Handle token refresh
async function handleTokenRefresh(error: ApiError | Error): Promise<boolean> {
  const apiError = error as ApiError;
  
  // Skip refresh für Demo-Mode
  if (isDemoMode()) {
    logger.info('Skipping token refresh in demo mode');
    return false; // Return false but don't clear auth
  }
  
  if (apiError.status === 401) {
    const refreshToken = localStorage.getItem('nebula_refresh_token');
    
    // Skip refresh für Demo-Tokens
    if (isDemoToken(refreshToken)) {
      logger.info('Skipping token refresh for demo token');
      return false;
    }
    
    if (refreshToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          const { accessToken } = data.data;
          localStorage.setItem('nebula_access_token', accessToken);
          return true;
        }
      } catch (refreshError) {
        // Refresh fehlgeschlagen, leite zu Login um (nur wenn nicht Demo)
        if (!isDemoMode()) {
          localStorage.removeItem('nebula_access_token');
          localStorage.removeItem('nebula_refresh_token');
          // Clear auth store nur wenn nicht Demo
          if (typeof window !== 'undefined') {
            try {
              const { useAuthStore } = await import('../store/auth');
              const isDemo = useAuthStore.getState().isDemoMode;
              if (!isDemo) {
                useAuthStore.getState()._clearAuth();
                window.location.reload();
              }
            } catch (err) {
              // Fallback: Reload nur wenn nicht Demo
              if (!isDemoMode()) {
                window.location.reload();
              }
            }
          }
        }
      }
    }
  }
  return false;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
    total?: number;
  };
}

// API Client Class using native fetch
export class ApiClient {
  // Generic HTTP Methods
  async get<T = unknown>(url: string, params?: Record<string, unknown>, options?: { returnFullResponse?: boolean }): Promise<T> {
    // Add query parameters if provided
    let finalUrl = url;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
      if (searchParams.toString()) {
        finalUrl = `${url}?${searchParams.toString()}`;
      }
    }

    let response = await makeRequest(finalUrl, { method: 'GET' });

    // Handle token refresh if needed (skip für Demo-Mode)
    if (response.status === 401 && !isDemoMode()) {
      const refreshed = await handleTokenRefresh({ status: 401 });
      if (refreshed) {
        response = await makeRequest(finalUrl, { method: 'GET' });
      }
    } else if (response.status === 401 && isDemoMode()) {
      // Demo-Mode: Return empty data
      if (options?.returnFullResponse) {
        return { success: true, data: null } as T;
      }
      return null as T;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw {
        status: response.status,
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        code: errorData.code,
        data: errorData
      };
    }

    const data = await response.json();
    // Return full response if requested (for paginated endpoints), otherwise just data.data
    return (options?.returnFullResponse ? data : data.data) as T;
  }

  async post<T = unknown>(url: string, data?: unknown, options?: { returnFullResponse?: boolean }): Promise<T> {
    let response = await makeRequest(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers: { 'Content-Type': 'application/json' }
    });

    // Handle token refresh if needed (skip für Demo-Mode)
    if (response.status === 401 && !isDemoMode()) {
      const refreshed = await handleTokenRefresh({ status: 401 });
      if (refreshed) {
        response = await makeRequest(url, {
          method: 'POST',
          body: data ? JSON.stringify(data) : undefined,
        });
      } else if (isDemoMode()) {
        // Demo-Mode: Return mock success response
        return { success: true, data: null } as T;
      }
    } else if (response.status === 401 && isDemoMode()) {
      // Demo-Mode: Return mock success response
      return { success: true, data: null } as T;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw {
        status: response.status,
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        code: errorData.code,
        data: errorData
      };
    }

    const responseData = await response.json();
    return (options?.returnFullResponse ? responseData : responseData.data) as T;
  }

  async put<T = unknown>(url: string, data?: unknown, options?: { returnFullResponse?: boolean }): Promise<T> {
    let response = await makeRequest(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });

    // Handle token refresh if needed (skip für Demo-Mode)
    if (response.status === 401 && !isDemoMode()) {
      const refreshed = await handleTokenRefresh({ status: 401 });
      if (refreshed) {
        response = await makeRequest(url, {
          method: 'PUT',
          body: data ? JSON.stringify(data) : undefined,
        });
      } else if (isDemoMode()) {
        return { success: true, data: null } as T;
      }
    } else if (response.status === 401 && isDemoMode()) {
      return { success: true, data: null } as T;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw {
        status: response.status,
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        code: errorData.code,
        data: errorData
      };
    }

    const responseData = await response.json();
    return (options?.returnFullResponse ? responseData : responseData.data) as T;
  }

  async patch<T = unknown>(url: string, data?: unknown, options?: { returnFullResponse?: boolean }): Promise<T> {
    let response = await makeRequest(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      headers: { 'Content-Type': 'application/json' }
    });

    // Handle token refresh if needed (skip für Demo-Mode)
    if (response.status === 401 && !isDemoMode()) {
      const refreshed = await handleTokenRefresh({ status: 401 });
      if (refreshed) {
        response = await makeRequest(url, {
          method: 'PATCH',
          body: data ? JSON.stringify(data) : undefined,
        });
      } else if (isDemoMode()) {
        return { success: true, data: null } as T;
      }
    } else if (response.status === 401 && isDemoMode()) {
      return { success: true, data: null } as T;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw {
        status: response.status,
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        code: errorData.code,
        data: errorData
      };
    }

    const responseData = await response.json();
    return (options?.returnFullResponse ? responseData : responseData.data) as T;
  }

  async delete<T = unknown>(url: string, options?: { returnFullResponse?: boolean }): Promise<T> {
    let response = await makeRequest(url, { method: 'DELETE' });

    // Handle token refresh if needed (skip für Demo-Mode)
    if (response.status === 401 && !isDemoMode()) {
      const refreshed = await handleTokenRefresh({ status: 401 });
      if (refreshed) {
        response = await makeRequest(url, { method: 'DELETE' });
      } else if (isDemoMode()) {
        return { success: true, data: null } as T;
      }
    } else if (response.status === 401 && isDemoMode()) {
      return { success: true, data: null } as T;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw {
        status: response.status,
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        code: errorData.code,
        data: errorData
      };
    }

    const responseData = await response.json();
    return (options?.returnFullResponse ? responseData : responseData.data) as T;
  }

  // Pagination Helper
  async getPaginated<T>(
    url: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedResponse<T>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const finalUrl = searchParams.toString()
      ? `${url}?${searchParams.toString()}`
      : url;

    let response = await makeRequest(finalUrl, { method: 'GET' });

    // Handle token refresh if needed (skip für Demo-Mode)
    if (response.status === 401 && !isDemoMode()) {
      const refreshed = await handleTokenRefresh({ status: 401 });
      if (refreshed) {
        response = await makeRequest(finalUrl, { method: 'GET' });
      } else if (isDemoMode()) {
        return { data: [], total: 0, pagination: { limit: params?.limit || 10, offset: params?.offset || 0, hasMore: false } } as PaginatedResponse<T>;
      }
    } else if (response.status === 401 && isDemoMode()) {
      return { data: [], total: 0, pagination: { limit: params?.limit || 10, offset: params?.offset || 0, hasMore: false } } as PaginatedResponse<T>;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw {
        status: response.status,
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        code: errorData.code,
        data: errorData
      };
    }

    return await response.json();
  }

  // Multipart helpers (FormData) - do NOT set Content-Type manually
  async postForm<T = unknown>(url: string, formData: FormData, options?: { returnFullResponse?: boolean }): Promise<T> {
    let response = await makeRequest(url, {
      method: 'POST',
      body: formData
    });

    // Handle token refresh if needed (skip für Demo-Mode)
    if (response.status === 401 && !isDemoMode()) {
      const refreshed = await handleTokenRefresh({ status: 401 });
      if (refreshed) {
        response = await makeRequest(url, {
          method: 'POST',
          body: formData
        });
      } else if (isDemoMode()) {
        return { success: true, data: null } as T;
      }
    } else if (response.status === 401 && isDemoMode()) {
      return { success: true, data: null } as T;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw {
        status: response.status,
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        code: errorData.code,
        data: errorData
      };
    }

    const responseData = await response.json();
    return (options?.returnFullResponse ? responseData : responseData.data) as T;
  }

  async patchForm<T = unknown>(url: string, formData: FormData, options?: { returnFullResponse?: boolean }): Promise<T> {
    let response = await makeRequest(url, {
      method: 'PATCH',
      body: formData
    });

    // Handle token refresh if needed (skip für Demo-Mode)
    if (response.status === 401 && !isDemoMode()) {
      const refreshed = await handleTokenRefresh({ status: 401 });
      if (refreshed) {
        response = await makeRequest(url, {
          method: 'PATCH',
          body: formData
        });
      } else if (isDemoMode()) {
        return { success: true, data: null } as T;
      }
    } else if (response.status === 401 && isDemoMode()) {
      return { success: true, data: null } as T;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw {
        status: response.status,
        message: errorData.error || errorData.message || `HTTP ${response.status}`,
        code: errorData.code,
        data: errorData
      };
    }

    const responseData = await response.json();
    return (options?.returnFullResponse ? responseData : responseData.data) as T;
  }
}

// Exportiere API Client Instance
export const api = new ApiClient();
// Backward-compatible alias if some files used `apiClient`
export const apiClient = api;

// Utility Functions
export const setAuthTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('nebula_access_token', accessToken);
  localStorage.setItem('nebula_refresh_token', refreshToken);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('nebula_access_token');
  localStorage.removeItem('nebula_refresh_token');
};

export const getAuthTokens = () => ({
  accessToken: localStorage.getItem('nebula_access_token'),
  refreshToken: localStorage.getItem('nebula_refresh_token')
});

export const isAuthenticated = () => {
  const token = localStorage.getItem('nebula_access_token');
  return !!token; // Token existiert = authentifiziert (auch Demo-Token)
};

// Auth Token Manager für React Query
export class AuthManager {
  static setTokens(accessToken: string, refreshToken: string) {
    setAuthTokens(accessToken, refreshToken);
  }

  static clearTokens() {
    clearAuthTokens();
  }

  static getTokens() {
    return getAuthTokens();
  }

  static isAuthenticated() {
    return isAuthenticated();
  }
}
