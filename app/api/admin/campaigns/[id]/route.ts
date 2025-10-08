import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { withErrorHandler, successResponse, errorResponse, validateRequestBody } from '@/lib/api/api-utils';

const campaignUpdateSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required'),
  organization_name: z.string().min(1, 'Organization name is required'),
});

const getCampaign = withErrorHandler(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: { leads: true },
  });

  if (!campaign) {
    return errorResponse('Campaign not found', 404);
  }

  return successResponse(campaign);
})

const updateCampaign = withErrorHandler(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const validation = await validateRequestBody(req as any, campaignUpdateSchema);
  if (!validation.success) return validation.error;

  const { campaign_name, organization_name } = validation.data;

  const updatedCampaign = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      campaign_name,
      organization_name,
    },
  });

  return successResponse(updatedCampaign);
})

const deleteCampaign = withErrorHandler(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  await prisma.campaign.delete({
    where: { id: params.id },
  });

  return new NextResponse(null, { status: 204 });
})

export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR'], getCampaign);
export const PUT = withAuthAndRole(['ADMIN', 'SUPERVISOR'], updateCampaign);
export const DELETE = withAuthAndRole(['ADMIN', 'SUPERVISOR'], deleteCampaign);