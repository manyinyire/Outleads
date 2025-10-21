import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api/api-utils';
import { z } from 'zod';

const assignLeadsSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead is required'),
  agentId: z.string().min(1, 'Agent is required'),
});

const postHandler = withErrorHandler(async (req: AuthenticatedRequest) => {
  const parseResult = assignLeadsSchema.safeParse(await req.json());

  if (!parseResult.success) {
    return errorResponse('Invalid request body.', 400);
  }

  const { leadIds, agentId } = parseResult.data;

  try {
    // Verify that the selected user has AGENT role
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, role: true, status: true }
    });

    if (!agent) {
      return errorResponse('Selected user not found.', 404);
    }

    if (agent.role !== 'AGENT') {
      return errorResponse('Leads can only be assigned to users with AGENT role.', 400);
    }

    if (agent.status !== 'ACTIVE') {
      return errorResponse('Cannot assign leads to inactive users.', 400);
    }

    // Assign leads to the agent
    await prisma.lead.updateMany({
      where: {
        id: {
          in: leadIds,
        },
      },
      data: {
        assignedToId: agentId,
      },
    });
    
    return successResponse({ message: 'Leads assigned successfully' });
  } catch (error) {
    console.error('Error assigning leads:', error);
    return errorResponse('Failed to assign leads.', 500);
  }
});

export const POST = withAuthAndRole(['ADMIN', 'SUPERVISOR'], postHandler);
