export { default as ErrorPage } from './ErrorPage';
export { default as UnauthorizedError } from './UnauthorizedError';
export { default as ForbiddenError } from './ForbiddenError';
export { default as RateLimitError } from './RateLimitError';
export { default as AdminErrorBoundary } from './AdminErrorBoundary';

// Re-export the main ErrorBoundary for convenience
export { default as ErrorBoundary } from '../ErrorBoundary';