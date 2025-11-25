import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

// Erweitere Request Interface um User
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

// JWT Payload Interface
interface JwtPayload {
  id?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  sub?: string; // For Telegram tokens: "tg:${telegramId}"
  telegramId?: number;
  username?: string;
  iat?: number;
  exp?: number;
}


export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw createError('Authorization header erforderlich', 401, 'AUTH_MISSING');
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Token erforderlich', 401, 'TOKEN_MISSING');
    }

    // Verifiziere Token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-change-in-production'
    ) as JwtPayload;

    // Handle Telegram tokens (sub: "tg:${telegramId}") or regular tokens
    let userId: string;
    if (decoded.sub && decoded.sub.startsWith('tg:')) {
      // Telegram token - use sub as user ID
      userId = decoded.sub; // "tg:123456"
    } else if (decoded.id) {
      // Regular token with id
      userId = decoded.id;
    } else {
      throw createError('Ungültiger Token-Format', 401, 'TOKEN_INVALID_FORMAT');
    }

    // Füge User zum Request hinzu
    req.user = {
      id: userId,
      email: decoded.email || '',
      role: decoded.role || 'user',
      permissions: decoded.permissions || []
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT Token Error:', { error: error.message });
      next(createError('Ungültiger Token', 401, 'TOKEN_INVALID'));
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT Token Expired:', { error: error.message });
      next(createError('Token abgelaufen', 401, 'TOKEN_EXPIRED'));
    } else {
      logger.error('Auth Middleware Error:', error);
      next(createError('Authentifizierung fehlgeschlagen', 401, 'AUTH_FAILED'));
    }
  }
};

// Admin-Only Middleware
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw createError('Authentifizierung erforderlich', 401);
  }

  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    throw createError('Admin-Berechtigung erforderlich', 403, 'ADMIN_REQUIRED');
  }

  next();
};

// Permission-based Access Control
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw createError('Authentifizierung erforderlich', 401);
    }

    if (!req.user.permissions.includes(permission)) {
      throw createError(
        `Berechtigung '${permission}' erforderlich`,
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};

// Optional Auth (fügt User hinzu wenn verfügbar)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'fallback-secret-change-in-production'
        ) as JwtPayload;

        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions || []
        };
      }
    }
  } catch (error) {
    // Bei optional auth ignorieren wir Fehler einfach
    logger.debug('Optional auth failed:', error);
  }

  next();
};
