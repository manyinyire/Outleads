import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withAuthAndRole } from '@/lib/auth';

const approveUserSchema = z.object({
  userId: z.string(),
});

async function approveUser(req: Request) {
  try {
    const body = await req.json();
    const validation = approveUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { userId } = validation.data;

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'APPROVED' },
    });

    return NextResponse.json({ message: 'User approved successfully.' });
  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const POST = withAuthAndRole(['ADMIN'], approveUser);
