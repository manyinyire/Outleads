import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const updateUserSchema = z.object({
  sbu: z.string().optional(),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE']).optional()
});

// GET /api/admin/users - List all users (Admin, BSS, InfoSec only)
export const GET = withAuthAndRole(['ADMIN', 'BSS', 'INFOSEC'], async (req: AuthenticatedRequest) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        sbu: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            campaigns: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to fetch users'
    }, { status: 500 });
  }
});

// POST /api/admin/users - Create new user (Admin only)
export const POST = withAuthAndRole(['ADMIN'], async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const { username, email, name, sbu, role } = body;

    if (!username || !email || !name) {
      return NextResponse.json({
        error: 'Validation Error',
        message: 'Username, email, and name are required'
      }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
        name,
        sbu,
        role: role || 'AGENT',
        status: 'ACTIVE' // Admin-created users are active by default
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        sbu: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: 'User created successfully',
      user
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to create user'
    }, { status: 500 });
  }
});

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