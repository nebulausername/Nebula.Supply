// Enhanced logger for admin app with API error tracking and user action logging
interface LogEntry {
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  data?: any;
  timestamp: string;
  url: string;
  userAgent: string;
  sessionId?: string;
}

class Logger {
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private remoteSinkEnabled = import.meta.env.VITE_REMOTE_LOGGING === 'true';
  private remoteSinkUrl = import.meta.env.VITE_LOGGING_ENDPOINT || '';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupUnhandledErrorCapture();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupUnhandledErrorCapture(): void {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  private createLogEntry(level: LogEntry['level'], message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Send to remote sink if enabled
    if (this.remoteSinkEnabled && this.remoteSinkUrl) {
      this.sendToRemoteSink(entry);
    }
  }

  private async sendToRemoteSink(entry: LogEntry): Promise<void> {
    try {
      await fetch(this.remoteSinkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.warn('Failed to send log to remote sink:', error);
    }
  }

  info(message: string, data?: any): void {
    const entry = this.createLogEntry('info', message, data);
    console.log(`[INFO] ${message}`, data || '');
    this.addToBuffer(entry);
  }

  error(message: string, data?: any): void {
    const entry = this.createLogEntry('error', message, data);
    console.error(`[ERROR] ${message}`, data || '');
    this.addToBuffer(entry);
  }

  warn(message: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, data);
    console.warn(`[WARN] ${message}`, data || '');
    this.addToBuffer(entry);
  }

  debug(message: string, data?: any): void {
    if (import.meta.env.DEV) {
      const entry = this.createLogEntry('debug', message, data);
      console.debug(`[DEBUG] ${message}`, data || '');
      this.addToBuffer(entry);
    }
  }
  
  // API error logging with enhanced context
  logApiError(error: any, context?: any): void {
    const errorInfo = {
      message: error?.message || 'Unknown API error',
      status: error?.status,
      code: error?.code,
      stack: error?.stack,
      context: context || {},
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
    
    this.error(`[API_ERROR] ${errorInfo.message}`, errorInfo);
  }
  
  // User action logging for analytics and debugging
  logUserAction(action: string, data?: any): void {
    const actionInfo = {
      action,
      data: data || {},
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    
    this.info(`[USER_ACTION] ${action}`, actionInfo);
  }
  
  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: any): void {
    const perfInfo = {
      operation,
      duration,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };
    
    if (duration > 1000) { // Log slow operations
      this.warn(`[PERF_SLOW] ${operation} took ${duration}ms`, perfInfo);
    } else if (import.meta.env.DEV) {
      this.info(`[PERF] ${operation} took ${duration}ms`, perfInfo);
    }
  }

  // Get recent logs for debugging
  getRecentLogs(level?: LogEntry['level']): LogEntry[] {
    if (level) {
      return this.logBuffer.filter(entry => entry.level === level);
    }
    return [...this.logBuffer];
  }

  // Clear log buffer
  clearLogs(): void {
    this.logBuffer = [];
  }
}

export const logger = new Logger();