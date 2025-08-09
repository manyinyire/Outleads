import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { z } from 'zod';

const onboardingSchema = z.object({
  sbu: z.string().min(1, 'SBU is required'),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  })
});

// POST /api/auth/onboarding - Complete user onboarding
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    
    // Validate request data
    const validation = onboardingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation Error',
        message: validation.error.errors[0].message
      }, { status: 400 });
    }

    const { sbu, role } = validation.data;
    const userId = req.user!.id;

    // Update user with onboarding information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        sbu,
        role: role as any, // Type assertion for enum
        status: 'PENDING' // User needs activation by BSS
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        sbu: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: 'Onboarding completed successfully. Your account is pending activation.',
      user: updatedUser
    });

  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to complete onboarding'
    }, { status: 500 });
  }
});
