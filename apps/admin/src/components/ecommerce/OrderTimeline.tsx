import React from 'react';
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  MessageSquare,
  CreditCard,
  AlertCircle,
  User
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface OrderEvent {
  id: string;
  type: 'status_changed' | 'payment_confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'note_added' | 'tracking_updated';
  title: string;
  description: string;
  status?: string;
  oldStatus?: string;
  newStatus?: string;
  trackingNumber?: string;
  carrier?: string;
  author?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface OrderTimelineProps {
  events: OrderEvent[];
  className?: string;
  showTimestamps?: boolean;
  compact?: boolean;
}

const eventIcons = {
  status_changed: Package,
  payment_confirmed: CreditCard,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: RefreshCw,
  note_added: MessageSquare,
  tracking_updated: Truck
};

const eventColors = {
  status_changed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  payment_confirmed: 'text-green-400 bg-green-400/10 border-green-400/20',
  shipped: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  delivered: 'text-green-400 bg-green-400/10 border-green-400/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
  refunded: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  note_added: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  tracking_updated: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
};

export function OrderTimeline({ 
  events, 
  className, 
  showTimestamps = true, 
  compact = false 
}: OrderTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted', className)}>
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No timeline events yet</p>
      </div>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className={cn('space-y-4', className)}>
      {sortedEvents.map((event, index) => {
        const Icon = eventIcons[event.type] || Clock;
        const colorClass = eventColors[event.type] || eventColors.note_added;
        const isLast = index === sortedEvents.length - 1;

        return (
          <div key={event.id} className="relative">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-700" />
            )}

            <div className="flex gap-3">
              {/* Icon */}
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center',
                colorClass
              )}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className={cn('flex-1 min-w-0', compact && 'pb-2')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text">
                      {event.title}
                    </h4>
                    <p className="text-sm text-muted mt-1">
                      {event.description}
                    </p>

                    {/* Additional details based on event type */}
                    {event.type === 'status_changed' && event.oldStatus && event.newStatus && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-800 rounded text-gray-400">
                          {event.oldStatus}
                        </span>
                        <span className="text-muted">→</span>
                        <span className="px-2 py-1 bg-blue-500/20 rounded text-blue-400">
                          {event.newStatus}
                        </span>
                      </div>
                    )}

                    {event.type === 'tracking_updated' && event.trackingNumber && (
                      <div className="mt-2 text-xs">
                        <span className="text-muted">Tracking: </span>
                        <span className="font-mono text-cyan-400">
                          {event.trackingNumber}
                        </span>
                        {event.carrier && (
                          <span className="text-muted ml-2">via {event.carrier}</span>
                        )}
                      </div>
                    )}

                    {event.type === 'note_added' && event.metadata?.isInternal && (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                          <User className="w-3 h-3" />
                          Internal Note
                        </span>
                      </div>
                    )}

                    {event.author && (
                      <div className="mt-1 text-xs text-muted">
                        by {event.author}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  {showTimestamps && (
                    <div className="flex-shrink-0 text-xs text-muted">
                      {formatTimestamp(event.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Compact timeline for small spaces
export function OrderTimelineCompact({ 
  events, 
  className 
}: { 
  events: OrderEvent[]; 
  className?: string; 
}) {
  if (!events || events.length === 0) {
    return null;
  }

  const latestEvent = events.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  const Icon = eventIcons[latestEvent.type] || Clock;
  const colorClass = eventColors[latestEvent.type] || eventColors.note_added;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'w-6 h-6 rounded-full border flex items-center justify-center',
        colorClass
      )}>
        <Icon className="w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">
          {latestEvent.title}
        </p>
        <p className="text-xs text-muted">
          {formatTimestamp(latestEvent.timestamp)}
        </p>
      </div>
    </div>
  );
}

// Timeline summary with counts
export function OrderTimelineSummary({ 
  events, 
  className 
}: { 
  events: OrderEvent[]; 
  className?: string; 
}) {
  const eventCounts = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const eventTypes = Object.keys(eventCounts) as Array<keyof typeof eventIcons>;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {eventTypes.map((type) => {
        const Icon = eventIcons[type];
        const colorClass = eventColors[type] || eventColors.note_added;
        const count = eventCounts[type];

        return (
          <div
            key={type}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              colorClass
            )}
          >
            <Icon className="w-3 h-3" />
            <span>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// Helper function to format timestamps
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

































































