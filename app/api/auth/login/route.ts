import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth-utils';
import { validateData, loginSchema } from '@/lib/validation';
import { cookies } from 'next/headers';

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

    const { email: username, password } = validation.data;

    // Call external HRMS service for authentication
    try {
      const hrmsResponse = await fetch('https://hrms.fbc.co.zw/auth/service/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (!hrmsResponse.ok) {
        return NextResponse.json({
          error: 'Authentication Error',
          message: 'Invalid domain credentials'
        }, { status: 401 });
      }

      const hrmsData = await hrmsResponse.json();
      
      // Extract user information from HRMS response
      const userEmail = hrmsData.email || `${username}@fbc.co.zw`;
      const userName = hrmsData.name || hrmsData.first_name || username;

      // Check if user exists in our database
      let user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          role: true,
          status: true,
          sbu: true,
          lastLogin: true
        }
      });

      let isNewUser = false;

      // Create user if they don't exist
      if (!user) {
        user = await prisma.user.create({
          data: {
            username,
            email: userEmail,
            name: userName,
            role: 'AGENT', // Default role
            status: 'PENDING' // New users start as pending
          },
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            role: true,
            status: true,
            sbu: true,
            lastLogin: true
          }
        });
        isNewUser = true;
      } else {
        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });
      }

      // Check if user account is active
      if (user.status !== 'ACTIVE' && !isNewUser) {
        return NextResponse.json({
          error: 'Account Status Error',
          message: 'Your account is not active. Please contact an administrator.'
        }, { status: 403 });
      }

      // Generate JWT token
      const token = generateToken(user.id);

      // Set HTTP-only cookie for session management
      const cookieStore = cookies();
      cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
      });

      // Return user data and onboarding status
      const response = NextResponse.json({
        message: 'Login successful',
        user,
        isNewUser,
        needsOnboarding: isNewUser || !user.sbu,
        token,
        expiresIn: '24h'
      });

      return response;

    } catch (hrmsError) {
      console.error('HRMS authentication error:', hrmsError);
      return NextResponse.json({
        error: 'Authentication Service Error',
        message: 'Unable to verify credentials with domain service'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user'
    }, { status: 500 });
  }
}