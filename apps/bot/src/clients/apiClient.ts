import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../logger';

// Bot-zu-API Integration Client
// Ermöglicht echte Daten-Synchronisation zwischen Bot und Admin Dashboard

export interface BotApiConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface UserData {
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  verified_at?: string;
}

export interface VerificationSession {
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

export interface InviteCode {
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

export interface AnalyticsEvent {
  user_id?: string;
  event_type: string;
  event_data: any;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AdminSettings {
  enableVerification: boolean;
  enableInviteSystem: boolean;
  enableSupportTickets: boolean;
  adminIds: string[];
  rateLimitWindow: number;
  rateLimitMax: number;
}

class BotApiClient {
  private client: AxiosInstance;
  private config: BotApiConfig;

  constructor(config?: Partial<BotApiConfig>) {
    this.config = {
      baseURL: process.env.BOT_API_URL || 'http://localhost:3001/api',
      apiKey: process.env.BOT_API_KEY || 'your-api-key',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Nebula-Bot/1.0'
      }
    });

    // Request/Response Interceptors für Logging und Retry
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response Logging und Retry
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug('API Response', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      async (error) => {
        const { config, response } = error;

        // Retry Logic für bestimmte Fehler
        if (response?.status >= 500 && config && this.config.retryAttempts > 0) {
          let attempts = 0;
          while (attempts < this.config.retryAttempts) {
            attempts++;
            logger.warn(`API Retry ${attempts}/${this.config.retryAttempts}`, {
              url: config.url,
              status: response.status
            });

            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempts));
            try {
              return await this.client.request(config);
            } catch (retryError) {
              if (attempts >= this.config.retryAttempts) {
                logger.error('API Max Retries Exceeded', {
                  url: config.url,
                  attempts: this.config.retryAttempts
                });
                break;
              }
            }
          }
        }

        logger.error('API Response Error', {
          status: response?.status,
          url: config?.url,
          data: response?.data,
          message: error.message
        });

