import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth-utils';
import { validateData, loginSchema } from '@/lib/validation';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { username, password } = body;

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
    
    let user = await prisma.user.findUnique({
      where: { username },
    });

    let isNewUser = false;

    if (!user) {
      const userEmail = hrmsData.email || `${username}@fbc.co.zw`;
      const userName = (hrmsData.first_name && hrmsData.last_name) ? `${hrmsData.first_name} ${hrmsData.last_name}` : (hrmsData.name || hrmsData.first_name || username);
      const userSbu = hrmsData.sbu || null;
      const userRole = hrmsData.role || 'AGENT';

      user = await prisma.user.create({
        data: {
          username,
          email: userEmail,
          name: userName,
          sbu: userSbu,
          role: userRole,
          status: 'PENDING'
        }
      });
      isNewUser = true;
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    }

    if (user.status !== 'ACTIVE' && !isNewUser) {
      return NextResponse.json({
        error: 'Account Status Error',
        message: 'Your account is not active. Please contact an administrator.'
      }, { status: 403 });
    }

    const token = generateToken(user.id);

    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60
    });

    return NextResponse.json({
      message: 'Login successful',
      user,
      isNewUser,
      needsOnboarding: isNewUser || !user.sbu,
      token,
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user'
    }, { status: 500 });
  }
}