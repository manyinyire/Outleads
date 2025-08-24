import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const completeRegistrationSchema = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = completeRegistrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { userId, role } = validation.data;

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({ message: 'Registration completed successfully.' });
  } catch (error) {
    console.error('Complete registration error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
