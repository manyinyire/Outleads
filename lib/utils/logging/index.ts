// lib/utils/logging/index.ts
// Simple console-based logger that works in all environments

interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  userAgent?: string;
  ip?: string;
  path?: string;
  stack?: string;
  errorMessage?: string;
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

class ConsoleLogger implements Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      logMessage += ` | ${JSON.stringify(context)}`;
    }
    
    return logMessage;
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? { ...context, stack: error.stack, errorMessage: error.message } : context;
    console.error(this.formatMessage('error', message, errorContext));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new ConsoleLogger();

// Helper function to create request-scoped logger
export function createRequestLogger(requestId: string, userId?: string) {
  return {
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...context, requestId, userId }),
    warn: (message: string, context?: LogContext) => 
      logger.warn(message, { ...context, requestId, userId }),
    error: (message: string, error?: Error, context?: LogContext) => 
      logger.error(message, error, { ...context, requestId, userId }),
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...context, requestId, userId }),
  };
}

export const requestLogger = createRequestLogger;