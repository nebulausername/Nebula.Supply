import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useBotInviteCodes, useCreateInviteCode, useDeleteInviteCode } from '../../lib/api/hooks';
import { useWebSocket } from '../../lib/websocket/client';
import { useAuthStore } from '../../lib/store/auth';
import { logger } from '../../lib/logger';

interface InviteCode {
  id: string;
  code: string;
  created_by: string;
  max_uses: number;
  used_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

const LiveInviteCodeManagerComponent = function LiveInviteCodeManager() {
  const { user } = useAuthStore();
  const { data, isLoading, error, refetch } = useBotInviteCodes({ status: 'active', limit: 20 });
  const { wsManager, connectionStatus } = useWebSocket();
  const [liveInviteCodes, setLiveInviteCodes] = useState<InviteCode[]>([]);
  
  const createMutation = useCreateInviteCode();
  const deleteMutation = useDeleteInviteCode();

  const [newMaxUses, setNewMaxUses] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update live invite codes when API data changes
  useEffect(() => {
    if (data?.data) {
      setLiveInviteCodes(data.data);
    }
  }, [data]);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!wsManager) return;

    const handleInviteCodeCreated = (event: { inviteCode: InviteCode }) => {
      logger.debug('New invite code created', event);
      setLiveInviteCodes(prev => [event.inviteCode, ...prev]);
    };

    const handleInviteCodeUsed = (event: { code: string; userId: string }) => {
      logger.debug('Invite code used', event);
      setLiveInviteCodes(prev => prev.map(code => 
        code.code === event.code 
          ? { ...code, used_count: code.used_count + 1 } 
          : code
      ));
    };

    const handleInviteCodeExpired = (event: { code: string }) => {
      logger.debug('Invite code expired', event);
      setLiveInviteCodes(prev => prev.filter(c => c.code !== event.code));
    };

    wsManager.on('bot:invite_code_created', handleInviteCodeCreated);
    wsManager.on('bot:invite_code_used', handleInviteCodeUsed);
    wsManager.on('bot:invite_code_expired', handleInviteCodeExpired);

    // Subscribe to bot invite codes
    if (wsManager.isConnected) {
      wsManager.socket?.emit('subscribe:bot_invite_codes', { status: 'active' });
    }

    return () => {
      wsManager.off('bot:invite_code_created', handleInviteCodeCreated);
      wsManager.off('bot:invite_code_used', handleInviteCodeUsed);
      wsManager.off('bot:invite_code_expired', handleInviteCodeExpired);
    };
  }, [wsManager]);

  const handleCreate = async () => {
    if (!user?.id) return;
    
    setErrorMsg(null);

    try {
      await createMutation.mutateAsync({
        maxUses: newMaxUses,
        createdBy: user.id
      });
      
      setNewMaxUses(1);
      logger.info('Invite code created', { createdBy: user.id, maxUses: newMaxUses });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invite code';
      setErrorMsg(message);
      logger.error('Failed to create invite code', err);
    }
  };

  const handleDelete = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this invite code?')) return;
    
    try {
      await deleteMutation.mutateAsync(codeId);
      logger.info('Invite code deleted', { codeId });
    } catch (err) {
      logger.error('Failed to delete invite code', err);
    }
  };

  const displayInviteCodes = liveInviteCodes.length > 0 ? liveInviteCodes : (data?.data || []);
  const isLive = connectionStatus.connected;

  if (isLoading && displayInviteCodes.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">🔑 Invite Code Manager</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">🔑 Invite Code Manager</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-green-400 border-green-400">
            {displayInviteCodes.length} Active
          </Badge>
          {isLive && (
            <Badge variant="secondary" className="text-green-400 border-green-400">
              🟢 LIVE
            </Badge>
          )}
        </div>
      </div>

      {/* Create New Invite Code */}
      <div className="mb-6 p-4 rounded-xl border border-white/10 bg-black/25">
        <h3 className="font-semibold mb-3 text-sm text-gray-300">Create New Invite Code</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <Input
            type="number"
            placeholder="Max uses"
            value={newMaxUses}
            onChange={(e) => setNewMaxUses(parseInt(e.target.value) || 1)}
            min="1"
            max="100"
            className="bg-black/30"
          />
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createMutation.isPending ? 'Creating...' : '➕ Generate Code'}
          </Button>
        </div>
        {(errorMsg || error) && (
          <p className="text-red-400 text-sm">
            {errorMsg || (error instanceof Error ? error.message : 'Error loading invite codes')}
          </p>
        )}
      </div>

      {/* Active Invite Codes List */}
      {displayInviteCodes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No active invite codes</p>
          <p className="text-sm mt-1">Create one above to get started!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {displayInviteCodes.map((inviteCode) => {
            const usagePercent = (inviteCode.used_count / inviteCode.max_uses) * 100;
            const isFullyUsed = inviteCode.used_count >= inviteCode.max_uses;
            
            return (
              <div 
                key={inviteCode.id} 
                className={`rounded-xl border border-white/10 bg-black/25 p-4 ${
                  isFullyUsed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-lg font-bold text-green-400">
                      {inviteCode.code}
                    </code>
                    <Badge variant={inviteCode.is_active && !isFullyUsed ? "default" : "secondary"}>
                      {isFullyUsed ? 'Fully Used' : inviteCode.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleDelete(inviteCode.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-red-400 hover:bg-red-400/10"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? '...' : '🗑️'}
                  </Button>
                </div>

                {/* Usage Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Usage</span>
                    <span>{inviteCode.used_count}/{inviteCode.max_uses}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        usagePercent === 100 ? 'bg-red-500' : 
                        usagePercent > 80 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Created</p>
                    <p className="font-semibold">{new Date(inviteCode.created_at).toLocaleDateString()}</p>
                  </div>
                  {inviteCode.expires_at && (
                    <div>
                      <p className="text-gray-400 text-xs">Expires</p>
                      <p className="font-semibold text-yellow-400">
                        {new Date(inviteCode.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400 text-xs">Created By</p>
                    <p className="font-semibold text-xs truncate">{inviteCode.created_by}</p>
                  </div>
                </div>
              </div>
            );
          })}
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
          {isLoading ? '⏳ Loading...' : '🔄 Refresh Codes'}
        </Button>
      </div>
    </Card>
  );
};

export const LiveInviteCodeManager = memo(LiveInviteCodeManagerComponent);
