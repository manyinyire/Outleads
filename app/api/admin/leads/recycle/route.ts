import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api/api-utils';
import { z } from 'zod';

const recycleLeadsSchema = z.object({
  leadIds: z.array(z.string()).min(1, 'At least one lead is required'),
});

const postHandler = withErrorHandler(async (req: AuthenticatedRequest) => {
  const parseResult = recycleLeadsSchema.safeParse(await req.json());

  if (!parseResult.success) {
    return errorResponse('Invalid request body.', 400);
  }

  const { leadIds } = parseResult.data;

  try {
    // Recycle leads by clearing disposition and unassigning them
    const recycled = await prisma.lead.updateMany({
      where: {
        id: {
          in: leadIds,
        },
      },
      data: {
        firstLevelDispositionId: null,
        secondLevelDispositionId: null,
        thirdLevelDispositionId: null,
        dispositionNotes: null,
        assignedToId: null,
      },
    });
    
    return successResponse({ 
      message: `${recycled.count} lead(s) recycled successfully`,
      count: recycled.count
    });
  } catch (error) {
    console.error('Error recycling leads:', error);
    return errorResponse('Failed to recycle leads.', 500);
  }
});

export const POST = withAuthAndRole(['ADMIN', 'SUPERVISOR'], postHandler);
