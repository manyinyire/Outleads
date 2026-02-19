import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

// GET - Unassigned leads in this pool (paginated)
export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR'], async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  try {
    const pool = await prisma.leadPool.findUnique({ where: { id: params.id } });
    if (!pool) {
      return NextResponse.json({ error: 'Lead pool not found' }, { status: 404 });
    }

    const url = new URL((req as any).url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const showAll = url.searchParams.get('showAll') === 'true';
    const skip = (page - 1) * limit;

    const where: any = {
      leadPoolId: params.id,
      ...(showAll ? {} : { assignedToId: null }),
    };

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          businessSector: { select: { name: true } },
          products: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          firstLevelDisposition: { select: { name: true } },
          secondLevelDisposition: { select: { name: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      data: leads,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pool leads:', error);
    return NextResponse.json({ error: 'Failed to fetch pool leads' }, { status: 500 });
  }
});
