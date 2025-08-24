import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth';
import { z } from 'zod';
import * as nodemailer from 'nodemailer';

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  sbu: z.string().optional(),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional()
});

// PUT /api/admin/users/[id] - Update user (BSS and Admin only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  return withAuthAndRole(['ADMIN', 'BSS'], async (req: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const { id } = params;
      
      // Validate request data
      const validation = updateUserSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          error: 'Validation Error',
          message: validation.error.errors[0].message
        }, { status: 400 });
      }

      const updateData = validation.data;

      // Get current user data
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }) as any;

      if (!currentUser) {
        return NextResponse.json({
          error: 'Not Found',
          message: 'User not found'
        }, { status: 404 });
      }

      // Check if user is being activated
      const isBeingActivated = updateData.status === 'ACTIVE' && currentUser?.status !== 'ACTIVE';

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData as any, // Type assertion for enum values
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }) as any;

      // Send activation email if user was activated
      if (isBeingActivated && currentUser.email && currentUser.name) {
        await sendActivationEmail(currentUser.email, currentUser.name);
      }

      return NextResponse.json({
        message: isBeingActivated ? 'User activated and notification email sent' : 'User updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Error updating user:', error);
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
  { params }: { params: { id: string } }
) {
  return withAuthAndRole(['ADMIN'], async (req: AuthenticatedRequest) => {
    const { id } = params;
    
    try {
      // Update user status to INACTIVE instead of deleting
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status: 'INACTIVE' } as any,
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }) as any;

      return NextResponse.json({
        message: 'User deactivated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to deactivate user'
      }, { status: 500 });
    }
  })(request);
}

// Helper function to send activation email
async function sendActivationEmail(userEmail: string, userName: string) {
  try {
    // Configure nodemailer (you'll need to set up SMTP credentials)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@fbc.co.zw',
      to: userEmail,
      subject: 'Account Activated - Nexus Financial Services Portal',
      html: `
        <h2>Account Activated</h2>
        <p>Dear ${userName},</p>
        <p>Your account for the Nexus Financial Services Portal has been activated.</p>
        <p>You can now access the system with your domain credentials.</p>
        <p>Best regards,<br>Nexus Financial Services Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Activation email sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send activation email:', error);
    // Don't throw error - activation should still succeed even if email fails
  }
}
