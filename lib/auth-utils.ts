import { prisma } from './prisma';
import { Role } from '@prisma/client';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

// ... (keep existing functions: hashPassword, comparePassword, generateToken, etc.)

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

// Check user role
export const checkUserRole = async (allowedRoles: Role[]): Promise<boolean> => {
  const authorization = headers().get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return false;
  }

  const token = authorization?.split(' ')[1];
  const userId = getUserIdFromToken(token);

  if (!userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return false;
  }

  return allowedRoles.includes(user.role);
};
