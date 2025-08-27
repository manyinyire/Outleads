import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api/api-utils';

const putHandler = withErrorHandler(async (req: AuthenticatedRequest, { params }: { params: { id: string } }) => {
  const { id } = params;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    return successResponse(updatedUser);
  } catch (error) {
    console.error('Error restoring user:', error);
    return errorResponse('Failed to restore user.', 500);
  }
});

export const PUT = withAuthAndRole(['ADMIN'], putHandler);
