import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { cookies } from 'next/headers';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    username: string;
    name: string;
    role: string;
    status: string;
    sbu?: string;
  };
}

export async function authenticateToken(req: AuthenticatedRequest): Promise<NextResponse | null> {
  try {
    // Try to get token from Authorization header first, then from cookie
    const authHeader = req.headers.get('authorization');
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // Try to get token from cookie
      const cookieStore = cookies();
      token = cookieStore.get('auth-token')?.value || null;
    }

    if (!token) {
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'Access token is required'
      }, { status: 401 });
    }

    // Validate token format before attempting to verify
    if (typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'Token format is invalid. Please log in again.'
      }, { status: 403 });
    }

    // Basic JWT format check (should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'Token format is invalid. Please log in again.'
      }, { status: 403 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    // Fetch user to ensure they still exist and get current status and SBU
    const user = (await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        sbu: true
      }
    })) as any;

    if (!user) {
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'User not found'
      }, { status: 401 });
    }

    // Check if user account is active, but allow onboarding/verify paths for PENDING users
    const pathname = (req as any).nextUrl?.pathname || '';
    const allowedPendingPaths = ['/api/auth/onboarding', '/api/auth/verify'];
    if (user?.status && user.status !== 'ACTIVE') {
      if (!allowedPendingPaths.includes(pathname)) {
        return NextResponse.json({
          error: 'Account Status Error',
          message: 'Your account is not active. Please contact an administrator.'
        }, { status: 403 });
      }
    }

    req.user = user;
    return null; // No error, authentication successful
  } catch (error) {
    console.error('Authentication error:', error);

    // Log the token for debugging (first 10 chars only for security)
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader && authHeader.split(' ')[1];
    const cookieStore = cookies();
    const cookieToken = cookieStore.get('auth-token')?.value;

    console.error('Token debug info:', {
      hasAuthHeader: !!authHeader,
      headerTokenPreview: headerToken ? headerToken.substring(0, 10) + '...' : 'none',
      hasCookieToken: !!cookieToken,
      cookieTokenPreview: cookieToken ? cookieToken.substring(0, 10) + '...' : 'none'
    });

    // Provide more specific error messages
    let message = 'Invalid or expired token';
    if (error instanceof Error) {
      if (error.message.includes('jwt malformed')) {
        message = 'Token format is invalid. Please log in again.';
      } else if (error.message.includes('jwt expired')) {
        message = 'Token has expired. Please log in again.';
      } else if (error.message.includes('invalid signature')) {
        message = 'Token signature is invalid. Please log in again.';
      }
    }

    return NextResponse.json({
      error: 'Authentication Error',
      message
    }, { status: 403 });
  }
}

export function requireRole(roles: string[]) {
  return (user: { role: string }): NextResponse | null => {
    if (!roles.includes(user.role)) {
      return NextResponse.json({
        error: 'Authorization Error',
        message: 'Insufficient permissions for this operation'
      }, { status: 403 });
    }
    return null;
  };
}

export function withAuth(handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest, context?: any) => {
    const authError = await authenticateToken(req);
    if (authError) return authError;

    return handler(req, context);
  };
}

export function withAuthAndRole(roles: string[], handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    const authError = await authenticateToken(authReq);
    if (authError) return authError;

    const roleError = requireRole(roles)(authReq.user!);
    if (roleError) return roleError;

    return handler(authReq);
  };
}

// Role-based permission definitions
export const ROLE_PERMISSIONS = {
  ADMIN: {
    description: 'Full access to all system functionalities',
    permissions: [
      'manage_all_campaigns',
      'manage_all_leads',
      'manage_all_users',
      'manage_system_settings',
      'approve_users',
      'assign_roles',
      'export_data'
    ]
  },
  BSS: {
    description: 'User Management specialist',
    permissions: [
      'view_all_users',
      'approve_users',
      'change_user_roles',
      'change_user_status',
      'export_user_data'
    ]
  },
  INFOSEC: {
    description: 'Monitoring & Security specialist',
    permissions: [
      'view_all_users',
      'view_all_leads',
      'export_data',
      'audit_access'
    ]
  },
  SUPERVISOR: {
    description: 'Campaign & Lead Management',
    permissions: [
      'view_campaigns',
      'manage_campaigns',
      'view_campaign_leads',
      'create_campaigns'
    ]
  },
  AGENT: {
    description: 'Lead Generation specialist',
    permissions: [
      'view_own_campaigns',
      'view_own_leads'
    ]
  }
} as const;