import { useState, useEffect, memo, useCallback, useMemo, useRef } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { logger } from '../../lib/logger';
import { WidgetSkeleton } from '../ui/skeletons/WidgetSkeleton';
import { InlineError } from '../error/InlineError';
import { VirtualizedList } from '../ui/VirtualizedList';

// Type definitions for event data
type UserJoinedEventData = { source?: string };
type VerificationEventData = { hand_sign?: string };
type InviteCodeEventData = { code: string; used_by?: string };
type EventData = UserJoinedEventData | VerificationEventData | InviteCodeEventData | Record<string, unknown>;

interface BotActivity {
  id: string;
  user_id?: string;
  event_type: string;
  event_data: EventData;
  session_id?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

// Constants for event icons and colors
const EVENT_ICONS: Record<string, string> = {
  user_joined: '👋',
  user_verified: '✅',
  user_active: '🟢',
  verification_started: '🔍',
  verification_approved: '✅',
  verification_rejected: '❌',
  invite_code_created: '🔑',
  invite_code_used: '🎉',
  invite_code_expired: '⏰',
};

const EVENT_COLORS: Record<string, string> = {
  user_joined: 'text-blue-400',
  user_verified: 'text-green-400',
  user_active: 'text-green-400',
  verification_started: 'text-yellow-400',
  verification_approved: 'text-green-400',
  verification_rejected: 'text-red-400',
  invite_code_created: 'text-purple-400',
  invite_code_used: 'text-green-400',
  invite_code_expired: 'text-orange-400',
};

// ActivityItem component to eliminate duplication
interface ActivityItemProps {
  activity: BotActivity;
  getEventIcon: (eventType: string) => string;
  getEventColor: (eventType: string) => string;
  formatEventDescription: (activity: BotActivity) => string;
}

const ActivityItem = memo(function ActivityItem({
  activity,
  getEventIcon,
  getEventColor,
  formatEventDescription,
}: ActivityItemProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">
          {getEventIcon(activity.event_type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <p className={`font-semibold ${getEventColor(activity.event_type)}`}>
              {activity.event_type.replace(/_/g, ' ').toUpperCase()}
            </p>
            <time 
              className="text-xs text-gray-400"
              dateTime={activity.timestamp}
              aria-label={`Event timestamp: ${new Date(activity.timestamp).toLocaleString()}`}
            >
              {new Date(activity.timestamp).toLocaleString()}
            </time>
          </div>

          <p className="text-sm text-gray-300 mb-2">
            {formatEventDescription(activity)}
          </p>

          {activity.user_id && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs" aria-label={`User ID: ${activity.user_id}`}>
                User: {activity.user_id}
              </Badge>
              {activity.session_id && (
                <Badge variant="outline" className="text-xs" aria-label={`Session ID: ${activity.session_id}`}>
                  Session: {activity.session_id.substring(0, 8)}...
                </Badge>
              )}
            </div>
          )}

          {activity.event_data && Object.keys(activity.event_data).length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-400 hover:text-gray-300" role="button" tabIndex={0}>
                View Details
              </summary>
              <pre className="mt-2 p-2 bg-black/50 rounded text-gray-300 overflow-x-auto" aria-label="Event details">
                {JSON.stringify(activity.event_data, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
});

export const LiveBotActivityFeed = memo(function LiveBotActivityFeed() {
  const [activities, setActivities] = useState<BotActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchRecentActivities = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bot/analytics?limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setActivities(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch bot activities');
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while fetching bot activities';
      logger.error('Failed to fetch bot activities', { 
        error: err,
        context: 'LiveBotActivityFeed',
        timestamp: new Date().toISOString()
      });
      setError(errorMessage);
    } finally {
      // Only update loading state if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const getEventIcon = useCallback((eventType: string): string => {
    return EVENT_ICONS[eventType] || '📊';
  }, []);

  const getEventColor = useCallback((eventType: string): string => {
    return EVENT_COLORS[eventType] || 'text-gray-400';
  }, []);

  const formatEventDescription = useCallback((activity: BotActivity): string => {
    const eventData = activity.event_data;
    switch (activity.event_type) {
      case 'user_joined': {
        const data = eventData as UserJoinedEventData;
        return `New user joined: ${data.source || 'telegram'}`;
      }
      case 'user_verified':
        return `User verified: ${activity.user_id || 'unknown'}`;
      case 'user_active':
        return `User active: ${activity.user_id || 'unknown'}`;
      case 'verification_started': {
        const data = eventData as VerificationEventData;
        return `Verification started: ${data.hand_sign || 'N/A'} (${activity.user_id || 'unknown'})`;
      }
      case 'verification_approved':
        return `Verification approved: ${activity.user_id || 'unknown'}`;
      case 'verification_rejected':
        return `Verification rejected: ${activity.user_id || 'unknown'}`;
      case 'invite_code_created': {
        const data = eventData as InviteCodeEventData;
        return `Invite code created: ${data.code || 'N/A'}`;
      }
      case 'invite_code_used': {
        const data = eventData as InviteCodeEventData;
        return `Invite code used: ${data.code || 'N/A'}${data.used_by ? ` by ${data.used_by}` : ''}`;
      }
      case 'invite_code_expired': {
        const data = eventData as InviteCodeEventData;
        return `Invite code expired: ${data.code || 'N/A'}`;
      }
      default:
        return `${activity.event_type}: ${JSON.stringify(eventData)}`;
    }
  }, []);

  useEffect(() => {
    fetchRecentActivities();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRecentActivities, 30000);

    return () => {
      clearInterval(interval);
      // Cancel any pending fetch requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRecentActivities]);

  if (loading && activities.length === 0) {
    return (
      <Card className="p-6" role="region" aria-label="Bot Activity Feed">
        <h2 className="text-lg font-semibold mb-4">📈 Bot Activity Feed</h2>
        <WidgetSkeleton variant="list" aria-label="Loading bot activities" />
      </Card>
    );
  }

  if (error && activities.length === 0) {
    return (
      <Card className="p-6" role="region" aria-label="Bot Activity Feed">
        <h2 className="text-lg font-semibold mb-4">📈 Bot Activity Feed</h2>
        <InlineError
          error={error}
          title="Failed to load bot activities"
          message={error}
          onRetry={fetchRecentActivities}
          severity="error"
          autoRetry={true}
          maxRetries={3}
          recoverySuggestions={[
            'Check your internet connection',
            'Verify the bot service is running',
            'Try refreshing the page'
          ]}
        />
      </Card>
    );
  }

  // Memoize activity items for better performance
  const activityItems = useMemo(() => activities, [activities]);

  // Optimize threshold - use virtualization for 30+ items instead of 50
  const VIRTUALIZATION_THRESHOLD = 30;
  const shouldUseVirtualization = activityItems.length > VIRTUALIZATION_THRESHOLD;

  return (
    <Card className="p-6" role="region" aria-label="Bot Activity Feed">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">📈 Bot Activity Feed</h2>
        <Badge variant="secondary" className="text-blue-400 border-blue-400" aria-label={`${activities.length} recent activities`}>
          {activities.length} Recent
        </Badge>
      </div>

      {error && activities.length > 0 && (
        <div className="mb-4" role="alert" aria-live="polite">
          <InlineError
            error={error}
            title="Error refreshing activities"
            message={error}
            onRetry={fetchRecentActivities}
            severity="warning"
            autoRetry={false}
          />
        </div>
      )}

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-400" role="status" aria-live="polite">
          <p>No recent activity</p>
          <p className="text-sm mt-1">Activity will appear here when users interact with the bot</p>
        </div>
      ) : (
        <>
          {shouldUseVirtualization ? (
            <VirtualizedList
              items={activityItems}
              renderItem={(activity) => (
                <div className="mb-3">
                  <ActivityItem
                    activity={activity}
                    getEventIcon={getEventIcon}
                    getEventColor={getEventColor}
                    formatEventDescription={formatEventDescription}
                  />
                </div>
              )}
              itemHeight={140}
              containerHeight={384}
              keyExtractor={(item) => item.id}
              aria-label="Bot activity list"
            />
          ) : (
            <div 
              className="space-y-3 max-h-96 overflow-y-auto"
              role="list"
              aria-label="Bot activity list"
            >
              {activityItems.map((activity) => (
                <div key={activity.id} role="listitem">
                  <ActivityItem
                    activity={activity}
                    getEventIcon={getEventIcon}
                    getEventColor={getEventColor}
                    formatEventDescription={formatEventDescription}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <Button
          onClick={fetchRecentActivities}
          variant="outline"
          className="w-full"
          size="sm"
          disabled={loading}
          aria-label="Refresh bot activity feed"
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh Activity'}
        </Button>
      </div>
    </Card>
  );
});
