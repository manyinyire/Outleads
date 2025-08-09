import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

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
    
    // Fetch user to ensure they still exist
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

    return NextResponse.json({
      message: 'Token is valid',
      user,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({
      error: 'Authentication Error',
      message: 'Invalid or expired token'
    }, { status: 403 });
  }
}
