import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCrudHandlers } from '@/lib/crud-factory';
import { withAuthAndRole } from '@/lib/api-utils';
import { generateCampaignLink } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  companyName: z.string().min(1, 'Company name is required'),
});

const handlers = createCrudHandlers({
  modelName: 'campaign',
  entityName: 'Campaign',
  createSchema: campaignSchema,
  updateSchema: campaignSchema,
  includeRelations: {
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    _count: {
      select: {
        leads: true
      }
    }
  },
  orderBy: { createdAt: 'desc' },
  searchFields: ['name', 'companyName'],
  
  // Custom hook to generate unique link before creation
  beforeCreate: async (data, context) => {
    // Generate unique campaign link
    let uniqueLink: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      uniqueLink = generateCampaignLink();
      const existing = await prisma.campaign.findUnique({
        where: { uniqueLink }
      });
      isUnique = !existing;
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique campaign link');
    }

    return {
      ...data,
      uniqueLink: uniqueLink!,
      createdById: context.user?.id
    };
  },

  // Custom hook to check if campaign can be deleted
  canDelete: async (id) => {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { _count: { select: { leads: true } } }
    });
    
    if (campaign && campaign._count.leads > 0) {
      return {
        allowed: false,
        reason: 'Cannot delete campaign with existing leads'
      };
    }
    
    return { allowed: true };
  }
});

export const GET = withAuthAndRole(['ADMIN', 'AGENT'], handlers.GET);
export const POST = withAuthAndRole(['ADMIN', 'AGENT'], handlers.POST);