import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from './client';
import { logger } from '../logger';
import { 
  dropsApi, 
  ordersApi, 
  productsApi,
  categoriesApi,
  customersApi, 
  inventoryApi, 
  analyticsApi 
} from './ecommerce';
import { usersApi } from './users';

// Query Keys für React Query
export const queryKeys = {
  // Dashboard
  dashboard: {
    overview: ['dashboard', 'overview'] as const,
    kpis: ['dashboard', 'kpis'] as const,
    trends: (timeRange: string, metrics: string) => ['dashboard', 'trends', timeRange, metrics] as const,
    activity: (limit: number) => ['dashboard', 'activity', limit] as const,
    alerts: ['dashboard', 'alerts'] as const,
  },

  // Tickets
  tickets: {
    list: (filters?: any) => ['tickets', 'list', filters] as const,
    detail: (id: string) => ['tickets', 'detail', id] as const,
    stats: ['tickets', 'stats'] as const,
  },

  // Authentication
  auth: {
    me: ['auth', 'me'] as const,
  },

  // System
  system: {
    health: ['system', 'health'] as const,
  },

  // Drops
  drops: {
    list: (filters?: any) => ['drops', 'list', filters] as const,
    detail: (id: string) => ['drops', 'detail', id] as const,
  },

  // Orders
  orders: (filters?: any) => ['orders', filters] as const,
  ordersInfinite: (filters?: any) => ['orders', 'infinite', filters] as const,
  order: (id: string) => ['orders', id] as const,

  // Products
  products: {
    list: (filters?: any) => ['products', 'list', filters] as const,
    infinite: (filters?: any) => ['products', 'infinite', filters] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    metrics: ['products', 'metrics'] as const,
  },

  // Categories
  categories: {
    list: (filters?: any) => ['categories', 'list', filters] as const,
    tree: (parentId?: string) => ['categories', 'tree', parentId] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
    analytics: (id: string) => ['categories', 'analytics', id] as const,
  },

  // Inventory
  inventory: {
    list: (filters?: any) => ['inventory', 'list', filters] as const,
    detail: (id: string) => ['inventory', 'detail', id] as const,
    lowStock: (threshold?: number) => ['inventory', 'lowStock', threshold] as const,
    history: (productId: string, limit?: number) => ['inventory', 'history', productId, limit] as const,
    autoReorder: ['inventory', 'autoReorder'] as const,
  },

  // Analytics
  analytics: {
    sales: (params?: any) => ['analytics', 'sales', params] as const,
    revenue: (startDate?: string, endDate?: string) => ['analytics', 'revenue', startDate, endDate] as const,
    bestsellers: (params?: any) => ['analytics', 'bestsellers', params] as const,
    categoryPerformance: (params?: any) => ['analytics', 'categoryPerformance', params] as const,
    customers: ['analytics', 'customers'] as const,
    dashboard: ['analytics', 'dashboard'] as const,
  },

  // Legacy - deprecated
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,

  // Bot
  bot: {
    stats: ['bot', 'stats'] as const,
    verifications: (filters?: any) => ['bot', 'verifications', filters] as const,
    inviteCodes: (filters?: any) => ['bot', 'inviteCodes', filters] as const,
    users: (filters?: any) => ['bot', 'users', filters] as const,
  }
};

// Dashboard Hooks
export const useDashboardOverview = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: () => api.get('/api/dashboard/overview'),
    staleTime: 30 * 1000, // 30 Sekunden
    gcTime: 5 * 60 * 1000, // 5 Minuten
    retry: 3,
    refetchInterval: 60 * 1000, // Alle Minute refetchen für Live-Daten
  });
};

export const useKPIs = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis,
    queryFn: () => api.get('/api/dashboard/kpis'),
    staleTime: 15 * 1000, // 15 Sekunden
    gcTime: 2 * 60 * 1000, // 2 Minuten
    retry: 3,
    refetchInterval: 30 * 1000, // Alle 30 Sekunden für Live-KPIs
    refetchIntervalInBackground: true, // Continue refetching in background
    // Placeholder data for instant UI feedback
    placeholderData: (previousData) => previousData,
  });
};

export const useTrends = (timeRange: string = '24h', metrics: string = 'all') => {
  return useQuery({
    queryKey: queryKeys.dashboard.trends(timeRange, metrics),
    queryFn: () => api.get(`/api/dashboard/trends?timeRange=${timeRange}&metrics=${metrics}`),
    staleTime: 60 * 1000, // 1 Minute
    gcTime: 10 * 60 * 1000, // 10 Minuten
    retry: 2,
  });
};

export const useActivityFeed = (limit: number = 20) => {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(limit),
    queryFn: () => api.get(`/api/dashboard/activity?limit=${limit}`),
    staleTime: 15 * 1000, // 15 Sekunden
    gcTime: 2 * 60 * 1000, // 2 Minuten
    retry: 3,
    refetchInterval: 30 * 1000, // Live-Updates für Activity
  });
};

