import { NextResponse } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-utils';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const hasAccess = await checkUserRole(['ADMIN', 'SUPERVISOR']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        is_active: !campaign.is_active,
      },
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error(`Error updating campaign status ${params.id}:`, error);
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
