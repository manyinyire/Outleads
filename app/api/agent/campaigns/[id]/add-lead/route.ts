import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const quickLeadSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  productIds: z.array(z.string()).min(1, 'At least one product is required'),
  sectorId: z.string().optional(),
});

async function handler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAndRole(['AGENT', 'SUPERVISOR', 'ADMIN'], async (authReq: AuthenticatedRequest) => {
    try {
      const campaignId = params.id;
      const body = await req.json();
      
      const validation = quickLeadSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          error: 'Validation Error',
          message: validation.error.errors[0].message
        }, { status: 400 });
      }

      const { fullName, phoneNumber, productIds, sectorId } = validation.data;

      // Verify campaign exists and agent has access
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { assignedTo: true }
      });

      if (!campaign) {
        return NextResponse.json({
          error: 'Not Found',
          message: 'Campaign not found'
        }, { status: 404 });
      }

      // Get a default sector if none provided
      let finalSectorId = sectorId;
      if (!finalSectorId) {
        const defaultSector = await prisma.sector.findFirst({
          orderBy: { createdAt: 'asc' }
        });
        if (!defaultSector) {
          return NextResponse.json({
            error: 'Configuration Error',
            message: 'No business sector available. Please contact administrator.'
          }, { status: 500 });
        }
        finalSectorId = defaultSector.id;
      }

      // Check if agent is assigned to this campaign
      if (authReq.user?.role === 'AGENT' && campaign.assignedToId !== authReq.user?.id) {
        return NextResponse.json({
          error: 'Forbidden',
          message: 'You can only add leads to your assigned campaigns'
        }, { status: 403 });
      }

      // Check for duplicate phone number globally
      const existingLead = await prisma.lead.findFirst({
        where: {
          phoneNumber
        },
        include: {
          campaign: true
        }
      });

      if (existingLead) {
        const campaignInfo = existingLead.campaign 
          ? `in the "${existingLead.campaign.campaign_name}" campaign` 
          : 'as a direct lead';
        return NextResponse.json({
          error: 'Duplicate',
          message: `This phone number already exists ${campaignInfo}. Please check existing leads before adding.`
        }, { status: 409 });
      }

      // Create the lead
      const lead = await prisma.lead.create({
        data: {
          fullName,
          phoneNumber,
          campaignId,
          assignedToId: authReq.user?.id,
          sectorId: finalSectorId,
          products: {
            connect: productIds.map(id => ({ id }))
          }
        },
        include: {
          products: true,
          campaign: true,
          businessSector: true
        }
      });

      // Update campaign lead count
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          lead_count: { increment: 1 }
        }
      });

      return NextResponse.json({
        message: 'Lead added successfully',
        lead
      }, { status: 201 });

    } catch (error) {
      console.error('Error adding lead:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to add lead'
      }, { status: 500 });
    }
  })(req);
}

export const POST = handler;
