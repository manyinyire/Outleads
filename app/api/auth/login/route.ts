import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth-utils';
import { validateData, loginSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validation = validateData(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation Error',
        message: validation.error
      }, { status: 400 });
    }

    const { email, password } = validation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({
        error: 'Authentication Error',
        message: 'Invalid email or password'
      }, { status: 401 });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user'
    }, { status: 500 });
  }
}