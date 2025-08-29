// lib/utils/logging/index.ts

import { Logger as BrowserLogger, createRequestLogger as createBrowserRequestLogger } from './logger.browser';
import type { Logger, createRequestLogger } from './logger.server';

let logger: Logger | BrowserLogger;
let requestLogger: typeof createRequestLogger | typeof createBrowserRequestLogger;

if (typeof window === 'undefined') {
  // We are on the server
  const serverLogger = require('./logger.server');
  logger = serverLogger.logger;
  requestLogger = serverLogger.createRequestLogger;
} else {
  // We are on the client
  const browserLogger = require('./logger.browser');
  logger = browserLogger.logger;
  requestLogger = browserLogger.createRequestLogger;
}

export { logger, requestLogger };