        return Promise.reject(error);
      }
    );
  }

  // ===== USER MANAGEMENT =====

  async syncUserData(userData: UserData): Promise<void> {
    try {
      await this.client.post('/bot/users/sync', userData);
      logger.info('User data synchronized', { telegramId: userData.telegram_id });
    } catch (error) {
      logger.error('Failed to sync user data', { error, telegramId: userData.telegram_id });
      throw error;
    }
  }

  async getUserByTelegramId(telegramId: number): Promise<UserData | null> {
    try {
      const response = await this.client.get(`/bot/users/telegram/${telegramId}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      logger.error('Failed to get user by telegram ID', { error, telegramId });
      throw error;
    }
  }

  // ===== VERIFICATION MANAGEMENT =====

  async createVerificationSession(sessionData: Omit<VerificationSession, 'id' | 'created_at' | 'updated_at' | 'hand_sign_changes'>): Promise<VerificationSession> {
    try {
      const response = await this.client.post('/bot/verifications', sessionData);
      logger.info('Verification session created', { sessionId: response.data.data.id });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to create verification session', { error, sessionData });
      throw error;
    }
  }

  async getPendingVerifications(): Promise<VerificationSession[]> {
    try {
      const response = await this.client.get('/bot/verifications/pending');
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get pending verifications', { error });
      throw error;
    }
  }

  async updateVerificationStatus(sessionId: string, status: VerificationSession['status'], adminNotes?: string): Promise<void> {
    try {
      await this.client.patch(`/bot/verifications/${sessionId}/status`, {
        status,
        adminNotes
      });
      logger.info('Verification status updated', { sessionId, status });
    } catch (error) {
      logger.error('Failed to update verification status', { error, sessionId, status });
      throw error;
    }
  }

  // ===== INVITE CODE MANAGEMENT =====

  async createInviteCode(inviteData: Omit<InviteCode, 'id' | 'created_at' | 'updated_at' | 'used_count'>): Promise<InviteCode> {
    try {
      const response = await this.client.post('/bot/invite-codes', inviteData);
      logger.info('Invite code created', { code: response.data.data.code });
      return response.data.data;
    } catch (error) {
      logger.error('Failed to create invite code', { error, code: inviteData.code });
      throw error;
    }
  }

  async getInviteCodeByCode(code: string): Promise<InviteCode | null> {
    try {
      const response = await this.client.get(`/bot/invite-codes/code/${code}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      logger.error('Failed to get invite code', { error, code });
      throw error;
    }
  }

  async useInviteCode(code: string): Promise<boolean> {
    try {
      const response = await this.client.post(`/bot/invite-codes/${code}/use`);
      return response.data.success;
    } catch (error) {
      logger.error('Failed to use invite code', { error, code });
      return false;
    }
  }

  async getActiveInviteCodes(): Promise<InviteCode[]> {
    try {
      const response = await this.client.get('/bot/invite-codes/active');
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get active invite codes', { error });
      throw error;
    }
  }

  async deactivateInviteCode(code: string): Promise<void> {
    try {
      await this.client.patch(`/bot/invite-codes/${code}/deactivate`);
      logger.info('Invite code deactivated', { code });
    } catch (error) {
      logger.error('Failed to deactivate invite code', { error, code });
      throw error;
    }
  }

  // ===== ANALYTICS =====

  async sendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.client.post('/bot/analytics', event);
      logger.debug('Analytics event sent', { eventType: event.event_type });
    } catch (error) {
      logger.warn('Failed to send analytics event', { error, eventType: event.event_type });
      // Analytics-Fehler sollten nicht kritisch sein
    }
  }

  async getBotStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalVerifications: number;
    pendingVerifications: number;
    totalInviteCodes: number;
    activeInviteCodes: number;
  }> {
    try {
      const response = await this.client.get('/bot/stats');
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get bot stats', { error });
      throw error;
    }
  }

  // ===== ADMIN SETTINGS =====

  async getAdminSettings(): Promise<AdminSettings> {
    try {
      const response = await this.client.get('/bot/admin/settings');
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get admin settings', { error });
      throw error;
    }
  }

  async logAdminAction(action: {
    admin_id: string;
    action_type: string;
    target_type: string;
    target_id: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.client.post('/bot/admin/actions', action);
      logger.info('Admin action logged', { actionType: action.action_type });
    } catch (error) {
      logger.warn('Failed to log admin action', { error, action });
    }
  }

  // ===== HEALTH & MONITORING =====

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    responseTime: number;
    services: {
      database: string;
      cache: string;
      api: string;
    };
  }> {
    const startTime = Date.now();
    try {
      const response = await this.client.get('/health');
      const responseTime = Date.now() - startTime;
      return {
        ...response.data.data,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Health check failed', { error, responseTime });
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime,
        services: {
          database: 'unknown',
          cache: 'unknown',
          api: 'unhealthy'
        }
      };
    }
  }

  // ===== REAL-TIME EVENTS =====

  async sendRealtimeEvent(event: {
    type: string;
    data: any;
    target?: string;
  }): Promise<void> {
    try {
      await this.client.post('/bot/events', event);
      logger.debug('Realtime event sent', { eventType: event.type });
    } catch (error) {
      logger.warn('Failed to send realtime event', { error, eventType: event.type });
    }
  }

  // ===== TICKET MANAGEMENT =====

  async createTicket(ticketData: {
    subject: string;
    summary: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    tags?: string[];
    telegramUserId: string;
  }, retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.post('/tickets', {
          ...ticketData,
          telegramUserId: ticketData.telegramUserId
        });
        logger.info('Ticket created', { ticketId: response.data.data.id });
        return response.data.data;
      } catch (error) {
        if (attempt === retries) {
          logger.error('Failed to create ticket after retries', { error, ticketData, attempts: retries });
          throw error;
        }
        logger.warn(`Failed to create ticket, retrying (${attempt}/${retries})`, { error });
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
    throw new Error('Failed to create ticket after all retries');
  }

  async getTicket(ticketId: string, retries = 2): Promise<any | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.get(`/tickets/${ticketId}`);
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null;
        }
        if (attempt === retries) {
          logger.error('Failed to get ticket after retries', { error, ticketId, attempts: retries });
          throw error;
        }
        logger.warn(`Failed to get ticket, retrying (${attempt}/${retries})`, { error, ticketId });
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    return null;
  }

  async getUserTickets(telegramUserId: string, retries = 2): Promise<any[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.get(`/tickets/user/${telegramUserId}`);
        return response.data.data || [];
      } catch (error) {
        if (attempt === retries) {
          logger.error('Failed to get user tickets after retries', { error, telegramUserId, attempts: retries });
          return []; // Return empty array on failure to prevent blocking
        }
        logger.warn(`Failed to get user tickets, retrying (${attempt}/${retries})`, { error, telegramUserId });
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    return [];
  }

  async updateTicket(ticketId: string, updates: {
    status?: 'open' | 'waiting' | 'in_progress' | 'escalated' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    assignedAgent?: string;
  }, retries = 2): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.put(`/tickets/${ticketId}`, updates);
        logger.info('Ticket updated', { ticketId, updates });
        return response.data.data;
      } catch (error) {
        if (attempt === retries) {
          logger.error('Failed to update ticket after retries', { error, ticketId, updates, attempts: retries });
          throw error;
        }
        logger.warn(`Failed to update ticket, retrying (${attempt}/${retries})`, { error, ticketId });
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    throw new Error('Failed to update ticket after all retries');
  }

  async addTicketMessage(ticketId: string, messageData: {
    from: 'bot' | 'user' | 'agent' | 'system';
    user_id: string;
    message: string;
    attachments?: any[];
  }, retries = 2): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.post(`/tickets/${ticketId}/replies`, messageData);
        logger.info('Ticket message added', { ticketId, from: messageData.from });
        return response.data.data;
      } catch (error) {
        if (attempt === retries) {
          logger.error('Failed to add ticket message after retries', { error, ticketId, messageData, attempts: retries });
          throw error;
        }
        logger.warn(`Failed to add ticket message, retrying (${attempt}/${retries})`, { error, ticketId });
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    throw new Error('Failed to add ticket message after all retries');
  }

  async updateTicketStatus(ticketId: string, status: 'open' | 'waiting' | 'in_progress' | 'escalated' | 'done', comment?: string, retries = 2): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.client.post(`/tickets/${ticketId}/status`, {
          status,
          comment
        });
        logger.info('Ticket status updated', { ticketId, status });
        return response.data.data;
      } catch (error) {
        if (attempt === retries) {
          logger.error('Failed to update ticket status after retries', { error, ticketId, status, attempts: retries });
          throw error;
        }
        logger.warn(`Failed to update ticket status, retrying (${attempt}/${retries})`, { error, ticketId });
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    throw new Error('Failed to update ticket status after all retries');
  }
}

// Factory function für einfache Instanziierung
export function createBotApiClient(config?: Partial<BotApiConfig>): BotApiClient {
  return new BotApiClient(config);
}

// Singleton instance für Bot-weite Verwendung
export const botApiClient = createBotApiClient();
