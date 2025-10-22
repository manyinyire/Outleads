import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SessionManager } from '@/lib/auth/session-manager';
import { logger } from '@/lib/utils/logging';
import { serialize } from 'cookie';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refresh-token')?.value;

  if (!refreshToken) {
    logger.warn('Refresh attempt without token', {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    });
    return NextResponse.json({ message: 'Refresh token not found.' }, { status: 401 });
  }

  try {
    const result = await SessionManager.refreshSession(refreshToken, req);
    
    if (!result.success) {
      logger.warn('Refresh token validation failed', { reason: result.reason });
      return NextResponse.json({ message: result.reason || 'Invalid refresh token.' }, { status: 403 });
    }

    const response = NextResponse.json({ token: result.accessToken });
    
    // Set new refresh token if rotated
    if (result.newRefreshToken) {
      response.headers.set('Set-Cookie', serialize('refresh-token', result.newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      }));
    }

    return response;
  } catch (error) {
    logger.error('Refresh token processing error', error as Error);
    return NextResponse.json({ message: 'Token refresh failed.' }, { status: 500 });
  }
}
