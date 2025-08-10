import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    const where: any = {};
    if (campaignId) where.campaignId = campaignId;

    // SBU-based visibility: limit AGENT/SUPERVISOR to their SBU's products' leads
    const role = req.user?.role;
    const sbuId = (req.user as any)?.sbu?.id || (req.user as any)?.sbuId;
    if (sbuId && (role === 'AGENT' || role === 'SUPERVISOR')) {
      // Leads where ANY linked product belongs to the user's SBU
      where.products = {
        some: {
          sbus: {
            some: { sbuId }
          }
        }
      };
    }

    const leads = await (prisma as any).lead.findMany({
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