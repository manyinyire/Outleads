import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/lib/utils/logging/logger';
import { errorResponse } from '@/lib/api/api-utils';

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize string input to prevent XSS attacks
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>'"]/g, ''); // Remove potentially dangerous characters
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}

/**
 * Rate limiting store (simple in-memory implementation)
 * In production, use Redis or similar distributed cache
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  
  increment(key: string, windowMs: number = 15 * 60 * 1000): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.store.get(key);
    
    if (!existing || now > existing.resetTime) {
      const newEntry = { count: 1, resetTime: now + windowMs };
      this.store.set(key, newEntry);
      return newEntry;
    }
    
    existing.count++;
    return existing;
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  API: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  PUBLIC: { maxRequests: 50, windowMs: 15 * 60 * 1000 }, // 50 requests per 15 minutes
} as const;

/**
 * Apply rate limiting
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: NextRequest): NextResponse | null => {
    const key = config.keyGenerator 
      ? config.keyGenerator(req)
      : req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    
    const { count, resetTime } = rateLimitStore.increment(key, config.windowMs);
    
    if (count > config.maxRequests) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      logger.warn('Rate limit exceeded', { 
        key, 
        count, 
        maxRequests: config.maxRequests,
        retryAfter 
      });
      
      return new NextResponse(
        JSON.stringify({
          error: 'Rate Limit Exceeded',
          message: 'Too many requests. Please try again later.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': Math.max(0, config.maxRequests - count).toString(),
            'X-RateLimit-Reset': resetTime.toString()
          }
        }
      );
    }
    
    return null;
  };
}

/**
 * Validation middleware factory
 */
export function validateRequest<T>(schema: ZodSchema<T>, options?: {
  sanitize?: boolean;
  rateLimit?: RateLimitConfig;
}) {
  return async (req: NextRequest): Promise<{ 
    success: true; 
    data: T; 
  } | { 
    success: false; 
    error: NextResponse; 
  }> => {
    try {
      // Apply rate limiting if configured
      if (options?.rateLimit) {
        const rateLimitError = rateLimit(options.rateLimit)(req);
        if (rateLimitError) {
          return { success: false, error: rateLimitError };
        }
      }
      
      // Parse request body
      let body: any;
      try {
        body = await req.json();
      } catch (error) {
        return {
          success: false,
          error: errorResponse('Invalid JSON in request body', 400)
        };
      }
      
      // Sanitize input if enabled
      if (options?.sanitize !== false) {
        body = InputSanitizer.sanitizeObject(body);
      }
      
      // Validate against schema
      const validated = schema.parse(body);
      
      return { success: true, data: validated };
      
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation failed', { 
          errors: error.errors,
          path: req.nextUrl.pathname 
        });
        
        return {
          success: false,
          error: errorResponse(
            error.errors[0]?.message || 'Validation failed',
            400,
            'Validation Error',
            process.env.NODE_ENV === 'development' ? error.errors : undefined
          )
        };
      }
      
      logger.error('Validation middleware error', error as Error);
      return {
        success: false,
        error: errorResponse('Request validation failed', 500)
      };
    }
  };
}

/**
 * CSRF protection
 */
export function csrfProtection() {
  return (req: NextRequest): NextResponse | null => {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return null;
    }
    
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');
    const referer = req.headers.get('referer');
    
    // Check if request comes from same origin
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          logger.warn('CSRF attempt detected: Origin mismatch', { origin, host });
          return errorResponse('Invalid request origin', 403);
        }
      } catch (error) {
        logger.warn('CSRF protection: Invalid origin header', { origin });
        return errorResponse('Invalid request origin', 403);
      }
    }
    
    // Fallback to referer check
    if (!origin && referer && host) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host !== host) {
          logger.warn('CSRF attempt detected: Referer mismatch', { referer, host });
          return errorResponse('Invalid request source', 403);
        }
      } catch (error) {
        logger.warn('CSRF protection: Invalid referer header', { referer });
        return errorResponse('Invalid request source', 403);
      }
    }
    
    return null;
  };
}

/**
 * Combined security middleware
 */
export function securityMiddleware(config?: {
  rateLimit?: RateLimitConfig;
  enableCSRF?: boolean;
}) {
  return (req: NextRequest): NextResponse | null => {
    // Apply rate limiting
    if (config?.rateLimit) {
      const rateLimitError = rateLimit(config.rateLimit)(req);
      if (rateLimitError) return rateLimitError;
    }
    
    // Apply CSRF protection
    if (config?.enableCSRF !== false) {
      const csrfError = csrfProtection()(req);
      if (csrfError) return csrfError;
    }
    
    return null;
  };
}