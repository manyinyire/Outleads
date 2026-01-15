import { NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { withErrorHandler, successResponse, errorResponse, validateRequestBody, handlePrismaError, extractPaginationParams, calculatePaginationMeta } from '@/lib/api/api-utils';
import { logger } from '@/lib/utils/logging';

export const runtime = 'nodejs';

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
  const url = (req as any).url || (req as any).nextUrl?.href || '';
  const { page, limit, sortBy, sortOrder } = extractPaginationParams(url);
  const skip = ((page || 1) - 1) * (limit || 10);
  
  const whereClause: any = {};

  if (user?.role === 'AGENT') {
    whereClause.assignedToId = user.id;
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where: whereClause,
      skip,
      take: limit || 10,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      include: {
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.campaign.count({ where: whereClause })
  ]);

  const meta = calculatePaginationMeta(total, page || 1, limit || 10);

  return successResponse({ data: campaigns, meta });
})

export const POST = withAuthAndRole(['ADMIN', 'SUPERVISOR'], postCampaigns);
export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR', 'AGENT'], getCampaigns);
