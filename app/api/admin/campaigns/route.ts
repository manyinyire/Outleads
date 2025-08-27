import { NextResponse } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { z } from 'zod';
import { nanoid } from 'nanoid';

import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';

const campaignCreateSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required'),
  organization_name: z.string().min(1, 'Organization name is required'),
  assignedToId: z.string().min(1, 'Agent is required'),
});

const postCampaigns = async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User not found in token' }, { status: 401 });
    }

    const body = await req.json();
    const validation = campaignCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

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

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A campaign with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const getCampaigns = async (req: AuthenticatedRequest) => {
  try {
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

    return NextResponse.json({ data: campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuthAndRole(['ADMIN', 'SUPERVISOR'], postCampaigns);
export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR', 'AGENT'], getCampaigns);
