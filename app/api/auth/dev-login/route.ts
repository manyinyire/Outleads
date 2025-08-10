import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { generateToken } from '@/lib/auth-utils';

const devLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional(),
  sbuName: z.string().optional()
});

export async function POST(req: Request) {
  try {
    if (`${process.env.NODE_ENV}` === 'production') {
      return NextResponse.json({
        error: 'Forbidden',
        message: 'Dev login is disabled in production'
      }, { status: 403 });
    }

    const body = await req.json();
    const parsed = devLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Validation Error',
        message: parsed.error.errors[0]?.message || 'Invalid request'
      }, { status: 400 });
    }

    const { username, role, status, sbuName } = parsed.data;

    // Optional SBU resolution by name
    let resolvedSbuId: string | undefined = undefined;
    if (sbuName) {
      const sbu = await prisma.sbu.findUnique({ where: { name: sbuName } });
      if (!sbu) {
        return NextResponse.json({
          error: 'Validation Error',
          message: `SBU "${sbuName}" not found`
        }, { status: 400 });
      }
      resolvedSbuId = sbu.id;
    }

    // Find or create user
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

    if (!user) {
      user = await prisma.user.create({
        data: {
          username,
          email: `${username}@fbc.co.zw`,
          name: username,
          role: (role as any) || 'ADMIN',
          status: (status as any) || 'ACTIVE',
          ...(resolvedSbuId ? { sbuId: resolvedSbuId } : {})
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
    } else if (role || status || typeof resolvedSbuId !== 'undefined') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(role ? { role: role as any } : {}),
          ...(status ? { status: status as any } : {}),
          ...(typeof resolvedSbuId !== 'undefined' ? { sbuId: resolvedSbuId } : {})
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
    }

    // Issue JWT & set cookie
    const token = generateToken(user.id);
    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: `${process.env.NODE_ENV}` === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return NextResponse.json({
      message: 'Dev login successful',
      user,
      token,
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to perform dev login'
    }, { status: 500 });
  }
}
