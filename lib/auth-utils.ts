import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: '24h' }
  );
};

// Generate unique campaign link
export const generateCampaignLink = (): string => {
  // Generate a short, URL-safe, unique identifier
  return nanoid(10); // 10 characters, URL-safe
};

// Validate campaign link format
export const isValidCampaignLink = (link: string): boolean => {
  // Check if it's a valid nanoid format (alphanumeric + underscore + hyphen)
  const nanoidRegex = /^[A-Za-z0-9_-]{10}$/;
  return nanoidRegex.test(link);
};
