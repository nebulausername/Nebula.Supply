// API Client for Web App - Public Shop Access
// Simplified version without authentication for public shop

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;
const USE_OFFLINE_CACHE = true;

import { getCircuitBreaker } from '../utils/circuitBreaker';
import { OfflineCache, NetworkMonitor } from '../utils/offlineCache';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateRetryDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_DELAY_BASE * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  const maxDelay = 30000;
  return Math.min(exponentialDelay + jitter, maxDelay);
};

const shouldRetry = (error: any, attempt: number): boolean => {
  if (attempt >= MAX_RETRIES) return false;
  
  if (error.status >= 400 && error.status < 500 && error.status !== 429 && error.status !== 408) {
    return false;
  }
  
  return error.status >= 500 || 
         !error.status || 
         error.name === 'TypeError' || 
         error.name === 'AbortError' ||
         error.message?.includes('timeout') ||
         error.message?.includes('network') ||
         error.message?.includes('fetch failed');
};

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
}

async function makeRequest(
  url: string,
  options: RequestInit = {},
  attempt: number = 0,
  useCache: boolean = USE_OFFLINE_CACHE
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  const fullUrl = `${API_BASE_URL}${url}`;
  const isGetRequest = (options.method || 'GET') === 'GET';
  const circuitBreaker = getCircuitBreaker(url);

  try {
    if (!circuitBreaker.canAttemptRequest()) {
      const cachedData = useCache && isGetRequest ? OfflineCache.get(fullUrl) : null;
      if (cachedData) {
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
      };
    }

    const isOnline = NetworkMonitor.getStatus();
    if (!isOnline && isGetRequest && useCache) {
      const cachedData = OfflineCache.get(fullUrl);
      if (cachedData) {
        return new Response(JSON.stringify({ success: true, data: cachedData }), {
          status: 200,
          statusText: 'OK (Cached - Offline)',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw {
        message: 'No internet connection',
        status: 0,
        name: 'NetworkError',
        attempt,
      };
    }

    const headers = new Headers(options.headers);
    
    // Optional: Add token if user is authenticated (for future use)
    const token = localStorage.getItem('nebula_access_token') || localStorage.getItem('telegram_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      circuitBreaker.recordSuccess();
      
      if (isGetRequest && useCache && response.status === 200) {
        try {
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();
          if (data?.data && typeof data.data === 'object') {
            OfflineCache.set(fullUrl, data.data);
          }
        } catch (error) {
          // Ignore cache errors
        }
      }
    } else {
      if (response.status >= 500) {
        circuitBreaker.recordFailure({ status: response.status });
      }
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      circuitBreaker.recordFailure({ name: 'TimeoutError', message: 'Request timeout' });
    } else if (!error.status || error.status >= 500) {
      circuitBreaker.recordFailure(error);
    }

    if (shouldRetry(error, attempt)) {
      const delayMs = calculateRetryDelay(attempt);
      await delay(delayMs);
      return makeRequest(url, options, attempt + 1, useCache);
    }

    throw error;
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const api = {
  async get<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await makeRequest(url, { ...options, method: 'GET' });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorData.message || errorData.error || 'Request failed',
        data: errorData,
      } as ApiError;
    }

    const data = await response.json();
    return data;
  },

  async post<T>(url: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await makeRequest(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Special handling for 401 errors (authentication failures)
      if (response.status === 401) {
        // Check if this is a ticket creation request
        const isTicketCreation = url.includes('/api/tickets') && !url.includes('/api/tickets/');
        
        if (isTicketCreation) {
          // For ticket creation, provide helpful message about anonymous tickets
          throw {
            status: response.status,
            statusText: response.statusText,
            message: 'Anonyme Ticket-Erstellung ist aktiviert. Bitte versuche es erneut oder kontaktiere den Support.',
            data: errorData,
          } as ApiError;
        } else {
          // For other 401 errors, use standard message
          throw {
            status: response.status,
            statusText: response.statusText,
            message: errorData.error || errorData.message || 'Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.',
            data: errorData,
          } as ApiError;
        }
      }
      
      // Extract detailed validation errors if available
      let errorMessage = errorData.message || errorData.error || 'Request failed';
      if (errorData.details && Array.isArray(errorData.details)) {
        const validationErrors = errorData.details
          .map((detail: any) => {
            if (typeof detail === 'string') return detail;
            return detail.message || `${detail.field || 'field'}: ${detail.msg || 'invalid'}`;
          })
          .join(', ');
        if (validationErrors) {
          errorMessage = validationErrors;
        }
      }
      
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        data: errorData,
      } as ApiError;
    }

    const data = await response.json();
    return data;
  },

  async put<T>(url: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await makeRequest(url, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorData.message || errorData.error || 'Request failed',
        data: errorData,
      } as ApiError;
    }

    const data = await response.json();
    return data;
  },

  async delete<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const response = await makeRequest(url, { ...options, method: 'DELETE' });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorData.message || errorData.error || 'Request failed',
        data: errorData,
      } as ApiError;
    }

    const data = await response.json();
    return data;
  },
};

