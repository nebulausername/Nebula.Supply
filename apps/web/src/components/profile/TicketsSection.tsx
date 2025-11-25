/**
 * TicketsSection Component
 * 
 * Displays and manages user support tickets with:
 * - Real-time updates via WebSocket
 * - Advanced filtering and search
 * - Optimistic updates for better UX
 * - Offline detection and auto-recovery
 * - Mobile-optimized UI with touch interactions
 */

import { useMemo, useState, useCallback, useRef, memo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Plus, 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  Eye,
  Calendar,
  User,
  Mail,
  ChevronDown,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Target,
  Zap,
  Sparkles,
  Lock,
  Loader2,
  Search,
  RefreshCw,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { lazy, Suspense } from 'react';
import { TicketCard } from './TicketCard';

// Lazy load heavy components for better performance
const TicketCreate = lazy(() => import('../support/TicketCreate').then(module => ({ default: module.TicketCreate })));
const TicketDetail = lazy(() => import('../support/TicketDetail').then(module => ({ default: module.TicketDetail })));
import { PullToRefresh } from '../mobile/PullToRefresh';
import { categories } from '../support/types';
import { cn } from '../../utils/cn';
import { useMobileOptimizations } from '../MobileOptimizations';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import type { TicketData } from '../support/types';
import { fetchUserTickets, createTicket as createTicketRequest, addTicketReply, updateTicketStatus } from '../../api/tickets';
import { useAuthStore } from '../../store/auth';
import { useToastStore } from '../../store/toast';
import { useIsVip } from '../../hooks/useIsVip';
import { useTicketSync } from '../../hooks/useTicketSync';
import { useDebounce } from '../../hooks/useDebounce';
import { useTicketRealtime } from '../../hooks/useTicketRealtime';

const TicketsSectionContent = memo(() => {
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const addToast = useToastStore((state) => state.addToast);
  const { userRank } = useIsVip();
  const canReplyViaTelegram = userRank === 'VIP' || userRank === 'Stammkunde';
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return `anon_${Date.now()}`;
    const stored = localStorage.getItem('nebula_support_session');
    if (stored) return stored;
    const generated = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('nebula_support_session', generated);
    return generated;
  });

  const userIdentifier = user?.id ?? sessionId;

  // Memoized helper functions to prevent recreation on every render
  const formatCategoryLabel = useCallback((category?: string): string => {
    if (!category) return 'Sonstiges';
    const categoryData = categories.find(c => c.name === category || c.id === category);
    return categoryData ? categoryData.name : category;
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }, []);

  const getCategoryIcon = useCallback((category?: string): string => {
    const categoryData = categories.find(c => c.name === category || c.id === category);
    return categoryData?.icon ?? '📋';
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'open': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'in_progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'waiting': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'done': return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  }, []);

  const getStatusText = useCallback((status: string): string => {
    switch (status) {
      case 'open': return 'Offen';
      case 'in_progress': return 'In Bearbeitung';
      case 'waiting': return 'Wartet';
      case 'done': return 'Erledigt';
      default: return status;
    }
  }, []);

  const getPriorityColor = useCallback((priority: string): string => {
    switch (priority) {
      case 'low': return 'text-blue-400 bg-blue-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'high': return 'text-orange-400 bg-orange-500/10';
      case 'critical': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  }, []);

  const getPriorityText = useCallback((priority: string): string => {
    switch (priority) {
      case 'low': return 'Niedrig';
      case 'medium': return 'Mittel';
      case 'high': return 'Hoch';
      case 'critical': return 'Kritisch';
      default: return priority;
    }
  }, []);

  const ticketsQuery = useQuery<TicketData[]>({
    queryKey: ['profileTickets', userIdentifier],
    queryFn: async () => {
      try {
        // fetchUserTickets now handles errors gracefully and returns empty array
        const tickets = await fetchUserTickets({ userId: userIdentifier });
        return Array.isArray(tickets) ? tickets : [];
      } catch (error) {
        // Enhanced error handling - return empty array for graceful degradation
        console.warn('[TicketsSection] Failed to fetch tickets, using empty array:', error);
        // Return empty array instead of throwing to prevent UI crash
        return [];
      }
    },
    enabled: true, // Always enabled - fetchUserTickets handles missing userIdentifier gracefully
    staleTime: 60_000, // 60 seconds for better caching (increased from 30s)
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    placeholderData: [], // Show empty state immediately while loading
    retry: (failureCount, error) => {
      // Only retry on network errors, not on 4xx errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('404')) {
          return false; // Don't retry on auth/not found errors
        }
        // Retry network errors up to 2 times
        return failureCount < 2;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    refetchOnWindowFocus: false, // Prevent refetch on window focus for better UX
    refetchOnMount: false, // Use cached data when available (changed from true)
    refetchOnReconnect: true, // Refetch when connection is restored
  });

  // Get tickets data early for use in callbacks
  const tickets = ticketsQuery.data ?? [];

  // Realtime updates via WebSocket (primary)
  // Only initialize WebSocket after initial data load and if tickets exist or user is authenticated
  const ticketRealtime = useTicketRealtime({
    userId: userIdentifier,
    enabled: Boolean(userIdentifier) && (!ticketsQuery.isLoading && (tickets.length > 0 || Boolean(user?.id))),
    onNewMessage: useCallback((ticketId: string, message) => {
      // Show toast notification for new agent messages
      if (message.from === 'agent') {
        // Use queryClient to get latest tickets data
        const currentTickets = queryClient.getQueryData<TicketData[]>(['profileTickets', userIdentifier]) ?? [];
        const ticket = currentTickets.find(t => t.id === ticketId);
        addToast({
          type: 'info',
          title: 'Neue Antwort',
          message: ticket ? `Neue Antwort auf "${ticket.subject}"` : 'Neue Antwort erhalten',
          duration: 5000
        });
        triggerHaptic('light');
      }
    }, [queryClient, userIdentifier, addToast, triggerHaptic]),
    onStatusChange: useCallback((ticketId: string, oldStatus, newStatus) => {
      // Use queryClient to get latest tickets data
      const currentTickets = queryClient.getQueryData<TicketData[]>(['profileTickets', userIdentifier]) ?? [];
      const ticket = currentTickets.find(t => t.id === ticketId);
      if (ticket && newStatus === 'done') {
        addToast({
          type: 'success',
          title: 'Ticket geschlossen',
          message: `Ticket "${ticket.subject}" wurde als erledigt markiert`,
          duration: 4000
        });
        triggerHaptic('success');
      }
    }, [queryClient, userIdentifier, addToast, triggerHaptic])
  });

  // Fallback polling (only if WebSocket is not connected)
  useTicketSync({
    userId: userIdentifier,
    enabled: Boolean(userIdentifier) && !ticketRealtime.isConnected,
    intervalMs: 15000,
  });

  // Online/Offline detection and auto-recovery (moved after ticketsQuery definition)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Clear any pending retry timeouts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      // Auto-refetch when coming back online
      if (ticketsQuery.isError) {
        ticketsQuery.refetch();
        addToast({
          type: 'info',
          title: 'Verbindung wiederhergestellt',
          message: 'Tickets werden aktualisiert...',
          duration: 3000
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        type: 'warning',
        title: 'Offline',
        message: 'Du bist offline. Änderungen werden gespeichert, sobald die Verbindung wiederhergestellt ist.',
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [ticketsQuery, addToast]);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const filteredTickets = useMemo(() => {
    let filtered = tickets;
    
    // Apply search filter
    if (debouncedSearch) {
      const normalized = debouncedSearch.toLowerCase().trim();
      if (normalized) {
        filtered = filtered.filter((ticket) => {
          const subject = ticket.subject?.toLowerCase() ?? '';
          const categoryLabel = formatCategoryLabel(ticket.category).toLowerCase();
          const ticketId = ticket.id.toLowerCase();
          const status = ticket.status.toLowerCase();
          
          return (
            subject.includes(normalized) ||
            ticketId.includes(normalized) ||
            categoryLabel.includes(normalized) ||
            status.includes(normalized) ||
            (ticket.description?.toLowerCase() ?? '').includes(normalized)
          );
        });
      }
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    
    return filtered;
  }, [tickets, debouncedSearch, statusFilter, priorityFilter]);
  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId]
  );
  
  // Use filteredTickets directly instead of creating a redundant memoized copy
  const visibleTickets = filteredTickets;

  // Memoize upsertTicket to avoid recreating function on every render
  const upsertTicket = useMemo(() => {
    return (incoming: TicketData) => {
      queryClient.setQueryData<TicketData[]>(['profileTickets', userIdentifier], (prev = []) => {
        const existingIndex = prev.findIndex((ticket) => ticket.id === incoming.id);
        if (existingIndex === -1) {
          // New ticket - add to beginning of array
          return [incoming, ...prev];
        }
        // Update existing ticket - only create new array if data actually changed
        const existing = prev[existingIndex];
        if (existing.updatedAt === incoming.updatedAt && 
            existing.status === incoming.status &&
            existing.messages?.length === incoming.messages?.length) {
          // No changes detected, return previous array to avoid unnecessary re-render
          return prev;
        }
        const next = [...prev];
        next[existingIndex] = incoming;
        return next;
      });
    };
  }, [queryClient, userIdentifier]);

  const normalizeCategory = (value?: string) => {
    if (!value || value.trim() === '') {
      console.warn('[TicketsSection] Empty category provided, defaulting to "other"');
      return 'other';
    }
    const trimmedValue = value.trim();
    const match = categories.find((category) => category.id === trimmedValue || category.name === trimmedValue);
    if (!match) {
      console.warn('[TicketsSection] Invalid category provided:', trimmedValue, 'defaulting to "other"');
      return 'other';
    }
    return match.id;
  };

  const createTicketMutation = useMutation({
    mutationFn: (payload: { subject: string; description: string; category: string; priority?: TicketData['priority'] }) =>
      createTicketRequest({
        subject: payload.subject,
        summary: payload.description,
        category: payload.category,
        priority: payload.priority ?? 'medium',
        userId: userIdentifier,
        sessionId: userIdentifier?.startsWith('anon_') ? userIdentifier : undefined, // Send sessionId for anonymous users
        channel: 'web',
      }),
    onSuccess: (newTicket) => {
      upsertTicket(newTicket);
      addToast({
        type: 'success',
        title: 'Ticket wurde erfolgreich gesendet',
        message: 'Sobald wir uns melden, sagen wir dir über den Telegram-Bot Bescheid. Du kannst dann gerne antworten oder das Ticket schließen.',
        duration: 8000,
      });
      setShowCreateModal(false);
      setTicketSubject('');
      setTicketDescription('');
      setSelectedCategory('');
    },
    onError: (error: unknown, variables, context) => {
      // Enhanced error handling with detailed error messages
      let errorMessage = 'Unbekannter Fehler';
      let errorTitle = 'Ticket konnte nicht erstellt werden';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for authentication errors specifically
        if (errorMessage.includes('Authentifizierung fehlgeschlagen') || 
            errorMessage.includes('Authentifizierung') ||
            errorMessage.includes('401') ||
            errorMessage.includes('AUTH')) {
          errorTitle = 'Authentifizierungsproblem';
          errorMessage = 'Anonyme Ticket-Erstellung ist aktiviert. Bitte versuche es erneut. Falls das Problem weiterhin besteht, kontaktiere den Support.';
        }
        // Check for validation errors
        else if (errorMessage.includes('Validierungsfehler:')) {
          errorTitle = 'Validierungsfehler';
          // Keep the detailed validation message
        } else if (errorMessage.includes('Subject ist erforderlich') || errorMessage.includes('subject')) {
          errorTitle = 'Betreff fehlt';
          errorMessage = 'Bitte gib einen Betreff für dein Ticket ein.';
        } else if (errorMessage.includes('Summary ist erforderlich') || errorMessage.includes('summary') || errorMessage.includes('Beschreibung')) {
          errorTitle = 'Beschreibung fehlt';
          errorMessage = 'Bitte beschreibe dein Anliegen.';
        } else if (errorMessage.includes('Kategorie ist erforderlich') || errorMessage.includes('category')) {
          errorTitle = 'Kategorie fehlt';
          errorMessage = 'Bitte wähle eine Kategorie für dein Ticket.';
        } else if (errorMessage.includes('USER_ID_REQUIRED') || errorMessage.includes('Benutzer-ID')) {
          errorTitle = 'Benutzer-ID Problem';
          errorMessage = 'Es konnte keine Benutzer-ID generiert werden. Bitte lade die Seite neu und versuche es erneut.';
        }
      }
      
      // Check if error has status 401 (authentication)
      const isAuthError = (error as any)?.status === 401 || 
                         errorMessage.toLowerCase().includes('authentifizierung') ||
                         errorMessage.toLowerCase().includes('401') ||
                         errorMessage.toLowerCase().includes('auth');
      
      const isNetworkError = !isAuthError && (
        errorMessage.toLowerCase().includes('network') || 
        errorMessage.toLowerCase().includes('fetch') ||
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('verbindung')
      );
      
      addToast({
        type: 'error',
        title: errorTitle,
        message: isNetworkError 
          ? 'Verbindungsproblem. Bitte überprüfe deine Internetverbindung und versuche es erneut.'
          : errorMessage || 'Bitte versuche es erneut.',
        duration: isAuthError ? 10000 : (isNetworkError ? 6000 : 8000),
      });
      
      triggerHaptic('error');
      
      // Log error for debugging in development
      if (import.meta.env.DEV) {
        console.error('[TicketsSection] Ticket creation failed:', {
          error,
          variables,
          errorMessage,
          isAuthError,
          userIdentifier,
          hasUser: !!user,
        });
      }
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      addTicketReply(ticketId, {
        message,
        userId: userIdentifier,
        from: 'user',
      }),
    onMutate: async ({ ticketId, message }) => {
      // Optimistic update: Add message immediately to UI
      await queryClient.cancelQueries({ queryKey: ['profileTickets', userIdentifier] });
      const previousTickets = queryClient.getQueryData<TicketData[]>(['profileTickets', userIdentifier]);
      
      queryClient.setQueryData<TicketData[]>(['profileTickets', userIdentifier], (prev = []) => {
        return prev.map((ticket) => {
          if (ticket.id === ticketId) {
            const optimisticMessage: TicketData['messages'][0] = {
              id: `temp-${Date.now()}`,
              text: message,
              from: 'user',
              timestamp: new Date().toISOString(),
            };
            return {
              ...ticket,
              messages: [...(ticket.messages || []), optimisticMessage],
              updatedAt: new Date().toISOString(),
            };
          }
          return ticket;
        });
      });
      
      return { previousTickets };
    },
    onSuccess: (updatedTicket) => {
      upsertTicket(updatedTicket);
      if (selectedTicketId === updatedTicket.id) {
        setSelectedTicketId(updatedTicket.id);
      }
    },
    onError: (error: unknown, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousTickets) {
        queryClient.setQueryData(['profileTickets', userIdentifier], context.previousTickets);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      const isNetworkError = errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch');
      
      addToast({
        type: 'error',
        title: 'Nachricht konnte nicht gesendet werden',
        message: isNetworkError 
          ? 'Verbindungsproblem. Bitte überprüfe deine Internetverbindung und versuche es erneut.'
          : errorMessage || 'Bitte versuche es erneut.',
        duration: 6000,
      });
      
      triggerHaptic('error');
    },
  });

  const markDoneMutation = useMutation({
    mutationFn: (ticketId: string) => updateTicketStatus(ticketId, 'done'),
    onMutate: async (ticketId) => {
      // Optimistic update: Update status immediately
      await queryClient.cancelQueries({ queryKey: ['profileTickets', userIdentifier] });
      const previousTickets = queryClient.getQueryData<TicketData[]>(['profileTickets', userIdentifier]);
      
      queryClient.setQueryData<TicketData[]>(['profileTickets', userIdentifier], (prev = []) => {
        return prev.map((ticket) => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              status: 'done' as const,
              updatedAt: new Date().toISOString(),
            };
          }
          return ticket;
        });
      });
      
      return { previousTickets };
    },
    onSuccess: (updatedTicket) => {
      upsertTicket(updatedTicket);
      addToast({
        type: 'success',
        title: 'Ticket geschlossen',
        message: 'Danke für dein Feedback – Ticket wurde als erledigt markiert.',
      });
    },
    onError: (error: unknown, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousTickets) {
        queryClient.setQueryData(['profileTickets', userIdentifier], context.previousTickets);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      const isNetworkError = errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch');
      
      addToast({
        type: 'error',
        title: 'Status konnte nicht aktualisiert werden',
        message: isNetworkError 
          ? 'Verbindungsproblem. Bitte überprüfe deine Internetverbindung und versuche es erneut.'
          : errorMessage || 'Bitte versuche es erneut.',
        duration: 6000,
      });
      
      triggerHaptic('error');
    },
  });

  const handleInlineSubmit = () => {
    // Trim and validate inputs
    const trimmedSubject = ticketSubject.trim();
    const trimmedDescription = ticketDescription.trim();
    const trimmedCategory = selectedCategory.trim();

    // Validate that all fields are filled after trimming
    if (!trimmedSubject || !trimmedDescription || !trimmedCategory || createTicketMutation.isPending) {
      if (!trimmedSubject) {
        addToast({
          type: 'error',
          title: 'Betreff fehlt',
          message: 'Bitte gib einen Betreff für dein Ticket ein.',
          duration: 4000,
        });
      } else if (!trimmedDescription) {
        addToast({
          type: 'error',
          title: 'Beschreibung fehlt',
          message: 'Bitte beschreibe dein Anliegen.',
          duration: 4000,
        });
      } else if (!trimmedCategory) {
        addToast({
          type: 'error',
          title: 'Kategorie fehlt',
          message: 'Bitte wähle eine Kategorie für dein Ticket.',
          duration: 4000,
        });
      }
      return;
    }

    // Normalize category and validate
    const normalizedCategory = normalizeCategory(trimmedCategory);
    if (!normalizedCategory || normalizedCategory === '') {
      addToast({
        type: 'error',
        title: 'Ungültige Kategorie',
        message: 'Bitte wähle eine gültige Kategorie.',
        duration: 4000,
      });
      return;
    }

    createTicketMutation.mutate({
      subject: trimmedSubject,
      description: trimmedDescription,
      category: normalizedCategory,
    });
  };

  const handleCreateTicket = (newTicket: TicketData) => {
    if (createTicketMutation.isPending) return;
    createTicketMutation.mutate({
      subject: newTicket.subject,
      description: newTicket.description,
      category: normalizeCategory(newTicket.category),
      priority: newTicket.priority,
    });
  };

  // Memoize handlers to avoid recreating on every render
  const handleSelectTicket = useCallback((ticket: TicketData) => {
    setSelectedTicketId(ticket.id);
  }, []);

  const handleCloseTicketDetail = useCallback(() => {
    setSelectedTicketId(null);
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!selectedTicketId || !message.trim()) return;
    await replyMutation.mutateAsync({ ticketId: selectedTicketId, message });
  }, [selectedTicketId, replyMutation]);

  const handleMarkDone = useCallback(async () => {
    if (!selectedTicketId) return;
    triggerHaptic('success');
    await markDoneMutation.mutateAsync(selectedTicketId);
  }, [selectedTicketId, markDoneMutation, triggerHaptic]);

  const handleRefresh = useCallback(async (retryAttempt = 0) => {
    if (!isOnline) {
      addToast({
        type: 'warning',
        title: 'Offline',
        message: 'Bitte überprüfe deine Internetverbindung.',
        duration: 3000
      });
      return;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    triggerHaptic('light');
    try {
      await ticketsQuery.refetch();
      triggerHaptic('success');
      addToast({
        type: 'success',
        title: 'Aktualisiert',
        message: 'Tickets wurden erfolgreich aktualisiert.',
        duration: 2000
      });
    } catch (error) {
      triggerHaptic('error');
      const newRetryAttempt = retryAttempt + 1;
      
      if (newRetryAttempt < 3) {
        // Auto-retry with exponential backoff
        const delay = Math.min(1000 * 2 ** newRetryAttempt, 5000);
        retryTimeoutRef.current = setTimeout(() => {
          handleRefresh(newRetryAttempt);
        }, delay);
      } else {
        addToast({
          type: 'error',
          title: 'Fehler',
          message: 'Tickets konnten nicht aktualisiert werden. Bitte versuche es später erneut.',
          duration: 5000
        });
      }
    }
  }, [ticketsQuery, triggerHaptic, addToast, isOnline]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleTicketExpand = useCallback((ticketId: string) => {
    triggerHaptic('light');
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  }, [expandedTicket, triggerHaptic]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'waiting': return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'in_progress': return <MessageCircle className="w-4 h-4 text-purple-400" />;
      case 'done': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Removed duplicate functions - using memoized versions above

  const GuidanceBanner = () => (
    <div className="p-4 bg-slate-800/40 border border-slate-600/40 rounded-2xl">
      <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
        <MessageCircle className="w-4 h-4 text-purple-300" />
        Ticket-Sync
      </div>
      {canReplyViaTelegram ? (
        <div className="space-y-2 text-xs text-gray-300">
          <p>
            Du bist {userRank || 'VIP'} – du kannst Tickets zusätzlich direkt im Telegram-Bot beantworten.
          </p>
          <div className="font-mono text-purple-200 bg-slate-900/60 rounded-xl px-3 py-2 border border-purple-500/20">
            /reply &lt;TicketID&gt; Deine Nachricht
            <br />
            /vipreply &lt;TicketID&gt; deine VIP-Antwort
          </div>
          <p className="text-[11px] text-gray-400">
            Antworten erscheinen sofort hier im Tab und im Bot.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-300">
          Antworten erfolgen ausschließlich hier in der WebApp. Der Telegram-Bot informiert dich nur über neue Nachrichten.
        </p>
      )}
    </div>
  );

  // Keyboard navigation for tickets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape closes modals
      if (e.key === 'Escape') {
        if (selectedTicketId) {
          handleCloseTicketDetail();
        } else if (showCreateModal) {
          setShowCreateModal(false);
        }
        return;
      }

      // '/' focuses search
      if (e.key === '/' && !showCreateModal && !selectedTicketId) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      // 'n' or 'c' creates new ticket
      if ((e.key === 'n' || e.key === 'c') && (e.metaKey || e.ctrlKey) && !showCreateModal) {
        e.preventDefault();
        setShowCreateModal(true);
        return;
      }

      // Arrow keys navigate tickets (when no modal is open)
      if (!showCreateModal && !selectedTicketId && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        const currentIndex = expandedTicket 
          ? visibleTickets.findIndex(t => t.id === expandedTicket)
          : -1;

        let nextIndex: number;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < visibleTickets.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : visibleTickets.length - 1;
        }

        if (visibleTickets[nextIndex]) {
          handleTicketExpand(visibleTickets[nextIndex].id);
          // Scroll into view
          setTimeout(() => {
            const element = document.querySelector(`[data-ticket-id="${visibleTickets[nextIndex].id}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicketId, showCreateModal, expandedTicket, visibleTickets, handleTicketExpand, handleCloseTicketDetail]);

  const isInitialLoading = ticketsQuery.isLoading && tickets.length === 0 && !ticketsQuery.isError;
  const isEmptyState = !ticketsQuery.isLoading && !ticketsQuery.isError && tickets.length === 0;
  // Only show error if query failed AND we have no cached data AND it's not a 404 (which means no tickets)
  const hasError = ticketsQuery.isError && tickets.length === 0 && ticketsQuery.error && 
    !(ticketsQuery.error instanceof Error && ticketsQuery.error.message.toLowerCase().includes('404'));

  // Show error state only for real errors (not 404s which mean no tickets)
  if (hasError && ticketsQuery.isFetching === false) {
    const error = ticketsQuery.error;
    const isNetworkError = error instanceof Error && (
      error.message.toLowerCase().includes('network') || 
      error.message.toLowerCase().includes('fetch') ||
      error.message.toLowerCase().includes('failed to fetch') ||
      error.message.toLowerCase().includes('timeout')
    );
    
    return (
      <div className="space-y-6" role="tabpanel" id="panel-tickets" aria-labelledby="tab-tickets">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <AlertCircle className="w-8 h-8 text-red-400" />
          </motion.div>
          <h2 className="text-xl font-semibold text-red-200 mb-2">Tickets konnten nicht geladen werden</h2>
          <p className="text-red-100 mb-4">
            {isNetworkError 
              ? 'Verbindungsproblem erkannt. Bitte überprüfe deine Internetverbindung.'
              : 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.'}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                triggerHaptic('light');
                try {
                  await ticketsQuery.refetch();
                  triggerHaptic('success');
                } catch (err) {
                  triggerHaptic('error');
                }
              }}
              disabled={ticketsQuery.isFetching}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {ticketsQuery.isFetching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lädt...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Erneut versuchen
                </>
              )}
            </motion.button>
            {isNetworkError && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  triggerHaptic('light');
                  window.location.reload();
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
              >
                Seite neu laden
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6" role="tabpanel" id="panel-tickets" aria-labelledby="tab-tickets"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
            <p className="text-gray-400 text-sm mt-1">Lade deine Tickets...</p>
          </div>
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 bg-slate-800/50 rounded-2xl border border-slate-600/30 animate-pulse" />
          ))}
        </div>
      </motion.div>
    );
  }

  if (isEmptyState) {
    return (
      <div className="space-y-6" role="tabpanel" id="panel-tickets" aria-labelledby="tab-tickets">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
            <p className="text-gray-400 text-sm mt-1">Erstelle und verwalte deine Support-Anfragen</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Neues Ticket
          </button>
        </div>

        <GuidanceBanner />

        {/* Quick Create Form - Direct Integration */}
        <div className="p-6 bg-slate-800/30 rounded-2xl border border-slate-600/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-400" />
            Neues Ticket erstellen
          </h3>
          
          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">Kategorie wählen *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                      selectedCategory === category.id
                        ? 'border-purple-500/40 bg-purple-500/10'
                        : 'border-slate-600/30 bg-slate-700/30 hover:border-slate-500/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{category.icon}</div>
                    <div className="text-sm font-medium text-white">{category.name}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Betreff *</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Kurze Beschreibung deines Anliegens"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white placeholder-gray-400 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Beschreibung *</label>
              <textarea
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="Beschreibe dein Anliegen so detailliert wie möglich..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white placeholder-gray-400 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
              />
            </div>

            {/* Anonymous Notice */}
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Lock className="w-4 h-4" />
                <span className="font-medium">100% Anonym</span>
              </div>
              <p className="text-green-300 text-sm mt-1">
                Du musst keine persönlichen Daten angeben. Alle Tickets werden anonym verwaltet.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInlineSubmit}
                disabled={
                  !ticketSubject?.trim() || 
                  !ticketDescription?.trim() || 
                  !selectedCategory?.trim() || 
                  createTicketMutation.isPending
                }
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {createTicketMutation.isPending ? 'Wird erstellt...' : 'Ticket erstellen'}
              </motion.button>
              <button
                onClick={() => {
                  setTicketSubject('');
                  setTicketDescription('');
                  setSelectedCategory('');
                }}
                className="px-6 py-3 bg-slate-700/50 text-gray-300 rounded-xl font-semibold hover:bg-slate-600/50 transition-all duration-200"
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30"
          >
            <Ticket className="w-10 h-10 text-purple-400" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">Noch keine Tickets</h3>
          <p className="text-gray-400 mb-6">Erstelle dein erstes Support-Ticket mit dem Formular oben</p>
          <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500">
            <span className="px-3 py-1 bg-slate-800/50 rounded-full">100% Anonym</span>
            <span className="px-3 py-1 bg-slate-800/50 rounded-full">Schnelle Antwort</span>
            <span className="px-3 py-1 bg-slate-800/50 rounded-full">24/7 Support</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={() => handleRefresh(0)}>
      <div className="space-y-6" role="tabpanel" id="panel-tickets" aria-labelledby="tab-tickets">
        {/* Sticky Header for Mobile */}
        <div
          ref={headerRef}
          className={cn(
            "space-y-4",
            isMobile && "sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl pb-4 border-b border-slate-700/50"
          )}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between",
            isMobile && "gap-2"
          )}>
            <div className="flex-1 min-w-0">
              <h2 className={cn(
                "font-bold text-white",
                isMobile ? "text-xl" : "text-2xl"
              )}>Meine Tickets</h2>
              <div className={cn(
                "flex items-center gap-2 flex-wrap",
                isMobile ? "text-xs mt-0.5" : "text-sm mt-1"
              )}>
                <p className="text-gray-400">{tickets.length} Tickets gesamt</p>
                {debouncedSearch && (
                  <span className="text-gray-500">
                    • {visibleTickets.length} Treffer
                  </span>
                )}
                {ticketRealtime.isConnected ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <div className={cn(isMobile ? "w-2 h-2" : "w-2.5 h-2.5", "rounded-full bg-green-400 animate-pulse")} />
                    <span className={cn(isMobile && "text-[10px]", "text-xs")}>Live</span>
                  </div>
                ) : ticketsQuery.isFetching ? (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Loader2 className={cn(isMobile ? "w-2.5 h-2.5" : "w-3 h-3", "animate-spin")} />
                    <span className={cn(isMobile && "text-[10px]")}>Sync...</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isSelectionMode && selectedTickets.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg"
                >
                  <span className="text-sm text-purple-300 font-medium">
                    {selectedTickets.size} ausgewählt
                  </span>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedTickets(new Set());
                      setIsSelectionMode(false);
                    }}
                    className="p-1 rounded hover:bg-purple-500/20 transition-colors touch-target"
                  >
                    <X className="w-4 h-4 text-purple-300" />
                  </button>
                </motion.div>
              )}
              {!isSelectionMode && visibleTickets.length > 0 && (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsSelectionMode(true);
                  }}
                  className={cn(
                    "flex items-center gap-2 bg-slate-700/50 border border-slate-600/30 text-gray-300 rounded-xl font-medium hover:bg-slate-600/50 transition-all duration-200 touch-target",
                    isMobile ? "px-3 py-2 text-sm" : "px-4 py-2"
                  )}
                  aria-label="Auswahlmodus aktivieren"
                >
                  <CheckCircle className={cn(isMobile ? "w-4 h-4" : "w-4 h-4")} />
                  {!isMobile && "Auswählen"}
                </button>
              )}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setShowCreateModal(true);
                }}
                className={cn(
                  "flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 touch-target",
                  isMobile ? "px-3 py-2 text-sm" : "px-4 py-2"
                )}
              >
                <Plus className={cn(isMobile ? "w-4 h-4" : "w-4 h-4")} />
                {!isMobile && "Neues Ticket"}
              </button>
            </div>
          </div>
          
          {/* Bulk Actions Bar */}
          {isSelectionMode && selectedTickets.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-purple-600/20 border border-purple-500/30 rounded-xl"
            >
              <span className="text-sm text-purple-300 font-medium flex-1">
                {selectedTickets.size} Ticket{selectedTickets.size > 1 ? 's' : ''} ausgewählt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    triggerHaptic('medium');
                    for (const ticketId of selectedTickets) {
                      try {
                        await updateTicketStatus(ticketId, 'done');
                      } catch (error) {
                        console.error('Failed to mark ticket as done:', error);
                      }
                    }
                    setSelectedTickets(new Set());
                    setIsSelectionMode(false);
                    addToast({
                      type: 'success',
                      title: 'Erfolg',
                      message: `${selectedTickets.size} Ticket(s) als erledigt markiert`,
                      duration: 3000
                    });
                  }}
                  className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-sm text-green-300 font-medium transition-colors touch-target"
                  aria-label={`${selectedTickets.size} Ticket(s) als erledigt markieren`}
                >
                  Als erledigt markieren
                </button>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedTickets(new Set());
                    setIsSelectionMode(false);
                  }}
                  className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/30 rounded-lg text-sm text-gray-300 font-medium transition-colors touch-target"
                  aria-label="Auswahl abbrechen"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          )}

          <GuidanceBanner />

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isMobile ? "Suchen..." : "Nach Ticket-ID, Betreff oder Status suchen..."}
                className={cn(
                  "w-full pl-10 pr-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-gray-200 placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/10 touch-target",
                  isMobile ? "py-2.5 text-sm" : "py-2.5 text-sm"
                )}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowFilters(!showFilters);
                }}
                className={cn(
                  "px-3 py-2 bg-slate-800/60 border rounded-xl text-gray-200 hover:border-purple-500/40 transition-colors touch-target",
                  isMobile ? "border-slate-700/60" : "border-slate-700/60",
                  showFilters && "border-purple-500/50 bg-purple-500/10"
                )}
              >
                <SlidersHorizontal className={cn(isMobile ? "w-4 h-4" : "w-4 h-4")} />
              </button>
              <button
                onClick={handleRefresh}
                disabled={ticketsQuery.isFetching}
                className={cn(
                  "px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-gray-200 hover:border-purple-500/40 transition-colors disabled:opacity-60 flex items-center gap-2 justify-center touch-target",
                  isMobile ? "text-sm" : "text-sm"
                )}
              >
                {ticketsQuery.isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'open', label: 'Offen', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Clock },
              { value: 'in_progress', label: 'In Bearbeitung', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Zap },
              { value: 'waiting', label: 'Wartet', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: AlertCircle },
              { value: 'done', label: 'Erledigt', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle },
            ].map((status) => {
              const StatusIcon = status.icon;
              const count = tickets.filter(t => t.status === status.value).length;
              const isActive = statusFilter === status.value;
              
              return (
                <motion.button
                  key={status.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic('light');
                    setStatusFilter(statusFilter === status.value ? null : status.value);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all touch-target flex items-center gap-1.5",
                    isActive
                      ? `${status.color} border-opacity-50 shadow-lg ring-2 ring-offset-2 ring-offset-slate-900 ring-purple-500/50`
                      : "bg-slate-700/30 text-gray-300 border-slate-600/30 hover:bg-slate-700/50"
                  )}
                  aria-label={`Filter nach Status: ${status.label}`}
                  aria-pressed={isActive}
                >
                  <StatusIcon className={cn("w-3 h-3", isActive && "opacity-80")} />
                  <span>{status.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                      isActive ? "bg-white/20" : "bg-slate-600/50"
                    )}>
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
            {[
              { value: 'high', label: 'Hoch', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: TrendingUp },
              { value: 'critical', label: 'Kritisch', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Zap },
            ].map((priority) => {
              const PriorityIcon = priority.icon;
              const count = tickets.filter(t => t.priority === priority.value).length;
              const isActive = priorityFilter === priority.value;
              
              return (
                <motion.button
                  key={priority.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic('light');
                    setPriorityFilter(priorityFilter === priority.value ? null : priority.value);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all touch-target flex items-center gap-1.5",
                    isActive
                      ? `${priority.color} border-opacity-50 shadow-lg ring-2 ring-offset-2 ring-offset-slate-900 ring-purple-500/50`
                      : "bg-slate-700/30 text-gray-300 border-slate-600/30 hover:bg-slate-700/50"
                  )}
                  aria-label={`Filter nach Priorität: ${priority.label}`}
                  aria-pressed={isActive}
                >
                  <PriorityIcon className={cn("w-3 h-3", isActive && "opacity-80")} />
                  <span>{priority.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                      isActive ? "bg-white/20" : "bg-slate-600/50"
                    )}>
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40 space-y-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-white">Erweiterte Filter</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Status</label>
                    <select
                      value={statusFilter || ''}
                      onChange={(e) => {
                        triggerHaptic('light');
                        setStatusFilter(e.target.value || null);
                      }}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-sm text-white focus:border-purple-500/50 focus:outline-none touch-target"
                    >
                      <option value="">Alle</option>
                      <option value="open">Offen</option>
                      <option value="in_progress">In Bearbeitung</option>
                      <option value="waiting">Wartet</option>
                      <option value="done">Erledigt</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Priorität</label>
                    <select
                      value={priorityFilter || ''}
                      onChange={(e) => {
                        triggerHaptic('light');
                        setPriorityFilter(e.target.value || null);
                      }}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-sm text-white focus:border-purple-500/50 focus:outline-none touch-target"
                    >
                      <option value="">Alle</option>
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                      <option value="critical">Kritisch</option>
                    </select>
                  </div>
                </div>
                {(statusFilter || priorityFilter) && (
                  <button
                    onClick={() => {
                      setStatusFilter(null);
                      setPriorityFilter(null);
                      triggerHaptic('light');
                    }}
                    className="w-full px-3 py-2 bg-slate-700/50 text-gray-300 rounded-lg text-sm hover:bg-slate-600/50 transition-colors touch-target"
                  >
                    Filter zurücksetzen
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {visibleTickets.length === 0 && tickets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-slate-800/40 border border-slate-700/40 rounded-xl text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-purple-500/10 rounded-full">
                <Search className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-gray-300">
                {debouncedSearch || statusFilter || priorityFilter
                  ? 'Keine Tickets gefunden'
                  : 'Keine Tickets vorhanden'}
              </p>
              <p className="text-xs text-gray-400">
                {debouncedSearch || statusFilter || priorityFilter
                  ? 'Versuche andere Filter oder Suchbegriffe'
                  : 'Erstelle dein erstes Ticket mit dem Button oben'}
              </p>
              {(statusFilter || priorityFilter) && (
                <button
                  onClick={() => {
                    setStatusFilter(null);
                    setPriorityFilter(null);
                    setSearchQuery('');
                    triggerHaptic('light');
                  }}
                  className="mt-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-sm text-purple-300 transition-colors touch-target"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Tickets List - Responsive Grid */}
        <div className={cn(
          "space-y-3",
          isMobile ? "space-y-3" : "space-y-4"
        )}>
          <AnimatePresence mode="popLayout">
            {visibleTickets.length > 0 ? (
              visibleTickets.map((ticket, index) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  isExpanded={expandedTicket === ticket.id}
                  onExpand={() => handleTicketExpand(ticket.id)}
                  onSelect={() => handleSelectTicket(ticket)}
                  onMarkDone={ticket.status !== 'done' ? () => {
                    setSelectedTicketId(ticket.id);
                    handleMarkDone();
                  } : undefined}
                  formatDate={formatDate}
                  formatCategoryLabel={formatCategoryLabel}
                  getCategoryIcon={getCategoryIcon}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  getPriorityColor={getPriorityColor}
                  getPriorityText={getPriorityText}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedTickets.has(ticket.id)}
                  onToggleSelection={() => {
                    triggerHaptic('light');
                    setSelectedTickets(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(ticket.id)) {
                        newSet.delete(ticket.id);
                      } else {
                        newSet.add(ticket.id);
                      }
                      return newSet;
                    });
                  }}
                />
              ))
            ) : tickets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-12 bg-slate-800/40 border border-slate-700/40 rounded-xl text-center"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 bg-purple-500/10 rounded-full">
                    <Ticket className="w-12 h-12 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Noch keine Tickets</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Erstelle dein erstes Support-Ticket und wir helfen dir gerne weiter!
                    </p>
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        setShowCreateModal(true);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all touch-target"
                    >
                      <Plus className="inline w-4 h-4 mr-2" />
                      Erstes Ticket erstellen
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Enhanced Analytics Dashboard - Hidden on Mobile for better performance */}
        {!isMobile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Analytics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Ticket Analytics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-500/20"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">{tickets.length}</div>
                      <div className="text-sm text-blue-300">Gesamt Tickets</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      {(() => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        const recentTickets = tickets.filter(t => new Date(t.createdAt) > weekAgo);
                        return `+${recentTickets.length} diese Woche`;
                      })()}
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-gradient-to-br from-yellow-900/20 to-amber-900/20 rounded-xl border border-yellow-500/20"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {tickets.filter(t => t.status === 'open').length}
                      </div>
                      <div className="text-sm text-yellow-300">Offen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Benötigt Aufmerksamkeit</span>
                  </div>
                </motion.div>
              </div>

              {/* Response Time Analytics */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-400" />
                  Response Zeit
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const doneTickets = tickets.filter(t => t.status === 'done');
                    const responseTimes = doneTickets.map(ticket => {
                      const createdAt = new Date(ticket.createdAt);
                      const updatedAt = new Date(ticket.updatedAt);
                      return (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // hours
                    });
                    
                    const avgTime = responseTimes.length > 0 
                      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
                      : '0';
                    const minTime = responseTimes.length > 0 
                      ? Math.min(...responseTimes).toFixed(1)
                      : '0';
                    const maxTime = responseTimes.length > 0 
                      ? Math.max(...responseTimes).toFixed(1)
                      : '0';
                    
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">Durchschnitt</span>
                          <span className="text-sm font-bold text-white">{avgTime}h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">Schnellste</span>
                          <span className="text-sm font-bold text-green-400">{minTime}h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">Längste</span>
                          <span className="text-sm font-bold text-yellow-400">{maxTime}h</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Quick Actions & Tips */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Quick Actions & Tips
              </h3>

              {/* Quick Actions */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Schnellaktionen
                </h4>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic('medium');
                      setShowCreateModal(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-500/20 hover:border-green-500/40 transition-all touch-target"
                  >
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Plus className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">Neues Ticket</p>
                      <p className="text-xs text-green-300">Support-Anfrage erstellen</p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      triggerHaptic('light');
                      // Scroll to top and focus search
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setTimeout(() => {
                        const searchInput = document.querySelector('input[type="text"][placeholder*="Suchen"]') as HTMLInputElement;
                        if (searchInput) {
                          searchInput.focus();
                          searchInput.value = '';
                          setSearchQuery('');
                        }
                      }, 300);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-all touch-target"
                  >
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">Suche fokussieren</p>
                      <p className="text-xs text-blue-300">Zur Suchleiste springen</p>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Support Tips */}
              <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
                <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Support Tipps
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2" />
                    <p className="text-sm text-gray-300">Beschreibe dein Problem so detailliert wie möglich</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                    <p className="text-sm text-gray-300">Füge Screenshots oder Fehlermeldungen hinzu</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                    <p className="text-sm text-gray-300">Wähle die richtige Kategorie für schnellere Hilfe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Ticket Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                triggerHaptic('light');
                setShowCreateModal(false);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "w-full max-h-[90vh] overflow-y-auto bg-slate-900 rounded-2xl border border-slate-600/30 shadow-2xl",
                  isMobile ? "max-w-full rounded-t-3xl" : "max-w-2xl"
                )}
              >
                <div className={cn(isMobile ? "p-4" : "p-6")}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={cn(
                      "font-bold text-white",
                      isMobile ? "text-lg" : "text-xl"
                    )}>Neues Ticket erstellen</h3>
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setShowCreateModal(false);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors touch-target"
                    >
                      <X className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
                    </button>
                  </div>
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                  }>
                    <TicketCreate
                      onSubmit={handleCreateTicket}
                      onCancel={() => {
                        triggerHaptic('light');
                        setShowCreateModal(false);
                      }}
                      sessionId={sessionId}
                    />
                  </Suspense>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticket Detail Modal */}
        <AnimatePresence>
          {selectedTicket && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                triggerHaptic('light');
                handleCloseTicketDetail();
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "w-full max-h-[90vh] overflow-hidden bg-slate-900 rounded-2xl border border-slate-600/30 shadow-2xl flex flex-col",
                  isMobile ? "max-w-full rounded-t-3xl h-[95vh]" : "max-w-4xl"
                )}
              >
                <Suspense fallback={
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  </div>
                }>
                  <TicketDetail
                    ticket={selectedTicket}
                    onBack={handleCloseTicketDetail}
                    onSendMessage={handleSendMessage}
                    onMarkDone={handleMarkDone}
                  />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PullToRefresh>
  );
});

TicketsSectionContent.displayName = 'TicketsSectionContent';

export const TicketsSection = TicketsSectionContent;
TicketsSection.displayName = 'TicketsSection';
