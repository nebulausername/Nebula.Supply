import { logger } from '../utils/logger';
import { databaseService } from './database';
import { cacheService } from './cache';
import { initWebSocket } from '../websocket/server';

// Bot Event Manager
// Verbindet Bot-API-Endpunkte mit WebSocket-Events für Real-time Updates

export class BotEventManager {
  private wsServer: any;

  constructor(wsServer?: any) {
    this.wsServer = wsServer;
  }

  // ===== USER EVENT HANDLERS =====

  async handleUserSynced(userData: any): Promise<void> {
    try {
      // Log analytics event
      await databaseService.logBotAnalytics({
        user_id: userData.id,
        event_type: 'user_synced',
        event_data: { source: 'bot_api', timestamp: new Date().toISOString() },
        ip_address: userData.ip_address,
        user_agent: userData.user_agent
      });

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotUserJoined(userData, 'telegram');
      }

      logger.info('Bot user synced event handled', { telegramId: userData.telegram_id });
    } catch (error) {
      logger.error('Failed to handle user synced event', { error, userData });
    }
  }

  async handleUserVerified(userId: string, verificationId: string): Promise<void> {
    try {
      // Update user verification status
      const user = await databaseService.getBotUserByTelegramId(parseInt(userId));
      if (user) {
        await databaseService.updateBotUser(parseInt(userId), {
          verified_at: new Date().toISOString()
        });
      }

      // Log admin action
      await databaseService.logAdminAction({
        admin_id: 'system',
        action_type: 'user_verified',
        target_type: 'bot_user',
        target_id: userId,
        metadata: { verification_id: verificationId }
      });

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotUserVerified(userId, verificationId);
      }

      logger.info('Bot user verified event handled', { userId, verificationId });
    } catch (error) {
      logger.error('Failed to handle user verified event', { error, userId, verificationId });
    }
  }

  // ===== VERIFICATION EVENT HANDLERS =====

  async handleVerificationCreated(verificationData: any): Promise<void> {
    try {
      // Log analytics event
      await databaseService.logBotAnalytics({
        user_id: verificationData.user_id,
        event_type: 'verification_started',
        event_data: {
          hand_sign: verificationData.hand_sign,
          verification_id: verificationData.id
        }
      });

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotVerificationCreated(verificationData);
        await this.wsServer.broadcastBotVerificationPending(verificationData.id, verificationData.user_id);
      }

      // Update queue stats
      await this.updateVerificationQueueStats();

      logger.info('Bot verification created event handled', { verificationId: verificationData.id });
    } catch (error) {
      logger.error('Failed to handle verification created event', { error, verificationData });
    }
  }

  async handleVerificationStatusUpdated(verificationId: string, status: string, adminNotes?: string): Promise<void> {
    try {
      // Get verification details
      const allVerifications = await databaseService.getAllVerificationSessions();
      const verification = allVerifications.find(v => v.id === verificationId);

      if (!verification) {
        logger.warn('Verification not found for status update', { verificationId, status });
        return;
      }

      // Update verification status
      await databaseService.updateVerificationStatus(verificationId, status as any, adminNotes);

      // Log analytics event
      await databaseService.logBotAnalytics({
        user_id: verification.user_id,
        event_type: `verification_${status}`,
        event_data: {
          verification_id: verificationId,
          status,
          admin_notes: adminNotes
        }
      });

      // Log admin action
      await databaseService.logAdminAction({
        admin_id: 'system', // In echt würde die echte Admin-ID kommen
        action_type: `verification_${status}`,
        target_type: 'verification_session',
        target_id: verificationId,
        metadata: { status, admin_notes: adminNotes }
      });

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        if (status === 'approved') {
          await this.wsServer.broadcastBotVerificationApproved(verificationId, verification.user_id, 'system');
          
          // Broadcast live verification for homepage
          try {
            // Get bot user by ID from verification (user_id is bot_users.id)
            const botUser = await databaseService.getBotUserById(verification.user_id);
            if (botUser) {
              // Find inviter from referrals
              let inviterTelegramId: number | undefined;
              try {
                const referrals = await databaseService.getReferrals?.(botUser.telegram_id.toString()) || [];
                const referral = referrals.find(r => r.invited_telegram_id === botUser.telegram_id);
                if (referral) {
                  const inviterIdStr = referral.inviter_id.replace('tg:', '');
                  inviterTelegramId = parseInt(inviterIdStr, 10);
                }
              } catch (refError) {
                logger.warn('Failed to find inviter for verification', { error: refError, telegramId: botUser.telegram_id });
              }
              
              // Get user name (anonymize if needed)
              const userName = botUser.first_name || botUser.username || `Nutzer ${botUser.telegram_id.toString().slice(-4)}`;
              
              await this.wsServer.broadcastHomepageVerificationLive?.({
                telegramId: botUser.telegram_id,
                userName,
                inviterTelegramId,
                timestamp: new Date().toISOString()
              });
            }
          } catch (error) {
            logger.warn('Failed to broadcast homepage verification live', { error, verificationId, userId: verification.user_id });
          }
        } else if (status === 'rejected') {
          await this.wsServer.broadcastBotVerificationRejected(verificationId, verification.user_id, 'system', adminNotes || 'No reason provided');
        }
      }

      // Update queue stats
      await this.updateVerificationQueueStats();

      logger.info('Bot verification status updated event handled', { verificationId, status });
    } catch (error) {
      logger.error('Failed to handle verification status updated event', { error, verificationId, status });
    }
  }

  private async updateVerificationQueueStats(): Promise<void> {
    try {
      const pendingVerifications = await databaseService.getPendingVerificationSessions();
      const allVerifications = await databaseService.getAllVerificationSessions();

      if (this.wsServer) {
        await this.wsServer.broadcastBotVerificationQueueUpdate(pendingVerifications.length, allVerifications.length);
      }
    } catch (error) {
      logger.error('Failed to update verification queue stats', { error });
    }
  }

  // ===== INVITE CODE EVENT HANDLERS =====

  async handleInviteCodeCreated(inviteData: any): Promise<void> {
    try {
      // Log analytics event
      await databaseService.logBotAnalytics({
        event_type: 'invite_code_created',
        event_data: {
          code: inviteData.code,
          max_uses: inviteData.max_uses,
          created_by: inviteData.created_by
        }
      });

      // Log admin action
      await databaseService.logAdminAction({
        admin_id: inviteData.created_by,
        action_type: 'invite_code_created',
        target_type: 'invite_code',
        target_id: inviteData.code,
        metadata: { max_uses: inviteData.max_uses }
      });

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotInviteCodeCreated(inviteData);
      }

      // Update invite code stats
      await this.updateInviteCodeStats();

      logger.info('Bot invite code created event handled', { code: inviteData.code });
    } catch (error) {
      logger.error('Failed to handle invite code created event', { error, inviteData });
    }
  }

  async handleInviteCodeUsed(code: string, userId: string, usedBy: string): Promise<void> {
    try {
      // Log analytics event
      await databaseService.logBotAnalytics({
        user_id: userId,
        event_type: 'invite_code_used',
        event_data: { code, used_by: usedBy }
      });

      // Log admin action
      await databaseService.logAdminAction({
        admin_id: usedBy,
        action_type: 'invite_code_used',
        target_type: 'invite_code',
        target_id: code,
        metadata: { user_id: userId }
      });

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotInviteCodeUsed(code, userId, usedBy);
      }

      // Update invite code stats
      await this.updateInviteCodeStats();

      logger.info('Bot invite code used event handled', { code, userId, usedBy });
    } catch (error) {
      logger.error('Failed to handle invite code used event', { error, code, userId });
    }
  }

  async handleInviteCodeExpired(code: string, reason: string): Promise<void> {
    try {
      // Log analytics event
      await databaseService.logBotAnalytics({
        event_type: 'invite_code_expired',
        event_data: { code, reason }
      });

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotInviteCodeExpired(code, reason);
      }

      // Update invite code stats
      await this.updateInviteCodeStats();

      logger.info('Bot invite code expired event handled', { code, reason });
    } catch (error) {
      logger.error('Failed to handle invite code expired event', { error, code, reason });
    }
  }

  async handlePersonalInviteCodeUpdated(telegramId: number, newCode: string): Promise<void> {
    try {
      // Log analytics event
      await databaseService.logBotAnalytics({
        user_id: telegramId.toString(),
        event_type: 'personal_invite_code_updated',
        event_data: { new_code: newCode, timestamp: new Date().toISOString() }
      });

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastPersonalInviteCodeUpdated?.(telegramId, newCode);
      }

      logger.info('Personal invite code updated event handled', { telegramId, newCode });
    } catch (error) {
      logger.error('Failed to handle personal invite code updated event', { error, telegramId, newCode });
    }
  }

  private async updateInviteCodeStats(): Promise<void> {
    try {
      const allInviteCodes = await databaseService.getAllInviteCodes();
      const activeInviteCodes = await databaseService.getActiveInviteCodes();

      const stats = {
        total: allInviteCodes.length,
        active: activeInviteCodes.length,
        used: allInviteCodes.reduce((sum, code) => sum + code.used_count, 0)
      };

      if (this.wsServer) {
        await this.wsServer.broadcastBotInviteCodesStats(stats);
      }
    } catch (error) {
      logger.error('Failed to update invite code stats', { error });
    }
  }

  // ===== ANALYTICS EVENT HANDLERS =====

  async handleAnalyticsEvent(event: any): Promise<void> {
    try {
      // Log the analytics event
      await databaseService.logBotAnalytics(event);

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotAnalyticsUpdate(event.event_type, 1);
      }

      logger.debug('Bot analytics event handled', { eventType: event.event_type });
    } catch (error) {
      logger.error('Failed to handle analytics event', { error, event });
    }
  }

  // ===== ADMIN ACTION HANDLERS =====

  async handleAdminAction(adminId: string, action: string, targetType: string, targetId: string, metadata?: any): Promise<void> {
    try {
      // Log admin action
      await databaseService.logAdminAction({
        admin_id: adminId,
        action_type: action,
        target_type: targetType,
        target_id: targetId,
        metadata
      });

      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotAdminAction(adminId, action, `${targetType}:${targetId}`, metadata || {});
      }

      logger.info('Bot admin action handled', { adminId, action, targetType, targetId });
    } catch (error) {
      logger.error('Failed to handle admin action', { error, adminId, action });
    }
  }

  // ===== PERFORMANCE MONITORING =====

  async handlePerformanceMetrics(metrics: { responseTime: number; uptime: number; errorRate: number }): Promise<void> {
    try {
      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotPerformanceMetrics(metrics);
      }

      logger.info('Bot performance metrics handled', metrics);
    } catch (error) {
      logger.error('Failed to handle performance metrics', { error, metrics });
    }
  }

  // ===== HEALTH MONITORING =====

  async handleHealthStatus(status: 'healthy' | 'degraded' | 'unhealthy', metrics: any): Promise<void> {
    try {
      // Broadcast to WebSocket clients
      if (this.wsServer) {
        await this.wsServer.broadcastBotHealthStatus(status, metrics);
      }

      logger.info('Bot health status handled', { status, metrics });
    } catch (error) {
      logger.error('Failed to handle health status', { error, status });
    }
  }

  // ===== INITIALIZATION =====

  initializeWebSocketIntegration(wsServer: any): void {
    this.wsServer = wsServer;
    logger.info('Bot Event Manager WebSocket integration initialized');
  }

  // ===== STATISTICS =====

  async getBotStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalVerifications: number;
    pendingVerifications: number;
    totalInviteCodes: number;
    activeInviteCodes: number;
    recentActivity: any[];
  }> {
    try {
      const [totalUsers, activeUsers, totalVerifications, pendingVerifications, totalInviteCodes, activeInviteCodes] = await Promise.all([
        databaseService.getBotAnalytics({ eventType: 'user_joined' }),
        databaseService.getBotAnalytics({ eventType: 'user_active' }),
        databaseService.getAllVerificationSessions(),
        databaseService.getPendingVerificationSessions(),
        databaseService.getAllInviteCodes(),
        databaseService.getActiveInviteCodes()
      ]);

      // Get recent activity
      const recentActivity = await databaseService.getBotAnalytics({
        limit: 10
      });

      return {
        totalUsers: totalUsers.length,
        activeUsers: activeUsers.length,
        totalVerifications: totalVerifications.length,
        pendingVerifications: pendingVerifications.length,
        totalInviteCodes: totalInviteCodes.length,
        activeInviteCodes: activeInviteCodes.length,
        recentActivity: recentActivity.slice(0, 10)
      };
    } catch (error) {
      logger.error('Failed to get bot statistics', { error });
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalVerifications: 0,
        pendingVerifications: 0,
        totalInviteCodes: 0,
        activeInviteCodes: 0,
        recentActivity: []
      };
    }
  }
}

// Factory function
export function createBotEventManager(wsServer?: any): BotEventManager {
  return new BotEventManager(wsServer);
}

// Singleton instance
export const botEventManager = createBotEventManager();
