import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityMiddleware, RATE_LIMITS } from '@/lib/middleware/validation';
import { logger } from '@/lib/utils/logging';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            '127.0.0.1';
  
  // Apply security middleware based on route type
  let securityConfig;
  
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    // Stricter rate limiting for auth endpoints
    securityConfig = {
      rateLimit: RATE_LIMITS.AUTH,
      enableCSRF: true
    };
  } else if (request.nextUrl.pathname.startsWith('/api/')) {
    // Standard rate limiting for API endpoints
    securityConfig = {
      rateLimit: RATE_LIMITS.API,
      enableCSRF: true
    };
  } else {
    // Lighter rate limiting for public pages
    securityConfig = {
      rateLimit: RATE_LIMITS.PUBLIC,
      enableCSRF: false // Don't enforce CSRF on page requests
    };
  }
  
  // Apply security checks
  const securityError = securityMiddleware(securityConfig)(request);
  if (securityError) {
    logger.warn('Security middleware blocked request', {
      path: request.nextUrl.pathname,
      ip,
      userAgent: request.headers.get('user-agent') || undefined
    });
    return securityError;
  }
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP with different policies for dev vs production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const scriptSrc = isDevelopment 
    ? "'self' 'unsafe-eval' 'unsafe-inline'" // Allow inline scripts in development
    : "'self' 'unsafe-eval'"; // Strict policy for production
  
  const cspDirectives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspDirectives);
  
  // Add HSTS header for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
