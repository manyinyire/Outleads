import { prisma } from '@/lib/db/prisma';
import { errorResponse, successResponse } from '@/lib/api/api-utils';
import { z } from 'zod';
import { createCrudHandlers } from '@/lib/db/crud-factory';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/utils/logging';

export const runtime = 'nodejs';

const createLeadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255, 'Name is too long'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(20, 'Phone number is too long')
    .regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Invalid phone number format'),
  company: z.string().cuid('Invalid sector ID'),
  productIds: z.array(z.string().cuid('Invalid product ID')).min(1, 'At least one product is required').max(10, 'Too many products selected'),
  campaignId: z.string().cuid('Invalid campaign ID').optional(),
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
  // ... other handlers
});

// Custom POST handler to manage transaction manually
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = createLeadSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Validation failed', 400, 'Validation Error', validation.error.format());
    }

    const { name, phone, company, productIds, campaignId } = validation.data;

    // Check for duplicate phone number globally across all leads
    const existingLead = await prisma.lead.findFirst({
      where: {
        phoneNumber: phone
      },
      include: {
        campaign: true
      }
    });

    if (existingLead) {
      const campaignInfo = existingLead.campaign 
        ? `for the "${existingLead.campaign.campaign_name}" campaign` 
        : 'as a direct inquiry';
      return errorResponse(
        `This phone number has already been registered ${campaignInfo}. If you need to update your information, please contact our support team.`, 
        409
      );
    }

    const sector = await prisma.sector.findUnique({ where: { id: company } });
    if (!sector) {
      return errorResponse('Business sector not found.', 400);
    }

    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      return errorResponse('One or more product IDs are invalid.', 400);
    }

    const leadData: any = {
      fullName: name,
      phoneNumber: phone,
      businessSector: { connect: { id: sector.id } },
      products: { connect: productIds.map((id) => ({ id })) },
    };

    if (campaignId) {
      try {
        const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign) {
          return errorResponse('Campaign not found.', 400);
        }

        leadData.campaign = { connect: { id: campaignId } };
        leadData.assignedTo = { connect: { id: campaign.assignedToId } };

        const newLead = await prisma.$transaction(async (tx: any) => {
          const createdLead = await tx.lead.create({ data: leadData });
          await tx.campaign.update({
            where: { id: campaignId },
            data: { lead_count: { increment: 1 } },
          });
          return createdLead;
        });



        return successResponse({ message: 'Lead created successfully', data: newLead }, 201);
      } catch (transactionError) {
        logger.error('Transaction failed during lead creation with campaign', transactionError as Error, { campaignId });
        return errorResponse('Failed to process lead with campaign.', 500);
      }
    } else {
      const newLead = await prisma.lead.create({ data: leadData });
      
      
      
      return successResponse({ message: 'Lead created successfully', data: newLead }, 201);
    }
  } catch (error: any) {
    logger.error('Unexpected error in POST /api/leads', error as Error);
    return errorResponse('Internal Server Error. Please try again later.', 500);
  }
}

// GET endpoint - requires authentication (handled in crud factory)
export const GET = handlers.GET;