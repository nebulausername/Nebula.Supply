import jwt from 'jsonwebtoken';

// Gemeinsame Authentifizierung für alle Nebula Services
// Bot, API-Server und Admin Dashboard verwenden dasselbe System

export interface JwtPayload {
  id: string;
  email?: string;
  telegram_id?: number;
  role: string;
  permissions: string[];
  type: 'admin' | 'bot' | 'user';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email?: string;
  telegram_id?: number;
  role: string;
  permissions: string[];
  type: 'admin' | 'bot' | 'user';
}

// JWT Konfiguration
export const JWT_CONFIG = {
  accessTokenExpiry: '8h',
  refreshTokenExpiry: '7d',
  issuer: 'nebula-auth-system',
  audience: 'nebula-services',
  secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production'
};

// Token erstellen
export function createAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      iss: JWT_CONFIG.issuer,
      aud: JWT_CONFIG.audience
    },
    JWT_CONFIG.secret,
    { expiresIn: JWT_CONFIG.accessTokenExpiry as string }
  );
}

export function createRefreshToken(payload: { id: string; type: string }): string {
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      iss: JWT_CONFIG.issuer,
      aud: JWT_CONFIG.audience
    },
    JWT_CONFIG.refreshSecret,
    { expiresIn: JWT_CONFIG.refreshTokenExpiry as string }
  );
}

// Token verifizieren
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_CONFIG.secret) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_TOKEN');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw error;
  }
}

export function verifyRefreshToken(token: string): { id: string; type: string } {
  try {
    return jwt.verify(token, JWT_CONFIG.refreshSecret) as { id: string; type: string };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_REFRESH_TOKEN');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error('REFRESH_TOKEN_EXPIRED');
    }
    throw error;
  }
}

// Bot-spezifische Token-Erstellung
export function createBotToken(telegramId: number, role: string = 'bot'): string {
  return createAccessToken({
    id: `bot-${telegramId}`,
    telegram_id: telegramId,
    role,
    permissions: ['bot:read', 'bot:write'],
    type: 'bot'
  });
}

// Admin-spezifische Token-Erstellung
export function createAdminToken(userId: string, email: string, role: string, permissions: string[]): string {
  return createAccessToken({
    id: userId,
    email,
    role,
    permissions,
    type: 'admin'
  });
}

// User-spezifische Token-Erstellung
export function createUserToken(userId: string, telegramId?: number): string {
  return createAccessToken({
    id: userId,
    telegram_id: telegramId,
    role: 'user',
    permissions: ['user:read'],
    type: 'user'
  });
}

// Berechtigungsprüfung
export function hasPermission(user: AuthUser | JwtPayload, permission: string): boolean {
  return user.permissions.includes(permission);
}

export function hasRole(user: AuthUser | JwtPayload, role: string): boolean {
  return user.role === role;
}

export function isAdmin(user: AuthUser | JwtPayload): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}

export function isBot(user: AuthUser | JwtPayload): boolean {
  return user.type === 'bot';
}

export function isUser(user: AuthUser | JwtPayload): boolean {
  return user.type === 'user';
}

// Middleware Helper für Express
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

// Token-Refresh Helper
export function refreshAccessToken(refreshToken: string): AuthTokens {
  const decoded = verifyRefreshToken(refreshToken);

  // Erstelle neuen Access Token basierend auf dem Refresh Token
  const newAccessToken = createAccessToken({
    id: decoded.id,
    role: 'user', // In echt würde die echte Rolle aus der Datenbank kommen
    permissions: ['user:read'],
    type: decoded.type as any
  });

  const newRefreshToken = createRefreshToken({
    id: decoded.id,
    type: decoded.type
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 8 * 60 * 60 // 8 Stunden in Sekunden
  };
}

// Environment-basierte Konfiguration
export function getAuthConfig() {
  return {
    jwt: JWT_CONFIG,
    adminIds: (process.env.ADMIN_IDS || '').split(',').filter(Boolean),
    botApiKey: process.env.BOT_API_KEY,
    enableVerification: process.env.ENABLE_VERIFICATION !== 'false',
    enableInviteSystem: process.env.ENABLE_INVITE_SYSTEM !== 'false'
  };
}

// Error Types für bessere Fehlerbehandlung
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Häufige Auth-Fehler
export const AUTH_ERRORS = {
  MISSING_TOKEN: new AuthError('Authorization header required', 'AUTH_MISSING', 401),
  INVALID_TOKEN: new AuthError('Invalid token', 'TOKEN_INVALID', 401),
  EXPIRED_TOKEN: new AuthError('Token expired', 'TOKEN_EXPIRED', 401),
  INSUFFICIENT_PERMISSIONS: new AuthError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS', 403),
  ADMIN_REQUIRED: new AuthError('Admin access required', 'ADMIN_REQUIRED', 403),
  BOT_ACCESS_DENIED: new AuthError('Bot access denied', 'BOT_ACCESS_DENIED', 403)
};

// Helper für Middleware
export function requireAuth(requiredPermissions?: string[]) {
  return (user?: AuthUser | JwtPayload) => {
    if (!user) {
      throw AUTH_ERRORS.MISSING_TOKEN;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission =>
        hasPermission(user, permission)
      );

      if (!hasAllPermissions) {
        throw AUTH_ERRORS.INSUFFICIENT_PERMISSIONS;
      }
    }
  };
}

export function requireAdmin(user?: AuthUser | JwtPayload) {
  if (!user || !isAdmin(user)) {
    throw AUTH_ERRORS.ADMIN_REQUIRED;
  }
}

export function requireBot(user?: AuthUser | JwtPayload) {
  if (!user || !isBot(user)) {
    throw AUTH_ERRORS.BOT_ACCESS_DENIED;
  }
}
