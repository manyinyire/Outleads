import { NextResponse } from 'next/server';
import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';

const distributeSchema = z.object({
  leadIds: z.array(z.string().cuid('Invalid lead ID')).min(1, 'Select at least one lead'),
  agentId: z.string().cuid('Invalid agent ID'),
});

// POST - Assign selected leads to an agent
async function postHandler(req: AuthenticatedRequest, context?: any) {
  try {
    const poolId = context?.params?.id;
    const pool = await prisma.leadPool.findUnique({ where: { id: poolId } });
    if (!pool) {
      return NextResponse.json({ error: 'Lead pool not found' }, { status: 404 });
    }

    const body = await req.json();
    const validation = distributeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { leadIds, agentId } = validation.data;

    // Verify agent exists and is active
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, role: true, status: true },
    });

    if (!agent || agent.role !== 'AGENT' || agent.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Agent not found or not active' }, { status: 404 });
    }

    // Verify all leads belong to this pool and are currently unassigned
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        leadPoolId: poolId,
      },
      select: { id: true, assignedToId: true },
    });

    if (leads.length !== leadIds.length) {
      return NextResponse.json(
        { error: 'Some leads do not belong to this pool' },
        { status: 400 }
      );
    }

    const alreadyAssigned = leads.filter((l) => l.assignedToId !== null);
    if (alreadyAssigned.length > 0) {
      return NextResponse.json(
        {
          error: 'Some leads are already assigned',
          message: `${alreadyAssigned.length} lead(s) are already assigned to an agent. Please select only unassigned leads.`,
        },
        { status: 400 }
      );
    }

    // Assign all selected leads to the agent
    const updated = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        leadPoolId: poolId,
      },
      data: { assignedToId: agentId },
    });

    return NextResponse.json({
      message: `${updated.count} lead(s) assigned to ${agent.name} successfully`,
      count: updated.count,
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to distribute leads' }, { status: 500 });
  }
}

export const POST = withAuthAndRole(['ADMIN', 'SUPERVISOR'], postHandler);
