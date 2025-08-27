import { withAuthAndRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils';

const getHandler = withErrorHandler(async () => {
  try {
    const deletedUsers = await prisma.user.findMany({
      where: {
        status: 'DELETED',
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return successResponse(deletedUsers);
  } catch (error) {
    console.error('Error fetching deleted users:', error);
    return errorResponse('Failed to fetch deleted users.', 500);
  }
});

export const GET = withAuthAndRole(['ADMIN'], getHandler);