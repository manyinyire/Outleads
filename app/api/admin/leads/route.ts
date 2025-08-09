import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

async function handler(req: any) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    const where = campaignId ? { campaignId } : {};

    const leads = await prisma.lead.findMany({
      where,
      include: {
        campaign: true,
        products: true,
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export const GET = withAuth(handler as any);