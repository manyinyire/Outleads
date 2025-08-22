import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { nanoid } from 'nanoid';

import { prisma } from '@/lib/prisma';
import { getUserByEmail } from '@/lib/db-utils';
import { checkUserRole } from '@/lib/auth-utils';

const campaignCreateSchema = z.object({
  campaign_name: z.string().min(1, 'Campaign name is required'),
  organization_name: z.string().min(1, 'Organization name is required'),
});

export async function POST(req: Request) {
  try {
    // Check user role
    const hasAccess = await checkUserRole(['ADMIN', 'TEAMLEADER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validation = campaignCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { campaign_name, organization_name } = validation.data;
    const unique_link = nanoid(10); // Generate a unique link

    // Get current user - assuming you have a way to get the logged-in user's email
    // This part needs to be adapted to your actual authentication logic
    const currentUser = await getUserByEmail('admin@fbc.co.zw'); // Placeholder
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newCampaign = await prisma.campaign.create({
      data: {
        campaign_name,
        organization_name,
        uniqueLink: unique_link,
        createdById: currentUser.id,
      },
    });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'A campaign with this name already exists.' }, { status: 409 });
      }
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check user role
    const hasAccess = await checkUserRole(['ADMIN', 'TEAMLEADER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}