import { logger } from '../utils/logger';
import { Pool, QueryResult } from 'pg';

// PostgreSQL Database Service für echte Datenpersistenz
// Bot-zu-Admin Integration erfordert echte gemeinsame Datenquelle

export interface DatabaseConnection {
  isConnected: boolean;
  type: 'memory' | 'postgresql' | 'mongodb';
  pool?: Pool;
}

// Bot-Integration Types (gemeinsame Datenquelle)
export interface BotUser {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  verified_at?: string;
  personal_invite_code?: string;
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

export interface BotAnalyticsEvent {
  id: string;
  user_id?: string;
  event_type: string;
  event_data: any;
  session_id?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  metadata: any;
  created_at: string;
}

// Affiliate & Rank Aggregates
export interface Referral {
  id: string;
  inviter_id: string; // inviter user id (string) or telegram id string
  invited_telegram_id: number;
  invited_user_id?: string;
  invited_at: string;
  first_interaction_at?: string;
  status: 'pending' | 'succeeded';
}

export interface UserAggregates {
  user_id?: string;
  telegram_id: number;
  orders_count: number;
  invites_success_count: number;
  premium_invites_count?: number;
  total_revenue_eur?: number;
  commission_percentage?: number;
  vip_unlocked_at?: string;
  updated_at: string;
}

export interface DailyReward {
  id: string;
  userId: string;
  lastClaimAt: string | null;
  lastClaimDayKey: string | null;
  streak: number;
  totalCoins: number;
  createdAt: string;
  updatedAt: string;
}

// Legacy Types für Kompatibilität
export interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface Ticket {
  id: string;
  subject: string;
  summary: string;
  status: 'open' | 'waiting' | 'in_progress' | 'escalated' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  channel: string;
  assignedAgent?: string;
  unreadCount: number;
  sentiment: string;
  satisfaction?: number;
  slaDueAt?: string;
}

export interface TicketStats {

  total: number;

  open: number;

  waiting: number;

  escalated: number;

  in_progress: number;

  done: number;

  by_priority: {

    low: number;

    medium: number;

    high: number;

    critical: number;

  };

  avgResolutionTime?: number;

  avgResponseTime?: number;

  satisfactionScore?: number;

  automationDeflectionRate?: number;

}



export interface KpiSnapshot extends TicketStats {

  timestamp: string;

}



export interface TicketTrendPoint {

  timestamp: string;

  openTickets: number;

  waitingTickets: number;

  escalatedTickets: number;

  inProgressTickets: number;

  doneTickets: number;

  avgResponseTime?: number;

  avgResolutionTime?: number;

  satisfactionScore?: number;

  automationDeflectionRate?: number;

}



class DatabaseService {
  private connection: DatabaseConnection = {
    isConnected: false,
    type: (process.env.NODE_ENV === 'test' || process.env.DB_TYPE === 'memory') ? 'memory' : 'postgresql'
  };
  private pool: Pool | null = null;

  // In-Memory Storage für Tests/MVP
  private storage = {
    users: new Map<string, User>(),
    tickets: new Map<string, Ticket>(),
    sessions: new Map(),
    kpiHistory: [] as KpiSnapshot[],
    auditLogs: new Map(),
    // Bot-spezifische In-Memory Storage
    botUsers: new Map<string, BotUser>(),
    inviteCodes: new Map<string, InviteCode>(),
    verificationSessions: new Map<string, VerificationSession>(),
    botAnalyticsEvents: new Map<string, BotAnalyticsEvent>(),
    adminActions: new Map<string, AdminAction>(),
    dailyRewards: new Map<string, DailyReward>(),
    referrals: new Map<string, Referral>(),
    userAggregates: new Map<string, UserAggregates>()
  };

  getPool(): Pool | null {
    return this.pool;
  }

  async init(): Promise<void> {
    try {
      logger.info('Initialisiere Datenbank-Verbindung...', {
        type: this.connection.type,
        env: process.env.NODE_ENV
      });

      if (this.connection.type === 'memory') {
        // Für Tests und MVP In-Memory verwenden
        this.connection.isConnected = true;
        logger.info('In-Memory Datenbank bereit');
        await this.seedInitialData();
      } else if (this.connection.type === 'postgresql') {
        // PostgreSQL Verbindung aufbauen (mit Retry und Fallback)
        try {
          await this.initPostgreSQLWithRetry();
          
          // Schema sicherstellen (Fehler sollen Startup nicht verhindern)
          try { await this.createBotTables(); } catch (e) { logger.warn('Konnte Bot-Tabellen nicht erstellen:', e); }
          try { await this.migrateBotUsersPersonalInviteCode(); } catch (e) { logger.warn('Konnte Bot Users Migration nicht ausführen:', e); }
          try { await this.createImageTables(); } catch (e) { logger.warn('Konnte Image-Tabellen nicht erstellen:', e); }
          try { await this.createCookieClickerTables(); } catch (e) { logger.warn('Konnte Cookie Clicker-Tabellen nicht erstellen:', e); }
          try { await this.seedBotInitialData(); } catch (e) { logger.warn('Konnte Bot Test-Daten nicht initialisieren:', e); }
          try { await this.ensureAggregateIndices(); } catch (e) { logger.warn('Konnte Indizes nicht erstellen:', e); }
          
          logger.info('PostgreSQL Datenbank erfolgreich initialisiert');
          return;
        } catch (pgError) {
          const errorMessage = pgError instanceof Error ? pgError.message : String(pgError);
          const enableFallback = process.env.DB_ENABLE_FALLBACK !== 'false';
          
          if (enableFallback) {
            logger.warn('PostgreSQL nicht erreichbar. Fallback auf In-Memory wird aktiviert.', {
              error: errorMessage,
              hint: 'Setze DB_ENABLE_FALLBACK=false um Fallback zu deaktivieren'
            });
            
            // Pool aufräumen falls vorhanden
            if (this.pool) {
              try {
                await this.pool.end();
              } catch (e) {
                logger.debug('Fehler beim Schließen des PostgreSQL Pools:', e);
              }
              this.pool = null;
            }
            
            this.connection.type = 'memory';
            this.connection.isConnected = true;
            logger.info('In-Memory Datenbank bereit (Fallback)');
            await this.seedInitialData();
            logger.info('Datenbank erfolgreich initialisiert (In-Memory Fallback)');
            return;
          } else {
            logger.error('PostgreSQL Verbindung fehlgeschlagen und Fallback deaktiviert', {
              error: errorMessage
            });
            throw pgError;
          }
        }

      } else {
        throw new Error(`Datenbank-Typ ${this.connection.type} nicht unterstützt`);
      }
    } catch (error) {
      logger.error('Fehler bei Datenbank-Initialisierung:', error);
      throw error;
    }
  }

  private async ensureAggregateIndices() {
    if (!this.pool) return;
    const client = await this.pool.connect();
    try {
      await client.query(`CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)`);
    } finally {
      client.release();
    }
  }

  private async initPostgreSQL(): Promise<void> {
    const hasUrl = !!process.env.DATABASE_URL;
    const config: any = hasUrl
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
          port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
          database: process.env.DB_NAME || process.env.PGDATABASE || 'nebula',
          user: process.env.DB_USER || process.env.PGUSER || 'nebula',
          password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'nebula',
          // 🚀 Optimierte Connection Pool-Konfiguration
          max: parseInt(process.env.DB_POOL_MAX || '20'),
          min: parseInt(process.env.DB_POOL_MIN || '2'), // Reduziertes Minimum für bessere Performance
          idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
          connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'), // Schnellerer Timeout
          // 🎯 Statement Timeout für lange Queries
          statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'),
          // 🎯 Query Timeout
          query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000'),
          // 🎯 Zusätzliche Optimierungen
          allowExitOnIdle: true, // Erlaube Cleanup wenn idle
          keepAlive: true, // Keep-Alive für bessere Verbindungsstabilität
          keepAliveInitialDelayMillis: 10000 // Keep-Alive nach 10 Sekunden
        };

    // SSL (z.B. bei Railway/Render/Neon)
    if (process.env.DB_SSL === 'true' || process.env.PGSSLMODE === 'require') {
      config.ssl = { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
    }

    // Pool mit Error-Handling erstellen
    this.pool = new Pool(config);

    // Error-Handler für Pool-Events
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', { error: err });
    });

    this.pool.on('connect', () => {
      logger.debug('New PostgreSQL client connected');
    });

    this.pool.on('remove', () => {
      logger.debug('PostgreSQL client removed from pool');
    });