export const useAlerts = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.alerts,
    queryFn: () => api.get('/api/dashboard/alerts'),
    staleTime: 10 * 1000, // 10 Sekunden für Alerts
    gcTime: 1 * 60 * 1000, // 1 Minute
    retry: 3,
    refetchInterval: 15 * 1000, // Sehr häufig für kritische Alerts
  });
};

// Ticket Hooks
export const useTickets = (filters?: {
  status?: string;
  priority?: string;
  assignedAgent?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.tickets.list(filters),
    queryFn: async () => {
      try {
        const response = await api.getPaginated('/api/tickets', filters);
        // Handle both paginated and non-paginated responses
        if (response && Array.isArray(response.data)) {
          return response;
        } else if (Array.isArray(response)) {
          return {
            data: response,
            pagination: {
              limit: filters?.limit || 50,
              offset: filters?.offset || 0,
              hasMore: false
            }
          };
        }
        return response;
      } catch (error) {
        logger.error('Failed to fetch tickets', error);
        // Return empty array on error to prevent UI crash
        return {
          data: [],
          pagination: {
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            hasMore: false
          }
        };
      }
    },
    staleTime: 30 * 1000, // 30 Sekunden
    gcTime: 5 * 60 * 1000, // 5 Minuten
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useTicket = (id: string) => {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => api.get(`/api/tickets/${id}`),
    staleTime: 60 * 1000, // 1 Minute für Ticket-Details
    gcTime: 10 * 60 * 1000, // 10 Minuten
    retry: 3,
    enabled: !!id, // Nur fetchen wenn ID vorhanden
  });
};

export const useTicketStats = () => {
  return useQuery({
    queryKey: queryKeys.tickets.stats,
    queryFn: () => api.get('/api/tickets/stats/overview'),
    staleTime: 30 * 1000, // 30 Sekunden
    gcTime: 5 * 60 * 1000, // 5 Minuten
    retry: 3,
    refetchInterval: 60 * 1000, // Alle Minute für Live-Stats
    refetchIntervalInBackground: true, // Continue refetching in background
    // Placeholder data for instant UI feedback
    placeholderData: (previousData) => previousData,
  });
};

// Authentication Hooks
export const useAuthUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => api.get('/api/auth/me'),
    staleTime: 5 * 60 * 1000, // 5 Minuten
    gcTime: 10 * 60 * 1000, // 10 Minuten
    retry: 2,
  });
};

