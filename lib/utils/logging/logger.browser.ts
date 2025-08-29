// lib/utils/logging/logger.browser.ts - CLIENT-SIDE LOGGER

interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  [key: string]: any;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

class BrowserLogger implements Logger {
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: LogContext | Error) {
    const logMessage = `[${level.toUpperCase()}] ${message}`;
    
    if (context) {
      console[level](logMessage, context);
    } else {
      console[level](logMessage);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error ? { ...context, stack: error.stack, errorMessage: error.message } : context;
    this.log('error', message, errorContext);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }
}

export const logger: Logger = new BrowserLogger();

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
