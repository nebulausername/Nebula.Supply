import { useEffect, useRef, memo, useState, useCallback } from 'react';
import { TicketCard } from './TicketCard';
import { TicketLoadingSkeleton } from './TicketLoadingSkeleton';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useInfiniteTickets } from '../../hooks/useInfiniteTickets';
import type { Ticket } from '@nebula/shared/types';
import type { TicketFilters } from './types';
import { cn } from '../../utils/cn';

interface InfiniteTicketListProps {
  filters: TicketFilters;
  selectedTicketId: string | null;
  selectedTicketIds: Set<string>;
  onTicketClick: (ticketId: string) => void;
  onBulkSelect: (ticketId: string, selected: boolean) => void;
}

// Simple intersection observer hook
function useInView(options?: { threshold?: number; rootMargin?: string }) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: options?.threshold || 0.1,
        rootMargin: options?.rootMargin || '100px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options?.threshold, options?.rootMargin]);

  return { ref, inView: isInView };
}

export const InfiniteTicketList = memo(function InfiniteTicketList({
  filters,
  selectedTicketId,
  selectedTicketIds,
  onTicketClick,
  onBulkSelect,
}: InfiniteTicketListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteTickets({ filters });

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Fetch next page when scrolled to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages into a single array
  const tickets: Ticket[] = data?.pages.flatMap((page) => page.data) ?? [];

  const handleTicketClick = useCallback(
    (ticketId: string) => {
      onTicketClick(ticketId);
    },
    [onTicketClick]
  );

  const handleBulkSelect = useCallback(
    (ticketId: string, selected: boolean) => {
      onBulkSelect(ticketId, selected);
    },
    [onBulkSelect]
  );

  if (isLoading && tickets.length === 0) {
    return <TicketLoadingSkeleton count={10} variant="list" />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Error loading tickets</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="p-8 text-center text-muted">
        <p>No tickets found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => {
        const isSelected = selectedTicketIds.has(ticket.id);
        const isActive = selectedTicketId === ticket.id;

        return (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            isSelected={isSelected}
            isActive={isActive}
            onClick={() => handleTicketClick(ticket.id)}
            onSelect={(selected) => handleBulkSelect(ticket.id, selected)}
          />
        );
      })}

      {/* Infinite scroll trigger */}
      <div ref={ref} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-muted">
            <LoadingSpinner size="sm" />
            <span className="text-sm">Loading more tickets...</span>
          </div>
        )}
        {!hasNextPage && tickets.length > 0 && (
          <p className="text-sm text-muted">No more tickets to load</p>
        )}
      </div>
    </div>
  );
});
