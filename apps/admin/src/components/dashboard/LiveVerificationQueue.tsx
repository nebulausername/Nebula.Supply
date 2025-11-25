import { useEffect, useState, memo } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useBotVerifications, useApproveVerification, useRejectVerification } from '../../lib/api/hooks';
import { useWebSocket } from '../../lib/websocket/client';
import { useAuthStore } from '../../lib/store/auth';
import { logger } from '../../lib/logger';

interface VerificationSession {
  id: string;
  user_id: string;
  hand_sign: string;
  hand_sign_emoji: string;
  hand_sign_instructions: string;
  photo_url?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  admin_notes?: string;
  hand_sign_changes: number;
  max_hand_sign_changes: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const LiveVerificationQueue = memo(function LiveVerificationQueue() {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch } = useBotVerifications({ status: 'pending_review', limit: 10 });
  const { wsManager, connectionStatus } = useWebSocket();
  const [liveVerifications, setLiveVerifications] = useState<VerificationSession[]>([]);
  
  const approveMutation = useApproveVerification();
  const rejectMutation = useRejectVerification();

  // Update live verifications when API data changes
  useEffect(() => {
    if (data?.data) {
      setLiveVerifications(data.data);
    }
  }, [data]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!wsManager) return;

    const handleVerificationCreated = (event: { verification: VerificationSession }) => {
      logger.debug('New verification created', event);
      setLiveVerifications(prev => [event.verification, ...prev]);
    };

    const handleVerificationPending = (event: { verificationId: string; userId: string }) => {
      logger.debug('Verification pending review', event);
      refetch();
    };

    const handleVerificationApproved = (event: { verificationId: string }) => {
      logger.debug('Verification approved', event);
      setLiveVerifications(prev => prev.filter(v => v.id !== event.verificationId));
    };

    const handleVerificationRejected = (event: { verificationId: string }) => {
      logger.debug('Verification rejected', event);
      setLiveVerifications(prev => prev.filter(v => v.id !== event.verificationId));
    };

    wsManager.on('bot:verification_created', handleVerificationCreated);
    wsManager.on('bot:verification_pending', handleVerificationPending);
    wsManager.on('bot:verification_approved', handleVerificationApproved);
    wsManager.on('bot:verification_rejected', handleVerificationRejected);

    // Subscribe to bot verifications
    if (wsManager.isConnected) {
      wsManager.socket?.emit('subscribe:bot_verifications', { status: 'pending_review' });
    }

    return () => {
      wsManager.off('bot:verification_created', handleVerificationCreated);
      wsManager.off('bot:verification_pending', handleVerificationPending);
      wsManager.off('bot:verification_approved', handleVerificationApproved);
      wsManager.off('bot:verification_rejected', handleVerificationRejected);
    };
  }, [wsManager, refetch]);

  const handleApprove = async (verificationId: string) => {
    if (!user?.id) return;
    
    try {
      await approveMutation.mutateAsync({
        verificationId,
        adminId: user.id
      });
      logger.info('Verification approved', { verificationId, adminId: user.id });
    } catch (error) {
      logger.error('Failed to approve verification', error);
    }
  };

  const handleReject = async (verificationId: string) => {
    if (!user?.id) return;
    
    const reason = prompt('Reason for rejection (optional):') || 'Rejected via admin dashboard';
    
    try {
      await rejectMutation.mutateAsync({
        verificationId,
        adminId: user.id,
        reason
      });
      logger.info('Verification rejected', { verificationId, adminId: user.id, reason });
    } catch (error) {
      logger.error('Failed to reject verification', error);
    }
  };

  const displayVerifications = liveVerifications.length > 0 ? liveVerifications : (data?.data || []);
  const isLive = connectionStatus.connected;

  if (isLoading && displayVerifications.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">⏳ Verification Queue</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-800 rounded"></div>
          <div className="h-20 bg-gray-800 rounded"></div>
          <div className="h-20 bg-gray-800 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error && displayVerifications.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">⏳ Verification Queue</h2>
        <div className="text-red-400 text-sm">
          Error: {error instanceof Error ? error.message : 'Failed to load verifications'}
        </div>
        <Button
          onClick={() => refetch()}
          className="mt-2"
          variant="outline"
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">⏳ Verification Queue</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-yellow-400 border-yellow-400">
            {displayVerifications.length} Pending
          </Badge>
          {isLive && (
            <Badge variant="secondary" className="text-green-400 border-green-400">
              🟢 LIVE
            </Badge>
          )}
        </div>
      </div>

      {displayVerifications.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No pending verifications</p>
          <p className="text-sm mt-1">All caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {displayVerifications.map((verification) => (
            <div key={verification.id} className="rounded-xl border border-white/10 bg-black/25 p-4 hover:bg-black/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{verification.hand_sign_emoji}</span>
                  <div>
                    <p className="font-semibold text-text">{verification.hand_sign}</p>
                    <p className="text-sm text-gray-400">User ID: {verification.user_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(verification.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-yellow-400">
                    Expires: {new Date(verification.expires_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-3 italic">
                "{verification.hand_sign_instructions}"
              </p>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  Changes: {verification.hand_sign_changes}/{verification.max_hand_sign_changes}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {verification.status.replace('_', ' ')}
                </Badge>
              </div>

              {verification.photo_url && (
                <div className="mb-3">
                  <img
                    src={verification.photo_url}
                    alt="Verification"
                    className="w-full max-w-xs rounded-lg border border-white/20"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(verification.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? '...' : '✅ Approve'}
                </Button>
                <Button
                  onClick={() => handleReject(verification.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? '...' : '❌ Reject'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="w-full"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? '⏳ Loading...' : '🔄 Refresh Queue'}
        </Button>
      </div>
    </Card>
  );
});
