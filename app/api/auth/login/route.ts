import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { serialize } from 'cookie';
import { prisma } from '@/lib/db/prisma';
import { authenticateDomainUser, getUserInfo, manageUser } from '@/lib/auth/authService';
import { ApiError } from '@/lib/utils/errors/errors';
import { SessionManager } from '@/lib/auth/session-manager';
import { logger } from '@/lib/utils/logging';
import { auditAuth, AuditAction } from '@/lib/compliance/audit-logger';

export const runtime = 'nodejs';

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  let username = 'unknown';
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);
    username = parsed.username;
    const password = parsed.password;

    const authResult = await authenticateDomainUser(username, password);
    const userInfo = await getUserInfo(authResult.user);
    const { newUser, user } = await manageUser(userInfo);

    if (newUser) {
      return NextResponse.json({ newUser, user });
    }

    // Update last login time
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create session using SessionManager
    const { accessToken, refreshToken } = await SessionManager.createSession(
      updatedUser.id,
      updatedUser.role,
      req
    );

    // Log successful login for compliance
    try {
      await auditAuth(
        AuditAction.LOGIN,
        updatedUser.id,
        updatedUser.email,
        true,
        ipAddress,
        userAgent
      );
    } catch (auditError) {
      // Don't let audit logging failures break successful login
      logger.error('Failed to log successful login audit', auditError as Error);
    }

    const response = NextResponse.json({ token: accessToken, user: updatedUser });
    response.headers.set('Set-Cookie', serialize('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    }));

    return response;

  } catch (error) {
    // Log failed login attempt for security monitoring
    try {
      await auditAuth(
        AuditAction.LOGIN_FAILED,
        undefined,
        username,
        false,
        ipAddress,
        userAgent,
        (error as Error).message
      );
    } catch (auditError) {
      // Don't let audit logging failures break login error response
      logger.error('Failed to log audit event', auditError as Error);
    }
    
    logger.error('Login attempt failed', error as Error, { username, ipAddress, userAgent });

    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }
    
    // Provide more specific error message
    const errorMessage = (error as Error).message || 'An internal server error occurred.';
    logger.error('Login error details', error as Error, { errorMessage, username });
    
    return NextResponse.json({ 
      message: 'Authentication service error. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