// Mutation Hooks für Datenänderungen
export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      subject: string;
      summary: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      tags?: string[];
    }) => api.post('/api/tickets', data),

    // Optimistic Update - add temporary ticket to list
    onMutate: async (newTicketData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tickets.list() });
      const previousTicketsList = queryClient.getQueryData(queryKeys.tickets.list());

      // Create temporary ticket with optimistic ID
      const tempTicket = {
        id: `temp-${Date.now()}`,
        ...newTicketData,
        status: 'open' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOptimistic: true
      };

      // Add to list optimistically
      queryClient.setQueriesData(
        { queryKey: queryKeys.tickets.list() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: [tempTicket, ...old.data]
          };
        }
      );

      return { previousTicketsList, tempTicket };
    },

    onSuccess: (newTicket, variables, context) => {
      // Extract ticket from response (handle different formats)
      const createdTicket = newTicket?.data || newTicket?.data?.data || newTicket;
      
      // Replace temporary ticket with real one
      queryClient.setQueriesData(
        { queryKey: queryKeys.tickets.list() },
        (old: any) => {
          if (!old?.data) return old;
          
          // Remove optimistic ticket and add real one
          const filtered = Array.isArray(old.data) 
            ? old.data.filter((t: any) => !t.isOptimistic)
            : [];
          
          return {
            ...old,
            data: createdTicket ? [createdTicket, ...filtered] : filtered
          };
        }
      );

      // Set detail query with extracted ticket
      if (createdTicket?.id) {
        queryClient.setQueryData(queryKeys.tickets.detail(createdTicket.id), createdTicket);
      }
      
      // Invalidate queries for consistency
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tickets.list(),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.overview,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tickets.stats,
        refetchType: 'active'
      });

      logger.info('Ticket created successfully', { ticketId: createdTicket?.id || 'unknown' });
    },

    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousTicketsList) {
        queryClient.setQueryData(queryKeys.tickets.list(), context.previousTicketsList);
      }
      logger.error('Failed to create ticket', error);
    }
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/api/tickets/${id}`, data),

    // Optimistic Update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tickets.detail(id) });
      const previousTicket = queryClient.getQueryData(queryKeys.tickets.detail(id));

      queryClient.setQueryData(queryKeys.tickets.detail(id), (old: any) => ({
        ...old,
        ...data,
        updatedAt: new Date().toISOString()
      }));

      return { previousTicket };
    },

    onSuccess: (updatedTicket, { id }) => {
      // Update with server response
      queryClient.setQueryData(queryKeys.tickets.detail(id), updatedTicket);

      // Background refetch for consistency
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tickets.list(),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.overview,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tickets.stats,
        refetchType: 'active'
      });

      logger.info('Ticket updated successfully', { ticketId: id });
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousTicket) {
        queryClient.setQueryData(queryKeys.tickets.detail(variables.id), context.previousTicket);
      }
      logger.error('Failed to update ticket', error);
    }
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, comment }: {
      id: string;
      status: 'open' | 'waiting' | 'in_progress' | 'escalated' | 'done';
      comment?: string;
    }) => api.post(`/api/tickets/${id}/status`, { status, comment }),

    // Optimistic Update für sofortiges UI-Feedback
    onMutate: async ({ id, status, comment }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tickets.detail(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.tickets.list() });

      // Snapshot previous values
      const previousTicket = queryClient.getQueryData(queryKeys.tickets.detail(id));
      const previousTicketsList = queryClient.getQueryData(queryKeys.tickets.list());

      // Optimistically update ticket detail
      queryClient.setQueryData(queryKeys.tickets.detail(id), (old: any) => ({
        ...old,
        status,
        updatedAt: new Date().toISOString(),
        ...(comment && { lastComment: comment })
      }));

      // Optimistically update tickets list
      queryClient.setQueriesData(
        { queryKey: queryKeys.tickets.list() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((ticket: any) =>
              ticket.id === id
                ? { ...ticket, status, updatedAt: new Date().toISOString() }
                : ticket
            )
          };
        }
      );

      // Return context with snapshots for rollback
      return { previousTicket, previousTicketsList };
    },

    onSuccess: (updatedTicket, { id, status }) => {
      // Update with server response
      queryClient.setQueryData(queryKeys.tickets.detail(id), updatedTicket);

      // Batch invalidation for better performance
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            (key[0] === 'tickets' && key[1] === 'list') ||
            (key[0] === 'dashboard' && key[1] === 'overview') ||
            (key[0] === 'tickets' && key[1] === 'stats')
          );
        },
        refetchType: 'active'
      });

      logger.info('Ticket status updated', { ticketId: id, status });
    },

    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousTicket) {
        queryClient.setQueryData(queryKeys.tickets.detail(variables.id), context.previousTicket);
      }
      if (context?.previousTicketsList) {
        queryClient.setQueryData(queryKeys.tickets.list(), context.previousTicketsList);
      }
      logger.error('Failed to update ticket status', error);
    }
  });
};

export const useTicketReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, message, isPrivate, attachments }: {
      ticketId: string;
      message: string;
      isPrivate?: boolean;
      attachments?: File[];
    }) => {
      // In production, handle file uploads properly
      return api.post(`/api/tickets/${ticketId}/replies`, {
        from: isPrivate ? 'agent' : 'agent',
        user_id: 'admin', // Get from auth context
        message,
        isPrivate,
      });
    },

    onSuccess: (data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
      logger.info('Ticket reply sent', { ticketId });
    },

    onError: (error) => {
      logger.error('Failed to send ticket reply', error);
    }
  });
};

export const useTicketAssign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, agentId }: { ticketId: string; agentId: string }) =>
      api.post(`/api/tickets/${ticketId}/assign`, { agentId }),

    onSuccess: (data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
      logger.info('Ticket assigned', { ticketId });
    },

    onError: (error) => {
      logger.error('Failed to assign ticket', error);
    }
  });
};

export const useUpdateTicketPriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, priority }: { ticketId: string; priority: 'low' | 'medium' | 'high' | 'critical' }) =>
      api.put(`/api/tickets/${ticketId}`, { priority }),

    onSuccess: (data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
      logger.info('Ticket priority updated', { ticketId, priority: data.priority });
    },

    onError: (error) => {
      logger.error('Failed to update ticket priority', error);
    }
  });
};

export const useTicketTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, tags }: { ticketId: string; tags: string[] }) =>
      api.put(`/api/tickets/${ticketId}`, { tags }),

    onSuccess: (data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
      logger.info('Ticket tags updated', { ticketId, tags: data.tags });
    },

    onError: (error) => {
      logger.error('Failed to update ticket tags', error);
    }
  });
};

export const useTicketNotes = () => {
  const queryClient = useQueryClient();

  return {
    addNote: useMutation({
      mutationFn: ({ ticketId, note }: { ticketId: string; note: string }) =>
        api.post(`/api/tickets/${ticketId}/notes`, { note }),

      onSuccess: (data, { ticketId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
        logger.info('Ticket note added', { ticketId });
      },

      onError: (error) => {
        logger.error('Failed to add ticket note', error);
      }
    }),

    updateNote: useMutation({
      mutationFn: ({ ticketId, noteId, note }: { ticketId: string; noteId: string; note: string }) =>
        api.put(`/api/tickets/${ticketId}/notes/${noteId}`, { note }),

      onSuccess: (data, { ticketId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
        logger.info('Ticket note updated', { ticketId, noteId: data.noteId });
      },

      onError: (error) => {
        logger.error('Failed to update ticket note', error);
      }
    }),

    deleteNote: useMutation({
      mutationFn: ({ ticketId, noteId }: { ticketId: string; noteId: string }) =>
        api.delete(`/api/tickets/${ticketId}/notes/${noteId}`),

      onSuccess: (data, { ticketId }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) });
        logger.info('Ticket note deleted', { ticketId, noteId: data.noteId });
      },

      onError: (error) => {
        logger.error('Failed to delete ticket note', error);
      }
    }),
  };
};

export const useTicketMerge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceTicketIds, targetTicketId, options }: {
      sourceTicketIds: string[];
      targetTicketId: string;
      options?: {
        keepSourceMessages?: boolean;
        keepSourceTags?: boolean;
        mergeNotes?: boolean;
      };
    }) =>
      api.post('/api/tickets/merge', {
        sourceTicketIds,
        targetTicketId,
        options,
      }),

    onSuccess: (data, { sourceTicketIds, targetTicketId }) => {
      // Invalidate all affected tickets
      sourceTicketIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(targetTicketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.stats });
      logger.info('Tickets merged', { sourceTicketIds, targetTicketId });
    },

    onError: (error) => {
      logger.error('Failed to merge tickets', error);
    }
  });
};

export const useBulkTicketUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketIds, updates }: { ticketIds: string[]; updates: any }) =>
      api.post('/api/tickets/bulk/update', { ticketIds, updates }),

    onSuccess: (data, { ticketIds }) => {
      // Invalidate all affected tickets
      ticketIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.stats });
      logger.info('Bulk ticket update', { count: ticketIds.length });
    },

    onError: (error) => {
      logger.error('Failed to bulk update tickets', error);
    }
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post('/api/auth/login', credentials),

    onSuccess: (data) => {
      // Setze Tokens
      const { setAuthTokens } = require('./client');
      setAuthTokens(data.tokens.accessToken, data.tokens.refreshToken);

      // Setze User-Daten
      queryClient.setQueryData(queryKeys.auth.me, data.user);

      // Invalidate alle Queries für frische Daten
      queryClient.invalidateQueries();

      logger.info('Login successful', { userId: data.user.id });
    },

    onError: (error) => {
      logger.error('Login failed', error);
    }
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/api/auth/logout'),

    onSuccess: () => {
      // Clear Tokens
      const { clearAuthTokens } = require('./client');
      clearAuthTokens();

      // Clear alle cached Daten
      queryClient.clear();

      logger.info('Logout successful');
    },

    onError: (error) => {
      logger.error('Logout failed', error);
    }
  });
};

// System Health Hook
export const useSystemHealth = () => {
  return useQuery({
    queryKey: queryKeys.system.health,
    queryFn: () => api.get('/health/detailed'),
    staleTime: 60 * 1000, // 1 Minute
    gcTime: 5 * 60 * 1000, // 5 Minuten
    retry: 3,
    refetchInterval: 2 * 60 * 1000, // Alle 2 Minuten
  });
};

// E-commerce Hooks
export const useDrops = (params?: Parameters<typeof dropsApi.getDrops>[0]) => {
  return useQuery({
    queryKey: queryKeys.drops.list(params),
    queryFn: async () => {
      try {
        return await dropsApi.getDrops(params);
      } catch (error: any) {
        // Enhanced error handling with better messages
        if (error?.status === 401) {
          throw new Error('Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.');
        } else if (error?.status === 403) {
          throw new Error('Keine Berechtigung zum Abrufen der Drops.');
        } else if (error?.status === 404) {
          throw new Error('Drop-Endpunkt nicht gefunden.');
        } else if (error?.status === 500) {
          throw new Error('Serverfehler. Bitte versuche es später erneut.');
        } else if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
          throw new Error('Netzwerkfehler. Überprüfe deine Internetverbindung.');
        } else if (error?.message?.includes('timeout')) {
          throw new Error('Anfrage-Zeitüberschreitung. Bitte versuche es erneut.');
        }
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (except 429 rate limit)
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
        return false;
      }
      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter: 1s, 2s, 4s
      const baseDelay = 1000 * Math.pow(2, attemptIndex);
      const jitter = Math.random() * 1000;
      return Math.min(baseDelay + jitter, 10000);
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });
};

export const useOrders = (params?: Parameters<typeof ordersApi.getOrders>[0]) => {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: async () => {
      // For development, return mock data
      if (import.meta.env.DEV) {
        const { mockOrders, mockOrderMetrics } = await import('../mockData/orders');
        
        // Simulate filtering based on params
        let filteredOrders = [...mockOrders];
        
        if (params?.status && params.status.length > 0) {
          filteredOrders = filteredOrders.filter(order => params.status!.includes(order.status));
        }
        
        if (params?.search) {
          const searchTerm = params.search.toLowerCase();
          filteredOrders = filteredOrders.filter(order =>
            order.orderId.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.customerEmail.toLowerCase().includes(searchTerm)
          );
        }
        
        // Simulate API response structure
        return {
          success: true,
          data: filteredOrders,
          total: filteredOrders.length,
          metrics: mockOrderMetrics,
          pagination: {
            limit: params?.limit || 50,
            offset: params?.offset || 0,
            hasMore: false
          }
        };
      }
      
      // Production: use real API
      return ordersApi.getOrders(params);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get orders with infinite scroll (cursor-based pagination)
export const useInfiniteOrders = (filters?: Omit<Parameters<typeof ordersApi.getOrders>[0], 'offset' | 'limit'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.ordersInfinite(filters),
    queryFn: async ({ pageParam = 0 }) => {
      // For development, return mock data
      if (import.meta.env.DEV) {
        const { mockOrders, mockOrderMetrics } = await import('../mockData/orders');
        
        // Simulate filtering based on params
        let filteredOrders = [...mockOrders];
        
        if (filters?.status && filters.status.length > 0) {
          filteredOrders = filteredOrders.filter(order => filters.status!.includes(order.status));
        }
        
        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredOrders = filteredOrders.filter(order =>
            order.orderId.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.customerEmail.toLowerCase().includes(searchTerm)
          );
        }
        
        // Simulate pagination
        const limit = 50;
        const offset = pageParam as number;
        const paginatedOrders = filteredOrders.slice(offset, offset + limit);
        
        return {
          success: true,
          data: paginatedOrders,
          total: filteredOrders.length,
          metrics: mockOrderMetrics,
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < filteredOrders.length
          }
        };
      }
      
      // Production: use real API
      return ordersApi.getOrders({
        ...filters,
        offset: pageParam as number,
        limit: 50,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + (page.data?.length || 0), 0);
      if (lastPage.pagination?.hasMore) {
        return totalLoaded;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes (optimized)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      orders: data.pages.flatMap(page => page.data || []),
      total: data.pages[0]?.total || 0,
      metrics: data.pages[0]?.metrics || {},
    }),
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status, trackingInfo }: { 
      orderId: string; 
      status: string; 
      trackingInfo?: any; 
    }) => {
      // For development, simulate API call
      if (import.meta.env.DEV) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        // Return mock updated order
        return {
          success: true,
          data: {
            id: orderId,
            status,
            trackingInfo,
            updatedAt: new Date().toISOString()
          },
          message: 'Order status updated successfully'
        };
      }
      
      // Production: use real API
      return ordersApi.updateOrderStatus(orderId, status as any, trackingInfo);
    },
    // Optimistic Update with rollback support
    onMutate: async ({ orderId, status, trackingInfo }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.orders() });
      await queryClient.cancelQueries({ queryKey: queryKeys.ordersInfinite() });
      await queryClient.cancelQueries({ queryKey: queryKeys.order(orderId) });

      // Snapshot previous values for rollback
      const previousOrders = queryClient.getQueryData(queryKeys.orders());
      const previousInfiniteOrders = queryClient.getQueriesData({ queryKey: queryKeys.ordersInfinite() });
      const previousOrder = queryClient.getQueryData(queryKeys.order(orderId));

      // Optimistically update in regular orders query
      queryClient.setQueriesData(
        { queryKey: queryKeys.orders() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((order: any) =>
              order.id === orderId || order.orderId === orderId
                ? { 
                    ...order, 
                    status, 
                    trackingNumber: trackingInfo?.trackingNumber || order.trackingNumber,
                    trackingUrl: trackingInfo?.trackingUrl || order.trackingUrl,
                    carrier: trackingInfo?.carrier || order.carrier,
                    estimatedDelivery: trackingInfo?.estimatedDelivery || order.estimatedDelivery,
                    updatedAt: new Date().toISOString() 
                  }
                : order
            )
          };
        }
      );

      // Optimistically update in infinite query cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.ordersInfinite() },
        (old: any) => {
          if (!old?.orders) return old;
          return {
            ...old,
            orders: old.orders.map((order: any) =>
              order.id === orderId || order.orderId === orderId
                ? { 
                    ...order, 
                    status, 
                    trackingNumber: trackingInfo?.trackingNumber || order.trackingNumber,
                    trackingUrl: trackingInfo?.trackingUrl || order.trackingUrl,
                    carrier: trackingInfo?.carrier || order.carrier,
                    estimatedDelivery: trackingInfo?.estimatedDelivery || order.estimatedDelivery,
                    updatedAt: new Date().toISOString() 
                  }
                : order
            )
          };
        }
      );

      // Optimistically update single order query
      queryClient.setQueryData(queryKeys.order(orderId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status,
          trackingNumber: trackingInfo?.trackingNumber || old.trackingNumber,
          trackingUrl: trackingInfo?.trackingUrl || old.trackingUrl,
          carrier: trackingInfo?.carrier || old.carrier,
          estimatedDelivery: trackingInfo?.estimatedDelivery || old.estimatedDelivery,
          updatedAt: new Date().toISOString(),
        };
      });

      return { previousOrders, previousInfiniteOrders, previousOrder };
    },
    onSuccess: (data, variables) => {
      // Update with server response in all caches
      queryClient.setQueriesData(
        { queryKey: queryKeys.orders() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((order: any) =>
              (order.id === variables.orderId || order.orderId === variables.orderId)
                ? { ...order, ...data.data }
                : order
            )
          };
        }
      );

      // Update infinite query cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.ordersInfinite() },
        (old: any) => {
          if (!old?.orders) return old;
          return {
            ...old,
            orders: old.orders.map((order: any) =>
              (order.id === variables.orderId || order.orderId === variables.orderId)
                ? { ...order, ...data.data }
                : order
            )
          };
        }
      );

      // Update single order cache
      if (data.data) {
        queryClient.setQueryData(queryKeys.order(variables.orderId), data.data);
      }
      
      logger.logUserAction('order_status_updated', { 
        orderId: variables.orderId, 
        status: variables.status 
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.orders(), context.previousOrders);
      }
      if (context?.previousInfiniteOrders) {
        context.previousInfiniteOrders.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.order(variables.orderId), context.previousOrder);
      }
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(queryKeys.orders(), context.previousOrders);
      }
      logger.error('Failed to update order status', { error: error.message });
    },
    // Selective invalidation - only invalidate affected queries, don't refetch immediately
    onSettled: (data, error, variables) => {
      // Only invalidate single order query if it's actively being used
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.order(variables.orderId),
        refetchType: 'active' // Only refetch if query is currently being used
      });
      
      // Mark infinite query as stale but don't refetch immediately
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.ordersInfinite(),
        refetchType: 'none' // Don't refetch, just mark as stale for next fetch
      });
      
      // Mark regular orders query as stale
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders(),
        refetchType: 'none' // Don't refetch, just mark as stale
      });
    }
  });
};

export const useProducts = (params?: Parameters<typeof productsApi.getProducts>[0]) => {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: async () => {
      try {
        return await productsApi.getProducts(params);
      } catch (error: any) {
        logger.error('Failed to fetch products', error);
        // Return empty structure on error to prevent UI crash
        return {
          success: false,
          data: [],
          total: 0,
          metrics: {},
          pagination: {
            limit: params?.limit || 50,
            offset: params?.offset || 0,
            hasMore: false
          }
        };
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useCustomers = (params?: Parameters<typeof customersApi.getCustomers>[0]) => {
  return useQuery({
    queryKey: [...queryKeys.customers, params],
    queryFn: () => customersApi.getCustomers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useInventory = (params?: Parameters<typeof inventoryApi.getInventory>[0]) => {
  return useQuery({
    queryKey: [...queryKeys.inventory, params],
    queryFn: () => inventoryApi.getInventory(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSalesAnalytics = (params?: Parameters<typeof analyticsApi.getSalesAnalytics>[0]) => {
  return useQuery({
    queryKey: [...queryKeys.analytics, 'sales', params],
    queryFn: () => analyticsApi.getSalesAnalytics(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useRevenueAnalytics = () => {
  return useQuery({
    queryKey: [...queryKeys.analytics, 'revenue'],
    queryFn: analyticsApi.getRevenueAnalytics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCustomerAnalytics = () => {
  return useQuery({
    queryKey: [...queryKeys.analytics, 'customers'],
    queryFn: analyticsApi.getCustomerAnalytics,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Additional hooks for customer details and low stock alerts
export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => customersApi.getCustomer(id),
    enabled: !!id,
  });
};

export const useCustomerOrders = (id: string) => {
  return useQuery({
    queryKey: [...queryKeys.customer(id), 'orders'],
    queryFn: () => customersApi.getCustomerOrders(id),
    enabled: !!id,
  });
};

export const useLowStockAlerts = () => {
  return useQuery({
    queryKey: [...queryKeys.inventory, 'alerts', 'low-stock'],
    queryFn: inventoryApi.getLowStockAlerts,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation Hooks for E-commerce
export const useCreateDrop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dropsApi.createDrop,
    // Optimistic Update
    onMutate: async (newDrop) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.drops.list() });
      const previousDrops = queryClient.getQueryData(queryKeys.drops.list());

      // Optimistically add new drop
      queryClient.setQueryData(queryKeys.drops.list(), (old: any) => {
        if (!old?.data) return old;
        const tempId = `temp-${Date.now()}`;
        return {
          ...old,
          data: [{ ...newDrop, id: tempId }, ...(Array.isArray(old.data) ? old.data : [])]
        };
      });

      return { previousDrops };
    },
    onSuccess: (createdDrop) => {
      // Replace temp drop with real one
      queryClient.setQueryData(queryKeys.drops.list(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: Array.isArray(old.data) 
            ? old.data.map((drop: any) => drop.id?.startsWith('temp-') ? createdDrop : drop)
            : old.data
        };
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.drops.list(),
        refetchType: 'active'
      });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousDrops) {
        queryClient.setQueryData(queryKeys.drops.list(), context.previousDrops);
      }
      logger.error('Failed to create drop', { error });
    },
  });
};

export const useUpdateDrop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof dropsApi.updateDrop>[1] }) =>
      dropsApi.updateDrop(id, data),
    // Optimistic Update
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.drops.list() });
      await queryClient.cancelQueries({ queryKey: queryKeys.drops.detail(id) });

      // Snapshot previous values for rollback
      const previousDrops = queryClient.getQueryData(queryKeys.drops.list());
      const previousDrop = queryClient.getQueryData(queryKeys.drops.detail(id));

      // Optimistically update drops list
      queryClient.setQueryData(queryKeys.drops.list(), (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: Array.isArray(old.data) 
            ? old.data.map((drop: any) => drop && drop.id === id ? { ...drop, ...data } : drop)
            : old.data
        };
      });

      // Optimistically update single drop
      queryClient.setQueryData(queryKeys.drops.detail(id), (old: any) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, ...data } };
      });

      return { previousDrops, previousDrop };
    },
    onSuccess: (updatedDrop, { id }) => {
      // Update with server response
      queryClient.setQueryData(queryKeys.drops.detail(id), (old: any) => {
        if (!old) return { data: updatedDrop };
        return { ...old, data: updatedDrop };
      });

      // Invalidate queries for background refetch
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.drops.list(),
        refetchType: 'active'
      });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousDrops) {
        queryClient.setQueryData(queryKeys.drops.list(), context.previousDrops);
      }
      if (context?.previousDrop) {
        queryClient.setQueryData(queryKeys.drops.detail(variables.id), context.previousDrop);
      }
      logger.error('Failed to update drop', { error, dropId: variables.id });
    },
  });
};

export const useDeleteDrop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dropsApi.deleteDrop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drops });
    },
  });
};

export const useBulkAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dropsApi.bulkAction,
    // Optimistic Update
    onMutate: async ({ action, dropIds, status, access }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.drops.list() });
      const previousDrops = queryClient.getQueryData(queryKeys.drops.list());

      // Optimistically update drops based on action
      queryClient.setQueryData(queryKeys.drops.list(), (old: any) => {
        if (!old?.data || !Array.isArray(old.data)) return old;
        return {
          ...old,
          data: old.data.map((drop: any) => {
            if (!drop || !dropIds.includes(drop.id)) return drop;
            switch (action) {
              case 'activate':
                return { ...drop, status: 'active' };
              case 'deactivate':
                return { ...drop, status: 'inactive' };
              case 'delete':
                return null; // Will be filtered out
              case 'status_change':
                return { ...drop, status: status || drop.status };
              case 'access_change':
                return { ...drop, access: access || drop.access };
              default:
                return drop;
            }
          }).filter((drop: any) => drop !== null)
        };
      });

      return { previousDrops };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.drops.list(),
        refetchType: 'active'
      });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousDrops) {
        queryClient.setQueryData(queryKeys.drops.list(), context.previousDrops);
      }
      logger.error('Failed to perform bulk action', { error, action: variables.action });
    },
  });
};

export const useReorderDrops = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dropsApi.reorderDrops,
    // Optimistic Update
    onMutate: async (dropIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.drops.list() });
      const previousDrops = queryClient.getQueryData(queryKeys.drops.list());

      // Optimistically reorder drops
      queryClient.setQueryData(queryKeys.drops.list(), (old: any) => {
        if (!old?.data || !Array.isArray(old.data)) return old;
        const dropsMap = new Map(old.data.map((drop: any) => [drop.id, drop]));
        const reorderedDrops = dropIds
          .map(id => dropsMap.get(id))
          .filter(Boolean)
          .concat(old.data.filter((drop: any) => !dropIds.includes(drop.id)));
        return {
          ...old,
          data: reorderedDrops
        };
      });

      return { previousDrops };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.drops.list(),
        refetchType: 'active'
      });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousDrops) {
        queryClient.setQueryData(queryKeys.drops.list(), context.previousDrops);
      }
      logger.error('Failed to reorder drops', { error });
    },
  });
};

export const useFakeCompletePreorder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dropsApi.fakeCompletePreorder,
    onSuccess: (_, dropId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drops.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drops.detail(dropId) });
    },
  });
};

export const useTrackPreorder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof dropsApi.trackPreorder>[1] }) =>
      dropsApi.trackPreorder(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drops.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.drops.detail(id) });
    },
  });
};

export const useDeleteDropLegacy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dropsApi.deleteDrop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drops.list() });
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard });
    },
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.createCustomer,
    onMutate: async (newCustomer) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers });
      
      const previousCustomers = queryClient.getQueryData(queryKeys.customers);
      
      // Optimistically update cache
      queryClient.setQueryData(queryKeys.customers, (old: any) => {
        const newCustomerData = {
          ...newCustomer,
          id: `temp-${Date.now()}`,
          orders: [],
          totalSpent: 0,
          joinDate: new Date().toISOString(),
        };
        return {
          ...old,
          data: old?.data ? [newCustomerData, ...old.data] : [newCustomerData],
          total: old?.total ? old.total + 1 : 1,
        };
      });
      
      return { previousCustomers };
    },
    onError: (err, newCustomer, context) => {
      if (context?.previousCustomers) {
        queryClient.setQueryData(queryKeys.customers, context.previousCustomers);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.customers });
    },
  });
};

export const useUpdateCustomerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Parameters<typeof customersApi.updateCustomerStatus>[1] }) =>
      customersApi.updateCustomerStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      queryClient.invalidateQueries({ queryKey: queryKeys.customer(id) });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof inventoryApi.updateInventoryItem>[1] }) =>
      inventoryApi.updateInventoryItem(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItem(id) });
    },
  });
};

// Bot Management Hooks
export const useBotStats = () => {
  return useQuery({
    queryKey: queryKeys.bot.stats,
    queryFn: () => api.get('/api/bot/stats'),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useBotVerifications = (filters?: { status?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: queryKeys.bot.verifications(filters),
    queryFn: () => api.getPaginated('/api/bot/verifications', filters),
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useBotInviteCodes = (filters?: { status?: string; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: queryKeys.bot.inviteCodes(filters),
    queryFn: () => api.getPaginated('/api/bot/invite-codes', filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useBotUsers = (filters?: { verified?: boolean; limit?: number; offset?: number }) => {
  return useQuery({
    queryKey: queryKeys.bot.users(filters),
    queryFn: () => api.getPaginated('/api/bot/users', filters),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Bot Mutations
export const useApproveVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ verificationId, adminId }: { verificationId: string; adminId: string }) =>
      api.post(`/api/bot/verifications/${verificationId}/approve`, { adminId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bot.verifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bot.stats });
    },
  });
};

export const useRejectVerification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ verificationId, adminId, reason }: { verificationId: string; adminId: string; reason: string }) =>
      api.post(`/api/bot/verifications/${verificationId}/reject`, { adminId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bot.verifications() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bot.stats });
    },
  });
};

export const useCreateInviteCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code?: string; max_uses?: number; expires_at?: string; created_by: string; is_active?: boolean; metadata?: any }) =>
      api.post('/api/bot/invite-codes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bot.inviteCodes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bot.stats });
    },
  });
};

export const useDeleteInviteCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (codeId: string) =>
      api.delete(`/api/bot/invite-codes/${codeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bot.inviteCodes() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bot.stats });
    },
  });
};

