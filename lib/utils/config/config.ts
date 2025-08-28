// Import validated environment variables
export const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-fallback-refresh-secret-key';

export const ACCESS_TOKEN_EXPIRATION = '15m';
export const REFRESH_TOKEN_EXPIRATION = '7d';

if (process.env.NODE_ENV === 'production' && (JWT_SECRET === 'your-fallback-secret-key' || REFRESH_TOKEN_SECRET === 'your-fallback-refresh-secret-key')) {
  throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be set in production environment.');
}

