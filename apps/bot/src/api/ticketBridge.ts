/**
 * Ticket Bridge API
 * 
 * This module provides a bridge between Telegram bot and web app
 * for synchronizing ticket data and messages.
 */

import { botApiClient } from '../clients/apiClient';
import { logger } from '../logger';
import type { TicketData } from '../flows/supportTickets';

interface WebTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting' | 'escalated' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  messages: Array<{
    id: string;
    text: string;
    from: 'user' | 'agent' | 'system' | 'bot';
    timestamp: string;
    senderName?: string;
    attachments?: any[];
  }>;
  category?: string;
}

interface TicketBridgeConfig {
  apiBaseUrl?: string;
  pollInterval?: number;
}

interface TicketUpdateEvent {
  type: 'ticket_created' | 'ticket_updated' | 'message_added' | 'status_changed';
  ticketId: string;
  ticket?: any;
  message?: any;
  timestamp: string;
}

export class TicketBridge {
  private config: TicketBridgeConfig;
  private listeners: Map<string, Set<(event: TicketUpdateEvent) => void>> = new Map();
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: TicketBridgeConfig = {}) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl || process.env.TICKETS_BASE_URL || 'http://localhost:5173',
      pollInterval: config.pollInterval || 5000
    };
  }

  /**
   * Sync a Telegram ticket to the web app (via API)
   */
  async syncTelegramToWeb(telegramUserId: string, ticket: TicketData): Promise<void> {
    try {
      logger.info('[TicketBridge] Syncing Telegram ticket to web', {
        telegramUserId,
        ticketId: ticket.id,
        subject: ticket.subject
      });

      // Ticket is already created via API, so it's automatically synced
      // This method is mainly for logging and event emission
      this.notifyListeners(telegramUserId, {
        type: 'ticket_created',
        ticketId: ticket.id,
        ticket: this.convertTelegramToWebFormat(ticket),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('[TicketBridge] Failed to sync to web', { error, telegramUserId, ticketId: ticket.id });
    }
  }

  /**
   * Sync a web ticket to Telegram (notify user about updates)
   */
  async syncWebToTelegram(webTicket: WebTicket, telegramUserId: string): Promise<void> {
    try {
      logger.info('[TicketBridge] Syncing web ticket to Telegram', {
        ticketId: webTicket.id,
        telegramUserId
      });

      // Notify Telegram user about ticket updates
      this.notifyListeners(telegramUserId, {
        type: 'ticket_updated',
        ticketId: webTicket.id,
        ticket: webTicket,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('[TicketBridge] Failed to sync to Telegram', { error, ticketId: webTicket.id, telegramUserId });
    }
  }

  /**
   * Get tickets for a Telegram user from API
   */
  async getWebTicketsForUser(telegramUserId: string): Promise<WebTicket[]> {
    try {
      const tickets = await botApiClient.getUserTickets(telegramUserId);
      return tickets.map(ticket => this.convertApiTicketToWebFormat(ticket));
    } catch (error) {
      logger.error('[TicketBridge] Failed to fetch web tickets', { error, telegramUserId });
      return [];
    }
  }

  /**
   * Link Telegram user with web session
   */
  async linkTelegramToWebSession(telegramUserId: string, webSessionId: string): Promise<void> {
    try {
      logger.info('[TicketBridge] Linking Telegram user to web session', {
        telegramUserId,
        webSessionId
      });

      // Store mapping could be done via API if needed
      // For now, tickets are linked via telegramUserId field
    } catch (error) {
      logger.error('[TicketBridge] Failed to link sessions', { error, telegramUserId, webSessionId });
    }
  }

  /**
   * Send notification to Telegram user about ticket updates
   */
  async notifyTelegramUser(telegramUserId: string, message: string, ticketId?: string): Promise<void> {
    try {
      logger.info('[TicketBridge] Notifying Telegram user', { telegramUserId, message, ticketId });
      
      this.notifyListeners(telegramUserId, {
        type: 'message_added',
        ticketId: ticketId || '',
        message: {
          text: message,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('[TicketBridge] Failed to notify user', { error, telegramUserId });
    }
  }

  /**
   * Subscribe to ticket updates for a user
   */
  subscribe(userId: string, callback: (event: TicketUpdateEvent) => void): () => void {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, new Set());
    }
    
    this.listeners.get(userId)!.add(callback);

    // Start polling for updates if not already started
    this.startPollingForUser(userId);

    // Return unsubscribe function
    return () => {
      const userListeners = this.listeners.get(userId);
      if (userListeners) {
        userListeners.delete(callback);
        if (userListeners.size === 0) {
          this.listeners.delete(userId);
          this.stopPollingForUser(userId);
        }
      }
    };
  }

  /**
   * Convert Telegram ticket to Web format
   */
  convertTelegramToWebFormat(ticket: TicketData): WebTicket {
    return {
      id: ticket.id,
      userId: ticket.userId || ticket.telegramUserId || '',
      subject: ticket.subject,
      description: ticket.description || ticket.summary || '',
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      messages: (ticket.messages || []).map(msg => ({
        id: msg.id,
        text: msg.text,
        from: msg.from === 'user' ? 'user' : msg.from === 'bot' ? 'agent' : msg.from,
        timestamp: msg.timestamp,
        senderName: msg.from === 'user' ? 'Telegram User' : 'Support Team',
        attachments: msg.attachments || []
      })),
      category: ticket.category || ticket.subject
    };
  }

  /**
   * Convert API ticket to Web format
   */
  convertApiTicketToWebFormat(apiTicket: any): WebTicket {
    return {
      id: apiTicket.id,
      userId: apiTicket.userId || apiTicket.telegramUserId || '',
      subject: apiTicket.subject,
      description: apiTicket.summary || apiTicket.description || '',
      status: apiTicket.status,
      priority: apiTicket.priority,
      createdAt: apiTicket.createdAt,
      messages: (apiTicket.messages || []).map((msg: any) => ({
        id: msg.id,
        text: msg.text,
        from: msg.from === 'user' ? 'user' : msg.from === 'bot' ? 'agent' : msg.from,
        timestamp: msg.timestamp,
        senderName: msg.from === 'user' ? 'User' : 'Support Team',
        attachments: msg.attachments || []
      })),
      category: apiTicket.category || apiTicket.subject
    };
  }

  /**
   * Generate anonymous link for web access
   */
  generateAnonymousLink(ticketId: string, telegramUserId?: string): string {
    const token = Buffer.from(`${ticketId}:${telegramUserId || 'anon'}:${Date.now()}`).toString('base64');
    return `${this.config.apiBaseUrl}/support?ticket=${token}`;
  }

  /**
   * Generate secure shareable link for ticket
   */
  async generateShareLink(ticketId: string): Promise<{ shareLink: string; shareToken: string; expiresAt: string }> {
    try {
      const response = await fetch(`${process.env.BOT_API_URL || 'http://localhost:3001/api'}/tickets/${ticketId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOT_API_KEY || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      logger.error('[TicketBridge] Failed to generate share link', { error, ticketId });
      throw error;
    }
  }

  /**
   * Start polling for ticket updates for a specific user
   */
  private startPollingForUser(userId: string): void {
    if (this.pollIntervals.has(userId)) {
      return; // Already polling
    }

    const interval = setInterval(async () => {
      try {
        const tickets = await botApiClient.getUserTickets(userId);
        // Check for updates and notify listeners
        // This is a simple implementation - in production, use WebSockets or SSE
        tickets.forEach(ticket => {
          this.notifyListeners(userId, {
            type: 'ticket_updated',
            ticketId: ticket.id,
            ticket: this.convertApiTicketToWebFormat(ticket),
            timestamp: new Date().toISOString()
          });
        });
      } catch (error) {
        logger.warn('[TicketBridge] Polling error', { error, userId });
      }
    }, this.config.pollInterval);

    this.pollIntervals.set(userId, interval);
  }

  /**
   * Stop polling for a specific user
   */
  private stopPollingForUser(userId: string): void {
    const interval = this.pollIntervals.get(userId);
    if (interval) {
      clearInterval(interval);
      this.pollIntervals.delete(userId);
    }
  }

  /**
   * Notify all listeners for a user about an event
   */
  private notifyListeners(userId: string, event: TicketUpdateEvent): void {
    const userListeners = this.listeners.get(userId);
    if (userListeners) {
      userListeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          logger.error('[TicketBridge] Listener error', { error, userId });
        }
      });
    }
  }
}

// Singleton instance
export const ticketBridge = new TicketBridge();

// Helper functions for integration with support flow
export const enhancedSupportWithBridge = {
  /**
   * Create ticket with web sync (now handled via API automatically)
   */
  async createTicketWithSync(telegramUserId: string, ticketData: Omit<TicketData, 'id' | 'createdAt'>) {
    // Create ticket via API (which automatically syncs to web)
    const ticket = await botApiClient.createTicket({
      subject: ticketData.subject,
      summary: ticketData.description || ticketData.summary || '',
      priority: ticketData.priority,
      category: ticketData.category || ticketData.subject.toLowerCase().replace(/\s+/g, '_'),
      telegramUserId
    });

    // Convert to TicketData format
    const ticketDataFormat: TicketData = {
      id: ticket.id,
      userId: telegramUserId,
      telegramUserId,
      subject: ticket.subject,
      description: ticket.summary,
      summary: ticket.summary,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      createdAt: ticket.createdAt,
      messages: ticket.messages || []
    };

    // Notify bridge about creation
    await ticketBridge.syncTelegramToWeb(telegramUserId, ticketDataFormat);

    return ticketDataFormat;
  },

  /**
   * Add message with web sync (now handled via API automatically)
   */
  async addMessageWithSync(ticketId: string, telegramUserId: string, messageText: string, from: 'user' | 'agent' | 'bot') {
    // Add message via API (which automatically syncs to web)
    await botApiClient.addTicketMessage(ticketId, {
      from: from === 'agent' ? 'bot' : from,
      user_id: telegramUserId,
      message: messageText
    });

    // Get updated ticket
    const updatedTicket = await botApiClient.getTicket(ticketId);
    if (updatedTicket) {
      const webTicket = ticketBridge.convertApiTicketToWebFormat(updatedTicket);
      await ticketBridge.syncWebToTelegram(webTicket, telegramUserId);
    }
  }
};
