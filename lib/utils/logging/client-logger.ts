// lib/utils/logging/client-logger.ts

interface LogContext {
  [key: string]: any;
}

interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

class BrowserLogger implements Logger {
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : '';
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;

    switch (level) {
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
      case 'debug':
        console.debug(logMessage);
        break;
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
    // In a browser environment, you might want to check a global flag
    // or localStorage setting to enable/disable debug logs.
    this.log('debug', message, context);
  }
}

export const logger: Logger = new BrowserLogger();
