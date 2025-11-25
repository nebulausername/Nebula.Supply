import { createLogger, format, transports, Logger } from 'winston';

export interface LogContext {
  [key: string]: any;
}

class LoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.json(),
        format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

          if (Object.keys(meta).length > 0) {
            log += ` | ${JSON.stringify(meta)}`;
          }

          if (stack) {
            log += `\n${stack}`;
          }

          return log;
        })
      ),
      defaultMeta: {
        service: 'nebula-api-server',
        version: process.env.npm_package_version || '1.0.0'
      },
      transports: [
        // Console Transport für Entwicklung
        new transports.Console({
          level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        }),

        // File Transport für Production
        ...(process.env.NODE_ENV === 'production' ? [
          new transports.File({
            filename: 'logs/error.log',
            level: 'error'
          }),
          new transports.File({
            filename: 'logs/combined.log'
          })
        ] : [])
      ]
    });
  }

  info(message: string, meta?: LogContext) {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: LogContext) {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: LogContext) {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: LogContext) {
    this.logger.debug(message, meta);
  }

  // Spezielle Logging-Methoden für häufige Anwendungsfälle
  logRequest(req: any, res: any, duration: number) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
  }

  logWebSocketConnection(socketId: string, event: string, data?: any) {
    this.info('WebSocket Event', {
      socketId,
      event,
      ...(data && { data })
    });
  }

  logTicketEvent(ticketId: string, event: string, userId?: string, data?: any) {
    this.info('Ticket Event', {
      ticketId,
      event,
      userId,
      ...(data && { data })
    });
  }

  logKPIMetric(metric: string, value: number, previousValue?: number) {
    this.info('KPI Update', {
      metric,
      value,
      previousValue,
      change: previousValue ? value - previousValue : null
    });
  }

  logError(error: Error, context?: LogContext) {
    this.error(error.message, {
      stack: error.stack,
      name: error.name,
      ...context
    });
  }
}

export const logger = new LoggerService();
