import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { logger } from '@/lib/utils/logging';
import { z } from 'zod';

export const runtime = 'nodejs';

const completeRegistrationSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']),
});

async function handler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const validation = completeRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { userId, role } = validation.data;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: 'Not Found', message: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({ message: 'Registration completed successfully.' });
  } catch (error) {
    logger.error('Complete registration error', error as Error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const POST = withAuthAndRole(['ADMIN', 'BSS'], handler);
