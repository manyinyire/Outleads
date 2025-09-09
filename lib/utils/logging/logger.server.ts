// lib/utils/logging/logger.ts - SERVER-SIDE LOGGER

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

// Detect runtime environment
const isEdgeRuntime = (typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis) ||
  (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge');

// Edge Runtime compatible logger
class EdgeLogger implements Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      logMessage += ` | Context: ${JSON.stringify(context)}`;
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

// Node.js Winston logger
class WinstonLogger implements Logger {
  private winstonLogger: any;

  constructor() {
    // Dynamically import and setup winston only in Node.js environment
    const winston = require('winston');
    const { combine, timestamp, printf, colorize, json } = winston.format;

    const consoleFormat = printf(({ level, message, timestamp, ...metadata }: any) => {
      let msg = `${timestamp} ${level}: ${message}`;
      if (metadata && Object.keys(metadata).length > 0) {
        msg += ` | Context: ${JSON.stringify(metadata)}`;
      }
      return msg;
    });

    const transports = [
      new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          consoleFormat
        ),
      })
    ];

    // Add file transports
    try {
      const fs = require('fs');
      const path = require('path');
      
      const logDir = 'logs';
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
      }

      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'app.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    } catch (error) {
      console.warn('File logging not available');
    }

    this.winstonLogger = winston.createLogger({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
      ),
      transports,
      exitOnError: false,
    });
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: LogContext | Error) {
    this.winstonLogger[level](message, context);
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

// Export the appropriate logger based on runtime
export const logger: Logger = isEdgeRuntime ? new EdgeLogger() : new WinstonLogger();

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
