import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRankInfo, type RankInfo, NetworkError, TimeoutError, ServerError } from '../api/rank';

// Query key factory for rank queries
export const rankQueryKeys = {
  all: ['rank'] as const,
  detail: (telegramId?: number) => ['rank', telegramId ?? 'me'] as const,
};

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

interface UseRankInfoOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?: number | boolean | ((failureCount: number, error: unknown) => boolean);
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchOnMount?: boolean;
}

/**
 * React Query hook for fetching rank information
 * 
 * Features:
 * - Automatic caching (2 minutes staleTime, 5 minutes gcTime)
 * - Request deduplication (multiple components can use this without duplicate requests)
 * - Retry logic with exponential backoff (handled by React Query)
 * - Optimistic updates support
 * 
 * @param telegramId - Optional Telegram ID. If not provided, fetches current user's rank
 * @param options - Additional React Query options
 * @returns Rank info data, loading state, error, and refetch function
 */
export function useRankInfo(
  telegramId?: number,
  options?: UseRankInfoOptions
) {
  const queryClient = useQueryClient();
  
  const {
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutes
    gcTime = 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    retry = (failureCount: number, error: unknown) => {
      // Retry up to 3 times
      if (failureCount >= 3) return false;
      
      // Don't retry on 4xx errors (client errors)
      if (error instanceof ServerError && error.status >= 400 && error.status < 500) {
        return false;
      }
      
      // Retry on network errors, timeouts, and 5xx errors
      return true;
    },
    retryDelay = (attemptIndex: number) => {
      // Exponential backoff: 1s, 2s, 4s
      return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
    },
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    refetchOnMount = true,
  } = options || {};

  const query = useQuery({
    queryKey: rankQueryKeys.detail(telegramId),
    queryFn: () => getRankInfo(telegramId, { useFallback: false }),
    enabled,
    staleTime,
    gcTime,
    retry,
    retryDelay,
    refetchOnWindowFocus,
    refetchOnReconnect,
    refetchOnMount,
    // Use placeholder data for optimistic UI
    placeholderData: (previousData) => previousData,
    // Provide fallback data structure
    select: (data) => data || DEFAULT_RANK_INFO,
  });

  // Helper function to manually refetch
  const refetch = () => {
    return query.refetch();
  };

  // Helper function to invalidate cache
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: rankQueryKeys.detail(telegramId) });
  };

  // Helper function to get error message in German
  const getErrorMessage = (): string | null => {
    if (!query.error) return null;
    
    if (query.error instanceof TimeoutError) {
      return 'Die Anfrage hat zu lange gedauert. Bitte versuche es erneut.';
    }
    
    if (query.error instanceof NetworkError) {
      return 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
    }
    
    if (query.error instanceof ServerError) {
      if (query.error.status >= 500) {
        return 'Serverfehler. Bitte versuche es später erneut.';
      }
      if (query.error.status === 401) {
        return 'Nicht autorisiert. Bitte melde dich erneut an.';
      }
      if (query.error.status === 403) {
        return 'Zugriff verweigert.';
      }
      if (query.error.status === 404) {
        return 'Rang-Informationen nicht gefunden.';
      }
      return `Fehler: ${query.error.message}`;
    }
    
    if (query.error instanceof Error) {
      return query.error.message;
    }
    
    return 'Ein unbekannter Fehler ist aufgetreten.';
  };

  return {
    // Data
    rankInfo: query.data,
    // Loading states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isRefetching: query.isRefetching,
    // Error states
    error: query.error,
    errorMessage: getErrorMessage(),
    isError: query.isError,
    // Status
    status: query.status,
    // Actions
    refetch,
    invalidate,
    // Success state
    isSuccess: query.isSuccess,
  };
}

/**
 * Hook to prefetch rank info (useful for preloading)
 */
export function usePrefetchRankInfo() {
  const queryClient = useQueryClient();
  
  return (telegramId?: number) => {
    queryClient.prefetchQuery({
      queryKey: rankQueryKeys.detail(telegramId),
      queryFn: () => getRankInfo(telegramId, { useFallback: false }),
      staleTime: 2 * 60 * 1000,
    });
  };
}

