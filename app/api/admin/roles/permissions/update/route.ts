import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withAuthAndRole } from '@/lib/auth';

const updateRolePermissionsSchema = z.object({
  role: z.string(),
  permissionIds: z.array(z.string()),
});

async function updateRolePermissions(req: Request) {
  try {
    const body = await req.json();
    const validation = updateRolePermissionsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { role, permissionIds } = validation.data;

    // Delete existing permissions for the role
    await prisma.rolePermission.deleteMany({
      where: { role: role as any },
    });

    // Create new permissions
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        role: role as any,
        permissionId,
      })),
    });

    return NextResponse.json({ message: 'Permissions updated successfully.' });
  } catch (error) {
    console.error('Update role permissions error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}

export const POST = withAuthAndRole(['ADMIN'], updateRolePermissions);
