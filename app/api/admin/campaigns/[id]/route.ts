import { NextResponse } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';

const campaignUpdateSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required'),
  organization_name: z.string().min(1, 'Organization name is required'),
});

async function getCampaign(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: { leads: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error(`Error fetching campaign ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function updateCampaign(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validation = campaignUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { campaign_name, organization_name } = validation.data;

    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        campaign_name,
        organization_name,
      },
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error(`Error updating campaign ${params.id}:`, error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function deleteCampaign(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.campaign.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting campaign ${params.id}:`, error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR'], getCampaign);
export const PUT = withAuthAndRole(['ADMIN', 'SUPERVISOR'], updateCampaign);
export const DELETE = withAuthAndRole(['ADMIN', 'SUPERVISOR'], deleteCampaign);