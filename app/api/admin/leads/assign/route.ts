import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils';
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
