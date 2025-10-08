import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { withErrorHandler, successResponse, errorResponse, validateRequestBody, handlePrismaError } from '@/lib/api/api-utils';
import { logger } from '@/lib/utils/logging';


const campaignCreateSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required'),
  organization_name: z.string().min(1, 'Organization name is required'),
  assignedToId: z.string().min(1, 'Agent is required'),
});

const postCampaigns = withErrorHandler(async (req: AuthenticatedRequest) => {
  const userId = req.user?.id;
  if (!userId) {
    return errorResponse('User not found in token', 401);
  }

  const validation = await validateRequestBody(req as any, campaignCreateSchema);
  if (!validation.success) return validation.error;

  const { campaign_name, organization_name, assignedToId } = validation.data;
  const unique_link = nanoid(10);

  const newCampaign = await prisma.campaign.create({
    data: {
      campaign_name,
      organization_name,
      uniqueLink: unique_link,
      createdById: userId,
      assignedToId,
    },
  });

  logger.info('Campaign created', { campaignId: newCampaign.id, userId });
  return successResponse(newCampaign, 201);
})

const getCampaigns = withErrorHandler(async (req: AuthenticatedRequest) => {
  const user = req.user;
  const whereClause: any = {};

  if (user?.role === 'AGENT') {
    whereClause.assignedToId = user.id;
  }

  const campaigns = await prisma.campaign.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      assignedTo: {
        select: {
          name: true,
        },
      },
    },
  });

  return successResponse({ data: campaigns });
})

export const POST = withAuthAndRole(['ADMIN', 'SUPERVISOR'], postCampaigns);
export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR', 'AGENT'], getCampaigns);
