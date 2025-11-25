import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchUserTickets } from '../api/tickets';
import type { TicketData } from '../components/support/types';

type UseTicketSyncOptions = {
  userId?: string;
  enabled?: boolean;
  intervalMs?: number;
};

export const useTicketSync = ({ userId, enabled = true, intervalMs = 15000 }: UseTicketSyncOptions) => {
  const queryClient = useQueryClient();
  const isSyncingRef = useRef(false);
  const lastSyncTimeRef = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef<boolean>(true);

  // Track page visibility to adjust sync interval
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    let isMounted = true;

    // Debounced sync function with intelligent interval adjustment
    const syncTickets = async () => {
      if (!isMounted || isSyncingRef.current) return;
      
      // Skip sync if page is not visible (background tab)
      if (!isPageVisibleRef.current) {
        return;
      }
      
      // Debounce: Don't sync if last sync was less than 5 seconds ago
      const timeSinceLastSync = Date.now() - lastSyncTimeRef.current;
      if (timeSinceLastSync < 5000) {
        return;
      }
      
      isSyncingRef.current = true;
      try {
        const tickets = await fetchUserTickets({ userId });
        // Update query data if component is still mounted
        // React Query will handle deduplication and only trigger re-renders if data actually changed
        if (isMounted) {
          queryClient.setQueryData<TicketData[]>(['profileTickets', userId], tickets);
          lastSyncTimeRef.current = Date.now();
        }
      } catch (error) {
        // Silently handle errors - don't spam console in production
        // Only log in dev mode for debugging
        if (import.meta.env.DEV && error instanceof Error) {
          const errorMessage = error.message || 'Unknown error';
          // Don't log network errors or 404s as they're expected in some cases
          if (!errorMessage.includes('fetch') && !errorMessage.includes('404')) {
            console.warn('[TicketSync] Failed to refresh tickets', {
              userId,
              error: errorMessage
            });
          }
        }
      } finally {
        if (isMounted) {
          isSyncingRef.current = false;
        }
      }
    };

    // Initial sync
    syncTickets();
    
    // Adaptive interval: Use longer interval when page is not visible
    const scheduleNextSync = () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      const adaptiveInterval = isPageVisibleRef.current ? intervalMs : intervalMs * 3;
      syncTimeoutRef.current = setTimeout(() => {
        syncTickets();
        scheduleNextSync();
      }, adaptiveInterval);
    };
    
    scheduleNextSync();

    return () => {
      isMounted = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [enabled, intervalMs, queryClient, userId]);
};