// User Management Hooks
export const useUsers = (filters?: Parameters<typeof usersApi.getUsers>[0]) => {
  return useQuery({
    queryKey: ['users', 'list', filters],
    queryFn: () => usersApi.getUsers(filters),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['users', 'detail', userId],
    queryFn: () => usersApi.getUser(userId),
    enabled: !!userId,
  });
};

export const useUserRoles = () => {
  return useQuery({
    queryKey: ['users', 'roles'],
    queryFn: () => usersApi.getRoles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserStats = (filters?: Parameters<typeof usersApi.getUserStats>[0]) => {
  return useQuery({
    queryKey: ['users', 'stats', filters],
    queryFn: () => usersApi.getUserStats(filters),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useUserActivities = (filters?: Parameters<typeof usersApi.getActivities>[0]) => {
  return useQuery({
    queryKey: ['users', 'activities', filters],
    queryFn: () => usersApi.getActivities(filters),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'inactive' | 'suspended' | 'pending' }) =>
      usersApi.updateUserStatus(userId, status),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role, roles }: { userId: string; role: string; roles?: string[] }) =>
      usersApi.updateUserRole(userId, role, roles),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
    },
  });
};

// Security Hooks
export const useSecurityStats = (params?: { dateRange?: '24h' | '7d' | '30d' | 'all' }) => {
  return useQuery({
    queryKey: ['security', 'stats', params],
    queryFn: () => api.get('/api/security/stats', params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useSecurityEvents = (params?: {
  severity?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['security', 'events', params],
    queryFn: () => api.getPaginated('/api/security/events', params),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
};

export const useAuditLogs = (params?: {
  search?: string;
  userId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['security', 'audit', params],
    queryFn: () => api.getPaginated('/api/security/audit', params),
    staleTime: 30 * 1000,
  });
};

export const useSecurityProtection = () => {
  return useQuery({
    queryKey: ['security', 'protection'],
    queryFn: () => api.get('/api/security/protection'),
    staleTime: 10 * 1000,
    refetchInterval: 20 * 1000,
  });
};

// System Config Hooks
export const useSystemConfig = () => {
  return useQuery({
    queryKey: ['system', 'config'],
    queryFn: () => api.get('/api/system/config'),
    staleTime: 5 * 60 * 1000,
  });
};

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['system', 'feature-flags'],
    queryFn: () => api.get('/api/system/feature-flags'),
    staleTime: 1 * 60 * 1000,
  });
};

export const useUpdateFeatureFlag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flag, enabled }: { flag: string; enabled: boolean }) =>
      api.post(`/api/system/feature-flags/${flag}`, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'feature-flags'] });
    },
  });
};

export const useEnvironmentVariables = () => {
  return useQuery({
    queryKey: ['system', 'env'],
    queryFn: () => api.get('/api/system/env'),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateEnvironmentVariable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.post('/api/system/env', { key, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'env'] });
    },
  });
};
