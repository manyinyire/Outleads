import { withAuthAndRole, AuthenticatedRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils';

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
    return errorResponse(500, 'Failed to restore user.');
  }
});

export const PUT = withAuthAndRole(['ADMIN'], putHandler);
