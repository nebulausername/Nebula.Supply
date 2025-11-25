/**
 * Analytics System for NEBULA Bot
 * Tracks user interactions, ticket metrics, and performance data
 */

interface AnalyticsEvent {
  type: string;
  userId: string;
  timestamp: string;
  data: Record<string, any>;
}

interface BotMetrics {
  totalUsers: number;
  totalTickets: number;
  totalMessages: number;
  averageResponseTime: number;
  activeUsers: Set<string>;
  events: AnalyticsEvent[];
  commandsUsed: Map<string, number>;
}

class AnalyticsManager {
  private metrics: BotMetrics;
  private config: any;

  constructor() {
    this.metrics = {
      totalUsers: 0,
      totalTickets: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      activeUsers: new Set(),
      events: [],
      commandsUsed: new Map()
    };
  }

  init(config: any) {
    this.config = config;
    console.log('[Analytics] Initialized with config:', config.botName);
  }

  trackInteraction(type: string, ctx: any, data: Record<string, any> = {}) {
    const userId = ctx.from?.id?.toString();
    if (!userId) return;

    this.metrics.activeUsers.add(userId);
    
    const event: AnalyticsEvent = {
      type,
      userId,
      timestamp: new Date().toISOString(),
      data: {
        ...data,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name,
        updateType: ctx.updateType
      }
    };

    this.metrics.events.push(event);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.metrics.events.length > 1000) {
      this.metrics.events = this.metrics.events.slice(-1000);
    }

    console.log(`[Analytics] Tracked ${type} for user ${userId}`);
  }

  trackTicketCreated(ticketId: string, userId: string, category: string) {
    this.metrics.totalTickets++;
    this.trackInteraction('ticket_created', { from: { id: userId } }, {
      ticketId,
      category,
      action: 'ticket_created'
    });
  }

  trackMessageSent(ticketId: string, userId: string, messageType: 'user' | 'agent') {
    this.metrics.totalMessages++;
    this.trackInteraction('message_sent', { from: { id: userId } }, {
      ticketId,
      messageType,
      action: 'message_sent'
    });
  }

  trackTicketStatusChange(ticketId: string, userId: string, oldStatus: string, newStatus: string) {
    this.trackInteraction('ticket_status_change', { from: { id: userId } }, {
      ticketId,
      oldStatus,
      newStatus,
      action: 'status_change'
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeUsers: this.metrics.activeUsers.size,
      commandsUsed: this.metrics.commandsUsed,
      recentEvents: this.metrics.events.slice(-10)
    };
  }

  getTopCommands(limit: number = 10): Array<{ command: string; count: number }> {
    const sortedCommands = Array.from(this.metrics.commandsUsed.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    return sortedCommands;
  }

  getRecentEvents(limit: number = 20): AnalyticsEvent[] {
    return this.metrics.events.slice(-limit);
  }

  export() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      config: {
        botName: this.config?.botName,
        nodeEnv: this.config?.nodeEnv
      }
    };
  }
}

// Singleton instance
export const analytics = new AnalyticsManager();

export const initAnalytics = (config: any) => {
  analytics.init(config);
};

export const getAnalytics = () => analytics;