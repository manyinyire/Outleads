import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api/api-utils';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED']),
});

const putHandler = withErrorHandler(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const { id } = params;
  const parseResult = updateStatusSchema.safeParse(await req.json());

  if (!parseResult.success) {
    return errorResponse('Invalid status provided.', 400);
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
    return errorResponse('Failed to update user status.', 500);
  }
});

export const PUT = withAuthAndRole(['ADMIN'], putHandler);
