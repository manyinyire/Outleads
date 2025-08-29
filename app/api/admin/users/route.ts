import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { z } from 'zod';
import { createCrudHandlers } from '@/lib/db/crud-factory';
import nodemailer from 'nodemailer';
import { NextRequest } from 'next/server';


const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  sbu: z.string().optional(),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']).default('AGENT'),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'DELETED']).default('ACTIVE')
});

const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  sbu: z.string().optional(),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'DELETED']).optional()
});

const handlers = createCrudHandlers({
  modelName: 'user',
  entityName: 'User',
  createSchema: createUserSchema,
  updateSchema: updateUserSchema,
  includeRelations: {
    _count: {
      select: {
        campaigns: true
      }
    }
  },
  orderBy: { createdAt: 'desc' },
  searchFields: ['username', 'name', 'email'],
  
  
  // Hook to handle default values
  beforeCreate: async (data) => {
    return {
      ...data,
      role: data.role || 'AGENT',
      status: data.status || 'ACTIVE'
    };
  },
  
  // Hook to send activation email after creation
  afterCreate: async (record: any, req: AuthenticatedRequest) => {
    if (record.status === 'ACTIVE') {
      await sendActivationEmail(record.email, record.name);
    }
    
  },

  // Hook to send activation email after status change
  afterUpdate: async (record: any, req: AuthenticatedRequest) => {
    if (record.status === 'ACTIVE') {
      await sendActivationEmail(record.email, record.name);
    }
    
  },
  
  // Prevent deletion of admin users
  canDelete: async (record: any) => {
    if (record.role === 'ADMIN') {
      return {
        allowed: false,
        reason: 'Cannot delete admin users'
      };
    }
    return { allowed: true };
  }
});

const customGetHandler = async (req: NextRequest) => {
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const role = url.searchParams.get('role');
  
  const where: any = {};
  if (status) {
    where.status = { in: status.split(',') };
  }
  if (role) {
    where.role = role;
  }
  
  (req as any).query = { where };
  
  return handlers.GET(req as any);
};

export const GET = withAuthAndRole(['ADMIN', 'BSS', 'INFOSEC', 'SUPERVISOR', 'AGENT'], customGetHandler);
export const POST = withAuthAndRole(['ADMIN', 'BSS'], handlers.POST);

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