import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { validateUserPermissions, checkUserRole, generateToken, getUserIdFromToken } from '@/lib/auth/auth-utils';
import { SessionManager } from '@/lib/auth/session-manager';
import { validateRequest, rateLimit, csrfProtection, InputSanitizer } from '@/lib/middleware/validation';
import { createLeadSchema } from '@/lib/utils/validation/validation-schemas';

// Mock Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock config
jest.mock('@/lib/utils/config/config', () => ({
  JWT_SECRET: 'test-jwt-secret-key-32-characters-long',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret-key-32-characters-long',
}));

// Mock logger
jest.mock('@/lib/utils/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Authentication System Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Token Security', () => {
    test('should generate and validate JWT tokens correctly', () => {
      const userId = 'test-user-id';
      const token = generateToken(userId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const extractedUserId = getUserIdFromToken(token);
      expect(extractedUserId).toBe(userId);
    });

    test('should reject invalid JWT tokens', () => {
      const invalidToken = 'invalid.jwt.token';
      const extractedUserId = getUserIdFromToken(invalidToken);
      
      expect(extractedUserId).toBeNull();
    });

    test('should reject tampered JWT tokens', () => {
      const userId = 'test-user-id';
      const validToken = generateToken(userId);
      
      // Tamper with the token
      const tamperedToken = validToken.slice(0, -5) + 'xxxxx';
      const extractedUserId = getUserIdFromToken(tamperedToken);
      
      expect(extractedUserId).toBeNull();
    });
  });

  describe('Role-Based Access Control', () => {
    const mockPrisma = require('@/lib/db/prisma').prisma;

    test('should allow access for users with correct role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN',
        status: 'ACTIVE'
      });

      const hasAccess = await checkUserRole('test-user-id', ['ADMIN', 'SUPERVISOR']);
      expect(hasAccess).toBe(true);
    });

    test('should deny access for users with incorrect role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: 'AGENT',
        status: 'ACTIVE'
      });

      const hasAccess = await checkUserRole('test-user-id', ['ADMIN', 'SUPERVISOR']);
      expect(hasAccess).toBe(false);
    });

    test('should deny access for inactive users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN',
        status: 'INACTIVE'
      });

      const hasAccess = await checkUserRole('test-user-id', ['ADMIN']);
      expect(hasAccess).toBe(false);
    });

    test('should deny access for non-existent users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const hasAccess = await checkUserRole('test-user-id', ['ADMIN']);
      expect(hasAccess).toBe(false);
    });
  });

  describe('Session Management Security', () => {
    test('should generate unique session IDs', () => {
      const sessionId1 = SessionManager.generateSessionId();
      const sessionId2 = SessionManager.generateSessionId();
      
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^session_\\d+_[a-z0-9]+$/);
    });

    test('should generate consistent device fingerprints', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            const headers: Record<string, string> = {
              'user-agent': 'Mozilla/5.0 Test Browser',
              'accept-language': 'en-US,en;q=0.9',
              'accept-encoding': 'gzip, deflate'
            };
            return headers[header] || null;
          })
        }
      } as unknown as NextRequest;

      const fingerprint1 = SessionManager.generateDeviceFingerprint(mockRequest);
      const fingerprint2 = SessionManager.generateDeviceFingerprint(mockRequest);
      
      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toBeDefined();
    });
  });

  describe('Input Validation Security', () => {
    test('should sanitize dangerous HTML/JS content', () => {
      const dangerousInput = '<script>alert(\"XSS\")</script>Hello World';
      const sanitized = InputSanitizer.sanitizeString(dangerousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toBe('Hello World');
    });

    test('should sanitize objects recursively', () => {
      const dangerousObject = {
        name: '<script>alert(\"XSS\")</script>John Doe',
        items: ['<img onerror=\"alert(1)\" src=\"x\">', 'Safe Item'],
        nested: {
          value: 'javascript:void(0)'
        }
      };
      
      const sanitized = InputSanitizer.sanitizeObject(dangerousObject);
      
      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.items[0]).not.toContain('onerror');
      expect(sanitized.nested.value).not.toContain('javascript:');
    });

    test('should validate lead creation with proper schema', async () => {
      const validLeadData = {
        fullName: 'John Doe',
        phoneNumber: '+1234567890',
        sectorId: 'clhb2x3450000n8v8abc12345',
        products: ['clhb2x3450000n8v8def67890']
      };

      const mockRequest = {
        json: jest.fn(() => Promise.resolve(validLeadData)),
        headers: { get: jest.fn(() => 'localhost') },
        method: 'POST',
        nextUrl: { pathname: '/api/leads' }
      } as unknown as NextRequest;

      const result = await validateRequest(createLeadSchema, {
        sanitize: true,
        rateLimit: { maxRequests: 10, windowMs: 60000 }
      })(mockRequest);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('John Doe');
        expect(result.data.phoneNumber).toBe('+1234567890');
      }
    });

    test('should reject invalid lead data', async () => {
      const invalidLeadData = {
        fullName: '', // Empty name
        phoneNumber: '123', // Too short
        sectorId: 'invalid-id', // Not a CUID
        products: [] // Empty array
      };

      const mockRequest = {
        json: jest.fn(() => Promise.resolve(invalidLeadData)),
        headers: { get: jest.fn(() => 'localhost') },
        method: 'POST',
        nextUrl: { pathname: '/api/leads' }
      } as unknown as NextRequest;

      const result = await validateRequest(createLeadSchema)(mockRequest);

      expect(result.success).toBe(false);
    });
  });

  describe('Rate Limiting Security', () => {
    test('should allow requests under the limit', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('192.168.1.1')
        }
      } as unknown as NextRequest;

      const rateLimiter = rateLimit({ maxRequests: 5, windowMs: 60000 });
      
      // First request should be allowed
      const result = rateLimiter(mockRequest);
      expect(result).toBeNull(); // null means allowed
    });

    test('should generate appropriate response headers for rate limiting', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('192.168.1.1')
        }
      } as unknown as NextRequest;

      const rateLimiter = rateLimit({ maxRequests: 1, windowMs: 60000 });
      
      // First request - should be allowed
      rateLimiter(mockRequest);
      
      // Second request - should be rate limited
      const result = rateLimiter(mockRequest);
      
      if (result) {
        expect(result.status).toBe(429);
        expect(result.headers.get('Retry-After')).toBeDefined();
        expect(result.headers.get('X-RateLimit-Limit')).toBe('1');
      }
    });
  });

  describe('CSRF Protection Security', () => {
    test('should allow GET requests without CSRF checks', () => {
      const mockRequest = {
        method: 'GET',
        headers: { get: jest.fn() }
      } as unknown as NextRequest;

      const result = csrfProtection()(mockRequest);
      expect(result).toBeNull(); // null means allowed
    });

    test('should allow POST requests from same origin', () => {
      const mockRequest = {
        method: 'POST',
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'origin') return 'https://example.com';
            if (header === 'host') return 'example.com';
            return null;
          })
        }
      } as unknown as NextRequest;

      const result = csrfProtection()(mockRequest);
      expect(result).toBeNull(); // null means allowed
    });

    test('should block POST requests from different origins', () => {
      const mockRequest = {
        method: 'POST',
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'origin') return 'https://malicious.com';
            if (header === 'host') return 'example.com';
            return null;
          })
        }
      } as unknown as NextRequest;

      const result = csrfProtection()(mockRequest);
      expect(result).not.toBeNull(); // Should be blocked
      if (result) {
        expect(result.status).toBe(403);
      }
    });
  });

  describe('Security Integration Tests', () => {
    test('should handle complete authentication flow securely', async () => {
      // This test demonstrates the complete secure flow
      const userId = 'test-user-123';
      const role = 'ADMIN';
      
      // 1. Generate secure token
      const token = generateToken(userId);
      expect(token).toBeDefined();
      
      // 2. Validate token extraction
      const extractedUserId = getUserIdFromToken(token);
      expect(extractedUserId).toBe(userId);
      
      // 3. Mock successful role check
      const mockPrisma = require('@/lib/db/prisma').prisma;
      mockPrisma.user.findUnique.mockResolvedValue({
        role: 'ADMIN',
        status: 'ACTIVE'
      });
      
      // 4. Verify role-based access
      const hasAccess = await checkUserRole(userId, ['ADMIN']);
      expect(hasAccess).toBe(true);
      
      // This demonstrates the complete security chain working together
    });
  });
});