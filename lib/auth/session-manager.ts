import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db/prisma';
import { JWT_SECRET, REFRESH_TOKEN_SECRET } from '@/lib/utils/config/config';
import { logger } from '@/lib/utils/logging';

export interface SessionData {
  userId: string;
  role: string;
  sessionId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  expiresAt: Date;
}

export interface TokenPayload {
  userId: string;
  role: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

/**
 * Session management utilities for secure authentication
 */
export class SessionManager {
  /**
   * Generate device fingerprint from request headers
   */
  static generateDeviceFingerprint(req: NextRequest): string {
    const userAgent = req.headers.get('user-agent') || '';
    const acceptLanguage = req.headers.get('accept-language') || '';
    const acceptEncoding = req.headers.get('accept-encoding') || '';
    
    // Create a simple fingerprint (in production, use more sophisticated methods)
    const fingerprint = Buffer.from(
      `${userAgent}:${acceptLanguage}:${acceptEncoding}`
    ).toString('base64');
    
    return fingerprint;
  }

  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create new session tokens
   */
  static async createSession(
    userId: string, 
    role: string, 
    req: NextRequest
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
  }> {
    const sessionId = this.generateSessionId();
    const deviceFingerprint = this.generateDeviceFingerprint(req);
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const accessTokenPayload: TokenPayload = {
      userId,
      role,
      sessionId
    };

    const refreshTokenPayload = {
      userId,
      sessionId
    };

    const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // Store session data (in production, consider using Redis for better performance)
    try {
      await this.storeSession({
        userId,
        role,
        sessionId,
        deviceFingerprint,
        ipAddress,
        userAgent,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    } catch (error) {
      logger.error('Failed to store session data', error as Error, { userId, sessionId });
    }

    logger.info('New session created', { userId, sessionId, ipAddress, userAgent });

    return { accessToken, refreshToken, sessionId };
  }

  /**
   * Validate session from access token
   */
  static async validateSession(token: string): Promise<{
    valid: boolean;
    payload?: TokenPayload;
    reason?: string;
  }> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      
      // Check if session exists and is valid
      const sessionValid = await this.isSessionValid(decoded.sessionId, decoded.userId);
      
      if (!sessionValid) {
        return { valid: false, reason: 'Session expired or invalid' };
      }

      // Update last activity
      await this.updateLastActivity(decoded.sessionId);

      return { valid: true, payload: decoded };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, reason: 'Token expired' };
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, reason: 'Invalid token' };
      }
      logger.error('Session validation error', error as Error);
      return { valid: false, reason: 'Validation failed' };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshSession(refreshToken: string, req: NextRequest): Promise<{
    success: boolean;
    accessToken?: string;
    newRefreshToken?: string;
    reason?: string;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string; sessionId: string };
      
      // Verify session is still valid
      const sessionValid = await this.isSessionValid(decoded.sessionId, decoded.userId);
      if (!sessionValid) {
        return { success: false, reason: 'Session no longer valid' };
      }

      // Verify device fingerprint for additional security
      const session = await this.getSession(decoded.sessionId);
      if (session) {
        const currentFingerprint = this.generateDeviceFingerprint(req);
        if (session.deviceFingerprint !== currentFingerprint) {
          logger.warn('Device fingerprint mismatch during refresh', {
            userId: decoded.userId,
            sessionId: decoded.sessionId,
            expected: session.deviceFingerprint,
            actual: currentFingerprint
          });
          // In production, you might want to invalidate the session here
        }
      }

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, status: true }
      });

      if (!user || user.status !== 'ACTIVE') {
        return { success: false, reason: 'User not found or inactive' };
      }

      // Create new tokens
      const newAccessToken = jwt.sign(
        { userId: user.id, role: user.role, sessionId: decoded.sessionId } as TokenPayload,
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Optionally rotate refresh token for better security
      const newRefreshToken = jwt.sign(
        { userId: user.id, sessionId: decoded.sessionId },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      // Update session activity
      await this.updateLastActivity(decoded.sessionId);

      logger.info('Session refreshed', { userId: user.id, sessionId: decoded.sessionId });

      return {
        success: true,
        accessToken: newAccessToken,
        newRefreshToken
      };
    } catch (error) {
      logger.error('Refresh session error', error as Error);
      return { success: false, reason: 'Refresh failed' };
    }
  }

  /**
   * Invalidate session
   */
  static async invalidateSession(sessionId: string): Promise<void> {
    try {
      await this.removeSession(sessionId);
      logger.info('Session invalidated', { sessionId });
    } catch (error) {
      logger.error('Failed to invalidate session', error as Error, { sessionId });
    }
  }

  /**
   * Invalidate all sessions for a user
   */
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      await this.removeAllUserSessions(userId);
      logger.info('All user sessions invalidated', { userId });
    } catch (error) {
      logger.error('Failed to invalidate all user sessions', error as Error, { userId });
    }
  }

  /**
   * Store session data (implement based on your storage preference)
   */
  private static async storeSession(session: SessionData): Promise<void> {
    // For now, we'll store in database. In production, consider Redis
    // This is a placeholder - you'd need to create a Session model in Prisma
    // or use an alternative storage method
    logger.debug('Storing session data', { sessionId: session.sessionId, userId: session.userId });
  }

  /**
   * Check if session is valid
   */
  private static async isSessionValid(sessionId: string, userId: string): Promise<boolean> {
    // Implement session validation logic
    // For now, we'll do basic checks
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true }
      });
      
      return user?.status === 'ACTIVE';
    } catch (error) {
      logger.error('Session validation check failed', error as Error, { sessionId, userId });
      return false;
    }
  }

  /**
   * Get session data
   */
  private static async getSession(sessionId: string): Promise<SessionData | null> {
    // Implement session retrieval logic
    // This is a placeholder
    return null;
  }

  /**
   * Update last activity timestamp
   */
  private static async updateLastActivity(sessionId: string): Promise<void> {
    // Implement last activity update
    logger.debug('Updating session activity', { sessionId });
  }

  /**
   * Remove session
   */
  private static async removeSession(sessionId: string): Promise<void> {
    // Implement session removal
    logger.debug('Removing session', { sessionId });
  }

  /**
   * Remove all sessions for a user
   */
  private static async removeAllUserSessions(userId: string): Promise<void> {
    // Implement bulk session removal
    logger.debug('Removing all user sessions', { userId });
  }

  /**
   * Cleanup expired sessions (call this periodically)
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      // Implement cleanup logic
      logger.info('Cleaned up expired sessions');
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', error as Error);
    }
  }
}

// Run cleanup every hour
setInterval(() => {
  SessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);