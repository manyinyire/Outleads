import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { createCrudHandlers } from '@/lib/crud-factory';
import { Prisma } from '@prisma/client';

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
  // ... other handlers
});

// Custom POST handler to manage transaction manually
export async function POST(req: Request) {
  console.log('--- [POST /api/leads] Received new lead submission ---');
  try {
    const body = await req.json();
    console.log('[1/7] Request body:', body);

    const validation = createLeadSchema.safeParse(body);
    if (!validation.success) {
      console.error('[FAIL] Validation failed:', validation.error.format());
      return errorResponse(validation.error.format(), 400);
    }
    console.log('[2/7] Validation successful.');

    const { name, phone, company, productIds, campaignId } = validation.data;

    const sector = await prisma.sector.findUnique({ where: { id: company } });
    if (!sector) {
      console.error('[FAIL] Sector not found for ID:', company);
      return errorResponse('Business sector not found.', 400);
    }
    console.log('[3/7] Sector validated:', sector.name);

    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      console.error('[FAIL] Product validation failed. Mismatch in product IDs.');
      return errorResponse('One or more product IDs are invalid.', 400);
    }
    console.log('[4/7] Products validated.');

    const leadData: Prisma.LeadCreateInput = {
      fullName: name,
      phoneNumber: phone,
      businessSector: { connect: { id: sector.id } },
      products: { connect: productIds.map((id) => ({ id })) },
    };
    console.log('[5/7] Base lead data constructed:', leadData);

    if (campaignId) {
      console.log(`[6/7] Campaign ID detected: ${campaignId}. Starting transaction.`);
      try {
        const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign) {
          console.error(`[FAIL] Campaign with ID ${campaignId} not found.`);
          return errorResponse('Campaign not found.', 400);
        }
        console.log('--- Campaign found:', campaign.campaign_name);

        leadData.campaign = { connect: { id: campaignId } };
        console.log('--- Lead data with campaign relation:', leadData);

        const newLead = await prisma.$transaction(async (tx) => {
          console.log('--- Inside transaction: Creating lead...');
          const createdLead = await tx.lead.create({ data: leadData });
          console.log('--- Inside transaction: Lead created with ID:', createdLead.id);

          console.log('--- Inside transaction: Updating campaign lead_count...');
          await tx.campaign.update({
            where: { id: campaignId },
            data: { lead_count: { increment: 1 } },
          });
          console.log('--- Inside transaction: Campaign updated.');

          return createdLead;
        });

        console.log('[7/7] Transaction successful. New lead:', newLead);
        return successResponse({ message: 'Lead created successfully', data: newLead }, 201);
      } catch (transactionError) {
        console.error('--- [FAIL] Transaction failed! ---', transactionError);
        return errorResponse('Failed to process lead with campaign.', 500);
      }
    } else {
      console.log('[6/7] No campaign ID. Creating direct lead.');
      const newLead = await prisma.lead.create({ data: leadData });
      console.log('[7/7] Direct lead created successfully:', newLead);
      return successResponse({ message: 'Lead created successfully', data: newLead }, 201);
    }
  } catch (error: any) {
    console.error('--- [FATAL] An unexpected error occurred in POST /api/leads ---', error);
    return errorResponse(`Internal Server Error: ${error.message}`, 500);
  }
}

// GET endpoint - requires authentication (handled in crud factory)
export const GET = handlers.GET;