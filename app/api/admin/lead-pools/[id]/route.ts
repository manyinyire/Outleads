import { NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';

async function getHandler(req: AuthenticatedRequest, context?: any) {
  try {
    const poolId = context?.params?.id;
    const pool = await prisma.leadPool.findUnique({
      where: { id: poolId },
      include: {
        campaign: { select: { id: true, campaign_name: true } },
        createdBy: { select: { id: true, name: true } },
        leads: {
          select: {
            id: true,
            assignedToId: true,
            lastCalledAt: true,
            firstLevelDisposition: { select: { name: true } },
            secondLevelDisposition: { select: { name: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!pool) {
      return NextResponse.json({ error: 'Lead pool not found' }, { status: 404 });
    }

    const total = pool.leads.length;
    const assigned = pool.leads.filter((l: any) => l.assignedToId !== null).length;
    const unassigned = total - assigned;
    const called = pool.leads.filter((l: any) => l.lastCalledAt !== null).length;
    const connected = pool.leads.filter((l: any) => l.firstLevelDisposition?.name === 'Contacted').length;
    const sales = pool.leads.filter((l: any) => l.secondLevelDisposition?.name === 'Sale').length;

    return NextResponse.json({
      data: {
        id: pool.id,
        name: pool.name,
        campaign: pool.campaign,
        createdBy: pool.createdBy,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
        stats: { total, assigned, unassigned, called, connected, sales },
      },
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lead pool' }, { status: 500 });
  }
}

export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR'], getHandler);
