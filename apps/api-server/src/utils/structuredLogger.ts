import { logger } from './logger';

// 🚀 Structured Logging für bessere Analyse
export interface StructuredLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class StructuredLogger {
  private formatLog(log: StructuredLog): string {
    return JSON.stringify({
      ...log,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: 'api-server'
    });
  }

  info(message: string, context?: Record<string, any>) {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context
    };
    logger.info(this.formatLog(log));
  }

  warn(message: string, context?: Record<string, any>) {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context
    };
    logger.warn(this.formatLog(log));
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }
    };
    logger.error(this.formatLog(log));
  }

  debug(message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      const log: StructuredLog = {
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        context
      };
      logger.debug(this.formatLog(log));
    }
  }

  // 🎯 Performance Logging
  performance(operation: string, duration: number, metadata?: Record<string, any>) {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Performance: ${operation}`,
      duration,
      metadata: {
        ...metadata,
        operation
      }
    };
    logger.info(this.formatLog(log));
  }

  // 🎯 User Action Logging (Privacy-compliant)
  userAction(userId: string, action: string, details?: Record<string, any>) {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `User Action: ${action}`,
      userId,
      metadata: {
        action,
        ...details
      }
    };
    logger.info(this.formatLog(log));
  }
}

export const structuredLogger = new StructuredLogger();

