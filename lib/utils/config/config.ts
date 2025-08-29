// Import validated environment variables
import { JWT_SECRET as JWT_SECRET_ENV, REFRESH_TOKEN_SECRET as REFRESH_TOKEN_SECRET_ENV } from './env-validation';

// Use the validated environment variables
export const JWT_SECRET = JWT_SECRET_ENV;
export const REFRESH_TOKEN_SECRET = REFRESH_TOKEN_SECRET_ENV;

export const ACCESS_TOKEN_EXPIRATION = '15m';
export const REFRESH_TOKEN_EXPIRATION = '7d';

// Additional runtime validation for production
if (process.env.NODE_ENV === 'production') {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production');
  }
  if (!REFRESH_TOKEN_SECRET || REFRESH_TOKEN_SECRET.length < 32) {
    throw new Error('REFRESH_TOKEN_SECRET must be at least 32 characters long in production');
  }
}

