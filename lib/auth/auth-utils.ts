import { prisma } from '@/lib/db/prisma';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '@/lib/utils/config/config';
import { logger } from '@/lib/utils/logging/logger';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Gets the default dashboard route based on user role
export const getDashboardRouteForRole = (role: Role): string => {
  switch (role) {
    case 'ADMIN':
    case 'SUPERVISOR':
      return '/admin';
    case 'BSS':
    case 'INFOSEC':
      return '/admin/users';
    case 'AGENT':
      return '/admin/leads';
    default:
      return '/auth/login'; // Fallback to login
  }
};


// Verify JWT token and get user ID from request headers
export const getUserIdFromRequest = (request: Request): string | null => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return null;
    }
    
    return getUserIdFromToken(token);
  } catch (error) {
    logger.error('Error extracting user ID from request', error as Error);
    return null;
  }
};

// Verify JWT token and get user ID
export const getUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    logger.warn('Invalid token provided', { error: (error as Error).message });
    return null;
  }
};

// Generate JWT token for user
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Check if user has required role for API access
export const checkUserRole = async (userId: string, allowedRoles: Role[]): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true }
    });
    
    if (!user) {
      return false;
    }
    
    if (user.status !== 'ACTIVE') {
      return false;
    }
    
    return allowedRoles.includes(user.role);
  } catch (error) {
    logger.error('Error checking user role', error as Error, { userId, allowedRoles });
    return false;
  }
};

// Validate user permissions from request
export const validateUserPermissions = async (request: Request, allowedRoles: Role[]): Promise<boolean> => {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return false;
  }
  
  return checkUserRole(userId, allowedRoles);
};
