import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuthAndRole } from '@/lib/auth';

export const POST = withAuthAndRole(['ADMIN'], async (req) => {
  try {
    const body = await req.json();
    const { first_name, last_name, email, department, role, username } = body;

    const user = await prisma.user.create({
      data: {
        username,
        name: `${first_name} ${last_name}`,
        email,
        sbu: department,
        role,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
