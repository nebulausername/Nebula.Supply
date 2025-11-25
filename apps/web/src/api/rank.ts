export interface RankInfo {
  rank: string;
  nextRank?: string;
  progress?: {
    ordersNeeded?: number;
    invitesNeeded?: number;
    revenueNeeded?: number;
    premiumInvitesNeeded?: number;
    normalInvitesNeeded?: number;
  };
  orders: number;
  invites: number;
  revenueEur: number;
  premiumInvites: number;
  normalInvites: number;
  isVip: boolean;
  commissionPercentage: number;
}

// Custom Error Types
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ServerError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ServerError';
    this.status = status;
  }
}

// Default fallback values
const DEFAULT_RANK_INFO: RankInfo = {
  rank: 'Nutzer (Verifiziert)',
  orders: 0,
  invites: 0,
  revenueEur: 0,
  premiumInvites: 0,
  normalInvites: 0,
  isVip: false,
  commissionPercentage: 5.00
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Helper function to check if error is retryable
function isRetryableError(error: unknown): boolean {
  if (error instanceof TimeoutError) return true;
  if (error instanceof NetworkError) return true;
  if (error instanceof ServerError) {
    // Retry on 5xx errors, not on 4xx
    return error.status >= 500;
  }
  // Check for network-related errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('network error') ||
      message.includes('networkerror') ||
      message.includes('typeerror')
    );
  }
  return false;
}

// Helper function to delay execution
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Main function with retry logic
export async function getRankInfo(
  telegramId?: number,
  options?: { useFallback?: boolean }
): Promise<RankInfo> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const useFallback = options?.useFallback ?? false;
  
  const url = telegramId 
    ? `${apiUrl}/api/rank/${telegramId}`
    : `${apiUrl}/api/rank/me`;

  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        },
        REQUEST_TIMEOUT
      );

      if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        
        // Don't retry on 4xx errors (client errors)
        if (status >= 400 && status < 500) {
          throw new ServerError(
            `Client error: ${statusText}`,
            status
          );
        }
        
        // Retry on 5xx errors
        if (status >= 500) {
          throw new ServerError(
            `Server error: ${statusText}`,
            status
          );
        }
      }

      const data = await response.json();
      
      if (!data || !data.data) {
        throw new Error('Invalid response format');
      }

      return data.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      const shouldRetry = isRetryableError(error) && attempt < MAX_RETRIES - 1;
      
      if (!shouldRetry) {
        // Last attempt or non-retryable error
        break;
      }

      // Wait before retrying (exponential backoff)
      const delayMs = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      console.warn(
        `Rank API request failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delayMs}ms...`,
        error
      );
      await delay(delayMs);
    }
  }

  // All retries failed
  console.error('Failed to fetch rank info after all retries:', lastError);
  
  // Return fallback only if explicitly requested
  if (useFallback) {
    return DEFAULT_RANK_INFO;
  }
  
  // Re-throw the error for React Query to handle
  throw lastError || new Error('Failed to fetch rank info');
}

