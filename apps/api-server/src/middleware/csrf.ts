import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

// Parse cookies manually (cookie-parser not installed)
const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });
  
  return cookies;
};

/**
 * Generate a cryptographically secure CSRF token
 */
export const generateCsrfToken = (): string => {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

/**
 * CSRF protection middleware
 * Implements Double-Submit Cookie pattern
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Parse cookies manually
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[CSRF_COOKIE_NAME] || generateCsrfToken();
    
    // Set cookie with SameSite=Strict for CSRF protection
    res.setHeader('Set-Cookie', `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Max-Age=${24 * 60 * 60}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`);
    
    // Store token in response for client to read
    (res as any).csrfToken = token;
    
    return next();
  }

  // For POST, PUT, DELETE, PATCH - validate CSRF token
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME.toLowerCase()] as string;

  // In development, allow requests without CSRF token for easier testing
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (!cookieToken || !headerToken) {
    if (isDevelopment) {
      // In development, generate and set token automatically
      const autoToken = generateCsrfToken();
      res.setHeader('Set-Cookie', `${CSRF_COOKIE_NAME}=${autoToken}; Path=/; SameSite=Strict; Max-Age=${24 * 60 * 60}`);
      logger.info('CSRF token auto-generated in development', {
        ip: req.ip,
        method: req.method,
        url: req.url
      });
      return next();
    }
    
    logger.warn('CSRF token missing', {
      ip: req.ip,
      method: req.method,
      url: req.url,
      hasCookie: !!cookieToken,
      hasHeader: !!headerToken
    });

    return res.status(403).json({
      success: false,
      error: 'CSRF token missing or invalid'
    });
  }

  // Compare tokens (Double-Submit Cookie pattern)
  if (cookieToken !== headerToken) {
    if (isDevelopment) {
      // In development, allow mismatch but log warning
      logger.warn('CSRF token mismatch in development - allowing', {
        ip: req.ip,
        method: req.method,
        url: req.url
      });
      return next();
    }
    
    logger.warn('CSRF token mismatch', {
      ip: req.ip,
      method: req.method,
      url: req.url
    });

    return res.status(403).json({
      success: false,
      error: 'CSRF token mismatch'
    });
  }

  // Token is valid, proceed
  next();
};

/**
 * Get CSRF token endpoint (for client to retrieve token)
 */
export const getCsrfToken = (req: Request, res: Response): void => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[CSRF_COOKIE_NAME] || generateCsrfToken();
  
  res.setHeader('Set-Cookie', `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Max-Age=${24 * 60 * 60}; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`);

  res.json({
    success: true,
    token,
    headerName: CSRF_HEADER_NAME
  });
};

