import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth-utils';
import { validateData, loginSchema } from '@/lib/validation';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { username, password } = body;

    let hrmsData: any = {};
    
    // Development bypass for HRMS authentication
    if (process.env.DEV_BYPASS_AUTH === 'true') {
      console.log('Using development auth bypass for username:', username);
      
      // Create mock HRMS data for development
      const devUsers: Record<string, any> = {
        'admin': {
          email: 'admin@fbc.co.zw',
          first_name: 'Admin',
          last_name: 'User',
          role: 'ADMIN',
          sbu: 'IT'
        },
        'test': {
          email: 'test@fbc.co.zw',
          first_name: 'Test',
          last_name: 'User',
          role: 'AGENT',
          sbu: 'Sales'
        },
        'supervisor': {
          email: 'supervisor@fbc.co.zw',
          first_name: 'Super',
          last_name: 'Visor',
          role: 'SUPERVISOR',
          sbu: 'Management'
        }
      };
      
      if (devUsers[username] && password === 'test123') {
        hrmsData = devUsers[username];
      } else {
        return NextResponse.json({
          error: 'Authentication Error',
          message: 'Invalid credentials. Use: admin/test123, test/test123, or supervisor/test123'
        }, { status: 401 });
      }
    } else {
      // Production HRMS authentication
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

      hrmsData = await hrmsResponse.json();
    }
    
    let user = await prisma.user.findUnique({
      where: { username },
      include: {
        sbu: true
      }
    });

    let isNewUser = false;

    if (!user) {
      const userEmail = hrmsData.email || `${username}@fbc.co.zw`;
      const userName = (hrmsData.first_name && hrmsData.last_name) ? `${hrmsData.first_name} ${hrmsData.last_name}` : (hrmsData.name || hrmsData.first_name || username);
      const userRole = hrmsData.role || 'AGENT';

      // Find or create SBU if provided
      let sbuId = null;
      if (hrmsData.sbu) {
        let sbu = await prisma.sbu.findUnique({
          where: { name: hrmsData.sbu }
        });
        
        if (!sbu) {
          sbu = await prisma.sbu.create({
            data: { name: hrmsData.sbu }
          });
        }
        sbuId = sbu.id;
      }

      user = await prisma.user.create({
        data: {
          username,
          email: userEmail,
          name: userName,
          sbuId,
          role: userRole,
          status: 'ACTIVE' // Set to ACTIVE for dev users
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