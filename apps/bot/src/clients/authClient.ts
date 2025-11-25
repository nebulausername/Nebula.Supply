import axios from 'axios';
import { logger } from '../logger';

// Minimal lokale Auth-Helpers, um Build zu ermöglichen
export interface JwtPayload {
  id: string;
  telegram_id?: number;
  role: string;
  permissions: string[];
  type: 'admin' | 'bot' | 'user';
  exp?: number;
}

function createBotToken(telegramId: number): string {
  // Fake-JWT Token (nur für lokale Entwicklung). In Produktion Shared-Auth verwenden.
  const payload: JwtPayload = {
    id: `bot-${telegramId}`,
    telegram_id: telegramId,
    role: 'bot',
    permissions: ['bot:read', 'bot:write'],
    type: 'bot',
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyAccessToken(token: string): JwtPayload {
  try {
    const json = Buffer.from(token, 'base64').toString('utf8');
    const payload = JSON.parse(json) as JwtPayload;
    return payload;
  } catch {
    throw new Error('INVALID_TOKEN');
  }
}

function refreshAccessToken(_refreshToken: string) {
  // Dummy-Implementierung: nicht verwendet
  return { accessToken: '', refreshToken: '', expiresIn: 0 };
}

// Bot-Authentifizierungs-Client
// Verwendet gemeinsames Auth-System zwischen Bot und API-Server

export interface BotAuthConfig {
  telegramId: number;
  botToken?: string;
  apiBaseUrl: string;
  refreshThreshold: number; // Minuten vor Ablauf für Refresh
}

export class BotAuthClient {
  private config: BotAuthConfig;
  private currentToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: BotAuthConfig) {
    this.config = config;

    // Erstelle initiales Bot-Token
    this.currentToken = createBotToken(config.telegramId);
    this.updateTokenExpiry();
    this.startTokenRefreshTimer();
  }

  private updateTokenExpiry(): void {
    try {
      const payload = verifyAccessToken(this.currentToken!);
      this.tokenExpiry = new Date((payload.exp || 0) * 1000);
    } catch (error) {
      logger.error('Failed to parse token expiry', { error });
      // Fallback: Token für 8 Stunden gültig
      this.tokenExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000);
    }
  }

  private startTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.tokenExpiry) return;

    const now = new Date();
    const timeUntilRefresh = this.tokenExpiry.getTime() - now.getTime() - (this.config.refreshThreshold * 60 * 1000);

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, timeUntilRefresh);
    } else {
      // Token läuft bald ab oder ist bereits abgelaufen
      this.refreshToken();
    }
  }

  private async refreshToken(): Promise<void> {
    try {
      logger.info('Refreshing bot token');

      // In echt würde hier ein Refresh Token verwendet werden
      // Für jetzt erstellen wir einfach ein neues Token
      this.currentToken = createBotToken(this.config.telegramId);
      this.updateTokenExpiry();
      this.startTokenRefreshTimer();

      logger.info('Bot token refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh bot token', { error });
      throw error;
    }
  }

  // Authentifizierter API-Client erstellen
  createAuthenticatedClient(): any {
    const client = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.currentToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Nebula-Bot-Auth/1.0',
        'X-Bot-ID': this.config.telegramId.toString()
      }
    });

    // Response Interceptor für Token-Refresh bei 401
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
          try {
            // Versuche Token zu refreshen und Request zu wiederholen
            await this.refreshToken();
            const cfg = error.config;
            cfg.headers = cfg.headers || {};
            (cfg.headers as any).Authorization = `Bearer ${this.currentToken}`;
            return axios.request(cfg);
          } catch (refreshError) {
            logger.error('Token refresh failed', { error: refreshError });
          }
        }
        return Promise.reject(error);
      }
    );

    return client;
  }

  // Token für externe Requests bereitstellen
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  // Token-Informationen abrufen
  getTokenInfo(): { token: string | null; expiry: Date | null; telegramId: number } {
    return {
      token: this.currentToken,
      expiry: this.tokenExpiry,
      telegramId: this.config.telegramId
    };
  }

  // Cleanup
  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Validierung der aktuellen Authentifizierung
  async validateAuth(): Promise<boolean> {
    try {
      if (!this.currentToken) return false;

      const payload = verifyAccessToken(this.currentToken);

      // Prüfe ob Token für diesen Bot ist
      if (payload.telegram_id !== this.config.telegramId) {
        logger.warn('Token telegram_id mismatch', {
          expected: this.config.telegramId,
          actual: payload.telegram_id
        });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Auth validation failed', { error });
      return false;
    }
  }
}

// Factory function für einfache Instanziierung
export function createBotAuthClient(config: BotAuthConfig): BotAuthClient {
  return new BotAuthClient(config);
}

// Singleton für Bot-weite Verwendung
export function initializeBotAuth(telegramId: number): BotAuthClient {
  const config: BotAuthConfig = {
    telegramId,
    apiBaseUrl: process.env.BOT_API_URL || 'http://localhost:3001/api',
    refreshThreshold: 10 // 10 Minuten vor Ablauf refreshen
  };

  return createBotAuthClient(config);
}
