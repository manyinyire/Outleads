import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['no_sale', 'not_contacted']).optional(),
  isActive: z.boolean().optional(),
});

// PUT - Update disposition
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAndRole(['ADMIN'], async () => {
    try {
      const body = await req.json();
      const validation = updateSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json({
          error: 'Validation Error',
          message: validation.error.errors[0].message
        }, { status: 400 });
      }

      const disposition = await prisma.thirdLevelDisposition.update({
        where: { id: params.id },
        data: validation.data,
      });

      return NextResponse.json({
        message: 'Disposition updated successfully',
        data: disposition
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return NextResponse.json({
          error: 'Not Found',
          message: 'Disposition not found'
        }, { status: 404 });
      }
      console.error('Error updating disposition:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to update disposition'
      }, { status: 500 });
    }
  })(req);
}

// DELETE - Delete disposition
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAndRole(['ADMIN'], async () => {
    try {
      await prisma.thirdLevelDisposition.delete({
        where: { id: params.id },
      });

      return NextResponse.json({
        message: 'Disposition deleted successfully'
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return NextResponse.json({
          error: 'Not Found',
          message: 'Disposition not found'
        }, { status: 404 });
      }
      if (error.code === 'P2003') {
        return NextResponse.json({
          error: 'Constraint Error',
          message: 'Cannot delete disposition that is assigned to leads'
        }, { status: 409 });
      }
      console.error('Error deleting disposition:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to delete disposition'
      }, { status: 500 });
    }
  })(req);
}
