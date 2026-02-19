import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { JWT_SECRET } from '@/lib/utils/config/config';
import { logger } from '@/lib/utils/logging';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    username: string;
    name: string;
    role: string;
    status: string;
  };
}

interface DecodedToken extends JwtPayload {
  userId: string;
}

export async function authenticateToken(req: AuthenticatedRequest): Promise<NextResponse | null> {
  try {
    const authHeader = req.headers.get('authorization');
    let token = authHeader?.split(' ')[1];

    if (!token) {
      const cookieStore = cookies();
      token = cookieStore.get('auth-token')?.value;
    }

    if (!token) {
      logger.warn('Authentication failed: No token provided', { 
        userAgent: req.headers.get('user-agent') || undefined,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
      });
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'Access token is required'
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        status: true,
      }
    });

    if (!user) {
      logger.warn('Authentication failed: User not found', { 
        userId: decoded.userId,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
      });
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'User not found'
      }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      logger.warn('Authentication failed: User account not active', { 
        userId: user.id,
        status: user.status,
        email: user.email
      });
      return NextResponse.json({
        error: 'Account Status Error',
        message: 'Your account is not active. Please contact an administrator.'
      }, { status: 403 });
    }

    req.user = user;
    return null;
  } catch (error) {
    logger.error('Authentication error occurred', error as Error, {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined
    });
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

export function withAuthAndRole(roles: string[], handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
  return async (req: Request, context?: any) => {
    const authReq = req as AuthenticatedRequest;
    const authError = await authenticateToken(authReq);
    if (authError) return authError;
    
    const roleError = requireRole(roles)(authReq.user!);
    if (roleError) return roleError;
    
    return handler(authReq, context);
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

// Type helper to extract permission strings
type RolePermissions = typeof ROLE_PERMISSIONS;
type AllPermissions = RolePermissions[keyof RolePermissions]['permissions'][number];

// Permission checking utilities
export function hasPermission(userRole: string, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
  if (!rolePermissions) return false;
  return (rolePermissions.permissions as readonly string[]).includes(permission);
}

export function requirePermission(permission: string) {
  return (user: { role: string }): NextResponse | null => {
    if (!hasPermission(user.role, permission)) {
      logger.warn('Permission denied', { userRole: user.role, requiredPermission: permission });
      return NextResponse.json({
        error: 'Authorization Error',
        message: 'Insufficient permissions for this operation'
      }, { status: 403 });
    }
    return null;
  };
}

export function withAuthAndPermission(permission: string, handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
  return async (req: Request, context?: any) => {
    const authReq = req as AuthenticatedRequest;
    const authError = await authenticateToken(authReq);
    if (authError) return authError;
    
    const permissionError = requirePermission(permission)(authReq.user!);
    if (permissionError) return permissionError;
    
    return handler(authReq, context);
  };
}
