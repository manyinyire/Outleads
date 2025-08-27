import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole } from '@/lib/auth/auth';

async function getPendingUsers() {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('Fetch pending users error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const GET = withAuthAndRole(['ADMIN'], getPendingUsers);
