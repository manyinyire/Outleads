import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED']),
});

const putHandler = withErrorHandler(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const { id } = params;
  const parseResult = updateStatusSchema.safeParse(await req.json());

  if (!parseResult.success) {
    return errorResponse(400, 'Invalid status provided.');
  }

  const { status } = parseResult.data;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
    });
    return successResponse(updatedUser);
  } catch (error) {
    console.error('Error updating user status:', error);
    return errorResponse(500, 'Failed to update user status.');
  }
});

export const PUT = withAuthAndRole(['ADMIN'], putHandler);
