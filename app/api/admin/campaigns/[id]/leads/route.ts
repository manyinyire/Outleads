import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkUserRole } from '@/lib/auth-utils';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const hasAccess = await checkUserRole(['ADMIN', 'TEAMLEADER']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const leads = await prisma.lead.findMany({
      where: {
        campaignId: params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error(`Error fetching leads for campaign ${params.id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
