interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  [key: string]: any;
}

interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

class ConsoleLogger implements Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
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

// In production, you would replace this with a proper logging service
// like Winston, Pino, or a cloud logging service
export const logger: Logger = new ConsoleLogger();

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
