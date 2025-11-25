import { Request, Response, NextFunction } from 'express';
import { structuredLogger } from '../utils/structuredLogger';

// 🚀 Performance Monitoring Middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);

  // Add request ID to request for tracking
  (req as any).requestId = requestId;

  // Monitor response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log performance metrics
    structuredLogger.performance(
      `${req.method} ${req.path}`,
      duration,
      {
        method: req.method,
        path: req.path,
        statusCode,
        requestId,
        userAgent: req.get('user-agent'),
        ip: req.ip
      }
    );

    // Warn on slow requests
    if (duration > 1000) {
      structuredLogger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration,
        statusCode,
        requestId
      });
    }

    // Error on failed requests
    if (statusCode >= 400) {
      structuredLogger.error('Request failed', undefined, {
        method: req.method,
        path: req.path,
        statusCode,
        duration,
        requestId
      });
    }
  });

  next();
};

