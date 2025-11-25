import { structuredLogger } from './structuredLogger';

// 🚀 Audit Logging für Admin-Aktionen

export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

class AuditLogger {
  // 🎯 Log Admin Action
  logAdminAction(
    userId: string,
    action: string,
    resource: string,
    options?: {
      resourceId?: string;
      changes?: Record<string, any>;
      ip?: string;
      userAgent?: string;
    }
  ) {
    const auditLog: AuditLog = {
      userId,
      action,
      resource,
      resourceId: options?.resourceId,
      changes: options?.changes,
      ip: options?.ip,
      userAgent: options?.userAgent,
      timestamp: new Date().toISOString()
    };

    structuredLogger.info('Admin Action', {
      type: 'audit',
      ...auditLog
    });
  }

  // 🎯 Log Player Management Actions
  logPlayerAction(
    userId: string,
    action: 'reset' | 'adjust' | 'ban' | 'unban',
    targetUserId: string,
    changes?: Record<string, any>,
    ip?: string
  ) {
    this.logAdminAction(
      userId,
      action,
      'player',
      {
        resourceId: targetUserId,
        changes,
        ip
      }
    );
  }

  // 🎯 Log Leaderboard Actions
  logLeaderboardAction(
    userId: string,
    action: 'reset' | 'adjust',
    type?: string,
    changes?: Record<string, any>,
    ip?: string
  ) {
    this.logAdminAction(
      userId,
      action,
      'leaderboard',
      {
        resourceId: type,
        changes,
        ip
      }
    );
  }

  // 🎯 Log Game Configuration Changes
  logConfigChange(
    userId: string,
    configType: string,
    oldValue: any,
    newValue: any,
    ip?: string
  ) {
    this.logAdminAction(
      userId,
      'config_change',
      'game_config',
      {
        resourceId: configType,
        changes: {
          old: oldValue,
          new: newValue
        },
        ip
      }
    );
  }
}

export const auditLogger = new AuditLogger();

