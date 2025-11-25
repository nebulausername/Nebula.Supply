import { memo, useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Timeline, type TimelineItem } from '../Timeline';
import { VirtualList } from '../ui/VirtualList';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Search, Filter, X } from 'lucide-react';
import { timeline } from '../../data/kpis';
import { useLiveUpdates } from '../../lib/store/dashboard';
import { useRealtimeTickets } from '../../lib/websocket/useRealtimeTickets';
import { useRealtimeKPIs } from '../../lib/websocket/useRealtimeKPIs';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';

export const ActivityFeed = memo(function ActivityFeed() {
  const timelineTyped = useMemo(() => timeline as TimelineItem[], []);
  const { liveUpdates } = useLiveUpdates();
  const [activities, setActivities] = useState<TimelineItem[]>(timelineTyped);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Memoized callbacks for ticket events
  const handleTicketCreated = useCallback((event: any) => {
    setActivities(prev => [{
      id: `ticket-${event.ticketId}`,
      title: 'New Ticket Created',
      description: `Ticket ${event.ticketId} was created`,
      timestamp: new Date(event.timestamp).toISOString(),
      type: 'ticket',
      status: 'info'
    }, ...prev.slice(0, 19)]);
    logger.info('Activity feed: New ticket created', { ticketId: event.ticketId });
  }, []);

  const handleTicketEscalated = useCallback((event: any) => {
    setActivities(prev => [{
      id: `ticket-escalated-${event.ticketId}`,
      title: 'Ticket Escalated',
      description: `Ticket ${event.ticketId} was escalated`,
      timestamp: new Date(event.timestamp).toISOString(),
      type: 'escalation',
      status: 'warning'
    }, ...prev.slice(0, 19)]);
    logger.info('Activity feed: Ticket escalated', { ticketId: event.ticketId });
  }, []);

  const handleTicketResolved = useCallback((event: any) => {
    setActivities(prev => [{
      id: `ticket-resolved-${event.ticketId}`,
      title: 'Ticket Resolved',
      description: `Ticket ${event.ticketId} was resolved`,
      timestamp: new Date(event.timestamp).toISOString(),
      type: 'success',
      status: 'success'
    }, ...prev.slice(0, 19)]);
    logger.info('Activity feed: Ticket resolved', { ticketId: event.ticketId });
  }, []);
  
  // Real-time ticket events
  useRealtimeTickets({
    enabled: liveUpdates,
    onCreated: handleTicketCreated,
    onEscalated: handleTicketEscalated,
    onResolved: handleTicketResolved
  });

  // Memoized callback for KPI updates
  const handleKPIUpdate = useCallback((event: any) => {
    if (event.type === 'kpi:stats_changed') {
      setActivities(prev => [{
        id: `kpi-update-${Date.now()}`,
        title: 'Metrics Updated',
        description: 'Dashboard metrics were updated',
        timestamp: new Date(event.timestamp).toISOString(),
        type: 'update',
        status: 'info'
      }, ...prev.slice(0, 19)]);
    }
  }, []);

  // Real-time KPI updates
  const { isConnected } = useRealtimeKPIs({
    enabled: liveUpdates,
    onUpdated: handleKPIUpdate
  });

  // Filter activities based on search query and filter type
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => {
        const itemType = item.type || item.status || 'info';
        return itemType === filterType;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const title = (item.title || item.text || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return title.includes(query) || description.includes(query);
      });
    }

    return filtered;
  }, [activities, filterType, searchQuery]);

  // Use virtual scrolling for >50 items
  const shouldUseVirtualScrolling = filteredActivities.length > 50;
  const ITEM_HEIGHT = 80; // Approximate height of each timeline item
  const CONTAINER_HEIGHT = 600; // Max height for activity feed

  // Render timeline item
  const renderTimelineItem = useCallback((item: TimelineItem, index: number) => {
    const colors: Record<string, string> = {
      success: "bg-success",
      warning: "bg-warning",
      info: "bg-accent",
      ticket: "bg-blue-500",
      escalation: "bg-orange-500",
      update: "bg-purple-500"
    };

    const itemType = item.type || item.status || 'info';
    const colorClass = colors[itemType] || colors.info;

    return (
      <li key={item.id || index} className="flex items-start gap-3 py-2">
        <div className={`mt-1 h-2 w-2 rounded-full ${colorClass}`} aria-hidden />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-muted">
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : item.time || 'Now'}
          </p>
          <p className="text-sm font-medium text-text">{item.title || item.text}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
          )}
        </div>
      </li>
    );
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Activity Feed</h2>
        <div className="flex items-center gap-3">
          {shouldUseVirtualScrolling && (
            <span className="text-xs text-muted-foreground">
              {activities.length} items (virtualized)
            </span>
          )}
          {liveUpdates && isConnected && (
            <motion.div
              className="h-2 w-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              title="Real-time updates active"
            />
          )}
        </div>
      </div>
      {shouldUseVirtualScrolling ? (
        <VirtualList
          items={filteredActivities}
          itemHeight={ITEM_HEIGHT}
          containerHeight={CONTAINER_HEIGHT}
          renderItem={renderTimelineItem}
          overscan={5}
          enabled={true}
        />
      ) : (
        <div style={{ maxHeight: CONTAINER_HEIGHT, overflowY: 'auto' }}>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No activities found</p>
              {(searchQuery || filterType !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <ol className="space-y-4">
              {filteredActivities.map((item, index) => renderTimelineItem(item, index))}
            </ol>
          )}
        </div>
      )}
    </Card>
  );
});
