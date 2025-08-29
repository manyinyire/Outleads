// lib/utils/logging/logger.ts - SERVER-SIDE LOGGER

import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Ensure log directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

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

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} ${level}: ${message}`;
  if (metadata && Object.keys(metadata).length > 0) {
    msg += ` | Context: ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
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
    }),
  ],
  exitOnError: false,
});

class WinstonLogger implements Logger {
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: LogContext | Error) {
    winstonLogger[level](message, context);
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

export const logger: Logger = new WinstonLogger();

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
