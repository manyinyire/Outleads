import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { createCrudHandlers } from '@/lib/crud-factory';

const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  company: z.string().min(1, 'Company/Sector is required'),
  productIds: z.array(z.string()).min(1, 'At least one product is required'),
  campaignId: z.string().optional(),
});

const updateLeadSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(1).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
  notes: z.string().optional(),
});

const handlers = createCrudHandlers({
  modelName: 'lead',
  entityName: 'Lead',
  createSchema: createLeadSchema,
  updateSchema: updateLeadSchema,
  includeRelations: {
    businessSector: {
      select: {
        id: true,
        name: true,
      },
    },
    products: {
      select: {
        id: true,
        name: true,
        description: true,
      },
    },
    campaign: {
      select: {
        id: true,
        campaign_name: true,
        organization_name: true,
        uniqueLink: true,
      },
    },
  },
  orderBy: { createdAt: 'desc' },
  searchFields: ['fullName', 'email', 'phoneNumber'],

  // Custom hook to transform and validate data before creation
  beforeCreate: async (data, context) => {
    const { name, phone, company, productIds, campaignId } = data;

    // Find sector by ID (form now sends sector ID)
    const sector = await prisma.sector.findUnique({
      where: { id: company },
    });

    if (!sector) {
      console.log(`Sector not found for ID: ${company}`);
      throw new Error(`Business sector not found. Please select a valid sector.`);
    }

    // Validate products exist
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (products.length !== productIds.length) {
      throw new Error('One or more product IDs are invalid');
    }

    // Validate campaign if provided and increment lead_count
    if (campaignId && typeof campaignId === 'string') {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Use a transaction to ensure both operations succeed
      await prisma.$transaction([
        prisma.campaign.update({
          where: { id: campaignId },
          data: { lead_count: { increment: 1 } },
        }),
      ]);
    }

    // Transform data for database
    return {
      fullName: name,
      phoneNumber: phone,
      sectorId: sector.id,
      campaignId: campaignId || undefined,
      products: {
        connect: productIds.map((id: string) => ({ id })),
      },
    };
  },
});

// Public endpoint - no authentication required
export const POST = handlers.POST;

// GET endpoint - requires authentication (handled in crud factory)
export const GET = handlers.GET;
