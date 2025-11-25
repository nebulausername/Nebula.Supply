import { useEffect, useState, memo } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useBotStats } from '../../lib/api/hooks';
import { useWebSocket } from '../../lib/websocket/client';
import { logger } from '../../lib/logger';

interface BotStats {
  totalUsers: number;
  activeUsers: number;
  totalVerifications: number;
  pendingVerifications: number;
  totalInviteCodes: number;
  activeInviteCodes: number;
  timestamp: string;
}

export const LiveBotStats = memo(function LiveBotStats() {
  const { data: stats, isLoading: loading, error, refetch } = useBotStats();
  const { wsManager, connectionStatus } = useWebSocket();
  const [liveStats, setLiveStats] = useState<BotStats | null>(null);

  // Update live stats when API data changes
  useEffect(() => {
    if (stats) {
      setLiveStats(stats);
    }
  }, [stats]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!wsManager) return;

    const handleBotStatsUpdate = (data: any) => {
      logger.debug('Bot stats updated via WebSocket', data);
      setLiveStats(prev => {
        if (!prev && !data) return null;
        return {
          totalUsers: 0,
          activeUsers: 0,
          totalVerifications: 0,
          pendingVerifications: 0,
          totalInviteCodes: 0,
          activeInviteCodes: 0,
          timestamp: new Date().toISOString(),
          ...prev,
          ...data,
          timestamp: new Date().toISOString()
        };
      });
    };

    const handleVerificationQueueUpdate = (data: { pendingCount?: number; totalCount?: number }) => {
      if (!data || (data.pendingCount === undefined && data.totalCount === undefined)) return;
      setLiveStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          pendingVerifications: data.pendingCount ?? prev.pendingVerifications,
          totalVerifications: data.totalCount ?? prev.totalVerifications
        };
      });
    };

    const handleInviteCodesStats = (data: { total?: number; active?: number; used?: number }) => {
      if (!data || (data.total === undefined && data.active === undefined)) return;
      setLiveStats(prev => {
        if (!prev) return null;
        return {
          ...prev,
          totalInviteCodes: data.total ?? prev.totalInviteCodes,
          activeInviteCodes: data.active ?? prev.activeInviteCodes
        };
      });
    };

    wsManager.on('bot:stats_update', handleBotStatsUpdate);
    wsManager.on('bot:verification_queue_update', handleVerificationQueueUpdate);
    wsManager.on('bot:invite_codes_stats', handleInviteCodesStats);

    // Subscribe to bot dashboard
    if (wsManager.isConnected) {
      wsManager.socket?.emit('subscribe:bot_dashboard', { components: ['stats', 'verifications', 'invite_codes'] });
    }

    return () => {
      wsManager.off('bot:stats_update', handleBotStatsUpdate);
      wsManager.off('bot:verification_queue_update', handleVerificationQueueUpdate);
      wsManager.off('bot:invite_codes_stats', handleInviteCodesStats);
    };
  }, [wsManager]);

  const displayStats = liveStats || stats;

  if (loading && !displayStats) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">🤖 Bot Live Stats</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  if (error && !displayStats) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">🤖 Bot Live Stats</h2>
        <div className="text-red-400 text-sm">
          Error: {error instanceof Error ? error.message : 'Failed to load bot stats'}
        </div>
        <button
          onClick={() => refetch()}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!displayStats) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">🤖 Bot Live Stats</h2>
        <div className="text-gray-400 text-sm">
          No data available
        </div>
      </Card>
    );
  }

  const isLive = connectionStatus.connected;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">🤖 Bot Live Stats</h2>
        <Badge variant="secondary" className={isLive ? 'text-green-400 border-green-400' : 'text-gray-400 border-gray-400'}>
          {isLive ? '🟢 LIVE' : '⚪ OFFLINE'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-accent">👥 Total Users</p>
          <p className="text-2xl font-bold text-text">{(displayStats?.totalUsers ?? 0).toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-accent">🟢 Active Users</p>
          <p className="text-2xl font-bold text-green-400">{(displayStats?.activeUsers ?? 0).toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-accent">✅ Total Verifications</p>
          <p className="text-2xl font-bold text-blue-400">{(displayStats?.totalVerifications ?? 0).toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-accent">⏳ Pending Verifications</p>
          <p className="text-2xl font-bold text-yellow-400">{(displayStats?.pendingVerifications ?? 0).toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-accent">🔑 Total Invite Codes</p>
          <p className="text-2xl font-bold text-purple-400">{(displayStats?.totalInviteCodes ?? 0).toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-accent">🟢 Active Invite Codes</p>
          <p className="text-2xl font-bold text-green-400">{(displayStats?.activeInviteCodes ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Last updated: {displayStats?.timestamp ? new Date(displayStats.timestamp).toLocaleTimeString() : 'N/A'}
        </p>
        {isLive && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Live updates active</span>
          </div>
        )}
      </div>
    </Card>
  );
});
