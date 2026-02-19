import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { logger } from '@/lib/utils/logging';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/email';
import { env } from '@/lib/utils/config/env-validation';

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'DELETED', 'REJECTED']).optional()
});

// PUT /api/admin/users/[id] - Update user (BSS and Admin only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withAuthAndRole(['ADMIN', 'BSS', 'SUPERVISOR'], async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { id } = params;
      
      const validation = updateUserSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          error: 'Validation Error',
          message: validation.error.errors[0].message
        }, { status: 400 });
      }

      const updateData = validation.data;

      const currentUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!currentUser) {
        return NextResponse.json({
          error: 'Not Found',
          message: 'User not found'
        }, { status: 404 });
      }

      const isBeingActivated = updateData.status === 'ACTIVE' && currentUser.status !== 'ACTIVE';
      const isBeingRejected = updateData.status === 'REJECTED' && currentUser.status !== 'REJECTED';

      if (isBeingActivated && !['ADMIN', 'BSS'].includes(req.user!.role)) {
        return NextResponse.json({
          error: 'Forbidden',
          message: 'You do not have permission to approve users.'
        }, { status: 403 });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      if (isBeingActivated) {
        await sendEmail({
          to: updatedUser.email,
          subject: 'Your Outleads Account has been Activated',
          text: `Hello ${updatedUser.name},\n\nCongratulations! Your account for the Outleads platform has been activated.\n\nYou can now log in using your domain credentials.\n\nThank you,\nThe Outleads Team`,
          html: `<p>Hello ${updatedUser.name},</p><p>Congratulations! Your account for the Outleads platform has been activated.</p><p>You can now log in using your domain credentials.</p><p>Thank you,<br>The Outleads Team</p>`,
        });
      } else if (isBeingRejected) {
        await sendEmail({
          to: updatedUser.email,
          subject: 'Your Outleads Account Request',
          text: `Hello ${updatedUser.name},\n\nWe regret to inform you that your request for access to the Outleads platform has been rejected.\n\nIf you believe this is an error, please contact an administrator.\n\nThank you,\nThe Outleads Team`,
          html: `<p>Hello ${updatedUser.name},</p><p>We regret to inform you that your request for access to the Outleads platform has been rejected.</p><p>If you believe this is an error, please contact an administrator.</p><p>Thank you,<br>The Outleads Team</p>`,
        });
      }

      return NextResponse.json({
        message: 'User updated successfully',
        user: updatedUser
      });

    } catch (error) {
      logger.error('Error updating user', error as Error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to update user'
      }, { status: 500 });
    }
  })(request);
}

// DELETE /api/admin/users/[id] - Deactivate user (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id:string } }
) {
  return withAuthAndRole(['ADMIN', 'BSS', 'SUPERVISOR'], async (req: AuthenticatedRequest) => {
    const { id } = params;
    
    try {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status: 'DELETED' },
      });

      return NextResponse.json({
        message: 'User deleted successfully',
        user: updatedUser
      });
    } catch (error) {
      logger.error('Error deactivating user', error as Error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to deactivate user'
      }, { status: 500 });
    }
  })(request);
}
