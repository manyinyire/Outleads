import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuthAndRole } from '@/lib/auth';

async function getRolePermissions() {
  try {
    const roles = await prisma.rolePermission.findMany({
      include: {
        permission: true,
      },
    });
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Get role permissions error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const GET = withAuthAndRole(['ADMIN'], getRolePermissions);
