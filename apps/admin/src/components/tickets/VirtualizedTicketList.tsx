import { memo, useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TicketCard } from './TicketCard';
import { useMobile } from '../../hooks/useMobile';
import type { Ticket } from '@nebula/shared/types';
import { cn } from '../../utils/cn';

interface VirtualizedTicketListProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  selectedTicketIds: Set<string>;
  onTicketClick: (ticketId: string) => void;
  onBulkSelect: (ticketId: string, selected: boolean) => void;
  height?: number;
}

// Simple virtual scrolling implementation without external library
export const VirtualizedTicketList = memo(function VirtualizedTicketList({
  tickets,
  selectedTicketId,
  selectedTicketIds,
  onTicketClick,
  onBulkSelect,
  height = 600,
}: VirtualizedTicketListProps) {
  const { isMobile } = useMobile();
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = isMobile ? 180 : 140;

  // Calculate visible items based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
      const end = Math.min(
        tickets.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
      );
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [tickets.length, itemHeight]);

  const visibleTickets = useMemo(() => {
    return tickets.slice(visibleRange.start, visibleRange.end);
  }, [tickets, visibleRange]);

  if (tickets.length === 0) {
    return null;
  }

  // For mobile or small lists, use regular rendering
  if (isMobile || tickets.length < 50) {
    return (
      <div className="space-y-3">
        {tickets.map((ticket) => {
          const isSelected = selectedTicketIds.has(ticket.id);
          const isActive = selectedTicketId === ticket.id;
          return (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isSelected={isSelected}
              isActive={isActive}
              onClick={() => onTicketClick(ticket.id)}
              onSelect={(selected) => onBulkSelect(ticket.id, selected)}
            />
          );
        })}
      </div>
    );
  }

  // Virtual scrolling for large lists
  const totalHeight = tickets.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className="w-full overflow-auto"
      style={{ height }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleTickets.map((ticket, index) => {
            const actualIndex = visibleRange.start + index;
            const isSelected = selectedTicketIds.has(ticket.id);
            const isActive = selectedTicketId === ticket.id;
            return (
              <div key={ticket.id} style={{ height: itemHeight }}>
                <div className="px-2 py-1">
                  <TicketCard
                    ticket={ticket}
                    isSelected={isSelected}
                    isActive={isActive}
                    onClick={() => onTicketClick(ticket.id)}
                    onSelect={(selected) => onBulkSelect(ticket.id, selected)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

