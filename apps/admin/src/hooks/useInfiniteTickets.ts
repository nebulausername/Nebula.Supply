import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api/client';
import { queryKeys } from '../lib/api/hooks';
import { logger } from '../lib/logger';
import type { Ticket } from '@nebula/shared/types';
import type { TicketFilters } from '../components/tickets/types';

export interface UseInfiniteTicketsOptions {
  filters?: TicketFilters;
  limit?: number;
  enabled?: boolean;
}

export function useInfiniteTickets(options: UseInfiniteTicketsOptions = {}) {
  const { filters = {}, limit = 50, enabled = true } = options;

  return useInfiniteQuery({
    queryKey: queryKeys.tickets.list(filters),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const response = await api.getPaginated('/api/tickets', {
          status: filters.status?.join(','),
          priority: filters.priority?.join(','),
          assignedAgent: filters.assignedAgent?.join(','),
          category: filters.category?.join(','),
          tags: filters.tags?.join(','),
          search: filters.search,
          slaOverdue: filters.slaOverdue,
          limit,
          offset: pageParam * limit,
        });

        // Handle different response formats
        if (response && Array.isArray(response.data)) {
          return {
            data: response.data as Ticket[],
            pagination: {
              limit,
              offset: pageParam * limit,
              hasMore: response.data.length === limit,
              total: response.pagination?.total,
            },
          };
        } else if (Array.isArray(response)) {
          return {
            data: response as Ticket[],
            pagination: {
              limit,
              offset: pageParam * limit,
              hasMore: response.length === limit,
            },
          };
        }

        // Handle nested data structure
        if (response?.data?.data && Array.isArray(response.data.data)) {
          return {
            data: response.data.data as Ticket[],
            pagination: {
              limit,
              offset: pageParam * limit,
              hasMore: response.data.data.length === limit,
              total: response.data.pagination?.total,
            },
          };
        }

        logger.warn('Unexpected response format in useInfiniteTickets', { response });
        return {
          data: [] as Ticket[],
          pagination: {
            limit,
            offset: pageParam * limit,
            hasMore: false,
          },
        };
      } catch (error) {
        logger.error('Failed to fetch tickets (infinite)', error);
        return {
          data: [] as Ticket[],
          pagination: {
            limit,
            offset: pageParam * limit,
            hasMore: false,
          },
        };
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.pagination.hasMore) {
        return allPages.length;
      }
      return undefined;
    },
    initialPageParam: 0,
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: true,
  });
}
