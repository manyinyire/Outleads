import { NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const createPoolSchema = z.object({
  name: z.string().min(1, 'Pool name is required'),
  campaignId: z.string().cuid('Invalid campaign ID'),
});

async function getHandler(req: AuthenticatedRequest) {
  try {
    const pools = await prisma.leadPool.findMany({
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = pools.map((pool) => {
      const total = pool.leads.length;
      const assigned = pool.leads.filter((l: any) => l.assignedToId !== null).length;
      const unassigned = total - assigned;
      const called = pool.leads.filter((l: any) => l.lastCalledAt !== null).length;
      const connected = pool.leads.filter((l: any) => l.firstLevelDisposition?.name === 'Contacted').length;
      const sales = pool.leads.filter((l: any) => l.secondLevelDisposition?.name === 'Sale').length;

      return {
        id: pool.id,
        name: pool.name,
        campaign: pool.campaign,
        createdBy: pool.createdBy,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
        stats: { total, assigned, unassigned, called, connected, sales },
      };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lead pools' }, { status: 500 });
  }
}

async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const validation = createPoolSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, campaignId } = validation.data;

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const pool = await prisma.leadPool.create({
      data: {
        name,
        campaignId,
        createdById: req.user!.id,
      },
      include: {
        campaign: { select: { id: true, campaign_name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: pool }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lead pool' }, { status: 500 });
  }
}

export const GET = withAuthAndRole(['ADMIN', 'SUPERVISOR'], getHandler);
export const POST = withAuthAndRole(['ADMIN', 'SUPERVISOR'], postHandler);
