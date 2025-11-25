import { ErrorManager, ManagedError, ErrorSeverity, getErrorManager } from './ErrorManager';
import { ErrorLogger, getErrorLogger } from './ErrorLogger';
import { logger } from '../logger';

export interface ErrorReport {
  id: string;
  errorId: string;
  message: string;
  stack?: string;
  category: string;
  severity: string;
  context: Record<string, any>;
  timestamp: string;
  userAgent: string;
  url: string;
  resolved: boolean;
  retryCount: number;
}

export interface ReportingConfig {
  enabled: boolean;
  endpoint?: string;
  batchSize: number;
  batchInterval: number;
  minSeverity: ErrorSeverity;
  includeStack: boolean;
  includeContext: boolean;
}

class ErrorReporter {
  private errorManager: ErrorManager;
  private errorLogger: ErrorLogger;
  private config: ReportingConfig;
  private reportQueue: ErrorReport[] = [];
  private batchInterval?: NodeJS.Timeout;
  private isReporting = false;

  constructor(
    errorManager?: ErrorManager,
    errorLogger?: ErrorLogger,
    config?: Partial<ReportingConfig>
  ) {
    this.errorManager = errorManager || getErrorManager();
    this.errorLogger = errorLogger || getErrorLogger();
    
    this.config = {
      enabled: import.meta.env.PROD,
      endpoint: '/api/errors/report',
      batchSize: 10,
      batchInterval: 30000, // 30 seconds
      minSeverity: ErrorSeverity.MEDIUM,
      includeStack: true,
      includeContext: true,
      ...config
    };

    if (this.config.enabled) {
      this.setupErrorListener();
      this.startBatchReporting();
    }
  }

  private setupErrorListener(): void {
    this.errorManager.on('error', (error: ManagedError) => {
      if (this.shouldReport(error)) {
        this.queueReport(error);
      }
    });
  }

  private shouldReport(error: ManagedError): boolean {
    const severityOrder = [
      ErrorSeverity.LOW,
      ErrorSeverity.MEDIUM,
      ErrorSeverity.HIGH,
      ErrorSeverity.CRITICAL
    ];

    const errorSeverityIndex = severityOrder.indexOf(error.severity);
    const minSeverityIndex = severityOrder.indexOf(this.config.minSeverity);

    return errorSeverityIndex >= minSeverityIndex;
  }

  private queueReport(error: ManagedError): void {
    const report: ErrorReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorId: error.id,
      message: error.error.message,
      stack: this.config.includeStack ? error.error.stack : undefined,
      category: error.category,
      severity: error.severity,
      context: this.config.includeContext ? error.context : {},
      timestamp: error.timestamp.toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: error.resolved,
      retryCount: error.retryCount
    };

    this.reportQueue.push(report);

    // Send immediately if queue is full
    if (this.reportQueue.length >= this.config.batchSize) {
      this.flushReports();
    }
  }

  private startBatchReporting(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }

    this.batchInterval = setInterval(() => {
      if (this.reportQueue.length > 0) {
        this.flushReports();
      }
    }, this.config.batchInterval);
  }

  async flushReports(): Promise<void> {
    if (this.isReporting || this.reportQueue.length === 0) {
      return;
    }

    this.isReporting = true;
    const reports = this.reportQueue.splice(0, this.config.batchSize);

    try {
      await this.sendReports(reports);
      logger.info(`[ErrorReporter] Successfully reported ${reports.length} errors`);
    } catch (error) {
      logger.error('[ErrorReporter] Failed to send reports:', error);
      // Re-queue reports on failure
      this.reportQueue.unshift(...reports);
    } finally {
      this.isReporting = false;
    }
  }

  private async sendReports(reports: ErrorReport[]): Promise<void> {
    if (!this.config.endpoint) {
      logger.warn('[ErrorReporter] No endpoint configured, skipping report');
      return;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nebula_access_token') || ''}`
        },
        body: JSON.stringify({
          reports,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Fallback: Try to store reports locally for later retry
      this.storeReportsLocally(reports);
      throw error;
    }
  }

  private storeReportsLocally(reports: ErrorReport[]): void {
    try {
      const stored = localStorage.getItem('nebula_error_reports');
      const existing = stored ? JSON.parse(stored) : [];
      const updated = [...existing, ...reports].slice(-100); // Keep last 100
      localStorage.setItem('nebula_error_reports', JSON.stringify(updated));
    } catch (error) {
      logger.warn('[ErrorReporter] Failed to store reports locally:', error);
    }
  }

  async retryStoredReports(): Promise<void> {
    try {
      const stored = localStorage.getItem('nebula_error_reports');
      if (!stored) return;

      const reports: ErrorReport[] = JSON.parse(stored);
      if (reports.length === 0) return;

      await this.sendReports(reports);
      localStorage.removeItem('nebula_error_reports');
      logger.info(`[ErrorReporter] Successfully retried ${reports.length} stored reports`);
    } catch (error) {
      logger.error('[ErrorReporter] Failed to retry stored reports:', error);
    }
  }

  async reportError(error: ManagedError): Promise<void> {
    if (!this.shouldReport(error)) {
      return;
    }

    this.queueReport(error);
    
    // Force immediate flush for critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      await this.flushReports();
    }
  }

  updateConfig(config: Partial<ReportingConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enabled) {
      this.startBatchReporting();
    } else {
      if (this.batchInterval) {
        clearInterval(this.batchInterval);
        this.batchInterval = undefined;
      }
    }
  }

  getConfig(): ReportingConfig {
    return { ...this.config };
  }

  getQueueSize(): number {
    return this.reportQueue.length;
  }

  destroy(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    
    // Flush remaining reports
    if (this.reportQueue.length > 0) {
      this.flushReports();
    }
  }
}

// Singleton instance
let errorReporterInstance: ErrorReporter | null = null;

export const getErrorReporter = (config?: Partial<ReportingConfig>): ErrorReporter => {
  if (!errorReporterInstance) {
    errorReporterInstance = new ErrorReporter(undefined, undefined, config);
  }
  return errorReporterInstance;
};

export { ErrorReporter };

