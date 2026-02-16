import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const assignCampaignSchema = z.object({
  campaignId: z.string().cuid('Invalid campaign ID'),
});

async function handler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuthAndRole(['ADMIN', 'SUPERVISOR'], async (authReq: AuthenticatedRequest) => {
    try {
      const leadId = params.id;
      const body = await req.json();
      
      const validation = assignCampaignSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          error: 'Validation Error',
          message: validation.error.errors[0].message
        }, { status: 400 });
      }

      const { campaignId } = validation.data;

      // Check if lead exists
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { campaign: true }
      });

      if (!lead) {
        return NextResponse.json({
          error: 'Not Found',
          message: 'Lead not found'
        }, { status: 404 });
      }

      // Prevent reassignment if already assigned to a campaign
      if (lead.campaignId) {
        return NextResponse.json({
          error: 'Already Assigned',
          message: `This lead is already assigned to the "${lead.campaign?.campaign_name}" campaign and cannot be reassigned.`
        }, { status: 409 });
      }

      // Verify campaign exists and is active
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return NextResponse.json({
          error: 'Not Found',
          message: 'Campaign not found'
        }, { status: 404 });
      }

      if (!campaign.is_active) {
        return NextResponse.json({
          error: 'Invalid Campaign',
          message: 'Cannot assign leads to an inactive campaign'
        }, { status: 400 });
      }

      // Assign lead to campaign using transaction
      const updatedLead = await prisma.$transaction(async (tx) => {
        // Update the lead
        const updated = await tx.lead.update({
          where: { id: leadId },
          data: {
            campaignId,
            assignedToId: campaign.assignedToId
          },
          include: {
            campaign: true,
            assignedTo: true,
            products: true,
            businessSector: true
          }
        });

        // Increment campaign lead count
        await tx.campaign.update({
          where: { id: campaignId },
          data: {
            lead_count: { increment: 1 }
          }
        });

        return updated;
      });

      return NextResponse.json({
        message: 'Lead assigned to campaign successfully',
        lead: updatedLead
      }, { status: 200 });

    } catch (error) {
      console.error('Error assigning lead to campaign:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to assign lead to campaign'
      }, { status: 500 });
    }
  })(req);
}

export const POST = handler;
