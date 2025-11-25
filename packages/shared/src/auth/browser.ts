// Browser-compatible auth utilities
// This file provides client-side auth functions without Node.js dependencies

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

// Simple JWT decode without verification (client-side only)
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (middle part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decoded);

    // Check if token is expired
    if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed as JwtPayload;
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }
  return payload.exp < Math.floor(Date.now() / 1000);
}

// Get token expiration time
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) {
    return null;
  }
  return new Date(payload.exp * 1000);
}

// Get time until token expires (in seconds)
export function getTimeUntilExpiration(token: string): number {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) {
    return 0;
  }
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
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

// Token-Refresh Helper (client-side)
export function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  // This should make an API call to the server to refresh the token
  return fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      return response.json();
    })
    .then(data => data.data);
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

// Helper für client-side auth checks
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



