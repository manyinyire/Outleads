import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateUserPermissions } from '@/lib/auth/auth-utils';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const hasAccess = await validateUserPermissions(req, ['ADMIN', 'SUPERVISOR']);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const leads = await prisma.lead.findMany({
      where: {
        campaignId: params.id,
      },
      include: {
        businessSector: true, // Include the full sector object
        products: true,       // Include all related product objects
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
