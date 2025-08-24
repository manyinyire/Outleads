import { prisma } from './prisma';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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


// Verify JWT token and get user ID
export const getUserIdFromToken = (token: string): string | null => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured');
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    return decoded.userId;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};
