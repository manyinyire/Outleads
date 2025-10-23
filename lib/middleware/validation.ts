import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/lib/utils/logging';
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
 * Validation middleware factory
 */
export function validateRequest<T>(schema: ZodSchema<T>, options?: {
  sanitize?: boolean;
}) {
  return async (req: NextRequest): Promise<{ 
    success: true; 
    data: T; 
  } | { 
    success: false; 
    error: NextResponse; 
  }> => {
    try {
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
  enableCSRF?: boolean;
}) {
  return (req: NextRequest): NextResponse | null => {
    // Apply CSRF protection
    if (config?.enableCSRF !== false) {
      const csrfError = csrfProtection()(req);
      if (csrfError) return csrfError;
    }
    
    return null;
  };
}