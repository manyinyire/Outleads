import { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    successCount: number;
    failedCount: number;
  };
}

class MemoryRateLimitStore {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  get(key: string): RateLimitStore[string] | undefined {
    const record = this.store[key];
    if (!record || Date.now() > record.resetTime) {
      return undefined;
    }
    return record;
  }

  set(key: string, value: RateLimitStore[string]) {
    this.store[key] = value;
  }

  increment(key: string, windowMs: number, isSuccess: boolean = true) {
    const now = Date.now();
    const existing = this.get(key);
    
    if (!existing) {
      this.store[key] = {
        count: 1,
        resetTime: now + windowMs,
        successCount: isSuccess ? 1 : 0,
        failedCount: isSuccess ? 0 : 1,
      };
      return this.store[key];
    }

    existing.count++;
    if (isSuccess) {
      existing.successCount++;
    } else {
      existing.failedCount++;
    }
    
    return existing;
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store = {};
  }
}

// Global store instance
const rateLimitStore = new MemoryRateLimitStore();

export function createRateLimiter(config: RateLimitConfig) {
  return {
    check: (req: NextRequest): { allowed: boolean; resetTime?: number; remaining?: number } => {
      const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                req.ip || 
                '127.0.0.1';
      
      const key = `${ip}:${req.nextUrl.pathname}`;
      const now = Date.now();
      
      const existing = rateLimitStore.get(key);
      
      if (!existing) {
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
          successCount: 1,
          failedCount: 0,
        });
        
        return {
          allowed: true,
          resetTime: now + config.windowMs,
          remaining: config.maxRequests - 1,
        };
      }

      if (existing.count >= config.maxRequests) {
        logger.warn('Rate limit exceeded', {
          ip,
          path: req.nextUrl.pathname,
          count: existing.count,
          limit: config.maxRequests,
          resetTime: existing.resetTime,
        });
        
        return {
          allowed: false,
          resetTime: existing.resetTime,
          remaining: 0,
        };
      }

      existing.count++;
      
      return {
        allowed: true,
        resetTime: existing.resetTime,
        remaining: config.maxRequests - existing.count,
      };
    },
    
    recordResult: (req: NextRequest, isSuccess: boolean) => {
      const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                req.ip || 
                '127.0.0.1';
      
      const key = `${ip}:${req.nextUrl.pathname}`;
      rateLimitStore.increment(key, config.windowMs, isSuccess);
    }
  };
}

// Pre-configured rate limiters for different endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per 15 minutes
  message: 'Too many API requests. Please try again later.',
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  message: 'Rate limit exceeded. Please slow down.',
});

// Cleanup function for graceful shutdown
export function cleanupRateLimiter() {
  rateLimitStore.destroy();
}
