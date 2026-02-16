import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const bulkAssignCampaignSchema = z.object({
  leadIds: z.array(z.string().cuid('Invalid lead ID')).min(1, 'At least one lead is required'),
  campaignId: z.string().cuid('Invalid campaign ID'),
});

async function handler(req: NextRequest) {
  return withAuthAndRole(['ADMIN', 'SUPERVISOR', 'AGENT'], async (authReq: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      
      const validation = bulkAssignCampaignSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json({
          error: 'Validation Error',
          message: validation.error.errors[0].message
        }, { status: 400 });
      }

      const { leadIds, campaignId } = validation.data;

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

      // Check which leads exist and which are already assigned
      const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds } },
        include: { campaign: true }
      });

      const existingLeadIds = leads.map(l => l.id);
      const notFoundLeadIds = leadIds.filter(id => !existingLeadIds.includes(id));
      const alreadyAssignedLeads = leads.filter(l => l.campaignId);
      const assignableLeads = leads.filter(l => !l.campaignId);

      if (assignableLeads.length === 0) {
        return NextResponse.json({
          error: 'No Assignable Leads',
          message: 'All selected leads are already assigned to campaigns',
          details: {
            alreadyAssigned: alreadyAssignedLeads.length,
            notFound: notFoundLeadIds.length
          }
        }, { status: 400 });
      }

      // Bulk assign leads to campaign using transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update all assignable leads
        const updated = await tx.lead.updateMany({
          where: { 
            id: { in: assignableLeads.map(l => l.id) }
          },
          data: {
            campaignId,
            assignedToId: campaign.assignedToId
          }
        });

        // Increment campaign lead count
        await tx.campaign.update({
          where: { id: campaignId },
          data: {
            lead_count: { increment: assignableLeads.length }
          }
        });

        return updated;
      });

      return NextResponse.json({
        message: `Successfully assigned ${assignableLeads.length} lead(s) to campaign`,
        details: {
          assigned: assignableLeads.length,
          skipped: alreadyAssignedLeads.length,
          notFound: notFoundLeadIds.length,
          skippedLeads: alreadyAssignedLeads.map(l => ({
            id: l.id,
            name: l.fullName,
            existingCampaign: l.campaign?.campaign_name
          }))
        }
      }, { status: 200 });

    } catch (error) {
      console.error('Error bulk assigning leads to campaign:', error);
      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Failed to assign leads to campaign'
      }, { status: 500 });
    }
  })(req);
}

export const POST = handler;
