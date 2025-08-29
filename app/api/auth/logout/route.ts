import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { auditAuth, AuditAction } from '@/lib/compliance/audit-logger';
import { getUserIdFromRequest } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  
  try {
    // Try to get user info before logout for audit purposes
    const userId = getUserIdFromRequest(req);
    let userEmail = 'unknown';
    
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });
      userEmail = user?.email || 'unknown';
    }
    
    const response = NextResponse.json({ message: 'Logged out successfully.' });

    response.headers.set('Set-Cookie', serialize('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0),
    }));

    // Log logout for compliance
    await auditAuth(
      AuditAction.LOGOUT,
      userId || undefined,
      userEmail,
      true,
      ipAddress,
      userAgent
    );

    return response;
  } catch (error) {
    // Even if audit logging fails, allow logout to proceed
    const response = NextResponse.json({ message: 'Logged out successfully.' });
    
    response.headers.set('Set-Cookie', serialize('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: '/',
      expires: new Date(0),
    }));
    
    return response;
  }
}
