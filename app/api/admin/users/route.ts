import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { z } from 'zod';
import { createCrudHandlers } from '@/lib/db/crud-factory';
import nodemailer from 'nodemailer';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logging';


const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']).default('AGENT'),
  status: z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'DELETED']).default('ACTIVE')
});

const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
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
  
  // Build custom where clause
  const customWhere: any = {};
  if (status) {
    customWhere.status = { in: status.split(',') };
  }
  if (role) {
    customWhere.role = role;
  }
  
  // If we have custom filters, we need to handle the query manually
  if (Object.keys(customWhere).length > 0) {
    const { prisma } = await import('@/lib/db/prisma');
    const { extractPaginationParams, calculatePaginationMeta, successResponse } = await import('@/lib/api/api-utils');
    
    const { page, limit } = extractPaginationParams(req.url);
    const skip = ((page || 1) - 1) * (limit || 10);
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: customWhere,
        skip,
        take: limit || 10,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              campaigns: true
            }
          }
        }
      }),
      prisma.user.count({ where: customWhere })
    ]);
    
    const meta = calculatePaginationMeta(total, page || 1, limit || 10);
    
    return successResponse({
      data: users,
      meta
    });
  }
  
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
    logger.info('Activation email sent successfully', { userEmail, userName });
  } catch (error) {
    logger.error('Failed to send activation email', error as Error, { userEmail, userName });
    // Don't throw error - activation should still succeed even if email fails
  }
}