import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function authenticateToken(req: AuthenticatedRequest): Promise<NextResponse | null> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'Access token is required'
      }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Fetch user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'User not found'
      }, { status: 401 });
    }

    req.user = user;
    return null; // No error, authentication successful
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({
      error: 'Authentication Error',
      message: 'Invalid or expired token'
    }, { status: 403 });
  }
}

export function requireRole(roles: string[]) {
  return (user: { role: string }): NextResponse | null => {
    if (!roles.includes(user.role)) {
      return NextResponse.json({
        error: 'Authorization Error',
        message: 'Insufficient permissions'
      }, { status: 403 });
    }
    return null;
  };
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest) => {
    const authError = await authenticateToken(req);
    if (authError) return authError;
    
    return handler(req);
  };
}

export function withAuthAndRole(roles: string[], handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest) => {
    const authError = await authenticateToken(req);
    if (authError) return authError;
    
    const roleError = requireRole(roles)(req.user!);
    if (roleError) return roleError;
    
    return handler(req);
  };
}