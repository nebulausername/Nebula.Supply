import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Standard Rate Limiter für alle Endpunkte
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 1000, // 1000 Requests pro Window
  message: {
    success: false,
    error: 'Zu viele Anfragen von dieser IP-Adresse',
    retryAfter: '15 Minuten'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit überschritten:', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });

    res.status(429).json({
      success: false,
      error: 'Zu viele Anfragen von dieser IP-Adresse',
      retryAfter: '15 Minuten'
    });
  },
  skip: (req: Request) => {
    // Überspringe Rate Limiting für Health Checks
    return req.path.startsWith('/health');
  }
});

// Strenger Rate Limiter für sensible Endpunkte
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Zu viele Anfragen - bitte versuchen Sie es später erneut'
  }
});

// Authentifizierte Benutzer Rate Limiting
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Mehr für authentifizierte Benutzer
  message: {
    success: false,
    error: 'Zu viele Anfragen - bitte verlangsamen Sie Ihre Anfragen'
  },
  keyGenerator: (req: Request) => {
    // Verwende User ID für Rate Limiting wenn verfügbar
    return req.user?.id || req.ip;
  }
});

// Checkout Rate Limiter - Max 5 Checkouts pro 15 Minuten
export const checkoutRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Max 5 Checkout-Versuche
  message: {
    success: false,
    error: 'Zu viele Checkout-Versuche. Bitte warte 15 Minuten und versuche es erneut.',
    retryAfter: '15 Minuten'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if available, otherwise IP
    const userId = (req as any).user?.id || req.headers['x-user-id'] || req.ip;
    return `checkout:${userId}`;
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Checkout rate limit überschritten:', {
      ip: req.ip,
      userId: (req as any).user?.id || req.headers['x-user-id'],
      url: req.url
    });

    res.status(429).json({
      success: false,
      error: 'Zu viele Checkout-Versuche. Bitte warte 15 Minuten und versuche es erneut.',
      retryAfter: '15 Minuten'
    });
  }
});

// Cart Update Rate Limiter - Max 10 Updates pro Minute
export const cartUpdateRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 10, // Max 10 Cart-Updates
  message: {
    success: false,
    error: 'Zu viele Cart-Updates. Bitte verlangsame deine Anfragen.',
    retryAfter: '1 Minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || req.headers['x-user-id'] || req.ip;
    return `cart:${userId}`;
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Cart update rate limit überschritten:', {
      ip: req.ip,
      userId: (req as any).user?.id || req.headers['x-user-id'],
      url: req.url
    });

    res.status(429).json({
      success: false,
      error: 'Zu viele Cart-Updates. Bitte verlangsame deine Anfragen.',
      retryAfter: '1 Minute'
    });
  }
});
