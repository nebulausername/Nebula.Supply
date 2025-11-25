import { ErrorManager, ManagedError, ErrorCategory, ErrorSeverity, getErrorManager } from './ErrorManager';
import { logger } from '../logger';

export interface ErrorLogEntry {
  id: string;
  errorId: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  retryCount: number;
}

export interface ErrorLogFilter {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  resolved?: boolean;
  startDate?: Date;
  endDate?: Date;
  component?: string;
}

class ErrorLogger {
  private errorManager: ErrorManager;
  private logs: ErrorLogEntry[] = [];
  private maxLogs: number = 1000;
  private listeners: Set<(entry: ErrorLogEntry) => void> = new Set();

  constructor(errorManager?: ErrorManager) {
    this.errorManager = errorManager || getErrorManager();
    this.setupErrorManagerListener();
  }

  private setupErrorManagerListener(): void {
    this.errorManager.on('error', (error: ManagedError) => {
      this.logError(error);
    });

    this.errorManager.on('resolved', (error: ManagedError) => {
      this.updateLogEntry(error);
    });
  }

  private logError(error: ManagedError): void {
    const entry: ErrorLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorId: error.id,
      message: error.error.message,
      category: error.category,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
      resolved: error.resolved,
      retryCount: error.retryCount
    };

    this.logs.push(entry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console/remote service
    this.writeLog(entry);

    // Notify listeners
    this.notifyListeners(entry);
  }

  private updateLogEntry(error: ManagedError): void {
    const entry = this.logs.find(log => log.errorId === error.id);
    if (entry) {
      entry.resolved = error.resolved;
      entry.retryCount = error.retryCount;
      this.notifyListeners(entry);
    }
  }

  private writeLog(entry: ErrorLogEntry): void {
    const logLevel = this.getLogLevel(entry.severity);
    const logMessage = `[ErrorLogger] ${entry.category}/${entry.severity}: ${entry.message}`;
    const logData = {
      id: entry.id,
      errorId: entry.errorId,
      category: entry.category,
      severity: entry.severity,
      context: entry.context,
      timestamp: entry.timestamp.toISOString()
    };

    switch (logLevel) {
      case 'error':
        logger.error(logMessage, logData);
        break;
      case 'warn':
        logger.warn(logMessage, logData);
        break;
      case 'info':
        logger.info(logMessage, logData);
        break;
      default:
        logger.log(logMessage, logData);
    }

    // In production, send to remote logging service
    if (import.meta.env.PROD) {
      const severityOrder = [
        ErrorSeverity.LOW,
        ErrorSeverity.MEDIUM,
        ErrorSeverity.HIGH,
        ErrorSeverity.CRITICAL
      ];
      const entrySeverityIndex = severityOrder.indexOf(entry.severity);
      const minSeverityIndex = severityOrder.indexOf(ErrorSeverity.MEDIUM);
      
      if (entrySeverityIndex >= minSeverityIndex) {
        this.sendToRemoteService(entry);
      }
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'log' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  private async sendToRemoteService(entry: ErrorLogEntry): Promise<void> {
    try {
      // TODO: Implement remote logging service integration
      // Example: Sentry, LogRocket, etc.
      const response = await fetch('/api/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...entry,
          timestamp: entry.timestamp.toISOString()
        })
      });

      if (!response.ok) {
        logger.warn('[ErrorLogger] Failed to send log to remote service');
      }
    } catch (error) {
      logger.warn('[ErrorLogger] Error sending log to remote service:', error);
    }
  }

  getLogs(filter?: ErrorLogFilter): ErrorLogEntry[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.category) {
        filtered = filtered.filter(log => log.category === filter.category);
      }

      if (filter.severity) {
        filtered = filtered.filter(log => log.severity === filter.severity);
      }

      if (filter.resolved !== undefined) {
        filtered = filtered.filter(log => log.resolved === filter.resolved);
      }

      if (filter.startDate) {
        filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
      }

      if (filter.endDate) {
        filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
      }

      if (filter.component) {
        filtered = filtered.filter(log => log.context.component === filter.component);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getLogStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    unresolved: number;
    last24Hours: number;
  } {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const byCategory = {} as Record<ErrorCategory, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;

    Object.values(ErrorCategory).forEach(cat => {
      byCategory[cat] = 0;
    });

    Object.values(ErrorSeverity).forEach(sev => {
      bySeverity[sev] = 0;
    });

    let unresolved = 0;
    let last24HoursCount = 0;

    this.logs.forEach(log => {
      byCategory[log.category]++;
      bySeverity[log.severity]++;
      if (!log.resolved) unresolved++;
      if (log.timestamp >= last24Hours) last24HoursCount++;
    });

    return {
      total: this.logs.length,
      byCategory,
      bySeverity,
      unresolved,
      last24Hours: last24HoursCount
    };
  }

  on(event: 'log', callback: (entry: ErrorLogEntry) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(entry: ErrorLogEntry): void {
    this.listeners.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        logger.error('[ErrorLogger] Error in listener:', error);
      }
    });
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['id', 'errorId', 'message', 'category', 'severity', 'timestamp', 'resolved', 'retryCount'];
      const rows = this.logs.map(log => [
        log.id,
        log.errorId,
        `"${log.message.replace(/"/g, '""')}"`,
        log.category,
        log.severity,
        log.timestamp.toISOString(),
        log.resolved.toString(),
        log.retryCount.toString()
      ]);

      return [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
    }

    return JSON.stringify(this.logs, null, 2);
  }

  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }
  }
}

// Singleton instance
let errorLoggerInstance: ErrorLogger | null = null;

export const getErrorLogger = (): ErrorLogger => {
  if (!errorLoggerInstance) {
    errorLoggerInstance = new ErrorLogger();
  }
  return errorLoggerInstance;
};

export { ErrorLogger };