    // Teste Verbindung mit Timeout
    const client = await Promise.race([
      this.pool.connect(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), config.connectionTimeoutMillis || 2000)
      )
    ]);

    try {
      await Promise.race([
        client.query('SELECT NOW()'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 5000)
        )
      ]);
      this.connection.isConnected = true;
      this.connection.pool = this.pool;
      logger.info('PostgreSQL Verbindung erfolgreich hergestellt', {
        host: config.host || 'from DATABASE_URL',
        database: config.database || 'from DATABASE_URL',
        poolSize: config.max
      });
    } finally {
      client.release();
    }
  }

  private async initPostgreSQLWithRetry(): Promise<void> {
    const attempts = parseInt(process.env.DB_RETRY_ATTEMPTS || '5');
    const delayMs = parseInt(process.env.DB_RETRY_DELAY_MS || '1000');
    const enableFallback = process.env.DB_ENABLE_FALLBACK !== 'false'; // Default: true
    
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await this.initPostgreSQL();
        return;
      } catch (error) {
        lastError = error;
        const code = (error as any)?.code || (error as Error).message;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.warn(`PostgreSQL Verbindung fehlgeschlagen (Versuch ${attempt}/${attempts}): ${code}`, {
          attempt,
          totalAttempts: attempts,
          error: errorMessage,
          willRetry: attempt < attempts,
          fallbackEnabled: enableFallback
        });
        
        // Bei ECONNREFUSED früher abbrechen wenn Fallback aktiviert ist
        if (enableFallback && (code === 'ECONNREFUSED' || code === 'ENOTFOUND') && attempt >= 2) {
          logger.info('PostgreSQL nicht erreichbar. Fallback auf In-Memory wird aktiviert.');
          throw new Error('PostgreSQL connection refused - fallback to memory');
        }
        
        if (attempt < attempts) {
          const backoffDelay = delayMs * Math.min(attempt, 3); // Max 3x delay
          await this.sleep(backoffDelay);
        }
      }
    }
    throw lastError;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async migrateBotUsersPersonalInviteCode(): Promise<void> {
    if (!this.pool) return;
    
    const client = await this.pool.connect();
    try {
      // Check if column exists
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'bot_users' AND column_name = 'personal_invite_code'
      `);
      
      if (checkResult.rows.length === 0) {
        // Column doesn't exist, add it
        await client.query(`
          ALTER TABLE bot_users 
          ADD COLUMN personal_invite_code VARCHAR(50) UNIQUE
        `);
        logger.info('Migration: personal_invite_code Spalte zu bot_users hinzugefügt');
      } else {
        logger.info('Migration: personal_invite_code Spalte existiert bereits');
      }
    } catch (error) {
      logger.error('Fehler bei Migration personal_invite_code:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async createBotTables(): Promise<void> {
    if (!this.pool) return;

    const queries = [
      // Bot Users Table
      `CREATE TABLE IF NOT EXISTS bot_users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        username VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        verified_at TIMESTAMP,
        personal_invite_code VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Invite Codes Table
      `CREATE TABLE IF NOT EXISTS invite_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        max_uses INTEGER DEFAULT 1,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Verification Sessions Table
      `CREATE TABLE IF NOT EXISTS verification_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES bot_users(id),
        hand_sign VARCHAR(100) NOT NULL,
        hand_sign_emoji VARCHAR(10) NOT NULL,
        hand_sign_instructions TEXT,
        photo_url TEXT,
        status VARCHAR(20) DEFAULT 'pending_review',
        admin_notes TEXT,
        hand_sign_changes INTEGER DEFAULT 0,
        max_hand_sign_changes INTEGER DEFAULT 3,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Bot Analytics Events Table
      `CREATE TABLE IF NOT EXISTS bot_analytics_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES bot_users(id),
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        session_id VARCHAR(255),
        timestamp TIMESTAMP DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT
      )`,

      // Admin Actions Table
      `CREATE TABLE IF NOT EXISTS admin_actions (
        id SERIAL PRIMARY KEY,
        admin_id VARCHAR(255) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        target_type VARCHAR(100) NOT NULL,
        target_id VARCHAR(255) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Daily Rewards Table
      `CREATE TABLE IF NOT EXISTS daily_rewards (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        last_claim_at TIMESTAMP,
        last_claim_day_key VARCHAR(20),
        streak INTEGER DEFAULT 0,
        total_coins INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )`,

      // Referrals Table
      `CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        inviter_id VARCHAR(255) NOT NULL,
        invited_telegram_id BIGINT NOT NULL,
        invited_user_id VARCHAR(255),
        invited_at TIMESTAMP DEFAULT NOW(),
        first_interaction_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending'
      )`,

      // User Aggregates Table
      `CREATE TABLE IF NOT EXISTS user_aggregates (
        telegram_id BIGINT PRIMARY KEY,
        orders_count INTEGER DEFAULT 0,
        invites_success_count INTEGER DEFAULT 0,
        premium_invites_count INTEGER DEFAULT 0,
        total_revenue_eur DECIMAL(10, 2) DEFAULT 0,
        commission_percentage DECIMAL(5, 2) DEFAULT 5.00,
        vip_unlocked_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Indexes für Performance
      `CREATE INDEX IF NOT EXISTS idx_bot_users_telegram_id ON bot_users(telegram_id)`,
      `CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code)`,
      `CREATE INDEX IF NOT EXISTS idx_verification_sessions_user_status ON verification_sessions(user_id, status)`,
      `CREATE INDEX IF NOT EXISTS idx_bot_analytics_events_type_timestamp ON bot_analytics_events(event_type, timestamp)`,
      `CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_created ON admin_actions(admin_id, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id)`
    ];

    const client = await this.pool.connect();
    try {
      for (const query of queries) {
        await client.query(query);
      }
      logger.info('Bot-Tabellen erfolgreich erstellt');
    } catch (error) {
      logger.error('Fehler beim Erstellen der Bot-Tabellen:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async createImageTables(): Promise<void> {
    if (!this.pool) return;

    const queries = [
      // Images Table
      `CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        space VARCHAR(10) NOT NULL CHECK (space IN ('shop', 'drops')),
        file_key VARCHAR(500) NOT NULL UNIQUE,
        mime VARCHAR(100) NOT NULL,
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        size_bytes BIGINT NOT NULL,
        alt TEXT DEFAULT '',
        dominant_color VARCHAR(7),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Product Images Junction Table
      `CREATE TABLE IF NOT EXISTS product_images (
        product_id VARCHAR(255) NOT NULL,
        image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 0,
        is_cover BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (product_id, image_id)
      )`,

      // Drop Images Junction Table
      `CREATE TABLE IF NOT EXISTS drop_images (
        drop_id VARCHAR(255) NOT NULL,
        image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (drop_id, image_id)
      )`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS idx_images_space_created ON images(space, created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_images_file_key ON images(file_key)`,
      `CREATE INDEX IF NOT EXISTS idx_product_images_product_position ON product_images(product_id, position)`,
      `CREATE INDEX IF NOT EXISTS idx_product_images_cover ON product_images(product_id, is_cover) WHERE is_cover = TRUE`,
      `CREATE INDEX IF NOT EXISTS idx_drop_images_drop_position ON drop_images(drop_id, position)`
    ];

    const client = await this.pool.connect();
    try {
      for (const query of queries) {
        await client.query(query);
      }
      logger.info('Image-Tabellen erfolgreich erstellt');
    } catch (error) {
      logger.error('Fehler beim Erstellen der Image-Tabellen:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async createCookieClickerTables(): Promise<void> {
    if (!this.pool) return;

    const queries = [
      // Cookie Clicker Stats Table
      `CREATE TABLE IF NOT EXISTS cookie_clicker_stats (
        user_id VARCHAR(255) PRIMARY KEY,
        nickname VARCHAR(50) UNIQUE,
        nickname_set_at TIMESTAMP,
        total_cookies BIGINT DEFAULT 0,
        cookies_per_second DECIMAL(20, 2) DEFAULT 0,
        time_played BIGINT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT NOW(),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Indexes for performance
      // 🚀 Optimierte Indizes für bessere Query-Performance
      `CREATE INDEX IF NOT EXISTS idx_cookie_stats_total_cookies ON cookie_clicker_stats(total_cookies DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_cookie_stats_cps ON cookie_clicker_stats(cookies_per_second DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_cookie_stats_time_played ON cookie_clicker_stats(time_played DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_cookie_stats_last_updated ON cookie_clicker_stats(last_updated DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_cookie_stats_nickname ON cookie_clicker_stats(nickname)`,
      // 🎯 Composite Index für häufige Leaderboard-Queries
      `CREATE INDEX IF NOT EXISTS idx_cookie_stats_leaderboard ON cookie_clicker_stats(nickname, total_cookies DESC) WHERE nickname IS NOT NULL`,
      // 🎯 Index für Active Players Queries
      `CREATE INDEX IF NOT EXISTS idx_cookie_stats_active ON cookie_clicker_stats(last_updated DESC, nickname) WHERE nickname IS NOT NULL`,

      // Player Notes Table
      `CREATE TABLE IF NOT EXISTS cookie_player_notes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        admin_id VARCHAR(255) NOT NULL,
        note TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES cookie_clicker_stats(user_id) ON DELETE CASCADE
      )`,

      // Player Tags Table
      `CREATE TABLE IF NOT EXISTS cookie_player_tags (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        tag VARCHAR(50) NOT NULL,
        admin_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, tag),
        FOREIGN KEY (user_id) REFERENCES cookie_clicker_stats(user_id) ON DELETE CASCADE
      )`,

      // Indexes for notes and tags
      `CREATE INDEX IF NOT EXISTS idx_player_notes_user_id ON cookie_player_notes(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_player_tags_user_id ON cookie_player_tags(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_player_tags_tag ON cookie_player_tags(tag)`,

      // Seasons Table
      `CREATE TABLE IF NOT EXISTS cookie_seasons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Season Leaderboard Table (snapshot at season end)
      `CREATE TABLE IF NOT EXISTS cookie_season_leaderboard (
        id SERIAL PRIMARY KEY,
        season_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        rank INTEGER NOT NULL,
        total_cookies BIGINT DEFAULT 0,
        cookies_per_second DECIMAL(20, 2) DEFAULT 0,
        time_played BIGINT DEFAULT 0,
        snapshot_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (season_id) REFERENCES cookie_seasons(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES cookie_clicker_stats(user_id) ON DELETE CASCADE,
        UNIQUE(season_id, user_id)
      )`,

      // Season Rewards Table
      `CREATE TABLE IF NOT EXISTS cookie_season_rewards (
        id SERIAL PRIMARY KEY,
        season_id INTEGER NOT NULL,
        rank_min INTEGER NOT NULL,
        rank_max INTEGER NOT NULL,
        reward_type VARCHAR(50) NOT NULL,
        reward_amount INTEGER NOT NULL,
        reward_description TEXT,
        distributed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (season_id) REFERENCES cookie_seasons(id) ON DELETE CASCADE
      )`,

      // Season Reward Distribution Table
      `CREATE TABLE IF NOT EXISTS cookie_season_reward_distributions (
        id SERIAL PRIMARY KEY,
        season_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        reward_id INTEGER NOT NULL,
        distributed_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (season_id) REFERENCES cookie_seasons(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES cookie_clicker_stats(user_id) ON DELETE CASCADE,
        FOREIGN KEY (reward_id) REFERENCES cookie_season_rewards(id) ON DELETE CASCADE
      )`,

      // Indexes for seasons
      `CREATE INDEX IF NOT EXISTS idx_seasons_active ON cookie_seasons(is_active, start_date, end_date)`,
      `CREATE INDEX IF NOT EXISTS idx_season_leaderboard_season ON cookie_season_leaderboard(season_id, rank)`,
      `CREATE INDEX IF NOT EXISTS idx_season_rewards_season ON cookie_season_rewards(season_id)`,

      // Custom Leaderboards Table
      `CREATE TABLE IF NOT EXISTS cookie_custom_leaderboards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        metric VARCHAR(50) NOT NULL,
        filter_vip_only BOOLEAN DEFAULT false,
        filter_min_prestige INTEGER,
        filter_min_achievements INTEGER,
        is_public BOOLEAN DEFAULT true,
        is_temporary BOOLEAN DEFAULT false,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Custom Leaderboard Entries Table (snapshot of rankings)
      `CREATE TABLE IF NOT EXISTS cookie_custom_leaderboard_entries (
        id SERIAL PRIMARY KEY,
        leaderboard_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        rank INTEGER NOT NULL,
        metric_value DECIMAL(20, 2) NOT NULL,
        snapshot_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (leaderboard_id) REFERENCES cookie_custom_leaderboards(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES cookie_clicker_stats(user_id) ON DELETE CASCADE,
        UNIQUE(leaderboard_id, user_id, snapshot_at)
      )`,

      // Indexes for custom leaderboards
      `CREATE INDEX IF NOT EXISTS idx_custom_leaderboards_public ON cookie_custom_leaderboards(is_public, is_temporary)`,
      `CREATE INDEX IF NOT EXISTS idx_custom_leaderboard_entries_leaderboard ON cookie_custom_leaderboard_entries(leaderboard_id, rank)`,
      `CREATE INDEX IF NOT EXISTS idx_custom_leaderboard_entries_user ON cookie_custom_leaderboard_entries(user_id)`
    ];

    const client = await this.pool.connect();
    try {
      for (const query of queries) {
        await client.query(query);
      }
      logger.info('Cookie Clicker-Tabellen erfolgreich erstellt');
    } catch (error) {
      logger.error('Fehler beim Erstellen der Cookie Clicker-Tabellen:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async seedInitialData() {
    // Füge Test-Benutzer hinzu
    const testUser: User = {
      id: 'admin-1',
      email: 'admin@nebula.local',
      password: '$2a$10$hashedpassword', // In echt: bcrypt hash
      role: 'admin',
      permissions: ['tickets:read', 'tickets:write', 'dashboard:read', 'kpi:read'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    this.storage.users.set('admin-1', testUser);

    // Füge Test-Tickets hinzu
    const testTickets: Ticket[] = [
      {
        id: 'T-582',
        subject: 'Lieferung verzoegert',
        summary: 'Tracking haengt seit drei Tagen bei DHL fest.',
        status: 'waiting',
        priority: 'high',
        category: 'shipping',
        tags: ['dhl', 'vip'],
        createdAt: '2025-09-18T08:42:00.000Z',
        updatedAt: '2025-09-20T11:15:00.000Z',
        channel: 'telegram',
        assignedAgent: 'Lea',
        unreadCount: 2,
        sentiment: 'negative',
        slaDueAt: '2025-09-20T12:00:00.000Z'
      },
      {
        id: 'T-575',
        subject: 'Checkout Fehler',
        summary: 'Fehlercode 1207 waehrend Apple Pay.',
        status: 'escalated',
        priority: 'critical',
        category: 'payment',
        tags: ['checkout', 'bug'],
        createdAt: '2025-09-16T09:02:00.000Z',
        updatedAt: '2025-09-20T09:30:00.000Z',
        channel: 'telegram',
        assignedAgent: 'Ops-Team',
        unreadCount: 3,
        sentiment: 'negative',
        slaDueAt: '2025-09-20T11:00:00.000Z'
      }
    ];

    testTickets.forEach(ticket => {
      this.storage.tickets.set(ticket.id, ticket);
    });

    logger.info('Legacy Test-Daten initialisiert');
  }

  private async seedBotInitialData() {
    // Bot-spezifische Test-Daten für PostgreSQL
    if (this.connection.type !== 'postgresql') return;

    try {
      // Füge Test Bot-Users hinzu
      const testBotUsers: BotUser[] = [
        {
          id: 'bot-user-1',
          telegram_id: 123456789,
          username: 'testuser1',
          first_name: 'Test',
          last_name: 'User',
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'bot-user-2',
          telegram_id: 987654321,
          username: 'testuser2',
          first_name: 'Another',
          last_name: 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      for (const user of testBotUsers) {
        await this.pool!.query(
          `INSERT INTO bot_users (telegram_id, username, first_name, last_name, verified_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (telegram_id) DO NOTHING`,
          [user.telegram_id, user.username, user.first_name, user.last_name, user.verified_at, user.created_at, user.updated_at]
        );
      }

      // Füge Test Invite-Codes hinzu
      const testInviteCodes: InviteCode[] = [
        {
          id: 'invite-1',
          code: 'TEST123',
          created_by: 'admin-1',
          max_uses: 5,
          used_count: 2,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'invite-2',
          code: 'VIP456',
          created_by: 'admin-1',
          max_uses: 1,
          used_count: 0,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h gültig
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      for (const invite of testInviteCodes) {
        await this.pool!.query(
          `INSERT INTO invite_codes (code, created_by, max_uses, used_count, expires_at, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (code) DO NOTHING`,
          [invite.code, invite.created_by, invite.max_uses, invite.used_count, invite.expires_at, invite.is_active, invite.created_at, invite.updated_at]
        );
      }

      logger.info('Bot Test-Daten initialisiert');
    } catch (error) {
      logger.warn('Fehler beim Initialisieren der Bot Test-Daten:', error);
    }
  }

  // Generic CRUD Operations
  async findOne<T>(collection: keyof typeof this.storage, id: string): Promise<T | null> {
    const item = this.storage[collection].get(id);
    return item || null;
  }

  async findMany<T>(
    collection: keyof typeof this.storage,
    filter?: Partial<T>
  ): Promise<T[]> {
    const items = Array.from(this.storage[collection].values()) as T[];

    if (!filter) return items;

    return items.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        return (item as any)[key] === value;
      });
    });
  }

  async create<T>(collection: keyof typeof this.storage, data: T): Promise<T> {
    const id = (data as any).id || this.generateId();
    const item = { ...data, id, createdAt: new Date().toISOString() };

    this.storage[collection].set(id, item);
    return item as T;
  }

  async update<T>(
    collection: keyof typeof this.storage,
    id: string,
    data: Partial<T>
  ): Promise<T | null> {
    const existing = this.storage[collection].get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.storage[collection].set(id, updated);
    return updated as T;
  }

  async delete(collection: keyof typeof this.storage, id: string): Promise<boolean> {
    return this.storage[collection].delete(id);
  }

  // Spezielle Ticket-Methoden
  async getTickets(filter?: {
    status?: string;
    priority?: string;
    assignedAgent?: string;
    limit?: number;
    offset?: number;
    telegramUserId?: string;
    userId?: string;
  }) {
    // Use database-level filtering for better performance
    if (this.connection.type === 'postgresql' && this.pool) {
      try {
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (filter?.status) {
          conditions.push(`status = $${paramIndex++}`);
          params.push(filter.status);
        }

        if (filter?.priority) {
          conditions.push(`priority = $${paramIndex++}`);
          params.push(filter.priority);
        }

        if (filter?.assignedAgent) {
          conditions.push(`"assignedAgent" = $${paramIndex++}`);
          params.push(filter.assignedAgent);
        }

        if (filter?.telegramUserId) {
          conditions.push(`("telegramUserId" = $${paramIndex} OR "userId" = $${paramIndex})`);
          params.push(filter.telegramUserId);
          paramIndex++;
        } else if (filter?.userId) {
          conditions.push(`("userId" = $${paramIndex} OR "telegramUserId" = $${paramIndex})`);
          params.push(filter.userId);
          paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limitClause = filter?.limit ? `LIMIT $${paramIndex++}` : '';
        const offsetClause = filter?.offset ? `OFFSET $${paramIndex++}` : '';
        
        if (filter?.limit) params.push(filter.limit);
        if (filter?.offset) params.push(filter.offset);

        const query = `
          SELECT * FROM tickets 
          ${whereClause}
          ORDER BY "updatedAt" DESC, "createdAt" DESC
          ${limitClause}
          ${offsetClause}
        `;

        const client = await this.pool.connect();
        try {
          const result = await client.query(query, params);
          return result.rows;
        } finally {
          client.release();
        }
      } catch (error) {
        logger.warn('PostgreSQL query failed, falling back to in-memory filter', { error });
        // Fall through to in-memory filtering
      }
    }

    // Fallback to in-memory filtering for memory database or if PostgreSQL query fails
    let tickets = await this.findMany('tickets');

    if (filter?.status) {
      tickets = tickets.filter(t => t.status === filter.status);
    }

    if (filter?.priority) {
      tickets = tickets.filter(t => t.priority === filter.priority);
    }

    if (filter?.assignedAgent) {
      tickets = tickets.filter(t => t.assignedAgent === filter.assignedAgent);
    }

    if (filter?.telegramUserId) {
      const searchId = String(filter.telegramUserId);
      tickets = tickets.filter(t => {
        const ticket = t as any;
        return String(ticket.telegramUserId || '') === searchId || 
               String(ticket.userId || '') === searchId;
      });
    } else if (filter?.userId) {
      const searchId = String(filter.userId);
      tickets = tickets.filter(t => {
        const ticket = t as any;
        return String(ticket.userId || '') === searchId || 
               String(ticket.telegramUserId || '') === searchId;
      });
    }

    // Sort by updatedAt descending
    tickets.sort((a: any, b: any) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });

    if (filter?.offset) {
      tickets = tickets.slice(filter.offset);
    }

    if (filter?.limit) {
      tickets = tickets.slice(0, filter.limit);
    }

    return tickets;
  }


async getTicketStats(options: { recordSnapshot?: boolean } = {}): Promise<TicketStats> {
  const { recordSnapshot = true } = options;
  const tickets = await this.findMany('tickets') as Ticket[];

  const doneTickets = tickets.filter(ticket => ticket.status === 'done');
  const respondedTickets = tickets.filter(ticket => ticket.status !== 'open');

  const resolutionMinutes = doneTickets.reduce((acc, ticket) => {
    const created = new Date(ticket.createdAt).getTime();
    const updated = new Date(ticket.updatedAt).getTime();
    if (!updated || updated <= created) {
      return acc;
    }
    return acc + (updated - created) / (1000 * 60);
  }, 0);

  const responseMinutes = respondedTickets.reduce((acc, ticket) => {
    const created = new Date(ticket.createdAt).getTime();
    const updated = new Date(ticket.updatedAt).getTime();
    if (!updated || updated <= created) {
      return acc;
    }
    return acc + (updated - created) / (1000 * 60);
  }, 0);

  const satisfactionValues = tickets
    .map(ticket => ticket.satisfaction)
    .filter((value): value is number => typeof value === 'number');

  const automationHandled = tickets.filter(ticket =>
    (ticket.tags || []).some(tag => tag.toLowerCase().includes('automation'))
  );

  const stats: TicketStats = {
    total: tickets.length,
    open: tickets.filter(ticket => ticket.status === 'open').length,
    waiting: tickets.filter(ticket => ticket.status === 'waiting').length,
    escalated: tickets.filter(ticket => ticket.status === 'escalated').length,
    in_progress: tickets.filter(ticket => ticket.status === 'in_progress').length,
    done: tickets.filter(ticket => ticket.status === 'done').length,
    by_priority: {
      low: tickets.filter(ticket => ticket.priority === 'low').length,
      medium: tickets.filter(ticket => ticket.priority === 'medium').length,
      high: tickets.filter(ticket => ticket.priority === 'high').length,
      critical: tickets.filter(ticket => ticket.priority === 'critical').length,
    },
    avgResolutionTime: doneTickets.length ? Math.round(resolutionMinutes / doneTickets.length) : undefined,
    avgResponseTime: respondedTickets.length ? Math.round(responseMinutes / respondedTickets.length) : undefined,
    satisfactionScore: satisfactionValues.length
      ? Number((satisfactionValues.reduce((acc, value) => acc + value, 0) / satisfactionValues.length).toFixed(2))
      : undefined,
    automationDeflectionRate: tickets.length
      ? Number((automationHandled.length / tickets.length).toFixed(2))
      : undefined,
  };

  const timestamp = new Date().toISOString();

  if (recordSnapshot) {
    this.recordKpiSnapshot(stats, timestamp);
  }

  return { ...stats, timestamp };
}




private recordKpiSnapshot(stats: TicketStats & { timestamp?: string }, timestamp = stats.timestamp ?? new Date().toISOString()) {

  const snapshot: KpiSnapshot = {

    ...stats,

    timestamp

  };



  const history = this.storage.kpiHistory;

  const last = history[history.length - 1];



  if (last) {

    const lastTime = new Date(last.timestamp).getTime();

    const currentTime = new Date(snapshot.timestamp).getTime();

    if (Math.abs(currentTime - lastTime) < 10_000) {

      history[history.length - 1] = snapshot;

    } else {

      history.push(snapshot);

    }

  } else {

    history.push(snapshot);

  }



  const maxHistoryLength = 288;

  if (history.length > maxHistoryLength) {

    history.splice(0, history.length - maxHistoryLength);

  }

}



private getKpiSnapshots(options: { since?: Date; limit?: number } = {}): KpiSnapshot[] {

  const { since, limit } = options;

  let history = [...this.storage.kpiHistory];



  if (since) {

    const sinceTime = since.getTime();

    history = history.filter(snapshot => new Date(snapshot.timestamp).getTime() >= sinceTime);

  }



  if (limit && history.length > limit) {

    history = history.slice(-limit);

  }



  return history;

}



private aggregateSnapshots(snapshots: KpiSnapshot[]): KpiSnapshot {

  if (!snapshots.length) {

    return {

      timestamp: new Date().toISOString(),

      total: 0,

      open: 0,

      waiting: 0,

      escalated: 0,

      in_progress: 0,

      done: 0,

      by_priority: {

        low: 0,

        medium: 0,

        high: 0,

        critical: 0

      }

    };

  }



  const bucketSize = snapshots.length;

  const sums = snapshots.reduce(

    (acc, snapshot) => {

      acc.total += snapshot.total;

      acc.open += snapshot.open;

      acc.waiting += snapshot.waiting;

      acc.escalated += snapshot.escalated;

      acc.in_progress += snapshot.in_progress;

      acc.done += snapshot.done;

      acc.by_priority.low += snapshot.by_priority.low;

      acc.by_priority.medium += snapshot.by_priority.medium;

      acc.by_priority.high += snapshot.by_priority.high;

      acc.by_priority.critical += snapshot.by_priority.critical;



      if (typeof snapshot.avgResolutionTime === 'number') {

        acc.avgResolutionTime.sum += snapshot.avgResolutionTime;

        acc.avgResolutionTime.count += 1;

      }

      if (typeof snapshot.avgResponseTime === 'number') {

        acc.avgResponseTime.sum += snapshot.avgResponseTime;

        acc.avgResponseTime.count += 1;

      }

      if (typeof snapshot.satisfactionScore === 'number') {

        acc.satisfactionScore.sum += snapshot.satisfactionScore;

        acc.satisfactionScore.count += 1;

      }

      if (typeof snapshot.automationDeflectionRate === 'number') {

        acc.automationDeflectionRate.sum += snapshot.automationDeflectionRate;

        acc.automationDeflectionRate.count += 1;

      }



      return acc;

    },

    {

      total: 0,

      open: 0,

      waiting: 0,

      escalated: 0,

      in_progress: 0,

      done: 0,

      by_priority: {

        low: 0,

        medium: 0,

        high: 0,

        critical: 0

      },

      avgResolutionTime: { sum: 0, count: 0 },

      avgResponseTime: { sum: 0, count: 0 },

      satisfactionScore: { sum: 0, count: 0 },

      automationDeflectionRate: { sum: 0, count: 0 }

    }

  );



  const base = snapshots[snapshots.length - 1];



  return {

    timestamp: base.timestamp,

    total: Math.round(sums.total / bucketSize),

    open: Math.round(sums.open / bucketSize),

    waiting: Math.round(sums.waiting / bucketSize),

    escalated: Math.round(sums.escalated / bucketSize),

    in_progress: Math.round(sums.in_progress / bucketSize),

    done: Math.round(sums.done / bucketSize),

    by_priority: {

      low: Math.round(sums.by_priority.low / bucketSize),

      medium: Math.round(sums.by_priority.medium / bucketSize),

      high: Math.round(sums.by_priority.high / bucketSize),

      critical: Math.round(sums.by_priority.critical / bucketSize)

    },

    avgResolutionTime: sums.avgResolutionTime.count

      ? Math.round(sums.avgResolutionTime.sum / sums.avgResolutionTime.count)

      : base.avgResolutionTime,

    avgResponseTime: sums.avgResponseTime.count

      ? Math.round(sums.avgResponseTime.sum / sums.avgResponseTime.count)

      : base.avgResponseTime,

    satisfactionScore: sums.satisfactionScore.count

      ? Number((sums.satisfactionScore.sum / sums.satisfactionScore.count).toFixed(2))

      : base.satisfactionScore,

    automationDeflectionRate: sums.automationDeflectionRate.count

      ? Number((sums.automationDeflectionRate.sum / sums.automationDeflectionRate.count).toFixed(2))

      : base.automationDeflectionRate

  };

}



async getTicketTrends(timeRange: string, metricsParam?: string[]): Promise<TicketTrendPoint[]> {

  const ranges: Record<string, number> = {

    '1h': 60 * 60 * 1000,

    '6h': 6 * 60 * 60 * 1000,

    '24h': 24 * 60 * 60 * 1000,

    '7d': 7 * 24 * 60 * 60 * 1000,

    '30d': 30 * 24 * 60 * 60 * 1000

  };



  const targetPoints: Record<string, number> = {

    '1h': 6,

    '6h': 12,

    '24h': 24,

    '7d': 28,

    '30d': 30

  };



  const windowMs = ranges[timeRange] ?? ranges['24h'];

  const since = new Date(Date.now() - windowMs);



  let history = this.getKpiSnapshots({ since });



  if (!history.length) {

    const stats = await this.getTicketStats();

    history = this.getKpiSnapshots({ since });

    if (!history.length) {

      history = [{ ...stats, timestamp: new Date().toISOString() }];

    }

  }



  const maxPoints = targetPoints[timeRange] ?? 24;

  if (history.length > maxPoints) {

    const bucketSize = Math.ceil(history.length / maxPoints);

    const aggregated: KpiSnapshot[] = [];

    for (let index = 0; index < history.length; index += bucketSize) {

      const bucket = history.slice(index, index + bucketSize);

      aggregated.push(this.aggregateSnapshots(bucket));

    }

    history = aggregated;

  }



  const metricsSet = metricsParam && metricsParam.length ? new Set(metricsParam) : null;



  return history.map(snapshot => {

    const point: TicketTrendPoint = {

      timestamp: snapshot.timestamp,

      openTickets: snapshot.open,

      waitingTickets: snapshot.waiting,

      escalatedTickets: snapshot.escalated,

      inProgressTickets: snapshot.in_progress,

      doneTickets: snapshot.done

    };



    if (!metricsSet || metricsSet.has('avgResponseTime')) {

      point.avgResponseTime = snapshot.avgResponseTime;

    }

    if (!metricsSet || metricsSet.has('avgResolutionTime')) {

      point.avgResolutionTime = snapshot.avgResolutionTime;

    }

    if (!metricsSet || metricsSet.has('satisfactionScore')) {

      point.satisfactionScore = snapshot.satisfactionScore;

    }

    if (!metricsSet || metricsSet.has('automationDeflectionRate')) {

      point.automationDeflectionRate = snapshot.automationDeflectionRate;

    }



    return point;

  });

}

  // ===== BOT-SPEZIFISCHE DATENBANK-METHODEN =====

  // Bot User Methods
  async createBotUser(userData: Omit<BotUser, 'id' | 'created_at' | 'updated_at'>): Promise<BotUser> {
    if (this.connection.type === 'memory') {
      const id = this.generateId();
      const user: BotUser = {
        id,
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.storage.botUsers.set(id, user);
      return user;
    } else {
      const query = `
        INSERT INTO bot_users (telegram_id, username, first_name, last_name, verified_at, personal_invite_code)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, telegram_id, username, first_name, last_name, verified_at, personal_invite_code, created_at, updated_at
      `;
      const result = await this.pool!.query(query, [
        userData.telegram_id, userData.username, userData.first_name,
        userData.last_name, userData.verified_at, userData.personal_invite_code || null
      ]);

      return result.rows[0];
    }
  }

  async getBotUserByTelegramId(telegramId: number): Promise<BotUser | null> {
    if (this.connection.type === 'memory') {
      for (const user of this.storage.botUsers.values()) {
        if (user.telegram_id === telegramId) return user;
      }
      return null;
    } else {
      const result = await this.pool!.query(
        'SELECT * FROM bot_users WHERE telegram_id = $1',
        [telegramId]
      );
      return result.rows[0] || null;
    }
  }

  async getBotUserById(id: number): Promise<BotUser | null> {
    if (this.connection.type === 'memory') {
      return this.storage.botUsers.get(id.toString()) || null;
    } else {
      const result = await this.pool!.query(
        'SELECT * FROM bot_users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    }
  }

  async updateBotUser(telegramId: number, updates: Partial<BotUser>): Promise<BotUser | null> {
    if (this.connection.type === 'memory') {
      const user = await this.getBotUserByTelegramId(telegramId);
      if (!user) return null;

      const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
      this.storage.botUsers.set(user.id, updated);
      return updated;
    } else {
      const setParts = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
      const values = Object.values(updates);

      const query = `
        UPDATE bot_users
        SET ${setParts}, updated_at = NOW()
        WHERE telegram_id = $1
        RETURNING *
      `;

      const result = await this.pool!.query(query, [telegramId, ...values]);
      return result.rows[0] || null;
    }
  }

  // Invite Code Methods
  async createInviteCode(inviteData: Omit<InviteCode, 'id' | 'created_at' | 'updated_at' | 'used_count'>): Promise<InviteCode> {
    if (this.connection.type === 'memory') {
      const id = this.generateId();
      const invite: InviteCode = {
        id,
        used_count: 0,
        ...inviteData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.storage.inviteCodes.set(id, invite);
      return invite;
    } else {
      const query = `
        INSERT INTO invite_codes (code, created_by, max_uses, expires_at, is_active, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await this.pool!.query(query, [
        inviteData.code, inviteData.created_by, inviteData.max_uses,
        inviteData.expires_at, inviteData.is_active, inviteData.metadata
      ]);

      return result.rows[0];
    }
  }

  async getInviteCodeByCode(code: string): Promise<InviteCode | null> {
    if (this.connection.type === 'memory') {
      for (const invite of this.storage.inviteCodes.values()) {
        if (invite.code === code && invite.is_active) return invite;
      }
      return null;
    } else {
      const result = await this.pool!.query(
        'SELECT * FROM invite_codes WHERE code = $1 AND is_active = true',
        [code]
      );
      return result.rows[0] || null;
    }
  }

  async useInviteCode(code: string): Promise<boolean> {
    if (this.connection.type === 'memory') {
      const invite = await this.getInviteCodeByCode(code);
      if (!invite || invite.used_count >= invite.max_uses) return false;

      invite.used_count++;
      invite.updated_at = new Date().toISOString();
      this.storage.inviteCodes.set(invite.id, invite);
      return true;
    } else {
      const result = await this.pool!.query(
        `UPDATE invite_codes
         SET used_count = used_count + 1, updated_at = NOW()
         WHERE code = $1 AND is_active = true AND used_count < max_uses
         RETURNING *`,
        [code]
      );
      return result.rows.length > 0;
    }
  }

  async getActiveInviteCodes(): Promise<InviteCode[]> {
    if (this.connection.type === 'memory') {
      return Array.from(this.storage.inviteCodes.values()).filter(invite => invite.is_active);
    } else {
      const result = await this.pool!.query(
        'SELECT * FROM invite_codes WHERE is_active = true ORDER BY created_at DESC'
      );
      return result.rows;
    }
  }

  async getAllInviteCodes(): Promise<InviteCode[]> {
    if (this.connection.type === 'memory') {
      return Array.from(this.storage.inviteCodes.values());
    } else {
      const result = await this.pool!.query(
        'SELECT * FROM invite_codes ORDER BY created_at DESC'
      );
      return result.rows;
    }
  }

  async deactivateInviteCode(code: string): Promise<boolean> {
    if (this.connection.type === 'memory') {
      const invite = await this.getInviteCodeByCode(code);
      if (!invite) return false;

      invite.is_active = false;
      invite.updated_at = new Date().toISOString();
      this.storage.inviteCodes.set(invite.id, invite);
      return true;
    } else {
      const result = await this.pool!.query(
        'UPDATE invite_codes SET is_active = false, updated_at = NOW() WHERE code = $1',
        [code]
      );
      return result.rowCount > 0;
    }
  }

  // Verification Session Methods
  async createVerificationSession(sessionData: Omit<VerificationSession, 'id' | 'created_at' | 'updated_at' | 'hand_sign_changes'>): Promise<VerificationSession> {
    if (this.connection.type === 'memory') {
      const id = this.generateId();
      const session: VerificationSession = {
        id,
        hand_sign_changes: 0,
        ...sessionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.storage.verificationSessions.set(id, session);
      return session;
    } else {
      const query = `
        INSERT INTO verification_sessions (user_id, hand_sign, hand_sign_emoji, hand_sign_instructions, photo_url, status, max_hand_sign_changes, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const result = await this.pool!.query(query, [
        sessionData.user_id, sessionData.hand_sign, sessionData.hand_sign_emoji,
        sessionData.hand_sign_instructions, sessionData.photo_url, sessionData.status,
        sessionData.max_hand_sign_changes, sessionData.expires_at
      ]);

      return result.rows[0];
    }
  }

  async getPendingVerificationSessions(): Promise<VerificationSession[]> {
    if (this.connection.type === 'memory') {
      return Array.from(this.storage.verificationSessions.values()).filter(
        session => session.status === 'pending_review'
      );
    } else {
      const result = await this.pool!.query(
        'SELECT * FROM verification_sessions WHERE status = $1 ORDER BY created_at ASC',
        ['pending_review']
      );
      return result.rows;
    }
  }

  async getAllVerificationSessions(): Promise<VerificationSession[]> {
    if (this.connection.type === 'memory') {
      return Array.from(this.storage.verificationSessions.values());
    } else {
      const result = await this.pool!.query(
        'SELECT * FROM verification_sessions ORDER BY created_at DESC'
      );
      return result.rows;
    }
  }

  async updateVerificationStatus(sessionId: string, status: VerificationSession['status'], adminNotes?: string): Promise<boolean> {
    if (this.connection.type === 'memory') {
      const session = this.storage.verificationSessions.get(sessionId);
      if (!session) return false;

      session.status = status;
      session.admin_notes = adminNotes;
      session.updated_at = new Date().toISOString();
      this.storage.verificationSessions.set(sessionId, session);
      return true;
    } else {
      const result = await this.pool!.query(
        'UPDATE verification_sessions SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3',
        [status, adminNotes, sessionId]
      );
      return result.rowCount > 0;
    }
  }

  // Analytics Methods
  async logBotAnalytics(event: Omit<BotAnalyticsEvent, 'id' | 'timestamp'>): Promise<BotAnalyticsEvent> {
    if (this.connection.type === 'memory') {
      const id = this.generateId();
      const analyticsEvent: BotAnalyticsEvent = {
        id,
        ...event,
        timestamp: new Date().toISOString()
      };
      this.storage.botAnalyticsEvents.set(id, analyticsEvent);
      return analyticsEvent;
    } else {
      const query = `
        INSERT INTO bot_analytics_events (user_id, event_type, event_data, session_id, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      const result = await this.pool!.query(query, [
        event.user_id, event.event_type, event.event_data,
        event.session_id, event.ip_address, event.user_agent
      ]);

      return result.rows[0];
    }
  }

  async getBotAnalytics(filter?: {
    userId?: string;
    eventType?: string;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<BotAnalyticsEvent[]> {
    if (this.connection.type === 'memory') {
      let events = Array.from(this.storage.botAnalyticsEvents.values());

      if (filter?.userId) {
        events = events.filter(e => e.user_id === filter.userId);
      }
      if (filter?.eventType) {
        events = events.filter(e => e.event_type === filter.eventType);
      }
      if (filter?.startDate) {
        events = events.filter(e => e.timestamp >= filter.startDate!);
      }
      if (filter?.endDate) {
        events = events.filter(e => e.timestamp <= filter.endDate!);
      }

      if (filter?.limit) {
        events = events.slice(0, filter.limit);
      }

      return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      let query = 'SELECT * FROM bot_analytics_events WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filter?.userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(filter.userId);
        paramIndex++;
      }
      if (filter?.eventType) {
        query += ` AND event_type = $${paramIndex}`;
        params.push(filter.eventType);
        paramIndex++;
      }
      if (filter?.startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(filter.startDate);
        paramIndex++;
      }
      if (filter?.endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(filter.endDate);
        paramIndex++;
      }

      query += ' ORDER BY timestamp DESC';

      if (filter?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filter.limit);
      }

      const result = await this.pool!.query(query, params);
      return result.rows;
    }
  }

  // Admin Action Methods
  async logAdminAction(action: Omit<AdminAction, 'id' | 'created_at'>): Promise<AdminAction> {
    if (this.connection.type === 'memory') {
      const id = this.generateId();
      const adminAction: AdminAction = {
        id,
        ...action,
        created_at: new Date().toISOString()
      };
      this.storage.adminActions.set(id, adminAction);
      return adminAction;
    } else {
      const query = `
        INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const result = await this.pool!.query(query, [
        action.admin_id, action.action_type, action.target_type,
        action.target_id, action.metadata
      ]);

      return result.rows[0];
    }
  }

  async getAdminActions(filter?: {
    adminId?: string;
    actionType?: string;
    limit?: number;
  }): Promise<AdminAction[]> {
    if (this.connection.type === 'memory') {
      let actions = Array.from(this.storage.adminActions.values());

      if (filter?.adminId) {
        actions = actions.filter(a => a.admin_id === filter.adminId);
      }
      if (filter?.actionType) {
        actions = actions.filter(a => a.action_type === filter.actionType);
      }

      if (filter?.limit) {
        actions = actions.slice(0, filter.limit);
      }

      return actions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      let query = 'SELECT * FROM admin_actions WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (filter?.adminId) {
        query += ` AND admin_id = $${paramIndex}`;
        params.push(filter.adminId);
        paramIndex++;
      }
      if (filter?.actionType) {
        query += ` AND action_type = $${paramIndex}`;
        params.push(filter.actionType);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC';

      if (filter?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filter.limit);
      }

      const result = await this.pool!.query(query, params);
      return result.rows;
    }
  }

  // Daily Rewards Methods
  async getDailyReward(userId: string): Promise<DailyReward | null> {
    if (this.connection.type === 'memory') {
      for (const reward of this.storage.dailyRewards.values()) {
        if (reward.userId === userId) return reward;
      }
      return null;
    } else {
      const result = await this.pool!.query('SELECT * FROM daily_rewards WHERE user_id = $1', [userId]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        userId: row.user_id,
        lastClaimAt: row.last_claim_at,
        lastClaimDayKey: row.last_claim_day_key,
        streak: row.streak,
        totalCoins: row.total_coins,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
  }

  // ===== Affiliate & Aggregates =====
  async createPendingReferral(inviterId: string, invitedTelegramId: number): Promise<Referral> {
    if (this.connection.type === 'memory') {
      const id = this.generateId();
      const ref: Referral = {
        id,
        inviter_id: inviterId,
        invited_telegram_id: invitedTelegramId,
        invited_at: new Date().toISOString(),
        status: 'pending'
      };
      this.storage.referrals.set(id, ref);
      return ref;
    } else {
      const result = await this.pool!.query(
        `INSERT INTO referrals (inviter_id, invited_telegram_id, status)
         VALUES ($1, $2, 'pending') RETURNING *`,
        [inviterId, invitedTelegramId]
      );
      return result.rows[0];
    }
  }

  async markReferralSucceeded(invitedTelegramId: number): Promise<Referral | null> {
    if (this.connection.type === 'memory') {
      const ref = Array.from(this.storage.referrals.values())
        .find(r => r.invited_telegram_id === invitedTelegramId && r.status === 'pending');
      if (!ref) return null;
      ref.status = 'succeeded';
      ref.first_interaction_at = new Date().toISOString();
      this.storage.referrals.set(ref.id, ref);
      // increment aggregates
      const aggKey = String(ref.invited_telegram_id);
      let agg = this.storage.userAggregates.get(aggKey);
      if (!agg) {
        agg = { 
          telegram_id: ref.invited_telegram_id, 
          orders_count: 0, 
          invites_success_count: 0, 
          premium_invites_count: 0,
          total_revenue_eur: 0,
          commission_percentage: 5.00,
          updated_at: new Date().toISOString() 
        };
      }
      agg.invites_success_count += 1;
      agg.updated_at = new Date().toISOString();
      this.storage.userAggregates.set(aggKey, agg);
      return ref;
    } else {
      const client = await this.pool!.connect();
      try {
        await client.query('BEGIN');
        const upd = await client.query(
          `UPDATE referrals SET status = 'succeeded', first_interaction_at = NOW()
           WHERE invited_telegram_id = $1 AND status = 'pending' RETURNING *`,
          [invitedTelegramId]
        );
        if (upd.rows.length === 0) { await client.query('ROLLBACK'); return null; }
        await client.query(
          `INSERT INTO user_aggregates (telegram_id, invites_success_count, updated_at)
           VALUES ($1, 1, NOW())
           ON CONFLICT (telegram_id) DO UPDATE SET invites_success_count = user_aggregates.invites_success_count + 1, updated_at = NOW()`,
          [invitedTelegramId]
        );
        await client.query('COMMIT');
        return upd.rows[0];
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
  }

  async getAffiliateOverview(inviterId: string) {
    if (this.connection.type === 'memory') {
      const all = Array.from(this.storage.referrals.values()).filter(r => r.inviter_id === inviterId);
      const succeeded = all.filter(r => r.status === 'succeeded').length;
      return { total: all.length, succeeded, pending: all.length - succeeded, conversion: all.length ? +((succeeded / all.length) * 100).toFixed(2) : 0 };
    } else {
      const result = await this.pool!.query(
        `SELECT 
           COUNT(*)::int as total,
           SUM(CASE WHEN status='succeeded' THEN 1 ELSE 0 END)::int as succeeded
         FROM referrals WHERE inviter_id = $1`,
        [inviterId]
      );
      const row = result.rows[0];
      const pending = row.total - row.succeeded;
      return { total: row.total, succeeded: row.succeeded, pending, conversion: row.total ? +((row.succeeded / row.total) * 100).toFixed(2) : 0 };
    }
  }

  async getReferrals(inviterId: string): Promise<Referral[]> {
    if (this.connection.type === 'memory') {
      return Array.from(this.storage.referrals.values()).filter(r => r.inviter_id === inviterId);
    } else {
      const result = await this.pool!.query('SELECT * FROM referrals WHERE inviter_id = $1 ORDER BY invited_at DESC', [inviterId]);
      return result.rows;
    }
  }

  async getReferralLeaderboard(limit = 20) {
    if (this.connection.type === 'memory') {
      const map = new Map<string, number>();
      for (const r of this.storage.referrals.values()) {
        if (r.status !== 'succeeded') continue;
        map.set(r.inviter_id, (map.get(r.inviter_id) || 0) + 1);
      }
      const rows = Array.from(map.entries()).map(([user, count]) => ({ user, count }));
      return rows.sort((a, b) => b.count - a.count).slice(0, limit);
    } else {
      const result = await this.pool!.query(
        `SELECT inviter_id as user, COUNT(*)::int as count FROM referrals WHERE status='succeeded' GROUP BY inviter_id ORDER BY count DESC LIMIT $1`,
        [limit]
      );
      return result.rows;
    }
  }

  async getUserAggregatesByTelegramId(telegramId: number): Promise<UserAggregates | null> {
    if (this.connection.type === 'memory') {
      return this.storage.userAggregates.get(String(telegramId)) || null;
    } else {
      const res = await this.pool!.query('SELECT * FROM user_aggregates WHERE telegram_id = $1', [telegramId]);
      return res.rows[0] || null;
    }
  }

  async updateUserAggregates(
    telegramId: number,
    updates: Partial<Omit<UserAggregates, 'telegram_id' | 'updated_at'>>
  ): Promise<UserAggregates | null> {
    if (this.connection.type === 'memory') {
      const aggKey = String(telegramId);
      let agg = this.storage.userAggregates.get(aggKey);
      if (!agg) {
        agg = {
          telegram_id: telegramId,
          orders_count: 0,
          invites_success_count: 0,
          premium_invites_count: 0,
          total_revenue_eur: 0,
          commission_percentage: 5.00,
          updated_at: new Date().toISOString()
        };
      }
      Object.assign(agg, updates);
      agg.updated_at = new Date().toISOString();
      this.storage.userAggregates.set(aggKey, agg);
      return agg;
    } else {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.orders_count !== undefined) {
        fields.push(`orders_count = $${paramIndex}`);
        values.push(updates.orders_count);
        paramIndex++;
      }
      if (updates.invites_success_count !== undefined) {
        fields.push(`invites_success_count = $${paramIndex}`);
        values.push(updates.invites_success_count);
        paramIndex++;
      }
      if (updates.premium_invites_count !== undefined) {
        fields.push(`premium_invites_count = $${paramIndex}`);
        values.push(updates.premium_invites_count);
        paramIndex++;
      }
      if (updates.total_revenue_eur !== undefined) {
        fields.push(`total_revenue_eur = $${paramIndex}`);
        values.push(updates.total_revenue_eur);
        paramIndex++;
      }
      if (updates.commission_percentage !== undefined) {
        fields.push(`commission_percentage = $${paramIndex}`);
        values.push(updates.commission_percentage);
        paramIndex++;
      }
      if (updates.vip_unlocked_at !== undefined) {
        fields.push(`vip_unlocked_at = $${paramIndex}`);
        values.push(updates.vip_unlocked_at ? new Date(updates.vip_unlocked_at) : null);
        paramIndex++;
      }

      if (fields.length === 0) {
        return await this.getUserAggregatesByTelegramId(telegramId);
      }

      fields.push(`updated_at = NOW()`);
      values.push(telegramId);

      const setClause = fields.join(', ');
      const query = `UPDATE user_aggregates SET ${setClause} WHERE telegram_id = $${paramIndex} RETURNING *`;
      
      const result = await this.pool!.query(query, values);
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      
      // If no rows updated, try to insert
      const insertQuery = `
        INSERT INTO user_aggregates (telegram_id, orders_count, invites_success_count, premium_invites_count, total_revenue_eur, commission_percentage, vip_unlocked_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;
      const insertParams = [
        telegramId,
        updates.orders_count ?? 0,
        updates.invites_success_count ?? 0,
        updates.premium_invites_count ?? 0,
        updates.total_revenue_eur ?? 0,
        updates.commission_percentage ?? 5.00,
        updates.vip_unlocked_at ? new Date(updates.vip_unlocked_at) : null
      ];
      const insertResult = await this.pool!.query(insertQuery, insertParams);
      return insertResult.rows[0] || null;
    }
  }

  async createDailyReward(data: Omit<DailyReward, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyReward> {
    if (this.connection.type === 'memory') {
      const id = this.generateId();
      const reward: DailyReward = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.storage.dailyRewards.set(id, reward);
      return reward;
    } else {
      const result = await this.pool!.query(
        `INSERT INTO daily_rewards (user_id, last_claim_at, last_claim_day_key, streak, total_coins, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [data.userId, data.lastClaimAt, data.lastClaimDayKey, data.streak, data.totalCoins]
      );
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        userId: row.user_id,
        lastClaimAt: row.last_claim_at,
        lastClaimDayKey: row.last_claim_day_key,
        streak: row.streak,
        totalCoins: row.total_coins,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
  }

  async updateDailyReward(userId: string, updates: Partial<DailyReward>): Promise<DailyReward | null> {
    if (this.connection.type === 'memory') {
      const reward = await this.getDailyReward(userId);
      if (!reward) return null;
      const updated = { ...reward, ...updates, updatedAt: new Date().toISOString() };
      this.storage.dailyRewards.set(reward.id, updated);
      return updated;
    } else {
      const setParts = Object.keys(updates)
        .filter(k => k !== 'id' && k !== 'userId' && k !== 'createdAt')
        .map((key, i) => {
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          return `${snakeKey} = $${i + 2}`;
        })
        .join(', ');
      const values = Object.keys(updates)
        .filter(k => k !== 'id' && k !== 'userId' && k !== 'createdAt')
        .map(k => (updates as any)[k]);

      const query = `UPDATE daily_rewards SET ${setParts}, updated_at = NOW() WHERE user_id = $1 RETURNING *`;
      const result = await this.pool!.query(query, [userId, ...values]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id.toString(),
        userId: row.user_id,
        lastClaimAt: row.last_claim_at,
        lastClaimDayKey: row.last_claim_day_key,
        streak: row.streak,
        totalCoins: row.total_coins,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
  }

  // Cookie Clicker Stats Methods
  async saveCookieClickerStats(userId: string, stats: {
    totalCookies: number;
    cookiesPerSecond: number;
    timePlayed: number;
    avatarUrl?: string | null;
  }): Promise<void> {
    if (this.connection.type === 'memory') {
      // In-memory storage would go here if needed
      return;
    } else {
      // 🚀 Batch-Update mit Cache-Invalidation
      const query = `
        INSERT INTO cookie_clicker_stats (user_id, total_cookies, cookies_per_second, time_played, avatar_url, last_updated)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          total_cookies = $2,
          cookies_per_second = $3,
          time_played = $4,
          avatar_url = COALESCE($5, cookie_clicker_stats.avatar_url),
          last_updated = NOW()
      `;
      await this.pool!.query(query, [
        userId,
        stats.totalCookies,
        stats.cookiesPerSecond,
        stats.timePlayed,
        stats.avatarUrl || null
      ]);

      // 🧹 Invalidate Cache nach Update
      try {
        const { cookieClickerCache } = await import('./cookieClickerCache');
        await cookieClickerCache.invalidateStats(userId);
        await cookieClickerCache.invalidateLeaderboard(); // Invalidate all leaderboards
        await cookieClickerCache.invalidateAdminStats();
      } catch (error) {
        // Silently fail cache invalidation
        if (import.meta.env?.DEV) {
          logger.warn('Failed to invalidate cache:', error);
        }
      }
    }
  }

  async getCookieClickerLeaderboard(
    type: 'totalCookies' | 'cps' | 'timePlayed',
    limit: number = 100
  ): Promise<Array<{
    userId: string;
    nickname: string | null;
    rank: number;
    totalCookies: number;
    cookiesPerSecond: number;
    timePlayed: number;
    avatarUrl: string | null;
  }>> {
    if (this.connection.type === 'memory') {
      return [];
    } else {
      // 🚀 Query-Caching für bessere Performance
      const { cookieClickerCache } = await import('./cookieClickerCache');
      
      return cookieClickerCache.getLeaderboard(
        type,
        limit,
        async () => {
          let orderBy: string;
          switch (type) {
            case 'totalCookies':
              orderBy = 'total_cookies DESC';
              break;
            case 'cps':
              orderBy = 'cookies_per_second DESC';
              break;
            case 'timePlayed':
              orderBy = 'time_played DESC';
              break;
            default:
              orderBy = 'total_cookies DESC';
          }

          // 🎯 Optimierte Query mit Index-Nutzung
          const query = `
            SELECT 
              user_id,
              nickname,
              total_cookies,
              cookies_per_second,
              time_played,
              avatar_url,
              ROW_NUMBER() OVER (ORDER BY ${orderBy}) as rank
            FROM cookie_clicker_stats
            WHERE nickname IS NOT NULL
            ORDER BY ${orderBy}
            LIMIT $1
          `;
          
          const result = await this.pool!.query(query, [limit]);
          return result.rows.map((row, index) => ({
            userId: row.user_id,
            nickname: row.nickname,
            rank: index + 1,
            totalCookies: Number(row.total_cookies),
            cookiesPerSecond: Number(row.cookies_per_second),
            timePlayed: Number(row.time_played),
            avatarUrl: row.avatar_url
          }));
        }
      );
    }
  }

  async getCookiePlayerHistory(userId: string, limit: number = 100): Promise<Array<{
    timestamp: string;
    event: string;
    data: any;
  }>> {
    // TODO: Implement history table if needed
    // For now, return empty array or mock data
    return [];
  }

  async getCookiePlayerAchievements(userId: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    unlockedAt: string;
    progress: number;
    maxProgress: number;
  }>> {
    // TODO: Implement achievements table if needed
    // For now, return empty array
    return [];
  }

  async getCookiePlayerDetailedStats(userId: string): Promise<{
    buildings: Array<{ id: string; name: string; owned: number; totalCps: number }>;
    upgrades: Array<{ id: string; name: string; owned: boolean }>;
    prestige: {
      level: number;
      points: number;
      history: Array<{ timestamp: string; level: number; points: number }>;
    };
    vip: {
      hasVip: boolean;
      tier: number;
      passiveIncome: number;
      unlockedAt: string | null;
    };
    sessions: Array<{
      startTime: string;
      endTime: string | null;
      duration: number;
      cookiesGained: number;
    }>;
    cookieHistory: Array<{
      timestamp: string;
      cookies: number;
      cps: number;
    }>;
  } | null> {
    // TODO: Implement detailed stats retrieval
    // For now, return mock/empty data
    return {
      buildings: [],
      upgrades: [],
      prestige: {
        level: 0,
        points: 0,
        history: []
      },
      vip: {
        hasVip: false,
        tier: 0,
        passiveIncome: 0,
        unlockedAt: null
      },
      sessions: [],
      cookieHistory: []
    };
  }

  async getCookiePlayerNotes(userId: string): Promise<Array<{
    id: number;
    note: string;
    adminId: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    if (this.connection.type === 'memory') {
      return [];
    } else {
      const query = `
        SELECT id, note, admin_id, created_at, updated_at
        FROM cookie_player_notes
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const result = await this.pool!.query(query, [userId]);
      return result.rows.map(row => ({
        id: row.id,
        note: row.note,
        adminId: row.admin_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    }
  }

  async addCookiePlayerNote(userId: string, adminId: string, note: string): Promise<{
    id: number;
    note: string;
    adminId: string;
    createdAt: string;
    updatedAt: string;
  }> {
    if (this.connection.type === 'memory') {
      return {
        id: Date.now(),
        note,
        adminId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      const query = `
        INSERT INTO cookie_player_notes (user_id, admin_id, note)
        VALUES ($1, $2, $3)
        RETURNING id, note, admin_id, created_at, updated_at
      `;
      const result = await this.pool!.query(query, [userId, adminId, note]);
      const row = result.rows[0];
      return {
        id: row.id,
        note: row.note,
        adminId: row.admin_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
  }

  async updateCookiePlayerNote(noteId: number, adminId: string, note: string): Promise<boolean> {
    if (this.connection.type === 'memory') {
      return true;
    } else {
      const query = `
        UPDATE cookie_player_notes
        SET note = $1, updated_at = NOW()
        WHERE id = $2 AND admin_id = $3
        RETURNING id
      `;
      const result = await this.pool!.query(query, [note, noteId, adminId]);
      return result.rows.length > 0;
    }
  }

  async deleteCookiePlayerNote(noteId: number, adminId: string): Promise<boolean> {
    if (this.connection.type === 'memory') {
      return true;
    } else {
      const query = `
        DELETE FROM cookie_player_notes
        WHERE id = $1 AND admin_id = $2
        RETURNING id
      `;
      const result = await this.pool!.query(query, [noteId, adminId]);
      return result.rows.length > 0;
    }
  }

  async getCookiePlayerTags(userId: string): Promise<Array<{
    id: number;
    tag: string;
    adminId: string;
    createdAt: string;
  }>> {
    if (this.connection.type === 'memory') {
      return [];
    } else {
      const query = `
        SELECT id, tag, admin_id, created_at
        FROM cookie_player_tags
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const result = await this.pool!.query(query, [userId]);
      return result.rows.map(row => ({
        id: row.id,
        tag: row.tag,
        adminId: row.admin_id,
        createdAt: row.created_at
      }));
    }
  }

  async addCookiePlayerTag(userId: string, adminId: string, tag: string): Promise<{
    id: number;
    tag: string;
    adminId: string;
    createdAt: string;
  }> {
    if (this.connection.type === 'memory') {
      return {
        id: Date.now(),
        tag,
        adminId,
        createdAt: new Date().toISOString()
      };
    } else {
      const query = `
        INSERT INTO cookie_player_tags (user_id, admin_id, tag)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, tag) DO NOTHING
        RETURNING id, tag, admin_id, created_at
      `;
      const result = await this.pool!.query(query, [userId, adminId, tag]);
      if (result.rows.length === 0) {
        // Tag already exists, fetch it
        const fetchQuery = `
          SELECT id, tag, admin_id, created_at
          FROM cookie_player_tags
          WHERE user_id = $1 AND tag = $2
        `;
        const fetchResult = await this.pool!.query(fetchQuery, [userId, tag]);
        const row = fetchResult.rows[0];
        return {
          id: row.id,
          tag: row.tag,
          adminId: row.admin_id,
          createdAt: row.created_at
        };
      }
      const row = result.rows[0];
      return {
        id: row.id,
        tag: row.tag,
        adminId: row.admin_id,
        createdAt: row.created_at
      };
    }
  }

  async removeCookiePlayerTag(userId: string, tag: string): Promise<boolean> {
    if (this.connection.type === 'memory') {
      return true;
    } else {
      const query = `
        DELETE FROM cookie_player_tags
        WHERE user_id = $1 AND tag = $2
        RETURNING id
      `;
      const result = await this.pool!.query(query, [userId, tag]);
      return result.rows.length > 0;
    }
  }

  // Season System Methods
  async createSeason(data: {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
  }): Promise<{
    id: number;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }> {
    if (this.connection.type === 'memory') {
      return {
        id: Date.now(),
        name: data.name,
        description: data.description || null,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      const query = `
        INSERT INTO cookie_seasons (name, description, start_date, end_date)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, description, start_date, end_date, is_active, created_at, updated_at
      `;
      const result = await this.pool!.query(query, [
        data.name,
        data.description || null,
        data.startDate,
        data.endDate
      ]);
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
  }

  async getSeasons(): Promise<Array<{
    id: number;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>> {
    if (this.connection.type === 'memory') {
      return [];
    } else {
      const query = `
        SELECT id, name, description, start_date, end_date, is_active, created_at, updated_at
        FROM cookie_seasons
        ORDER BY start_date DESC
      `;
      const result = await this.pool!.query(query);
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    }
  }

  async getSeason(seasonId: number): Promise<{
    id: number;
    name: string;
    description: string | null;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  } | null> {
    if (this.connection.type === 'memory') {
      return null;
    } else {
      const query = `
        SELECT id, name, description, start_date, end_date, is_active, created_at, updated_at
        FROM cookie_seasons
        WHERE id = $1
      `;
      const result = await this.pool!.query(query, [seasonId]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
  }

  async updateSeason(seasonId: number, updates: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }): Promise<boolean> {
    if (this.connection.type === 'memory') {
      return true;
    } else {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        setParts.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        setParts.push(`description = $${paramIndex++}`);
        values.push(updates.description);
      }
      if (updates.startDate !== undefined) {
        setParts.push(`start_date = $${paramIndex++}`);
        values.push(updates.startDate);
      }
      if (updates.endDate !== undefined) {
        setParts.push(`end_date = $${paramIndex++}`);
        values.push(updates.endDate);
      }
      if (updates.isActive !== undefined) {
        setParts.push(`is_active = $${paramIndex++}`);
        values.push(updates.isActive);
      }

      if (setParts.length === 0) return true;

      setParts.push(`updated_at = NOW()`);
      values.push(seasonId);

      const query = `
        UPDATE cookie_seasons
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id
      `;
      const result = await this.pool!.query(query, values);
      return result.rows.length > 0;
    }
  }

  async deleteSeason(seasonId: number): Promise<boolean> {
    if (this.connection.type === 'memory') {
      return true;
    } else {
      const query = `
        DELETE FROM cookie_seasons
        WHERE id = $1
        RETURNING id
      `;
      const result = await this.pool!.query(query, [seasonId]);
      return result.rows.length > 0;
    }
  }

  async getSeasonLeaderboard(seasonId: number, type: 'totalCookies' | 'cps' | 'timePlayed' = 'totalCookies', limit: number = 100): Promise<Array<{
    userId: string;
    nickname: string | null;
    rank: number;
    totalCookies: number;
    cookiesPerSecond: number;
    timePlayed: number;
  }>> {
    if (this.connection.type === 'memory') {
      return [];
    } else {
      let orderBy: string;
      switch (type) {
        case 'totalCookies':
          orderBy = 'total_cookies DESC';
          break;
        case 'cps':
          orderBy = 'cookies_per_second DESC';
          break;
        case 'timePlayed':
          orderBy = 'time_played DESC';
          break;
        default:
          orderBy = 'total_cookies DESC';
      }

      const query = `
        SELECT 
          sl.user_id,
          ccs.nickname,
          sl.rank,
          sl.total_cookies,
          sl.cookies_per_second,
          sl.time_played
        FROM cookie_season_leaderboard sl
        JOIN cookie_clicker_stats ccs ON sl.user_id = ccs.user_id
        WHERE sl.season_id = $1
        ORDER BY ${orderBy}
        LIMIT $2
      `;
      const result = await this.pool!.query(query, [seasonId, limit]);
      return result.rows.map(row => ({
        userId: row.user_id,
        nickname: row.nickname,
        rank: row.rank,
        totalCookies: Number(row.total_cookies),
        cookiesPerSecond: Number(row.cookies_per_second),
        timePlayed: Number(row.time_played)
      }));
    }
  }

  async snapshotSeasonLeaderboard(seasonId: number): Promise<void> {
    if (this.connection.type === 'memory') {
      return;
    } else {
      // Clear existing snapshot
      await this.pool!.query('DELETE FROM cookie_season_leaderboard WHERE season_id = $1', [seasonId]);

      // Create snapshot from current leaderboard
      const query = `
        INSERT INTO cookie_season_leaderboard (season_id, user_id, rank, total_cookies, cookies_per_second, time_played)
        SELECT 
          $1 as season_id,
          user_id,
          ROW_NUMBER() OVER (ORDER BY total_cookies DESC) as rank,
          total_cookies,
          cookies_per_second,
          time_played
        FROM cookie_clicker_stats
        WHERE nickname IS NOT NULL
        ORDER BY total_cookies DESC
        LIMIT 1000
      `;
      await this.pool!.query(query, [seasonId]);
    }
  }

  async createSeasonReward(seasonId: number, data: {
    rankMin: number;
    rankMax: number;
    rewardType: string;
    rewardAmount: number;
    rewardDescription: string;
  }): Promise<{
    id: number;
    seasonId: number;
    rankMin: number;
    rankMax: number;
    rewardType: string;
    rewardAmount: number;
    rewardDescription: string;
    distributed: boolean;
    createdAt: string;
  }> {
    if (this.connection.type === 'memory') {
      return {
        id: Date.now(),
        seasonId,
        rankMin: data.rankMin,
        rankMax: data.rankMax,
        rewardType: data.rewardType,
        rewardAmount: data.rewardAmount,
        rewardDescription: data.rewardDescription,
        distributed: false,
        createdAt: new Date().toISOString()
      };
    } else {
      const query = `
        INSERT INTO cookie_season_rewards (season_id, rank_min, rank_max, reward_type, reward_amount, reward_description)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, season_id, rank_min, rank_max, reward_type, reward_amount, reward_description, distributed, created_at
      `;
      const result = await this.pool!.query(query, [
        seasonId,
        data.rankMin,
        data.rankMax,
        data.rewardType,
        data.rewardAmount,
        data.rewardDescription
      ]);
      const row = result.rows[0];
      return {
        id: row.id,
        seasonId: row.season_id,
        rankMin: row.rank_min,
        rankMax: row.rank_max,
        rewardType: row.reward_type,
        rewardAmount: row.reward_amount,
        rewardDescription: row.reward_description,
        distributed: row.distributed,
        createdAt: row.created_at
      };
    }
  }

  async getSeasonRewards(seasonId: number): Promise<Array<{
    id: number;
    seasonId: number;
    rankMin: number;
    rankMax: number;
    rewardType: string;
    rewardAmount: number;
    rewardDescription: string;
    distributed: boolean;
    createdAt: string;
  }>> {
    if (this.connection.type === 'memory') {
      return [];
    } else {
      const query = `
        SELECT id, season_id, rank_min, rank_max, reward_type, reward_amount, reward_description, distributed, created_at
        FROM cookie_season_rewards
        WHERE season_id = $1
        ORDER BY rank_min ASC
      `;
      const result = await this.pool!.query(query, [seasonId]);
      return result.rows.map(row => ({
        id: row.id,
        seasonId: row.season_id,
        rankMin: row.rank_min,
        rankMax: row.rank_max,
        rewardType: row.reward_type,
        rewardAmount: row.reward_amount,
        rewardDescription: row.reward_description,
        distributed: row.distributed,
        createdAt: row.created_at
      }));
    }
  }

  async distributeSeasonRewards(seasonId: number): Promise<number> {
    if (this.connection.type === 'memory') {
      return 0;
    } else {
      // Get season leaderboard
      const leaderboard = await this.getSeasonLeaderboard(seasonId, 'totalCookies', 1000);
      
      // Get rewards
      const rewards = await this.getSeasonRewards(seasonId);
      
      let distributedCount = 0;
      
      for (const reward of rewards) {
        if (reward.distributed) continue;
        
        // Find players in rank range
        const eligiblePlayers = leaderboard.filter(p => 
          p.rank >= reward.rankMin && p.rank <= reward.rankMax
        );
        
        for (const player of eligiblePlayers) {
          // Record distribution
          await this.pool!.query(`
            INSERT INTO cookie_season_reward_distributions (season_id, user_id, reward_id)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
          `, [seasonId, player.userId, reward.id]);
          distributedCount++;
        }
        
        // Mark reward as distributed
        await this.pool!.query(`
          UPDATE cookie_season_rewards
          SET distributed = true
          WHERE id = $1
        `, [reward.id]);
      }
      
      return distributedCount;
    }
  }

  // Custom Leaderboards Methods
  async createCustomLeaderboard(data: {
    name: string;
    description?: string;
    metric: string;
    filter?: {
      vipOnly?: boolean;
      minPrestige?: number;
      minAchievements?: number;
    };
    isPublic: boolean;
    isTemporary: boolean;
    startDate?: string;
    endDate?: string;
    createdBy: string;
  }): Promise<{
    id: number;
    name: string;
    description: string | null;
    metric: string;
    filter: {
      vipOnly: boolean;
      minPrestige: number | null;
      minAchievements: number | null;
    };
    isPublic: boolean;
    isTemporary: boolean;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
  }> {
    if (this.connection.type === 'memory') {
      return {
        id: 1,
        name: data.name,
        description: data.description || null,
        metric: data.metric,
        filter: {
          vipOnly: data.filter?.vipOnly || false,
          minPrestige: data.filter?.minPrestige || null,
          minAchievements: data.filter?.minAchievements || null
        },
        isPublic: data.isPublic,
        isTemporary: data.isTemporary,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        createdAt: new Date().toISOString()
      };
    }

    const query = `
      INSERT INTO cookie_custom_leaderboards (
        name, description, metric, filter_vip_only, filter_min_prestige, 
        filter_min_achievements, is_public, is_temporary, start_date, end_date, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, name, description, metric, filter_vip_only, filter_min_prestige,
        filter_min_achievements, is_public, is_temporary, start_date, end_date, created_at
    `;

    const result = await this.pool!.query(query, [
      data.name,
      data.description || null,
      data.metric,
      data.filter?.vipOnly || false,
      data.filter?.minPrestige || null,
      data.filter?.minAchievements || null,
      data.isPublic,
      data.isTemporary,
      data.startDate || null,
      data.endDate || null,
      data.createdBy
    ]);

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      metric: row.metric,
      filter: {
        vipOnly: row.filter_vip_only,
        minPrestige: row.filter_min_prestige,
        minAchievements: row.filter_min_achievements
      },
      isPublic: row.is_public,
      isTemporary: row.is_temporary,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at
    };
  }

  async getCustomLeaderboards(): Promise<Array<{
    id: number;
    name: string;
    description: string | null;
    metric: string;
    filter: {
      vipOnly: boolean;
      minPrestige: number | null;
      minAchievements: number | null;
    };
    isPublic: boolean;
    isTemporary: boolean;
    startDate: string | null;
    endDate: string | null;
    createdBy: string;
    createdAt: string;
  }>> {
    if (this.connection.type === 'memory') {
      return [];
    }

    const query = `
      SELECT id, name, description, metric, filter_vip_only, filter_min_prestige,
        filter_min_achievements, is_public, is_temporary, start_date, end_date, created_by, created_at
      FROM cookie_custom_leaderboards
      ORDER BY created_at DESC
    `;

    const result = await this.pool!.query(query);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      metric: row.metric,
      filter: {
        vipOnly: row.filter_vip_only,
        minPrestige: row.filter_min_prestige,
        minAchievements: row.filter_min_achievements
      },
      isPublic: row.is_public,
      isTemporary: row.is_temporary,
      startDate: row.start_date,
      endDate: row.end_date,
      createdBy: row.created_by,
      createdAt: row.created_at
    }));
  }

  async getCustomLeaderboard(leaderboardId: number): Promise<{
    id: number;
    name: string;
    description: string | null;
    metric: string;
    filter: {
      vipOnly: boolean;
      minPrestige: number | null;
      minAchievements: number | null;
    };
    isPublic: boolean;
    isTemporary: boolean;
    startDate: string | null;
    endDate: string | null;
    createdBy: string;
    createdAt: string;
  } | null> {
    if (this.connection.type === 'memory') {
      return null;
    }

    const query = `
      SELECT id, name, description, metric, filter_vip_only, filter_min_prestige,
        filter_min_achievements, is_public, is_temporary, start_date, end_date, created_by, created_at
      FROM cookie_custom_leaderboards
      WHERE id = $1
    `;

    const result = await this.pool!.query(query, [leaderboardId]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      metric: row.metric,
      filter: {
        vipOnly: row.filter_vip_only,
        minPrestige: row.filter_min_prestige,
        minAchievements: row.filter_min_achievements
      },
      isPublic: row.is_public,
      isTemporary: row.is_temporary,
      startDate: row.start_date,
      endDate: row.end_date,
      createdBy: row.created_by,
      createdAt: row.created_at
    };
  }

  async updateCustomLeaderboard(leaderboardId: number, updates: {
    name?: string;
    description?: string;
    metric?: string;
    filter?: {
      vipOnly?: boolean;
      minPrestige?: number;
      minAchievements?: number;
    };
    isPublic?: boolean;
    isTemporary?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<boolean> {
    if (this.connection.type === 'memory') {
      return true;
    }

    const updatesList: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updatesList.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      updatesList.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.metric !== undefined) {
      updatesList.push(`metric = $${paramIndex++}`);
      values.push(updates.metric);
    }
    if (updates.filter !== undefined) {
      if (updates.filter.vipOnly !== undefined) {
        updatesList.push(`filter_vip_only = $${paramIndex++}`);
        values.push(updates.filter.vipOnly);
      }
      if (updates.filter.minPrestige !== undefined) {
        updatesList.push(`filter_min_prestige = $${paramIndex++}`);
        values.push(updates.filter.minPrestige);
      }
      if (updates.filter.minAchievements !== undefined) {
        updatesList.push(`filter_min_achievements = $${paramIndex++}`);
        values.push(updates.filter.minAchievements);
      }
    }
    if (updates.isPublic !== undefined) {
      updatesList.push(`is_public = $${paramIndex++}`);
      values.push(updates.isPublic);
    }
    if (updates.isTemporary !== undefined) {
      updatesList.push(`is_temporary = $${paramIndex++}`);
      values.push(updates.isTemporary);
    }
    if (updates.startDate !== undefined) {
      updatesList.push(`start_date = $${paramIndex++}`);
      values.push(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      updatesList.push(`end_date = $${paramIndex++}`);
      values.push(updates.endDate);
    }

    if (updatesList.length === 0) {
      return false;
    }

    updatesList.push(`updated_at = NOW()`);
    values.push(leaderboardId);

    const query = `
      UPDATE cookie_custom_leaderboards
      SET ${updatesList.join(', ')}
      WHERE id = $${paramIndex}
    `;

    const result = await this.pool!.query(query, values);
    return result.rowCount > 0;
  }

  async deleteCustomLeaderboard(leaderboardId: number): Promise<boolean> {
    if (this.connection.type === 'memory') {
      return true;
    }

    const result = await this.pool!.query(
      'DELETE FROM cookie_custom_leaderboards WHERE id = $1',
      [leaderboardId]
    );

    return result.rowCount > 0;
  }

  async getCustomLeaderboardRankings(leaderboardId: number, limit: number = 100): Promise<Array<{
    userId: string;
    nickname: string | null;
    rank: number;
    metricValue: number;
  }>> {
    if (this.connection.type === 'memory') {
      return [];
    }

    // Get leaderboard config
    const leaderboard = await this.getCustomLeaderboard(leaderboardId);
    if (!leaderboard) {
      return [];
    }

    // Build query based on metric and filters
    let metricColumn = 'total_cookies';
    switch (leaderboard.metric) {
      case 'totalCookies':
        metricColumn = 'total_cookies';
        break;
      case 'cps':
        metricColumn = 'cookies_per_second';
        break;
      case 'timePlayed':
        metricColumn = 'time_played';
        break;
      case 'cookiesLast24h':
        // This would require a separate table tracking daily cookies
        metricColumn = 'total_cookies';
        break;
      case 'cookiesLast7d':
        // This would require a separate table tracking daily cookies
        metricColumn = 'total_cookies';
        break;
      case 'efficiency':
        // Calculate efficiency as cookies per second
        metricColumn = 'cookies_per_second';
        break;
      default:
        metricColumn = 'total_cookies';
    }

    let whereClause = 'WHERE nickname IS NOT NULL';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (leaderboard.filter.vipOnly) {
      // VIP filter would require a VIP status column
      // For now, we'll skip this filter
    }
    if (leaderboard.filter.minPrestige !== null) {
      // Prestige filter would require a prestige column
      // For now, we'll skip this filter
    }
    if (leaderboard.filter.minAchievements !== null) {
      // Achievements filter would require an achievements count
      // For now, we'll skip this filter
    }

    if (leaderboard.isTemporary && leaderboard.startDate && leaderboard.endDate) {
      // For temporary leaderboards, we might want to filter by date range
      // This would require tracking when cookies were earned
    }

    const query = `
      SELECT 
        user_id,
        nickname,
        ${metricColumn} as metric_value,
        ROW_NUMBER() OVER (ORDER BY ${metricColumn} DESC) as rank
      FROM cookie_clicker_stats
      ${whereClause}
      ORDER BY ${metricColumn} DESC
      LIMIT $${paramIndex}
    `;

    const result = await this.pool!.query(query, [limit]);
    return result.rows.map(row => ({
      userId: row.user_id,
      nickname: row.nickname,
      rank: parseInt(row.rank),
      metricValue: Number(row.metric_value)
    }));
  }

  async getCookieClickerStats(userId: string): Promise<{
    userId: string;
    nickname: string | null;
    totalCookies: number;
    cookiesPerSecond: number;
    timePlayed: number;
    avatarUrl: string | null;
    nicknameSetAt: string | null;
  } | null> {
    if (this.connection.type === 'memory') {
      return null;
    } else {
      const query = `
        SELECT 
          user_id,
          nickname,
          total_cookies,
          cookies_per_second,
          time_played,
          avatar_url,
          nickname_set_at
        FROM cookie_clicker_stats
        WHERE user_id = $1
      `;
      const result = await this.pool!.query(query, [userId]);
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        userId: row.user_id,
        nickname: row.nickname,
        totalCookies: Number(row.total_cookies),
        cookiesPerSecond: Number(row.cookies_per_second),
        timePlayed: Number(row.time_played),
        avatarUrl: row.avatar_url,
        nicknameSetAt: row.nickname_set_at
      };
    }
  }

  async setCookieClickerNickname(userId: string, nickname: string, canChange: boolean): Promise<boolean> {
    if (this.connection.type === 'memory') {
      return true;
    } else {
      // Check if nickname already exists (for other users)
      const checkQuery = `
        SELECT user_id FROM cookie_clicker_stats 
        WHERE nickname = $1 AND user_id != $2
      `;
      const checkResult = await this.pool!.query(checkQuery, [nickname, userId]);
      if (checkResult.rows.length > 0) {
        return false; // Nickname already taken
      }

      // Get current stats to check if nickname is already set
      const currentStats = await this.getCookieClickerStats(userId);
      
      if (currentStats?.nickname && !canChange) {
        return false; // Nickname already set and user can't change it
      }

      const updateQuery = `
        UPDATE cookie_clicker_stats
        SET nickname = $1, nickname_set_at = COALESCE(nickname_set_at, NOW())
        WHERE user_id = $2
      `;
      
      // If user doesn't have stats yet, create them
      if (!currentStats) {
        const insertQuery = `
          INSERT INTO cookie_clicker_stats (user_id, nickname, nickname_set_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id) DO UPDATE SET nickname = $2, nickname_set_at = COALESCE(cookie_clicker_stats.nickname_set_at, NOW())
        `;
        await this.pool!.query(insertQuery, [userId, nickname]);
      } else {
        await this.pool!.query(updateQuery, [nickname, userId]);
      }
      
      return true;
    }
  }

  async checkCookieClickerNicknameExists(nickname: string): Promise<boolean> {
    if (this.connection.type === 'memory') {
      return false;
    } else {
      const query = `
        SELECT COUNT(*) as count FROM cookie_clicker_stats WHERE nickname = $1
      `;
      const result = await this.pool!.query(query, [nickname]);
      return parseInt(result.rows[0].count) > 0;
    }
  }

  // Admin: Get all players with pagination and advanced filters
  async getAllCookiePlayersWithFilters(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'totalCookies' | 'cookiesPerSecond' | 'timePlayed' | 'lastUpdated';
    sortOrder?: 'asc' | 'desc';
    filters?: {
      minCookies?: string;
      maxCookies?: string;
      minCPS?: string;
      maxCPS?: string;
      minTimePlayed?: string;
      maxTimePlayed?: string;
      hasNickname?: boolean | null;
      vipStatus?: boolean | null;
      minPrestigeLevel?: string;
      maxPrestigeLevel?: string;
      minAchievements?: string;
      maxAchievements?: string;
      lastLoginDays?: string;
      filterLogic?: 'AND' | 'OR';
    };
  }): Promise<{
    players: Array<{
      userId: string;
      nickname: string | null;
      totalCookies: number;
      cookiesPerSecond: number;
      timePlayed: number;
      avatarUrl: string | null;
      lastUpdated: string;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (this.connection.type === 'memory') {
      return { players: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    }

    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;
    const search = params.search?.trim() || '';
    const sortBy = params.sortBy || 'totalCookies';
    const sortOrder = params.sortOrder || 'desc';
    const filters = params.filters || {};
    const filterLogic = filters.filterLogic || 'AND';

    const validSortBy = ['totalCookies', 'cookiesPerSecond', 'timePlayed', 'lastUpdated'];
    const sortColumn = validSortBy.includes(sortBy) 
      ? sortBy === 'totalCookies' ? 'total_cookies' :
        sortBy === 'cookiesPerSecond' ? 'cookies_per_second' :
        sortBy === 'timePlayed' ? 'time_played' : 'last_updated'
      : 'total_cookies';

    let query = `
      SELECT 
        ccs.user_id, 
        ccs.nickname, 
        ccs.total_cookies, 
        ccs.cookies_per_second, 
        ccs.time_played, 
        ccs.avatar_url, 
        ccs.last_updated, 
        ccs.created_at,
        COALESCE((SELECT COUNT(*) FROM cookie_player_tags WHERE user_id = ccs.user_id), 0) as tag_count,
        COALESCE((SELECT COUNT(*) FROM cookie_player_notes WHERE user_id = ccs.user_id), 0) as note_count
      FROM cookie_clicker_stats ccs
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;
    const filterConditions: string[] = [];

    if (search) {
      query += ` AND (ccs.nickname ILIKE $${paramIndex} OR ccs.user_id::text ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Apply filters
    if (filters.minCookies) {
      filterConditions.push(`ccs.total_cookies >= $${paramIndex}`);
      queryParams.push(parseInt(filters.minCookies));
      paramIndex++;
    }
    if (filters.maxCookies) {
      filterConditions.push(`ccs.total_cookies <= $${paramIndex}`);
      queryParams.push(parseInt(filters.maxCookies));
      paramIndex++;
    }
    if (filters.minCPS) {
      filterConditions.push(`ccs.cookies_per_second >= $${paramIndex}`);
      queryParams.push(parseFloat(filters.minCPS));
      paramIndex++;
    }
    if (filters.maxCPS) {
      filterConditions.push(`ccs.cookies_per_second <= $${paramIndex}`);
      queryParams.push(parseFloat(filters.maxCPS));
      paramIndex++;
    }
    if (filters.minTimePlayed) {
      filterConditions.push(`ccs.time_played >= $${paramIndex}`);
      queryParams.push(parseInt(filters.minTimePlayed));
      paramIndex++;
    }
    if (filters.maxTimePlayed) {
      filterConditions.push(`ccs.time_played <= $${paramIndex}`);
      queryParams.push(parseInt(filters.maxTimePlayed));
      paramIndex++;
    }
    if (filters.hasNickname !== null && filters.hasNickname !== undefined) {
      if (filters.hasNickname) {
        filterConditions.push(`ccs.nickname IS NOT NULL`);
      } else {
        filterConditions.push(`ccs.nickname IS NULL`);
      }
    }
    if (filters.lastLoginDays) {
      const days = parseInt(filters.lastLoginDays);
      filterConditions.push(`ccs.last_updated >= NOW() - INTERVAL '${days} days'`);
    }

    // Apply filter logic (AND/OR)
    if (filterConditions.length > 0) {
      query += ` AND (${filterConditions.join(` ${filterLogic} `)})`;
    }

    // VIP Status and Prestige/Achievement filters would require joins with other tables
    // For now, we'll add them as placeholders that can be extended later

    // Count query
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await this.pool!.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query with pagination
    query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await this.pool!.query(query, queryParams);
    const totalPages = Math.ceil(total / limit);

    return {
      players: result.rows.map(row => ({
        userId: row.user_id,
        nickname: row.nickname,
        totalCookies: Number(row.total_cookies),
        cookiesPerSecond: Number(row.cookies_per_second),
        timePlayed: Number(row.time_played),
        avatarUrl: row.avatar_url,
        lastUpdated: row.last_updated,
        createdAt: row.created_at
      })),
      total,
      page,
      limit,
      totalPages
    };
  }

  // Admin: Get all players with pagination
  async getAllCookiePlayers(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'totalCookies' | 'cookiesPerSecond' | 'timePlayed' | 'lastUpdated';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    players: Array<{
      userId: string;
      nickname: string | null;
      totalCookies: number;
      cookiesPerSecond: number;
      timePlayed: number;
      avatarUrl: string | null;
      lastUpdated: string;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (this.connection.type === 'memory') {
      return { players: [], total: 0, page: 1, limit: 50, totalPages: 0 };
    }

    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;
    const search = params.search?.trim() || '';
    const sortBy = params.sortBy || 'totalCookies';
    const sortOrder = params.sortOrder || 'desc';

    const validSortBy = ['totalCookies', 'cookiesPerSecond', 'timePlayed', 'lastUpdated'];
    const sortColumn = validSortBy.includes(sortBy) 
      ? sortBy === 'totalCookies' ? 'total_cookies' :
        sortBy === 'cookiesPerSecond' ? 'cookies_per_second' :
        sortBy === 'timePlayed' ? 'time_played' : 'last_updated'
      : 'total_cookies';

    let query = `
      SELECT user_id, nickname, total_cookies, cookies_per_second, time_played, avatar_url, last_updated, created_at
      FROM cookie_clicker_stats
      WHERE 1=1
    `;
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (nickname ILIKE $${paramIndex} OR user_id::text ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM cookie_clicker_stats
      ${search ? `WHERE (nickname ILIKE $1 OR user_id::text ILIKE $1)` : ''}
    `;
    const countParams = search ? [`%${search}%`] : [];

    const [result, countResult] = await Promise.all([
      this.pool!.query(query, queryParams),
      this.pool!.query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      players: result.rows.map(row => ({
        userId: row.user_id,
        nickname: row.nickname,
        totalCookies: Number(row.total_cookies),
        cookiesPerSecond: Number(row.cookies_per_second),
        timePlayed: Number(row.time_played),
        avatarUrl: row.avatar_url,
        lastUpdated: row.last_updated,
        createdAt: row.created_at
      })),
      total,
      page,
      limit,
      totalPages
    };
  }

  // Admin: Reset player stats
  async resetCookiePlayerStats(userId: string): Promise<void> {
    if (this.connection.type === 'memory') {
      return;
    }

    const query = `
      UPDATE cookie_clicker_stats
      SET total_cookies = 0,
          cookies_per_second = 0,
          time_played = 0,
          last_updated = NOW()
      WHERE user_id = $1
    `;
    await this.pool!.query(query, [userId]);
  }

  // Admin: Adjust player stats manually
  async adjustCookiePlayerStats(userId: string, stats: {
    totalCookies?: number;
    cookiesPerSecond?: number;
    timePlayed?: number;
  }): Promise<void> {
    if (this.connection.type === 'memory') {
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (stats.totalCookies !== undefined) {
      updates.push(`total_cookies = $${paramIndex}`);
      values.push(stats.totalCookies);
      paramIndex++;
    }
    if (stats.cookiesPerSecond !== undefined) {
      updates.push(`cookies_per_second = $${paramIndex}`);
      values.push(stats.cookiesPerSecond);
      paramIndex++;
    }
    if (stats.timePlayed !== undefined) {
      updates.push(`time_played = $${paramIndex}`);
      values.push(stats.timePlayed);
      paramIndex++;
    }

    if (updates.length === 0) {
      return;
    }

    updates.push(`last_updated = NOW()`);
    values.push(userId);

    const query = `
      UPDATE cookie_clicker_stats
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex}
    `;
    await this.pool!.query(query, values);
  }

  // Admin: Reset leaderboard (all or by type)
  async resetCookieLeaderboard(type?: 'totalCookies' | 'cps' | 'timePlayed'): Promise<void> {
    if (this.connection.type === 'memory') {
      return;
    }

    if (type) {
      // Reset specific category - in this case, we just reset all stats
      // The leaderboard is calculated from stats, so resetting stats resets leaderboard
      const query = `
        UPDATE cookie_clicker_stats
        SET total_cookies = 0,
            cookies_per_second = 0,
            time_played = 0,
            last_updated = NOW()
      `;
      await this.pool!.query(query);
    } else {
      // Reset all
      const query = `
        UPDATE cookie_clicker_stats
        SET total_cookies = 0,
            cookies_per_second = 0,
            time_played = 0,
            last_updated = NOW()
      `;
      await this.pool!.query(query);
    }
  }

  // Admin: Get overall statistics
  async getCookieClickerAdminStats(): Promise<{
    totalPlayers: number;
    activePlayers24h: number;
    activePlayers7d: number;
    activePlayers30d: number;
    totalCookiesGenerated: number;
    averageCPS: number;
    averagePlaytime: number;
    topPlayer: {
      userId: string;
      nickname: string | null;
      totalCookies: number;
    } | null;
  }> {
    if (this.connection.type === 'memory') {
      return {
        totalPlayers: 0,
        activePlayers24h: 0,
        activePlayers7d: 0,
        activePlayers30d: 0,
        totalCookiesGenerated: 0,
        averageCPS: 0,
        averagePlaytime: 0,
        topPlayer: null
      };
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_players,
        COUNT(CASE WHEN last_updated > NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
        COUNT(CASE WHEN last_updated > NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
        COUNT(CASE WHEN last_updated > NOW() - INTERVAL '30 days' THEN 1 END) as active_30d,
        COALESCE(SUM(total_cookies), 0) as total_cookies,
        COALESCE(AVG(cookies_per_second), 0) as avg_cps,
        COALESCE(AVG(time_played), 0) as avg_playtime
      FROM cookie_clicker_stats
    `;

    const topPlayerQuery = `
      SELECT user_id, nickname, total_cookies
      FROM cookie_clicker_stats
      WHERE nickname IS NOT NULL
      ORDER BY total_cookies DESC
      LIMIT 1
    `;

    const [statsResult, topPlayerResult] = await Promise.all([
      this.pool!.query(statsQuery),
      this.pool!.query(topPlayerQuery)
    ]);

    const stats = statsResult.rows[0];
    const topPlayer = topPlayerResult.rows.length > 0 ? {
      userId: topPlayerResult.rows[0].user_id,
      nickname: topPlayerResult.rows[0].nickname,
      totalCookies: Number(topPlayerResult.rows[0].total_cookies)
    } : null;

    return {
      totalPlayers: parseInt(stats.total_players),
      activePlayers24h: parseInt(stats.active_24h),
      activePlayers7d: parseInt(stats.active_7d),
      activePlayers30d: parseInt(stats.active_30d),
      totalCookiesGenerated: Number(stats.total_cookies),
      averageCPS: Number(stats.avg_cps),
      averagePlaytime: Number(stats.avg_playtime),
      topPlayer
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnection(): DatabaseConnection {
    return { ...this.connection };
  }

  // Cleanup method for tests
  clearStorage() {
    Object.keys(this.storage).forEach(key => {
      this.storage[key as keyof typeof this.storage].clear();
    });
  }

  // PostgreSQL specific cleanup
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.connection.isConnected = false;
      logger.info('PostgreSQL Verbindung geschlossen');
    }
  }
}

export const databaseService = new DatabaseService();

// Initialize database connection
export const initDatabase = () => databaseService.init();
